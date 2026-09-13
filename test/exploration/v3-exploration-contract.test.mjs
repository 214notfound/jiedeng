import test from "node:test";
import assert from "node:assert/strict";
import {
  createExploration,
  validateExplorationContext
} from "../../assets/js/exploration/game/exploration.js";
import {EXPLORATION_TASKS} from "../../assets/js/exploration/data/exploration.js";
import {CONVERSATION_TASKS} from "../../assets/js/exploration/conversation/data/conversations.js";
import {
  OUTER_INVESTIGATION_SUBSCENES,
  projectOuterInvestigationScene
} from "../../assets/js/exploration/data/outer-investigation-subscenes.js";
import {scenePresentationFor} from "../../assets/js/exploration/data/scene-assets.js";
import {NODE_SCENES} from "../../assets/js/exploration/core/story-scenes.js";

const OUTER_TARGETS = [
  ["investigate-gorge-and-grave", "a-gorge-thread-complete"],
  ["investigate-project-records", "project-record-thread-complete"],
  ["investigate-su-trail", "su-thread-complete"],
  ["investigate-white-lamp-mail", "white-lamp-first-thread-complete"]
];

const V3_EXPLORATION_HANDOFFS = Object.freeze({
  "investigate-gorge-and-grave": ["outer-lines-investigation", ["a-gorge-thread-complete"]],
  "investigate-project-records": ["outer-lines-investigation", ["project-record-thread-complete"]],
  "investigate-su-trail": ["outer-lines-investigation", ["su-thread-complete"]],
  "investigate-white-lamp-mail": ["outer-lines-investigation", ["white-lamp-first-thread-complete"]],
  "investigate-control-room": ["b-designer-revealed", [
    "protagonist-is-b-known", "intimidation-plan-authorship"
  ]],
  "investigate-old-clinic": ["a-survival-revealed", [
    "a-b-identity-chain-complete", "a-left-clinic-with-sister-known"
  ]],
  "investigate-father-and-company": ["father-company-truth", [
    "old-accident-coverup-proven", "father-full-role-known",
    "company-succession-chain", "b-prior-mine-ignorance-established"
  ]],
  "investigate-anonymous-hideout": ["white-lamp-identity-revealed", [
    "three-identities-merged", "white-lamp-self-exculpation-known", "mine-bypass-coordinate-known"
  ]],
  "investigate-su-death-scene": ["su-he-death-reconstructed", [
    "x-pushed-su-known", "b-refused-rescue-recorded",
    "night-sealing-coverup-proven", "su-death-chain-complete"
  ]],
  "investigate-company-server": ["server-evidence-recovered", ["full-evidence-package-ready"]]
});

test("V3 x recovery and showdown nodes use the data-center scene", () => {
  assert.equal(NODE_SCENES["x-recovery-confrontation"], "data-center");
  assert.equal(NODE_SCENES["x-showdown"], "data-center");
  assert.notEqual(NODE_SCENES["x-recovery-confrontation"], "village-exit");
  assert.notEqual(NODE_SCENES["x-showdown"], "village-exit");
  assert.match(scenePresentationFor("data-center", {
    facts: [], nodeId: "x-recovery-confrontation"
  }).image, /v3\/x-showdown-entry\.jpg$/);
  assert.match(scenePresentationFor("data-center", {
    facts: [], nodeId: "x-showdown"
  }).image, /v3\/x-showdown-entry\.jpg$/);
});

test("V3 exploration context rejects duplicate allowed result facts", () => {
  const command = {
    commandId: "cmd-x-showdown-x-showdown-chase",
    commandType: "REQUEST_MINIGAME",
    payload: {
      minigameId: "x-showdown-chase",
      gameStyle: "chase",
      allowedResultFactIds: ["x-showdown-survived", "x-showdown-survived"]
    }
  };
  const context = {
    state: {
      facts: [],
      inventory: [],
      clues: [],
      storyCheckpoint: {
        nodeId: "x-showdown",
        nodeRevision: 1,
        completedMilestoneIds: [],
        completedNodeIds: [],
        completedStageIds: [],
        pendingCommands: [{
          commandId: command.commandId,
          commandType: command.commandType,
          targetId: command.payload.minigameId
        }]
      }
    },
    commands: [command]
  };
  assert.throws(() => validateExplorationContext(context), /小游戏/);
});

test("outer investigation subscene projection preserves variant and return target", () => {
  const host = createOuterHost();
  const module = createExploration(host);
  const baseView = module.getSceneView("outer-investigation-hub");
  const baseLayout = module.getLayout();
  for (const entry of OUTER_INVESTIGATION_SUBSCENES) {
    const projected = projectOuterInvestigationScene(baseView, baseLayout, entry.sceneId);
    assert.equal(projected.selected.sceneId, entry.sceneId);
    assert.equal(projected.view.sceneVariant, entry.variantId);
    assert.equal(projected.view.interactions[0].id, entry.actionId);
    assert.equal(projected.layout.hotspots.length, 1);
    assert.deepEqual(projected.layout.hotspots[0].interactionIds, [entry.actionId]);
  }
  assert.equal(projectOuterInvestigationScene(baseView, baseLayout, null).layout.hotspots.length, 4);
  module.dispose();
});

function command(target) {
  return {
    commandId: `cmd-outer-lines-investigation-${target}`,
    commandType: "REQUEST_EXPLORATION",
    payload: {explorationId: target, goals: [{goalId: `${target}-goal`, description: "测试目标"}]}
  };
}

function createOuterHost({rejectFirst = false} = {}) {
  let commands = OUTER_TARGETS.map(([target]) => command(target));
  const state = {
    facts: [], inventory: [], clues: [],
    storyCheckpoint: {
      nodeId: "outer-lines-investigation",
      nodeRevision: 1,
      completedMilestoneIds: [],
      completedNodeIds: [],
      completedStageIds: [],
      pendingCommands: commands.map((entry) => ({
        commandId: entry.commandId,
        commandType: entry.commandType,
        targetId: entry.payload.explorationId
      }))
    }
  };
  const events = [];
  let rejected = false;
  return {
    events,
    getContext: () => ({storageScope: "guest", state, commands}),
    subscribe: () => () => {},
    dispatchExternalEvent(event) {
      events.push(structuredClone(event));
      if (rejectFirst && !rejected) {
        rejected = true;
        return {ok: false, message: "测试拒绝"};
      }
      state.facts.push(...event.resultFactIds);
      commands = commands.filter((entry) => entry.commandId !== event.causedByCommandId);
      state.storyCheckpoint.pendingCommands = state.storyCheckpoint.pendingCommands.filter(
        (entry) => entry.commandId !== event.causedByCommandId
      );
      return {ok: true};
    }
  };
}

test("V3 十个探索 handoff 均使用阅读后提交的聚合对象", () => {
  const tasks = EXPLORATION_TASKS.filter((task) => task.actions[0]?.submitAfterReading);
  assert.equal(tasks.length, 10);
  for (const task of tasks) {
    const expected = V3_EXPLORATION_HANDOFFS[task.target];
    assert.ok(expected, task.target);
    assert.equal(task.node, expected[0], task.target);
    assert.equal(task.actions.length, 1, task.target);
    assert.equal(task.actions[0].id, task.target, task.target);
    assert.deepEqual(task.actions[0].facts, expected[1], task.target);
    assert.ok(task.actions[0].blocks.length >= 3, task.target);
  }
});

test("V3 小周回收对话只负责交付要求，不包含剧情选择", () => {
  const task = CONVERSATION_TASKS.find((entry) => entry.target === "x-recovery-demand");
  assert.equal(task.node, "x-recovery-confrontation");
  assert.equal(task.npc, "companion-x");
  assert.equal(task.actions.length, 1);
  assert.deepEqual(task.actions[0].facts, ["x-recovery-demand-delivered"]);
  assert.doesNotMatch(task.actions[0].text, /选择|按钮|下一 Node|nextNodeId/);
});

test("外围 Hub 四个入口只投影导航，不改变探索业务动作", () => {
  const host = createOuterHost();
  const module = createExploration(host);
  const baseView = module.getSceneView("outer-investigation-hub");
  const baseLayout = module.getLayout();
  const before = structuredClone(baseView.interactions);
  const hub = projectOuterInvestigationScene(baseView, baseLayout, null);
  assert.equal(hub.layout.hotspots.length, 4);
  assert.ok(hub.view.interactions.every((action) => action.interactionType === "scene"));
  assert.deepEqual(baseView.interactions, before);

  const selected = projectOuterInvestigationScene(baseView, baseLayout, "mountain-routes");
  assert.equal(selected.view.sceneId, "mountain-routes");
  assert.equal(selected.view.interactions[0].id, "investigate-gorge-and-grave");
  assert.equal(selected.view.interactions[0].interactionType, "item");
  assert.match(selected.view.sceneImage, /mountain-routes\.jpg$/);
  assert.equal(OUTER_INVESTIGATION_SUBSCENES.length, 4);
  module.dispose();
});

test("第一条调查在统一阅读真实结束前不提交，结束后只提交一次", async () => {
  const host = createOuterHost();
  const module = createExploration(host);
  const sceneId = module.getCurrentSceneId();
  const preview = await module.interact(sceneId, "investigate-gorge-and-grave");
  assert.equal(preview.requiresReading, true);
  assert.equal(host.events.length, 0);

  const input = module.getExplorationReadingInput(sceneId, "investigate-gorge-and-grave");
  const result = {
    mode: "story",
    finalItemId: input.blocks.at(-1).blockId,
    metadata: {presentationId: input.presentationId, sceneId: input.sceneId}
  };
  assert.equal((await module.completeExplorationReading(sceneId, "investigate-gorge-and-grave", result)).ok, true);
  assert.equal(host.events.length, 1);
  assert.deepEqual(host.events[0], {
    eventId: "evt-cmd-outer-lines-investigation-investigate-gorge-and-grave-investigate-gorge-and-grave-object_investigated",
    eventType: "OBJECT_INVESTIGATED",
    source: "exploration",
    causedByCommandId: "cmd-outer-lines-investigation-investigate-gorge-and-grave",
    resultFactIds: ["a-gorge-thread-complete"],
    payload: {objectId: "investigate-gorge-and-grave"}
  });
  assert.equal((await module.completeExplorationReading(sceneId, "investigate-gorge-and-grave", result)).ok, true);
  assert.equal(host.events.length, 1);
  module.dispose();
});

test("V3 场景根据 Node 使用对应图片且不覆盖 V2 村口", () => {
  assert.match(scenePresentationFor("village", {facts: []}).image, /scenes\/village\.png$/);
  assert.match(scenePresentationFor("outer-investigation-hub", {
    facts: [], nodeId: "outer-lines-investigation"
  }).image, /v3\/outer-investigation-hub\.jpg$/);
  assert.match(scenePresentationFor("sealed-mine", {
    facts: [], nodeId: "mine-route-restored"
  }).image, /v3\/mine-route-entry\.jpg$/);
  assert.match(scenePresentationFor("sealed-mine", {
    facts: [], nodeId: "su-he-death-reconstructed"
  }).image, /v3\/su-death-scene\.jpg$/);
  assert.match(scenePresentationFor("village-exit", {
    facts: [], nodeId: "ending-full-account"
  }).image, /v3\/ending-full-account\.jpg$/);
});
