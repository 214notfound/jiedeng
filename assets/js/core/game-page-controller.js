// 正式游戏页控制器：组装游戏流程与业务模块，并统一控制 V2 页面状态。

import { createGameFlow } from "./game-flow.js";
import { createGameView } from "./game-ui.js";
import { getCurrentUser, goToMenu } from "./navigation.js";
import { createInteractionModule } from "../exploration/integration/game/interaction-module.js";
import { mountExploration } from "../exploration/game/exploration-view.js";
import { createMapPuzzleAdapter } from "../minigames/map-puzzle/adapter/map-puzzle-adapter.js";
import { getAchievementEvents } from "../achievements/game/achievements.js";
import { saveGame } from "./storage.js";
import { STORY_FACT_DEFINITIONS } from "./game-contract.js";

export const VIEW_STATES = Object.freeze({
  READING: "reading",
  EXPLORATION: "exploration",
  DETAIL: "detail",
  INVENTORY: "inventory",
  MINIGAME: "minigame"
});

export const PLAYER_FEEDBACK_RESULTS = Object.freeze({
  SAVE_NOT_FOUND: Object.freeze({
    message: "没有找到可继续的存档。请返回主菜单，选择“开始新游戏”。",
    nextAction: "返回主菜单并开始新游戏"
  }),
  SAVE_INVALID: Object.freeze({
    message: "存档已损坏，暂时无法继续。原存档已保留，请返回主菜单后重新开始。",
    nextAction: "返回主菜单并重新开始"
  }),
  SAVE_VERSION_UNSUPPORTED: Object.freeze({
    message: "这个存档来自不兼容的旧版本，暂时无法继续。旧存档已保留，请返回主菜单开始新游戏。",
    nextAction: "返回主菜单并开始新游戏"
  }),
  STORAGE_UNAVAILABLE: Object.freeze({
    message: "浏览器存储暂时不可用。请检查浏览器存储设置后重试；仍然失败时请重新登录。",
    nextAction: "检查设置并重试，或重新登录"
  }),
  OPERATION_FAILED: Object.freeze({
    message: "操作没有完成，请重试；仍无法继续时请返回主菜单。",
    nextAction: "重试，或返回主菜单"
  }),
  SAVE_SUCCESS: Object.freeze({
    message: "进度已保存，可以继续游戏。",
    nextAction: "继续游戏"
  })
});

export function feedbackForResult(code) {
  return PLAYER_FEEDBACK_RESULTS[code] ?? PLAYER_FEEDBACK_RESULTS.OPERATION_FAILED;
}

const BASE_VIEW_STATES = new Set([VIEW_STATES.READING, VIEW_STATES.EXPLORATION]);
const OVERLAY_VIEW_STATES = new Set([
  VIEW_STATES.DETAIL,
  VIEW_STATES.INVENTORY,
  VIEW_STATES.MINIGAME
]);
const EXTERNAL_COMMAND_TYPES = new Set([
  "REQUEST_EXPLORATION",
  "REQUEST_CONVERSATION",
  "REQUEST_MINIGAME"
]);
const TECHNICAL_FEEDBACK_PATTERN = /(?:\b(?:Node|command|event|payload|source|state|localStorage|storageScope|schemaVersion|storyCheckpoint|pendingCommands|resultFactIds)\b|[A-Z]{2,}(?:_[A-Z0-9]+)+|\b[a-z]+(?:-[a-z0-9]+){2,}\b|模块|接口|挂载|订阅|存储域|结构不正确|检查点与命令|格式无效|无权产生)/;

function playerFacingFeedback(message, type) {
  if (typeof message !== "string" || !message.trim()) {
    return "操作没有完成，请重试；仍无法继续时请返回主菜单。";
  }
  if (["error", "warning"].includes(type) && TECHNICAL_FEEDBACK_PATTERN.test(message)) {
    console.error("[white-lamp:player-feedback] 已隐藏内部错误详情", message);
    return "操作没有完成，请重试；仍无法继续时请返回主菜单。";
  }
  return message;
}

function showFeedback(message, type = "info", resultCode) {
  const element = document.getElementById("feedback");
  const mappedMessage = resultCode ? feedbackForResult(resultCode).message : message;
  const visibleMessage = playerFacingFeedback(mappedMessage, type);

  if (!element) {
    console.log(`[white-lamp:${type}] ${visibleMessage}`);
    return;
  }

  element.textContent = visibleMessage;
  element.className = `feedback feedback--${type}`;
  element.hidden = false;
}

function requireElement(id) {
  const element = document.getElementById(id);
  if (!element) throw new Error(`游戏页面缺少必要容器：${id}`);
  return element;
}

/**
 * 参数：game-flow 发布的完整剧情响应。
 * 处理：只根据已约定的 status/commands 判断基础页面。
 * 返回：reading 或 exploration；error 返回 null，表示保留当前页面。
 */
export function deriveViewState(response) {
  if (!response || typeof response !== "object") {
    throw new TypeError("页面切换缺少剧情响应。");
  }

  if (response.status === "ready") {
    if (!response.presentation || typeof response.presentation !== "object") {
      throw new TypeError("ready 响应缺少 presentation。");
    }
    return VIEW_STATES.READING;
  }

  if (response.status === "ended") {
    return VIEW_STATES.READING;
  }

  if (response.status === "error") {
    return null;
  }

  if (response.status === "waiting-external") {
    const commands = Array.isArray(response.commands) ? response.commands : [];
    if (!commands.length) {
      throw new TypeError("waiting-external 响应缺少 commands。");
    }
    if (!commands.some((command) => EXTERNAL_COMMAND_TYPES.has(command?.commandType))) {
      throw new TypeError("waiting-external 响应没有可识别的外部命令。");
    }
    // 调查、对话和地图入口都先交给探索基础页；玩家选择后才打开阅读或拼图。
    return VIEW_STATES.EXPLORATION;
  }

  throw new TypeError(`无法识别的剧情状态：${String(response.status)}`);
}

function setLayerState(element, {visible, interactive}) {
  element.hidden = !visible;
  element.toggleAttribute("inert", visible && !interactive);
  element.classList.toggle("is-view-locked", visible && !interactive);
}

export function createViewCoordinator({
  sceneRoot,
  explorationActionsRoot,
  storyPanel,
  inventoryRoot,
  detailRoot,
  minigameRoot,
  onChange = () => {}
}) {
  const elements = [
    sceneRoot,
    explorationActionsRoot,
    storyPanel,
    inventoryRoot,
    detailRoot,
    minigameRoot
  ];
  if (!elements.every((element) => element?.classList)) {
    throw new TypeError("页面状态协调器缺少必要容器。");
  }

  let currentView = VIEW_STATES.READING;
  const returnStack = [];

  function visibleStates() {
    return new Set([...returnStack.map((entry) => entry.state), currentView]);
  }

  function render() {
    const visible = visibleStates();
    sceneRoot.closest?.(".game-main")?.setAttribute("data-view-state", currentView);
    setLayerState(sceneRoot, {
      visible: visible.has(VIEW_STATES.EXPLORATION) || currentView === VIEW_STATES.READING,
      interactive: currentView === VIEW_STATES.EXPLORATION
    });
    setLayerState(explorationActionsRoot, {
      visible: visible.has(VIEW_STATES.EXPLORATION),
      interactive: currentView === VIEW_STATES.EXPLORATION
    });
    setLayerState(storyPanel, {
      visible: visible.has(VIEW_STATES.READING),
      interactive: currentView === VIEW_STATES.READING
    });
    setLayerState(inventoryRoot, {
      visible: visible.has(VIEW_STATES.INVENTORY),
      interactive: currentView === VIEW_STATES.INVENTORY
    });
    setLayerState(detailRoot, {
      visible: currentView === VIEW_STATES.DETAIL,
      interactive: currentView === VIEW_STATES.DETAIL
    });
    setLayerState(minigameRoot, {
      visible: currentView === VIEW_STATES.MINIGAME,
      interactive: currentView === VIEW_STATES.MINIGAME
    });
    onChange(currentView);
  }

  function showBase(nextView) {
    if (!BASE_VIEW_STATES.has(nextView)) {
      throw new TypeError(`不是基础页面状态：${String(nextView)}`);
    }
    returnStack.length = 0;
    currentView = nextView;
    render();
  }

  function openOverlay(nextView) {
    if (!OVERLAY_VIEW_STATES.has(nextView)) {
      throw new TypeError(`不是覆盖层状态：${String(nextView)}`);
    }

    const canOpen = nextView === VIEW_STATES.DETAIL
      ? [VIEW_STATES.READING, VIEW_STATES.EXPLORATION, VIEW_STATES.INVENTORY].includes(currentView)
      : BASE_VIEW_STATES.has(currentView);
    if (!canOpen) {
      return {ok: false, message: "请先关闭当前窗口，再打开其他内容。"};
    }

    returnStack.push({state: currentView, focus: document.activeElement});
    currentView = nextView;
    render();

    const activeRoot = nextView === VIEW_STATES.DETAIL
      ? detailRoot
      : nextView === VIEW_STATES.INVENTORY ? inventoryRoot : minigameRoot;
    const focusTarget = activeRoot.querySelector("button, [href], input, select, textarea, [tabindex]:not([tabindex='-1'])");
    (focusTarget ?? activeRoot).focus?.();
    return {ok: true, state: currentView};
  }

  function closeOverlay() {
    if (!OVERLAY_VIEW_STATES.has(currentView) || !returnStack.length) {
      return {ok: false, message: "当前没有可以关闭的窗口。"};
    }

    const previous = returnStack.pop();
    currentView = previous.state;
    render();
    previous.focus?.focus?.();
    return {ok: true, state: currentView};
  }

  function getReturnState() {
    return returnStack.at(-1)?.state ?? null;
  }

  render();
  return Object.freeze({
    getState: () => currentView,
    getReturnState,
    showBase,
    openOverlay,
    closeOverlay
  });
}

export function createDetailDismissController({
  viewCoordinator,
  keyTarget = globalThis.document,
  navigationTarget = globalThis,
  historyTarget = globalThis.history
}) {
  if (!viewCoordinator || typeof viewCoordinator.getState !== "function"
    || typeof viewCoordinator.closeOverlay !== "function") {
    throw new TypeError("详情关闭控制器缺少页面状态协调器。");
  }

  let ownsHistoryEntry = false;
  let ignoreNextPopState = false;

  function closeDetail({fromHistory = false} = {}) {
    if (viewCoordinator.getState() !== VIEW_STATES.DETAIL) {
      return {ok: false, message: "当前没有打开详情。"};
    }
    const result = viewCoordinator.closeOverlay();
    if (!result.ok) return result;

    if (ownsHistoryEntry && !fromHistory && typeof historyTarget?.back === "function") {
      ignoreNextPopState = true;
      historyTarget.back();
    }
    ownsHistoryEntry = false;
    return result;
  }

  function handleKeydown(event) {
    if (event.key !== "Escape" || viewCoordinator.getState() !== VIEW_STATES.DETAIL) return;
    event.preventDefault?.();
    closeDetail();
  }

  function handlePopState() {
    if (ignoreNextPopState) {
      ignoreNextPopState = false;
      return;
    }
    if (viewCoordinator.getState() === VIEW_STATES.DETAIL) {
      closeDetail({fromHistory: true});
    }
  }

  keyTarget?.addEventListener?.("keydown", handleKeydown);
  navigationTarget?.addEventListener?.("popstate", handlePopState);

  return Object.freeze({
    markDetailOpened() {
      if (viewCoordinator.getState() !== VIEW_STATES.DETAIL || ownsHistoryEntry) return;
      if (typeof historyTarget?.pushState === "function") {
        historyTarget.pushState({
          ...(historyTarget.state && typeof historyTarget.state === "object" ? historyTarget.state : {}),
          whiteLampOverlay: VIEW_STATES.DETAIL
        }, "");
        ownsHistoryEntry = true;
      }
    },
    closeDetail,
    destroy() {
      keyTarget?.removeEventListener?.("keydown", handleKeydown);
      navigationTarget?.removeEventListener?.("popstate", handlePopState);
    }
  });
}

export function setupGamePage() {
  let gameFlow;
  let interactionModule;
  let removeExploration;
  let mapAdapter;
  let activeCommands = [];
  let preserveViewDuringMapExit = false;
  let failNextExternalEventForDebug = false;
  const stateListeners = new Set();
  const returnMenuButton = requireElement("return-menu-button");
  const saveButton = requireElement("save-button");
  const openInventoryButton = requireElement("open-inventory-button");
  const closeInventoryButton = requireElement("close-inventory-button");
  const openMinigameButton = requireElement("open-minigame-button");
  const closeDetailButton = requireElement("close-detail-button");
  const chapterName = requireElement("chapter-name");
  const sceneRoot = requireElement("game-scene");
  const explorationActionsRoot = requireElement("exploration-actions");
  const storyRoot = requireElement("game-story");
  const storyPanel = storyRoot.closest(".story-panel");
  const gameMain = sceneRoot.closest(".game-main");
  const inventoryRoot = requireElement("inventory-panel");
  const detailRoot = requireElement("detail-root");
  const minigameRoot = requireElement("minigame-root");
  const query = new URLSearchParams(location.search);
  const mode = query.get("mode");
  const debugMode = query.get("debug") === "1";
  let debugEventSequence = 0;
  let gameView;
  let pendingDispatches = 0;
  const pendingViews = new Map();

  if (!storyPanel) throw new Error("游戏页面缺少阅读面板。");

  function getMapCommand() {
    return activeCommands.find((command) => command.commandType === "REQUEST_MINIGAME") ?? null;
  }

  function syncTopBar(currentView) {
    const baseViewActive = BASE_VIEW_STATES.has(currentView);
    gameMain?.setAttribute("data-view-state", currentView);
    openInventoryButton.disabled = !baseViewActive;
    openMinigameButton.disabled = !baseViewActive || !getMapCommand();
  }

  function updateChapterName() {
    const checkpoint = gameFlow?.getState()?.storyCheckpoint;
    const node = globalThis.WhiteLampStoryInternal?.storyData?.nodes?.find(
      (item) => item.id === checkpoint?.nodeId
    );
    const labels = {
      prologue: "序章 · 旧祠堂",
      village: "村口调查",
      "old-house": "陈家老宅"
    };
    chapterName.textContent = labels[node?.stageId] ?? "调查记录";
  }

  const viewCoordinator = createViewCoordinator({
    sceneRoot,
    explorationActionsRoot,
    storyPanel,
    inventoryRoot,
    detailRoot,
    minigameRoot,
    onChange: syncTopBar
  });
  const detailDismissController = createDetailDismissController({viewCoordinator});

  // 外部结果与成就均登记后再刷新展示，展示端不参与状态决策。
  function updateView(key, render) {
    if (pendingDispatches) pendingViews.set(key, render);
    else render();
  }

  async function dispatchExternalEvent(event) {
    if (debugMode && failNextExternalEventForDebug) {
      failNextExternalEventForDebug = false;
      console.warn("[white-lamp:debug-flow] 已按测试要求拒绝本次外部事件", event);
      return {
        ok: false,
        code: "DEBUG_FORCED_FAILURE",
        message: "测试失败已触发，本次操作没有提交；请再次点击重试。"
      };
    }

    pendingDispatches += 1;
    let result;
    try {
      result = await gameFlow.handleExternalEvent(event);
      if (result.ok) {
        for (const achievementEvent of getAchievementEvents({state: gameFlow.getState()})) {
          gameFlow.applyAppEvent(achievementEvent);
        }
        result.state = gameFlow.getState();
      }
      return result;
    } finally {
      pendingDispatches -= 1;
      if (!pendingDispatches) {
        const views = [...pendingViews.values()];
        pendingViews.clear();
        for (const render of views) {
          try {
            render();
          } catch (error) {
            console.error("[white-lamp:view] 已提交进度的展示更新失败", error);
            showFeedback("游戏进度已更新，但界面更新失败，请保存进度后重新进入。", "error");
          }
        }
      }
    }
  }

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
      const committedFacts = new Set(gameFlow.getState().facts);
      const nextFactId = resultFactIds.find((factId) => !committedFacts.has(factId));
      const factDefinition = STORY_FACT_DEFINITIONS.find(
        (definition) => definition.id === nextFactId
      );
      if (!nextFactId || !factDefinition?.externalTargetId) {
        throw new Error("无法从探索命令确定下一项调试目标。");
      }
      return {
        eventId,
        eventType: "OBJECT_INVESTIGATED",
        source: "exploration",
        causedByCommandId: command.commandId,
        resultFactIds: [nextFactId],
        payload: {objectId: factDefinition.externalTargetId}
      };
    }

    return {
      eventId,
      eventType: "MAP_PUZZLE_COMPLETED",
      source: "minigame",
      causedByCommandId: command.commandId,
      resultFactIds: [command.payload.successFactId],
      payload: {puzzleId: command.payload.minigameId}
    };
  }

  gameView = createGameView({
    debugMode,
    onStoryAction: (actionId) => gameFlow.handleStoryAction(actionId),
    onDebugCommand: async (command) => {
      try {
        return await dispatchExternalEvent(createDebugExternalEvent(command));
      } catch (error) {
        console.error("[white-lamp:debug-flow]", error);
        showFeedback("联调事件生成失败，请检查控制台。", "error");
      }
    }
  });

  const handleReturnMenu = () => goToMenu();
  const handleOpenInventory = () => {
    const result = viewCoordinator.openOverlay(VIEW_STATES.INVENTORY);
    if (!result.ok) showFeedback(result.message, "warning");
  };
  const handleCloseInventory = () => viewCoordinator.closeOverlay();
  const handleCloseDetail = () => detailDismissController.closeDetail();
  const handleOpenMinigame = () => {
    const command = getMapCommand();
    if (!command) {
      showFeedback("现在还不能打开地图，请先完成当前调查。", "warning");
      return;
    }
    openMap(command);
  };
  const handleOpenDetail = (targetId) => {
    if (typeof targetId !== "string" || !targetId.trim()) {
      return {ok: false, message: "缺少要查看的线索。"};
    }
    detailRoot.dataset.targetId = targetId;
    const result = viewCoordinator.openOverlay(VIEW_STATES.DETAIL);
    if (result.ok) detailDismissController.markDetailOpened();
    return result;
  };

  returnMenuButton.addEventListener("click", handleReturnMenu);
  openInventoryButton.addEventListener("click", handleOpenInventory);
  closeInventoryButton.addEventListener("click", handleCloseInventory);
  openMinigameButton.addEventListener("click", handleOpenMinigame);
  closeDetailButton.addEventListener("click", handleCloseDetail);

  function openMap(command) {
    const opened = viewCoordinator.openOverlay(VIEW_STATES.MINIGAME);
    if (!opened.ok) {
      showFeedback(opened.message, "warning");
      return opened;
    }
    try {
      mapAdapter.start(command);
      return {ok: true};
    } catch (error) {
      viewCoordinator.closeOverlay();
      console.error("[white-lamp:minigame] 地图打开失败", error);
      showFeedback("地图暂时无法打开，请稍后重试。", "error");
      return {ok: false, error};
    }
  }

  getCurrentUser().then(async (user) => {
    if (!user) return;

    if (mode !== "new" && mode !== "continue") {
      showFeedback("游戏启动方式无效，请返回主菜单重新选择。", "warning");
      return;
    }

    const storageScope = user.storageScope;
    console.info("[white-lamp:game]", {page: location.pathname, mode, debugMode, storageScope});
    gameFlow = createGameFlow({
      storageScope,
      notificationHandlers: {},
      onStateChange: () => updateView("state", () => {
        gameView.renderState(gameFlow.getState());
        updateChapterName();
        stateListeners.forEach((listener) => listener());
      }),
      onCommandsChange: (commands) => {
        activeCommands = commands;
        syncTopBar(viewCoordinator.getState());
      },
      commandHandlers: {
        REQUEST_EXPLORATION: () => {},
        REQUEST_CONVERSATION: () => {},
        REQUEST_MINIGAME: () => {}
      },
      onStatusChange: (_status, response) => updateView("response", () => {
        gameView.renderResponse(response);
        if (preserveViewDuringMapExit) return;
        const nextView = deriveViewState(response);
        if (nextView) viewCoordinator.showBase(nextView);
      }),
      onError: (error) => {
        console.error("[white-lamp:game-flow]", error.developerMessage);
        showFeedback(error.userMessage, "error", error.errorCode);
      }
    });

    globalThis.WhiteLamp = globalThis.WhiteLamp || {};
    function saveCurrentGame() {
      const saveResult = saveGame(gameFlow.getState(), storageScope);

      if (!saveResult.ok) {
        showFeedback(saveResult.message, "error", saveResult.code);
        return saveResult;
      }

      gameFlow.replaceState(saveResult.data.state);
      showFeedback("进度已保存。", "success", "SAVE_SUCCESS");
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

    const gamePageApi = {
      getViewState: viewCoordinator.getState,
      getReturnState: viewCoordinator.getReturnState,
      openInventory: handleOpenInventory,
      openDetail(targetId) {
        return handleOpenDetail(targetId);
      },
      closeOverlay: viewCoordinator.closeOverlay,
      openMinigame: handleOpenMinigame
    };
    if (debugMode) {
      gamePageApi.failNextExternalEvent = () => {
        failNextExternalEventForDebug = true;
        return {ok: true, message: "下一次热点、对话或小游戏提交将模拟失败。"};
      };
    }
    globalThis.WhiteLamp.gamePage = Object.freeze(gamePageApi);

    const startResult = mode === "new"
      ? await gameFlow.startNewGame()
      : await gameFlow.resumeGame();

    if (!startResult.ok) return;

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
      },
      requestOpenDetail(targetId) {
        return globalThis.WhiteLamp.gamePage.openDetail(targetId);
      }
    };

    mapAdapter = createMapPuzzleAdapter({
      container: minigameRoot,
      onEvent: async (event) => {
        const returnsToPrevious = [
          "EXTERNAL_INTERACTION_CANCELLED",
          "EXTERNAL_INTERACTION_FAILED"
        ].includes(event.eventType);
        preserveViewDuringMapExit = returnsToPrevious;
        let result;
        try {
          result = await dispatchExternalEvent(event);
        } finally {
          preserveViewDuringMapExit = false;
        }

        if (returnsToPrevious) {
          viewCoordinator.closeOverlay();
        } else if (result.ok && event.eventType === "MAP_PUZZLE_COMPLETED") {
          mapAdapter.destroy();
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
      detailRoot,
      showFeedback,
      openMap,
      openDetail: handleOpenDetail,
      openConversation(input, callbacks = {}) {
        viewCoordinator.showBase(VIEW_STATES.READING);
        gameView.openConversation(input, {
          onComplete: async (result) => {
            try {
              const outcome = await callbacks.onComplete?.(result);
              if (outcome && outcome.ok === false) {
                callbacks.onFailure?.(outcome);
              }
              return outcome;
            } catch (error) {
              callbacks.onFailure?.(error);
              throw error;
            }
          },
          onClose: () => {
            callbacks.onClose?.();
            viewCoordinator.showBase(VIEW_STATES.EXPLORATION);
          }
        });
      }
    });

    const handleSave = () => saveCurrentGame();
    saveButton.addEventListener("click", handleSave);

    globalThis.addEventListener("pagehide", () => {
      returnMenuButton.removeEventListener("click", handleReturnMenu);
      openInventoryButton.removeEventListener("click", handleOpenInventory);
      closeInventoryButton.removeEventListener("click", handleCloseInventory);
      openMinigameButton.removeEventListener("click", handleOpenMinigame);
      closeDetailButton.removeEventListener("click", handleCloseDetail);
      detailDismissController.destroy();
      saveButton.removeEventListener("click", handleSave);
      removeExploration?.();
      interactionModule?.dispose();
      mapAdapter?.destroy();
      stateListeners.clear();
      delete globalThis.WhiteLamp.gamePage;
    }, {once: true});
  }).catch((error) => {
    console.error("[white-lamp:game-page] 游戏页初始化失败", error);
    showFeedback("游戏页初始化失败，请返回主菜单后重试。", "error");
  });
}

if (typeof document !== "undefined" && document.body?.dataset.page === "game") {
  setupGamePage();
}
