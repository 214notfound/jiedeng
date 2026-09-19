// 成就目录只声明展示与解锁条件；条件全部复用已登记的正式剧情事实。
const achievement = (definition) => Object.freeze({
  ...definition,
  requiredFacts: Object.freeze([...definition.requiredFacts])
});

export const ACHIEVEMENTS = Object.freeze([
  achievement({
    id: "map-restorer",
    name: "残图归一",
    description: "三片旧路在雨水中重新相接，失落的去处终于有了方向。",
    category: "investigation",
    requiredFacts: ["map-puzzle-completed"]
  }),
  achievement({
    id: "old-house-echo",
    name: "尘封仍有回声",
    description: "听完老宅留下的声音，也看见那些名字彼此矛盾的裂缝。",
    category: "investigation",
    requiredFacts: ["week-one-end-acknowledged"]
  }),
  achievement({
    id: "four-rain-lines",
    name: "雨线交汇",
    description: "四条散落在山村之外的线索，最终汇入同一场旧雨。",
    category: "investigation",
    requiredFacts: [
      "a-gorge-thread-complete",
      "project-record-thread-complete",
      "su-thread-complete",
      "white-lamp-first-thread-complete"
    ]
  }),
  achievement({
    id: "lamp-without-ghost",
    name: "灯下无人",
    description: "白灯依旧亮着，灯后却只剩人为布置的线与回声。",
    category: "truth",
    requiredFacts: ["haunting-is-engineered"]
  }),
  achievement({
    id: "three-names-one-shadow",
    name: "三名照一身",
    description: "三个名字终于在同一面镜子里，照见一个无法再回避的人。",
    category: "truth",
    requiredFacts: ["three-identities-merged"]
  }),
  achievement({
    id: "beyond-the-sealed-well",
    name: "封井之外",
    description: "被水泥截断的路并非终点，旧矿道仍记得另一条入口。",
    category: "truth",
    requiredFacts: ["sealed-mine-bypassed"]
  }),
  achievement({
    id: "belated-testimony",
    name: "迟来的证词",
    description: "没有说出口的话，终于由散落的证据替她说完。",
    category: "truth",
    requiredFacts: ["su-death-chain-complete"]
  }),
  achievement({
    id: "truth-after-lamplight",
    name: "灯尽见真章",
    description: "当所有记录彼此印证，白灯再也遮不住完整的旧事。",
    category: "truth",
    requiredFacts: ["full-evidence-package-ready"]
  }),
  achievement({
    id: "trace-through-rain",
    name: "雨幕留痕",
    description: "你带着尚未熄灭的证据穿过封锁，让脚印留在雨幕之外。",
    category: "truth",
    requiredFacts: ["x-showdown-survived"]
  }),
  achievement({
    id: "ending-accomplice",
    name: "灯火照旧",
    description: "你把选择交还给守灯的人，雨夜于是恢复了原来的秩序。",
    category: "ending",
    secret: true,
    sequence: 1,
    requiredFacts: ["ending-accomplice-acknowledged"]
  }),
  achievement({
    id: "ending-defeated",
    name: "井口又高一寸",
    description: "灯灭以后，新浇的水泥替旧日真相再添一层沉默。",
    category: "ending",
    secret: true,
    sequence: 2,
    requiredFacts: ["ending-defeated-acknowledged"]
  }),
  achievement({
    id: "ending-erasure",
    name: "姓名落尽",
    description: "当所有名字都被擦去，留下的空白既像新生，也像罪证。",
    category: "ending",
    secret: true,
    sequence: 3,
    requiredFacts: ["ending-erasure-acknowledged"]
  }),
  achievement({
    id: "ending-curated-truth",
    name: "借来的黎明",
    description: "半束真相照亮了清晨，另一半仍藏在借来的名字后面。",
    category: "ending",
    secret: true,
    sequence: 4,
    requiredFacts: ["ending-curated-truth-acknowledged"]
  }),
  achievement({
    id: "ending-full-account",
    name: "此后无须借灯",
    description: "三个名字一同落款，天亮以后，石涧村不再向任何人借灯。",
    category: "ending",
    secret: true,
    sequence: 5,
    requiredFacts: ["ending-full-account-acknowledged"]
  })
]);

// 保留原有导出，避免地图成就的既有测试与调用方失效。
export const MAP_ACHIEVEMENT = ACHIEVEMENTS[0];
