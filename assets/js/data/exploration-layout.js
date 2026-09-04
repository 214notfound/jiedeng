// V1 探索布局：一个热点代表一个物体或人物，连续动作共用同一位置。
const scenes = Object.freeze({
  prologue: {
    layoutLabel: "祠堂 · 探索布局",
    playerStart: { x: 50, y: 90 },
    hotspots: [
      { id: "x", x: 18, y: 68, marker: "小X", type: "character", reveal: "always", interactionIds: ["prologue.talk-x", "prologue.talk-x-after-lamp"] },
      { id: "wound", x: 51, y: 84, marker: "伤", type: "clue", reveal: "always", interactionIds: ["prologue.check-wound"] },
      { id: "key", x: 22, y: 88, marker: "A钥", type: "object", reveal: "always", interactionIds: ["prologue.take-key-a"] },
      { id: "badge", x: 72, y: 77, marker: "B证", type: "object", reveal: "always", interactionIds: ["prologue.take-badge-b"] },
      { id: "tape", x: 36, y: 57, marker: "录音", type: "object", reveal: "always", interactionIds: ["prologue.take-warning-tape", "prologue.play-warning-tape"] },
      { id: "lamp", x: 88, y: 28, marker: "白灯", type: "event", reveal: "available", interactionIds: ["prologue.observe-white-lamp"] },
      { id: "exit", x: 7, y: 52, marker: "出口", type: "place", reveal: "available", interactionIds: ["prologue.find-exit"] },
      { id: "power", x: 80, y: 55, marker: "断电", type: "event", reveal: "available", interactionIds: ["prologue.observe-x-power"] }
    ]
  },
  village: {
    layoutLabel: "村口 · 探索布局",
    playerStart: { x: 50, y: 90 },
    hotspots: [
      { id: "village-view", x: 50, y: 76, marker: "村口", type: "place", reveal: "always", interactionIds: ["village.observe-hub"] },
      { id: "villagers", x: 20, y: 62, marker: "村民", type: "character", reveal: "always", interactionIds: ["village.talk-majority"] },
      { id: "refuser", x: 82, y: 64, marker: "拒签", type: "character", reveal: "always", interactionIds: ["village.talk-refuser"] },
      { id: "elder", x: 52, y: 43, marker: "老人", type: "character", reveal: "always", interactionIds: ["village.talk-confused-elder"] }
    ]
  },
  "old-house": {
    layoutLabel: "陈家老宅 · 探索布局",
    playerStart: { x: 50, y: 90 },
    hotspots: [
      { id: "door", x: 50, y: 28, marker: "宅门", type: "place", reveal: "always", interactionIds: ["old-house.unlock-door", "old-house.door-call"] },
      { id: "photo", x: 18, y: 42, marker: "照片", type: "object", reveal: "available", interactionIds: ["old-house.family-photo"] },
      { id: "uniform", x: 29, y: 72, marker: "校服", type: "object", reveal: "available", interactionIds: ["old-house.sister-uniform"] },
      { id: "marks", x: 80, y: 45, marker: "刻痕", type: "clue", reveal: "available", interactionIds: ["old-house.height-marks"] },
      { id: "list", x: 70, y: 75, marker: "名单", type: "object", reveal: "available", interactionIds: ["old-house.funeral-list"] }
    ]
  }
});

export function getScenePresentation(sceneId) {
  return scenes[sceneId] ?? { layoutLabel: "探索布局", playerStart: { x: 50, y: 90 }, hotspots: [] };
}
