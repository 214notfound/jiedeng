// R09/R12 探索目标：只描述可调查物体，不包含对白职责。

export const EXPLORATION_TASKS = Object.freeze([
  {
    node: "prologue-belongings", target: "shrine-belongings", type: "exploration",
    label: "检查随身物品",
    actions: [
      {id: "burned-work-id", label: "查看烧毁的工作证", marker: "证件", x: 25, y: 75,
        facts: ["burned-work-id-investigated"],
        text: "工作证烧毁了大半，但还能辨认项目公司的标识和姓氏“B”。至少，这证明你与项目公司有现实联系。"},
      {id: "blue-glass-bead", label: "查看蓝玻璃珠", marker: "玻璃珠", x: 75, y: 75,
        facts: ["blue-glass-bead-investigated"],
        text: "掌心是一颗磨花的蓝色玻璃珠，上面没有文字，也看不出来源。你不知道为什么把这件不起眼的旧物带在身上。"}
    ]
  },
  {
    node: "village-arrival", target: "village-arrival-observation", type: "exploration",
    label: "观察村口",
    actions: [
      {id: "village-decline", label: "观察村口环境", marker: "村口", x: 25, y: 50,
        facts: ["village-decline-observed"],
        text: "不少屋子已经空了，搬迁和施工的痕迹留在路边。村里的衰败并不只是怪谈留下的结果。"},
      {id: "su-he-notice", label: "查看苏禾寻人启事", marker: "启事", x: 75, y: 65,
        facts: ["su-he-missing-notice-observed"],
        text: "路口和墙上贴着苏禾的寻人启事：村小学教师，近期失踪。有人还在寻找她，这不是旧传闻，而是村里正在发生的事。"}
    ]
  },
  {
    node: "old-house-entry", target: "old-house-door", type: "exploration", label: "打开老宅",
    actions: [
      {id: "old-house-door", label: "用旧钥匙打开宅门", marker: "宅门", x: 50, y: 30,
        facts: ["old-house-door-opened"], requiredItems: ["key-a"],
        text: "小X交出的旧钥匙转动了门锁。你还不知道他为什么会有这把钥匙。"}
    ]
  },
  {
    node: "old-house-investigation", target: "old-house-clues", type: "exploration",
    label: "核对屋内线索",
    actions: [
      {id: "old-photograph", label: "查看家庭照片", marker: "照片", x: 20, y: 40,
        facts: ["old-photograph-clue-known"],
        text: "照片里有A、妹妹和父亲。A当时的面容完整，与如今脸上留有伤痕的你并不相同。"},
      {id: "school-uniform", label: "查看妹妹的校服", marker: "校服", x: 28, y: 75,
        facts: ["school-uniform-clue-known"],
        text: "旧校服旁的盒子里留着妹妹拿着同款蓝玻璃珠的照片。你把掌心的珠子与照片对照，确认这种玻璃珠曾是她珍爱的东西。"},
      {id: "height-marks", label: "查看身高刻痕", marker: "刻痕", x: 80, y: 40,
        facts: ["height-marks-clue-known"],
        text: "刻痕旁的时间说明：事故发生时，A已经约十七岁，妹妹才是村小学生。"},
      {id: "funeral-list", label: "查看送葬名单", marker: "名单", x: 72, y: 75,
        facts: ["funeral-list-clue-known"],
        text: "旧丧葬记录表明，妹妹死于十七年前事故后的那段时间，A也被村里作为死者送葬。老人说“A早死了”，并非毫无依据。"}
    ]
  }
]);

export function explorationTaskFor(command) {
  const target = command.payload?.explorationId;
  return EXPLORATION_TASKS.find((task) => task.target === target);
}
