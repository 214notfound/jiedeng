import {AUDIO_TRACKS} from "./audio-config.js";

const DEFAULT_VOLUME = 0.45;

function result(ok, code, extra = {}) {
  return Object.freeze({ok, code, ...extra});
}

export function createAudioCoordinator({
  AudioCtor = globalThis.Audio,
  onError = () => {},
  volume = DEFAULT_VOLUME
} = {}) {
  let audio = null;
  let activeTrackId = null;
  let muted = false;
  let destroyed = false;

  function reportError(error, trackId) {
    try {
      onError(error, trackId);
    } catch (callbackError) {
      console.error("[white-lamp:audio] error callback failed", callbackError);
    }
  }

  function ensureAudio() {
    if (destroyed) return result(false, "AUDIO_DESTROYED");
    if (audio) return result(true, "AUDIO_READY", {audio});
    if (typeof AudioCtor !== "function") return result(false, "AUDIO_UNAVAILABLE");
    try {
      audio = new AudioCtor();
      audio.preload = "auto";
      audio.loop = true;
      audio.volume = Math.min(1, Math.max(0, Number(volume) || DEFAULT_VOLUME));
      audio.muted = muted;
      audio.addEventListener?.("error", () => {
        reportError(audio.error, activeTrackId);
      });
      return result(true, "AUDIO_READY", {audio});
    } catch (error) {
      reportError(error, null);
      return result(false, "AUDIO_CREATE_FAILED");
    }
  }

  async function playBgm(trackId = "bgm-main") {
    const track = AUDIO_TRACKS[trackId];
    if (!track || track.type !== "bgm") return result(false, "AUDIO_TRACK_UNKNOWN");
    const ensured = ensureAudio();
    if (!ensured.ok) return ensured;
    if (activeTrackId !== trackId || audio.src !== track.src) {
      audio.src = track.src;
      activeTrackId = trackId;
      audio.currentTime = 0;
    }
    try {
      await audio.play();
      return result(true, "AUDIO_PLAYING", {trackId});
    } catch (error) {
      reportError(error, trackId);
      return result(false, "AUDIO_PLAY_BLOCKED", {trackId});
    }
  }

  function pause() {
    if (destroyed) return result(false, "AUDIO_DESTROYED");
    audio?.pause();
    return result(true, "AUDIO_PAUSED");
  }

  async function resume() {
    if (!activeTrackId) return result(false, "AUDIO_NOT_STARTED");
    return playBgm(activeTrackId);
  }

  function stop() {
    if (destroyed) return result(false, "AUDIO_DESTROYED");
    audio?.pause();
    if (audio) audio.currentTime = 0;
    activeTrackId = null;
    return result(true, "AUDIO_STOPPED");
  }

  function setMuted(nextMuted) {
    if (typeof nextMuted !== "boolean") return result(false, "AUDIO_MUTED_INVALID");
    muted = nextMuted;
    if (audio) audio.muted = muted;
    return result(true, "AUDIO_MUTED_UPDATED", {muted});
  }

  function isMuted() {
    return muted;
  }

  function destroy() {
    if (destroyed) return result(true, "AUDIO_DESTROYED");
    audio?.pause();
    audio?.removeAttribute?.("src");
    audio?.load?.();
    audio = null;
    activeTrackId = null;
    destroyed = true;
    return result(true, "AUDIO_DESTROYED");
  }

  return Object.freeze({playBgm, pause, resume, stop, setMuted, isMuted, destroy});
}
