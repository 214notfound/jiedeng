// R10 对话服务：探索板块内独立负责对白回读、确认和事件，不推进剧情 Node。
import {NODE_SCENES, sceneName} from "../../core/story-scenes.js";
import {CONVERSATION_TASKS, conversationTaskFor} from "../data/conversations.js";
import {bindHost, requireIds} from "../../core/host-binding.js";

export function validateConversationContext(context) {
  const state = context?.state;
  const checkpoint = state?.storyCheckpoint;
  requireIds(state?.facts, "facts");
  if (!checkpoint || !NODE_SCENES[checkpoint.nodeId] || checkpoint.nodeRevision !== 1) {
    throw new Error("剧情检查点不存在或版本不兼容。");
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
    if (command.commandType !== "REQUEST_CONVERSATION") continue;
    const task = conversationTaskFor(command);
    if (!task || task.node !== checkpoint.nodeId || !Array.isArray(command.payload.goals)) {
      throw new Error("未知或不属于当前 Node 的对话任务。");
    }
    if (!Array.isArray(command.payload.npcIds) || !command.payload.npcIds.includes(task.npc)) {
      throw new Error("对话参与者不符。");
    }
  }
}

export function createConversation(host) {
  if (typeof host.dispatchExternalEvent !== "function") {
    throw new TypeError("缺少协调器 dispatchExternalEvent。");
  }
  const bound = bindHost(host, validateConversationContext);
  const presented = new Set();
  const optionalMemoryFact = "x-deflects-memory-question-noticed";
  let busy = false;
  let uncertain = false;

  const commandFor = (context, task) => context.commands.find(
    (command) => command.payload?.conversationId === task.target
  );
  const acceptsOptionalMemory = (command) => command.payload.goals.some(
    (goal) => goal.goalId === "x-memory-deflection-noticed"
  );

  function entries(context) {
    const facts = context.state.facts;
    return CONVERSATION_TASKS
      .filter((task) => task.node === context.state.storyCheckpoint.nodeId)
      .flatMap((task) => {
        const command = commandFor(context, task);
        return task.actions
          .filter((action) => command || action.facts.every((fact) => facts.includes(fact)))
          .map((action) => {
            const supportedFacts = action.facts.filter((fact) =>
              fact !== optionalMemoryFact || (command && acceptsOptionalMemory(command)));
            const completed = supportedFacts.every((fact) => facts.includes(fact));
            return {...action, task, command, supportedFacts,
              completed, available: completed || Boolean(command)};
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
    const context = bound.read();
    const currentTargets = new Set(context.commands.map((command) => command.payload?.conversationId));
    const candidates = [...CONVERSATION_TASKS]
      .filter((task) => task.node === context.state.storyCheckpoint.nodeId
        || task.actions.some((action) => action.facts.every((fact) => context.state.facts.includes(fact))))
      .reverse();
    const seenNpcs = new Set();
    const visibleTargets = new Set(candidates.filter((task) => {
      if (seenNpcs.has(task.npc)) return false;
      if (!currentTargets.has(task.target)
        && candidates.some((other) => other.npc === task.npc && currentTargets.has(other.target))) {
        return false;
      }
      seenNpcs.add(task.npc);
      return true;
    }).map((task) => task.target));
    return {
      playerStart: {x: 50, y: 92},
      hotspots: entries(context)
        .filter((action) => visibleTargets.has(action.task.target))
        .reduce((rows, action) => {
          let row = rows.find((item) => item.id === action.task.target);
          if (!row) {
            row = {id: action.task.target, x: action.task.x, y: action.task.y,
              marker: action.task.marker, reveal: "always", interactionIds: []};
            rows.push(row);
          }
          row.interactionIds.push(action.id);
          return rows;
        }, [])
    };
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
        source: "conversation",
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

  async function interact(sceneId, actionId, {confirm = false} = {}) {
    try {
      const context = bound.read();
      if (sceneId !== NODE_SCENES[context.state.storyCheckpoint.nodeId]) {
        throw new Error("地点已经变化。");
      }
      const action = entries(context).find((item) => item.id === actionId);
      if (!action) throw new Error("当前没有这段谈话。");
      if (action.completed) return {ok: true, message: action.text};
      const token = action.command.commandId + "/" + action.id;
      if (!confirm) {
        presented.add(token);
        return {ok: true, message: action.text, requiresConfirmation: true,
          commandId: action.command.commandId};
      }
      if (!presented.has(token)) throw new Error("请先阅读本段谈话。");
      await send(action.task, action.command, action.id, "NPC_TALKED", action.supportedFacts,
        {conversationId: action.task.target, npcId: action.task.npc});
      return {ok: true, message: action.text};
    } catch (error) {
      console.error("[conversation] 操作未完成。", error);
      return {ok: false, message: error.message};
    }
  }

  async function cancel(commandId, errorCode) {
    const context = bound.read();
    const command = context.commands.find((item) => item.commandId === commandId);
    const task = command && conversationTaskFor(command);
    if (!task) throw new Error("取消任务不存在。");
    if (errorCode !== undefined && (typeof errorCode !== "string" || !errorCode.trim())) {
      throw new Error("错误码无效。");
    }
    return send(task, command, errorCode ? "failed" : "cancelled",
      errorCode ? "EXTERNAL_INTERACTION_FAILED" : "EXTERNAL_INTERACTION_CANCELLED", [],
      {targetId: task.target, ...(errorCode ? {errorCode} : {})});
  }

  async function reportProgress(commandId, factIds) {
    requireIds(factIds, "对话进展事实");
    const context = bound.read();
    const command = context.commands.find((item) => item.commandId === commandId);
    const task = command && conversationTaskFor(command);
    if (!task || !factIds.length
      || factIds.some((fact) => !task.actions.some((action) => action.facts.includes(fact)))) {
      throw new Error("进展事实不属于当前对话。");
    }
    if (factIds.includes(optionalMemoryFact) && !acceptsOptionalMemory(command)) {
      throw new Error("当前剧情版本尚未开放这个可选事实。");
    }
    if (task.actions[0].facts.every((fact) =>
      context.state.facts.includes(fact) || factIds.includes(fact))) {
      throw new Error("完整谈话请通过确认完成提交，不能作为中途进展。");
    }
    return send(task, command, "progress-" + [...factIds].sort().join("-"),
      "NPC_TALK_PROGRESS", factIds, {conversationId: task.target, npcId: task.npc});
  }

  function pendingLabels() {
    return [...new Set(entries(bound.read()).filter((item) => !item.completed)
      .map((item) => item.task.label))];
  }

  return Object.freeze({
    getCurrentSceneId,
    getSceneView,
    getLayout,
    interact,
    cancel,
    reportProgress,
    pendingLabels,
    subscribe: bound.subscribe,
    dispose: bound.dispose
  });
}
