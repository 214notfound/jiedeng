// 本文件声明 V3 重返矿井阶段，连通排水洞并还原苏禾之死的完整责任链。
(function registerMineReturnStory(global) {
  "use strict";

  const internal = global.WhiteLampStoryInternal;
  if (!internal || typeof internal.registerStoryStage !== "function") {
    throw new Error("[white-lamp:story:v3] V3 registry extension 未先加载");
  }

  internal.registerStoryStage("mine-return", [
    {
      id: "mine-route-restored",
      sourceRef: "M00-M05",
      stageId: "mine-return",
      revision: 1,
      intent: "通过路线解密将旧矿图、坠沟地形和藏点坐标拼成排水洞潜入路线。",
      enterWhen: {
        allFacts: [
          "three-identities-merged",
          "white-lamp-self-exculpation-known",
          "mine-bypass-coordinate-known",
        ],
      },
      milestones: [
        {
          id: "sealed-mine-bypassed",
          intent: "玩家绕过唯一公开入口的封墙，进入矿井内部平台。",
          satisfiedWhen: { allFacts: ["sealed-mine-bypassed"] },
        },
      ],
      completion: { allMilestones: ["sealed-mine-bypassed"] },
      handoffs: [
        {
          id: "mine-route-puzzle",
          capability: "minigame",
          targetId: "mine-route-puzzle",
          gameStyle: "puzzle",
          goalIds: ["sealed-mine-bypassed"],
        },
      ],
      actions: [],
      presentations: [],
      onComplete: [],
      transitions: [
        { id: "continue-to-su-death", to: "su-he-death-reconstructed" },
      ],
      completesStage: false,
      terminal: false,
      endingId: null,
    },
    {
      id: "su-he-death-reconstructed",
      sourceRef: "M06-M16",
      stageId: "mine-return",
      revision: 1,
      intent: "用苏禾录音、封墙和夜间施工记录还原小周推人、王阙拒绝施救及集团掩盖。",
      enterWhen: { allFacts: ["sealed-mine-bypassed"] },
      milestones: [
        {
          id: "zhou-pushed-su-known",
          intent: "确认小周未经请示将苏禾推入内部竖井。",
          satisfiedWhen: { allFacts: ["x-pushed-su-known"] },
        },
        {
          id: "wang-refused-rescue-known",
          intent: "确认苏禾当时尚活且可施救，王阙亲口拒绝。",
          satisfiedWhen: { allFacts: ["b-refused-rescue-recorded"] },
        },
        {
          id: "night-coverup-known",
          intent: "确认小周提前调用封井小队，集团随后接受并掩盖结果。",
          satisfiedWhen: { allFacts: ["night-sealing-coverup-proven"] },
        },
        {
          id: "su-death-chain-known",
          intent: "将录音、封墙、手机轨迹和安保调度合并为完整证据链。",
          satisfiedWhen: { allFacts: ["su-death-chain-complete"] },
        },
      ],
      completion: {
        allMilestones: [
          "zhou-pushed-su-known",
          "wang-refused-rescue-known",
          "night-coverup-known",
          "su-death-chain-known",
        ],
      },
      handoffs: [
        {
          id: "investigate-su-death-scene",
          capability: "exploration",
          targetId: "investigate-su-death-scene",
          goalIds: [
            "zhou-pushed-su-known",
            "wang-refused-rescue-known",
            "night-coverup-known",
            "su-death-chain-known",
          ],
        },
      ],
      actions: [],
      presentations: [],
      onComplete: [],
      transitions: [
        { id: "continue-to-server", to: "server-evidence-recovered" },
      ],
      completesStage: true,
      terminal: false,
      endingId: null,
    },
  ]);
})(window);
