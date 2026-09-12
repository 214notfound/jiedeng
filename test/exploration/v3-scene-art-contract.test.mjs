import test from "node:test";
import assert from "node:assert/strict";
import {existsSync, readFileSync} from "node:fs";
import {fileURLToPath} from "node:url";
import {
  V3_SCENE_ART,
  v3SceneArtFor
} from "../../assets/js/exploration/data/v3-scene-assets.js";

function jpegDimensions(path) {
  const data = readFileSync(path);
  assert.equal(data[0], 0xff, `${path} 不是 JPEG`);
  assert.equal(data[1], 0xd8, `${path} 不是 JPEG`);
  let offset = 2;
  while (offset < data.length) {
    if (data[offset] !== 0xff) {
      offset += 1;
      continue;
    }
    const marker = data[offset + 1];
    if (marker === 0xd8 || marker === 0xd9) {
      offset += 2;
      continue;
    }
    const size = data.readUInt16BE(offset + 2);
    if ([0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf].includes(marker)) {
      return {height: data.readUInt16BE(offset + 5), width: data.readUInt16BE(offset + 7)};
    }
    offset += 2 + size;
  }
  throw new Error(`${path} 缺少 JPEG 尺寸段`);
}

test("V3 正式场景资源完整、唯一且全部为 1280×720", () => {
  assert.equal(V3_SCENE_ART.length, 26);
  assert.equal(new Set(V3_SCENE_ART.map((entry) => entry.assetId)).size, 26);
  assert.equal(new Set(V3_SCENE_ART.map((entry) => entry.filename)).size, 26);

  for (const entry of V3_SCENE_ART) {
    const art = v3SceneArtFor(entry.assetId);
    const path = fileURLToPath(art.image);
    assert.equal(existsSync(path), true, entry.filename);
    assert.deepEqual(jpegDimensions(path), {width: 1280, height: 720}, entry.filename);
  }
  assert.equal(v3SceneArtFor("unknown"), null);
});

test("V3 第一条外围调查链的场景和目标映射已冻结", () => {
  const hub = v3SceneArtFor("outer-investigation-hub");
  assert.deepEqual(
    {sceneId: hub.sceneId, variantId: hub.variantId},
    {sceneId: "village", variantId: "outer-investigation-hub"}
  );
  assert.deepEqual(hub.targetIds, [
    "investigate-gorge-and-grave",
    "investigate-project-records",
    "investigate-su-trail",
    "investigate-white-lamp-mail"
  ]);

  const mountain = v3SceneArtFor("mountain-routes");
  assert.equal(mountain.sceneId, "mountain-routes");
  assert.deepEqual(mountain.targetIds, ["investigate-gorge-and-grave"]);
});

test("五个 V3 结局各自使用独立图片", () => {
  const endings = V3_SCENE_ART.filter((entry) => entry.endingId);
  assert.deepEqual(endings.map((entry) => entry.endingId), [
    "ending-accomplice",
    "ending-defeated",
    "ending-erasure",
    "ending-curated-truth",
    "ending-full-account"
  ]);
  assert.equal(new Set(endings.map((entry) => entry.filename)).size, 5);
});
