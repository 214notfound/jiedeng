// 本文件登记剧情模块版本、固定内容 ID、事实来源和各阶段 Node，供校验器与引擎统一读取。
(function initializeStoryRegistry(global) {
  "use strict";

  global.WhiteLampStoryInternal = global.WhiteLampStoryInternal || {};
  const internal = global.WhiteLampStoryInternal;

  const storyData = {
    contractVersion: "1.0",
    moduleVersion: "1.0.0",
    startNodeId: "prologue-wake",
    endNodeId: "week-one-end",
    stages: ["prologue", "village", "old-house"],
    characters: [
      "companion-x",
      "villager-1",
      "villager-2",
      "villager-3",
      "unknown-caller",
    ],
    items: [
      "burned-work-id",
      "blue-glass-bead",
      "key-a",
      "map-fragment-1",
      "map-fragment-2",
      "map-fragment-3",
      "restored-village-map",
    ],
    clues: [
      "old-photograph",
      "school-uniform",
      "height-marks",
      "funeral-list",
    ],
    locations: ["shrine", "village", "old-house"],
    minigames: ["map-puzzle"],
    expectedNodeIds: [
      "prologue-wake",
      "prologue-belongings",
      "prologue-white-lamp",
      "village-arrival",
      "village-inquiries",
      "village-map-and-route",
      "old-house-entry",
      "old-house-investigation",
      "old-house-clue-confrontation",
      "old-house-call-at-door",
      "week-one-end",
    ],
    facts: [
      { id: "prologue-wake-context-known", producer: "story" },
      { id: "surface-investigation-task-known", producer: "conversation" },
      { id: "burned-work-id-investigated", producer: "exploration" },
      { id: "blue-glass-bead-investigated", producer: "exploration" },
      { id: "key-a-given-by-x", producer: "conversation" },
      { id: "x-deflects-memory-question-noticed", producer: "conversation" },
      {
        id: "key-a-acquired",
        producer: "state",
        derivedFrom: { eventType: "ITEM_ACQUIRED", targetId: "key-a" },
      },
      { id: "white-lamp-witnessed", producer: "story" },
      { id: "prologue-lamp-incident-understood", producer: "conversation" },
      { id: "leave-shrine-chosen", producer: "story" },
      { id: "village-decline-observed", producer: "exploration" },
      { id: "su-he-missing-notice-observed", producer: "exploration" },
      { id: "shopkeeper-inquiry-completed", producer: "conversation" },
      { id: "holdout-inquiry-completed", producer: "conversation" },
      { id: "elder-inquiry-completed", producer: "conversation" },
      {
        id: "map-fragment-1-acquired",
        producer: "state",
        derivedFrom: { eventType: "ITEM_ACQUIRED", targetId: "map-fragment-1" },
      },
      {
        id: "map-fragment-2-acquired",
        producer: "state",
        derivedFrom: { eventType: "ITEM_ACQUIRED", targetId: "map-fragment-2" },
      },
      {
        id: "map-fragment-3-acquired",
        producer: "state",
        derivedFrom: { eventType: "ITEM_ACQUIRED", targetId: "map-fragment-3" },
      },
      { id: "map-puzzle-completed", producer: "minigame" },
      {
        id: "restored-village-map-acquired",
        producer: "state",
        derivedFrom: {
          eventType: "ITEM_ACQUIRED",
          targetId: "restored-village-map",
        },
      },
      {
        id: "old-house-unlocked",
        producer: "state",
        derivedFrom: { eventType: "LOCATION_UNLOCKED", targetId: "old-house" },
      },
      { id: "old-house-route-chosen", producer: "story" },
      { id: "old-house-door-opened", producer: "exploration" },
      { id: "old-photograph-clue-known", producer: "exploration" },
      { id: "school-uniform-clue-known", producer: "exploration" },
      { id: "height-marks-clue-known", producer: "exploration" },
      { id: "funeral-list-clue-known", producer: "exploration" },
      { id: "old-house-identity-conflict-raised", producer: "conversation" },
      { id: "door-call-incident-completed", producer: "conversation" },
      { id: "week-one-end-acknowledged", producer: "story" },
    ],
    nodes: [],
  };

  function registerStoryStage(stageId, nodes) {
    if (!storyData.stages.includes(stageId)) {
      throw new Error(`[white-lamp:story] 未登记的剧情阶段：${stageId}`);
    }
    if (!Array.isArray(nodes)) {
      throw new Error(`[white-lamp:story] 阶段 ${stageId} 的 Node 必须是数组`);
    }
    nodes.forEach((node) => storyData.nodes.push(node));
  }

  internal.storyData = storyData;
  internal.registerStoryStage = registerStoryStage;
})(window);
