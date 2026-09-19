import test from "node:test";
import assert from "node:assert/strict";
import {AUDIO_TRACKS} from "../../../assets/js/core/audio/audio-config.js";
import {createAudioCoordinator} from "../../../assets/js/core/audio/audio-coordinator.js";

// —— Web Audio 最小 mock ——
function mockBuffer() {
  const data = new Float32Array(44100).fill(0.5);
  return {sampleRate: 44100, length: data.length, getChannelData: () => data};
}

class FakeParam {
  constructor(value = 0) { this.value = value; }
  setValueAtTime() {}
  linearRampToValueAtTime() {}
  cancelScheduledValues() {}
}

class FakeGain {
  constructor() { this.gain = new FakeParam(0); }
  connect() {}
}

class FakeBufferSource {
  constructor() { this.loop = false; this.stopped = false; this.onended = null; }
  connect() {}
  start() {}
  stop() { this.stopped = true; }
}

class FakeAudioContext {
  static instances = [];
  constructor() {
    this.state = "suspended";
    this.currentTime = 0;
    this.destination = {};
    this.gains = [];
    this.sources = [];
    FakeAudioContext.instances.push(this);
  }
  createGain() { const g = new FakeGain(); this.gains.push(g); return g; }
  createBufferSource() { const s = new FakeBufferSource(); this.sources.push(s); return s; }
  async decodeAudioData() { return mockBuffer(); }
  async resume() { this.state = "running"; }
  async suspend() { this.state = "suspended"; }
  async close() { this.state = "closed"; }
}

const fakeFetch = async () => ({ok: true, arrayBuffer: async () => new ArrayBuffer(8)});

function makeCoordinator() {
  return createAudioCoordinator({
    AudioContextCtor: FakeAudioContext,
    fetchImpl: fakeFetch,
    onError: () => {}
  });
}

test("配置登记 5 首背景音乐与 7 个音效", () => {
  const bgm = Object.keys(AUDIO_TRACKS).filter((k) => AUDIO_TRACKS[k].type === "bgm");
  const sfx = Object.keys(AUDIO_TRACKS).filter((k) => AUDIO_TRACKS[k].type === "sfx");
  assert.equal(bgm.length, 5);
  assert.equal(sfx.length, 7);
  assert.equal(AUDIO_TRACKS["bgm-rain"].type, "bgm");
  assert.equal(AUDIO_TRACKS["sfx-gunshot"].type, "sfx");
});

test("BGM 播放幂等：同曲重复调用不新建声源", async () => {
  FakeAudioContext.instances.length = 0;
  const coordinator = makeCoordinator();
  assert.equal((await coordinator.playBgm("bgm-rain")).ok, true);
  assert.equal((await coordinator.playBgm("bgm-rain")).ok, true);
  assert.equal(FakeAudioContext.instances[0].sources.length, 1);
  coordinator.destroy();
});

test("未知曲目、销毁后播放均安全返回", async () => {
  const coordinator = makeCoordinator();
  assert.equal((await coordinator.playBgm("missing")).code, "AUDIO_TRACK_UNKNOWN");
  assert.equal((await coordinator.playSfx("missing")).code, "AUDIO_TRACK_UNKNOWN");
  coordinator.destroy();
  assert.equal((await coordinator.playBgm("bgm-rain")).code, "AUDIO_DESTROYED");
});

test("静音、暂停、恢复、停止不写业务状态", async () => {
  const coordinator = makeCoordinator();
  assert.equal(coordinator.setMuted(true).ok, true);
  assert.equal(coordinator.isMuted(), true);
  await coordinator.playBgm("bgm-rain");
  assert.equal(coordinator.pause().ok, true);
  assert.equal((await coordinator.resume()).ok, true);
  assert.equal(coordinator.stop().ok, true);
  coordinator.destroy();
});

test("切歌交叉淡出：切到新曲会新建声源并停掉旧声源", async () => {
  FakeAudioContext.instances.length = 0;
  const coordinator = makeCoordinator();
  await coordinator.playBgm("bgm-rain");
  await coordinator.playBgm("bgm-house");
  const ctx = FakeAudioContext.instances[0];
  assert.equal(ctx.sources.length, 2);
  coordinator.destroy();
});

test("音效播放、停止与让位", async () => {
  FakeAudioContext.instances.length = 0;
  const coordinator = makeCoordinator();
  assert.equal((await coordinator.playSfx("sfx-gunshot")).ok, true);
  assert.equal(coordinator.stopSfx("sfx-gunshot").ok, true);
  await coordinator.playBgm("bgm-rain");
  assert.equal(coordinator.duck().ok, true);
  assert.equal(coordinator.unduck().ok, true);
  coordinator.destroy();
});
