// 祠堂探索数据：调查前置与对白内容，不替代公共剧情节点文件。
const interactions = [
  {
    id: "prologue.talk-x",
    kind: "dialogue",
    label: "与小X交谈",
    speaker: "小X",
    firstText: "小X自称是公司的安全联络员。他说你是公司外聘的逻辑分析师，来调查石涧村的“闹鬼”事件；你此前在矿道摔倒，头部受伤并暂时失忆。",
    repeatText: "小X再次强调：“你信不过任何人，但你信得过我。”"
  },
  {
    id: "prologue.check-wound",
    kind: "investigation",
    label: "检查伤口",
    firstText: "你摸到头部的新伤，额角到脸侧还有几道更早留下的旧疤。它们来自何时，你想不起来。",
    repeatText: "新伤仍在隐隐作痛，脸侧的旧疤也没有唤回更多记忆。"
  },
  {
    id: "prologue.take-key-a",
    kind: "item",
    label: "查看老宅钥匙",
    firstText: "你找到一把刻着“A”的老宅钥匙。",
    repeatText: "钥匙上的“A”依然清晰。",
    rewardItemId: "item.key-a"
  },
  {
    id: "prologue.take-badge-b",
    kind: "item",
    label: "查看烧毁的工作证",
    firstText: "工作证烧毁大半，只剩下一个姓氏：“B”。",
    repeatText: "残缺的工作证无法提供更多信息。",
    rewardItemId: "item.badge-b"
  },
  {
    id: "prologue.take-warning-tape",
    kind: "item",
    label: "查看警告录音带",
    firstText: "你找到一盘警告录音带。",
    repeatText: "录音带仍在你的背包里。",
    rewardItemId: "item.warning-tape"
  },
  {
    id: "prologue.play-warning-tape",
    kind: "investigation",
    label: "播放警告录音",
    prerequisites: { itemIds: ["item.warning-tape"] },
    lockedText: "你需要先找到警告录音带。",
    firstText: "录音里只有一句话：“不要急着认领任何名字。”",
    repeatText: "录音再次提醒你：“不要急着认领任何名字。”"
  },
  {
    id: "prologue.observe-white-lamp",
    kind: "investigation",
    label: "观察窗外的白灯",
    prerequisites: {
      interactionIds: [
        "prologue.talk-x",
        "prologue.check-wound",
        "prologue.take-key-a",
        "prologue.take-badge-b",
        "prologue.take-warning-tape",
        "prologue.play-warning-tape"
      ]
    },
    lockedText: "先弄清伤势，并检查三件随身物品。",
    firstText: "窗外出现一盏没有火焰却泛着白光的纸灯笼。按村里的禁忌，灯不可碰，门不可开，更不可回应门外的呼名。",
    repeatText: "白灯仍悬在雨夜里，没有火焰。"
  },
  {
    id: "prologue.talk-x-after-lamp",
    kind: "dialogue",
    label: "追问小X",
    speaker: "小X",
    prerequisites: { interactionIds: ["prologue.observe-white-lamp"] },
    lockedText: "白灯出现后再询问小X。",
    firstText: "小X说：“这村子有鬼，有人在装鬼，也可能是有人故意制造混乱掩盖什么——这正是你擅长的。”",
    repeatText: "小X仍催促你查清白灯背后的事。"
  },
  {
    id: "prologue.find-exit",
    kind: "investigation",
    label: "寻找祠堂出口",
    prerequisites: { interactionIds: ["prologue.observe-white-lamp"] },
    lockedText: "白灯尚未出现，现在还不能离开这一段调查。",
    firstText: "白灯出现后，你开始寻找祠堂的出口。",
    repeatText: "你已经确认了出口的位置。"
  },
  {
    id: "prologue.observe-x-power",
    kind: "character-observation",
    label: "观察小X处理断电",
    prerequisites: { interactionIds: ["prologue.find-exit"] },
    lockedText: "先找到祠堂出口。",
    firstText: "断电后，小X“恰好”知道电路断在什么位置。你记住了这个异常。",
    repeatText: "小X对断电位置的熟悉仍然令你在意。"
  }
];

export const PROLOGUE_SCENE = Object.freeze({
  id: "prologue",
  stageId: "prologue",
  eyebrow: "序章：醒来",
  name: "祠堂",
  introduction: "暴雨过后，你在石涧村祠堂醒来。你记忆全无，小X自称是公司派来的安全联络员。",
  interactions,
  completionInteractionIds: interactions.map(({ id }) => id)
});
