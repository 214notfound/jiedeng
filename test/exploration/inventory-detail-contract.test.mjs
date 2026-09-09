import test from "node:test";
import assert from "node:assert/strict";
import {createInteractionModule} from "../../assets/js/exploration/integration/game/interaction-module.js";
import {getObtainedItem} from "../../assets/js/exploration/game/inventory-view.js";
import {initialState} from "./fixtures/demo-host.js";

test("详情只读取宿主已经提交的物品或线索且不修改状态", () => {
  const state = initialState();
  state.clues.push("old-photograph");
  const context = {storageScope: "guest", state, commands: []};
  const host = {
    getContext: () => context,
    subscribe: () => () => {},
    dispatchExternalEvent: () => ({ok: true})
  };
  const module = createInteractionModule(host);
  const before = structuredClone(state);

  const detail = getObtainedItem(module, "old-photograph");
  assert.equal(detail.name, "家庭照片");
  assert.equal(detail.layer, "clues");
  assert.throws(() => getObtainedItem(module, "key-a"), /尚未获得/);
  assert.throws(() => getObtainedItem(module, ""), /缺少/);
  assert.deepEqual(state, before);
  module.dispose();
});
