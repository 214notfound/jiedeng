// 探索板块内部共用的只读 Node/地点映射，不包含推进规则。
export const NODE_SCENES = Object.freeze({
  "prologue-wake": "shrine",
  "prologue-belongings": "shrine",
  "prologue-white-lamp": "shrine",
  "village-arrival": "village",
  "village-inquiries": "village",
  "village-map-and-route": "village",
  "old-house-entry": "old-house",
  "old-house-investigation": "old-house",
  "old-house-clue-confrontation": "old-house",
  "old-house-call-at-door": "old-house",
  "week-one-end": "old-house",
  "outer-lines-investigation": "outer-investigation-hub",
  "haunting-system-dismantled": "haunting-network",
  "b-designer-revealed": "mine-control-room",
  "a-survival-revealed": "old-clinic",
  "father-company-truth": "father-house",
  "white-lamp-identity-revealed": "anonymous-hideout",
  "mine-route-restored": "sealed-mine",
  "su-he-death-reconstructed": "sealed-mine",
  "server-evidence-recovered": "data-center",
  "x-recovery-confrontation": "data-center",
  "x-showdown": "data-center",
  "evidence-disposition": "village-exit",
  "ending-accomplice": "village-exit",
  "ending-defeated": "village-exit",
  "ending-erasure": "village-exit",
  "ending-curated-truth": "village-exit",
  "ending-full-account": "village-exit"
});

const SCENE_NAMES = Object.freeze({
  shrine: "祠堂",
  village: "村口",
  "old-house": "陈家老宅"
});

export function sceneName(sceneId) {
  return SCENE_NAMES[sceneId] ?? "探索";
}
