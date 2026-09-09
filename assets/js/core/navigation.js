// 页面导航层：只处理身份检查、主菜单操作和 URL 跳转。

import { loadGame } from "./storage.js";
import { playerFacingFeedback, storageResultFeedback } from "./player-feedback.js";

const auth = globalThis.WhiteLamp?.auth;

function showMenuFeedback(message, type = "info") {
  const element = document.getElementById("feedback");
  const visibleMessage = playerFacingFeedback(message, {
    type,
    fallback: "操作没有完成，请刷新页面后重试。"
  });

  if (!element) {
    console.log(`[white-lamp:${type}] ${visibleMessage}`);
    return;
  }

  element.textContent = visibleMessage;
  element.className = `feedback feedback--${type}`;
  element.hidden = false;
}

export function goToMenu() {
  location.href = "menu.html";
}

export async function getCurrentUser() {
  if (!auth) {
    showMenuFeedback("账户模块尚未加载，请刷新页面后重试。", "error");
    return null;
  }

  const result = await auth.getSession();

  if (!result.ok) {
    showMenuFeedback(result.message, "error");
    return null;
  }

  if (!result.data) {
    location.replace("authorize/login.html");
    return null;
  }

  return result.data;
}

export function setupMenuPage() {
  const newGameButton = document.getElementById("new-game-button");
  const continueButton = document.getElementById("continue-button");
  const continueHint = document.getElementById("continue-hint");
  const playerName = document.getElementById("player-name");
  const logoutButton = document.getElementById("logout-button");

  getCurrentUser().then((user) => {
    if (!user) return;

    const storageScope = user.storageScope;
    const loadResult = loadGame(storageScope);
    const hasSave = loadResult.ok;

    if (playerName) {
      playerName.textContent = `${user.username} · ${
        user.userType === "guest" ? "游客模式" : "本地账户"
      }`;
    }

    if (continueButton) {
      continueButton.disabled = !hasSave;
    }

    if (continueHint) {
      continueHint.hidden = hasSave;
      continueHint.textContent = storageResultFeedback(loadResult, {
        operation: "load",
        compact: true
      });
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

    if (logoutButton) {
      logoutButton.addEventListener("click", async () => {
        const result = await auth.logout();
        if (!result.ok) {
          showMenuFeedback(result.message, "error");
          return;
        }
        location.replace("authorize/login.html");
      });
    }
  }).catch((error) => {
    console.error("[white-lamp:navigation] 主菜单初始化失败", error);
    showMenuFeedback("主菜单初始化失败，请刷新页面后重试。", "error");
  });
}

if (typeof document !== "undefined" && document.body?.dataset.page === "menu") {
  setupMenuPage();
}
