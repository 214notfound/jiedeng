const SCENE_ASSETS = Object.freeze({
  shrine: new URL("../../../images/exploration/scenes/shrine.png", import.meta.url).href,
  village: new URL("../../../images/exploration/scenes/village.png", import.meta.url).href,
  "old-house-closed": new URL(
    "../../../images/exploration/scenes/old-house-door-closed.png",
    import.meta.url
  ).href,
  "old-house-open": new URL(
    "../../../images/exploration/scenes/old-house-door-open.png",
    import.meta.url
  ).href
});

export function sceneAssetFor(sceneId, {oldHouseDoorOpen = false} = {}) {
  if (sceneId === "old-house") {
    return oldHouseDoorOpen
      ? SCENE_ASSETS["old-house-open"]
      : SCENE_ASSETS["old-house-closed"];
  }
  return SCENE_ASSETS[sceneId] ?? null;
}
