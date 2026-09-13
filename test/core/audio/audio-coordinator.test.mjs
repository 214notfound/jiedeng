import test from "node:test";
import assert from "node:assert/strict";
import {AUDIO_TRACKS} from "../../../assets/js/core/audio/audio-config.js";
import {createAudioCoordinator} from "../../../assets/js/core/audio/audio-coordinator.js";

class FakeAudio {
  static instances = [];
  constructor() {
    this.src = "";
    this.currentTime = 0;
    this.playCalls = 0;
    this.pauseCalls = 0;
    this.muted = false;
    this.listeners = new Map();
    FakeAudio.instances.push(this);
  }
  addEventListener(type, listener) { this.listeners.set(type, listener); }
  removeAttribute(name) { if (name === "src") this.src = ""; }
  load() {}
  play() { this.playCalls += 1; return Promise.resolve(); }
  pause() { this.pauseCalls += 1; }
}

test("配置只登记阶段一主 BGM", () => {
  assert.deepEqual(Object.keys(AUDIO_TRACKS), ["bgm-main"]);
  assert.equal(AUDIO_TRACKS["bgm-main"].type, "bgm");
});

test("BGM 播放幂等且不重复创建 Audio 实例", async () => {
  FakeAudio.instances.length = 0;
  const coordinator = createAudioCoordinator({AudioCtor: FakeAudio});
  assert.equal((await coordinator.playBgm("bgm-main")).ok, true);
  assert.equal((await coordinator.playBgm("bgm-main")).ok, true);
  assert.equal(FakeAudio.instances.length, 1);
  assert.equal(FakeAudio.instances[0].playCalls, 2);
  coordinator.destroy();
});

test("未知资源、自动播放失败和销毁状态均安全返回", async () => {
  const unknown = createAudioCoordinator({AudioCtor: FakeAudio});
  assert.equal((await unknown.playBgm("missing")).code, "AUDIO_TRACK_UNKNOWN");
  unknown.destroy();
  assert.equal((await unknown.playBgm("bgm-main")).code, "AUDIO_DESTROYED");

  class BlockedAudio extends FakeAudio {
    play() { return Promise.reject(new Error("blocked")); }
  }
  const errors = [];
  const blocked = createAudioCoordinator({AudioCtor: BlockedAudio, onError: (...args) => errors.push(args)});
  const result = await blocked.playBgm("bgm-main");
  assert.equal(result.code, "AUDIO_PLAY_BLOCKED");
  assert.equal(errors.length, 1);
  blocked.destroy();
});

test("静音、暂停、恢复和停止不写入业务状态", async () => {
  const coordinator = createAudioCoordinator({AudioCtor: FakeAudio});
  assert.equal(coordinator.setMuted(true).ok, true);
  assert.equal(coordinator.isMuted(), true);
  await coordinator.playBgm("bgm-main");
  assert.equal(coordinator.pause().ok, true);
  assert.equal((await coordinator.resume()).ok, true);
  assert.equal(coordinator.stop().ok, true);
  coordinator.destroy();
});

test("跨页面销毁与重建时恢复 BGM 播放位置", async () => {
  const values = new Map();
  const storage = {
    getItem(key) { return values.get(key) ?? null; },
    setItem(key, value) { values.set(key, value); }
  };
  const first = createAudioCoordinator({AudioCtor: FakeAudio, storage});
  await first.playBgm("bgm-main");
  FakeAudio.instances.at(-1).currentTime = 37.5;
  first.destroy();
  const second = createAudioCoordinator({AudioCtor: FakeAudio, storage});
  await second.playBgm("bgm-main");
  assert.equal(FakeAudio.instances.at(-1).currentTime, 37.5);
  second.destroy();
});
