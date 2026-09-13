import {v3SceneArtFor} from "./v3-scene-assets.js";

// 只有物理独立空间或高密度台面使用第二层；导航本身不提交剧情事实。
export const V3_LAYERED_SCENES = Object.freeze([
  Object.freeze({
    baseSceneId: "old-clinic",
    sceneId: "old-clinic-detail",
    name: "登记桌档案",
    returnLabel: "返回诊所档案区",
    actionId: "investigate-old-clinic",
    assetId: "old-clinic-detail",
    marker: "查看登记桌",
    x: 50,
    y: 53,
    detailX: 50,
    detailY: 53
  }),
  Object.freeze({
    baseSceneId: "father-house",
    sceneId: "father-house-hidden-layer",
    name: "父亲旧屋暗层",
    returnLabel: "返回父亲旧屋",
    actionId: "investigate-father-and-company",
    assetId: "father-house-hidden-layer",
    marker: "进入暗层",
    x: 48,
    y: 72,
    detailX: 50,
    detailY: 50
  })
]);

export function projectV3LayeredScene(view, layout, selectedId) {
  const entry = V3_LAYERED_SCENES.find((item) => item.baseSceneId === view.sceneId);
  if (!entry) return {view, layout, selected: null};
  const action = view.interactions.find((item) => item.id === entry.actionId);
  if (!action) return {view, layout, selected: null};

  if (selectedId === entry.sceneId) {
    const art = v3SceneArtFor(entry.assetId);
    const actionIds = new Set([entry.actionId]);
    return {
      selected: entry,
      view: {
        ...view,
        sceneId: entry.sceneId,
        name: entry.name,
        sceneImage: art.image,
        sceneVariant: art.variantId,
        interactions: [action]
      },
      layout: {
        hotspots: layout.hotspots
          .filter((hotspot) =>
            hotspot.interactionIds.some((actionId) => actionIds.has(actionId)))
          .map((hotspot) => ({
            ...hotspot,
            x: entry.detailX ?? hotspot.x,
            y: entry.detailY ?? hotspot.y
          }))
      }
    };
  }

  return {
    selected: null,
    view: {
      ...view,
      interactions: view.interactions.map((item) => item.id === entry.actionId
        ? {...item, interactionType: "scene", targetSceneId: entry.sceneId, label: entry.marker}
        : item)
    },
    layout: {
      hotspots: layout.hotspots.map((hotspot) => hotspot.interactionIds.includes(entry.actionId)
        ? {...hotspot, id: `go-${entry.sceneId}`, marker: entry.marker, x: entry.x, y: entry.y}
        : hotspot)
    }
  };
}
