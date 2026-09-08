// 正式成就页面入口：恢复当前身份的存档并挂载只读成就视图。
import { loadGame } from "../../core/storage.js";
import { mountAchievementsPage } from "./achievements-page.js";

const auth = globalThis.WhiteLamp?.auth;
const feedback = document.getElementById("achievement-feedback");

function showError(message, error) {
  feedback.hidden = false;
  feedback.textContent = message;
  if (error) console.error("[achievements-entry]", error);
}

async function start() {
  if (!auth) throw new Error("账户模块尚未加载。");
  const sessionResult = await auth.getSession();
  if (!sessionResult.ok) throw new Error(sessionResult.message);
  if (!sessionResult.data) {
    location.replace("../authorize/login.html");
    return;
  }

  const { storageScope } = sessionResult.data;
  const loadResult = loadGame(storageScope);
  if (!loadResult.ok) {
    const messages = {
      SAVE_NOT_FOUND: "当前还没有游戏存档。",
      SAVE_INVALID: "游戏存档损坏，暂时无法读取成就。",
      SAVE_VERSION_UNSUPPORTED: "游戏存档版本不兼容，暂时无法读取成就。",
      SAVE_SCOPE_MISMATCH: "当前登录身份与游戏存档不匹配。",
      STORAGE_UNAVAILABLE: "浏览器存储不可用，暂时无法读取成就。"
    };
    showError(messages[loadResult.code] || "暂时无法读取成就，请返回主菜单重试。");
    return;
  }
  const state = loadResult.data;
  const listeners = new Set();
  const host = {
    getContext: () => ({storageScope, state}),
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    }
  };
  mountAchievementsPage({host});
}

start().catch((error) => showError("暂时无法读取成就，请返回主菜单重试。", error));
