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
      presentations: [],
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
      presentations: [],
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
      presentations: [],
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
      presentations: [],
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
