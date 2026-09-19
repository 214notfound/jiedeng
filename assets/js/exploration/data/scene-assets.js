import {v3SceneArtFor} from "./v3-scene-assets.js";

const SCENE_ASSETS = Object.freeze({
  shrine: Object.freeze({
    default: new URL("../../../images/exploration/scenes/shrine.png", import.meta.url).href,
    "bulb-only": new URL(
      "../../../images/exploration/scenes/shrine.png",
      import.meta.url
    ).href,
    "both-lights": new URL(
      "../../../images/exploration/scenes/shrine-both-lights.png",
      import.meta.url
    ).href,
    "white-lamp-only": new URL(
      "../../../images/exploration/scenes/shrine-white-lamp-only.png",
      import.meta.url
    ).href
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
    ?? (sceneId === "old-house" ? "door-closed" : sceneId === "shrine" ? "bulb-only" : "default");
  return variants[resolvedVariant] ?? null;
}

function v3AssetIdFor(sceneId, nodeId) {
  if (sceneId === "outer-investigation-hub") return "outer-investigation-hub";
  if (sceneId === "haunting-network") return "haunting-network-entry";
  if (sceneId === "mine-control-room") return "mine-control-room";
  if (sceneId === "old-clinic") return "old-clinic-environment";
  if (sceneId === "father-house") return "father-house";
  if (sceneId === "anonymous-hideout") return "anonymous-hideout";
  if (sceneId === "sealed-mine") {
    return nodeId === "su-he-death-reconstructed" ? "su-death-scene" : "mine-route-entry";
  }
  if (sceneId === "data-center") {
    return nodeId === "server-evidence-recovered" ? "company-server" : "x-showdown-entry";
  }
  if (sceneId === "village-exit") {
    return nodeId?.startsWith("ending-") ? nodeId : "evidence-disposition";
  }
  return null;
}

// 探索模块负责把已提交事实转换为稳定展示字段；页面不得自行读取剧情事实。
export function scenePresentationFor(sceneId, {facts = [], nodeId} = {}) {
  if (!Array.isArray(facts)) throw new TypeError("场景展示缺少事实列表。");
  const v3AssetId = v3AssetIdFor(sceneId, nodeId);
  if (v3AssetId) {
    const art = v3SceneArtFor(v3AssetId);
    return art ? {sceneId, variantId: art.variantId, image: art.image} : null;
  }
  const variantId = sceneId === "old-house"
    ? (facts.includes("old-house-door-opened") ? "door-open" : "door-closed")
    : sceneId === "shrine"
      ? (facts.includes("white-lamp-witnessed") ? "both-lights" : "bulb-only")
      : "default";
  const image = sceneAssetFor(sceneId, {variantId});
  return image ? {sceneId, variantId, image} : null;
}
