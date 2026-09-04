// 陈家老宅阶段剧情数据：开门、四项并行调查和第一次隔门呼名。
const interactions = [
  {
    id: "old-house.unlock-door",
    kind: "item-use",
    label: "用“A”字钥匙开门",
    prerequisites: { itemIds: ["item.key-a", "item.village-map"] },
    lockedText: "需要刻着“A”的钥匙和复原后的村庄手绘图。",
    firstText: "钥匙转动，陈家老宅的门开了。",
    repeatText: "老宅的门已经打开。"
  },
  {
    id: "old-house.family-photo",
    kind: "clue",
    label: "核对家庭照片",
    prerequisites: { interactionIds: ["old-house.unlock-door"] },
    lockedText: "先打开老宅的门。",
    firstText: "合照里的少年约莫十七岁，面容完整，没有你脸侧那样的旧疤。你盯着那张脸，只感到一阵说不清的熟悉。也许这把钥匙只是某个人留下的遗物。",
    repeatText: "照片里的少年仍带着平静的笑意。",
    rewardItemId: "clue.family-photo"
  },
  {
    id: "old-house.sister-uniform",
    kind: "clue",
    label: "核对妹妹的校服",
    prerequisites: { interactionIds: ["old-house.unlock-door"] },
    lockedText: "先打开老宅的门。",
    firstText: "椅背上的旧校服已经褪色，胸口仍能辨出石涧村小学的旧校徽。尺寸属于年幼的孩子，不可能是照片中那个十七岁少年穿的。",
    repeatText: "校服袖口磨得发白。",
    rewardItemId: "clue.sister-uniform"
  },
  {
    id: "old-house.height-marks",
    kind: "clue",
    label: "核对身高刻痕",
    prerequisites: { interactionIds: ["old-house.unlock-door"] },
    lockedText: "先打开老宅的门。",
    firstText: "墙上的两列身高刻痕分别写着“A”和“妹妹”。A的最后一笔标着十七岁，日期停在十七年前。",
    repeatText: "那些刻痕像是被人反复摸过。",
    rewardItemId: "clue.height-marks"
  },
  {
    id: "old-house.funeral-list",
    kind: "clue",
    label: "核对送葬名单",
    prerequisites: { interactionIds: ["old-house.unlock-door"] },
    lockedText: "先打开老宅的门。",
    firstText: "送葬名单把A和妹妹并列记在十七年前。村里显然一直把两个人都当作死者。纸页只能证明当年的说法，不能证明后来发生了什么。",
    repeatText: "名单上的墨迹已经晕开。",
    rewardItemId: "clue.funeral-list"
  },
  {
    id: "old-house.door-call",
    kind: "story-event",
    label: "留意门外的呼名",
    prerequisites: {
      interactionIds: [
        "old-house.family-photo",
        "old-house.sister-uniform",
        "old-house.height-marks",
        "old-house.funeral-list"
      ]
    },
    lockedText: "还有老宅线索没有核对。",
    firstText: "门外传来呼唤你名字的声音。你记起借灯的禁忌：不可回应。第一次“隔门呼名”发生了。第一周内容结束。",
    repeatText: "那声隔门呼名已经停下，门外只剩雨声。"
  }
];

export const OLD_HOUSE_SCENE = Object.freeze({
  id: "old-house",
  stageId: "oldHouse",
  eyebrow: "A线一：旧家",
  name: "陈家老宅",
  introduction: "复原的地图将你带到陈家老宅。刻着“A”的钥匙与这扇门吻合。",
  interactions,
  completionInteractionIds: interactions.map(({ id }) => id)
});

export const OLD_HOUSE_CLUE_INTERACTION_IDS = Object.freeze(
  interactions.filter(({ kind }) => kind === "clue").map(({ id }) => id)
);
