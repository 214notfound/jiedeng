// 真实引擎联调夹具：只模拟全局协调器、状态事务与演示存储，不是正式账户/存档实现。
import { TASKS, taskFor } from "../../../assets/js/exploration/data/exploration.js";
import { validateExplorationContext } from "../../../assets/js/exploration/game/exploration.js";
import { getAchievementEvents } from "../../../assets/js/achievements/game/achievements.js";
import { requireIds } from "../../../assets/js/exploration/game/host-reader.js";

export const DEMO_KEY = "jiedeng:demo:engine-handoff:v3";
const clone = value => JSON.parse(JSON.stringify(value));
const add = (list, value) => { if (!list.includes(value)) list.push(value); };

export function createEngineHost({ enterStory, storage = null, scope = "guest" }) {
  if (typeof enterStory !== "function") throw new TypeError("缺少剧情入口。");
  if (!/^(guest|account:[^\s]+)$/.test(scope)) throw new Error("存储域无效。");
  const key = DEMO_KEY + ":" + scope;
  let current = {
    version: 3, scope, facts: [], inventory: ["burned-work-id", "blue-glass-bead"],
    clues: [], locations: [], achievements: [], achievementTimes: {}, processed: {},
    onceKeys: [], requestSequence: 0, storyCheckpoint: null, ended: false
  };
  let response;
  let disposed = false;
  let busy = false;
  const listeners = new Set();

  function contextOf(state, output = response) {
    return { storageScope: scope, state: clone(state), commands: clone(output.commands) };
  }
  function checkState(state) {
    if (state?.version !== 3 || state.scope !== scope) throw new Error("演示存档版本或身份不符。");
    for (const field of ["facts", "inventory", "clues", "locations", "achievements", "onceKeys"]) {
      requireIds(state[field], field);
    }
    if (!state.processed || typeof state.processed !== "object" || Array.isArray(state.processed)
        || !Number.isSafeInteger(state.requestSequence) || state.requestSequence < 0) {
      throw new Error("演示事务记录损坏。");
    }
    getAchievementEvents({ storageScope: scope, state });
  }

  function applyStoryEffect(state, event) {
    if (state.onceKeys.includes(event.onceKey)) return;
    const payload = event.payload;
    switch (event.eventType) {
      case "STORY_FACT_RECORDED":
        add(state.facts, payload.factId);
        break;
      case "ITEM_ACQUIRED":
        add(state.inventory, payload.itemId);
        add(state.facts, payload.itemId + "-acquired");
        break;
      case "CLUE_RECORDED":
        add(state.clues, payload.clueId);
        break;
      case "LOCATION_UNLOCKED":
        add(state.locations, payload.locationId);
        add(state.facts, payload.locationId + "-unlocked");
        break;
      default:
        throw new Error("未支持的剧情状态事件：" + event.eventType);
    }
    add(state.onceKeys, event.onceKey);
  }

  function invoke(candidate, input) {
    candidate.requestSequence += 1;
    const output = enterStory({
      contractVersion: "1.0",
      requestId: "demo-request-" + candidate.requestSequence,
      source: "game-shell",
      input,
      context: { facts: clone(candidate.facts), storyCheckpoint: clone(candidate.storyCheckpoint) }
    });
    if (output.status === "error") {
      const error = new Error(output.error.userMessage + " " + output.error.developerMessage);
      error.code = output.error.errorCode;
      throw error;
    }
    if (!output.commit || !Array.isArray(output.commands)) throw new Error("剧情响应结构不完整。");
    for (const event of output.commit.events) applyStoryEffect(candidate, event);
    candidate.storyCheckpoint = clone(output.commit.checkpoint);
    candidate.ended = output.status === "ended";
    for (const event of getAchievementEvents({ storageScope: scope, state: candidate })) {
      add(candidate.achievements, event.payload.achievementId);
      candidate.achievementTimes[event.payload.achievementId] = new Date().toISOString();
      add(candidate.onceKeys, event.onceKey);
    }
    validateExplorationContext(contextOf(candidate, output));
    checkState(candidate);
    return output;
  }

  function publish(candidate, output) {
    // 夹具把两阶段事务置于一个可回滚候选中；存储成功后才换快照、发通知和渲染。
    // 正式状态模块需实现自己的提交、待处理事件及失败恢复，不可直接复制本夹具。
    if (storage) storage.setItem(key, JSON.stringify(candidate));
    current = candidate;
    response = output;
    for (const listener of [...listeners]) {
      try { listener(); } catch (error) { console.error("[engine-demo] 更新失败。", error); }
    }
  }

  const saved = storage?.getItem(key);
  if (saved != null) current = JSON.parse(saved);
  checkState(current);
  const restored = clone(current);
  response = invoke(restored, { type: saved == null ? "new-game" : "resume" });
  publish(restored, response);

  function verifyExternal(event) {
    const command = response.commands.find(item => item.commandId === event.causedByCommandId);
    if (!command) throw new Error("STORY_STALE_EXTERNAL_EVENT");
    requireIds(event.resultFactIds, "resultFactIds");
    const task = taskFor(command);
    const target = command.payload.explorationId ?? command.payload.conversationId ?? command.payload.minigameId;
    if (event.source !== (task?.type ?? "minigame") || !event.payload) throw new Error("事件来源或内容不符。");
    if (["EXTERNAL_INTERACTION_CANCELLED", "EXTERNAL_INTERACTION_FAILED"].includes(event.eventType)) {
      if (event.resultFactIds.length || event.payload.targetId !== target) throw new Error("取消或失败不能提交事实。");
      return;
    }
    if (task?.type === "exploration") {
      const action = task.actions.find(item => item.id === event.payload.objectId);
      if (!action || event.eventType !== "OBJECT_INVESTIGATED"
          || action.facts.length !== event.resultFactIds.length
          || !action.facts.every(fact => event.resultFactIds.includes(fact))) throw new Error("调查对象和事实不符。");
      if ((action.requiredItems ?? []).some(id => !current.inventory.includes(id))) throw new Error("缺少必要物品。");
    } else if (task?.type === "conversation") {
      if (event.resultFactIds.some(fact => !task.actions.some(action => action.facts.includes(fact)))) throw new Error("无权产生这个事实。");
    } else if (event.eventType !== "MAP_PUZZLE_COMPLETED" || target !== "map-puzzle"
        || event.resultFactIds.length !== 1 || event.resultFactIds[0] !== "map-puzzle-completed") {
      throw new Error("小游戏结果不符。");
    }
    // 引擎再次验证 commandId、NPC、目标、生产者及完整目标，夹具不能替它判下一 Node。
  }

  function dispatchExternalEvent(event, meta) {
    if (disposed || meta?.storageScope !== scope) throw new Error("当前身份已失效。");
    if (busy) throw new Error("事务正在处理。");
    if (typeof event?.eventId !== "string" || !event.eventId || event.eventId === "__proto__") throw new Error("事件 ID 无效。");
    const signature = JSON.stringify(event);
    if (Object.hasOwn(current.processed, event.eventId)) {
      if (current.processed[event.eventId] !== signature) throw new Error("相同事件 ID 的内容发生变化。");
      return { ok: true };
    }
    busy = true;
    try {
      verifyExternal(event);
      const candidate = clone(current);
      for (const fact of event.resultFactIds) add(candidate.facts, fact);
      const output = invoke(candidate, { type: "external-event", event: clone(event) });
      candidate.processed[event.eventId] = signature;
      publish(candidate, output);
      return { ok: true };
    } finally { busy = false; }
  }

  function act(actionId) {
    if (disposed || busy) throw new Error("当前操作不可用。");
    busy = true;
    try {
      const candidate = clone(current);
      const output = invoke(candidate, { type: "story-action", actionId });
      publish(candidate, output);
    } finally { busy = false; }
  }

  return {
    getContext() {
      if (disposed) throw new Error("宿主已卸载。");
      return contextOf(current);
    },
    dispatchExternalEvent,
    act,
    getPresentation() {
      const presentation = clone(response.presentation);
      return {
        ...presentation,
        text: presentation?.blocks.map(block => block.text).join("\n\n")
          || (current.ended ? "第一周内容结束。怪事与公司之间的联系仍有待追查。" : ""),
        actions: presentation?.actions ?? [],
        ended: current.ended
      };
    },
    subscribe(listener) {
      if (disposed) throw new Error("宿主已卸载。");
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    listenerCount: () => listeners.size,
    dispose() { disposed = true; listeners.clear(); }
  };
}

