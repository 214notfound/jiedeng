// 全局游戏状态：创建初始状态、校验事实来源，并以不可变方式提交事件与剧情事务。

import {
  APP_EVENT_TYPES,
  EXTERNAL_EVENT_TYPES,
  GAME_EVENTS,
  STORY_FACT_DEFINITIONS,
  STORY_STATE_EVENT_TYPES
} from "./game-contract.js";

export { GAME_EVENTS };

// schema 2 加入 facts、storyCheckpoint 和幂等记录；旧 schema 1 不可直接恢复。
export const SAVE_SCHEMA_VERSION = 2;

const STORAGE_SCOPE_PATTERN = /^(guest|account:[A-Za-z0-9-]+)$/;
export const GAME_ID_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const FACT_BY_ID = new Map(
  STORY_FACT_DEFINITIONS.map((definition) => [definition.id, definition])
);

const EXTERNAL_EVENTS_BY_SOURCE = Object.freeze({
  exploration: [EXTERNAL_EVENT_TYPES.OBJECT_INVESTIGATED],
  conversation: [
    EXTERNAL_EVENT_TYPES.NPC_TALK_PROGRESS,
    EXTERNAL_EVENT_TYPES.NPC_TALKED
  ],
  minigame: [EXTERNAL_EVENT_TYPES.MAP_PUZZLE_COMPLETED]
});

const COMMAND_TYPE_BY_SOURCE = Object.freeze({
  exploration: "REQUEST_EXPLORATION",
  conversation: "REQUEST_CONVERSATION",
  minigame: "REQUEST_MINIGAME"
});

// 定义初始状态
export function createInitialGameState(storageScope) {
  return {
    schemaVersion: SAVE_SCHEMA_VERSION,
    storageScope: requireStorageScope(storageScope),
    updatedAt: null,

    facts: [],
    storyCheckpoint: null,
    processedRequestIds: [],
    processedExternalEventIds: [],
    appliedOnceKeys: [],

    // 兼容现有 storage.js；剧情位置仍以 storyCheckpoint 为唯一可信来源。
    currentNodeId: "prologue-wake",
    stage: "prologue",
    stageProgress: { "prologue-started": true },

    investigated: [],
    explorationState: {},
    talkedTo: [],
    conversationState: {},

    inventory: ["burned-work-id", "blue-glass-bead"],
    clues: [],
    unlockedLocations: [],

    puzzle: { mapRestored: false },
    minigameState: {},

    choices: {},
    achievements: []
  };
}

export function requireStorageScope(storageScope) {
  if (
    typeof storageScope !== "string" ||
    !STORAGE_SCOPE_PATTERN.test(storageScope)
  ) {
    throw new TypeError("storageScope 必须是 guest 或 account:<用户UUID>");
  }

  return storageScope;
}

function isPlainObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function requireState(gameState) {
  if (!isPlainObject(gameState)) {
    throw new TypeError("缺少有效的 gameState");
  }

  const arrayFields = [
    "facts",
    "processedRequestIds",
    "processedExternalEventIds",
    "appliedOnceKeys",
    "investigated",
    "talkedTo",
    "inventory",
    "clues",
    "unlockedLocations",
    "achievements"
  ];

  for (const field of arrayFields) {
    if (!Array.isArray(gameState[field])) {
      throw new TypeError(`gameState.${field} 必须是数组`);
    }
  }

  return gameState;
}

function requireText(value, fieldName) {
  if (typeof value !== "string" || value.trim() === "") {
    throw new TypeError(`${fieldName} 必须是非空字符串`);
  }

  return value;
}

function requireGameId(payload, fieldName, eventType) {
  const value = payload[fieldName];

  if (typeof value !== "string" || !GAME_ID_PATTERN.test(value)) {
    throw new TypeError(
      `${eventType} 的 ${fieldName} 必须是有效的 kebab-case ID`
    );
  }

  return value;
}

function addUnique(list, value) {
  return list.includes(value) ? list : [...list, value];
}

function addUniqueMany(list, values) {
  return values.reduce(addUnique, list);
}

function eventTypeOf(event) {
  if (!isPlainObject(event)) {
    throw new TypeError("游戏事件必须是对象");
  }

  return requireText(event.eventType ?? event.type, "游戏事件类型");
}

function payloadOf(event) {
  if (event.payload === undefined) {
    return {};
  }

  if (!isPlainObject(event.payload)) {
    throw new TypeError("游戏事件 payload 必须是对象");
  }

  return event.payload;
}

function targetIdOf(eventType, payload) {
  switch (eventType) {
    case STORY_STATE_EVENT_TYPES.STORY_FACT_RECORDED:
      return requireGameId(payload, "factId", eventType);
    case STORY_STATE_EVENT_TYPES.CHOICE_MADE:
      return requireGameId(payload, "choiceId", eventType);
    case STORY_STATE_EVENT_TYPES.ITEM_ACQUIRED:
      return requireGameId(payload, "itemId", eventType);
    case STORY_STATE_EVENT_TYPES.CLUE_RECORDED:
      return requireGameId(payload, "clueId", eventType);
    case STORY_STATE_EVENT_TYPES.LOCATION_UNLOCKED:
      return requireGameId(payload, "locationId", eventType);
    default:
      throw new Error(`state.js 不支持剧情状态事件：${eventType}`);
  }
}

function deriveFacts(facts, eventType, targetId) {
  const derivedFactIds = STORY_FACT_DEFINITIONS
    .filter(
      (definition) =>
        definition.producer === "state" &&
        definition.derivedFrom?.eventType === eventType &&
        definition.derivedFrom?.targetId === targetId
    )
    .map((definition) => definition.id);

  return addUniqueMany(facts, derivedFactIds);
}

function validateCheckpoint(checkpoint) {
  if (!isPlainObject(checkpoint)) {
    throw new TypeError("剧情事务缺少有效的 checkpoint");
  }

  if (!GAME_ID_PATTERN.test(checkpoint.nodeId)) {
    throw new TypeError("checkpoint.nodeId 必须是有效的游戏 ID");
  }

  if (!Number.isInteger(checkpoint.nodeRevision) || checkpoint.nodeRevision < 1) {
    throw new TypeError("checkpoint.nodeRevision 必须是正整数");
  }

  for (const field of [
    "completedMilestoneIds",
    "completedNodeIds",
    "completedStageIds"
  ]) {
    if (
      !Array.isArray(checkpoint[field]) ||
      checkpoint[field].some((id) => !GAME_ID_PATTERN.test(id)) ||
      new Set(checkpoint[field]).size !== checkpoint[field].length
    ) {
      throw new TypeError(`checkpoint.${field} 必须是无重复的游戏 ID 数组`);
    }
  }

  if (!Array.isArray(checkpoint.pendingCommands)) {
    throw new TypeError("checkpoint.pendingCommands 必须是数组");
  }

  const commandIds = [];
  for (const command of checkpoint.pendingCommands) {
    if (
      !isPlainObject(command) ||
      !GAME_ID_PATTERN.test(command.commandId) ||
      typeof command.commandType !== "string" ||
      !GAME_ID_PATTERN.test(command.targetId)
    ) {
      throw new TypeError("pendingCommands 中存在无效命令");
    }
    commandIds.push(command.commandId);
  }

  if (new Set(commandIds).size !== commandIds.length) {
    throw new TypeError("pendingCommands 中的 commandId 不能重复");
  }
}

function applyStoryStateEvent(gameState, event) {
  const eventType = eventTypeOf(event);
  const payload = payloadOf(event);
  requireText(event.eventId, `${eventType}.eventId`);
  const onceKey = requireText(event.onceKey, `${eventType}.onceKey`);

  if (gameState.appliedOnceKeys.includes(onceKey)) {
    return gameState;
  }

  const targetId = targetIdOf(eventType, payload);
  let nextState = gameState;

  switch (eventType) {
    case STORY_STATE_EVENT_TYPES.STORY_FACT_RECORDED: {
      const definition = FACT_BY_ID.get(targetId);
      if (!definition || definition.producer !== "story") {
        throw new Error(`剧情无权记录事实：${targetId}`);
      }
      nextState = { ...gameState, facts: addUnique(gameState.facts, targetId) };
      break;
    }

    case STORY_STATE_EVENT_TYPES.CHOICE_MADE:
      nextState = {
        ...gameState,
        choices: { ...gameState.choices, [targetId]: true }
      };
      break;

    case STORY_STATE_EVENT_TYPES.ITEM_ACQUIRED:
      nextState = {
        ...gameState,
        inventory: addUnique(gameState.inventory, targetId)
      };
      break;

    case STORY_STATE_EVENT_TYPES.CLUE_RECORDED:
      nextState = {
        ...gameState,
        clues: addUnique(gameState.clues, targetId)
      };
      break;

    case STORY_STATE_EVENT_TYPES.LOCATION_UNLOCKED:
      nextState = {
        ...gameState,
        unlockedLocations: addUnique(gameState.unlockedLocations, targetId)
      };
      break;
  }

  return {
    ...nextState,
    facts: deriveFacts(nextState.facts, eventType, targetId),
    appliedOnceKeys: addUnique(nextState.appliedOnceKeys, onceKey)
  };
}

// 提交探索、对话或小游戏产生的外部事件。
// 本函数只记录已经发生的事实，不决定下一剧情 Node。
export function applyExternalEvent(gameState, event) {
  requireState(gameState);

  const eventType = eventTypeOf(event);
  const eventId = requireText(event.eventId, `${eventType}.eventId`);
  const source = requireText(event.source, `${eventType}.source`);
  const payload = payloadOf(event);

  if (gameState.processedExternalEventIds.includes(eventId)) {
    return gameState;
  }

  if (!Array.isArray(event.resultFactIds)) {
    throw new TypeError(`${eventType}.resultFactIds 必须是数组`);
  }

  if (new Set(event.resultFactIds).size !== event.resultFactIds.length) {
    throw new TypeError(`${eventType}.resultFactIds 不能包含重复事实`);
  }

  const isCancelled =
    eventType === EXTERNAL_EVENT_TYPES.EXTERNAL_INTERACTION_CANCELLED;
  const isFailed =
    eventType === EXTERNAL_EVENT_TYPES.EXTERNAL_INTERACTION_FAILED;
  const sourceCommandType = COMMAND_TYPE_BY_SOURCE[source];

  if (!sourceCommandType) {
    throw new Error(`未登记的外部事件来源：${source}`);
  }

  if ((isCancelled || isFailed) && event.resultFactIds.length !== 0) {
    throw new Error(`${eventType} 的 resultFactIds 必须为空`);
  }

  if (!isCancelled && !isFailed) {
    const allowedTypes = EXTERNAL_EVENTS_BY_SOURCE[source];
    if (!allowedTypes.includes(eventType)) {
      throw new Error(`${source} 无权产生事件：${eventType}`);
    }
  }

  const checkpoint = gameState.storyCheckpoint;
  if (!checkpoint) {
    throw new Error("当前没有可接收外部结果的剧情检查点");
  }

  const causedByCommandId = requireText(
    event.causedByCommandId,
    `${eventType}.causedByCommandId`
  );
  const pendingCommand = checkpoint.pendingCommands.find(
    (command) => command.commandId === causedByCommandId
  );

  if (!pendingCommand) {
    throw new Error(`外部事件对应的剧情命令已失效：${causedByCommandId}`);
  }

  if (pendingCommand.commandType !== sourceCommandType) {
    throw new Error(`${source} 与等待中的命令类型不匹配`);
  }

  for (const factId of event.resultFactIds) {
    const definition = FACT_BY_ID.get(factId);
    if (!definition) {
      throw new Error(`外部事件声明了未登记事实：${factId}`);
    }
    if (definition.producer !== source) {
      throw new Error(`${source} 无权产生事实：${factId}`);
    }
  }

  let nextState = {
    ...gameState,
    facts: addUniqueMany(gameState.facts, event.resultFactIds),
    processedExternalEventIds: addUnique(
      gameState.processedExternalEventIds,
      eventId
    )
  };

  if (eventType === EXTERNAL_EVENT_TYPES.OBJECT_INVESTIGATED) {
    nextState = {
      ...nextState,
      investigated: addUnique(
        nextState.investigated,
        requireGameId(payload, "objectId", eventType)
      )
    };
  }

  if (eventType === EXTERNAL_EVENT_TYPES.NPC_TALKED) {
    nextState = {
      ...nextState,
      talkedTo: addUnique(
        nextState.talkedTo,
        requireGameId(payload, "npcId", eventType)
      )
    };
  }

  if (eventType === EXTERNAL_EVENT_TYPES.MAP_PUZZLE_COMPLETED) {
    const puzzleId = requireGameId(payload, "puzzleId", eventType);
    if (puzzleId !== "map-puzzle") {
      throw new Error(`未知的拼图 ID：${puzzleId}`);
    }
    nextState = {
      ...nextState,
      puzzle: { ...nextState.puzzle, mapRestored: true }
    };
  }

  return nextState;
}

// 原子提交剧情返回的检查点和状态事件：任意一步抛错时，旧状态不会被修改。
export function commitStoryTransaction(gameState, requestId, commit) {
  requireState(gameState);
  requireText(requestId, "requestId");

  if (gameState.processedRequestIds.includes(requestId)) {
    return gameState;
  }

  if (!isPlainObject(commit) || !Array.isArray(commit.events)) {
    throw new TypeError("剧情响应缺少有效的 commit.events");
  }

  validateCheckpoint(commit.checkpoint);

  let draft = gameState;
  for (const event of commit.events) {
    draft = applyStoryStateEvent(draft, event);
  }

  return {
    ...draft,
    // 临时同步旧字段，避免 storage.js 完成升级前无法保存新状态。
    currentNodeId: commit.checkpoint.nodeId,
    storyCheckpoint: {
      ...commit.checkpoint,
      completedMilestoneIds: [...commit.checkpoint.completedMilestoneIds],
      completedNodeIds: [...commit.checkpoint.completedNodeIds],
      completedStageIds: [...commit.checkpoint.completedStageIds],
      pendingCommands: commit.checkpoint.pendingCommands.map((command) => ({
        ...command
      }))
    },
    processedRequestIds: addUnique(draft.processedRequestIds, requestId)
  };
}

// 处理不经过剧情的应用内部事件；剧情状态事件应通过 commitStoryTransaction 提交。
export function applyGameEvent(gameState, event) {
  requireState(gameState);
  const eventType = eventTypeOf(event);
  const payload = payloadOf(event);

  switch (eventType) {
    case APP_EVENT_TYPES.GAME_STARTED:
      return createInitialGameState(gameState.storageScope);

    case APP_EVENT_TYPES.ACHIEVEMENT_UNLOCKED: {
      const achievementId = requireGameId(payload, "achievementId", eventType);
      return {
        ...gameState,
        achievements: addUnique(gameState.achievements, achievementId)
      };
    }

    default:
      if (Object.values(STORY_STATE_EVENT_TYPES).includes(eventType)) {
        return applyStoryStateEvent(gameState, event);
      }
      throw new Error(`state.js 不支持事件：${eventType}`);
  }
}
