// R09/R12 探索服务：处理物体调查与背包回读，不处理 NPC 对话。
import {
  EXPLORATION_TASKS,
  explorationTaskFor
} from "../data/exploration.js";
import {NODE_SCENES, sceneName} from "../core/story-scenes.js";
import {ITEMS} from "../data/items.js";
import {bindHost, requireIds} from "../core/host-binding.js";

function validateEnvelope(context) {
  const state = context?.state;
  const checkpoint = state?.storyCheckpoint;
  for (const field of ["facts", "inventory", "clues"]) requireIds(state?.[field], field);
  if (!checkpoint || !NODE_SCENES[checkpoint.nodeId] || checkpoint.nodeRevision !== 1) {
    throw new Error("剧情检查点不存在或版本不兼容。");
  }
  for (const field of ["completedMilestoneIds", "completedNodeIds", "completedStageIds"]) {
    requireIds(checkpoint[field], field);
  }
  if (!Array.isArray(checkpoint.pendingCommands) || !Array.isArray(context.commands)) {
    throw new Error("缺少已提交的剧情命令。");
  }
  requireIds(checkpoint.pendingCommands.map((command) => command.commandId), "pendingCommands");
  requireIds(context.commands.map((command) => command.commandId), "commands");
  if (context.commands.length !== checkpoint.pendingCommands.length) {
    throw new Error("检查点与命令不一致。");
  }
  for (const command of context.commands) {
    const target = command.payload?.explorationId
      ?? command.payload?.conversationId
      ?? command.payload?.minigameId;
    const pending = checkpoint.pendingCommands.find((item) => item.commandId === command.commandId);
    if (!pending || pending.commandType !== command.commandType || pending.targetId !== target) {
      throw new Error("命令尚未提交或已过期。");
    }
    if (command.commandId !== "cmd-" + checkpoint.nodeId + "-" + target) {
      throw new Error("命令 ID 与 Node 清单不一致。");
    }
  }
  return {state, checkpoint};
}

export function validateExplorationContext(context) {
  const {state, checkpoint} = validateEnvelope(context);
  const overlap = state.inventory.filter((id) => state.clues.includes(id));
  if (overlap.length) throw new Error("物品与线索状态不能包含同一 ID。");
  for (const command of context.commands) {
    if (command.commandType === "REQUEST_EXPLORATION") {
      const task = explorationTaskFor(command);
      if (!task || task.node !== checkpoint.nodeId || !Array.isArray(command.payload.goals)) {
        throw new Error("未知或不属于当前 Node 的探索任务。");
      }
    }
    if (command.commandType === "REQUEST_MINIGAME") {
      if (command.payload?.minigameId !== "map-puzzle"
        || command.payload.successFactId !== "map-puzzle-completed") {
        throw new Error("未知小游戏命令。");
      }
      if (checkpoint.nodeId !== "village-map-and-route"
        || [1, 2, 3].some((number) => !state.inventory.includes("map-fragment-" + number)
          || !state.facts.includes("map-fragment-" + number + "-acquired"))) {
        throw new Error("地图任务尚未满足条件。");
      }
    }
  }
}

export function createExploration(host) {
  if (typeof host.dispatchExternalEvent !== "function") {
    throw new TypeError("缺少协调器 dispatchExternalEvent。");
  }
  const bound = bindHost(host, validateExplorationContext);
  let busy = false;
  let uncertain = false;

  const commandFor = (context, task) => context.commands.find(
    (command) => command.payload?.explorationId === task.target
  );

  function entries(context) {
    const facts = context.state.facts;
    return EXPLORATION_TASKS
      .filter((task) => task.node === context.state.storyCheckpoint.nodeId)
      .flatMap((task) => {
        const command = commandFor(context, task);
        return task.actions
          .filter((action) => command || action.facts.every((fact) => facts.includes(fact)))
          .map((action) => {
            const completed = action.facts.every((fact) => facts.includes(fact));
            return {...action, task, command, completed, available: completed || Boolean(command)};
          });
      });
  }

  function getCurrentSceneId() {
    return NODE_SCENES[bound.read().state.storyCheckpoint.nodeId];
  }

  function getSceneView(sceneId) {
    const context = bound.read();
    if (sceneId !== NODE_SCENES[context.state.storyCheckpoint.nodeId]) {
      throw new Error("地点已经变化。");
    }
    return {name: sceneName(sceneId), interactions: entries(context)};
  }

  function getLayout() {
    return {
      playerStart: {x: 50, y: 92},
      hotspots: entries(bound.read()).map((action) => ({
        id: action.id,
        x: action.x,
        y: action.y,
        marker: action.marker,
        reveal: "always",
        interactionIds: [action.id]
      }))
    };
  }

  function listItems(layer) {
    if (layer !== undefined && !["items", "clues"].includes(layer)) {
      throw new Error("未知背包分类。");
    }
    const {state} = bound.read();
    const inventory = new Set(state.inventory);
    const clues = new Set(state.clues);
    return ITEMS.flatMap((item) => {
      const stateLayer = inventory.has(item.id) ? "items" : clues.has(item.id) ? "clues" : null;
      if (!stateLayer || (layer && layer !== stateLayer)) return [];
      return [{...item, layer: stateLayer, obtained: true}];
    });
  }

  async function send(task, command, actionId, eventType, facts, payload) {
    if (busy || uncertain) throw new Error("上一操作尚未确认，请等待或重新进入。");
    busy = true;
    try {
      const current = bound.read();
      if (commandFor(current, task)?.commandId !== command.commandId) {
        throw new Error("任务已结束，请刷新当前任务。");
      }
      const event = {
        eventId: "evt-" + command.commandId + "-" + actionId + "-" + eventType.toLowerCase(),
        eventType,
        source: "exploration",
        causedByCommandId: command.commandId,
        resultFactIds: [...facts],
        payload
      };
      const result = await host.dispatchExternalEvent(event, {storageScope: bound.scope});
      const after = bound.read();
      if (!result || typeof result.ok !== "boolean") {
        uncertain = true;
        throw new Error("操作结果无法确认，请重新进入。");
      }
      if (!result.ok) throw new Error(result.message || "操作未提交，请重新进入。");
      if (!facts.every((fact) => after.state.facts.includes(fact))) {
        uncertain = true;
        throw new Error("事实尚未提交，暂时停止后续操作。");
      }
      return result;
    } catch (error) {
      uncertain = true;
      throw error;
    } finally {
      busy = false;
    }
  }

  async function interact(sceneId, actionId) {
    try {
      const context = bound.read();
      if (sceneId !== NODE_SCENES[context.state.storyCheckpoint.nodeId]) {
        throw new Error("地点已经变化。");
      }
      const action = entries(context).find((item) => item.id === actionId);
      if (!action) throw new Error("当前没有这个调查任务。");
      if (action.completed) return {ok: true, message: action.text};
      if ((action.requiredItems ?? []).some((id) => !context.state.inventory.includes(id))) {
        throw new Error("缺少开门所需的旧钥匙。");
      }
      await send(action.task, action.command, action.id, "OBJECT_INVESTIGATED",
        action.facts, {objectId: action.id});
      return {ok: true, message: action.text};
    } catch (error) {
      console.error("[exploration] 操作未完成。", error);
      return {ok: false, message: error.message};
    }
  }

  async function cancel(commandId, errorCode) {
    const context = bound.read();
    const command = context.commands.find((item) => item.commandId === commandId);
    const task = command && explorationTaskFor(command);
    if (!task) throw new Error("取消任务不存在。");
    if (errorCode !== undefined && (typeof errorCode !== "string" || !errorCode.trim())) {
      throw new Error("错误码无效。");
    }
    return send(task, command, errorCode ? "failed" : "cancelled",
      errorCode ? "EXTERNAL_INTERACTION_FAILED" : "EXTERNAL_INTERACTION_CANCELLED", [],
      {targetId: task.target, ...(errorCode ? {errorCode} : {})});
  }

  function pendingLabels() {
    return [...new Set(entries(bound.read()).filter((item) => !item.completed)
      .map((item) => item.task.label))];
  }

  function getMapCommand() {
    return bound.read().commands.find((command) =>
      command.commandType === "REQUEST_MINIGAME"
      && command.payload.minigameId === "map-puzzle") ?? null;
  }

  return Object.freeze({
    getCurrentSceneId,
    getSceneView,
    getLayout,
    listItems,
    interact,
    cancel,
    pendingLabels,
    getMapCommand,
    canStartMapPuzzle: () => Boolean(getMapCommand()),
    subscribe: bound.subscribe,
    dispose: bound.dispose
  });
}
