import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import vm from "node:vm";
import {createGameFlow} from "../../assets/js/core/game-flow.js";
import {createInitialGameState} from "../../assets/js/core/state.js";
import {loadGame, saveGame} from "../../assets/js/core/storage.js";
import {createInteractionModule} from "../../assets/js/exploration/integration/game/interaction-module.js";
import {createV3MinigameEvent} from "../../assets/js/minigames/v3-handoff/v3-minigame-gateway.js";

const STORY_SCRIPTS = [
  "story-registry.js",
  "prologue.js",
  "village.js",
  "old-house.js",
  "v3/registry-extension.js",
  "v3/outer-investigation.js",
  "v3/identity-reconstruction.js",
  "v3/mine-return.js",
  "v3/finale.js"
].map((file) => new URL(`../../assets/js/game-line/data/${file}`, import.meta.url));

for (const file of ["story-validator.js", "story-runtime.js", "story-request.js", "story-engine.js"]) {
  STORY_SCRIPTS.push(new URL(`../../assets/js/game-line/game/${file}`, import.meta.url));
}

function loadStory() {
  const context = {console: {info() {}, error() {}}};
  context.window = context;
  vm.createContext(context);
  for (const url of STORY_SCRIPTS) {
    vm.runInContext(readFileSync(url, "utf8"), context, {filename: url.pathname});
  }
  return context.WhiteLamp.story;
}

function readingResult(input) {
  return {
    mode: "story",
    finalItemId: input.blocks.at(-1).blockId,
    metadata: {presentationId: input.presentationId, sceneId: input.sceneId}
  };
}

function conversationResult(input) {
  return {
    mode: "conversation",
    finalItemId: input.items.at(-1).id,
    metadata: input.metadata
  };
}

test("正式状态、剧情与交互模块可从 V3 入口连续到完整公开结局", async () => {
  let commands = [];
  const listeners = new Set();
  const flow = createGameFlow({
    storageScope: "guest",
    story: loadStory(),
    onCommandsChange(nextCommands) { commands = nextCommands; },
    onStateChange() { listeners.forEach((listener) => listener()); }
  });
  const initial = createInitialGameState("guest");
  flow.replaceState({
    ...initial,
    facts: ["door-call-incident-completed"],
    storyCheckpoint: {
      nodeId: "week-one-end",
      nodeRevision: 1,
      completedMilestoneIds: [],
      completedNodeIds: [],
      completedStageIds: ["prologue", "village"],
      pendingCommands: []
    }
  });

  assert.equal((await flow.runStory({type: "resume"})).ok, true);
  assert.equal(flow.getState().storyCheckpoint.nodeRevision, 2);
  assert.equal((await flow.handleStoryAction("confirm-week-one-end")).ok, true);

  const host = {
    getContext: () => ({storageScope: "guest", state: flow.getState(), commands}),
    subscribe(listener) {
      listeners.add(listener);
      listener();
      return () => listeners.delete(listener);
    },
    dispatchExternalEvent: (event) => flow.handleExternalEvent(event)
  };
  const interaction = createInteractionModule(host);

  async function completeExploration(targetId) {
    const sceneId = interaction.getCurrentSceneId();
    const input = interaction.getExplorationReadingInput(sceneId, targetId);
    assert.ok(input, targetId);
    const result = await interaction.completeExplorationReading(
      sceneId,
      targetId,
      readingResult(input)
    );
    assert.equal(result.ok, true, targetId);
  }

  async function completeMinigame(targetId, factId) {
    const command = commands.find((entry) => entry.payload?.minigameId === targetId);
    assert.ok(command, targetId);
    const result = await flow.handleExternalEvent(createV3MinigameEvent(command, factId));
    assert.equal(result.ok, true, targetId);
  }

  await completeExploration("investigate-gorge-and-grave");

  const records = new Map();
  const previousStorage = globalThis.localStorage;
  globalThis.localStorage = {
    getItem: (key) => records.get(key) ?? null,
    setItem: (key, value) => records.set(key, value),
    removeItem: (key) => records.delete(key)
  };
  try {
    const saved = saveGame(flow.getState(), "guest");
    assert.equal(saved.ok, true);
    const loaded = loadGame("guest");
    assert.equal(loaded.ok, true);
    assert.equal(loaded.data.facts.includes("a-gorge-thread-complete"), true);
    assert.equal(loaded.data.storyCheckpoint.pendingCommands.length, 3);
    assert.deepEqual(loaded.data.explorationState, {});
    flow.replaceState(loaded.data);
    assert.equal((await flow.runStory({type: "resume"})).ok, true);
  } finally {
    if (previousStorage === undefined) delete globalThis.localStorage;
    else globalThis.localStorage = previousStorage;
  }

  for (const targetId of [
    "investigate-project-records",
    "investigate-su-trail",
    "investigate-white-lamp-mail"
  ]) {
    await completeExploration(targetId);
  }
  await completeMinigame("haunting-network-puzzle", "haunting-is-engineered");
  await completeExploration("investigate-control-room");
  await completeExploration("investigate-old-clinic");
  await completeExploration("investigate-father-and-company");
  await completeExploration("investigate-anonymous-hideout");
  await completeMinigame("mine-route-puzzle", "sealed-mine-bypassed");
  await completeExploration("investigate-su-death-scene");
  await completeExploration("investigate-company-server");

  const sceneId = interaction.getCurrentSceneId();
  const conversation = interaction.getReadingInput(sceneId, "x-recovery-demand");
  assert.ok(conversation);
  assert.equal((await interaction.completeReading(
    sceneId,
    "x-recovery-demand",
    conversationResult(conversation)
  )).ok, true);

  assert.equal((await flow.handleStoryAction("refuse-handover")).ok, true);
  await completeMinigame("x-showdown-chase", "x-showdown-survived");
  assert.equal((await flow.handleStoryAction("publish-full-evidence")).ok, true);
  const ending = await flow.handleStoryAction("confirm-ending-full-account");
  assert.equal(ending.ok, true);
  assert.equal(ending.status, "ended");
  assert.equal(flow.getState().storyCheckpoint.nodeId, "ending-full-account");
  interaction.dispose();
});
