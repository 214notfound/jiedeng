// 本文件将 V3 阶段、事实、小游戏和检查点迁移显式追加到 V1 剧情注册表。
(function registerV3StoryExtension(global) {
  "use strict";

  const internal = global.WhiteLampStoryInternal;
  if (
    !internal ||
    typeof internal.extendStoryRegistry !== "function" ||
    typeof internal.replaceStoryNode !== "function"
  ) {
    throw new Error("[white-lamp:story:v3] V1 剧情注册表未完整加载");
  }

  internal.extendStoryRegistry({
    baseModuleVersion: "1.0.0",
    moduleVersion: "3.0.0",
    endNodeId: "ending-full-account",
    stages: [
      "outer-investigation",
      "identity-reconstruction",
      "mine-return",
      "finale",
    ],
    characters: [],
    items: [],
    clues: [],
    locations: [
      "mountain-routes",
      "haunting-network",
      "mine-control-room",
      "old-clinic",
      "father-house",
      "anonymous-hideout",
      "sealed-mine",
      "data-center",
      "village-exit",
    ],
    minigames: [
      "haunting-network-puzzle",
      "mine-route-puzzle",
      "x-showdown-chase",
    ],
    expectedNodeIds: [
      "outer-lines-investigation",
      "haunting-system-dismantled",
      "b-designer-revealed",
      "a-survival-revealed",
      "father-company-truth",
      "white-lamp-identity-revealed",
      "mine-route-restored",
      "su-he-death-reconstructed",
      "server-evidence-recovered",
      "x-recovery-confrontation",
      "x-showdown",
      "evidence-disposition",
      "ending-accomplice",
      "ending-defeated",
      "ending-erasure",
      "ending-curated-truth",
      "ending-full-account",
    ],
    facts: [
      { id: "a-gorge-thread-complete", producer: "exploration" },
      { id: "project-record-thread-complete", producer: "exploration" },
      { id: "su-thread-complete", producer: "exploration" },
      { id: "white-lamp-first-thread-complete", producer: "exploration" },
      { id: "haunting-is-engineered", producer: "minigame" },
      { id: "protagonist-is-b-known", producer: "exploration" },
      { id: "intimidation-plan-authorship", producer: "exploration" },
      { id: "a-b-identity-chain-complete", producer: "exploration" },
      { id: "a-left-clinic-with-sister-known", producer: "exploration" },
      { id: "old-accident-coverup-proven", producer: "exploration" },
      { id: "father-full-role-known", producer: "exploration" },
      { id: "company-succession-chain", producer: "exploration" },
      { id: "b-prior-mine-ignorance-established", producer: "exploration" },
      { id: "three-identities-merged", producer: "exploration" },
      { id: "white-lamp-self-exculpation-known", producer: "exploration" },
      { id: "mine-bypass-coordinate-known", producer: "exploration" },
      { id: "sealed-mine-bypassed", producer: "minigame" },
      { id: "x-pushed-su-known", producer: "exploration" },
      { id: "b-refused-rescue-recorded", producer: "exploration" },
      { id: "night-sealing-coverup-proven", producer: "exploration" },
      { id: "su-death-chain-complete", producer: "exploration" },
      { id: "full-evidence-package-ready", producer: "exploration" },
      { id: "x-recovery-demand-delivered", producer: "conversation" },
      {
        id: "evidence-handed-to-x",
        producer: "state",
        derivedFrom: { eventType: "CHOICE_MADE", targetId: "hand-over-evidence" },
      },
      {
        id: "x-handover-refused",
        producer: "state",
        derivedFrom: { eventType: "CHOICE_MADE", targetId: "refuse-handover" },
      },
      { id: "x-showdown-survived", producer: "minigame" },
      { id: "x-showdown-lost", producer: "minigame" },
      {
        id: "all-evidence-destroyed",
        producer: "state",
        derivedFrom: { eventType: "CHOICE_MADE", targetId: "destroy-all-evidence" },
      },
      {
        id: "curated-evidence-published",
        producer: "state",
        derivedFrom: { eventType: "CHOICE_MADE", targetId: "publish-curated-evidence" },
      },
      {
        id: "full-evidence-published",
        producer: "state",
        derivedFrom: { eventType: "CHOICE_MADE", targetId: "publish-full-evidence" },
      },
      { id: "ending-accomplice-acknowledged", producer: "story" },
      { id: "ending-defeated-acknowledged", producer: "story" },
      { id: "ending-erasure-acknowledged", producer: "story" },
      { id: "ending-curated-truth-acknowledged", producer: "story" },
      { id: "ending-full-account-acknowledged", producer: "story" },
    ],
    checkpointMigrations: [
      { nodeId: "week-one-end", fromRevision: 1, toRevision: 2 },
    ],
  });

  const weekOneEnd = internal.storyData.nodes.find(
    (node) => node.id === "week-one-end",
  );
  internal.replaceStoryNode("week-one-end", 1, {
    ...weekOneEnd,
    revision: 2,
    intent: "收束老宅调查，引导玩家继续追查陈晋年、王阙与公司的关系。",
    actions: weekOneEnd.actions.map((action) => ({
      ...action,
      label: action.id === "confirm-week-one-end" ? "继续追查" : action.label,
    })),
    presentations: [
      {
        id: "v3-investigation-opens",
        when: { noneFacts: ["week-one-end-acknowledged"] },
        sceneId: "old-house",
        blocks: [
          {
            id: "identity-and-company-remain",
            blockType: "narration",
            text: "老宅只证明陈晋年曾经存在。王阙、公司和这些人造怪事之间，仍缺少关键证据。",
          },
        ],
        actionIds: ["confirm-week-one-end"],
      },
    ],
    transitions: [
      { id: "continue-to-outer-lines", to: "outer-lines-investigation" },
    ],
    terminal: false,
    endingId: null,
  });
})(window);
