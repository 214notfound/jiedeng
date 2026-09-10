// 第一周 NPC 人物层：只负责素材与展示位置，不参与热点坐标、剧情事实或 Host 状态。
const CHARACTER_ASSETS = Object.freeze({
  "companion-x": Object.freeze({
    src: new URL("../../../images/exploration/characters/companion-x.png", import.meta.url).href,
    placement: "right"
  }),
  "villager-1": Object.freeze({
    src: new URL("../../../images/exploration/characters/villager-1.png", import.meta.url).href,
    placement: "left"
  }),
  "villager-2": Object.freeze({
    src: new URL("../../../images/exploration/characters/villager-2.png", import.meta.url).href,
    placement: "right"
  }),
  "villager-3": Object.freeze({
    src: new URL("../../../images/exploration/characters/villager-3.png", import.meta.url).href,
    placement: "left"
  })
});

export function characterAssetFor(npcId) {
  return CHARACTER_ASSETS[npcId] ?? null;
}
