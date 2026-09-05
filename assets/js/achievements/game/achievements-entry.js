// 正式成就页面入口：恢复当前身份的存档并挂载只读成就视图。
import { createInitialGameState } from "../../core/state.js";
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
  const state = loadResult.ok
    ? loadResult.data
    : createInitialGameState(storageScope);
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
