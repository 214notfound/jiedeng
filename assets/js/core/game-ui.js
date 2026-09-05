// 游戏主界面的轻量渲染层，只显示已提交状态和剧情响应。

const STAGE_NAMES = Object.freeze({
  prologue: "祠堂",
  village: "村口",
  "old-house": "陈家老宅"
});

const COMMAND_LABELS = Object.freeze({
  REQUEST_EXPLORATION: "调查任务",
  REQUEST_CONVERSATION: "对话任务",
  REQUEST_MINIGAME: "小游戏"
});

function requiredElement(id) {
  const element = document.getElementById(id);
  if (!element) {
    throw new Error(`game.html 缺少 #${id}`);
  }
  return element;
}

function stageFromNodeId(nodeId) {
  if (!nodeId) return null;
  if (nodeId.startsWith("prologue-")) return "prologue";
  if (nodeId.startsWith("village-")) return "village";
  return "old-house";
}

function makeButton(label, className, onClick) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = className;
  button.textContent = label;
  button.addEventListener("click", onClick);
  return button;
}

export function createGameView({
  debugMode = false,
  onStoryAction,
  onDebugCommand
} = {}) {
  const storyElement = requiredElement("game-story");
  const actionsElement = requiredElement("game-actions");
  const stageElement = requiredElement("stage-label");
  const nodeElement = requiredElement("node-label");
  const logElement = requiredElement("story-log");
  const debugBadge = document.getElementById("debug-badge");

  if (debugBadge) {
    debugBadge.hidden = !debugMode;
  }

  function setControlsDisabled(disabled) {
    actionsElement.querySelectorAll("button").forEach((button) => {
      button.disabled = disabled;
    });
  }

  async function runControl(action) {
    setControlsDisabled(true);
    try {
      await action();
    } finally {
      setControlsDisabled(false);
    }
  }

  function renderState(state) {
    if (!state) return;
    const nodeId = state.storyCheckpoint?.nodeId || state.currentNodeId;
    const stageId = stageFromNodeId(nodeId) || state.stage;
    stageElement.textContent = STAGE_NAMES[stageId] || stageId || "初始化";
    nodeElement.textContent = nodeId || "正在建立检查点";
  }

  function renderPresentation(presentation, status) {
    storyElement.replaceChildren();

    if (!presentation) {
      const message = document.createElement("p");
      message.className = "story-placeholder";
      message.textContent = status === "ended"
        ? "第一周的调查暂告一段落。"
        : "当前剧情正在等待外部交互完成。";
      storyElement.append(message);
      return;
    }

    presentation.blocks.forEach((block) => {
      const paragraph = document.createElement("p");
      paragraph.className = `story-block story-block--${block.blockType}`;
      paragraph.textContent = block.text;
      storyElement.append(paragraph);
    });
  }

  function renderActions(presentation, commands, status) {
    actionsElement.replaceChildren();

    for (const action of presentation?.actions || []) {
      actionsElement.append(
        makeButton(
          action.label,
          "story-action",
          () => runControl(() => onStoryAction?.(action.actionId))
        )
      );
    }

    for (const command of commands) {
      const card = document.createElement("article");
      card.className = "command-card";

      const heading = document.createElement("h3");
      heading.textContent = COMMAND_LABELS[command.commandType] || command.commandType;
      card.append(heading);

      const target = document.createElement("p");
      target.className = "command-target";
      target.textContent = command.payload.conversationId ||
        command.payload.explorationId ||
        command.payload.minigameId ||
        command.commandId;
      card.append(target);

      const goals = document.createElement("ul");
      for (const goal of command.payload.goals || []) {
        const item = document.createElement("li");
        item.textContent = goal.description;
        goals.append(item);
      }
      if (goals.childElementCount > 0) card.append(goals);

      const waiting = document.createElement("p");
      waiting.className = "command-waiting";
      waiting.textContent = "等待对应功能模块返回结果";
      card.append(waiting);

      if (debugMode) {
        card.append(
          makeButton(
            "联调：模拟完成",
            "debug-action",
            () => runControl(() => onDebugCommand?.(command))
          )
        );
      }

      actionsElement.append(card);
    }

    if (status === "ended") {
      const ending = document.createElement("p");
      ending.className = "ending-label";
      ending.textContent = "V1 · 第一周结束";
      actionsElement.append(ending);
    }
  }

  function renderResponse(response) {
    renderPresentation(response.presentation, response.status);
    renderActions(response.presentation, response.commands, response.status);
  }

  function recordNotification(notification) {
    logElement.querySelector(".empty-item")?.remove();
    const entry = document.createElement("li");
    entry.textContent = notification.eventType;
    logElement.prepend(entry);
    while (logElement.childElementCount > 5) {
      logElement.lastElementChild.remove();
    }
  }

  return Object.freeze({
    renderState,
    renderResponse,
    recordNotification,
    setControlsDisabled
  });
}
