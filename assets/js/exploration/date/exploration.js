// 探索目录：统一对外 ID，旧剧情只作文本来源，不迁移旧存档。
import { ITEM_CATALOG, SCENE_CATALOG } from "./exploration-catalog.js";
import { getScenePresentation } from "./exploration-layout.js";
export const LEGACY_ITEM_IDS = Object.freeze({
  "item.key-a": "key-a", "item.badge-b": "badge-b", "item.warning-tape": "warning-tape",
  "item.map-fragment-1": "map-fragment-1", "item.map-fragment-2": "map-fragment-2",
  "item.map-fragment-3": "map-fragment-3", "item.village-map": "restored-village-map",
  "clue.family-photo": "old-photograph", "clue.sister-uniform": "school-uniform",
  "clue.height-marks": "height-marks", "clue.funeral-list": "funeral-list"
});
const npcIds = { "prologue.talk-x": "companion-x", "prologue.talk-x-after-lamp": "companion-x",
  "village.talk-majority": "villager-1", "village.talk-refuser": "villager-2",
  "village.talk-confused-elder": "villager-3" };
export const toActionId = (id) => id.replaceAll(".", "-");
export function getItems() {
  return Object.values(ITEM_CATALOG).map((item) => {
    const id = LEGACY_ITEM_IDS[item.id];
    return { ...item, id, image: new URL("../../images/items/" + id + ".svg", import.meta.url).href };
  });
}
export function getScenes() {
  return Object.values(SCENE_CATALOG).map((scene) => ({
    ...scene, stageId: scene.id, completionInteractionIds: scene.completionInteractionIds.map(toActionId),
    interactions: scene.interactions.map((action) => ({
      ...action, id: toActionId(action.id), npcId: npcIds[action.id] ?? null,
      rewardItemId: action.rewardItemId ? LEGACY_ITEM_IDS[action.rewardItemId] : null,
      prerequisites: {
        interactionIds: (action.prerequisites?.interactionIds ?? []).map(toActionId),
        itemIds: (action.prerequisites?.itemIds ?? []).map((id) => LEGACY_ITEM_IDS[id])
      }
    }))
  }));
}
export function getSceneLayout(sceneId) {
  const layout = getScenePresentation(sceneId);
  const characters = { x: "companion-x", villagers: "villager-1", refuser: "villager-2", elder: "villager-3" };
  return { ...layout, hotspots: layout.hotspots.map((hotspot) => ({
    ...hotspot, id: characters[hotspot.id] ?? sceneId + "-" + hotspot.id,
    interactionIds: hotspot.interactionIds.map(toActionId)
  })) };
}
export { MAP_ACHIEVEMENT } from "./achievements.js";
