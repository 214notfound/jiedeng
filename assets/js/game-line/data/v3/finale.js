// 本文件声明 V3 终局阶段：服务器互证、小周回收、追逐与五个证据结局。
(function registerFinaleStory(global) {
  "use strict";

  const internal = global.WhiteLampStoryInternal;
  if (!internal || typeof internal.registerStoryStage !== "function") {
    throw new Error("[white-lamp:story:v3] V3 registry extension 未先加载");
  }

  internal.registerStoryStage("finale", [
    {
      id: "server-evidence-recovered",
      sourceRef: "T00-T06",
      stageId: "finale",
      revision: 1,
      intent: "用集团原始服务器记录互证旧矿难、恐吓、封井和记忆操控证据。",
      enterWhen: {
        allFacts: [
          "x-pushed-su-known",
          "b-refused-rescue-recorded",
          "night-sealing-coverup-proven",
          "su-death-chain-complete",
        ],
      },
      milestones: [
        {
          id: "full-package-ready",
          intent: "形成能分别证明集团、父亲、小周和王阙行为的完整证据包。",
          satisfiedWhen: { allFacts: ["full-evidence-package-ready"] },
        },
      ],
      completion: { allMilestones: ["full-package-ready"] },
      handoffs: [
        {
          id: "investigate-company-server",
          capability: "exploration",
          targetId: "investigate-company-server",
          goalIds: ["full-package-ready"],
        },
      ],
      actions: [],
      presentations: [
        {
          id: "server-evidence-entry",
          sceneId: "data-center",
          blocks: [
            {
              id: "server-not-scrubbed",
              blockType: "narration",
              text: "集团的原始服务器，没有像纸面档案那样被清洗过。",
            },
            {
              id: "cross-verify-server-evidence",
              blockType: "system",
              text: "用原始记录互证旧矿难、恐吓、封井和记忆操控的证据。",
            },
          ],
          actionIds: [],
        },
      ],
      onComplete: [],
      transitions: [
        { id: "continue-to-x-recovery", to: "x-recovery-confrontation" },
      ],
      completesStage: false,
      terminal: false,
      endingId: null,
    },
    {
      id: "x-recovery-confrontation",
      sourceRef: "T07-T11",
      stageId: "finale",
      revision: 1,
      intent: "小周要求回收全部证据，玩家在听完对峙后选择交付或拒绝。",
      enterWhen: { allFacts: ["full-evidence-package-ready"] },
      milestones: [
        {
          id: "recovery-demand-known",
          intent: "小周必须说明陪同调查、重启装置和回收证据的目的。",
          satisfiedWhen: { allFacts: ["x-recovery-demand-delivered"] },
        },
        {
          id: "handover-choice-made",
          intent: "玩家明确选择交出证据或拒绝交付。",
          satisfiedWhen: {
            anyFacts: ["evidence-handed-to-x", "x-handover-refused"],
          },
        },
      ],
      completion: {
        allMilestones: ["recovery-demand-known", "handover-choice-made"],
      },
      handoffs: [
        {
          id: "x-recovery-demand",
          capability: "conversation",
          targetId: "x-recovery-demand",
          npcIds: ["companion-x"],
          goalIds: ["recovery-demand-known"],
        },
      ],
      actions: [
        {
          id: "hand-over-evidence",
          label: "交出全部证据",
          actionType: "choice",
          availableWhen: {
            allFacts: ["x-recovery-demand-delivered"],
            noneFacts: ["evidence-handed-to-x", "x-handover-refused"],
          },
          effect: {
            id: "record-evidence-handover",
            eventType: "CHOICE_MADE",
            payload: { choiceId: "hand-over-evidence" },
          },
        },
        {
          id: "refuse-handover",
          label: "拒绝交付",
          actionType: "choice",
          availableWhen: {
            allFacts: ["x-recovery-demand-delivered"],
            noneFacts: ["evidence-handed-to-x", "x-handover-refused"],
          },
          effect: {
            id: "record-handover-refusal",
            eventType: "CHOICE_MADE",
            payload: { choiceId: "refuse-handover" },
          },
        },
      ],
      presentations: [
        {
          id: "choose-evidence-handover",
          when: {
            allFacts: ["x-recovery-demand-delivered"],
            noneFacts: ["evidence-handed-to-x", "x-handover-refused"],
          },
          sceneId: "data-center",
          blocks: [
            {
              id: "zhou-waits-for-evidence",
              blockType: "narration",
              text: "小周伸出手，等你把完整证据包交给他。",
            },
          ],
          actionIds: ["hand-over-evidence", "refuse-handover"],
        },
      ],
      onComplete: [],
      transitions: [
        {
          id: "handover-ending",
          to: "ending-accomplice",
          when: { allFacts: ["evidence-handed-to-x"] },
        },
        {
          id: "refuse-and-run",
          to: "x-showdown",
          when: { allFacts: ["x-handover-refused"] },
        },
      ],
      completesStage: false,
      terminal: false,
      endingId: null,
    },
    {
      id: "x-showdown",
      sourceRef: "T12-T15",
      stageId: "finale",
      revision: 1,
      intent: "用前面获得的装置规则逃离小周的追逐与证据回收。",
      enterWhen: { allFacts: ["x-handover-refused"] },
      milestones: [
        {
          id: "showdown-survived",
          intent: "玩家成功完成外发并逃离控制区。",
          satisfiedWhen: { allFacts: ["x-showdown-survived"] },
        },
        {
          id: "showdown-lost",
          intent: "玩家在追逐中失败，小周成功回收证据。",
          satisfiedWhen: { allFacts: ["x-showdown-lost"] },
        },
      ],
      completion: {
        anyMilestones: ["showdown-survived", "showdown-lost"],
      },
      handoffs: [
        {
          id: "x-showdown-chase",
          capability: "minigame",
          targetId: "x-showdown-chase",
          gameStyle: "chase",
          completionMode: "any",
          goalIds: ["showdown-survived", "showdown-lost"],
        },
      ],
      actions: [],
      presentations: [
        {
          id: "x-showdown-entry",
          sceneId: "data-center",
          blocks: [
            {
              id: "zhou-closes-in",
              blockType: "narration",
              text: "小周追了上来。装置的规则，你早就摸清了。",
            },
            {
              id: "escape-zhou-chase",
              blockType: "system",
              text: "用装置的规则逃离小周的追逐，别让证据被回收。",
            },
          ],
          actionIds: [],
        },
      ],
      onComplete: [],
      transitions: [
        {
          id: "showdown-defeat-ending",
          to: "ending-defeated",
          when: { allFacts: ["x-showdown-lost"] },
        },
        {
          id: "showdown-survival-choice",
          to: "evidence-disposition",
          when: { allFacts: ["x-showdown-survived"] },
        },
      ],
      completesStage: false,
      terminal: false,
      endingId: null,
    },
    {
      id: "evidence-disposition",
      sourceRef: "T16-T20",
      stageId: "finale",
      revision: 1,
      intent: "让玩家实际选择销毁、选择性公开或完整公开证据。",
      enterWhen: { allFacts: ["x-showdown-survived"] },
      milestones: [
        {
          id: "evidence-disposition-chosen",
          intent: "玩家已在三种互斥的证据处置中选择一种。",
          satisfiedWhen: {
            anyFacts: [
              "all-evidence-destroyed",
              "curated-evidence-published",
              "full-evidence-published",
            ],
          },
        },
      ],
      completion: { allMilestones: ["evidence-disposition-chosen"] },
      handoffs: [],
      actions: [
        {
          id: "destroy-all-evidence",
          label: "销毁全部证据",
          description: "销毁四组证据，什么都不留。",
          actionType: "choice",
          availableWhen: {
            noneFacts: [
              "all-evidence-destroyed",
              "curated-evidence-published",
              "full-evidence-published",
            ],
          },
          effect: {
            id: "record-total-erasure",
            eventType: "CHOICE_MADE",
            payload: { choiceId: "destroy-all-evidence" },
          },
        },
        {
          id: "publish-curated-evidence",
          label: "以白灯客名义选择性公开",
          description: "保留旧矿难、父亲参与、集团收购与掩盖；删除王阙设计恐吓、老人跌亡后继续、不施救、白灯客删证。",
          actionType: "choice",
          availableWhen: {
            noneFacts: [
              "all-evidence-destroyed",
              "curated-evidence-published",
              "full-evidence-published",
            ],
          },
          effect: {
            id: "record-curated-publication",
            eventType: "CHOICE_MADE",
            payload: { choiceId: "publish-curated-evidence" },
          },
        },
        {
          id: "publish-full-evidence",
          label: "完整公开",
          description: "保留旧矿难、父亲、集团、小周、王阙与白灯客的全部材料。",
          actionType: "choice",
          availableWhen: {
            noneFacts: [
              "all-evidence-destroyed",
              "curated-evidence-published",
              "full-evidence-published",
            ],
          },
          effect: {
            id: "record-full-publication",
            eventType: "CHOICE_MADE",
            payload: { choiceId: "publish-full-evidence" },
          },
        },
      ],
      presentations: [
        {
          id: "choose-evidence-disposition",
          when: {
            noneFacts: [
              "all-evidence-destroyed",
              "curated-evidence-published",
              "full-evidence-published",
            ],
          },
          sceneId: "village-exit",
          blocks: [
            {
              id: "evidence-groups-visible",
              blockType: "system",
              text: "四组证据已列出各自指向的人。你现在选择的不是一句立场，而是哪些证据会留下。",
            },
          ],
          actionIds: [
            "destroy-all-evidence",
            "publish-curated-evidence",
            "publish-full-evidence",
          ],
        },
      ],
      onComplete: [],
      transitions: [
        {
          id: "erasure-ending",
          to: "ending-erasure",
          when: { allFacts: ["all-evidence-destroyed"] },
        },
        {
          id: "curated-ending",
          to: "ending-curated-truth",
          when: { allFacts: ["curated-evidence-published"] },
        },
        {
          id: "full-account-ending",
          to: "ending-full-account",
          when: { allFacts: ["full-evidence-published"] },
        },
      ],
      completesStage: false,
      terminal: false,
      endingId: null,
    },
    createEndingNode({
      id: "ending-accomplice",
      sourceRef: "EA00-EA03",
      requiredFact: "evidence-handed-to-x",
      acknowledgementFact: "ending-accomplice-acknowledged",
      title: "《共犯的终点》",
      text: "小周毁掉证据并完成灭口。王阙最后一次把选择交给了别人。",
    }),
    createEndingNode({
      id: "ending-defeated",
      sourceRef: "EB00-EB03",
      requiredFact: "x-showdown-lost",
      acknowledgementFact: "ending-defeated-acknowledged",
      title: "《封井之人》",
      text: "小周灭口并回收了证据，副本被清除，项目继续。知道真相并没有自动保住真相。",
    }),
    createEndingNode({
      id: "ending-erasure",
      sourceRef: "EC00-EC04",
      requiredFact: "all-evidence-destroyed",
      acknowledgementFact: "ending-erasure-acknowledged",
      title: "《无名者》",
      text: "证据被全部销毁，村庄被拆。陈晋年和王阙又被留在了两份无法相认的记录里。",
    }),
    createEndingNode({
      id: "ending-curated-truth",
      sourceRef: "ED00-ED05",
      requiredFact: "curated-evidence-published",
      acknowledgementFact: "ending-curated-truth-acknowledged",
      title: "《白灯之后》",
      text: "集团的罪证被公开，王阙却仍以白灯客的名字删去了自己。",
    }),
    createEndingNode({
      id: "ending-full-account",
      sourceRef: "EE00-EE06",
      requiredFact: "full-evidence-published",
      acknowledgementFact: "ending-full-account-acknowledged",
      title: "《不再借灯》",
      text: "公司、父亲、小周、王阙与白灯客的全部行为同时公开，主角也第一次以同一个人的责任接受调查。",
    }),
  ]);

  function createEndingNode(config) {
    const confirmActionId = `confirm-${config.id}`;
    return {
      id: config.id,
      sourceRef: config.sourceRef,
      stageId: "finale",
      revision: 1,
      intent: `展示并确认${config.title}结局。`,
      enterWhen: { allFacts: [config.requiredFact] },
      milestones: [
        {
          id: "ending-acknowledged",
          intent: `玩家确认${config.title}的结果。`,
          satisfiedWhen: { allFacts: [config.acknowledgementFact] },
        },
      ],
      completion: { allMilestones: ["ending-acknowledged"] },
      handoffs: [],
      actions: [
        {
          id: confirmActionId,
          label: "确认结局",
          actionType: "advance",
          availableWhen: { noneFacts: [config.acknowledgementFact] },
          effect: {
            id: "record-ending-acknowledgement",
            eventType: "STORY_FACT_RECORDED",
            payload: { factId: config.acknowledgementFact },
          },
        },
      ],
      presentations: [
        {
          id: "ending-summary",
          when: { noneFacts: [config.acknowledgementFact] },
          sceneId: "village-exit",
          blocks: [
            { id: "ending-title", blockType: "system", text: config.title },
            { id: "ending-result", blockType: "narration", text: config.text },
          ],
          actionIds: [confirmActionId],
        },
      ],
      onComplete: [],
      transitions: [],
      completesStage: true,
      terminal: true,
      endingId: config.id,
    };
  }
})(window);
