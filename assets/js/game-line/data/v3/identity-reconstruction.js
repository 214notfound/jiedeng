// 本文件声明 V3 身份重建阶段，依次确认王阙、陈晋年和白灯客属于同一个人。
(function registerIdentityReconstructionStory(global) {
  "use strict";

  const internal = global.WhiteLampStoryInternal;
  if (!internal || typeof internal.registerStoryStage !== "function") {
    throw new Error("[white-lamp:story:v3] V3 registry extension 未先加载");
  }

  internal.registerStoryStage("identity-reconstruction", [
    {
      id: "b-designer-revealed",
      sourceRef: "B20-B26",
      stageId: "identity-reconstruction",
      revision: 1,
      intent: "确认主角就是王阙，而且恐吓系统由他主动设计。",
      enterWhen: { allFacts: ["haunting-is-engineered"] },
      milestones: [
        {
          id: "wang-que-identity-known",
          intent: "通过操作习惯、伤疤与调试录像确认主角是王阙。",
          satisfiedWhen: { allFacts: ["protagonist-is-b-known"] },
        },
        {
          id: "intimidation-authorship-known",
          intent: "确认王阙提出并继续推进了恐吓方案。",
          satisfiedWhen: { allFacts: ["intimidation-plan-authorship"] },
        },
      ],
      completion: {
        allMilestones: ["wang-que-identity-known", "intimidation-authorship-known"],
      },
      handoffs: [
        {
          id: "investigate-control-room",
          capability: "exploration",
          targetId: "investigate-control-room",
          goalIds: ["wang-que-identity-known", "intimidation-authorship-known"],
        },
      ],
      actions: [],
      presentations: [
        {
          id: "b-designer-entry",
          sceneId: "mine-control-room",
          blocks: [
            {
              id: "debug-tape-figure",
              blockType: "narration",
              text: "控制室的显示器还能亮。只剩一段没被清掉的调试录像。",
            },
            {
              id: "tape-too-low-to-see",
              blockType: "narration",
              text: "画面很低，看不清脸。里边的人坐在操作台前，抬手，按了一串键。",
            },
            {
              id: "two-knocks-on-console",
              blockType: "narration",
              text: "他调完参数，用指节在台沿上敲了两下。",
            },
            {
              id: "hand-moves-by-itself",
              blockType: "narration",
              text: "你的手自己抬了起来，落在同一个位置上，也敲了两下。",
            },
            {
              id: "confirm-b-and-authorship",
              blockType: "system",
              text: "录像里的那个背影，是我……",
            },
          ],
          actionIds: [],
        },
      ],
      onComplete: [],
      transitions: [
        { id: "continue-to-chen-survival", to: "a-survival-revealed" },
      ],
      completesStage: false,
      terminal: false,
      endingId: null,
    },
    {
      id: "a-survival-revealed",
      sourceRef: "A20-A27",
      stageId: "identity-reconstruction",
      revision: 1,
      intent: "通过诊所记录确认陈晋年生还、毁容并改名为王阙。",
      enterWhen: {
        allFacts: ["protagonist-is-b-known", "intimidation-plan-authorship"],
      },
      milestones: [
        {
          id: "chen-wang-identity-chain-known",
          intent: "将空坟、诊所伤情图、户籍变更和当前伤疤连成完整身份链。",
          satisfiedWhen: { allFacts: ["a-b-identity-chain-complete"] },
        },
        {
          id: "sister-removal-known",
          intent: "确认陈晋年私自带妹妹离院的冲动选择。",
          satisfiedWhen: { allFacts: ["a-left-clinic-with-sister-known"] },
        },
      ],
      completion: {
        allMilestones: ["chen-wang-identity-chain-known", "sister-removal-known"],
      },
      handoffs: [
        {
          id: "investigate-old-clinic",
          capability: "exploration",
          targetId: "investigate-old-clinic",
          goalIds: ["chen-wang-identity-chain-known", "sister-removal-known"],
        },
      ],
      actions: [],
      presentations: [
        {
          id: "a-survival-entry",
          sceneId: "old-clinic",
          blocks: [
            {
              id: "empty-grave-no-body",
              blockType: "narration",
              text: "那两座坟里，陈晋年空棺，你还记得。",
            },
            {
              id: "clinic-and-household-register",
              blockType: "narration",
              text: "诊所的伤情图，和户籍底册上的那一处涂改，把两个本不该相连的名字连在了一起。",
            },
            {
              id: "confirm-chen-survival",
              blockType: "system",
              text: "空坟不是因为没有找到人。是因为那个人，正站在这里。",
            },
          ],
          actionIds: [],
        },
      ],
      onComplete: [],
      transitions: [
        { id: "continue-to-father-truth", to: "father-company-truth" },
      ],
      completesStage: false,
      terminal: false,
      endingId: null,
    },
    {
      id: "father-company-truth",
      sourceRef: "F00-F09",
      stageId: "identity-reconstruction",
      revision: 1,
      intent: "还原父亲的被迫与帮凶行为，并证明现集团承接了旧公司的矿权和秘密。",
      enterWhen: {
        allFacts: ["a-b-identity-chain-complete", "a-left-clinic-with-sister-known"],
      },
      milestones: [
        {
          id: "old-coverup-known",
          intent: "证明非法试采、违规爆破和事故篡改。",
          satisfiedWhen: { allFacts: ["old-accident-coverup-proven"] },
        },
        {
          id: "father-role-known",
          intent: "同时保留父亲最初被迫和后续主动毁证的责任。",
          satisfiedWhen: { allFacts: ["father-full-role-known"] },
        },
        {
          id: "company-succession-known",
          intent: "证明现集团承接旧矿业公司的资产和档案。",
          satisfiedWhen: { allFacts: ["company-succession-chain"] },
        },
        {
          id: "wang-prior-ignorance-known",
          intent: "确认王阙接任时不知废井就是旧事故现场。",
          satisfiedWhen: { allFacts: ["b-prior-mine-ignorance-established"] },
        },
      ],
      completion: {
        allMilestones: [
          "old-coverup-known",
          "father-role-known",
          "company-succession-known",
          "wang-prior-ignorance-known",
        ],
      },
      handoffs: [
        {
          id: "investigate-father-and-company",
          capability: "exploration",
          targetId: "investigate-father-and-company",
          goalIds: [
            "old-coverup-known",
            "father-role-known",
            "company-succession-known",
            "wang-prior-ignorance-known",
          ],
        },
      ],
      actions: [],
      presentations: [
        {
          id: "father-company-entry",
          sceneId: "father-house",
          blocks: [
            {
              id: "father-name-twice",
              blockType: "narration",
              text: "旧矿难的档案里，父亲的名字出现了两次。",
            },
            {
              id: "father-once-forced-once-willing",
              blockType: "narration",
              text: "一次是被迫的，一次是主动的。",
            },
            {
              id: "prove-company-succession",
              blockType: "system",
              text: "两次……",
            },
          ],
          actionIds: [],
        },
      ],
      onComplete: [],
      transitions: [
        { id: "continue-to-white-lamp-identity", to: "white-lamp-identity-revealed" },
      ],
      completesStage: false,
      terminal: false,
      endingId: null,
    },
    {
      id: "white-lamp-identity-revealed",
      sourceRef: "W20-W27",
      stageId: "identity-reconstruction",
      revision: 1,
      intent: "确认白灯客就是王阙，且匿名举报系统性删掉了他自己的责任。",
      enterWhen: {
        allFacts: [
          "old-accident-coverup-proven",
          "father-full-role-known",
          "company-succession-chain",
          "b-prior-mine-ignorance-established",
        ],
      },
      milestones: [
        {
          id: "three-identities-known",
          intent: "确认陈晋年、王阙和白灯客是同一个人使用的三个名字。",
          satisfiedWhen: { allFacts: ["three-identities-merged"] },
        },
        {
          id: "selective-report-known",
          intent: "确认白灯客有意删掉恐吓、封井和苏禾线索。",
          satisfiedWhen: { allFacts: ["white-lamp-self-exculpation-known"] },
        },
        {
          id: "mine-bypass-known",
          intent: "找到可绕过封墙的排水洞坐标。",
          satisfiedWhen: { allFacts: ["mine-bypass-coordinate-known"] },
        },
      ],
      completion: {
        allMilestones: [
          "three-identities-known",
          "selective-report-known",
          "mine-bypass-known",
        ],
      },
      handoffs: [
        {
          id: "investigate-anonymous-hideout",
          capability: "exploration",
          targetId: "investigate-anonymous-hideout",
          goalIds: [
            "three-identities-known",
            "selective-report-known",
            "mine-bypass-known",
          ],
        },
      ],
      actions: [],
      presentations: [
        {
          id: "white-lamp-identity-entry",
          sceneId: "anonymous-hideout",
          blocks: [
            {
              id: "report-missing-clues",
              blockType: "narration",
              text: "你仔细检查这份材料，是白灯客的举报资料，可是有些奇怪",
            },
            {
              id: "report-looks-fair",
              blockType: "narration",
              text: "白灯客寄出去的材料，看上去很公允。旧矿难、父亲、集团，一个都没落下。",
            },
            {
              id: "confirm-white-lamp-and-bypass",
              blockType: "narration",
              text: "可是从头到尾，没有提到人造恐吓，没有提到封井，没有苏禾的名字，似乎是忘记了，又似乎是为了隐藏。",
            },
          ],
          actionIds: [],
        },
      ],
      onComplete: [],
      transitions: [
        { id: "continue-to-mine-route", to: "mine-route-restored" },
      ],
      completesStage: true,
      terminal: false,
      endingId: null,
    },
  ]);
})(window);
