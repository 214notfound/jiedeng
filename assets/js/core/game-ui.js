// 游戏页面视图：只展示阅读数据，并把玩家操作回调给页面控制器。
import {adaptStoryPresentation} from "./reading-contract.js";

function requiredElement(id) {
  const element = document.getElementById(id);
  if (!element) {
    throw new Error(`game.html 缺少 #${id}`);
  }
  return element;
}

function makeButton(label, className, onClick) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = className;
  button.textContent = label;
  button.addEventListener("click", onClick);
  return button;
}

const SPEAKER_LABEL_PATTERN = /^【([^】]+)】\s*/u;

export function splitSpeakerLabel(text) {
  const match = SPEAKER_LABEL_PATTERN.exec(text);
  if (!match) return Object.freeze({speaker: null, text});
  const speaker = match[1].trim();
  if (!speaker) return Object.freeze({speaker: null, text});

  return Object.freeze({
    speaker,
    text: text.slice(match[0].length)
  });
}

export function splitReadingText(text) {
  const segments = [];
  const labelPattern = /(?:^|(?<=\s))【([^】\r\n]+)】/gu;

  String(text).split(/\r?\n/u).forEach((line) => {
    const matches = [...line.matchAll(labelPattern)];
    if (matches.length === 0) {
      if (line.trim() !== "") segments.push(splitSpeakerLabel(line));
      return;
    }

    if (matches[0].index > 0) {
      const prefix = line.slice(0, matches[0].index).trim();
      if (prefix) segments.push(Object.freeze({speaker: null, text: prefix}));
    }

    matches.forEach((match, index) => {
      const textStart = match.index + match[0].length;
      const textEnd = matches[index + 1]?.index ?? line.length;
      const content = line.slice(textStart, textEnd).trim();
      if (content) segments.push(Object.freeze({speaker: match[1].trim(), text: content}));
    });
  });

  return Object.freeze(segments);
}

function renderTextItem(storyElement, item) {
  storyElement.replaceChildren();
  const storyPanel = storyElement.closest?.(".story-panel");
  const segments = splitReadingText(item.text);

  storyElement.dataset.contentKind = item.kind;
  if (storyPanel) storyPanel.dataset.contentKind = item.kind;

  segments.forEach((labelledText, index) => {
    if (labelledText.speaker) {
      const speaker = document.createElement("p");
      speaker.className = "story-speaker";
      if (segments.length > 1) {
        speaker.style.position = "static";
        speaker.style.transform = "none";
      }
      speaker.textContent = labelledText.speaker;
      storyElement.append(speaker);
    }

    const paragraph = document.createElement("p");
    paragraph.className = `story-block story-block--${item.kind}`;
    paragraph.dataset.contentId = index === 0 ? item.id : `${item.id}-${index + 1}`;
    paragraph.textContent = labelledText.text;
    storyElement.append(paragraph);
  });
}

function requireReadingText(value, fieldName) {
  if (typeof value !== "string" || value.trim() === "") {
    throw new TypeError(`${fieldName} 必须是非空字符串`);
  }
}

export function validateReadingInput(nextInput) {
  if (!nextInput || typeof nextInput !== "object" || Array.isArray(nextInput)) {
    throw new TypeError("阅读输入必须是对象");
  }
  if (!["story", "conversation"].includes(nextInput.mode)) {
    throw new TypeError(`不支持的阅读模式：${String(nextInput.mode)}`);
  }
  if (!Array.isArray(nextInput.items)) {
    throw new TypeError("阅读输入.items 必须是数组");
  }
  if (!Array.isArray(nextInput.actions)) {
    throw new TypeError("阅读输入.actions 必须是数组");
  }
  if (!nextInput.metadata || typeof nextInput.metadata !== "object"
    || Array.isArray(nextInput.metadata)) {
    throw new TypeError("阅读输入.metadata 必须是对象");
  }
  if (nextInput.readingState !== undefined && nextInput.readingState !== "choice") {
    throw new TypeError(`不支持的阅读内部状态：${String(nextInput.readingState)}`);
  }

  const allowedKinds = nextInput.mode === "story"
    ? new Set(["narration", "system"])
    : new Set(["dialogue"]);
  const itemIds = new Set();
  nextInput.items.forEach((item, index) => {
    if (!item || typeof item !== "object" || Array.isArray(item)) {
      throw new TypeError(`阅读输入.items[${index}] 必须是对象`);
    }
    requireReadingText(item.id, `阅读输入.items[${index}].id`);
    requireReadingText(item.kind, `阅读输入.items[${index}].kind`);
    requireReadingText(item.text, `阅读输入.items[${index}].text`);
    if (!allowedKinds.has(item.kind)) {
      throw new TypeError(`阅读输入.items[${index}].kind 与 mode 不匹配`);
    }
    if (itemIds.has(item.id)) {
      throw new TypeError("阅读输入.items 的 id 不能重复");
    }
    itemIds.add(item.id);
  });

  const actionIds = new Set();
  nextInput.actions.forEach((action, index) => {
    if (!action || typeof action !== "object" || Array.isArray(action)) {
      throw new TypeError(`阅读输入.actions[${index}] 必须是对象`);
    }
    requireReadingText(action.actionId, `阅读输入.actions[${index}].actionId`);
    requireReadingText(action.label, `阅读输入.actions[${index}].label`);
    requireReadingText(action.actionType, `阅读输入.actions[${index}].actionType`);
    if (actionIds.has(action.actionId)) {
      throw new TypeError("阅读输入.actions 的 actionId 不能重复");
    }
    actionIds.add(action.actionId);
  });

  if (nextInput.readingState === "choice") {
    if (nextInput.mode !== "conversation") {
      throw new TypeError("NPC Choice 只能用于 conversation 模式");
    }
    if (nextInput.items.length !== 1) {
      throw new TypeError("NPC Choice 必须提供一个提示文本");
    }
    if (nextInput.actions.length < 2 || nextInput.actions.length > 4) {
      throw new TypeError("NPC Choice 必须提供 2 至 4 个选项");
    }
    if (nextInput.actions.some((action) => action.actionType !== "choice")) {
      throw new TypeError("NPC Choice 的 actionType 必须是 choice");
    }
  }

  return nextInput;
}

export function createReadingView({
  storyElement = requiredElement("game-story"),
  actionsElement = requiredElement("game-actions"),
  onComplete,
  onAction,
  onClose
} = {}) {
  const storyPanel = storyElement.closest?.(".story-panel");
  let input = null;
  let currentIndex = 0;
  let completed = false;
  let busy = false;
  let actionStatus = null;

  function clear() {
    storyElement.replaceChildren();
    actionsElement.replaceChildren();
    actionStatus = null;
    actionsElement.setAttribute("aria-busy", "false");
    storyElement.removeAttribute("data-content-kind");
    storyPanel?.removeAttribute("data-content-kind");
  }

  function setButtonsDisabled(disabled) {
    actionsElement.querySelectorAll("button").forEach((button) => {
      button.disabled = disabled;
    });
  }

  function showActionStatus(message, state) {
    actionStatus?.remove();
    actionStatus = document.createElement("p");
    actionStatus.className = `story-action-status story-action-status--${state}`;
    actionStatus.setAttribute("role", "status");
    actionStatus.textContent = message;
    actionsElement.append(actionStatus);
  }

  function clearActionStatus() {
    actionStatus?.remove();
    actionStatus = null;
  }

  function renderActions() {
    actionsElement.replaceChildren();
    actionStatus = null;
    if (!input) return;

    if (!completed) {
      const isLastItem = currentIndex >= input.items.length - 1;
      actionsElement.append(
        makeButton(
          isLastItem ? "读完" : "继续",
          "story-action story-action--continue",
          next
        )
      );
      if (input.allowClose) {
        actionsElement.append(
          makeButton("结束阅读", "story-action story-action--close", close)
        );
      }
      return;
    }

    for (const action of input.actions) {
      actionsElement.append(
        makeButton(
          action.label,
          "story-action story-action--plot",
          () => runAction(action.actionId)
        )
      );
    }
    if (input.allowClose) {
      actionsElement.append(
        makeButton("结束阅读", "story-action story-action--close", close)
      );
    }
  }

  function renderCurrentItem() {
    const item = input?.items[currentIndex];
    if (item) {
      renderTextItem(storyElement, item);
    } else {
      storyElement.replaceChildren();
    }
    renderActions();
  }

  function complete() {
    if (completed || !input) return;
    completed = true;
    renderActions();
    onComplete?.({
      mode: input.mode,
      finalItemId: input.items.at(-1)?.id ?? null,
      metadata: input.metadata
    });
  }

  function next() {
    if (!input || completed || busy) return;

    if (currentIndex < input.items.length - 1) {
      currentIndex += 1;
      renderCurrentItem();
      return;
    }

    complete();
  }

  async function runAction(actionId) {
    if (!input || !completed || busy) return;
    const actionInput = input;
    busy = true;
    actionsElement.setAttribute("aria-busy", "true");
    setButtonsDisabled(true);
    showActionStatus("正在处理，请稍候……", "busy");
    try {
      const result = await onAction?.(actionId, actionInput.metadata);
      if (input === actionInput) {
        if (result && result.ok === false) {
          showActionStatus("操作没有完成，请重试。", "error");
        } else {
          clearActionStatus();
        }
      }
      return result;
    } catch (error) {
      console.error("[white-lamp:reading-action] 阅读操作失败", error);
      if (input === actionInput) {
        showActionStatus("操作没有完成，请重试。", "error");
      }
      return {ok: false};
    } finally {
      if (input === actionInput) {
        busy = false;
        actionsElement.setAttribute("aria-busy", "false");
        setButtonsDisabled(false);
      }
    }
  }

  function open(nextInput) {
    validateReadingInput(nextInput);

    input = nextInput;
    currentIndex = 0;
    completed = input.readingState === "choice";
    busy = false;
    clear();
    storyElement.dataset.readingMode = input.mode;
    if (storyPanel) storyPanel.dataset.readingMode = input.mode;

    if (input.items.length === 0) {
      complete();
      return;
    }

    renderCurrentItem();
  }

  function update(nextInput) {
    open(nextInput);
  }

  function close() {
    input = null;
    currentIndex = 0;
    completed = false;
    busy = false;
    clear();
    storyElement.removeAttribute("data-reading-mode");
    storyPanel?.removeAttribute("data-reading-mode");
    onClose?.();
  }

  return Object.freeze({open, update, next, close});
}

export function createGameView({onStoryAction} = {}) {
  const storyElement = requiredElement("game-story");
  const actionsElement = requiredElement("game-actions");
  let readingView;
  let onReadingComplete = () => {};
  let onReadingAction = (actionId) => onStoryAction?.(actionId);
  let onReadingClose = () => {};

  function renderState() {}

  function renderResponse(response) {
    onReadingComplete = () => {};
    onReadingAction = (actionId) => onStoryAction?.(actionId);
    onReadingClose = () => {};
    if (!response.presentation) {
      readingView?.close();
      const message = document.createElement("p");
      message.className = "story-placeholder";
      message.textContent = response.status === "ended"
        ? "第一周的调查暂告一段落。"
        : "当前剧情正在等待外部交互完成。";
      storyElement.append(message);
      if (response.status === "ended") {
        const ending = document.createElement("p");
        ending.className = "ending-label";
        ending.textContent = "这一阶段的调查暂告一段落。";
        actionsElement.append(ending);
      }
      return;
    }

    readingView?.open(adaptStoryPresentation(response.presentation));
  }

  readingView = createReadingView({
    storyElement,
    actionsElement,
    onAction: (actionId, metadata) => onReadingAction(actionId, metadata),
    onComplete: (result) => onReadingComplete(result),
    onClose: () => onReadingClose()
  });

  return Object.freeze({
    renderState,
    renderResponse,
    recordNotification() {},
    setControlsDisabled(disabled) {
      actionsElement.querySelectorAll("button").forEach((button) => {
        button.disabled = disabled;
      });
    },
    openConversation(input, {
      onComplete = () => {},
      onAction = () => {},
      onClose = () => {}
    } = {}) {
      onReadingComplete = onComplete;
      onReadingAction = onAction;
      onReadingClose = onClose;
      readingView.open({...input, allowClose: true});
    },
    openSystemPrompt(presentation, {
      onComplete = () => {},
      onAction = () => {},
      onClose = () => {}
    } = {}) {
      onReadingComplete = onComplete;
      onReadingAction = onAction;
      onReadingClose = onClose;
      readingView.open(adaptStoryPresentation(presentation));
    },
    getReadingView: () => readingView
  });
}
