// 探索状态校验：验证本模块记录的一致性，保留其他模块字段与内容。
import { getScenes } from "../data/exploration.js";

const scenes = getScenes();
const stages = ["prologue", "village", "old-house", "week-one-end"];
const allActions = scenes.flatMap((scene) => scene.interactions);
const ownsAll = (values, required) => required.every((id) => values.includes(id));

export function validateExplorationState(state) {
  if (!state || !stages.includes(state.stage)
    || !Array.isArray(state.inventory) || !Array.isArray(state.investigated)
    || !Array.isArray(state.achievements) || typeof state.puzzle?.mapRestored !== "boolean") {
    throw new TypeError("探索状态缺少必要字段。");
  }
  for (const values of [state.inventory, state.investigated, state.achievements]) {
    if (values.some((id) => typeof id !== "string") || new Set(values).size !== values.length) {
      throw new TypeError("状态 ID 必须为字符串且不能重复。");
    }
  }

  for (const action of allActions) {
    const completed = state.investigated.includes(action.id);
    if (completed && (!ownsAll(state.investigated, action.prerequisites.interactionIds)
      || !ownsAll(state.inventory, action.prerequisites.itemIds))) {
      throw new Error("调查记录缺少前置条件：" + action.id);
    }
    if (action.rewardItemId && completed !== state.inventory.includes(action.rewardItemId)) {
      throw new Error("调查与物品来源不一致：" + action.id);
    }
  }

  const complete = (sceneId) => ownsAll(state.investigated,
    scenes.find((scene) => scene.id === sceneId).completionInteractionIds);
  const stageIndex = stages.indexOf(state.stage);
  if (stageIndex >= 1 && !complete("prologue")) throw new Error("祠堂调查未完成，不能进入村口。");
  if (stageIndex >= 2 && !state.puzzle.mapRestored) throw new Error("地图未复原，不能进入老宅。");
  if (state.stage === "week-one-end" && !complete("old-house")) throw new Error("老宅调查尚未结束。");
  for (const scene of scenes) {
    if (stages.indexOf(scene.id) > stageIndex && scene.interactions.some((action) => state.investigated.includes(action.id))) {
      throw new Error("存在尚未开放场景的调查记录。");
    }
  }

  const mapCompleted = state.puzzle.mapRestored;
  if (mapCompleted && (!complete("prologue") || !complete("village")
    || !ownsAll(state.inventory, ["map-fragment-1", "map-fragment-2", "map-fragment-3"]))) {
    throw new Error("地图完成记录缺少碎片或对话来源。");
  }
  if (mapCompleted !== state.inventory.includes("restored-village-map")
    || mapCompleted !== state.achievements.includes("map-restorer")) {
    throw new Error("地图、完整地图物品与成就状态不一致。");
  }
  const unlockedAt = state.achievementTimes?.["map-restorer"];
  if (unlockedAt !== undefined && (!mapCompleted || typeof unlockedAt !== "string"
    || Number.isNaN(Date.parse(unlockedAt)))) {
    throw new Error("成就解锁时间无效。");
  }
  return true;
}
