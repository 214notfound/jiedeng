// 展示地点不进入剧情检查点；动作仍使用村口既有命令。
export const VILLAGE_SUBSCENES = Object.freeze([
  {sceneId: "village-shop", name: "小卖部", npcId: "villager-1", actionId: "shopkeeper-inquiry", x: 50, y: 45},
  {sceneId: "village-holdout-house", name: "拒签户家", npcId: "villager-2", actionId: "holdout-inquiry", x: 50, y: 42},
  {sceneId: "village-elder-stone", name: "路边石凳", npcId: "villager-3", actionId: "elder-inquiry", x: 50, y: 48}
].map(entry => Object.freeze({...entry,
  image: new URL("../../../images/exploration/scenes/" + entry.sceneId + ".png", import.meta.url).href
})));

export function projectVillageScene(view, layout, selectedId) {
  if (view.sceneId !== "village") return {view, layout, selected: null};
  const selected = VILLAGE_SUBSCENES.find(entry => entry.sceneId === selectedId);
  if (selected && view.interactions.some(action => action.id === selected.actionId)) {
    return {selected, view: {...view, sceneId: selected.sceneId, name: selected.name,
      sceneImage: selected.image, interactions: view.interactions.filter(action => action.id === selected.actionId)},
    layout: {hotspots: [{id: selected.npcId, marker: selected.name, x: selected.x, y: selected.y,
      reveal: "always", interactionIds: [selected.actionId]}]}};
  }
  return {selected: null, layout, view: {...view, interactions: view.interactions.map(action => {
    const target = VILLAGE_SUBSCENES.find(entry => entry.actionId === action.id);
    return target ? {...action, interactionType: "scene", targetSceneId: target.sceneId,
      label: "前往" + target.name} : action;
  })}};
}
