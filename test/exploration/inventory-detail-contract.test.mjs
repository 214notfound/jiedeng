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
  assert.match(detail.image, /old-photograph\.svg$/);
  assert.match(detail.detailImage, /old-photograph\.png$/);
  assert.throws(() => getObtainedItem(module, "key-a"), /尚未获得/);
  assert.throws(() => getObtainedItem(module, ""), /缺少/);
  assert.deepEqual(state, before);
  module.dispose();
});

test("已调查的苏禾启事可打开特写但不会伪装成背包物品", () => {
  const state = {
    facts: ["su-he-missing-notice-observed"],
    inventory: [],
    clues: [],
    storyCheckpoint: {
      nodeId: "village-inquiries",
      nodeRevision: 1,
      completedMilestoneIds: [],
      completedNodeIds: [],
      completedStageIds: [],
      pendingCommands: []
    }
  };
  const context = {storageScope: "guest", state, commands: []};
  const module = createInteractionModule({
    getContext: () => context,
    subscribe: () => () => {},
    dispatchExternalEvent: () => ({ok: true})
  });

  const detail = module.getItemDetail("su-he-notice");
  assert.equal(detail?.obtained, false);
  assert.match(detail?.detailImage ?? "", /su-he-notice\.png$/);
  assert.equal(module.listItems().some((item) => item.id === "su-he-notice"), false);
  module.dispose();
});
