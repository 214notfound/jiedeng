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
          intent: "定位并核对服务器内能分别证明集团、父亲、小周和王阙行为的三组关键证据。",
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
              blockType: "narration",
              text: "备份是定时做的，做得比清洗还勤。",
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
          label: "交出证据位置与访问结果",
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
              text: "小周伸出手，掌心朝上，等你交出证据位置与服务器访问结果。",
            },
            {
              id: "hand-stays-open",
              blockType: "narration",
              text: "等了一会儿，见你没有动，手也没有收回去。他就那样坚定的看着你",
            },
            {
              id: "this-hand-along-the-way",
              blockType: "system",
              text: "这只手，一路上替我背过包，也在祠堂门口拦过我。",
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
      intent: "在小周追击下取走三份关键证据并逃离控制区。",
      enterWhen: { allFacts: ["x-handover-refused"] },
      milestones: [
        {
          id: "showdown-survived",
          intent: "玩家收齐三份关键证据并逃离控制区。",
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
              text: "小周追了上来。他跑得不快，但路只有一条。你定位出的三组关键证据还在机房里。",
            },
            {
              id: "lights-in-rows",
              blockType: "narration",
              text: "机房里一排灯亮，另一排灯灭。再一排亮，再一排灭——那是你写的规则。",
            },
            {
              id: "i-wrote-this-system",
              blockType: "system",
              text: "这套东西是我做的。哪一段会熄、哪一段会停，我比谁都清楚。",
            },
            {
              id: "he-followed-seven-days",
              blockType: "system",
              text: "……可他也在。他跟了我七天。",
            },
            {
              id: "escape-zhou-chase",
              blockType: "system",
              text: "避开小周，取走三份关键证据并从出口逃离。",
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
              blockType: "narration",
              text: "四组东西已经分好了，整整齐齐摆在桌面上。",
            },
            {
              id: "export-key-on-the-right",
              blockType: "narration",
              text: "导出键在最右边。按下去，留下的就会留下来。",
            },
            {
              id: "not-a-stance",
              blockType: "system",
              text: "该留下哪些证据呢？",
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
      text: "你把东西递了过去。小周接得很稳，用两只手。"
        + "\n他数了一遍，又仔细看了一遍，然后点了点头。向你笑了笑"
        + "\n【小周】“路上辛苦了，谢谢你。”他说，“剩下的我来办。”"
        + "\n他转身去关机房的门。门合上以后，里面灭了一排灯。"
        + "\n【你】这一路上，我一直在把选择交给别人，或许，我应该早点发现吧……"
        + "\n一声枪响忽然传出，震得森林中鸟群四散，已经进入梦乡的村口大爷翻了个身，又沉沉的睡去了，像是什么都没发生过，又像是什么都不会发生。"
        + "\n那一夜之后，村里再没有过人，公司的各种踪迹从村子中消失，不愿搬迁的人们因为各种原因，失踪的失踪，离家的离家。村子终究还是散了。"
        + "\n只有在某些晚上，那些白灯还照旧亮着，轻轻的摇曳着光影，轻抚着再无人影的一扇扇门窗；大雨冲刷着数不尽的罪恶，在这沉默的喧噪中，一切照旧，一切都从未发生。",
    }),
    createEndingNode({
      id: "ending-defeated",
      sourceRef: "EB00-EB03",
      requiredFact: "x-showdown-lost",
      acknowledgementFact: "ending-defeated-acknowledged",
      title: "《封井之人》",
      text: "小周追上了你。他喘得很厉害，但他从来没有停下。"
        + "\n最后一段路上，灯全灭了。是他按的，他的眼神中有同情，也有冷漠和决然。"
        + "\n他把你手上的东西一件一件拿下来，放回箱子里。"
        + "\n【小周】“别怪我。”他说，“我也是要交差的。”"
        + "\n机房的屏幕一个一个变黑。备份在第一行就被删了。"
        + "\n【你】十七年前，苏禾也是这样被留在井里的吗。"
        + "\n小周没有回答，门在他身后合上了。留下了一片永恒的黑暗。在黑暗中，你凝视着那些血色的罪恶。"
        + "\n几天后，项目继续。而井口的水泥，又浇高了一层。",
    }),
    createEndingNode({
      id: "ending-erasure",
      sourceRef: "EC00-EC04",
      requiredFact: "all-evidence-destroyed",
      acknowledgementFact: "ending-erasure-acknowledged",
      title: "《无名者》",
      text: "你按下导出键，又按了清除。手没有抖。"
        + "\n四组东西一组一组地灭掉。最后一组的进度条走得最慢。接下来的事情你记不太清了。"
        + "\n村子在第二年拆完，陈家老宅也是。"
        + "\n拆迁的登记册上，那间屋子写的是“无主”。"
        + "\n户籍底册上，陈晋年那一栏还留着涂改的痕迹。王阙那一栏写着“注销”。"
        + "\n两份记录隔着一条街，谁也没有对上谁。"
        + "\n【王阙】这样也好。谁都不必是我。"
        + "\n 忘却是一种选择，忘却是一种逃避，忘却是一种新生，忘却是一种罪恶。"
        + "\n 雨还在下，滴答，滴答，默默记录着王阙人如其名的罪恶……",
    }),
    createEndingNode({
      id: "ending-curated-truth",
      sourceRef: "ED00-ED05",
      requiredFact: "curated-evidence-published",
      acknowledgementFact: "ending-curated-truth-acknowledged",
      title: "《白灯之后》",
      text: "你保留下来的那一半发了出去：矿难，胁迫，收购，掩盖。"
        + "\n删掉的那一半，你按旧名字署了名。"
        + "\n报道登出来那天，网上开始有人管“白灯客”叫英雄。"
        + "\n先是有人在他住过的地方放了一盏白色的灯。第二天之后，这便成了一种网红打卡行为。"
        + "\n【你】他们拜的那个名字，是我给自己留的最后一层皮。"
        + "\n老宅的院子里，从此每年都亮着一盏灯。"
        + "\n没有人知道那盏灯是谁点的，有传闻说，那是为了偿还白灯客借灯挂名的罪恶。一切照旧",
    }),
    createEndingNode({
      id: "ending-full-account",
      sourceRef: "EE00-EE06",
      requiredFact: "full-evidence-published",
      acknowledgementFact: "ending-full-account-acknowledged",
      title: "《不再借灯》",
      text: "你把四组东西一起发了出去，一份也没删。"
        + "\n检举信的最后是签名栏。你写了三个名字：陈晋年、王阙、白灯客。"
        + "\n第二天早上来了两辆警车。你没有锁门。"
        + "\n车上的人问你怎么称呼。你把三个名字都说了，又补了一句，“都是我。”"
        + "\n这一次，没有借来的名字。"
        + "\n那天夜里，村里那盏白灯没有亮。从那以后，石涧村再没有借过灯。",
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
