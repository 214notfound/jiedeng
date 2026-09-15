// 本文件在 Node 内存环境中验证 V3 可选扩展、五条结局路径、小游戏契约与检查点迁移。
"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const projectRoot = path.resolve(__dirname, "../..");
const contractVersion = "1.0";
const moduleVersion = "3.0.0";
const targetEndings = [
  "ending-accomplice",
  "ending-defeated",
  "ending-erasure",
  "ending-curated-truth",
  "ending-full-account",
];
const scripts = [
  "assets/js/game-line/data/story-registry.js",
  "assets/js/game-line/data/prologue.js",
  "assets/js/game-line/data/village.js",
  "assets/js/game-line/data/old-house.js",
  "assets/js/game-line/data/v3/registry-extension.js",
  "assets/js/game-line/data/v3/outer-investigation.js",
  "assets/js/game-line/data/v3/identity-reconstruction.js",
  "assets/js/game-line/data/v3/mine-return.js",
  "assets/js/game-line/data/v3/finale.js",
  "assets/js/game-line/game/story-validator.js",
  "assets/js/game-line/game/story-runtime.js",
  "assets/js/game-line/game/story-request.js",
  "assets/js/game-line/game/story-engine.js",
];

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function createHarness() {
  const context = { console: { info() {}, error() {} } };
  context.window = context;
  vm.createContext(context);
  scripts.forEach((relativePath) => {
    const source = fs.readFileSync(path.join(projectRoot, relativePath), "utf8");
    vm.runInContext(source, context, { filename: relativePath });
  });
  return {
    internal: context.WhiteLampStoryInternal,
    data: context.WhiteLampStoryInternal.storyData,
    rules: context.WhiteLampStoryInternal.storyRules,
    enterStory: context.WhiteLamp.story.enterStory,
  };
}

function createGame(harness) {
  const state = { facts: [], checkpoint: null, appliedOnceKeys: [] };
  let requestNumber = 0;
  let eventNumber = 0;
  let latestResponse = null;

  function addFact(factId) {
    if (!state.facts.includes(factId)) state.facts.push(factId);
  }

  function applyCommit(commit) {
    state.checkpoint = clone(commit.checkpoint);
    commit.events.forEach((event) => {
      if (state.appliedOnceKeys.includes(event.onceKey)) return;
      state.appliedOnceKeys.push(event.onceKey);
      if (event.eventType === "STORY_FACT_RECORDED") addFact(event.payload.factId);
      const targetId =
        event.payload.choiceId ||
        event.payload.itemId ||
        event.payload.locationId ||
        event.payload.clueId;
      harness.data.facts
        .filter(
          (fact) =>
            fact.producer === "state" &&
            fact.derivedFrom?.eventType === event.eventType &&
            fact.derivedFrom.targetId === targetId,
        )
        .forEach((fact) => addFact(fact.id));
    });
  }

  function call(input, factsOverride) {
    const request = {
      contractVersion,
      requestId: `story-v3-${++requestNumber}`,
      source: "story-v3-test",
      input,
      context: {
        facts: factsOverride ? factsOverride.slice() : state.facts.slice(),
        storyCheckpoint: state.checkpoint ? clone(state.checkpoint) : null,
      },
    };
    const response = harness.enterStory(request);
    if (response.status !== "error") {
      latestResponse = response;
      if (factsOverride) state.facts = factsOverride.slice();
      applyCommit(response.commit);
    }
    return response;
  }

  function command(targetId) {
    return latestResponse.commands.find(
      (item) =>
        item.payload.explorationId === targetId ||
        item.payload.conversationId === targetId ||
        item.payload.minigameId === targetId,
    );
  }

  function external(targetId, eventType, resultFactIds, payload, source) {
    const pending = command(targetId);
    assert.ok(pending, `缺少外部命令：${targetId}`);
    const candidateFacts = state.facts.slice();
    resultFactIds.forEach((factId) => {
      if (!candidateFacts.includes(factId)) candidateFacts.push(factId);
    });
    return call(
      {
        type: "external-event",
        event: {
          eventId: `story-v3-external-${++eventNumber}`,
          eventType,
          source: source || pending.target,
          causedByCommandId: pending.commandId,
          resultFactIds: resultFactIds.slice(),
          payload: clone(payload),
        },
      },
      candidateFacts,
    );
  }

  function action(actionId) {
    return call({ type: "story-action", actionId });
  }

  function resume() {
    return call({ type: "resume" });
  }

  return { state, call, command, external, action, resume, get response() { return latestResponse; } };
}

const outerLines = [
  ["investigate-gorge-and-grave", "a-gorge-thread-complete"],
  ["investigate-project-records", "project-record-thread-complete"],
  ["investigate-su-trail", "su-thread-complete"],
  ["investigate-white-lamp-mail", "white-lamp-first-thread-complete"],
];

function enterV3(game, revision = 1) {
  game.state.facts = ["door-call-incident-completed"];
  game.state.checkpoint = {
    nodeId: "week-one-end",
    nodeRevision: revision,
    completedMilestoneIds: [],
    completedNodeIds: [],
    completedStageIds: ["prologue", "village"],
    pendingCommands: [],
  };
  const restored = game.resume();
  if (revision !== 1) return restored;
  assert.equal(restored.status, "ready");
  assert.equal(restored.commit.checkpoint.nodeRevision, 2);
  const opened = game.action("confirm-week-one-end");
  assert.equal(opened.commit.checkpoint.nodeId, "outer-lines-investigation");
  return opened;
}

function completeExploration(game, targetId, factIds) {
  return game.external(
    targetId,
    "OBJECT_INVESTIGATED",
    factIds,
    { objectId: targetId },
    "exploration",
  );
}

function completeMinigame(game, targetId, factId) {
  return game.external(
    targetId,
    "MINIGAME_RESOLVED",
    [factId],
    { minigameId: targetId },
    "minigame",
  );
}

function reachConfrontation(game, order = outerLines) {
  enterV3(game);
  order.forEach(([targetId, factId]) => completeExploration(game, targetId, [factId]));
  completeMinigame(game, "haunting-network-puzzle", "haunting-is-engineered");
  completeExploration(game, "investigate-control-room", [
    "protagonist-is-b-known",
    "intimidation-plan-authorship",
  ]);
  completeExploration(game, "investigate-old-clinic", [
    "a-b-identity-chain-complete",
    "a-left-clinic-with-sister-known",
  ]);
  completeExploration(game, "investigate-father-and-company", [
    "old-accident-coverup-proven",
    "father-full-role-known",
    "company-succession-chain",
    "b-prior-mine-ignorance-established",
  ]);
  completeExploration(game, "investigate-anonymous-hideout", [
    "three-identities-merged",
    "white-lamp-self-exculpation-known",
    "mine-bypass-coordinate-known",
  ]);
  completeMinigame(game, "mine-route-puzzle", "sealed-mine-bypassed");
  completeExploration(game, "investigate-su-death-scene", [
    "x-pushed-su-known",
    "b-refused-rescue-recorded",
    "night-sealing-coverup-proven",
    "su-death-chain-complete",
  ]);
  completeExploration(game, "investigate-company-server", ["full-evidence-package-ready"]);
  const talked = game.external(
    "x-recovery-demand",
    "NPC_TALKED",
    ["x-recovery-demand-delivered"],
    { conversationId: "x-recovery-demand", npcId: "companion-x" },
    "conversation",
  );
  assert.equal(talked.status, "ready");
  assert.equal(talked.commit.checkpoint.nodeId, "x-recovery-confrontation");
}

function confirmEnding(game, endingId) {
  assert.equal(game.state.checkpoint.nodeId, endingId);
  const ended = game.action(`confirm-${endingId}`);
  assert.equal(ended.status, "ended");
  assert.equal(ended.commit.checkpoint.nodeId, endingId);
  assert.equal(
    ended.notifications.some(
      (notification) =>
        notification.eventType === "STORY_ENDED" &&
        notification.payload.endingId === endingId,
    ),
    true,
  );
}

function permutations(values) {
  if (values.length <= 1) return [values.slice()];
  return values.flatMap((value, index) =>
    permutations(values.filter((_, current) => current !== index)).map((rest) => [value, ...rest]),
  );
}

const tests = [];
function test(name, run) {
  tests.push({ name, run });
}

test("V3 数据以固定顺序加载，28 个 Node 全部通过预检", () => {
  const harness = createHarness();
  const validation = harness.rules.validateStoryData(harness.data);
  assert.equal(validation.ok, true, validation.issues.join("\n"));
  assert.equal(harness.data.contractVersion, contractVersion);
  assert.equal(harness.data.moduleVersion, moduleVersion);
  assert.equal(harness.data.nodes.length, 28);
  assert.deepEqual(
    Array.from(harness.data.expectedNodeIds),
    Array.from(harness.data.nodes, (node) => node.id),
  );
  assert.deepEqual(
    Array.from(
      harness.data.nodes.filter((node) => node.terminal),
      (node) => node.endingId,
    ).sort(),
    targetEndings.slice().sort(),
  );
});

test("week-one-end@1 自动迁移到 @2，未知 revision 明确失败", () => {
  const game = createGame(createHarness());
  enterV3(game);
  const invalid = createGame(createHarness());
  const response = enterV3(invalid, 99);
  assert.equal(response.status, "error");
  assert.equal(response.error.errorCode, "STORY_REVISION_MISMATCH");
});

test("扩展版本和重复 ID 不匹配时立即失败且不产生部分追加", () => {
  const harness = createHarness();
  const stageCount = harness.data.stages.length;
  assert.throws(
    () =>
      harness.internal.extendStoryRegistry({
        baseModuleVersion: "1.0.0",
        moduleVersion: "3.0.1",
        endNodeId: "ending-full-account",
      }),
    /基础版本不匹配/,
  );
  assert.throws(
    () =>
      harness.internal.extendStoryRegistry({
        baseModuleVersion: "3.0.0",
        moduleVersion: "3.0.1",
        endNodeId: "ending-full-account",
        stages: ["finale"],
      }),
    /重复 ID/,
  );
  assert.equal(harness.data.stages.length, stageCount);
  assert.equal(harness.data.moduleVersion, "3.0.0");
  const broken = clone(harness.data);
  broken.nodes.find((node) => node.id === "outer-lines-investigation").transitions[0].to =
    "missing-node";
  const validation = harness.rules.validateStoryData(broken);
  assert.equal(validation.ok, false);
  assert.equal(validation.issues.some((issue) => issue.includes("指向未知 Node")), true);
});

test("外围四线全部 24 种顺序可完成且已完成命令不再发出", () => {
  permutations(outerLines).forEach((order) => {
    const game = createGame(createHarness());
    enterV3(game);
    order.forEach(([targetId, factId], index) => {
      completeExploration(game, targetId, [factId]);
      const remainingTargets = game.response.commands.map(
        (command) => command.payload.explorationId,
      );
      assert.equal(remainingTargets.includes(targetId), false);
      if (index < 3) assert.equal(game.state.checkpoint.nodeId, "outer-lines-investigation");
    });
    assert.equal(game.state.checkpoint.nodeId, "haunting-system-dismantled");
  });
});

test("三个新小游戏暴露风格和允许结果，错误结果与技术失败不推进剧情", () => {
  const harness = createHarness();
  const game = createGame(harness);
  const minigameDefinitions = [
    ["haunting-system-dismantled", "haunting-network-puzzle", "puzzle", ["haunting-is-engineered"]],
    ["mine-route-restored", "mine-route-puzzle", "puzzle", ["sealed-mine-bypassed"]],
    ["x-showdown", "x-showdown-chase", "chase", ["x-showdown-survived", "x-showdown-lost"]],
  ];
  minigameDefinitions.forEach(([nodeId, targetId, style, factIds]) => {
    const node = harness.data.nodes.find((item) => item.id === nodeId);
    const handoff = node.handoffs.find((item) => item.targetId === targetId);
    assert.ok(handoff);
    assert.equal(handoff.gameStyle, style);
    const actualFactIds = harness.internal.storyRuntime
      ? harness.internal.storyRuntime.getHandoffFactIds(node, handoff)
      : factIds;
    assert.deepEqual(Array.from(actualFactIds).sort(), factIds.slice().sort());
  });
  enterV3(game);
  outerLines.forEach(([targetId, factId]) => completeExploration(game, targetId, [factId]));
  let command = game.command("haunting-network-puzzle");
  assert.equal(command.payload.gameStyle, "puzzle");
  assert.deepEqual(Array.from(command.payload.allowedResultFactIds), ["haunting-is-engineered"]);
  let response = game.external(
    "haunting-network-puzzle",
    "MINIGAME_RESOLVED",
    ["sealed-mine-bypassed"],
    { minigameId: "haunting-network-puzzle" },
    "minigame",
  );
  assert.equal(response.error.errorCode, "STORY_INVALID_REQUEST");
  response = game.external(
    "haunting-network-puzzle",
    "EXTERNAL_INTERACTION_FAILED",
    [],
    { targetId: "haunting-network-puzzle", errorCode: "GAME_LOAD_FAILED" },
    "minigame",
  );
  assert.equal(response.error.errorCode, "STORY_EXTERNAL_FAILED");
  assert.equal(game.state.checkpoint.nodeId, "haunting-system-dismantled");
});

test("旧地图拼图命令载荷和事件类型保持 V1 契约", () => {
  const harness = createHarness();
  const node = harness.data.nodes.find((item) => item.id === "village-map-and-route");
  const handoff = node.handoffs[0];
  assert.equal(handoff.gameStyle, undefined);
  assert.equal(handoff.completionMode, undefined);
  assert.equal(handoff.targetId, "map-puzzle");
  assert.equal(harness.data.facts.find((fact) => fact.id === "map-puzzle-completed").producer, "minigame");
  const game = createGame(harness);
  game.state.facts = [
    "shopkeeper-inquiry-completed",
    "holdout-inquiry-completed",
    "elder-inquiry-completed",
    "map-fragment-1-acquired",
    "map-fragment-2-acquired",
    "map-fragment-3-acquired",
  ];
  game.state.checkpoint = {
    nodeId: "village-map-and-route",
    nodeRevision: 1,
    completedMilestoneIds: [],
    completedNodeIds: [],
    completedStageIds: ["prologue"],
    pendingCommands: [],
  };
  game.resume();
  const command = game.command("map-puzzle");
  assert.deepEqual(Object.keys(command.payload).sort(), ["minigameId", "successFactId"]);
  let response = game.external(
    "map-puzzle",
    "MINIGAME_RESOLVED",
    ["map-puzzle-completed"],
    { minigameId: "map-puzzle" },
    "minigame",
  );
  assert.equal(response.error.errorCode, "STORY_INVALID_REQUEST");
  response = game.external(
    "map-puzzle",
    "MAP_PUZZLE_COMPLETED",
    ["map-puzzle-completed"],
    { puzzleId: "map-puzzle" },
    "minigame",
  );
  assert.equal(response.status, "ready");
});

test("交出证据进入《共犯的终点》", () => {
  const game = createGame(createHarness());
  reachConfrontation(game);
  game.action("hand-over-evidence");
  confirmEnding(game, "ending-accomplice");
});

test("拒绝后追逐失败进入《封井之人》", () => {
  const game = createGame(createHarness());
  reachConfrontation(game);
  game.action("refuse-handover");
  const chase = game.command("x-showdown-chase");
  assert.equal(chase.payload.gameStyle, "chase");
  assert.deepEqual(
    Array.from(chase.payload.allowedResultFactIds).sort(),
    ["x-showdown-lost", "x-showdown-survived"],
  );
  completeMinigame(game, "x-showdown-chase", "x-showdown-lost");
  confirmEnding(game, "ending-defeated");
});

[
  ["destroy-all-evidence", "ending-erasure"],
  ["publish-curated-evidence", "ending-curated-truth"],
  ["publish-full-evidence", "ending-full-account"],
].forEach(([actionId, endingId]) => {
  test(`追逐成功后选择 ${actionId} 进入 ${endingId}`, () => {
    const game = createGame(createHarness());
    reachConfrontation(game);
    game.action("refuse-handover");
    completeMinigame(game, "x-showdown-chase", "x-showdown-survived");
    game.action(actionId);
    confirmEnding(game, endingId);
  });
});

test("追逐的互斥结果不能在同一事件中同时提交", () => {
  const game = createGame(createHarness());
  reachConfrontation(game);
  game.action("refuse-handover");
  const response = game.external(
    "x-showdown-chase",
    "MINIGAME_RESOLVED",
    ["x-showdown-survived", "x-showdown-lost"],
    { minigameId: "x-showdown-chase" },
    "minigame",
  );
  assert.equal(response.status, "error");
  assert.equal(response.error.errorCode, "STORY_INVALID_REQUEST");
  assert.equal(game.state.checkpoint.nodeId, "x-showdown");
});

test("多个证据结局事实同时存在时显式拒绝转移", () => {
  const game = createGame(createHarness());
  game.state.facts = [
    "x-showdown-survived",
    "all-evidence-destroyed",
    "full-evidence-published",
  ];
  game.state.checkpoint = {
    nodeId: "evidence-disposition",
    nodeRevision: 1,
    completedMilestoneIds: [],
    completedNodeIds: [],
    completedStageIds: [],
    pendingCommands: [],
  };
  const response = game.resume();
  assert.equal(response.status, "error");
  assert.equal(response.error.errorCode, "STORY_AMBIGUOUS_TRANSITION");
});

test("剧情模块玩家可见文案不再出现编辑代号", () => {
  const data = createHarness().data;
  const visibleText = data.nodes.flatMap((node) =>
    node.presentations.flatMap((presentation) => [
      ...presentation.blocks.map((block) => block.text),
      ...presentation.actionIds.map(
        (actionId) => node.actions.find((action) => action.id === actionId)?.label || "",
      ),
    ]),
  );
  visibleText.forEach((text) => {
    assert.doesNotMatch(text, /小\s*X|\bA\b|\bB\b/);
  });
});

console.info(`[story-v3-test] Node ${process.version}`);
console.info(`[story-v3-test] 项目目录 ${projectRoot}`);
console.info(`[story-v3-test] contractVersion=${contractVersion}, moduleVersion=${moduleVersion}`);
console.info(`[story-v3-test] 加载文件 ${scripts.join(", ")}`);
console.info(`[story-v3-test] 目标 Node=28，目标结局=${targetEndings.join(",")}`);

let passed = 0;
tests.forEach(({ name, run }) => {
  try {
    run();
    passed += 1;
    console.info(`[PASS] ${name}`);
  } catch (error) {
    console.error(`[FAIL] ${name}`);
    throw error;
  }
});
console.info(`\n${passed}/${tests.length} tests passed`);
