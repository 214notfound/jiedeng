const DEFINITIONS = Object.freeze({
  "haunting-network-puzzle": Object.freeze({
    gameStyle: "puzzle",
    title: "拆解借灯网络",
    entryAssetId: "haunting-network-entry",
    results: Object.freeze({
      "haunting-is-engineered": Object.freeze({
        label: "完成线路核对",
        description: "确认白灯、广播与湿脚印来自同一套人工系统。",
        exitAssetId: "haunting-network-exit"
      })
    })
  }),
  "mine-route-puzzle": Object.freeze({
    gameStyle: "puzzle",
    title: "还原矿井路线",
    entryAssetId: "mine-route-entry",
    results: Object.freeze({
      "sealed-mine-bypassed": Object.freeze({
        label: "确认潜入路线",
        description: "利用旧矿图和排水洞坐标绕过封墙。",
        exitAssetId: "mine-route-exit"
      })
    })
  }),
  "x-showdown-chase": Object.freeze({
    gameStyle: "chase",
    title: "逃离数据机房",
    entryAssetId: "x-showdown-entry",
    results: Object.freeze({
      "x-showdown-survived": Object.freeze({
        label: "成功外发并逃离",
        description: "证据备份完成外发，你离开了控制区。",
        exitAssetId: "x-showdown-success"
      }),
      "x-showdown-lost": Object.freeze({
        label: "封锁中失手",
        description: "出口被封锁，小周回收了证据。",
        exitAssetId: "x-showdown-failure"
      })
    })
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
  if (!definition.results[resultFactId]) {
    throw new TypeError("小游戏结果不在当前命令允许范围内。");
  }
  return {
    eventId: `evt-${command.commandId}-${resultFactId}-minigame_resolved`,
    eventType: "MINIGAME_RESOLVED",
    source: "minigame",
    causedByCommandId: command.commandId,
    resultFactIds: [resultFactId],
    payload: {minigameId: command.payload.minigameId}
  };
}

function element(tagName, className, text) {
  const node = document.createElement(tagName);
  node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

export function createV3MinigameGateway({
  container,
  onEvent,
  onClose,
  imageBase = "../assets/images/exploration/scenes/v3/"
}) {
  if (!container || typeof container.append !== "function") {
    throw new TypeError("V3 小游戏缺少挂载区域。");
  }
  if (typeof onEvent !== "function" || typeof onClose !== "function") {
    throw new TypeError("V3 小游戏缺少结果或关闭回调。");
  }

  let activeCommand = null;
  let activeRoot = null;
  let busy = false;
  let resolved = false;

  function clear() {
    activeRoot?.remove();
    activeRoot = null;
  }

  function renderImage(root, assetId, alt) {
    const image = element("img", "v3-minigame__image");
    image.src = `${imageBase}${assetId}.jpg`;
    image.alt = alt;
    root.append(image);
  }

  function close() {
    clear();
    activeCommand = null;
    busy = false;
    resolved = false;
    onClose();
  }

  function renderOutcome(definition, resultFactId) {
    const result = definition.results[resultFactId];
    clear();
    const root = element("section", "v3-minigame v3-minigame--outcome");
    root.setAttribute("aria-label", `${definition.title}结果`);
    renderImage(root, result.exitAssetId, result.description);
    const panel = element("div", "v3-minigame__panel");
    panel.append(
      element("h2", "v3-minigame__title", definition.title),
      element("p", "v3-minigame__description", result.description)
    );
    const closeButton = element("button", "button button--primary", "继续剧情");
    closeButton.type = "button";
    closeButton.addEventListener("click", close);
    panel.append(closeButton);
    root.append(panel);
    container.append(root);
    activeRoot = root;
    closeButton.focus();
  }

  function start(command) {
    const definition = validateV3MinigameCommand(command);
    clear();
    activeCommand = command;
    busy = false;
    resolved = false;

    const root = element("section", "v3-minigame");
    root.setAttribute("aria-label", definition.title);
    renderImage(root, definition.entryAssetId, definition.title);
    const panel = element("div", "v3-minigame__panel");
    panel.append(
      element("h2", "v3-minigame__title", definition.title),
      element("p", "v3-minigame__description", "本阶段只实现玩法入口与结果回传，请选择本次结果。")
    );
    const actions = element("div", "v3-minigame__actions");
    const status = element("p", "v3-minigame__status");
    status.setAttribute("role", "status");

    for (const [factId, result] of Object.entries(definition.results)) {
      const button = element("button", "button button--primary", result.label);
      button.type = "button";
      button.dataset.resultFactId = factId;
      button.addEventListener("click", async () => {
        if (busy || resolved || activeCommand !== command) return;
        busy = true;
        actions.querySelectorAll("button").forEach((item) => { item.disabled = true; });
        status.textContent = "正在保存结果……";
        try {
          const outcome = await onEvent(createV3MinigameEvent(command, factId));
          if (!outcome?.ok) {
            status.textContent = "结果未能保存，请重试。";
            return;
          }
          resolved = true;
          renderOutcome(definition, factId);
        } catch (error) {
          console.error("[v3-minigame] 结果提交失败", error);
          status.textContent = "结果未能保存，请重试。";
        } finally {
          busy = false;
          if (!resolved && activeRoot === root) {
            actions.querySelectorAll("button").forEach((item) => { item.disabled = false; });
          }
        }
      });
      actions.append(button);
    }

    const exitButton = element("button", "button", "退出，稍后再来");
    exitButton.type = "button";
    exitButton.addEventListener("click", close);
    actions.append(exitButton);
    panel.append(actions, status);
    root.append(panel);
    container.append(root);
    activeRoot = root;
    actions.querySelector("button")?.focus();
  }

  function destroy() {
    clear();
    activeCommand = null;
    busy = false;
    resolved = false;
  }

  return Object.freeze({start, close, destroy});
}
