import test from "node:test";
import assert from "node:assert/strict";
import {
  V3_LAYERED_SCENES,
  projectV3LayeredScene
} from "../../assets/js/exploration/data/v3-layered-scenes.js";

test("诊所放大层与父亲旧屋暗层只导航，不改变业务动作", () => {
  assert.deepEqual(V3_LAYERED_SCENES.map((entry) => entry.sceneId), [
    "old-clinic-detail",
    "father-house-hidden-layer"
  ]);

  for (const entry of V3_LAYERED_SCENES) {
    const action = {id: entry.actionId, interactionType: "item", available: true};
    const view = {sceneId: entry.baseSceneId, interactions: [action]};
    const layout = {hotspots: [{
      id: entry.actionId,
      marker: "调查",
      x: entry.x,
      y: entry.y,
      interactionIds: [entry.actionId]
    }]};
    const before = structuredClone(view);
    const base = projectV3LayeredScene(view, layout, null);
    assert.equal(base.view.interactions[0].interactionType, "scene");
    assert.equal(base.view.interactions[0].targetSceneId, entry.sceneId);
    assert.equal(base.layout.hotspots[0].x, entry.x);
    assert.equal(base.layout.hotspots[0].y, entry.y);
    assert.deepEqual(view, before);

    const selected = projectV3LayeredScene(view, layout, entry.sceneId);
    assert.equal(selected.view.interactions[0].interactionType, "item");
    assert.match(selected.view.sceneImage, new RegExp(`${entry.assetId}\\.jpg$`));
    assert.equal(selected.selected.returnLabel, entry.returnLabel);
    assert.equal(selected.layout.hotspots[0].x, entry.detailX);
    assert.equal(selected.layout.hotspots[0].y, entry.detailY);
  }
});
