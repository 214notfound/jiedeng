// R16 只读成就服务：读取当前身份的成就，不依赖探索动作或写入接口。
import { MAP_ACHIEVEMENT } from "../data/achievements.js";

export function createAchievements({ getContext, subscribe }) {
  if (typeof getContext !== "function" || typeof subscribe !== "function") {
    throw new TypeError("成就服务需要 getContext 和 subscribe。");
  }
  const scope = getContext()?.storageScope;
  if (typeof scope !== "string" || !/^(guest|account:[^\s]+)$/.test(scope)) {
    throw new TypeError("成就服务缺少有效身份。");
  }
  const subscriptions = new Set();
  let disposed = false;
  let identityFailed = false;
  function readState() {
    if (disposed) throw new Error("成就服务已卸载。");
    if (identityFailed) throw new Error("身份已变化或无法读取，请重新进入成就页。");
    let context;
    try {
      context = getContext();
      if (context?.storageScope !== scope) throw new Error("身份已变化。");
    } catch (error) {
      identityFailed = true;
      throw error;
    }
    const state = context.state;
    if (!Array.isArray(state?.achievements)
      || state.achievements.some(id => typeof id !== "string")
      || new Set(state.achievements).size !== state.achievements.length
      || typeof state.puzzle?.mapRestored !== "boolean") {
      throw new Error("成就状态格式无效。");
    }
    const unlocked = state.achievements.includes(MAP_ACHIEVEMENT.id);
    if (unlocked !== state.puzzle.mapRestored) throw new Error("成就与地图完成状态不一致。");
    const time = state.achievementTimes?.[MAP_ACHIEVEMENT.id];
    if (time !== undefined && (!unlocked || typeof time !== "string" || Number.isNaN(Date.parse(time)))) {
      throw new Error("成就时间无效。");
    }
    return { unlocked, unlockedAt: time ?? null };
  }
  function listAchievements() {
    return [{ ...MAP_ACHIEVEMENT, ...readState() }];
  }
  listAchievements();

  function onChange(listener) {
    if (disposed) throw new Error("成就服务已卸载。");
    if (typeof listener !== "function") throw new TypeError("订阅回调必须为函数。");
    let stopped = false;
    const unsubscribe = subscribe(() => {
      if (disposed || stopped) return;
      try { readState(); }
      catch (error) { console.error("[achievements] 状态读取失败。", error); }
      try { listener(); }
      catch (error) { console.error("[achievements] 订阅回调失败。", error); }
    });
    if (typeof unsubscribe !== "function") throw new TypeError("subscribe 必须返回取消函数。");
    const stop = () => {
      if (stopped) return;
      stopped = true;
      subscriptions.delete(stop);
      try { unsubscribe(); }
      catch (error) { console.error("[achievements] 取消订阅失败。", error); }
    };
    subscriptions.add(stop);
    return stop;
  }
  function dispose() {
    if (disposed) return;
    disposed = true;
    for (const stop of [...subscriptions]) stop();
  }
  return Object.freeze({ listAchievements, subscribe: onChange, dispose });
}
