import test from "node:test";
import assert from "node:assert/strict";
import {projectVillageScene, VILLAGE_SUBSCENES} from "../../assets/js/exploration/data/village-subscenes.js";

test("子场景只投影已授权动作且不修改业务数据，过期选择回主场景", () => {
  for (const entry of VILLAGE_SUBSCENES) {
    const view = {sceneId: "village", interactions: [{id: entry.actionId, interactionType: "conversation", available: true}]};
    const layout = {hotspots: []};
    const before = structuredClone(view);
    assert.equal(projectVillageScene(view, layout, null).view.interactions[0].interactionType, "scene");
    const selected = projectVillageScene(view, layout, entry.sceneId);
    assert.equal(selected.view.interactions[0].interactionType, "conversation");
    assert.equal(selected.layout.hotspots.length, 1);
    assert.deepEqual(view, before);
    assert.equal(projectVillageScene({...view, interactions: []}, layout, entry.sceneId).selected, null);
    assert.equal(projectVillageScene({...view, sceneId: "shrine"}, layout, entry.sceneId).selected, null);
  }
});
