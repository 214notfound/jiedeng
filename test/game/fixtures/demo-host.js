// 仅供自动测试／独立演示的内存宿主，不是全局 state.js 或正式存档实现。
import { getScenes } from "../../../assets/js/data/exploration.js";
import { validateExplorationState } from "../../../assets/js/game/exploration-state.js";
export function createDemoHost(storageScope = "guest", initialState) {
  let state = initialState === undefined ? { stage: "prologue", currentNodeId: "prologue-wake", investigated: [],
    inventory: [], achievements: [], achievementTimes: {}, puzzle: { mapRestored: false } } : structuredClone(initialState);
  validateExplorationState(state);
  const listeners = new Set();
  const scenes = getScenes();
  const complete = (draft, id) => scenes.find((scene) => scene.id === id).completionInteractionIds
    .every((action) => draft.investigated.includes(action));
  return {
    getContext: () => ({ storageScope, state: structuredClone(state) }),
    subscribe: (listener) => { listeners.add(listener); return () => listeners.delete(listener); },
    dispatch(event) {
      const draft = structuredClone(state);
      const add = (list, id) => { if (id && !list.includes(id)) list.push(id); };
      if (event.type === "OBJECT_INVESTIGATED" || event.type === "NPC_TALKED") {
        add(draft.investigated, event.payload.objectId ?? event.payload.interactionId);
        add(draft.inventory, event.payload.itemId ?? event.payload.rewardItemId);
        if (draft.stage === "prologue" && complete(draft, "prologue")) {
          draft.stage = "village"; draft.currentNodeId = "village-arrival";
        }
        if (draft.stage === "old-house" && complete(draft, "old-house")) {
          draft.stage = "week-one-end"; draft.currentNodeId = "week-one-end";
        }
      } else if (event.type === "MAP_PUZZLE_COMPLETED" && event.payload.puzzleId === "map-puzzle") {
        if (!complete(draft, "village") || !["map-fragment-1", "map-fragment-2", "map-fragment-3"].every((id) => draft.inventory.includes(id))) {
          return { ok: false, message: "尚未集齐地图。" };
        }
        if (draft.puzzle.mapRestored) return { ok: true };
        draft.puzzle.mapRestored = true;
        add(draft.inventory, "restored-village-map"); add(draft.achievements, "map-restorer");
        draft.achievementTimes["map-restorer"] = new Date().toISOString();
        draft.stage = "old-house"; draft.currentNodeId = "old-house-arrival";
      } else return { ok: false, message: "演示不支持该事件。" };
      state = draft;
      for (const listener of listeners) listener();
      return { ok: true };
    },
    // 测试专用：模拟切换身份。正式身份只能由账户模块取得。
    switchScope(nextScope) { storageScope = nextScope; for (const listener of listeners) listener(); },
    listenerCount: () => listeners.size
  };
}
