// 验证旧进度字段始终由剧情检查点生成，防止状态和交接文档出现两套进度。
import test from "node:test";
import assert from "node:assert/strict";

import {
  commitStoryTransaction,
  createInitialGameState,
  createStoryCompatibilityProjection
} from "../../assets/js/core/state.js";
import {
  getSaveKey,
  loadGame,
  validateGameState
} from "../../assets/js/core/storage.js";

function checkpoint(nodeId, completedStageIds = []) {
  return {
    nodeId,
    nodeRevision: 1,
    completedMilestoneIds: [],
    completedNodeIds: [],
    completedStageIds,
    pendingCommands: []
  };
}

test("兼容阶段字段随剧情检查点同步", () => {
  const initial = createInitialGameState("guest");
  assert.deepEqual(
    {
      currentNodeId: initial.currentNodeId,
      stage: initial.stage,
      stageProgress: initial.stageProgress
    },
    createStoryCompatibilityProjection(null)
  );

  const villageCheckpoint = checkpoint("village-arrival", ["prologue"]);
  const village = commitStoryTransaction(initial, "request-village", {
    checkpoint: villageCheckpoint,
    events: []
  });
  assert.equal(village.currentNodeId, "village-arrival");
  assert.equal(village.stage, "village");
  assert.equal(village.stageProgress["prologue-completed"], true);
  assert.equal(village.stageProgress["village-started"], true);
  assert.equal(village.stageProgress["old-house-started"], false);
  assert.equal(validateGameState(village), true);

  const endCheckpoint = checkpoint("week-one-end", [
    "prologue",
    "village",
    "old-house"
  ]);
  const ended = commitStoryTransaction(village, "request-ended", {
    checkpoint: endCheckpoint,
    events: []
  });
  assert.equal(ended.currentNodeId, "week-one-end");
  assert.equal(ended.stage, "old-house");
  assert.equal(ended.stageProgress["old-house-completed"], true);
  assert.equal(validateGameState(ended), true);
});

test("读取早期 schema 2 存档时从检查点修复兼容字段", () => {
  const state = commitStoryTransaction(
    createInitialGameState("guest"),
    "request-village",
    { checkpoint: checkpoint("village-arrival", ["prologue"]), events: [] }
  );
  const earlySchema2 = {
    ...state,
    currentNodeId: "prologue-wake",
    stage: "prologue",
    stageProgress: { "prologue-started": true }
  };
  const records = new Map([
    [getSaveKey("guest"), JSON.stringify(earlySchema2)]
  ]);
  const previousStorage = globalThis.localStorage;
  globalThis.localStorage = {
    getItem: (key) => records.get(key) ?? null,
    setItem: (key, value) => records.set(key, value),
    removeItem: (key) => records.delete(key)
  };

  try {
    const result = loadGame("guest");
    assert.equal(result.ok, true);
    assert.equal(result.data.currentNodeId, "village-arrival");
    assert.equal(result.data.stage, "village");
    assert.equal(result.data.stageProgress["prologue-completed"], true);
    assert.equal(result.data.stageProgress["village-started"], true);
  } finally {
    if (previousStorage === undefined) delete globalThis.localStorage;
    else globalThis.localStorage = previousStorage;
  }
});
