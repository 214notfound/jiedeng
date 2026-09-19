import {mountHauntingNetwork} from "../haunting-network/index.js";
import {mountMineRoute} from "../mine-route/index.js";
import {mountXShowdownChase} from "../x-showdown-chase/index.js";

const DEFINITIONS = Object.freeze({
  "haunting-network-puzzle": Object.freeze({
    gameStyle: "puzzle", title: "拆解控制室网络", mount: mountHauntingNetwork,
    results: Object.freeze({
      "haunting-is-engineered": Object.freeze({
        label: "完成线路核对",
        description: "三套装置的线路已经接通，异常现象来自同一套人工控制系统。",
        exitAssetId: "haunting-network-exit"
      })
    }),
    resultByKey: Object.freeze({success: "haunting-is-engineered"})
  }),
  "mine-route-puzzle": Object.freeze({
    gameStyle: "puzzle", title: "还原矿井路线", mount: mountMineRoute,
    results: Object.freeze({
      "sealed-mine-bypassed": Object.freeze({
        label: "确认潜入路线",
        description: "排水阀已经开启，你绕过封闭通道抵达了内部竖井。",
        exitAssetId: "mine-route-exit"
      })
    }),
    resultByKey: Object.freeze({success: "sealed-mine-bypassed"})
  }),
  "x-showdown-chase": Object.freeze({
    gameStyle: "chase", title: "逃离数据机房", mount: mountXShowdownChase,
    results: Object.freeze({
      "x-showdown-survived": Object.freeze({
        label: "携证据逃离",
        description: "三份关键证据已经带出机房，你成功离开了控制区。",
        exitAssetId: "x-showdown-success"
      }),
      "x-showdown-lost": Object.freeze({
        label: "追逐中失手",
        description: "你没能摆脱小周，关键证据被留在了控制区。",
        exitAssetId: "x-showdown-failure"
      })
    }),
    resultByKey: Object.freeze({success: "x-showdown-survived", failure: "x-showdown-lost"})
  })
});

export function v3MinigameDefinitionFor(minigameId) {
  return DEFINITIONS[minigameId] ?? null;
}

export function validateV3MinigameCommand(command) {
  if (!command || typeof command !== "object" || command.commandType !== "REQUEST_MINIGAME") {
    throw new TypeError("小游戏入口缺少有效命令。");
  }
  if (typeof command.commandId !== "string" || !command.commandId.trim()) {
    throw new TypeError("小游戏入口缺少命令标识。");
  }
  const payload = command.payload ?? {};
  const definition = v3MinigameDefinitionFor(payload.minigameId);
  if (!definition || payload.gameStyle !== definition.gameStyle) {
    throw new TypeError("小游戏类型与 V3 契约不一致。");
  }
  const expected = Object.keys(definition.results);
  if (!Array.isArray(payload.allowedResultFactIds)
    || payload.allowedResultFactIds.length !== expected.length
    || new Set(payload.allowedResultFactIds).size !== expected.length
    || expected.some((factId) => !payload.allowedResultFactIds.includes(factId))) {
    throw new TypeError("小游戏结果与 V3 契约不一致。");
  }
  return definition;
}

export function createV3MinigameEvent(command, resultFactId) {
  const definition = validateV3MinigameCommand(command);
  if (!definition.results[resultFactId]) throw new TypeError("小游戏结果不在当前命令允许范围内。");
  return {
    eventId: `evt-${command.commandId}-${resultFactId}-minigame_resolved`,
    eventType: "MINIGAME_RESOLVED", source: "minigame",
    causedByCommandId: command.commandId, resultFactIds: [resultFactId],
    payload: {minigameId: command.payload.minigameId}
  };
}

export function createV3MinigameCancelEvent(command) {
  validateV3MinigameCommand(command);
  return {
    eventId: `evt-${command.commandId}-external_interaction_cancelled`,
    eventType: "EXTERNAL_INTERACTION_CANCELLED", source: "minigame",
    causedByCommandId: command.commandId, resultFactIds: [],
    payload: {targetId: command.payload.minigameId}
  };
}

export function createV3MinigameFailureEvent(command, errorCode) {
  validateV3MinigameCommand(command);
  if (typeof errorCode !== "string" || !errorCode.trim()) {
    throw new TypeError("小游戏技术错误缺少错误码。");
  }
  return {
    eventId: `evt-${command.commandId}-${errorCode}-external_interaction_failed`,
    eventType: "EXTERNAL_INTERACTION_FAILED", source: "minigame",
    causedByCommandId: command.commandId, resultFactIds: [],
    payload: {targetId: command.payload.minigameId, errorCode}
  };
}

function element(tagName, className, text) {
  const node = document.createElement(tagName);
  node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

export function createV3MinigameGateway({container, onEvent, onClose,
  imageBase = "../assets/images/exploration/scenes/v3/"}) {
  if (!container || typeof container.append !== "function") throw new TypeError("V3 小游戏缺少挂载区域。");
  if (typeof onEvent !== "function" || typeof onClose !== "function") {
    throw new TypeError("V3 小游戏缺少结果或关闭回调。");
  }

  let activeCommand = null;
  let activeRoot = null;
  let activeGame = null;
  let errorPanel = null;
  let busy = false;
  let resolved = false;

  function clearError() { errorPanel?.remove(); errorPanel = null; }
  function clear() {
    clearError();
    activeGame?.destroy();
    activeGame = null;
    activeRoot?.remove();
    activeRoot = null;
  }
  function finishClose() {
    clear(); activeCommand = null; busy = false; resolved = false; onClose();
  }
  function renderImage(root, assetId, alt) {
    const image = element("img", "v3-minigame__image");
    image.src = `${imageBase}${assetId}.jpg`; image.alt = alt; root.append(image);
  }
  function renderOutcome(definition, resultFactId) {
    const result = definition.results[resultFactId];
    clear();
    const root = element("section", "v3-minigame v3-minigame--outcome");
    root.setAttribute("aria-label", `${definition.title}结果`);
    renderImage(root, result.exitAssetId, result.description);
    const panel = element("div", "v3-minigame__panel");
    panel.append(element("h2", "v3-minigame__title", result.label),
      element("p", "v3-minigame__description", result.description));
    const closeButton = element("button", "button button--primary", "继续剧情");
    closeButton.type = "button";
    closeButton.addEventListener("click", finishClose, {once: true});
    panel.append(closeButton); root.append(panel); container.append(root); activeRoot = root;
    closeButton.focus();
  }
  function showRetry(message, retry) {
    clearError();
    if (!activeRoot) return;
    errorPanel = element("div", "v3-minigame__submit-error");
    errorPanel.setAttribute("role", "alert");
    const card = element("div", "v3-minigame__submit-error-card");
    card.append(element("p", "", message));
    const button = element("button", "button button--primary", "重试保存");
    button.type = "button"; button.addEventListener("click", retry, {once: true});
    card.append(button); errorPanel.append(card); activeRoot.append(errorPanel); button.focus();
  }
  async function submitResult(command, definition, factId) {
    if (busy || resolved || activeCommand !== command) return {ok: false};
    busy = true; clearError();
    try {
      const outcome = await onEvent(createV3MinigameEvent(command, factId));
      if (!outcome?.ok) {
        showRetry("结果未能保存，请重试。", () => submitResult(command, definition, factId));
        return outcome ?? {ok: false};
      }
      resolved = true; renderOutcome(definition, factId); return outcome;
    } catch (error) {
      console.error("[v3-minigame] 结果提交失败", error);
      showRetry("结果未能保存，请重试。", () => submitResult(command, definition, factId));
      return {ok: false, error};
    } finally { busy = false; }
  }
  async function cancel(command) {
    if (busy || resolved || activeCommand !== command) return {ok: false};
    busy = true; clearError();
    try {
      const outcome = await onEvent(createV3MinigameCancelEvent(command));
      if (!outcome?.ok) return outcome ?? {ok: false};
      finishClose(); return outcome;
    } catch (error) {
      console.error("[v3-minigame] 取消提交失败", error);
      return {ok: false, error};
    } finally { busy = false; }
  }
  async function technicalFailure(command, errorCode) {
    if (busy || resolved || activeCommand !== command) return {ok: false};
    busy = true; clearError();
    try {
      const outcome = await onEvent(createV3MinigameFailureEvent(command, errorCode));
      if (!outcome?.ok) {
        showRetry("故障状态未能保存，请重试。", () => technicalFailure(command, errorCode));
        return outcome ?? {ok: false};
      }
      finishClose(); return outcome;
    } catch (error) {
      console.error("[v3-minigame] 技术失败提交失败", error);
      showRetry("故障状态未能保存，请重试。", () => technicalFailure(command, errorCode));
      return {ok: false, error};
    } finally { busy = false; }
  }
  function start(command) {
    const definition = validateV3MinigameCommand(command);
    clear(); activeCommand = command; busy = false; resolved = false;
    const root = element("section", "v3-minigame-host");
    root.setAttribute("aria-label", definition.title); container.append(root); activeRoot = root;
    try {
      activeGame = definition.mount(root, {
        onResult(resultKey) {
          const factId = definition.resultByKey[resultKey];
          if (!factId) return Promise.reject(new TypeError("小游戏返回了未登记的结果。"));
          return submitResult(command, definition, factId);
        },
        onCancel() { return cancel(command); },
        onTechnicalError(errorCode) { return technicalFailure(command, errorCode); }
      });
    } catch (error) {
      console.error("[v3-minigame] 挂载失败", error);
      void technicalFailure(command, "MOUNT_FAILED");
    }
  }
  function close() {
    if (!activeCommand || resolved) { finishClose(); return Promise.resolve({ok: true}); }
    return cancel(activeCommand);
  }
  function destroy() { clear(); activeCommand = null; busy = false; resolved = false; }
  return Object.freeze({start, close, destroy});
}
