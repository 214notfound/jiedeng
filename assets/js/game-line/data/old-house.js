// 本文件声明 V1 陈家老宅阶段的调查目标、可修改展示文案、呼名事件与终点。
(function registerOldHouseStory(global) {
  "use strict";

  const internal = global.WhiteLampStoryInternal;
  if (!internal || typeof internal.registerStoryStage !== "function") {
    throw new Error("[white-lamp:story] story-registry.js 未先加载");
  }

  internal.registerStoryStage("old-house", [
    {
      id: "old-house-entry",
      sourceRef: "O00",
      stageId: "old-house",
      revision: 1,
      intent: "玩家抵达陈家老宅，并确认小 X 交出的旧钥匙可以开门。",
      enterWhen: {
        allFacts: [
          "key-a-acquired",
          "restored-village-map-acquired",
          "old-house-unlocked",
          "old-house-route-chosen",
        ],
      },
      milestones: [
        {
          id: "old-house-door-opened",
          intent: "玩家使用无标记旧钥匙打开陈家老宅。",
          satisfiedWhen: { allFacts: ["old-house-door-opened"] },
        },
      ],
      completion: { allMilestones: ["old-house-door-opened"] },
      handoffs: [
        {
          id: "old-house-door",
          capability: "exploration",
          targetId: "old-house-door",
          goalIds: ["old-house-door-opened"],
        },
      ],
      actions: [],
      presentations: [],
      onComplete: [],
      transitions: [
        { id: "continue-to-investigation", to: "old-house-investigation" },
      ],
      completesStage: false,
      terminal: false,
      endingId: null,
    },
    {
      id: "old-house-investigation",
      sourceRef: "O01-O04",
      stageId: "old-house",
      revision: 1,
      intent: "玩家按任意顺序调查四项线索，建立 A 与陈家的基础轮廓。",
      enterWhen: { allFacts: ["old-house-door-opened"] },
      milestones: [
        {
          id: "photograph-clue-known",
          intent: "玩家确认照片中的 A、妹妹和父亲，且 A 当时面容完整。",
          satisfiedWhen: { allFacts: ["old-photograph-clue-known"] },
          onReach: [
            {
              id: "record-old-photograph",
              eventType: "CLUE_RECORDED",
              payload: { clueId: "old-photograph" },
            },
          ],
        },
        {
          id: "uniform-clue-known",
          intent: "玩家确认妹妹旧物与蓝玻璃珠存在实体联系。",
          satisfiedWhen: { allFacts: ["school-uniform-clue-known"] },
          onReach: [
            {
              id: "record-school-uniform",
              eventType: "CLUE_RECORDED",
              payload: { clueId: "school-uniform" },
            },
          ],
        },
        {
          id: "height-clue-known",
          intent: "玩家确认事故时 A 约十七岁，妹妹才是小学生。",
          satisfiedWhen: { allFacts: ["height-marks-clue-known"] },
          onReach: [
            {
              id: "record-height-marks",
              eventType: "CLUE_RECORDED",
              payload: { clueId: "height-marks" },
            },
          ],
        },
        {
          id: "funeral-clue-known",
          intent: "玩家确认妹妹死亡，A 也被村里作为死者送葬。",
          satisfiedWhen: { allFacts: ["funeral-list-clue-known"] },
          onReach: [
            {
              id: "record-funeral-list",
              eventType: "CLUE_RECORDED",
              payload: { clueId: "funeral-list" },
            },
          ],
        },
      ],
      completion: {
        allMilestones: [
          "photograph-clue-known",
          "uniform-clue-known",
          "height-clue-known",
          "funeral-clue-known",
        ],
      },
      handoffs: [
        {
          id: "old-house-clues",
          capability: "exploration",
          targetId: "old-house-clues",
          goalIds: [
            "photograph-clue-known",
            "uniform-clue-known",
            "height-clue-known",
            "funeral-clue-known",
          ],
        },
      ],
      actions: [],
      presentations: [],
      onComplete: [],
      transitions: [
        {
          id: "continue-to-confrontation",
          to: "old-house-clue-confrontation",
        },
      ],
      completesStage: false,
      terminal: false,
      endingId: null,
    },
    {
      id: "old-house-clue-confrontation",
      sourceRef: "O05",
      stageId: "old-house",
      revision: 1,
      intent: "玩家感到身份线索存在矛盾，而小 X 立即压下这一问题。",
      enterWhen: {
        allFacts: [
          "old-photograph-clue-known",
          "school-uniform-clue-known",
          "height-marks-clue-known",
          "funeral-list-clue-known",
        ],
      },
      milestones: [
        {
          id: "identity-conflict-raised",
          intent: "身份矛盾和小 X 转移话题均已传达。",
          satisfiedWhen: {
            allFacts: ["old-house-identity-conflict-raised"],
          },
        },
      ],
      completion: { allMilestones: ["identity-conflict-raised"] },
      handoffs: [
        {
          id: "old-house-clue-confrontation",
          capability: "conversation",
          targetId: "old-house-clue-confrontation",
          npcIds: ["companion-x"],
          goalIds: ["identity-conflict-raised"],
        },
      ],
      actions: [],
      presentations: [],
      onComplete: [],
      transitions: [
        { id: "continue-to-door-call", to: "old-house-call-at-door" },
      ],
      completesStage: false,
      terminal: false,
      endingId: null,
    },
    {
      id: "old-house-call-at-door",
      sourceRef: "O06-O08",
      stageId: "old-house",
      revision: 1,
      intent: "门外声音呼唤 A，小 X 阻止回应，声音的目标仍保持多解。",
      enterWhen: { allFacts: ["old-house-identity-conflict-raised"] },
      milestones: [
        {
          id: "door-call-finished",
          intent: "呼名、阻止回应和无法确定声音目标均已传达。",
          satisfiedWhen: { allFacts: ["door-call-incident-completed"] },
        },
      ],
      completion: { allMilestones: ["door-call-finished"] },
      handoffs: [
        {
          id: "old-house-door-call",
          capability: "conversation",
          targetId: "old-house-door-call",
          npcIds: ["unknown-caller", "companion-x"],
          goalIds: ["door-call-finished"],
        },
      ],
      actions: [],
      presentations: [],
      onComplete: [],
      transitions: [
        { id: "continue-to-week-end", to: "week-one-end" },
      ],
      completesStage: false,
      terminal: false,
      endingId: null,
    },
    {
      id: "week-one-end",
      sourceRef: "O09",
      stageId: "old-house",
      revision: 1,
      intent: "收束 V1，保留怪事与公司主线，并正式点亮主角身份疑问。",
      enterWhen: { allFacts: ["door-call-incident-completed"] },
      milestones: [
        {
          id: "week-one-end-confirmed",
          intent: "玩家确认第一周内容结束提示。",
          satisfiedWhen: { allFacts: ["week-one-end-acknowledged"] },
        },
      ],
      completion: { allMilestones: ["week-one-end-confirmed"] },
      handoffs: [],
      actions: [
        {
          id: "confirm-week-one-end",
          label: "结束第一周内容",
          actionType: "advance",
          availableWhen: { noneFacts: ["week-one-end-acknowledged"] },
          effect: {
            id: "record-week-one-end",
            eventType: "STORY_FACT_RECORDED",
            payload: { factId: "week-one-end-acknowledged" },
          },
        },
      ],
      presentations: [
        {
          id: "week-one-summary",
          when: { noneFacts: ["week-one-end-acknowledged"] },
          sceneId: "old-house",
          blocks: [
            {
              id: "main-question-remains",
              blockType: "narration",
              text: "更紧迫的问题仍是：谁在制造这些怪事，它们为什么总围着公司和旧事故出现？",
            },
            {
              id: "identity-question-lit",
              blockType: "narration",
              text: "而另一个问题已经无法忽视——你为什么带着陈家妹妹的旧物，小 X 的钥匙又为什么能打开陈家。",
            },
          ],
          actionIds: ["confirm-week-one-end"],
        },
      ],
      onComplete: [],
      transitions: [],
      completesStage: true,
      terminal: true,
      endingId: "week-one-end",
    },
  ]);
})(window);
