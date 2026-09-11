// 成就页读档结果适配：只决定展示方式，不修复、覆盖或写回存档。
const FAILURE_MESSAGES = Object.freeze({
  SAVE_INVALID: "游戏存档损坏，暂时无法读取成就。",
  SAVE_VERSION_UNSUPPORTED: "游戏存档版本不兼容，暂时无法读取成就。",
  SAVE_SCOPE_MISMATCH: "当前登录身份与游戏存档不匹配。",
  STORAGE_UNAVAILABLE: "浏览器存储不可用，暂时无法读取成就。"
});

function emptyAchievementState() {
  return {
    facts: [],
    achievements: [],
    achievementTimes: {}
  };
}

export function resolveAchievementLoadResult(loadResult) {
  if (!loadResult || typeof loadResult.ok !== "boolean") {
    return {
      ok: false,
      message: "暂时无法读取成就，请返回主菜单重试。"
    };
  }

  if (loadResult.ok) {
    return {ok: true, state: loadResult.data, notice: null};
  }

  if (loadResult.code === "SAVE_NOT_FOUND") {
    return {
      ok: true,
      state: emptyAchievementState(),
      notice: "当前还没有游戏存档。"
    };
  }

  return {
    ok: false,
    message: FAILURE_MESSAGES[loadResult.code]
      || "暂时无法读取成就，请返回主菜单重试。"
  };
}
