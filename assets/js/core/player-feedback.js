// 正式页面玩家反馈适配：业务错误码只用于选择文案，不直接进入 DOM。

export const DEFAULT_PLAYER_ERROR = "操作没有完成，请重试；仍无法继续时请返回主菜单。";

const TECHNICAL_FEEDBACK_PATTERN = /(?:\b(?:Node(?:Id)?|command(?:Id)?|event(?:Type)?|factId|payload|source|state|localStorage|storageScope|schemaVersion|storyCheckpoint|pendingCommands|resultFactIds)\b|[A-Z]{2,}(?:_[A-Z0-9]+)+|\b[a-z]+(?:-[a-z0-9]+){2,}\b|模块|接口|挂载|订阅|存储域|结构不正确|检查点与命令|格式无效|无权产生)/;

const LOAD_MESSAGES = Object.freeze({
  SAVE_NOT_FOUND: Object.freeze({full: "没有找到可继续的存档，请返回主菜单开始新游戏。", compact: "暂无可用存档"}),
  SAVE_INVALID: Object.freeze({full: "存档无法读取，请返回主菜单后重试。", compact: "存档暂时无法读取"}),
  SAVE_VERSION_UNSUPPORTED: Object.freeze({full: "检测到旧版存档，当前版本不能继续；旧存档已保留。", compact: "检测到旧版存档，当前版本不能继续"}),
  SAVE_SCOPE_MISMATCH: Object.freeze({full: "当前存档不属于此账户，请返回主菜单重新选择。", compact: "当前账户无法使用这份存档"}),
  SAVE_SCOPE_INVALID: Object.freeze({full: "当前账户信息无效，请重新登录后重试。", compact: "账户信息无效，请重新登录"}),
  STORAGE_UNAVAILABLE: Object.freeze({full: "暂时无法读取游戏进度，请检查浏览器存储设置后重试。", compact: "暂时无法读取游戏进度"})
});

const SAVE_MESSAGES = Object.freeze({
  SAVE_INVALID: "当前进度暂时无法保存，请返回主菜单后重试。",
  SAVE_VERSION_UNSUPPORTED: "当前进度版本不受支持，无法保存；请返回主菜单。",
  SAVE_SCOPE_MISMATCH: "当前进度不属于此账户，无法保存；请重新登录后重试。",
  SAVE_SCOPE_INVALID: "当前账户信息无效，请重新登录后重试。",
  SAVE_STORY_NOT_STARTED: "剧情尚未开始，暂时不能保存。",
  STORAGE_UNAVAILABLE: "保存失败，请检查浏览器存储设置后重试。"
});

export function containsTechnicalFeedback(message) {
  return typeof message === "string" && TECHNICAL_FEEDBACK_PATTERN.test(message);
}

export function playerFacingFeedback(message, {type = "info", fallback = DEFAULT_PLAYER_ERROR} = {}) {
  if (typeof message !== "string" || !message.trim()) return fallback;
  if (["error", "warning"].includes(type) && containsTechnicalFeedback(message)) {
    console.error("[white-lamp:player-feedback] 已隐藏内部错误详情", message);
    return fallback;
  }
  return message.trim();
}

export function storageResultFeedback(result, {operation = "load", compact = false} = {}) {
  if (result?.ok) return operation === "save" ? "进度已保存。" : "";
  if (operation === "save") {
    return SAVE_MESSAGES[result?.code] ?? playerFacingFeedback(result?.message, {type: "error"});
  }
  const mapped = LOAD_MESSAGES[result?.code];
  if (mapped) return compact ? mapped.compact : mapped.full;
  return playerFacingFeedback(result?.message, {type: "error"});
}
