// 本文件在 Node 内存环境中验证剧情数据、统一入口、完整 V1 流程、幂等字段和显式错误。
"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const projectRoot = path.resolve(__dirname, "../..");
const scripts = [
  "assets/js/game-line/data/story-registry.js",
  "assets/js/game-line/data/prologue.js",
  "assets/js/game-line/data/village.js",
  "assets/js/game-line/data/old-house.js",
  "assets/js/game-line/game/story-validator.js",
  "assets/js/game-line/game/story-runtime.js",
  "assets/js/game-line/game/story-request.js",
  "assets/js/game-line/game/story-engine.js",
];

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function createHarness() {
  const infoLogs = [];
  const errorLogs = [];
  const context = {
    console: {
      info(...args) {
        infoLogs.push(args);
      },
      error(...args) {
        errorLogs.push(args);
      },
    },
  };
  context.window = context;
  vm.createContext(context);
  scripts.forEach((relativePath) => {
    const source = fs.readFileSync(path.join(projectRoot, relativePath), "utf8");
    vm.runInContext(source, context, { filename: relativePath });
  });
  return {
    context,
    data: context.WhiteLampStoryInternal.storyData,
    rules: context.WhiteLampStoryInternal.storyRules,
    createStoryEngine: context.WhiteLampStoryInternal.createStoryEngine,
    enterStory: context.WhiteLamp.story.enterStory,
    infoLogs,
    errorLogs,
  };
}

function createGame(harness) {
  const state = {
    facts: [],
    checkpoint: null,
    inventory: ["burned-work-id", "blue-glass-bead"],
    clues: [],
    locations: [],
    choices: [],
    appliedOnceKeys: [],
  };
  let requestNumber = 0;
  let externalEventNumber = 0;
  let latestResponse = null;

  function addUnique(values, value) {
    if (!values.includes(value)) {
      values.push(value);
    }
  }

  function applyCommit(commit) {
    state.checkpoint = clone(commit.checkpoint);
    commit.events.forEach((event) => {
      if (state.appliedOnceKeys.includes(event.onceKey)) {
        return;
      }
      state.appliedOnceKeys.push(event.onceKey);
      if (event.eventType === "STORY_FACT_RECORDED") {
        addUnique(state.facts, event.payload.factId);
      } else if (event.eventType === "ITEM_ACQUIRED") {
        addUnique(state.inventory, event.payload.itemId);
      } else if (event.eventType === "CLUE_RECORDED") {
        addUnique(state.clues, event.payload.clueId);
      } else if (event.eventType === "LOCATION_UNLOCKED") {
        addUnique(state.locations, event.payload.locationId);
      } else if (event.eventType === "CHOICE_MADE") {
        addUnique(state.choices, event.payload.choiceId);
      }

      harness.data.facts
        .filter(
          (fact) =>
            fact.producer === "state" &&
            fact.derivedFrom &&
            fact.derivedFrom.eventType === event.eventType &&
            fact.derivedFrom.targetId ===
              (event.payload.itemId || event.payload.locationId),
        )
        .forEach((fact) => addUnique(state.facts, fact.id));
    });
  }

  function call(input, options) {
    const request = {
      contractVersion: "1.0",
      requestId:
        options && options.requestId
          ? options.requestId
          : `story-test-request-${++requestNumber}`,
      source: "story-test",
      input,
      context: {
        facts: state.facts.slice(),
        storyCheckpoint: state.checkpoint ? clone(state.checkpoint) : null,
      },
    };
    latestResponse = harness.enterStory(request);
    if (latestResponse.status !== "error" && (!options || options.commit !== false)) {
      applyCommit(latestResponse.commit);
    }
    return latestResponse;
  }

  function start() {
    return call({ type: "new-game" });
  }

  function action(actionId) {
    return call({ type: "story-action", actionId });
  }

  function external(commandId, eventType, source, resultFactIds, payload) {
    resultFactIds.forEach((factId) => addUnique(state.facts, factId));
    return call({
      type: "external-event",
      event: {
        eventId: `story-test-external-${++externalEventNumber}`,
        eventType,
        source,
        causedByCommandId: commandId,
        resultFactIds: resultFactIds.slice(),
        payload: clone(payload),
      },
    });
  }

  function resume() {
    return call({ type: "resume" });
  }

  function command(targetId) {
    return latestResponse.commands.find((item) => item.payload.conversationId === targetId || item.payload.explorationId === targetId || item.payload.minigameId === targetId);
  }

  return {
    state,
    start,
    action,
    external,
    resume,
    command,
    get latestResponse() {
      return latestResponse;
    },
  };
}

function completePrologueAndArrival(game) {
  assert.equal(game.start().status, "ready");
  assert.equal(game.action("confirm-wake-context").status, "waiting-external");

  let command = game.command("prologue-briefing");
  game.external(
    command.commandId,
    "NPC_TALKED",
    "conversation",
    ["surface-investigation-task-known"],
    { conversationId: "prologue-briefing", npcId: "companion-x" },
  );

  command = game.command("shrine-belongings");
  const firstInvestigation = game.external(
    command.commandId,
    "OBJECT_INVESTIGATED",
    "exploration",
    ["burned-work-id-investigated"],
    { objectId: "burned-work-id" },
  );
  assert.equal(firstInvestigation.status, "waiting-external");
  assert.equal(firstInvestigation.commands[0].commandId, command.commandId);

  game.external(
    command.commandId,
    "OBJECT_INVESTIGATED",
    "exploration",
    ["blue-glass-bead-investigated"],
    { objectId: "blue-glass-bead" },
  );
  command = game.command("prologue-key-and-memory");
  const keyResponse = game.external(
    command.commandId,
    "NPC_TALKED",
    "conversation",
    ["key-a-given-by-x"],
    { conversationId: "prologue-key-and-memory", npcId: "companion-x" },
  );
  assert.equal(keyResponse.status, "ready");
  assert.equal(keyResponse.commit.checkpoint.nodeId, "prologue-white-lamp");
  assert.equal(game.state.inventory.includes("key-a"), true);

  game.action("confirm-white-lamp");
  command = game.command("prologue-lamp-incident");
  const lampResponse = game.external(
    command.commandId,
    "NPC_TALKED",
    "conversation",
    ["prologue-lamp-incident-understood"],
    { conversationId: "prologue-lamp-incident", npcId: "companion-x" },
  );
  assert.equal(lampResponse.status, "ready");
  assert.equal(lampResponse.presentation.actions[0].actionId, "leave-shrine");

  const villageResponse = game.action("leave-shrine");
  assert.equal(villageResponse.commit.checkpoint.nodeId, "village-arrival");
  command = game.command("village-arrival-observation");
  game.external(
    command.commandId,
    "OBJECT_INVESTIGATED",
    "exploration",
    ["village-decline-observed"],
    { objectId: "village-entrance" },
  );
  const inquiriesResponse = game.external(
    command.commandId,
    "OBJECT_INVESTIGATED",
    "exploration",
    ["su-he-missing-notice-observed"],
    { objectId: "su-he-missing-notice" },
  );
  assert.equal(inquiriesResponse.commit.checkpoint.nodeId, "village-inquiries");
  assert.equal(inquiriesResponse.commands.length, 3);
}

const villagerCases = {
  shopkeeper: {
    targetId: "village-shopkeeper-inquiry",
    npcId: "villager-1",
    factId: "shopkeeper-inquiry-completed",
    itemId: "map-fragment-1",
  },
  holdout: {
    targetId: "village-holdout-inquiry",
    npcId: "villager-2",
    factId: "holdout-inquiry-completed",
    itemId: "map-fragment-2",
  },
  elder: {
    targetId: "village-elder-inquiry",
    npcId: "villager-3",
    factId: "elder-inquiry-completed",
    itemId: "map-fragment-3",
  },
};

function completeVillagers(game, order) {
  order.forEach((name) => {
    const current = villagerCases[name];
    const command = game.command(current.targetId);
    assert.ok(command, `缺少村民命令：${current.targetId}`);
    game.external(
      command.commandId,
      "NPC_TALKED",
      "conversation",
      [current.factId],
      { conversationId: current.targetId, npcId: current.npcId },
    );
    assert.equal(game.state.inventory.includes(current.itemId), true);
  });
  assert.equal(game.state.checkpoint.nodeId, "village-map-and-route");
  assert.equal(game.latestResponse.commands[0].commandType, "REQUEST_MINIGAME");
}

function completeRemainingStory(game) {
  let command = game.command("map-puzzle");
  const mapResponse = game.external(
    command.commandId,
    "MAP_PUZZLE_COMPLETED",
    "minigame",
    ["map-puzzle-completed"],
    { puzzleId: "map-puzzle" },
  );
  assert.equal(mapResponse.status, "ready");
  assert.deepEqual(
    Array.from(mapResponse.commit.events, (event) => event.eventType).sort(),
    ["ITEM_ACQUIRED", "LOCATION_UNLOCKED"],
  );
  assert.equal(game.state.inventory.includes("restored-village-map"), true);
  assert.equal(game.state.locations.includes("old-house"), true);

  game.action("go-old-house");
  command = game.command("old-house-door");
  game.external(
    command.commandId,
    "OBJECT_INVESTIGATED",
    "exploration",
    ["old-house-door-opened"],
    { objectId: "old-house-door" },
  );

  command = game.command("old-house-clues");
  const clues = [
    ["old-photograph-clue-known", "old-photograph"],
    ["school-uniform-clue-known", "school-uniform"],
    ["height-marks-clue-known", "height-marks"],
    ["funeral-list-clue-known", "funeral-list"],
  ];
  clues.forEach(([factId, objectId]) =>
    game.external(
      command.commandId,
      "OBJECT_INVESTIGATED",
      "exploration",
      [factId],
      { objectId },
    ),
  );
  assert.deepEqual(game.state.clues.slice().sort(), clues.map((item) => item[1]).sort());

  command = game.command("old-house-clue-confrontation");
  game.external(
    command.commandId,
    "NPC_TALKED",
    "conversation",
    ["old-house-identity-conflict-raised"],
    { conversationId: "old-house-clue-confrontation", npcId: "companion-x" },
  );
  command = game.command("old-house-door-call");
  const endingPrompt = game.external(
    command.commandId,
    "NPC_TALKED",
    "conversation",
    ["door-call-incident-completed"],
    { conversationId: "old-house-door-call", npcId: "unknown-caller" },
  );
  assert.equal(endingPrompt.status, "ready");
  assert.equal(endingPrompt.commit.checkpoint.nodeId, "week-one-end");

  const ended = game.action("confirm-week-one-end");
  assert.equal(ended.status, "ended");
  assert.equal(ended.commit.checkpoint.completedNodeIds.length, 11);
  assert.deepEqual(Array.from(ended.commit.checkpoint.completedStageIds), [
    "prologue",
    "village",
    "old-house",
  ]);
  assert.equal(
    ended.notifications.some((event) => event.eventType === "STORY_ENDED"),
    true,
  );
  return ended;
}

function permutations(values) {
  if (values.length <= 1) {
    return [values.slice()];
  }
  return values.flatMap((value, index) =>
    permutations(values.filter((_, currentIndex) => currentIndex !== index)).map(
      (rest) => [value, ...rest],
    ),
  );
}

const tests = [];

function test(name, run) {
  tests.push({ name, run });
}

test("V1 数据通过预检且固定数量、起止点和 ID 正确", () => {
  const harness = createHarness();
  const result = harness.rules.validateStoryData(harness.data);
  assert.equal(result.ok, true, result.issues.join("\n"));
  assert.equal(harness.data.nodes.length, 11);
  assert.equal(harness.data.facts.length, 30);
  assert.equal(
    harness.data.nodes.reduce((count, node) => count + node.transitions.length, 0),
    10,
  );
  assert.equal(harness.data.startNodeId, "prologue-wake");
  assert.equal(harness.data.endNodeId, "week-one-end");
  assert.equal(
    harness.data.nodes.flatMap((node) => node.actions).some((action) => action.actionType === "choice"),
    false,
  );
  assert.equal(harness.infoLogs.length >= 1, true);
});

test("新游戏返回完整 ready 响应且不修改请求", () => {
  const harness = createHarness();
  const request = {
    contractVersion: "1.0",
    requestId: "immutable-request",
    source: "test",
    input: { type: "new-game" },
    context: { facts: [], storyCheckpoint: null },
  };
  const before = JSON.stringify(request);
  const response = harness.enterStory(request);
  assert.equal(JSON.stringify(request), before);
  assert.equal(response.status, "ready");
  assert.equal(response.requestId, request.requestId);
  assert.equal(response.commit.checkpoint.nodeId, "prologue-wake");
  assert.equal(response.presentation.actions[0].actionId, "confirm-wake-context");
  assert.deepEqual(Array.from(response.commands), []);
  assert.equal(response.error, null);
});

test("同一请求和上下文产生相同事件 ID 与 onceKey", () => {
  const harness = createHarness();
  const game = createGame(harness);
  game.start();
  const request = {
    contractVersion: "1.0",
    requestId: "same-request",
    source: "test",
    input: { type: "story-action", actionId: "confirm-wake-context" },
    context: {
      facts: game.state.facts.slice(),
      storyCheckpoint: clone(game.state.checkpoint),
    },
  };
  const first = harness.enterStory(clone(request));
  const second = harness.enterStory(clone(request));
  assert.equal(JSON.stringify(first), JSON.stringify(second));
  assert.equal(first.commit.events[0].onceKey, "prologue-wake:confirm-wake-context:record-wake-context");
});

test("读档恢复同一个等待命令", () => {
  const harness = createHarness();
  const game = createGame(harness);
  game.start();
  const waiting = game.action("confirm-wake-context");
  const commandId = waiting.commands[0].commandId;
  const resumed = game.resume();
  assert.equal(resumed.status, "waiting-external");
  assert.equal(resumed.commands[0].commandId, commandId);
});

test("多轮谈话进展保留命令，完成事件才推进", () => {
  const harness = createHarness();
  const game = createGame(harness);
  game.start();
  game.action("confirm-wake-context");
  const command = game.command("prologue-briefing");
  const progress = game.external(
    command.commandId,
    "NPC_TALK_PROGRESS",
    "conversation",
    [],
    { conversationId: "prologue-briefing", npcId: "companion-x" },
  );
  assert.equal(progress.status, "waiting-external");
  assert.equal(progress.commands[0].commandId, command.commandId);
  assert.equal(progress.commit.checkpoint.nodeId, "prologue-wake");
});

test("取消会恢复原命令，外部失败会明确报错", () => {
  const harness = createHarness();
  const game = createGame(harness);
  game.start();
  game.action("confirm-wake-context");
  const command = game.command("prologue-briefing");
  const cancelled = game.external(
    command.commandId,
    "EXTERNAL_INTERACTION_CANCELLED",
    "conversation",
    [],
    { targetId: "prologue-briefing" },
  );
  assert.equal(cancelled.status, "waiting-external");
  assert.equal(cancelled.commands[0].commandId, command.commandId);
  const spoofed = game.external(
    command.commandId,
    "NPC_TALK_PROGRESS",
    "exploration",
    [],
    { conversationId: "prologue-briefing", npcId: "companion-x" },
  );
  assert.equal(spoofed.error.errorCode, "STORY_INVALID_REQUEST");
  const failed = game.external(
    command.commandId,
    "EXTERNAL_INTERACTION_FAILED",
    "conversation",
    [],
    { targetId: "prologue-briefing", errorCode: "DIALOGUE_LOAD_FAILED" },
  );
  assert.equal(failed.status, "error");
  assert.equal(failed.error.errorCode, "STORY_EXTERNAL_FAILED");
});

test("三名村民六种顺序均可完成且各发一次碎片", () => {
  const orders = [
    ["shopkeeper", "holdout", "elder"],
    ["shopkeeper", "elder", "holdout"],
    ["holdout", "shopkeeper", "elder"],
    ["holdout", "elder", "shopkeeper"],
    ["elder", "shopkeeper", "holdout"],
    ["elder", "holdout", "shopkeeper"],
  ];
  orders.forEach((order) => {
    const game = createGame(createHarness());
    completePrologueAndArrival(game);
    completeVillagers(game, order);
    assert.equal(
      game.state.inventory.filter((id) => id.startsWith("map-fragment-")).length,
      3,
    );
  });
});

test("完整 V1 可从起点运行到终点并正确结算", () => {
  const game = createGame(createHarness());
  completePrologueAndArrival(game);
  completeVillagers(game, ["elder", "shopkeeper", "holdout"]);
  const ended = completeRemainingStory(game);
  assert.equal(ended.commit.checkpoint.nodeId, "week-one-end");
  assert.equal(game.state.inventory.length, 7);
  assert.equal(game.state.clues.length, 4);
});

test("老宅四项调查的全部二十四种顺序都能完成且不重复记线索", () => {
  const clues = [
    ["old-photograph-clue-known", "old-photograph"],
    ["school-uniform-clue-known", "school-uniform"],
    ["height-marks-clue-known", "height-marks"],
    ["funeral-list-clue-known", "funeral-list"],
  ];
  permutations(clues).forEach((order) => {
    const harness = createHarness();
    const game = createGame(harness);
    game.state.facts.push("old-house-door-opened");
    game.state.checkpoint = {
      nodeId: "old-house-investigation",
      nodeRevision: 1,
      completedMilestoneIds: [],
      completedNodeIds: [],
      completedStageIds: [],
      pendingCommands: [],
    };
    game.resume();
    const command = game.command("old-house-clues");
    order.forEach(([factId, objectId]) =>
      game.external(
        command.commandId,
        "OBJECT_INVESTIGATED",
        "exploration",
        [factId],
        { objectId },
      ),
    );
    assert.equal(game.state.checkpoint.nodeId, "old-house-clue-confrontation");
    assert.equal(game.state.clues.length, 4);
  });
});

test("未知 Node、错误 revision、非法操作和过期事件显式报错", () => {
  const harness = createHarness();
  const game = createGame(harness);
  game.start();

  const unknownCheckpoint = clone(game.state.checkpoint);
  unknownCheckpoint.nodeId = "missing-node";
  let response = harness.enterStory({
    contractVersion: "1.0",
    requestId: "unknown-node",
    source: "test",
    input: { type: "resume" },
    context: { facts: [], storyCheckpoint: unknownCheckpoint },
  });
  assert.equal(response.error.errorCode, "STORY_UNKNOWN_NODE");

  const wrongRevision = clone(game.state.checkpoint);
  wrongRevision.nodeRevision = 99;
  response = harness.enterStory({
    contractVersion: "1.0",
    requestId: "wrong-revision",
    source: "test",
    input: { type: "resume" },
    context: { facts: [], storyCheckpoint: wrongRevision },
  });
  assert.equal(response.error.errorCode, "STORY_REVISION_MISMATCH");

  response = game.action("not-an-action");
  assert.equal(response.error.errorCode, "STORY_INVALID_ACTION");

  game.action("confirm-wake-context");
  response = game.external(
    "cmd-stale-command",
    "NPC_TALKED",
    "conversation",
    [],
    { conversationId: "missing", npcId: "companion-x" },
  );
  assert.equal(response.error.errorCode, "STORY_STALE_EXTERNAL_EVENT");
});

test("对话宣告完成但事实不足时保留旧检查点并报错", () => {
  const harness = createHarness();
  const game = createGame(harness);
  game.start();
  game.action("confirm-wake-context");
  const before = clone(game.state.checkpoint);
  const command = game.command("prologue-briefing");
  const response = game.external(
    command.commandId,
    "NPC_TALKED",
    "conversation",
    [],
    { conversationId: "prologue-briefing", npcId: "companion-x" },
  );
  assert.equal(response.error.errorCode, "STORY_EXTERNAL_RESULT_INCOMPLETE");
  assert.equal(JSON.stringify(game.state.checkpoint), JSON.stringify(before));
});

test("坏数据、冲突转移和无可用出口分别停止推进", () => {
  const harness = createHarness();
  const badData = clone(harness.data);
  badData.nodes[1].id = badData.nodes[0].id;
  let engine = harness.createStoryEngine(badData);
  let response = engine.enterStory({
    contractVersion: "1.0",
    requestId: "bad-data",
    source: "test",
    input: { type: "new-game" },
    context: { facts: [], storyCheckpoint: null },
  });
  assert.equal(response.error.errorCode, "STORY_INVALID_NODE_DATA");

  const unreadableData = clone(harness.data);
  unreadableData.nodes[0].milestones = {};
  engine = harness.createStoryEngine(unreadableData);
  response = engine.enterStory({
    contractVersion: "1.0",
    requestId: "unreadable-data",
    source: "test",
    input: { type: "new-game" },
    context: { facts: [], storyCheckpoint: null },
  });
  assert.equal(response.error.errorCode, "STORY_INVALID_NODE_DATA");

  const completeFacts = [
    "prologue-wake-context-known",
    "surface-investigation-task-known",
  ];
  const completeCheckpoint = {
    nodeId: "prologue-wake",
    nodeRevision: 1,
    completedMilestoneIds: [],
    completedNodeIds: [],
    completedStageIds: [],
    pendingCommands: [],
  };
  const ambiguousData = clone(harness.data);
  ambiguousData.nodes[0].transitions = [
    {
      id: "branch-one",
      to: "prologue-belongings",
      when: { allFacts: ["surface-investigation-task-known"] },
    },
    {
      id: "branch-two",
      to: "prologue-belongings",
      when: { allFacts: ["prologue-wake-context-known"] },
    },
  ];
  engine = harness.createStoryEngine(ambiguousData);
  response = engine.enterStory({
    contractVersion: "1.0",
    requestId: "ambiguous",
    source: "test",
    input: { type: "resume" },
    context: { facts: completeFacts, storyCheckpoint: completeCheckpoint },
  });
  assert.equal(response.error.errorCode, "STORY_AMBIGUOUS_TRANSITION");

  const noTransitionData = clone(harness.data);
  noTransitionData.nodes[0].transitions = [
    {
      id: "unmatched-branch",
      to: "prologue-belongings",
      when: { allFacts: ["old-house-door-opened"] },
    },
  ];
  engine = harness.createStoryEngine(noTransitionData);
  response = engine.enterStory({
    contractVersion: "1.0",
    requestId: "no-transition",
    source: "test",
    input: { type: "resume" },
    context: { facts: completeFacts, storyCheckpoint: completeCheckpoint },
  });
  assert.equal(response.error.errorCode, "STORY_NO_TRANSITION");
});

test("通用 choice 能力保留，但不写入 V1 正式数据", () => {
  const harness = createHarness();
  const choiceData = clone(harness.data);
  const action = choiceData.nodes[0].actions[0];
  choiceData.facts.push({
    id: "test-choice-chosen",
    producer: "state",
    derivedFrom: { eventType: "CHOICE_MADE", targetId: "test-choice" },
  });
  action.id = "test-choice";
  action.label = "测试选择";
  action.actionType = "choice";
  action.availableWhen = { noneFacts: ["test-choice-chosen"] };
  action.effect = {
    id: "record-test-choice",
    eventType: "CHOICE_MADE",
    payload: { choiceId: "test-choice" },
  };
  choiceData.nodes[0].presentations[0].actionIds = ["test-choice"];
  const engine = harness.createStoryEngine(choiceData);
  const first = engine.enterStory({
    contractVersion: "1.0",
    requestId: "choice-start",
    source: "test",
    input: { type: "new-game" },
    context: { facts: [], storyCheckpoint: null },
  });
  const response = engine.enterStory({
    contractVersion: "1.0",
    requestId: "choice-action",
    source: "test",
    input: { type: "story-action", actionId: "test-choice" },
    context: {
      facts: [],
      storyCheckpoint: clone(first.commit.checkpoint),
    },
  });
  assert.equal(response.status, "ready");
  assert.equal(response.commit.events[0].eventType, "CHOICE_MADE");
  assert.equal(response.commit.events[0].payload.choiceId, "test-choice");
});

test("修改展示措辞和块数量不会改变剧情推进字段", () => {
  const harness = createHarness();
  const editedData = clone(harness.data);
  const presentation = editedData.nodes[0].presentations[0];
  presentation.blocks[0].text = "这是一段随时可以继续修改的开场初稿。";
  presentation.blocks.push({
    id: "extra-editable-copy",
    blockType: "narration",
    text: "增加这一段不应改变 Node、里程碑或操作 ID。",
  });
  const engine = harness.createStoryEngine(editedData);
  assert.equal(engine.validation.ok, true, engine.validation.issues.join("\n"));
  const response = engine.enterStory({
    contractVersion: "1.0",
    requestId: "edited-copy",
    source: "test",
    input: { type: "new-game" },
    context: { facts: [], storyCheckpoint: null },
  });
  assert.equal(response.commit.checkpoint.nodeId, "prologue-wake");
  assert.equal(response.commit.checkpoint.nodeRevision, 1);
  assert.equal(response.presentation.blocks.length, 3);
  assert.equal(response.presentation.actions[0].actionId, "confirm-wake-context");
});

async function main() {
  console.log("[story-test] Node", process.version);
  console.log("[story-test] 接口版本 1.0，目标路径 prologue-wake -> week-one-end");
  let passed = 0;
  for (const currentTest of tests) {
    try {
      await currentTest.run();
      passed += 1;
      console.log(`[PASS] ${currentTest.name}`);
    } catch (error) {
      console.error(`[FAIL] ${currentTest.name}`);
      console.error(error);
      process.exitCode = 1;
    }
  }
  console.log(`\n${passed}/${tests.length} tests passed`);
}

main().catch((error) => {
  console.error("[FAIL] 剧情测试执行器发生未处理错误");
  console.error(error);
  process.exitCode = 1;
});
