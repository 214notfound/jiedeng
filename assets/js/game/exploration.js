// 探索接入服务：读取宿主快照、验证前置条件并提交事件，不直接保存数据。
import { getScenes, getItems, MAP_ACHIEVEMENT } from "../data/exploration.js";
import { validateExplorationState } from "./exploration-state.js";

export const EXPLORATION_EVENTS = Object.freeze({
  OBJECT_INVESTIGATED: "OBJECT_INVESTIGATED",
  NPC_TALKED: "NPC_TALKED",
  MAP_PUZZLE_COMPLETED: "MAP_PUZZLE_COMPLETED",
  ACHIEVEMENT_UNLOCKED: "ACHIEVEMENT_UNLOCKED"
});
const STAGE_ORDER = ["prologue", "village", "old-house", "week-one-end"];
const hasAll = (values, required) => required.every((id) => values.includes(id));

export function createExploration({ getContext, dispatch, subscribe }) {
  for (const value of [getContext, dispatch, subscribe]) {
    if (typeof value !== "function") throw new TypeError("需要 getContext、dispatch、subscribe 函数。");
  }
  const scope = getContext()?.storageScope;
  if (typeof scope !== "string" || !/^(guest|account:[^\s]+)$/.test(scope)) {
    throw new TypeError("storageScope 必须来自有效账户或游客会话。");
  }
  const scenes = getScenes();
  const items = getItems();
  const subscriptions = new Set();
  let disposed = false;
  let submitting = false;
  let blockedReason = "";

  function readState() {
    if (disposed) throw new Error("模块已卸载。");
    if (blockedReason) throw new Error(blockedReason);
    const context = getContext();
    if (context?.storageScope !== scope) {
      blockedReason = "身份已变化，请重新进入游戏。";
      throw new Error(blockedReason);
    }
    const state = structuredClone(context.state);
    validateExplorationState(state);
    return state;
  }
  readState();

  function getSceneView(sceneId) {
    const scene = scenes.find(({ id }) => id === sceneId);
    if (!scene) throw new Error("未知场景：" + sceneId);
    const state = readState();
    const unlocked = STAGE_ORDER.indexOf(sceneId) <= STAGE_ORDER.indexOf(state.stage);
    return {
      ...structuredClone(scene), unlocked,
      interactions: scene.interactions.map((action) => ({
        ...structuredClone(action),
        completed: state.investigated.includes(action.id),
        available: unlocked && hasAll(state.investigated, action.prerequisites.interactionIds)
          && hasAll(state.inventory, action.prerequisites.itemIds)
      }))
    };
  }

  function getExitStatus(sceneId) {
    const scene = getSceneView(sceneId);
    if (!scene.unlocked) return { canLeave: false, message: "当前地点尚未开放。" };
    const required = new Set(scene.completionInteractionIds);
    const pending = scene.interactions.filter((action) => required.has(action.id) && !action.completed);
    if (pending.length) {
      const labels = pending.filter((action) => action.available).map((action) => action.label);
      return { canLeave: false, message: labels.length
        ? "还需完成：" + labels.join("、") + "。"
        : "请先完成当前可见调查，再继续探索。" };
    }
    const state = readState();
    if (sceneId === "village" && !state.puzzle.mapRestored) {
      return { canLeave: false, message: "三块碎片已集齐，请先完成手绘地图复原。" };
    }
    return { canLeave: true, message: sceneId === "old-house"
      ? "第一次隔门呼名已结束。第一周内容结束。" : "必要调查已完成。" };
  }

  function interact(sceneId, interactionId) {
    if (submitting) return { ok: false, message: "正在处理上一次调查，请稍候。" };
    let dispatched = false;
    try {
      const action = getSceneView(sceneId).interactions.find(({ id }) => id === interactionId);
      if (!action) return { ok: false, message: "没有这个调查对象。" };
      if (!action.available) return { ok: false, message: action.lockedText ?? "当前地点尚未开放。" };
      if (action.completed) return {
        ok: true, firstTime: false, message: action.repeatText, speaker: action.speaker ?? null
      };
      const payload = action.npcId
        ? { npcId: action.npcId, interactionId: action.id }
        : { objectId: action.id };
      if (action.rewardItemId) payload[action.npcId ? "rewardItemId" : "itemId"] = action.rewardItemId;
      submitting = true;
      dispatched = true;
      const result = dispatch({
        type: action.npcId ? EXPLORATION_EVENTS.NPC_TALKED : EXPLORATION_EVENTS.OBJECT_INVESTIGATED, payload
      }, { storageScope: scope });
      if (result && typeof result.then === "function") {
        Promise.resolve(result).catch((error) => console.error("[exploration] 异步提交失败。", error));
        throw new Error("状态提交尚未确认，请重新加载。dispatch 必须同步完成。");
      }
      if (!result || typeof result.ok !== "boolean") throw new Error("状态接口返回格式无效，请重新加载。");
      if (!result.ok) {
        const afterFailure = readState();
        if (afterFailure.investigated.includes(action.id)) {
          throw new Error("宿主报告失败但已更改进度，请重新加载检查。");
        }
        return { ok: false, message: result.message || "操作未被全局状态接受。" };
      }
      const state = readState();
      if (!state.investigated.includes(action.id) || (action.rewardItemId && !state.inventory.includes(action.rewardItemId))) {
        throw new Error("全局尚未记录调查或奖励，请检查事件接入。");
      }
      return { ok: true, firstTime: true, message: action.firstText, speaker: action.speaker ?? null };
    } catch (error) {
      if (dispatched) blockedReason = "状态提交结果不确定，已暂停操作。请重新加载并检查进度。";
      console.error("[exploration] 调查失败。", error);
      return { ok: false, message: error instanceof Error ? error.message : "调查失败，请重试。" };
    } finally {
      submitting = false;
    }
  }

  function listItems(layer) {
    if (layer !== undefined && !["items", "clues"].includes(layer)) throw new TypeError("未知背包分类。");
    const state = readState();
    return items.filter((item) => state.inventory.includes(item.id) && (!layer || item.layer === layer))
      .map((item) => ({ ...item, obtained: true }));
  }
  function listAchievements() {
    const state = readState();
    return [{
      ...MAP_ACHIEVEMENT, unlocked: state.achievements.includes(MAP_ACHIEVEMENT.id),
      unlockedAt: state.achievementTimes?.[MAP_ACHIEVEMENT.id] ?? null
    }];
  }
  function canStartMapPuzzle() {
    const state = readState();
    return !state.puzzle.mapRestored && getSceneView("village").unlocked
      && hasAll(state.inventory, ["map-fragment-1", "map-fragment-2", "map-fragment-3"])
      && hasAll(state.investigated, scenes.find(({ id }) => id === "village").completionInteractionIds);
  }

  function onChange(listener) {
    if (disposed) throw new Error("模块已卸载。");
    if (typeof listener !== "function") throw new TypeError("订阅回调必须为函数。");
    let stopped = false;
    const unsubscribe = subscribe(() => {
      if (disposed || stopped) return;
      try {
        // 即使切换后又切回同一身份，旧实例也不再恢复工作。
        if (getContext()?.storageScope !== scope) blockedReason = "身份已变化，请重新进入游戏。";
      } catch (error) {
        blockedReason = "无法确认当前身份，已停止读取和操作。";
        console.error("[exploration] 会话读取失败。", error);
      }
      try { listener(); }
      catch (error) { console.error("[exploration] 订阅回调失败。", error); }
    });
    if (typeof unsubscribe !== "function") throw new TypeError("subscribe 必须返回取消订阅函数。");
    const stop = () => {
      if (stopped) return;
      stopped = true;
      subscriptions.delete(stop);
      try { unsubscribe(); } catch (error) { console.error("[exploration] 取消订阅失败。", error); }
    };
    subscriptions.add(stop);
    return stop;
  }
  function dispose() {
    if (disposed) return;
    disposed = true;
    for (const stop of [...subscriptions]) stop();
  }
  return Object.freeze({
    getSceneView, getExitStatus, interact, listItems, listAchievements, canStartMapPuzzle,
    getCurrentSceneId: () => {
      const stage = readState().stage;
      return stage === "week-one-end" ? "old-house" : stage;
    },
    subscribe: onChange, dispose
  });
}
