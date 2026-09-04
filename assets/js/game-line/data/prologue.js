// 本文件声明 V1 祠堂阶段的剧情目标、可修改展示文案、外部交接和推进条件。
(function registerPrologueStory(global) {
  "use strict";

  const internal = global.WhiteLampStoryInternal;
  if (!internal || typeof internal.registerStoryStage !== "function") {
    throw new Error("[white-lamp:story] story-registry.js 未先加载");
  }

  internal.registerStoryStage("prologue", [
    {
      id: "prologue-wake",
      sourceRef: "P00-P01",
      stageId: "prologue",
      revision: 1,
      intent: "玩家确认近期失忆，认识小 X 的表面身份，并接受调查村中怪事的任务。",
      milestones: [
        {
          id: "wake-context-known",
          intent: "玩家确认醒来、失忆和小 X 的表面身份。",
          satisfiedWhen: { allFacts: ["prologue-wake-context-known"] },
        },
        {
          id: "surface-task-known",
          intent: "玩家知道当前任务是调查村里的怪事。",
          satisfiedWhen: { allFacts: ["surface-investigation-task-known"] },
        },
      ],
      completion: {
        allMilestones: ["wake-context-known", "surface-task-known"],
      },
      handoffs: [
        {
          id: "prologue-briefing",
          capability: "conversation",
          targetId: "prologue-briefing",
          npcIds: ["companion-x"],
          goalIds: ["surface-task-known"],
          startWhen: { allFacts: ["prologue-wake-context-known"] },
        },
      ],
      actions: [
        {
          id: "confirm-wake-context",
          label: "确认当前处境",
          actionType: "advance",
          availableWhen: { noneFacts: ["prologue-wake-context-known"] },
          effect: {
            id: "record-wake-context",
            eventType: "STORY_FACT_RECORDED",
            payload: { factId: "prologue-wake-context-known" },
          },
        },
      ],
      presentations: [
        {
          id: "wake-after-rain",
          when: { noneFacts: ["prologue-wake-context-known"] },
          sceneId: "shrine",
          blocks: [
            {
              id: "rain-has-stopped",
              blockType: "narration",
              text: "暴雨停了。你在一座潮湿的旧祠堂里醒来。",
            },
            {
              id: "recent-memory-gap",
              blockType: "narration",
              text: "思考和行动都没有问题，但近期的记忆只剩下一段空白。小 X 守在旁边，自称是公司的安全联络员。",
            },
          ],
          actionIds: ["confirm-wake-context"],
        },
      ],
      onComplete: [],
      transitions: [
        { id: "continue-to-belongings", to: "prologue-belongings" },
      ],
      completesStage: false,
      terminal: false,
      endingId: null,
    },
    {
      id: "prologue-belongings",
      sourceRef: "P02-P05",
      stageId: "prologue",
      revision: 1,
      intent: "玩家检查工作证和蓝玻璃珠，从小 X 处取得无标记旧钥匙。",
      enterWhen: { allFacts: ["surface-investigation-task-known"] },
      milestones: [
        {
          id: "burned-work-id-checked",
          intent: "玩家确认烧毁的工作证仍能辨认公司标识和姓 B。",
          satisfiedWhen: { allFacts: ["burned-work-id-investigated"] },
        },
        {
          id: "blue-glass-bead-checked",
          intent: "玩家确认蓝玻璃珠没有文字，也看不出来源。",
          satisfiedWhen: { allFacts: ["blue-glass-bead-investigated"] },
        },
        {
          id: "key-received-from-x",
          intent: "小 X 把在出事地点附近捡到的旧钥匙交给玩家。",
          satisfiedWhen: { allFacts: ["key-a-given-by-x"] },
          onReach: [
            {
              id: "give-key-a",
              eventType: "ITEM_ACQUIRED",
              payload: { itemId: "key-a" },
            },
          ],
        },
        {
          id: "x-memory-deflection-noticed",
          intent: "玩家追问过去时，注意到小 X 主动转移话题。",
          satisfiedWhen: {
            allFacts: ["x-deflects-memory-question-noticed"],
          },
        },
      ],
      completion: {
        allMilestones: [
          "burned-work-id-checked",
          "blue-glass-bead-checked",
          "key-received-from-x",
        ],
      },
      handoffs: [
        {
          id: "shrine-belongings",
          capability: "exploration",
          targetId: "shrine-belongings",
          goalIds: ["burned-work-id-checked", "blue-glass-bead-checked"],
        },
        {
          id: "prologue-key-and-memory",
          capability: "conversation",
          targetId: "prologue-key-and-memory",
          npcIds: ["companion-x"],
          goalIds: ["key-received-from-x"],
          startWhen: {
            allFacts: [
              "burned-work-id-investigated",
              "blue-glass-bead-investigated",
            ],
          },
        },
      ],
      actions: [],
      presentations: [],
      onComplete: [],
      transitions: [
        { id: "continue-to-white-lamp", to: "prologue-white-lamp" },
      ],
      completesStage: false,
      terminal: false,
      endingId: null,
    },
    {
      id: "prologue-white-lamp",
      sourceRef: "P06-P08",
      stageId: "prologue",
      revision: 1,
      intent: "玩家亲眼遭遇白灯，得知借灯禁忌，并决定前往村口。",
      enterWhen: {
        allFacts: [
          "burned-work-id-investigated",
          "blue-glass-bead-investigated",
          "key-a-given-by-x",
        ],
      },
      milestones: [
        {
          id: "white-lamp-seen",
          intent: "玩家亲眼看到祠堂外的第一盏白灯。",
          satisfiedWhen: { allFacts: ["white-lamp-witnessed"] },
        },
        {
          id: "lamp-incident-understood",
          intent: "玩家得知借灯禁忌、供电疑点和村口调查计划。",
          satisfiedWhen: {
            allFacts: ["prologue-lamp-incident-understood"],
          },
        },
        {
          id: "leave-shrine-decided",
          intent: "玩家决定离开祠堂前往村口。",
          satisfiedWhen: { allFacts: ["leave-shrine-chosen"] },
        },
      ],
      completion: {
        allMilestones: [
          "white-lamp-seen",
          "lamp-incident-understood",
          "leave-shrine-decided",
        ],
      },
      handoffs: [
        {
          id: "prologue-lamp-incident",
          capability: "conversation",
          targetId: "prologue-lamp-incident",
          npcIds: ["companion-x"],
          goalIds: ["lamp-incident-understood"],
          startWhen: { allFacts: ["white-lamp-witnessed"] },
        },
      ],
      actions: [
        {
          id: "confirm-white-lamp",
          label: "看向祠堂外",
          actionType: "advance",
          availableWhen: { noneFacts: ["white-lamp-witnessed"] },
          effect: {
            id: "record-white-lamp",
            eventType: "STORY_FACT_RECORDED",
            payload: { factId: "white-lamp-witnessed" },
          },
        },
        {
          id: "leave-shrine",
          label: "前往村口",
          actionType: "advance",
          availableWhen: {
            allFacts: ["prologue-lamp-incident-understood"],
            noneFacts: ["leave-shrine-chosen"],
          },
          effect: {
            id: "record-leaving-shrine",
            eventType: "STORY_FACT_RECORDED",
            payload: { factId: "leave-shrine-chosen" },
          },
        },
      ],
      presentations: [
        {
          id: "first-white-lamp",
          when: { noneFacts: ["white-lamp-witnessed"] },
          sceneId: "shrine",
          blocks: [
            {
              id: "lamp-outside-shrine",
              blockType: "narration",
              text: "祠堂外的雨幕里，不知何时亮起了一盏惨白的灯。",
            },
          ],
          actionIds: ["confirm-white-lamp"],
        },
        {
          id: "route-to-village",
          when: {
            allFacts: ["prologue-lamp-incident-understood"],
            noneFacts: ["leave-shrine-chosen"],
          },
          sceneId: "shrine",
          blocks: [
            {
              id: "investigate-at-village",
              blockType: "system",
              text: "先去村口，问清最近谁见过怪事，以及项目究竟出了什么问题。",
            },
          ],
          actionIds: ["leave-shrine"],
        },
      ],
      onComplete: [],
      transitions: [
        { id: "continue-to-village", to: "village-arrival" },
      ],
      completesStage: true,
      terminal: false,
      endingId: null,
    },
  ]);
})(window);
