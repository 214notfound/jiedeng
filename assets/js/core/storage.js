// 存档模块：按账户/游客保存完整状态快照，并在交给游戏流程前完成结构校验。

import { STORY_FACT_DEFINITIONS } from "./game-contract.js";
import {
  GAME_ID_PATTERN,
  SAVE_SCHEMA_VERSION,
  requireStorageScope
} from "./state.js";

const SAVE_KEY_PREFIX = "white-lamp:save";
const LEGACY_SCHEMA_VERSIONS = Object.freeze([1]);
const STORY_COMMAND_TYPES = new Set([
  "REQUEST_EXPLORATION",
  "REQUEST_CONVERSATION",
  "REQUEST_MINIGAME"
]);
const REGISTERED_FACT_IDS = new Set(
  STORY_FACT_DEFINITIONS.map((definition) => definition.id)
);

function success(data) {
  return data === undefined ? { ok: true } : { ok: true, data };
}

function failure(code, message, cause) {
  if (cause) {
    console.error(`[white-lamp:storage] ${code}`, cause);
  }

  return { ok: false, code, message };
}

function isPlainObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function isUniqueArray(value, itemValidator) {
  return (
    Array.isArray(value) &&
    value.every(itemValidator) &&
    new Set(value).size === value.length
  );
}

function isGameId(value) {
  return typeof value === "string" && GAME_ID_PATTERN.test(value);
}

function isNonEmptyString(value) {
  return typeof value === "string" && value.trim() !== "";
}

function hasGameIdArray(value) {
  return isUniqueArray(value, isGameId);
}

function hasTextArray(value) {
  return isUniqueArray(value, isNonEmptyString);
}

function hasBooleanRecord(value) {
  return isPlainObject(value) &&
    Object.values(value).every((item) => typeof item === "boolean");
}

function hasPuzzleState(value) {
  return isPlainObject(value) && typeof value.mapRestored === "boolean";
}

function isValidIsoDate(value) {
  return value === null ||
    (typeof value === "string" && !Number.isNaN(Date.parse(value)));
}

function hasPendingCommands(value) {
  if (!Array.isArray(value)) {
    return false;
  }

  const commandIds = [];
  for (const command of value) {
    if (
      !isPlainObject(command) ||
      !isGameId(command.commandId) ||
      !STORY_COMMAND_TYPES.has(command.commandType) ||
      !isGameId(command.targetId)
    ) {
      return false;
    }

    commandIds.push(command.commandId);
  }

  return new Set(commandIds).size === commandIds.length;
}

// 这里只校验检查点结构；Node、里程碑和命令是否属于当前剧情由剧情模块校验。
export function validateStoryCheckpoint(checkpoint) {
  if (checkpoint === null) {
    return true;
  }

  return (
    isPlainObject(checkpoint) &&
    isGameId(checkpoint.nodeId) &&
    Number.isInteger(checkpoint.nodeRevision) &&
    checkpoint.nodeRevision > 0 &&
    hasGameIdArray(checkpoint.completedMilestoneIds) &&
    hasGameIdArray(checkpoint.completedNodeIds) &&
    hasGameIdArray(checkpoint.completedStageIds) &&
    hasPendingCommands(checkpoint.pendingCommands)
  );
}

// 校验从本地存储读取出的完整 schema 2 状态。
export function validateGameState(value) {
  if (!isPlainObject(value)) {
    return false;
  }

  try {
    requireStorageScope(value.storageScope);
  } catch {
    return false;
  }

  const factsAreValid = isUniqueArray(
    value.facts,
    (factId) => isGameId(factId) && REGISTERED_FACT_IDS.has(factId)
  );

  const checkpointIsValid = validateStoryCheckpoint(value.storyCheckpoint);
  const checkpointMatchesLegacyView =
    checkpointIsValid &&
    (value.storyCheckpoint === null ||
      value.currentNodeId === value.storyCheckpoint.nodeId);

  return (
    value.schemaVersion === SAVE_SCHEMA_VERSION &&
    factsAreValid &&
    checkpointIsValid &&
    hasTextArray(value.processedRequestIds) &&
    hasTextArray(value.processedExternalEventIds) &&
    hasTextArray(value.appliedOnceKeys) &&

    // 兼容字段将在 storage.js 与页面全部切换到 storyCheckpoint 后移除。
    isGameId(value.currentNodeId) &&
    isGameId(value.stage) &&
    hasBooleanRecord(value.stageProgress) &&
    checkpointMatchesLegacyView &&

    hasGameIdArray(value.investigated) &&
    isPlainObject(value.explorationState) &&
    hasGameIdArray(value.talkedTo) &&
    isPlainObject(value.conversationState) &&
    hasGameIdArray(value.inventory) &&
    hasGameIdArray(value.clues) &&
    hasGameIdArray(value.unlockedLocations) &&
    hasPuzzleState(value.puzzle) &&
    isPlainObject(value.minigameState) &&
    hasBooleanRecord(value.choices) &&
    hasGameIdArray(value.achievements) &&
    isValidIsoDate(value.updatedAt)
  );
}

function getLocalStorage() {
  if (
    typeof globalThis.localStorage === "undefined" ||
    globalThis.localStorage === null
  ) {
    throw new Error("当前环境不支持 localStorage");
  }

  return globalThis.localStorage;
}

function requireSchemaVersion(schemaVersion) {
  if (!Number.isInteger(schemaVersion) || schemaVersion < 1) {
    throw new TypeError("schemaVersion 必须是正整数");
  }

  return schemaVersion;
}

// 默认生成当前版本存档键；内部也用它检查旧版本存档是否存在。
export function getSaveKey(
  storageScope,
  schemaVersion = SAVE_SCHEMA_VERSION
) {
  try {
    requireStorageScope(storageScope);
    requireSchemaVersion(schemaVersion);
  } catch (error) {
    throw new TypeError("无法生成存档键：存储域或版本无效", {
      cause: error
    });
  }

  return `${SAVE_KEY_PREFIX}:${storageScope}:v${schemaVersion}`;
}

function findLegacySave(storage, storageScope) {
  for (const schemaVersion of LEGACY_SCHEMA_VERSIONS) {
    const key = getSaveKey(storageScope, schemaVersion);
    if (storage.getItem(key) !== null) {
      return { key, schemaVersion };
    }
  }

  return null;
}

// 只允许保存已经经过剧情首次提交的完整状态快照。
export function saveGame(gameState, currentStorageScope) {
  try {
    requireStorageScope(currentStorageScope);
  } catch (error) {
    return failure(
      "SAVE_SCOPE_INVALID",
      "当前账户存储域无效，无法保存游戏。",
      error
    );
  }

  if (!isPlainObject(gameState)) {
    return failure("SAVE_INVALID", "游戏状态结构不正确，无法保存。");
  }

  if (gameState.schemaVersion !== SAVE_SCHEMA_VERSION) {
    return failure(
      "SAVE_VERSION_UNSUPPORTED",
      "当前进度版本与游戏不兼容，未覆盖原存档。"
    );
  }

  if (!validateGameState(gameState)) {
    return failure("SAVE_INVALID", "游戏状态结构不正确，无法保存。");
  }

  if (gameState.storageScope !== currentStorageScope) {
    return failure(
      "SAVE_SCOPE_MISMATCH",
      "当前游戏进度与登录账户不一致，请返回主菜单后重试。"
    );
  }

  if (gameState.storyCheckpoint === null) {
    return failure(
      "SAVE_STORY_NOT_STARTED",
      "剧情尚未完成初始化，请稍后再保存。"
    );
  }

  const snapshot = {
    ...gameState,
    updatedAt: new Date().toISOString()
  };

  try {
    // 先完整序列化，再写入一个存档键，避免只保存部分子状态。
    const serialized = JSON.stringify(snapshot);
    const stateToSave = JSON.parse(serialized);
    getLocalStorage().setItem(getSaveKey(currentStorageScope), serialized);

    return success({
      state: stateToSave,
      savedAt: stateToSave.updatedAt
    });
  } catch (error) {
    return failure(
      "STORAGE_UNAVAILABLE",
      "浏览器存储不可用，游戏未能保存。请检查浏览器设置后重试。",
      error
    );
  }
}

export function loadGame(storageScope) {
  try {
    requireStorageScope(storageScope);
  } catch (error) {
    return failure(
      "SAVE_SCOPE_INVALID",
      "当前账户存储域无效，无法读取存档。",
      error
    );
  }

  let storage;
  let rawValue;
  try {
    storage = getLocalStorage();
    rawValue = storage.getItem(getSaveKey(storageScope));
  } catch (error) {
    return failure(
      "STORAGE_UNAVAILABLE",
      "浏览器存储不可用，无法读取存档。",
      error
    );
  }

  if (rawValue === null) {
    try {
      const legacySave = findLegacySave(storage, storageScope);
      if (legacySave) {
        return failure(
          "SAVE_VERSION_UNSUPPORTED",
          `检测到版本 ${legacySave.schemaVersion} 的旧存档，当前版本无法安全恢复；旧存档已保留。`
        );
      }
    } catch (error) {
      return failure(
        "STORAGE_UNAVAILABLE",
        "浏览器存储不可用，无法检查旧存档。",
        error
      );
    }

    return failure("SAVE_NOT_FOUND", "暂无存档。");
  }

  let parsed;
  try {
    parsed = JSON.parse(rawValue);
  } catch (error) {
    return failure(
      "SAVE_INVALID",
      "存档无法读取。原存档已保留，你可以返回主菜单后重试。",
      error
    );
  }

  if (parsed?.schemaVersion !== SAVE_SCHEMA_VERSION) {
    return failure(
      "SAVE_VERSION_UNSUPPORTED",
      "存档版本与当前游戏不兼容，原存档已保留。"
    );
  }

  if (!validateGameState(parsed)) {
    return failure(
      "SAVE_INVALID",
      "存档结构不正确。原存档已保留，你可以返回主菜单后重试。"
    );
  }

  if (parsed.storageScope !== storageScope) {
    return failure(
      "SAVE_SCOPE_MISMATCH",
      "存档不属于当前账户，未加载该存档。"
    );
  }

  if (parsed.storyCheckpoint === null) {
    return failure(
      "SAVE_INVALID",
      "存档缺少剧情检查点，原存档已保留。"
    );
  }

  return success(parsed);
}

export function hasValidSave(storageScope) {
  return loadGame(storageScope).ok;
}

// 只有玩家已经明确确认删除或覆盖时才调用；同时清理当前和已知旧版本键。
export function deleteSave(storageScope) {
  try {
    requireStorageScope(storageScope);
  } catch (error) {
    return failure(
      "SAVE_SCOPE_INVALID",
      "当前账户存储域无效，无法删除存档。",
      error
    );
  }

  try {
    const storage = getLocalStorage();
    storage.removeItem(getSaveKey(storageScope));
    for (const schemaVersion of LEGACY_SCHEMA_VERSIONS) {
      storage.removeItem(getSaveKey(storageScope, schemaVersion));
    }
    return success();
  } catch (error) {
    return failure(
      "STORAGE_UNAVAILABLE",
      "存档未能删除。请检查浏览器设置后重试。",
      error
    );
  }
}
