// 游戏流程协调器：连接全局状态、存档、剧情入口和各外部功能模块。

import {
  STORY_CONTRACT_VERSION,
  STORY_NOTIFICATION_TYPES
} from "./game-contract.js";
import {
  applyExternalEvent,
  applyGameEvent,
  commitStoryTransaction,
  createInitialGameState
} from "./state.js";
import { loadGame } from "./storage.js";

const STORY_INPUT_TYPES = new Set([
  "new-game",
  "resume",
  "story-action",
  "external-event"
]);
const STORY_RESPONSE_STATUSES = new Set([
  "ready",
  "waiting-external",
  "ended",
  "error"
]);
const STORY_COMMAND_TYPES = new Set([
  "REQUEST_EXPLORATION",
  "REQUEST_CONVERSATION",
  "REQUEST_MINIGAME"
]);

let requestSequence = 0;

function isPlainObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function hasText(value) {
  return typeof value === "string" && value.trim() !== "";
}

function createRequestId() {
  if (typeof globalThis.crypto?.randomUUID === "function") {
    return `req-${globalThis.crypto.randomUUID()}`;
  }

  requestSequence += 1;
  return `req-${Date.now()}-${requestSequence}`;
}

function copyCheckpoint(checkpoint) {
  if (checkpoint === null) {
    return null;
  }

  return {
    ...checkpoint,
    completedMilestoneIds: [...checkpoint.completedMilestoneIds],
    completedNodeIds: [...checkpoint.completedNodeIds],
    completedStageIds: [...checkpoint.completedStageIds],
    pendingCommands: checkpoint.pendingCommands.map((command) => ({
      ...command
    }))
  };
}

function emitDocumentEvent(eventName, detail) {
  if (
    typeof globalThis.document?.dispatchEvent === "function" &&
    typeof globalThis.CustomEvent === "function"
  ) {
    globalThis.document.dispatchEvent(new CustomEvent(eventName, { detail }));
  }
}

function defaultErrorHandler(error) {
  console.error("[white-lamp:game-flow]", error);
  emitDocumentEvent("white-lamp:flow-error", error);
}

function validateInput(input) {
  if (!isPlainObject(input) || !STORY_INPUT_TYPES.has(input.type)) {
    throw new TypeError("剧情输入类型无效");
  }

  if (input.type === "story-action" && !hasText(input.actionId)) {
    throw new TypeError("story-action 缺少 actionId");
  }

  if (input.type === "external-event" && !isPlainObject(input.event)) {
    throw new TypeError("external-event 缺少 event");
  }
}

function validateStoryResponse(response, requestId) {
  if (!isPlainObject(response)) {
    throw new TypeError("剧情入口没有返回有效响应");
  }

  if (response.contractVersion !== STORY_CONTRACT_VERSION) {
    throw new Error("剧情响应的 contractVersion 不匹配");
  }

  if (response.requestId !== requestId) {
    throw new Error("剧情响应的 requestId 与请求不匹配");
  }

  if (!STORY_RESPONSE_STATUSES.has(response.status)) {
    throw new Error(`未知剧情响应状态：${response.status}`);
  }

  if (!Array.isArray(response.commands) || !Array.isArray(response.notifications)) {
    throw new TypeError("剧情响应的 commands 或 notifications 不是数组");
  }

  if (response.status === "error") {
    if (
      response.commit !== null ||
      response.presentation !== null ||
      response.commands.length !== 0 ||
      response.notifications.length !== 0 ||
      !isPlainObject(response.error)
    ) {
      throw new TypeError("剧情错误响应结构不正确");
    }
    return;
  }

  if (
    !isPlainObject(response.commit) ||
    !Array.isArray(response.commit.events) ||
    response.error !== null
  ) {
    throw new TypeError("剧情成功响应缺少有效的 commit");
  }

  if (response.status === "ready" && !isPlainObject(response.presentation)) {
    throw new TypeError("ready 响应必须包含 presentation");
  }

  if (response.status === "waiting-external" && response.commands.length === 0) {
    throw new TypeError("waiting-external 响应必须包含外部命令");
  }

  if (response.status === "ended") {
    const hasEndedNotification = response.notifications.some(
      (notification) =>
        notification?.eventType === STORY_NOTIFICATION_TYPES.STORY_ENDED
    );
    if (response.commands.length !== 0 || !hasEndedNotification) {
      throw new TypeError("ended 响应必须停止命令并包含 STORY_ENDED 通知");
    }
  }

  for (const command of response.commands) {
    if (
      !isPlainObject(command) ||
      !hasText(command.commandId) ||
      !STORY_COMMAND_TYPES.has(command.commandType) ||
      !isPlainObject(command.payload)
    ) {
      throw new TypeError("剧情响应包含无效 command");
    }
  }
}

function normalizeFlowError(code, userMessage, cause) {
  return {
    errorCode: code,
    userMessage,
    developerMessage: cause instanceof Error ? cause.message : String(cause ?? ""),
    recoveryActions: ["retry", "return-menu"]
  };
}

export function createGameFlow(options = {}) {
  const {
    storageScope,
    story = globalThis.WhiteLamp?.story,
    commandHandlers = {},
    notificationHandlers = {},
    onPresentation,
    onError = defaultErrorHandler,
    onStateChange,
    onStatusChange
  } = options;

  if (!hasText(storageScope)) {
    throw new TypeError("createGameFlow 缺少 storageScope");
  }

  let gameState = null;
  let flowLocked = false;
  const deliveredNotificationIds = new Set();

  function reportError(error) {
    onError(error);
    return { ok: false, code: error.errorCode, error };
  }

  function replaceState(nextState) {
    gameState = nextState;
    if (typeof onStateChange === "function") {
      onStateChange(gameState);
    }
    return gameState;
  }

  function getState() {
    return gameState;
  }

  function getStateSnapshot() {
    if (!gameState) {
      return null;
    }

    return {
      ...gameState,
      facts: [...gameState.facts],
      storyCheckpoint: copyCheckpoint(gameState.storyCheckpoint),
      processedRequestIds: [...gameState.processedRequestIds],
      processedExternalEventIds: [...gameState.processedExternalEventIds],
      appliedOnceKeys: [...gameState.appliedOnceKeys]
    };
  }

  function applyAppEvent(event) {
    if (!gameState) {
      throw new Error("游戏状态尚未初始化");
    }
    return replaceState(applyGameEvent(gameState, event));
  }

  async function dispatchNotifications(notifications) {
    for (const notification of notifications) {
      if (!isPlainObject(notification) || !hasText(notification.eventId)) {
        throw new TypeError("剧情通知缺少有效的 eventId");
      }

      if (deliveredNotificationIds.has(notification.eventId)) {
        continue;
      }

      const handler = notificationHandlers[notification.eventType];
      if (typeof handler === "function") {
        await handler(notification);
      } else {
        emitDocumentEvent("white-lamp:story-notification", notification);
      }
      deliveredNotificationIds.add(notification.eventId);
    }
  }

  async function dispatchCommands(commands) {
    for (const command of commands) {
      const handler = commandHandlers[command.commandType];
      if (typeof handler === "function") {
        await handler(command);
      } else {
        // 外部模块可监听该事件；恢复存档时相同 commandId 会再次分发。
        emitDocumentEvent("white-lamp:story-command", command);
      }
    }
  }

  async function renderPresentation(presentation) {
    if (presentation === null) {
      return;
    }

    if (typeof onPresentation === "function") {
      await onPresentation(presentation);
    } else {
      emitDocumentEvent("white-lamp:story-presentation", presentation);
    }
  }

  async function runStory(input, runOptions = {}) {
    if (flowLocked) {
      return reportError(
        normalizeFlowError("FLOW_BUSY", "当前操作正在处理中，请稍候。")
      );
    }

    flowLocked = true;
    try {
      validateInput(input);

      if (!gameState) {
        throw new Error("游戏状态尚未初始化");
      }

      if (
        input.type === "external-event" &&
        gameState.processedExternalEventIds.includes(input.event.eventId)
      ) {
        return { ok: true, duplicate: true, state: gameState };
      }

      const requestId = runOptions.requestId ?? createRequestId();
      if (gameState.processedRequestIds.includes(requestId)) {
        return { ok: true, duplicate: true, state: gameState };
      }

      if (input.type === "external-event") {
        replaceState(applyExternalEvent(gameState, input.event));
      }

      const storyEntry = story?.enterStory;
      if (typeof storyEntry !== "function") {
        throw new Error("剧情模块尚未加载，无法调用 enterStory() ");
      }

      const request = {
        contractVersion: STORY_CONTRACT_VERSION,
        requestId,
        source: "game-shell",
        input,
        context: {
          facts: [...gameState.facts],
          storyCheckpoint:
            input.type === "new-game"
              ? null
              : copyCheckpoint(gameState.storyCheckpoint)
        }
      };

      const response = await storyEntry(request);
      validateStoryResponse(response, requestId);

      if (response.status === "error") {
        return reportError(response.error);
      }

      let committedState;
      try {
        committedState = commitStoryTransaction(
          gameState,
          requestId,
          response.commit
        );
      } catch (error) {
        return reportError(
          normalizeFlowError(
            "STORY_COMMIT_FAILED",
            "剧情进度未能提交，请重试或返回主菜单。",
            error
          )
        );
      }

      replaceState(committedState);

      // 状态提交成功后才允许产生对外副作用。
      await dispatchNotifications(response.notifications);
      await dispatchCommands(response.commands);
      await renderPresentation(response.presentation);

      if (typeof onStatusChange === "function") {
        onStatusChange(response.status, response);
      }

      return {
        ok: true,
        status: response.status,
        response,
        state: gameState
      };
    } catch (error) {
      return reportError(
        normalizeFlowError(
          "FLOW_EXECUTION_FAILED",
          "游戏流程执行失败，请重试或返回主菜单。",
          error
        )
      );
    } finally {
      flowLocked = false;
    }
  }

  async function startNewGame() {
    replaceState(createInitialGameState(storageScope));
    deliveredNotificationIds.clear();
    return runStory({ type: "new-game" });
  }

  async function resumeGame() {
    const loadResult = loadGame(storageScope);
    if (!loadResult.ok) {
      return reportError(
        normalizeFlowError(loadResult.code, loadResult.message, loadResult.code)
      );
    }

    replaceState(loadResult.data);
    deliveredNotificationIds.clear();
    return runStory({ type: "resume" });
  }

  function handleStoryAction(actionId) {
    return runStory({ type: "story-action", actionId });
  }

  function handleExternalEvent(event) {
    return runStory({ type: "external-event", event });
  }

  return Object.freeze({
    startNewGame,
    resumeGame,
    handleStoryAction,
    handleExternalEvent,
    runStory,
    dispatchCommands,
    dispatchNotifications,
    renderPresentation,
    applyAppEvent,
    getState,
    getStateSnapshot,
    replaceState,
    isLocked: () => flowLocked
  });
}
