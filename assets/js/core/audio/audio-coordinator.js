// 音频核心：Web Audio 实现。
// 负责背景音乐（无缝循环 + 交叉淡入淡出）、音效（一次性触发）、响度归一化、视频让位。
// 只依赖 audio-config.js，不触碰渲染/剧情/导航等其它模块。
import {AUDIO_TRACKS, VOLUME} from "./audio-config.js";

const RMS_TARGET = 0.1;  // 背景音乐归一化目标（RMS）
const PEAK_TARGET = 0.8; // 音效归一化目标（峰值）

function result(ok, code, extra = {}) {
  return Object.freeze({ok, code, ...extra});
}

function clamp(value, lo, hi) {
  return Math.min(hi, Math.max(lo, value));
}

export function createAudioCoordinator({
  AudioContextCtor = globalThis.AudioContext || globalThis.webkitAudioContext,
  fetchImpl = globalThis.fetch,
  onError = () => {},
  volume = VOLUME
} = {}) {
  let ctx = null;
  let master = null;
  let bgmBus = null;
  let sfxBus = null;
  let muted = false;
  let destroyed = false;

  const buffers = new Map();   // trackId -> AudioBuffer
  const loading = new Map();   // trackId -> 加载中的 Promise（并发去重，避免重复解码）
  const trims = new Map();     // trackId -> 归一化增益
  let currentBgm = null;       // {trackId, source, gain}
  const activeSfx = new Map(); // sfxId -> {source, gain}
  const pendingTimers = new Set();

  function reportError(error, trackId) {
    try {
      onError(error, trackId);
    } catch (callbackError) {
      console.error("[white-lamp:audio] error callback failed", callbackError);
    }
  }

  function ensureContext() {
    if (destroyed) return result(false, "AUDIO_DESTROYED");
    if (ctx) return result(true, "AUDIO_READY", {ctx});
    if (typeof AudioContextCtor !== "function") return result(false, "AUDIO_UNAVAILABLE");
    try {
      ctx = new AudioContextCtor();
      master = ctx.createGain();
      master.gain.value = volume.master;
      bgmBus = ctx.createGain();
      bgmBus.gain.value = volume.bgm;
      sfxBus = ctx.createGain();
      sfxBus.gain.value = volume.sfx;
      bgmBus.connect(master);
      sfxBus.connect(master);
      master.connect(ctx.destination);
      return result(true, "AUDIO_READY", {ctx});
    } catch (error) {
      reportError(error, null);
      return result(false, "AUDIO_CREATE_FAILED");
    }
  }

  // 尽力恢复：若此刻正处于用户手势内则立即出声，否则保持静音等待手势。
  function tryResume() {
    if (ctx && ctx.state === "suspended") {
      ctx.resume().catch(() => {});
    }
  }

  async function loadBuffer(trackId) {
    const track = AUDIO_TRACKS[trackId];
    if (!track) return null;
    if (buffers.has(trackId)) return buffers.get(trackId);
    if (loading.has(trackId)) return loading.get(trackId); // 并发调用共用同一份加载
    const promise = (async () => {
      try {
        const response = await fetchImpl(track.src);
        if (!response.ok) throw new Error(`HTTP ${response.status}: ${track.src}`);
        const arrayBuffer = await response.arrayBuffer();
        const buffer = await ctx.decodeAudioData(arrayBuffer);
        buffers.set(trackId, buffer);
        return buffer;
      } catch (error) {
        reportError(error, trackId);
        return null;
      } finally {
        loading.delete(trackId);
      }
    })();
    loading.set(trackId, promise);
    return promise;
  }

  function computeRms(buffer) {
    const data = buffer.getChannelData(0);
    // 采样估算（每 16 个样本取 1）：长曲目动辄上千万样本，全量循环会卡住主线程；采样误差可忽略。
    const stride = 16;
    let sum = 0;
    let count = 0;
    for (let i = 0; i < data.length; i += stride) {
      sum += data[i] * data[i];
      count++;
    }
    return Math.sqrt(sum / (count || 1));
  }

  function computePeak(buffer) {
    const data = buffer.getChannelData(0);
    let peak = 0;
    for (let i = 0; i < data.length; i++) peak = Math.max(peak, Math.abs(data[i]));
    return peak;
  }

  // 归一化：背景音乐按 RMS、音效按峰值，抹平「下载时音量不统一」的差异。
  function normalizeGain(track, buffer) {
    if (trims.has(track.id)) return trims.get(track.id);
    let trim;
    if (track.type === "sfx") {
      trim = clamp(PEAK_TARGET / (computePeak(buffer) || 1e-6), 0.2, 6);
    } else {
      trim = clamp(RMS_TARGET / (computeRms(buffer) || 1e-6), 0.2, 4);
    }
    trims.set(track.id, trim);
    return trim;
  }

  // 循环区间：跳过开头/结尾的近静音（最多各 2 秒），让带前奏/尾奏的素材也能干净循环。
  function findLoopBounds(buffer) {
    const data = buffer.getChannelData(0);
    const sampleRate = buffer.sampleRate;
    const threshold = 0.005;
    const maxTrim = Math.floor(sampleRate * 2);
    let start = 0;
    let end = data.length;
    while (start < end && start < maxTrim && Math.abs(data[start]) < threshold) start++;
    while (end > start && (data.length - end) < maxTrim && Math.abs(data[end - 1]) < threshold) end--;
    if (end <= start) {
      start = 0;
      end = data.length;
    }
    return {loopStart: start / sampleRate, loopEnd: end / sampleRate};
  }

  // 增益过渡：linear 为直线；equalPower 用 sin/cos 曲线，交叉淡化中段无音量凹陷。
  function rampParam(param, from, to, seconds, curve) {
    const now = ctx.currentTime;
    param.cancelScheduledValues(now);
    param.setValueAtTime(from, now);
    if (seconds <= 0 || curve !== "equalPower") {
      param.linearRampToValueAtTime(to, now + seconds);
      return;
    }
    const segments = 12;
    for (let i = 1; i <= segments; i++) {
      const t = i / segments;
      const value = to > from
        ? from + (to - from) * Math.sin((t * Math.PI) / 2)
        : to + (from - to) * Math.cos((t * Math.PI) / 2);
      param.linearRampToValueAtTime(value, now + t * seconds);
    }
  }

  async function playBgm(trackId, {fadeMs = volume.bgmFadeMs} = {}) {
    const track = AUDIO_TRACKS[trackId];
    if (!track || track.type !== "bgm") return result(false, "AUDIO_TRACK_UNKNOWN");
    const ensured = ensureContext();
    if (!ensured.ok) return ensured;
    tryResume();
    if (currentBgm?.trackId === trackId) return result(true, "AUDIO_PLAYING", {trackId});

    const buffer = await loadBuffer(trackId);
    if (!buffer) return result(false, "AUDIO_DECODE_FAILED", {trackId});

    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;
    const bounds = findLoopBounds(buffer);
    source.loopStart = bounds.loopStart;
    source.loopEnd = bounds.loopEnd;

    const gain = ctx.createGain();
    const target = normalizeGain(track, buffer) * (track.gain ?? 1);
    gain.gain.value = 0;
    source.connect(gain);
    gain.connect(bgmBus);
    source.start(0, bounds.loopStart);

    const previous = currentBgm;
    // 首播用短淡入（快速出声），切歌用等功率交叉淡化（无音量凹陷、更顺滑）。
    const fadeInMs = previous ? fadeMs : Math.min(fadeMs, 800);
    const fadeSec = Math.max(0.01, fadeMs) / 1000;
    const fadeInSec = Math.max(0.01, fadeInMs) / 1000;
    rampParam(gain.gain, 0, target, fadeInSec, previous ? "equalPower" : "linear");

    currentBgm = {trackId, source, gain, target};
    if (previous) {
      rampParam(previous.gain.gain, previous.target, 0, fadeSec, "equalPower");
      const oldSource = previous.source;
      const timer = setTimeout(() => {
        pendingTimers.delete(timer);
        try { oldSource.stop(); } catch { /* 已停止 */ }
      }, fadeMs + 60);
      pendingTimers.add(timer);
    }
    return result(true, "AUDIO_PLAYING", {trackId});
  }

  async function playSfx(sfxId, {
    loop = false,
    gain: gainOverride = 1,
    durationMs = 0,
    fadeInMs = 0,
    fadeOutMs = 800
  } = {}) {
    const track = AUDIO_TRACKS[sfxId];
    if (!track || track.type !== "sfx") return result(false, "AUDIO_TRACK_UNKNOWN");
    const ensured = ensureContext();
    if (!ensured.ok) return ensured;
    tryResume();

    const buffer = await loadBuffer(sfxId);
    if (!buffer) return result(false, "AUDIO_DECODE_FAILED", {sfxId});

    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = loop;
    const gain = ctx.createGain();
    const target = (gainOverride ?? 1) * normalizeGain(track, buffer) * (track.gain ?? 1);
    source.connect(gain);
    gain.connect(sfxBus);

    const now = ctx.currentTime;
    if (fadeInMs > 0) {
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(target, now + fadeInMs / 1000);
    } else {
      gain.gain.value = target;
    }

    if (durationMs > 0) {
      const end = now + durationMs / 1000;
      const fadeStart = end - Math.max(0, fadeOutMs) / 1000;
      gain.gain.setValueAtTime(target, Math.max(now + fadeInMs / 1000, fadeStart));
      gain.gain.linearRampToValueAtTime(0, end);
      source.start(0);
      source.stop(end + 0.05);
      source.onended = () => { activeSfx.delete(sfxId); };
    } else {
      source.start(0);
      if (!loop) {
        source.onended = () => { activeSfx.delete(sfxId); };
      }
    }

    // 同名 SFX 再次触发时先停掉旧的，避免叠加。
    const previous = activeSfx.get(sfxId);
    if (previous) {
      try { previous.source.stop(); } catch { /* 已停止 */ }
    }
    activeSfx.set(sfxId, {source, gain});
    return result(true, "AUDIO_PLAYING", {sfxId});
  }

  function stopSfx(sfxId, {fadeMs = 0} = {}) {
    const handle = activeSfx.get(sfxId);
    if (!handle) return result(false, "AUDIO_NOT_PLAYING");
    activeSfx.delete(sfxId);
    if (fadeMs > 0) {
      const now = ctx.currentTime;
      handle.gain.gain.cancelScheduledValues(now);
      handle.gain.gain.setValueAtTime(handle.gain.gain.value, now);
      handle.gain.gain.linearRampToValueAtTime(0, now + fadeMs / 1000);
      const source = handle.source;
      const timer = setTimeout(() => {
        pendingTimers.delete(timer);
        try { source.stop(); } catch { /* 已停止 */ }
      }, fadeMs + 60);
      pendingTimers.add(timer);
    } else {
      try { handle.source.stop(); } catch { /* 已停止 */ }
    }
    return result(true, "AUDIO_STOPPED");
  }

  // 视频让位：把背景音乐压到正常音量的 duckLevel，结束后淡回。
  function duck({level = volume.duckLevel, fadeMs = volume.duckFadeMs} = {}) {
    if (destroyed || !ctx || !bgmBus) return result(false, "AUDIO_NOT_STARTED");
    const now = ctx.currentTime;
    const target = volume.bgm * clamp(level, 0, 1);
    bgmBus.gain.cancelScheduledValues(now);
    bgmBus.gain.setValueAtTime(bgmBus.gain.value, now);
    bgmBus.gain.linearRampToValueAtTime(target, now + fadeMs / 1000);
    return result(true, "AUDIO_DUCKED");
  }

  function unduck({fadeMs = volume.duckFadeMs} = {}) {
    if (destroyed || !ctx || !bgmBus) return result(false, "AUDIO_NOT_STARTED");
    const now = ctx.currentTime;
    bgmBus.gain.cancelScheduledValues(now);
    bgmBus.gain.setValueAtTime(bgmBus.gain.value, now);
    bgmBus.gain.linearRampToValueAtTime(volume.bgm, now + fadeMs / 1000);
    return result(true, "AUDIO_UNDUCKED");
  }

  async function resume() {
    const ensured = ensureContext();
    if (!ensured.ok) return ensured;
    if (ctx.state === "suspended") {
      try {
        await ctx.resume();
      } catch (error) {
        reportError(error, null);
      }
    }
    return result(true, "AUDIO_READY", {running: ctx.state === "running"});
  }

  function pause() {
    if (destroyed) return result(false, "AUDIO_DESTROYED");
    if (ctx) ctx.suspend().catch(() => {});
    return result(true, "AUDIO_PAUSED");
  }

  function stop() {
    if (destroyed) return result(false, "AUDIO_DESTROYED");
    if (currentBgm?.source) {
      try { currentBgm.source.stop(); } catch { /* 已停止 */ }
    }
    currentBgm = null;
    return result(true, "AUDIO_STOPPED");
  }

  function setMuted(nextMuted) {
    if (typeof nextMuted !== "boolean") return result(false, "AUDIO_MUTED_INVALID");
    muted = nextMuted;
    if (ctx && master) {
      const now = ctx.currentTime;
      master.gain.cancelScheduledValues(now);
      master.gain.setValueAtTime(master.gain.value, now);
      master.gain.linearRampToValueAtTime(nextMuted ? 0 : volume.master, now + 0.1);
    }
    return result(true, "AUDIO_MUTED_UPDATED", {muted});
  }

  function isMuted() {
    return muted;
  }

  function isRunning() {
    return Boolean(ctx && ctx.state === "running");
  }

  function isPlaying() {
    return Boolean(currentBgm);
  }

  function destroy() {
    if (destroyed) return result(true, "AUDIO_DESTROYED");
    try {
      if (currentBgm?.source) {
        try { currentBgm.source.stop(); } catch { /* 已停止 */ }
      }
      activeSfx.forEach((handle) => {
        try { handle.source.stop(); } catch { /* 已停止 */ }
      });
      activeSfx.clear();
      if (ctx) ctx.close().catch(() => {});
    } catch (error) {
      reportError(error, null);
    }
    pendingTimers.forEach((timer) => clearTimeout(timer));
    pendingTimers.clear();
    ctx = null;
    master = null;
    bgmBus = null;
    sfxBus = null;
    buffers.clear();
    trims.clear();
    currentBgm = null;
    destroyed = true;
    return result(true, "AUDIO_DESTROYED");
  }

  return Object.freeze({
    playBgm, playSfx, stopSfx, duck, unduck, resume, pause, stop,
    setMuted, isMuted, isRunning, isPlaying, destroy
  });
}
