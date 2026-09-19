// 本文件声明 V3 外围调查阶段：四线并行取证与拆解人造“借灯”系统。
(function registerOuterInvestigationStory(global) {
  "use strict";

  const internal = global.WhiteLampStoryInternal;
  if (!internal || typeof internal.registerStoryStage !== "function") {
    throw new Error("[white-lamp:story:v3] V3 registry extension 未先加载");
  }

  internal.registerStoryStage("outer-investigation", [
    {
      id: "outer-lines-investigation",
      sourceRef: "G00-G05,R00-R05,S00-S05,W00-W04",
      stageId: "outer-investigation",
      revision: 1,
      intent: "玩家可按任意顺序完成陈晋年坠沟、王阙项目、苏禾调查和白灯客材料四条线。",
      enterWhen: { allFacts: ["week-one-end-acknowledged"] },
      milestones: [
        {
          id: "gorge-thread-complete",
          intent: "确认陈晋年的坟中无遗体，并取得邻镇诊所线索。",
          satisfiedWhen: { allFacts: ["a-gorge-thread-complete"] },
        },
        {
          id: "project-thread-complete",
          intent: "确认王阙是项目执行者，恐吓和封井属于公司任务。",
          satisfiedWhen: { allFacts: ["project-record-thread-complete"] },
        },
        {
          id: "su-thread-complete",
          intent: "确认苏禾在失踪前独立追查过装置和废井。",
          satisfiedWhen: { allFacts: ["su-thread-complete"] },
        },
        {
          id: "white-lamp-thread-complete",
          intent: "确认白灯客的材料晚于苏禾失踪，且刻意回避王阙。",
          satisfiedWhen: { allFacts: ["white-lamp-first-thread-complete"] },
        },
      ],
      completion: {
        allMilestones: [
          "gorge-thread-complete",
          "project-thread-complete",
          "su-thread-complete",
          "white-lamp-thread-complete",
        ],
      },
      handoffs: [
        {
          id: "investigate-gorge-and-grave",
          capability: "exploration",
          targetId: "investigate-gorge-and-grave",
          goalIds: ["gorge-thread-complete"],
        },
        {
          id: "investigate-project-records",
          capability: "exploration",
          targetId: "investigate-project-records",
          goalIds: ["project-thread-complete"],
        },
        {
          id: "investigate-su-trail",
          capability: "exploration",
          targetId: "investigate-su-trail",
          goalIds: ["su-thread-complete"],
        },
        {
          id: "investigate-white-lamp-mail",
          capability: "exploration",
          targetId: "investigate-white-lamp-mail",
          goalIds: ["white-lamp-thread-complete"],
        },
      ],
      actions: [],
      presentations: [
        {
          id: "four-threads-open",
          sceneId: "village",
          blocks: [
            {
              id: "four-threads-emerge",
              blockType: "narration",
              text: "从老宅出来，天已经黑了。村里的灯，只有零星几盏。",
            },
            {
              id: "four-threads-named",
              blockType: "narration",
              text: "陈晋年。公司留下的那份项目记录。苏禾。还有邮电所里那些没署名的纸。",
            },
            {
              id: "investigate-four-threads",
              blockType: "narration",
              text: "四件事，哪一件都还没有答案。……先从哪里开始。",
            },
          ],
          actionIds: [],
        },
      ],
      onComplete: [],
      transitions: [
        { id: "continue-to-dismantling", to: "haunting-system-dismantled" },
      ],
      completesStage: false,
      terminal: false,
      endingId: null,
    },
    {
      id: "haunting-system-dismantled",
      sourceRef: "D00-D06",
      stageId: "outer-investigation",
      revision: 1,
      intent: "通过解密还原白灯、广播和湿脚印的物理网络。",
      enterWhen: {
        allFacts: [
          "a-gorge-thread-complete",
          "project-record-thread-complete",
          "su-thread-complete",
          "white-lamp-first-thread-complete",
        ],
      },
      milestones: [
        {
          id: "haunting-engineering-proven",
          intent: "玩家证明三类异象都来自可控的人工系统。",
          satisfiedWhen: { allFacts: ["haunting-is-engineered"] },
        },
      ],
      completion: { allMilestones: ["haunting-engineering-proven"] },
      handoffs: [
        {
          id: "haunting-network-puzzle",
          capability: "minigame",
          targetId: "haunting-network-puzzle",
          gameStyle: "puzzle",
          goalIds: ["haunting-engineering-proven"],
        },
      ],
      actions: [],
      presentations: [
        {
          id: "haunting-network-entry",
          sceneId: "haunting-network",
          blocks: [
            {
              id: "three-signs-one-web",
              blockType: "narration",
              text: "三样东西，三个地方，同一个晚上。",
            },
            {
              id: "three-signs-not-ghosts",
              blockType: "system",
              text: "白灯、深夜广播、湿脚印。……它们不像是鬼。",
            },
            {
              id: "decrypt-haunting-network",
              blockType: "system",
              text: "把这三样摆在一张图上看看。",
            },
          ],
          actionIds: [],
        },
      ],
      onComplete: [],
      transitions: [
        { id: "continue-to-b-designer", to: "b-designer-revealed" },
      ],
      completesStage: true,
      terminal: false,
      endingId: null,
    },
  ]);
})(window);
