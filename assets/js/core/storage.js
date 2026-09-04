// 这个文件主要是负责把游戏存档按账户/游客保存到浏览器、读取回来，并在使用前检查存档是否存在、格式正确且属于当前用户。

import {
  GAME_ID_PATTERN,
  SAVE_SCHEMA_VERSION,
  requireStorageScope
} from "./state.js";

const SAVE_KEY_PREFIX = "white-lamp:save"; //存档键名固定前缀

function success(data) {
  return data === undefined
    ? { ok: true }
    : { ok: true, data };
}


// 失败函数，当存档相关操作失败的时候，统一整理失败信息
// code:给程序员看的报错信息，message：给用户看的提示文字，cause:导致错误的原始信息
function failure(code, message, cause) {
  if (cause) {
    console.error(`[white-lamp:storage] ${code}`, cause);
  }

  return { ok: false, code, message };
}


// 检查从存档中读取的数据是否可靠，是不是“只装着合法游戏ID的数组”
function hasStringArray(value) {
  return (
    Array.isArray(value) && //先确定是不是数组
    value.every(            //再看是不是每一项都同时满足：
      (item) =>             //是字符串
        typeof item === "string" &&
        GAME_ID_PATTERN.test(item) //符合游戏iD的格式
    ) 
  );
}

//检查value是不是一个“属性值全部为true or false的普通对象”
function hasBooleanRecord(value) {
  return (
    value !== null &&
    typeof value === "object" &&
    !Array.isArray(value) &&
    Object.values(value).every(
      (item) => typeof item === "boolean"
    )
  );
}

//检查读出来的拼图状态是不是负荷项目规定的格式
function hasPuzzleState(value) {
  return (
    value !== null &&
    typeof value === "object" &&
    !Array.isArray(value) &&
    typeof value.mapRestored === "boolean"
  );
}


function isValidIsoDate(value) {
  return (
    value === null ||
    (
      typeof value === "string" &&
      !Number.isNaN(Date.parse(value))
    )
  );
}

// 检查一个对象是否符合 state.js 当前的存档结构。
export function validateGameState(value) {
  if (
    value === null ||
    typeof value !== "object" ||
    Array.isArray(value)
  ) {
    return false;
  }

  try {
    requireStorageScope(value.storageScope);
  } catch {
    return false;
  }

  return (
    value.schemaVersion === SAVE_SCHEMA_VERSION &&
    typeof value.currentNodeId === "string" &&
    GAME_ID_PATTERN.test(value.currentNodeId) &&
    typeof value.stage === "string" &&
    GAME_ID_PATTERN.test(value.stage) &&
    hasBooleanRecord(value.stageProgress) &&
    hasBooleanRecord(value.choices) &&
    hasStringArray(value.investigated) &&
    hasStringArray(value.talkedTo) &&
    hasStringArray(value.inventory) &&
    hasPuzzleState(value.puzzle) &&
    hasStringArray(value.achievements) &&
    isValidIsoDate(value.updatedAt)
  );
}

// 重点：先拿到存档键->
// 生成当前账户/游客对应的唯一游戏存档键。
export function getSaveKey(storageScope) {
  try {
    requireStorageScope(storageScope);
  } catch (error) {
    throw new TypeError(
      "无法生成存档键：storageScope 无效",
      { cause: error }
    );
  }

  return `${SAVE_KEY_PREFIX}:${storageScope}:v${SAVE_SCHEMA_VERSION}`;
}

function getLocalStorage() {
  if (
    typeof globalThis.localStorage === "undefined" ||
    globalThis.localStorage === null
  ) {
    throw new Error("当前环境不支持 localStorage");
  }

  return globalThis.localStorage; //返回的是浏览器提供的储存工具本身
}

// 保存成功时才更新 updatedAt；写入失败不会伪造成功状态。
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

  if (!validateGameState(gameState)) {
    return failure(
      "SAVE_INVALID",
      "游戏状态结构不正确，无法保存。"
    );
  }

  if (gameState.storageScope !== currentStorageScope) {
    return failure(
      "SAVE_SCOPE_MISMATCH",
      "当前游戏进度与登录账户不一致，请返回主菜单后重试。"
    );
  }

  const stateToSave = {
    ...gameState,
    updatedAt: new Date().toISOString()
  };

  try {
    getLocalStorage().setItem(
      getSaveKey(currentStorageScope),
      JSON.stringify(stateToSave)
    );  //熟悉的存储状态！
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

// 从浏览器中找到当前游客或当前账户的存档，确认他没有问题之后再把游戏状态读出来
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

  let rawValue;
  try {
    rawValue = getLocalStorage().getItem(
      getSaveKey(storageScope)
    );
  } catch (error) {
    return failure(
      "STORAGE_UNAVAILABLE",
      "浏览器存储不可用，无法读取存档。",
      error
    );
  }

  if (rawValue === null) {
    return failure(
      "SAVE_NOT_FOUND",
      "暂无存档。"
    );
  }

  let parsed;
  try {
    parsed = JSON.parse(rawValue);
  } catch (error) {
    return failure(
      "SAVE_INVALID",
      "存档无法读取。你可以返回主菜单，或新建游戏覆盖该存档。",
      error
    );
  }

  if (!validateGameState(parsed)) {
    return failure(
      "SAVE_INVALID",
      "存档无法读取。你可以返回主菜单，或新建游戏覆盖该存档。"
    );
  }

  if (parsed.storageScope !== storageScope) {
    return failure(
      "SAVE_SCOPE_MISMATCH",
      "存档不属于当前账户，未加载该存档。"
    );
  }

  return success(parsed);
}

// 只有“存在且通过完整校验”的存档才返回 true。
export function hasValidSave(storageScope) {
  return loadGame(storageScope).ok;
}

// 删除存档只供用户明确确认覆盖/删除时调用。
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
    getLocalStorage().removeItem(getSaveKey(storageScope));
    return success();
  } catch (error) {
    return failure(
      "STORAGE_UNAVAILABLE",
      "存档未能删除。请检查浏览器设置后重试。",
      error
    );
  }
}
