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

function renderTextItem(storyElement, item) {
  storyElement.replaceChildren();
  const labelledText = splitSpeakerLabel(item.text);

  if (labelledText.speaker) {
    const speaker = document.createElement("p");
    speaker.className = "story-speaker";
    speaker.textContent = labelledText.speaker;
    storyElement.append(speaker);
  }

  const paragraph = document.createElement("p");
  paragraph.className = `story-block story-block--${item.kind}`;
  paragraph.dataset.contentId = item.id;
  paragraph.textContent = labelledText.text;
  storyElement.append(paragraph);
}

export function createReadingView({
  storyElement = requiredElement("game-story"),
  actionsElement = requiredElement("game-actions"),
  onComplete,
  onAction,
  onClose
} = {}) {
  let input = null;
  let currentIndex = 0;
  let completed = false;
  let busy = false;

  function clear() {
    storyElement.replaceChildren();
    actionsElement.replaceChildren();
  }

  function setButtonsDisabled(disabled) {
    actionsElement.querySelectorAll("button").forEach((button) => {
      button.disabled = disabled;
    });
  }

  function renderActions() {
    actionsElement.replaceChildren();
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
    busy = true;
    setButtonsDisabled(true);
    try {
      await onAction?.(actionId, input.metadata);
    } finally {
      busy = false;
      setButtonsDisabled(false);
    }
  }

  function open(nextInput) {
    if (!nextInput || typeof nextInput !== "object") {
      throw new TypeError("阅读输入必须是对象");
    }
    if (!Array.isArray(nextInput.items)) {
      throw new TypeError("阅读输入.items 必须是数组");
    }
    if (!["story", "conversation"].includes(nextInput.mode)) {
      throw new TypeError(`不支持的阅读模式：${String(nextInput.mode)}`);
    }

    input = nextInput;
    currentIndex = 0;
    completed = false;
    busy = false;
    clear();

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
    onClose?.();
  }

  return Object.freeze({open, update, next, close});
}

export function createGameView({onStoryAction} = {}) {
  const storyElement = requiredElement("game-story");
  const actionsElement = requiredElement("game-actions");
  let readingView;
  let onReadingComplete = () => {};
  let onReadingClose = () => {};

  function renderState() {}

  function renderResponse(response) {
    onReadingComplete = () => {};
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
    onAction: (actionId) => onStoryAction?.(actionId),
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
    openConversation(input, {onComplete = () => {}, onClose = () => {}} = {}) {
      onReadingComplete = onComplete;
      onReadingClose = onClose;
      readingView.open({...input, allowClose: true});
    },
    getReadingView: () => readingView
  });
}
