import assert from "node:assert/strict";
import test from "node:test";
import {
  VIDEO_CUE_MAP,
  createVideoPlayer,
  resolveVideoSource,
  videoCueForReading
} from "../../assets/js/core/video-player.js";

class FakeElement {
  constructor(tagName) {
    this.tagName = tagName;
    this.children = [];
    this.listeners = new Map();
    this.attributes = new Map();
    this.inert = false;
  }

  append(child) {
    this.children.push(child);
  }

  addEventListener(type, listener) {
    this.listeners.set(type, listener);
  }

  dispatch(type) {
    this.listeners.get(type)?.();
  }

  setAttribute(name, value) {
    this.attributes.set(name, String(value));
  }

  removeAttribute(name) {
    this.attributes.delete(name);
  }

  querySelector(selector) {
    return selector === "video" ? this.children.find((child) => child.tagName === "video") : null;
  }

  remove() {
    this.removed = true;
  }

  pause() {}
  load() {}
  play() { return Promise.resolve(); }
  focus() {}
}

function fakeDocument() {
  const body = new FakeElement("body");
  const shell = new FakeElement("main");
  shell.className = "game-shell";
  return {
    body,
    createElement(tagName) {
      return new FakeElement(tagName);
    },
    querySelector(selector) {
      return selector === ".game-shell" ? shell : null;
    }
  };
}

test("视频资源映射覆盖白灯、停电和五个结局", () => {
  assert.deepEqual(
    Object.fromEntries(Object.entries(VIDEO_CUE_MAP).map(([key, cue]) => [key, cue.filename])),
    {
      whiteLampFirstSeen: "light_up.mp4",
      shrinePowerCut: "cut-off.mp4",
      "ending-accomplice": "the_ending.mp4",
      "ending-defeated": "close_well.mp4",
      "ending-erasure": "unnamed.mp4",
      "ending-curated-truth": "after_whitelamp.mp4",
      "ending-full-account": "no_more_lamp.mp4"
    }
  );
});

test("白灯和停电 cue 只匹配指定剧情锚点", () => {
  assert.equal(
    videoCueForReading({
      input: {
        mode: "story",
        metadata: {presentationId: "present-prologue-white-lamp-first-white-lamp"}
      },
      item: {id: "lamp-outside-shrine"},
      segment: {text: "祠堂外的雨幕里，突然亮起了一盏灯"}
    }),
    VIDEO_CUE_MAP.whiteLampFirstSeen
  );
  assert.equal(
    videoCueForReading({
      input: {
        mode: "conversation",
        metadata: {conversationId: "prologue-lamp-incident", actionId: "lamp-incident"}
      },
      item: {id: "lamp-incident-legacy"},
      segment: {text: "祠堂内忽然断电。眼前除了那盏灯，一片漆黑"}
    }),
    VIDEO_CUE_MAP.shrinePowerCut
  );
  assert.equal(
    videoCueForReading({
      input: {
        mode: "conversation",
        metadata: {conversationId: "other-conversation", actionId: "lamp-incident"}
      },
      item: {id: "other"},
      segment: {text: "祠堂内忽然断电。"}
    }),
    null
  );
});

test("五个结局标题各自匹配唯一视频", () => {
  for (const endingId of [
    "ending-accomplice",
    "ending-defeated",
    "ending-erasure",
    "ending-curated-truth",
    "ending-full-account"
  ]) {
    const cue = videoCueForReading({
      input: {
        mode: "story",
        metadata: {presentationId: `present-${endingId}-ending-summary`}
      },
      item: {id: "ending-title"},
      segment: {text: "结局标题"}
    });
    assert.equal(cue, VIDEO_CUE_MAP[endingId]);
  }
});

test("视频路径指向 assets/videos", () => {
  assert.match(resolveVideoSource("light_up.mp4"), /assets[\\/]videos[\\/]light_up\.mp4$/);
});

test("视频加载失败时清理覆盖层并且同一 cue 不重复播放", async () => {
  const documentTarget = fakeDocument();
  const readingSurface = new FakeElement("section");
  const player = createVideoPlayer({documentTarget, mountTarget: readingSurface});
  const pending = player.playCue(VIDEO_CUE_MAP.whiteLampFirstSeen);
  const overlay = readingSurface.children[0];
  const video = overlay.querySelector("video");
  assert.equal(documentTarget.body.attributes.get("data-video-playing"), "true");
  video.dispatch("error");
  await pending;
  assert.equal(overlay.removed, true);
  assert.equal(documentTarget.body.attributes.has("data-video-playing"), false);
  assert.equal(await player.playCue(VIDEO_CUE_MAP.whiteLampFirstSeen), false);
});
