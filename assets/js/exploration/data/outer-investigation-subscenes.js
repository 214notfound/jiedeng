import {v3SceneArtFor} from "./v3-scene-assets.js";

// 外围 Hub 只负责页面导航；真正的完成事件仍由子场景中的探索 action 产生。
export const OUTER_INVESTIGATION_SUBSCENES = Object.freeze([
  {sceneId: "mountain-routes", name: "山腰旧运输道", returnLabel: "返回外围调查", actionId: "investigate-gorge-and-grave", x: 22, y: 39},
  {sceneId: "project-records", name: "村委旧楼", returnLabel: "返回外围调查", actionId: "investigate-project-records", x: 77, y: 36},
  {sceneId: "su-trail", name: "废弃小学", returnLabel: "返回外围调查", actionId: "investigate-su-trail", x: 23, y: 75},
  {sceneId: "white-lamp-mail", name: "废弃邮电所", returnLabel: "返回外围调查", actionId: "investigate-white-lamp-mail", x: 77, y: 75}
].map((entry) => Object.freeze({
  ...entry,
  image: v3SceneArtFor(entry.sceneId).image
})));

export function projectOuterInvestigationScene(view, layout, selectedId) {
  if (view.sceneId !== "outer-investigation-hub") {
    return {view, layout, selected: null};
  }
  const selected = OUTER_INVESTIGATION_SUBSCENES.find(
    (entry) => entry.sceneId === selectedId
  );
  if (selected && view.interactions.some((action) => action.id === selected.actionId)) {
    const interactions = view.interactions.filter((action) => action.id === selected.actionId);
    const actionIds = new Set(interactions.map((action) => action.id));
    return {
      selected,
      view: {
        ...view,
        sceneId: selected.sceneId,
        name: selected.name,
        sceneImage: selected.image,
        interactions
      },
      layout: {
        hotspots: layout.hotspots.filter((hotspot) =>
          hotspot.interactionIds.some((actionId) => actionIds.has(actionId)))
      }
    };
  }
  return {
    selected: null,
    view: {
      ...view,
      interactions: view.interactions.map((action) => {
        const target = OUTER_INVESTIGATION_SUBSCENES.find(
          (entry) => entry.actionId === action.id
        );
        return target ? {
          ...action,
          interactionType: "scene",
          targetSceneId: target.sceneId,
          label: `前往${target.name}`,
          marker: target.name
        } : action;
      })
    },
    layout: {
      hotspots: OUTER_INVESTIGATION_SUBSCENES.map((entry) => ({
        id: `go-${entry.sceneId}`,
        marker: entry.name,
        x: entry.x,
        y: entry.y,
        reveal: "always",
        interactionIds: [entry.actionId]
      }))
    }
  };
}
