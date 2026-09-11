import test from "node:test";
import assert from "node:assert/strict";
import {watchArtworkResource} from "../../assets/js/minigames/map-puzzle/view/puzzle-view.js";

class FakeImage {
  static latest;

  constructor() {
    FakeImage.latest = this;
  }

  set src(value) {
    this.url = value;
  }
}

test("data URL 无需网络即可进入地图视图", () => {
  let loaded = 0;
  let failed = 0;
  watchArtworkResource("data:image/png;base64,AA==", {
    ImageConstructor: FakeImage,
    onLoad: () => loaded += 1,
    onError: () => failed += 1
  });
  assert.equal(loaded, 1);
  assert.equal(failed, 0);
});

test("地图图片失败只报告失败，不伪造加载成功", () => {
  let loaded = 0;
  let failed = 0;
  watchArtworkResource("/missing-map.png", {
    ImageConstructor: FakeImage,
    onLoad: () => loaded += 1,
    onError: () => failed += 1
  });
  FakeImage.latest.onerror();
  FakeImage.latest.onload();
  assert.equal(loaded, 0);
  assert.equal(failed, 1);
});

test("卸载地图后忽略迟到的图片结果", () => {
  let changed = 0;
  const stop = watchArtworkResource("/slow-map.png", {
    ImageConstructor: FakeImage,
    onLoad: () => changed += 1,
    onError: () => changed += 1
  });
  stop();
  FakeImage.latest.onerror?.();
  FakeImage.latest.onload?.();
  assert.equal(changed, 0);
});
