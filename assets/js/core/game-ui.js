// 游戏主界面的轻量渲染层，只显示已提交状态和剧情响应。

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

export function createGameView({
  onStoryAction
} = {}) {
  const storyElement = requiredElement("game-story");
  const actionsElement = requiredElement("game-actions");

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

  // 状态仍交给各业务视图消费；玩家界面不显示 Node、事件或内部阶段字段。
  function renderState() {}

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

    if (status === "ended") {
      const ending = document.createElement("p");
      ending.className = "ending-label";
      ending.textContent = "这一阶段的调查暂告一段落。";
      actionsElement.append(ending);
    }
  }

  function renderResponse(response) {
    renderPresentation(response.presentation, response.status);
    renderActions(response.presentation, response.commands, response.status);
  }

  // 剧情通知属于模块通信数据，只记录到开发者控制台，不进入玩家界面。
  function recordNotification() {}

  return Object.freeze({
    renderState,
    renderResponse,
    recordNotification,
    setControlsDisabled
  });
}
