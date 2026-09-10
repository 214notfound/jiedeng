const SCENE_ASSETS = Object.freeze({
  shrine: Object.freeze({
    default: new URL("../../../images/exploration/scenes/shrine.png", import.meta.url).href
  }),
  village: Object.freeze({
    default: new URL("../../../images/exploration/scenes/village.png", import.meta.url).href
  }),
  "old-house": Object.freeze({
    "door-closed": new URL(
      "../../../images/exploration/scenes/old-house-door-closed.png",
      import.meta.url
    ).href,
    "door-open": new URL(
      "../../../images/exploration/scenes/old-house-door-open.png",
      import.meta.url
    ).href
  })
});

export function sceneAssetFor(sceneId, {variantId} = {}) {
  const variants = SCENE_ASSETS[sceneId];
  if (!variants) return null;
  const resolvedVariant = variantId
    ?? (sceneId === "old-house" ? "door-closed" : "default");
  return variants[resolvedVariant] ?? null;
}

// 探索模块负责把已提交事实转换为稳定展示字段；页面不得自行读取剧情事实。
export function scenePresentationFor(sceneId, {facts = []} = {}) {
  if (!Array.isArray(facts)) throw new TypeError("场景展示缺少事实列表。");
  const variantId = sceneId === "old-house"
    ? (facts.includes("old-house-door-opened") ? "door-open" : "door-closed")
    : "default";
  const image = sceneAssetFor(sceneId, {variantId});
  return image ? {sceneId, variantId, image} : null;
}
