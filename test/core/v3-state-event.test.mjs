import test from "node:test";
import assert from "node:assert/strict";
import {applyExternalEvent, commitStoryTransaction, createInitialGameState, getStageIdForNode} from "../../assets/js/core/state.js";
import {EXTERNAL_EVENT_TYPES, STORY_FACT_DEFINITIONS} from "../../assets/js/core/game-contract.js";

function stateWithCommand(commandType, targetId) {
  return commitStoryTransaction(createInitialGameState("guest"), "v3-entry", {
    checkpoint: {
      nodeId: "week-one-end",
      nodeRevision: 2,
      completedMilestoneIds: [],
      completedNodeIds: [],
      completedStageIds: [],
      pendingCommands: [{commandId: "cmd-v3", commandType, targetId}]
    },
    events: []
  });
}

test("V3 探索事实校验 externalTargetId 并记录调查对象", () => {
  const next = applyExternalEvent(
    stateWithCommand("REQUEST_EXPLORATION", "investigate-gorge-and-grave"),
    {
      eventId: "evt-v3-exploration",
      eventType: "OBJECT_INVESTIGATED",
      source: "exploration",
      causedByCommandId: "cmd-v3",
      resultFactIds: ["a-gorge-thread-complete"],
      payload: {objectId: "investigate-gorge-and-grave"}
    }
  );
  assert.equal(next.facts.includes("a-gorge-thread-complete"), true);
  assert.equal(next.investigated.includes("investigate-gorge-and-grave"), true);
});

test("V3 core contract registers minigame event, facts, and stages", () => {
  assert.equal(EXTERNAL_EVENT_TYPES.MINIGAME_RESOLVED, "MINIGAME_RESOLVED");
  const definitions = new Map(STORY_FACT_DEFINITIONS.map((definition) => [definition.id, definition]));
  assert.equal(definitions.get("a-gorge-thread-complete").externalTargetId, "investigate-gorge-and-grave");
  assert.equal(definitions.get("x-recovery-demand-delivered").producer, "conversation");
  assert.equal(definitions.get("x-showdown-survived").producer, "minigame");
  assert.equal(getStageIdForNode("outer-lines-investigation"), "outer-investigation");
  assert.equal(getStageIdForNode("ending-full-account"), "finale");
});

test("V3 MINIGAME_RESOLVED 只接受当前命令的单一结果事实", () => {
  const next = applyExternalEvent(
    stateWithCommand("REQUEST_MINIGAME", "haunting-network-puzzle"),
    {
      eventId: "evt-v3-minigame",
      eventType: "MINIGAME_RESOLVED",
      source: "minigame",
      causedByCommandId: "cmd-v3",
      resultFactIds: ["haunting-is-engineered"],
      payload: {minigameId: "haunting-network-puzzle"}
    }
  );
  assert.equal(next.facts.includes("haunting-is-engineered"), true);
  assert.equal(next.minigameState["haunting-network-puzzle"], true);
});
