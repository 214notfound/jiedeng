// V3 场景美术登记表：只负责稳定资源定位与交接追溯，不决定剧情推进。
// sceneId / targetId / endingId 来自 V3 剧情与场景交接文档；variantId 只描述视觉状态。

const image = (filename) => new URL(
  "../../../images/exploration/scenes/v3/" + filename,
  import.meta.url
).href;

const record = (entry) => Object.freeze({
  ...entry,
  targetIds: Object.freeze([...(entry.targetIds ?? [])])
});

export const V3_SCENE_ART = Object.freeze([
  record({
    assetId: "outer-investigation-hub",
    sceneId: "village",
    variantId: "outer-investigation-hub",
    filename: "outer-investigation-hub.jpg",
    targetIds: [
      "investigate-gorge-and-grave",
      "investigate-project-records",
      "investigate-su-trail",
      "investigate-white-lamp-mail"
    ]
  }),
  record({
    assetId: "mountain-routes",
    sceneId: "mountain-routes",
    variantId: "default",
    filename: "mountain-routes.jpg",
    targetIds: ["investigate-gorge-and-grave"]
  }),
  record({
    assetId: "project-records",
    sceneId: "project-records",
    parentSceneId: "village",
    variantId: "default",
    filename: "project-records.jpg",
    targetIds: ["investigate-project-records"]
  }),
  record({
    assetId: "su-trail",
    sceneId: "su-trail",
    parentSceneId: "village",
    variantId: "default",
    filename: "su-trail.jpg",
    targetIds: ["investigate-su-trail"]
  }),
  record({
    assetId: "white-lamp-mail",
    sceneId: "white-lamp-mail",
    parentSceneId: "village",
    variantId: "default",
    filename: "white-lamp-mail.jpg",
    targetIds: ["investigate-white-lamp-mail"]
  }),
  record({
    assetId: "haunting-network-entry",
    sceneId: "haunting-network",
    variantId: "entry",
    filename: "haunting-network-entry.jpg",
    targetIds: ["haunting-network-puzzle"]
  }),
  record({
    assetId: "haunting-network-exit",
    sceneId: "haunting-network",
    variantId: "exit",
    filename: "haunting-network-exit.jpg",
    targetIds: ["haunting-network-puzzle"]
  }),
  record({
    assetId: "mine-control-room",
    sceneId: "mine-control-room",
    variantId: "default",
    filename: "mine-control-room.jpg",
    targetIds: ["investigate-control-room"]
  }),
  record({
    assetId: "old-clinic-environment",
    sceneId: "old-clinic",
    variantId: "environment",
    filename: "old-clinic-environment.jpg",
    targetIds: ["investigate-old-clinic"]
  }),
  record({
    assetId: "old-clinic-detail",
    sceneId: "old-clinic",
    variantId: "detail",
    filename: "old-clinic-detail.jpg",
    targetIds: ["investigate-old-clinic"]
  }),
  record({
    assetId: "father-house",
    sceneId: "father-house",
    variantId: "default",
    filename: "father-house.jpg",
    targetIds: ["investigate-father-and-company"]
  }),
  record({
    assetId: "father-house-hidden-layer",
    sceneId: "father-house",
    variantId: "hidden-layer",
    filename: "father-house-hidden-layer.jpg",
    targetIds: ["investigate-father-and-company"]
  }),
  record({
    assetId: "anonymous-hideout",
    sceneId: "anonymous-hideout",
    variantId: "default",
    filename: "anonymous-hideout.jpg",
    targetIds: ["investigate-anonymous-hideout"]
  }),
  record({
    assetId: "mine-route-entry",
    sceneId: "sealed-mine",
    variantId: "route-entry",
    filename: "mine-route-entry.jpg",
    targetIds: ["mine-route-puzzle"]
  }),
  record({
    assetId: "mine-route-exit",
    sceneId: "sealed-mine",
    variantId: "route-exit",
    filename: "mine-route-exit.jpg",
    targetIds: ["mine-route-puzzle"]
  }),
  record({
    assetId: "su-death-scene",
    sceneId: "sealed-mine",
    variantId: "su-death-scene",
    filename: "su-death-scene.jpg",
    targetIds: ["investigate-su-death-scene"]
  }),
  record({
    assetId: "company-server",
    sceneId: "data-center",
    variantId: "server-evidence",
    filename: "company-server.jpg",
    targetIds: ["investigate-company-server"]
  }),
  record({
    assetId: "x-showdown-entry",
    sceneId: "data-center",
    variantId: "showdown-entry",
    filename: "x-showdown-entry.jpg",
    targetIds: ["x-recovery-demand", "x-showdown-chase"]
  }),
  record({
    assetId: "x-showdown-success",
    sceneId: "data-center",
    variantId: "showdown-success",
    filename: "x-showdown-success.jpg",
    targetIds: ["x-showdown-chase"]
  }),
  record({
    assetId: "x-showdown-failure",
    sceneId: "data-center",
    variantId: "showdown-failure",
    filename: "x-showdown-failure.jpg",
    targetIds: ["x-showdown-chase"]
  }),
  record({
    assetId: "evidence-disposition",
    sceneId: "village-exit",
    variantId: "evidence-disposition",
    filename: "evidence-disposition.jpg"
  }),
  ...[
    ["ending-accomplice", "ending-accomplice.jpg"],
    ["ending-defeated", "ending-defeated.jpg"],
    ["ending-erasure", "ending-erasure.jpg"],
    ["ending-curated-truth", "ending-curated-truth.jpg"],
    ["ending-full-account", "ending-full-account.jpg"]
  ].map(([endingId, filename]) => record({
    assetId: endingId,
    sceneId: "village-exit",
    variantId: endingId,
    endingId,
    filename
  }))
]);

const ART_BY_ID = new Map(V3_SCENE_ART.map((entry) => [entry.assetId, entry]));

export function v3SceneArtFor(assetId) {
  const entry = ART_BY_ID.get(assetId);
  return entry ? {...entry, targetIds: [...entry.targetIds], image: image(entry.filename)} : null;
}
