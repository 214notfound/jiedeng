// 《借灯》页面导航：连接账户、全局状态和游戏存档的基础流程。

import {
  GAME_EVENTS,
  createInitialGameState,
  applyGameEvent
} from "./state.js";
import {
  saveGame,
  loadGame,
  hasValidSave
} from "./storage.js";

const auth = globalThis.WhiteLamp?.auth;
const page = document.body?.dataset.page ||
  (location.pathname.endsWith("/game.html") ? "game" : "menu");

function showFeedback(message, type = "info") {
  const element = document.getElementById("feedback");

  if (!element) {
    console.log(`[white-lamp:${type}] ${message}`);
    return;
  }

  element.textContent = message;
  element.className = `feedback feedback--${type}`;
  element.hidden = false;
}

async function getCurrentUser() {
  if (!auth) {
    showFeedback("账户模块尚未加载，请刷新页面后重试。", "error");
    return null;
  }

  const result = await auth.getSession();

  if (!result.ok) {
    showFeedback(result.message, "error");
    return null;
  }

  if (!result.data) {
    location.replace("authorize/login.html");
    return null;
  }

  return result.data;
}

function setupMenuPage() {
  const newGameButton = document.getElementById("new-game-button");
  const continueButton = document.getElementById("continue-button");
  const continueHint = document.getElementById("continue-hint");

  getCurrentUser().then((user) => {
    if (!user) return;

    const storageScope = user.storageScope;
    const hasSave = hasValidSave(storageScope);

    if (continueButton) {
      continueButton.disabled = !hasSave;
    }

    if (continueHint) {
      continueHint.hidden = hasSave;
      continueHint.textContent = hasSave ? "" : "暂无存档";
    }

    if (newGameButton) {
      newGameButton.addEventListener("click", () => {
        if (hasSave && !confirm("已有存档，确定要开始新游戏并覆盖它吗？")) {
          return;
        }

        location.href = "game.html?mode=new";
      });
    }

    if (continueButton) {
      continueButton.addEventListener("click", () => {
        if (!continueButton.disabled) {
          location.href = "game.html?mode=continue";
        }
      });
    }
  }).catch((error) => {
    console.error("[white-lamp:navigation] 主菜单初始化失败", error);
    showFeedback("主菜单初始化失败，请刷新页面后重试。", "error");
  });
}

function setupGamePage() {
  let gameState;
  const saveButton = document.getElementById("save-button");
  const query = new URLSearchParams(location.search);
  const mode = query.get("mode");

  getCurrentUser().then((user) => {
    if (!user) return;

    const storageScope = user.storageScope;
    const result = mode === "new"
      ? { ok: true, data: createInitialGameState(storageScope) }
      : loadGame(storageScope);

    if (!result.ok) {
      showFeedback(result.message, "warning");
      return;
    }

    gameState = result.data;
    globalThis.WhiteLamp = globalThis.WhiteLamp || {};
    globalThis.WhiteLamp.game = {
      getState: () => gameState,
      update: (event) => {
        gameState = applyGameEvent(gameState, event);
        return gameState;
      }
    };

    if (saveButton) {
      saveButton.addEventListener("click", () => {
        const saveResult = saveGame(gameState, storageScope);

        if (!saveResult.ok) {
          showFeedback(saveResult.message, "error");
          return;
        }

        gameState = saveResult.data.state;
        showFeedback(
          `保存成功：${new Date(saveResult.data.savedAt).toLocaleString()}`,
          "success"
        );
      });
    }
  }).catch((error) => {
    console.error("[white-lamp:navigation] 游戏页初始化失败", error);
    showFeedback("游戏页初始化失败，请返回主菜单后重试。", "error");
  });
}

if (page === "game") {
  setupGamePage();
} else {
  setupMenuPage();
}
