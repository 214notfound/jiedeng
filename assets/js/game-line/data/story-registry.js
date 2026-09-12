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
    checkpointMigrations: [],
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
    const nodeIds = nodes.map((node) => node && node.id);
    const duplicate = nodeIds.find((id, index) => nodeIds.indexOf(id) !== index);
    const conflict = nodeIds.find((id) =>
      storyData.nodes.some((node) => node.id === id),
    );
    if (duplicate || conflict) {
      throw new Error(
        `[white-lamp:story] 阶段 ${stageId} 存在重复 Node ID：${duplicate || conflict}`,
      );
    }
    nodes.forEach((node) => {
      if (!node || node.stageId !== stageId) {
        throw new Error(`[white-lamp:story] 阶段 ${stageId} 包含错误的 Node 引用`);
      }
    });
    nodes.forEach((node) => storyData.nodes.push(node));
  }

  function requireExtensionList(extension, field) {
    const values = extension[field] || [];
    if (!Array.isArray(values)) {
      throw new Error(`[white-lamp:story] 扩展字段 ${field} 必须是数组`);
    }
    return values;
  }

  function assertNoDuplicateIds(existing, additions, field, getId) {
    const ids = additions.map(getId);
    const duplicate = ids.find((id, index) => ids.indexOf(id) !== index);
    const conflict = ids.find((id) => existing.some((item) => getId(item) === id));
    if (duplicate || conflict) {
      throw new Error(
        `[white-lamp:story] 扩展字段 ${field} 存在重复 ID：${duplicate || conflict}`,
      );
    }
  }

  function extendStoryRegistry(extension) {
    if (!extension || typeof extension !== "object" || Array.isArray(extension)) {
      throw new Error("[white-lamp:story] 剧情扩展必须是对象");
    }
    if (extension.baseModuleVersion !== storyData.moduleVersion) {
      throw new Error(
        `[white-lamp:story] 扩展基础版本不匹配：${extension.baseModuleVersion}`,
      );
    }
    if (
      typeof extension.moduleVersion !== "string" ||
      extension.moduleVersion.trim() === "" ||
      typeof extension.endNodeId !== "string" ||
      extension.endNodeId.trim() === ""
    ) {
      throw new Error("[white-lamp:story] 扩展缺少 moduleVersion 或 endNodeId");
    }

    const plainIdFields = [
      "stages",
      "characters",
      "items",
      "clues",
      "locations",
      "minigames",
      "expectedNodeIds",
    ];
    const additions = {};
    plainIdFields.forEach((field) => {
      additions[field] = requireExtensionList(extension, field);
      assertNoDuplicateIds(storyData[field], additions[field], field, (value) => value);
    });
    additions.facts = requireExtensionList(extension, "facts");
    assertNoDuplicateIds(storyData.facts, additions.facts, "facts", (value) => value && value.id);
    additions.checkpointMigrations = requireExtensionList(
      extension,
      "checkpointMigrations",
    );
    assertNoDuplicateIds(
      storyData.checkpointMigrations,
      additions.checkpointMigrations,
      "checkpointMigrations",
      (value) => value && `${value.nodeId}@${value.fromRevision}`,
    );

    plainIdFields.forEach((field) => storyData[field].push(...additions[field]));
    storyData.facts.push(...additions.facts);
    storyData.checkpointMigrations.push(...additions.checkpointMigrations);
    storyData.moduleVersion = extension.moduleVersion;
    storyData.endNodeId = extension.endNodeId;
  }

  function replaceStoryNode(nodeId, expectedRevision, replacement) {
    const index = storyData.nodes.findIndex((node) => node.id === nodeId);
    if (index < 0) {
      throw new Error(`[white-lamp:story] 待替换 Node 不存在：${nodeId}`);
    }
    const current = storyData.nodes[index];
    if (current.revision !== expectedRevision) {
      throw new Error(
        `[white-lamp:story] Node ${nodeId} revision 不匹配：${current.revision}`,
      );
    }
    if (
      !replacement ||
      replacement.id !== nodeId ||
      !Number.isInteger(replacement.revision) ||
      replacement.revision <= expectedRevision
    ) {
      throw new Error(`[white-lamp:story] Node ${nodeId} 替换版本无效`);
    }
    storyData.nodes[index] = replacement;
  }

  internal.storyData = storyData;
  internal.extendStoryRegistry = extendStoryRegistry;
  internal.registerStoryStage = registerStoryStage;
  internal.replaceStoryNode = replaceStoryNode;
})(window);
