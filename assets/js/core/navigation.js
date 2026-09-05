// 《借灯》页面导航：连接账户、游戏流程和存档按钮。

import { createGameFlow } from "./game-flow.js";
import { createGameView } from "./game-ui.js";
import { STORY_NOTIFICATION_TYPES } from "./game-contract.js";
import { createInteractionModule } from "../exploration/integration/game/interaction-module.js";
import { mountExploration } from "../exploration/game/exploration-view.js";
import { createMapPuzzleAdapter } from "../minigames/map-puzzle/adapter/map-puzzle-adapter.js";
import { getAchievementEvents } from "../achievements/game/achievements.js";
import {
  saveGame,
  loadGame
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
      continueHint.textContent = loadResult.code === "SAVE_VERSION_UNSUPPORTED"
        ? "检测到旧版存档，当前版本不能继续"
        : "暂无可用存档";
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
          showFeedback(result.message, "error");
          return;
        }
        location.replace("authorize/login.html");
      });
    }
  }).catch((error) => {
    console.error("[white-lamp:navigation] 主菜单初始化失败", error);
    showFeedback("主菜单初始化失败，请刷新页面后重试。", "error");
  });
}

function setupGamePage() {
  let gameFlow;
  let interactionModule;
  let removeExploration;
  let mapAdapter;
  let activeCommands = [];
  const stateListeners = new Set();
  const returnMenuButton = document.getElementById("return-menu-button");
  const saveButton = document.getElementById("save-button");
  const sceneRoot = document.getElementById("game-scene");
  const explorationActionsRoot = document.getElementById("exploration-actions");
  const inventoryRoot = document.getElementById("inventory-panel");
  const minigameRoot = document.getElementById("minigame-root");
  const query = new URLSearchParams(location.search);
  const mode = query.get("mode");
  const debugMode = query.get("debug") === "1";
  let debugEventSequence = 0;
  let gameView;

  function createDebugExternalEvent(command) {
    const storyData = globalThis.WhiteLampStoryInternal?.storyData;
    const checkpoint = gameFlow?.getState()?.storyCheckpoint;
    const node = storyData?.nodes?.find((item) => item.id === checkpoint?.nodeId);
    const handoff = node?.handoffs?.find(
      (item) => `cmd-${node.id}-${item.id}` === command.commandId
    );

    if (!handoff) {
      throw new Error(`无法找到命令对应的 handoff：${command.commandId}`);
    }

    const resultFactIds = [];
    for (const goalId of handoff.goalIds) {
      const milestone = node.milestones.find((item) => item.id === goalId);
      for (const factId of milestone?.satisfiedWhen?.allFacts || []) {
        if (!resultFactIds.includes(factId)) resultFactIds.push(factId);
      }
      const anyFact = milestone?.satisfiedWhen?.anyFacts?.[0];
      if (anyFact && !resultFactIds.includes(anyFact)) resultFactIds.push(anyFact);
    }

    debugEventSequence += 1;
    const eventId = `evt-debug-${Date.now()}-${debugEventSequence}`;

    if (command.commandType === "REQUEST_CONVERSATION") {
      return {
        eventId,
        eventType: "NPC_TALKED",
        source: "conversation",
        causedByCommandId: command.commandId,
        resultFactIds,
        payload: {
          conversationId: command.payload.conversationId,
          npcId: command.payload.npcIds[0]
        }
      };
    }

    if (command.commandType === "REQUEST_EXPLORATION") {
      return {
        eventId,
        eventType: "OBJECT_INVESTIGATED",
        source: "exploration",
        causedByCommandId: command.commandId,
        resultFactIds,
        payload: { objectId: command.payload.explorationId }
      };
    }

    return {
      eventId,
      eventType: "MAP_PUZZLE_COMPLETED",
      source: "minigame",
      causedByCommandId: command.commandId,
      resultFactIds: [command.payload.successFactId],
      payload: { puzzleId: command.payload.minigameId }
    };
  }

  gameView = createGameView({
    debugMode,
    onStoryAction: (actionId) => gameFlow.handleStoryAction(actionId),
    onDebugCommand: async (command) => {
      try {
        await gameFlow.handleExternalEvent(createDebugExternalEvent(command));
      } catch (error) {
        console.error("[white-lamp:debug-flow]", error);
        showFeedback("联调事件生成失败，请检查控制台。", "error");
      }
    }
  });

  if (returnMenuButton) {
    returnMenuButton.addEventListener("click", () => {
      location.href = "menu.html";
    });
  }

  getCurrentUser().then(async (user) => {
    if (!user) return;

    if (mode !== "new" && mode !== "continue") {
      showFeedback("游戏启动方式无效，请返回主菜单重新选择。", "warning");
      return;
    }

    const storageScope = user.storageScope;
    const notificationHandlers = Object.fromEntries(
      Object.values(STORY_NOTIFICATION_TYPES).map((eventType) => [
        eventType,
        (notification) => gameView.recordNotification(notification)
      ])
    );

    gameFlow = createGameFlow({
      storageScope,
      notificationHandlers,
      onStateChange: (state) => {
        gameView.renderState(state);
        stateListeners.forEach((listener) => listener());
      },
      onCommandsChange: (commands) => {
        activeCommands = commands;
      },
      commandHandlers: {
        // 探索/对话命令由 interactionModule 根据 pendingCommands 消费。
        REQUEST_EXPLORATION: () => {},
        REQUEST_CONVERSATION: () => {},
        // 地图命令保留在检查点中，玩家点击“复原手绘地图”时再启动视图。
        REQUEST_MINIGAME: () => {}
      },
      onStatusChange: (_status, response) => gameView.renderResponse(response),
      onError: (error) => {
        console.error("[white-lamp:game-flow]", error.developerMessage);
        showFeedback(error.userMessage, "error");
      }
    });

    globalThis.WhiteLamp = globalThis.WhiteLamp || {};
    async function dispatchExternalEvent(event) {
      const result = await gameFlow.handleExternalEvent(event);
      if (result.ok) {
        getAchievementEvents({state: gameFlow.getState()}).forEach((achievementEvent) => {
          gameFlow.applyAppEvent(achievementEvent);
        });
      }
      return result;
    }

    function saveCurrentGame() {
      const saveResult = saveGame(gameFlow.getState(), storageScope);

      if (!saveResult.ok) {
        showFeedback(saveResult.message, "error");
        return saveResult;
      }

      gameFlow.replaceState(saveResult.data.state);
      showFeedback(
        `保存成功：${new Date(saveResult.data.savedAt).toLocaleString()}`,
        "success"
      );
      return saveResult;
    }

    globalThis.WhiteLamp.game = {
      getState: gameFlow.getState,
      getStateSnapshot: gameFlow.getStateSnapshot,
      update: gameFlow.applyAppEvent,
      handleStoryAction: gameFlow.handleStoryAction,
      handleExternalEvent: dispatchExternalEvent,
      save: saveCurrentGame,
      isFlowLocked: gameFlow.isLocked
    };

    const startResult = mode === "new"
      ? await gameFlow.startNewGame()
      : await gameFlow.resumeGame();

    if (!startResult.ok) {
      return;
    }

    const host = {
      getContext() {
        const state = gameFlow.getState();
        if (!state?.storyCheckpoint) {
          throw new Error("游戏状态尚未建立剧情检查点。");
        }
        return {
          storageScope,
          state,
          commands: activeCommands.map((command) => ({...command}))
        };
      },
      subscribe(listener) {
        if (typeof listener !== "function") throw new TypeError("订阅者必须是函数。");
        stateListeners.add(listener);
        listener();
        return () => stateListeners.delete(listener);
      },
      dispatchExternalEvent(event) {
        return dispatchExternalEvent(event);
      }
    };

    if (!sceneRoot || !explorationActionsRoot || !inventoryRoot || !minigameRoot) {
      throw new Error("游戏页面缺少探索或小游戏挂载区域。");
    }

    mapAdapter = createMapPuzzleAdapter({
      container: minigameRoot,
      onEvent: async (event) => {
        const result = await dispatchExternalEvent(event);
        if (result.ok && event.eventType === "MAP_PUZZLE_COMPLETED") {
          mapAdapter.destroy();
          minigameRoot.hidden = true;
          minigameRoot.replaceChildren();
        }
        return result;
      }
    });

    interactionModule = createInteractionModule(host);
    removeExploration = mountExploration({
      module: interactionModule,
      sceneRoot,
      actionsRoot: explorationActionsRoot,
      inventoryRoot,
      showFeedback,
      openMap: (command) => {
        minigameRoot.hidden = false;
        mapAdapter.start(command);
      }
    });

    globalThis.addEventListener("pagehide", () => {
      removeExploration?.();
      interactionModule?.dispose();
      mapAdapter?.destroy();
      stateListeners.clear();
    }, {once: true});

    if (saveButton) {
      saveButton.addEventListener("click", saveCurrentGame);
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
