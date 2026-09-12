// game-contract.js

export const STORY_CONTRACT_VERSION = "1.0";

// 探索、对话、小游戏交给剧情的外部事件
export const EXTERNAL_EVENT_TYPES = Object.freeze({
  OBJECT_INVESTIGATED: "OBJECT_INVESTIGATED",
  NPC_TALK_PROGRESS: "NPC_TALK_PROGRESS",
  NPC_TALKED: "NPC_TALKED",
  MAP_PUZZLE_COMPLETED: "MAP_PUZZLE_COMPLETED",
  MINIGAME_RESOLVED: "MINIGAME_RESOLVED",
  EXTERNAL_INTERACTION_CANCELLED:
    "EXTERNAL_INTERACTION_CANCELLED",
  EXTERNAL_INTERACTION_FAILED:
    "EXTERNAL_INTERACTION_FAILED"
});

// 剧情要求状态模块提交的事件
export const STORY_STATE_EVENT_TYPES = Object.freeze({
  STORY_FACT_RECORDED: "STORY_FACT_RECORDED",
  CHOICE_MADE: "CHOICE_MADE",
  ITEM_ACQUIRED: "ITEM_ACQUIRED",
  CLUE_RECORDED: "CLUE_RECORDED",
  LOCATION_UNLOCKED: "LOCATION_UNLOCKED"
});

// 剧情提交成功后广播的通知
export const STORY_NOTIFICATION_TYPES = Object.freeze({
  STORY_NODE_ENTERED: "STORY_NODE_ENTERED",
  STORY_MILESTONE_REACHED: "STORY_MILESTONE_REACHED",
  STORY_NODE_COMPLETED: "STORY_NODE_COMPLETED",
  STORY_STAGE_COMPLETED: "STORY_STAGE_COMPLETED",
  STORY_ENDED: "STORY_ENDED"
});

// 项目内部事件，不属于剧情接口
export const APP_EVENT_TYPES = Object.freeze({
  GAME_STARTED: "GAME_STARTED",
  ACHIEVEMENT_UNLOCKED: "ACHIEVEMENT_UNLOCKED"
});

// 兼容现有模块的统一事件入口。新代码仍应优先使用上面的分类常量。
export const GAME_EVENTS = Object.freeze({
  ...APP_EVENT_TYPES,
  ...EXTERNAL_EVENT_TYPES,
  ...STORY_STATE_EVENT_TYPES
});

// V1 剧情事实登记表。状态模块用 producer 校验事实来源，
// 并用 derivedFrom 在状态事件提交成功后生成派生事实。
export const STORY_FACT_DEFINITIONS = Object.freeze([
  { id: "prologue-wake-context-known", producer: "story" },
  { id: "surface-investigation-task-known", producer: "conversation" },
  {
    id: "burned-work-id-investigated",
    producer: "exploration",
    externalTargetId: "burned-work-id"
  },
  {
    id: "blue-glass-bead-investigated",
    producer: "exploration",
    externalTargetId: "blue-glass-bead"
  },
  { id: "key-a-given-by-x", producer: "conversation" },
  { id: "x-deflects-memory-question-noticed", producer: "conversation" },
  {
    id: "key-a-acquired",
    producer: "state",
    derivedFrom: { eventType: "ITEM_ACQUIRED", targetId: "key-a" }
  },
  { id: "white-lamp-witnessed", producer: "story" },
  { id: "prologue-lamp-incident-understood", producer: "conversation" },
  { id: "leave-shrine-chosen", producer: "story" },
  {
    id: "village-decline-observed",
    producer: "exploration",
    externalTargetId: "village-decline"
  },
  {
    id: "su-he-missing-notice-observed",
    producer: "exploration",
    externalTargetId: "su-he-notice"
  },
  { id: "shopkeeper-inquiry-completed", producer: "conversation" },
  { id: "holdout-inquiry-completed", producer: "conversation" },
  { id: "elder-inquiry-completed", producer: "conversation" },
  {
    id: "map-fragment-1-acquired",
    producer: "state",
    derivedFrom: { eventType: "ITEM_ACQUIRED", targetId: "map-fragment-1" }
  },
  {
    id: "map-fragment-2-acquired",
    producer: "state",
    derivedFrom: { eventType: "ITEM_ACQUIRED", targetId: "map-fragment-2" }
  },
  {
    id: "map-fragment-3-acquired",
    producer: "state",
    derivedFrom: { eventType: "ITEM_ACQUIRED", targetId: "map-fragment-3" }
  },
  { id: "map-puzzle-completed", producer: "minigame" },
  {
    id: "restored-village-map-acquired",
    producer: "state",
    derivedFrom: {
      eventType: "ITEM_ACQUIRED",
      targetId: "restored-village-map"
    }
  },
  {
    id: "old-house-unlocked",
    producer: "state",
    derivedFrom: { eventType: "LOCATION_UNLOCKED", targetId: "old-house" }
  },
  { id: "old-house-route-chosen", producer: "story" },
  {
    id: "old-house-door-opened",
    producer: "exploration",
    externalTargetId: "old-house-door"
  },
  {
    id: "old-photograph-clue-known",
    producer: "exploration",
    externalTargetId: "old-photograph"
  },
  {
    id: "school-uniform-clue-known",
    producer: "exploration",
    externalTargetId: "school-uniform"
  },
  {
    id: "height-marks-clue-known",
    producer: "exploration",
    externalTargetId: "height-marks"
  },
  {
    id: "funeral-list-clue-known",
    producer: "exploration",
    externalTargetId: "funeral-list"
  },
  { id: "old-house-identity-conflict-raised", producer: "conversation" },
  { id: "door-call-incident-completed", producer: "conversation" },
  { id: "week-one-end-acknowledged", producer: "story" },
  { id: "a-gorge-thread-complete", producer: "exploration", externalTargetId: "investigate-gorge-and-grave" },
  { id: "project-record-thread-complete", producer: "exploration", externalTargetId: "investigate-project-records" },
  { id: "su-thread-complete", producer: "exploration", externalTargetId: "investigate-su-trail" },
  { id: "white-lamp-first-thread-complete", producer: "exploration", externalTargetId: "investigate-white-lamp-mail" },
  { id: "haunting-is-engineered", producer: "minigame" },
  { id: "protagonist-is-b-known", producer: "exploration", externalTargetId: "investigate-control-room" },
  { id: "intimidation-plan-authorship", producer: "exploration", externalTargetId: "investigate-control-room" },
  { id: "a-b-identity-chain-complete", producer: "exploration", externalTargetId: "investigate-old-clinic" },
  { id: "a-left-clinic-with-sister-known", producer: "exploration", externalTargetId: "investigate-old-clinic" },
  { id: "old-accident-coverup-proven", producer: "exploration", externalTargetId: "investigate-father-and-company" },
  { id: "father-full-role-known", producer: "exploration", externalTargetId: "investigate-father-and-company" },
  { id: "company-succession-chain", producer: "exploration", externalTargetId: "investigate-father-and-company" },
  { id: "b-prior-mine-ignorance-established", producer: "exploration", externalTargetId: "investigate-father-and-company" },
  { id: "three-identities-merged", producer: "exploration", externalTargetId: "investigate-anonymous-hideout" },
  { id: "white-lamp-self-exculpation-known", producer: "exploration", externalTargetId: "investigate-anonymous-hideout" },
  { id: "mine-bypass-coordinate-known", producer: "exploration", externalTargetId: "investigate-anonymous-hideout" },
  { id: "sealed-mine-bypassed", producer: "minigame" },
  { id: "x-pushed-su-known", producer: "exploration", externalTargetId: "investigate-su-death-scene" },
  { id: "b-refused-rescue-recorded", producer: "exploration", externalTargetId: "investigate-su-death-scene" },
  { id: "night-sealing-coverup-proven", producer: "exploration", externalTargetId: "investigate-su-death-scene" },
  { id: "su-death-chain-complete", producer: "exploration", externalTargetId: "investigate-su-death-scene" },
  { id: "full-evidence-package-ready", producer: "exploration", externalTargetId: "investigate-company-server" },
  { id: "x-recovery-demand-delivered", producer: "conversation" },
  {
    id: "evidence-handed-to-x",
    producer: "state",
    derivedFrom: { eventType: "CHOICE_MADE", targetId: "hand-over-evidence" }
  },
  {
    id: "x-handover-refused",
    producer: "state",
    derivedFrom: { eventType: "CHOICE_MADE", targetId: "refuse-handover" }
  },
  { id: "x-showdown-survived", producer: "minigame" },
  { id: "x-showdown-lost", producer: "minigame" },
  {
    id: "all-evidence-destroyed",
    producer: "state",
    derivedFrom: { eventType: "CHOICE_MADE", targetId: "destroy-all-evidence" }
  },
  {
    id: "curated-evidence-published",
    producer: "state",
    derivedFrom: { eventType: "CHOICE_MADE", targetId: "publish-curated-evidence" }
  },
  {
    id: "full-evidence-published",
    producer: "state",
    derivedFrom: { eventType: "CHOICE_MADE", targetId: "publish-full-evidence" }
  },
  { id: "ending-accomplice-acknowledged", producer: "story" },
  { id: "ending-defeated-acknowledged", producer: "story" },
  { id: "ending-erasure-acknowledged", producer: "story" },
  { id: "ending-curated-truth-acknowledged", producer: "story" },
  { id: "ending-full-account-acknowledged", producer: "story" }
]);
