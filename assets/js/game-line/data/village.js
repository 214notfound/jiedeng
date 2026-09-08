// 本文件声明 V1 村口阶段的剧情目标、可修改展示文案、并行对话和地图交接。
(function registerVillageStory(global) {
  "use strict";

  const internal = global.WhiteLampStoryInternal;
  if (!internal || typeof internal.registerStoryStage !== "function") {
    throw new Error("[white-lamp:story] story-registry.js 未先加载");
  }

  internal.registerStoryStage("village", [
    {
      id: "village-arrival",
      sourceRef: "V00-V01",
      stageId: "village",
      revision: 1,
      intent: "玩家观察村庄衰败、搬迁施工和苏禾寻人启事。",
      enterWhen: { allFacts: ["leave-shrine-chosen"] },
      milestones: [
        {
          id: "village-decline-seen",
          intent: "玩家看见空屋、搬迁告示、施工痕迹和旧标语。",
          satisfiedWhen: { allFacts: ["village-decline-observed"] },
        },
        {
          id: "su-he-notice-seen",
          intent: "玩家看见村小学教师苏禾的寻人启事。",
          satisfiedWhen: { allFacts: ["su-he-missing-notice-observed"] },
        },
      ],
      completion: {
        allMilestones: ["village-decline-seen", "su-he-notice-seen"],
      },
      handoffs: [
        {
          id: "village-arrival-observation",
          capability: "exploration",
          targetId: "village-arrival-observation",
          goalIds: ["village-decline-seen", "su-he-notice-seen"],
        },
      ],
      actions: [],
      presentations: [],
      onComplete: [],
      transitions: [
        { id: "continue-to-inquiries", to: "village-inquiries" },
      ],
      completesStage: false,
      terminal: false,
      endingId: null,
    },
    {
      id: "village-inquiries",
      sourceRef: "V02-V12",
      stageId: "village",
      revision: 1,
      intent: "玩家从三名村民处取得公司、怪事、苏禾、旧事故和身份暗线。",
      enterWhen: {
        allFacts: ["village-decline-observed", "su-he-missing-notice-observed"],
      },
      milestones: [
        {
          id: "shopkeeper-thread-complete",
          intent: "小卖部老板完整传达项目、B 工程师、怪事和苏禾线索。",
          satisfiedWhen: { allFacts: ["shopkeeper-inquiry-completed"] },
          onReach: [
            {
              id: "give-map-fragment-1",
              eventType: "ITEM_ACQUIRED",
              payload: { itemId: "map-fragment-1" },
            },
          ],
        },
        {
          id: "holdout-thread-complete",
          intent: "拒签户完整传达房屋、祖坟、旧事故和小 X 打断深挖的信息。",
          satisfiedWhen: { allFacts: ["holdout-inquiry-completed"] },
          onReach: [
            {
              id: "give-map-fragment-2",
              eventType: "ITEM_ACQUIRED",
              payload: { itemId: "map-fragment-2" },
            },
          ],
        },
        {
          id: "elder-thread-complete",
          intent: "老人完整传达蓝玻璃珠、A、旧事故公开版本和小 X 阻止追问的信息。",
          satisfiedWhen: { allFacts: ["elder-inquiry-completed"] },
          onReach: [
            {
              id: "give-map-fragment-3",
              eventType: "ITEM_ACQUIRED",
              payload: { itemId: "map-fragment-3" },
            },
          ],
        },
      ],
      completion: {
        allMilestones: [
          "shopkeeper-thread-complete",
          "holdout-thread-complete",
          "elder-thread-complete",
        ],
      },
      handoffs: [
        {
          id: "village-shopkeeper-inquiry",
          capability: "conversation",
          targetId: "village-shopkeeper-inquiry",
          npcIds: ["villager-1", "companion-x"],
          goalIds: ["shopkeeper-thread-complete"],
        },
        {
          id: "village-holdout-inquiry",
          capability: "conversation",
          targetId: "village-holdout-inquiry",
          npcIds: ["villager-2", "companion-x"],
          goalIds: ["holdout-thread-complete"],
        },
        {
          id: "village-elder-inquiry",
          capability: "conversation",
          targetId: "village-elder-inquiry",
          npcIds: ["villager-3", "companion-x"],
          goalIds: ["elder-thread-complete"],
        },
      ],
      actions: [],
      presentations: [],
      onComplete: [],
      transitions: [
        { id: "continue-to-map", to: "village-map-and-route" },
      ],
      completesStage: false,
      terminal: false,
      endingId: null,
    },
    {
      id: "village-map-and-route",
      sourceRef: "V13-V14",
      stageId: "village",
      revision: 1,
      intent: "玩家复原手绘地图，取得完整地图并决定前往陈家老宅。",
      enterWhen: {
        allFacts: [
          "shopkeeper-inquiry-completed",
          "holdout-inquiry-completed",
          "elder-inquiry-completed",
        ],
      },
      milestones: [
        {
          id: "map-restored",
          intent: "玩家成功复原残缺手绘地图。",
          satisfiedWhen: { allFacts: ["map-puzzle-completed"] },
          onReach: [
            {
              id: "give-restored-village-map",
              eventType: "ITEM_ACQUIRED",
              payload: { itemId: "restored-village-map" },
            },
            {
              id: "unlock-old-house",
              eventType: "LOCATION_UNLOCKED",
              payload: { locationId: "old-house" },
            },
          ],
        },
        {
          id: "old-house-route-selected",
          intent: "玩家决定按地图前往陈家老宅。",
          satisfiedWhen: { allFacts: ["old-house-route-chosen"] },
        },
      ],
      completion: {
        allMilestones: ["map-restored", "old-house-route-selected"],
      },
      handoffs: [
        {
          id: "map-puzzle",
          capability: "minigame",
          targetId: "map-puzzle",
          goalIds: ["map-restored"],
          startWhen: {
            allFacts: [
              "map-fragment-1-acquired",
              "map-fragment-2-acquired",
              "map-fragment-3-acquired",
            ],
          },
        },
      ],
      actions: [
        {
          id: "go-old-house",
          label: "前往陈家老宅",
          actionType: "advance",
          availableWhen: {
            allFacts: ["map-puzzle-completed"],
            noneFacts: ["old-house-route-chosen"],
          },
          effect: {
            id: "record-old-house-route",
            eventType: "STORY_FACT_RECORDED",
            payload: { factId: "old-house-route-chosen" },
          },
        },
      ],
      presentations: [
        {
          id: "map-points-to-old-house",
          when: {
            allFacts: ["map-puzzle-completed"],
            noneFacts: ["old-house-route-chosen"],
          },
          sceneId: "village",
          blocks: [
            {
              id: "old-house-marked-on-map",
              blockType: "system",
              text: "复原后的地图指向陈家老宅。小 X 提醒你，那把旧钥匙或许能派上用场。",
            },
          ],
          actionIds: ["go-old-house"],
        },
      ],
      onComplete: [],
      transitions: [
        { id: "continue-to-old-house", to: "old-house-entry" },
      ],
      completesStage: true,
      terminal: false,
      endingId: null,
    },
  ]);
})(window);
