// 村口阶段剧情数据：三组矛盾说法可任意顺序调查。
const interactions = [
  {
    id: "village.observe-hub",
    kind: "investigation",
    label: "观察村口一带",
    firstText: "村口、小卖部与拒签户构成了当前能调查的区域。村民的反应各不相同。",
    repeatText: "你已经记下村口、小卖部与拒签户的位置。"
  },
  {
    id: "village.talk-majority",
    kind: "dialogue",
    label: "询问多数村民",
    speaker: "多数村民",
    firstText: "他们认定A在十七年前已经死了；谈到现在，只认识来谈拆迁的B。",
    repeatText: "他们仍坚持：A早已死去，来谈拆迁的人叫B。",
    rewardItemId: "item.map-fragment-1"
  },
  {
    id: "village.talk-refuser",
    kind: "dialogue",
    label: "询问拒签户",
    speaker: "拒签户",
    firstText: "白灯客只留下署名信件和灯形印记，提醒哪些文件不能签；有人说他是苏禾生前的线人，但从来没有人见过他的脸。",
    repeatText: "拒签户能确认的仍只有署名信件、灯形印记，以及“苏禾生前的线人”这一种传言。",
    rewardItemId: "item.map-fragment-2"
  },
  {
    id: "village.talk-confused-elder",
    kind: "dialogue",
    label: "询问记忆混乱的老人",
    speaker: "老人",
    firstText: "老人看着你，忽然喊了一声“A”，随后再也说不清自己认出了什么。",
    repeatText: "老人仍叫你“A”，但无法给出更多解释。",
    rewardItemId: "item.map-fragment-3"
  }
];

export const VILLAGE_SCENE = Object.freeze({
  id: "village",
  stageId: "village",
  eyebrow: "雨中的村口",
  name: "村口",
  introduction: "村口、小卖部和拒签户之间，村民对A、B与白灯客留下彼此冲突的说法。",
  interactions,
  // 环境观察可重读但不阻断地图；三组首次对话才是阶段门槛。
  completionInteractionIds: interactions
    .filter(({ kind }) => kind === "dialogue")
    .map(({ id }) => id)
});
