// R09/R12 探索目标：只描述可调查物体，不包含对白职责。

export const EXPLORATION_TASKS = Object.freeze([
  {
    node: "prologue-belongings", target: "shrine-belongings", type: "exploration",
    interactionType: "item",
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
    interactionType: "item",
    label: "观察村口",
    actions: [
      {id: "village-decline", label: "观察村口环境", marker: "村口", x: 15, y: 30,
        facts: ["village-decline-observed"],
        text: "不少屋子已经空了，搬迁和施工的痕迹留在路边。村里的衰败并不只是怪谈留下的结果。"},
      {id: "su-he-notice", label: "查看苏禾寻人启事", marker: "启事", x: 85, y: 30,
        facts: ["su-he-missing-notice-observed"],
        text: "路口和墙上贴着苏禾的寻人启事：村小学教师，近期失踪。有人还在寻找她，这不是旧传闻，而是村里正在发生的事。"}
    ]
  },
  {
    node: "old-house-entry", target: "old-house-door", type: "exploration",
    interactionType: "item", label: "打开老宅",
    actions: [
      {id: "old-house-door", label: "用旧钥匙打开宅门", marker: "宅门", x: 50, y: 30,
        facts: ["old-house-door-opened"], requiredItems: ["key-a"],
        text: "小周交出的旧钥匙转动了门锁。你还不知道他为什么会有这把钥匙。"}
    ]
  },
  {
    node: "old-house-investigation", target: "old-house-clues", type: "exploration",
    interactionType: "item",
    label: "核对屋内线索",
    actions: [
      {id: "old-photograph", label: "查看家庭照片", marker: "照片", x: 21, y: 22,
        facts: ["old-photograph-clue-known"],
        text: "照片里有A、妹妹和父亲。A当时的面容完整，与如今脸上留有伤痕的你并不相同。"},
      {id: "school-uniform", label: "查看妹妹的校服", marker: "校服", x: 22, y: 66,
        facts: ["school-uniform-clue-known"],
        text: "旧校服旁的盒子里留着妹妹拿着同款蓝玻璃珠的照片。你把掌心的珠子与照片对照，确认这种玻璃珠曾是她珍爱的东西。"},
      {id: "height-marks", label: "查看身高刻痕", marker: "刻痕", x: 84, y: 30,
        facts: ["height-marks-clue-known"],
        text: "刻痕旁的时间说明：事故发生时，A已经约十七岁，妹妹才是村小学生。"},
      {id: "funeral-list", label: "查看送葬名单", marker: "名单", x: 86, y: 78,
        facts: ["funeral-list-clue-known"],
        text: "旧丧葬记录表明，妹妹死于十七年前事故后的那段时间，A也被村里作为死者送葬。老人说“A早死了”，并非毫无依据。"}
    ]
  },
  v3Task({
    node: "outer-lines-investigation",
    target: "investigate-gorge-and-grave",
    sceneId: "mountain-routes",
    label: "调查山沟与衣冠冢",
    marker: "调查记录",
    x: 74,
    y: 60,
    facts: ["a-gorge-thread-complete"],
    blocks: [
      "送葬路线与当年的搜救路线在山腰旧运输道重合。坍方边缘仍能辨出当年下沟留下的旧痕。",
      "浅沟与深排水洞通向不同落点，证明兄妹二人并没有停在同一个位置。",
      "两座坟中，妹妹是实葬；陈晋年的坟里只有衣物和旧物，是一座衣冠冢，没有遗体。",
      "管理房夹层里的记录显示，搜救在第三日由父亲签字终止，同时留下了一张邻镇诊所票据的编号。",
      "小周看到票据编号后明显催促你离开。他对这条线索的关注超过了对空坟本身的关注。",
      "归档结论：陈晋年的死亡只是村里的既有结论；邻镇诊所是继续核实其身份的下一条线索。"
    ]
  }),
  v3Task({
    node: "outer-lines-investigation",
    target: "investigate-project-records",
    sceneId: "project-records",
    label: "核对项目档案",
    marker: "项目档案",
    x: 48,
    y: 50,
    facts: ["project-record-thread-complete"],
    blocks: [
      "村委旧楼的门禁记录和旧工作证编号互相对应，王阙曾以项目执行人员身份长期进出。",
      "旧电脑、恐吓执行表与秘密封井任务单表明，白灯、广播和封井不是零散事故，而是项目任务。",
      "归档结论：王阙是项目执行者，恐吓和封井属于公司任务。"
    ]
  }),
  v3Task({
    node: "outer-lines-investigation",
    target: "investigate-su-trail",
    sceneId: "su-trail",
    label: "追查苏禾轨迹",
    marker: "苏禾记录",
    x: 77,
    y: 67,
    facts: ["su-thread-complete"],
    blocks: [
      "废弃小学里仍留着苏禾整理的广播、电路与排水线路，她把三类异象放在同一张图上核对。",
      "旧矿图藏点、封井材料照片和手机移动记录说明，她在失踪前已经独立追查到装置与废井。",
      "归档结论：苏禾并非偶然失踪，她的调查已经触及人工装置和封闭矿井。"
    ]
  }),
  v3Task({
    node: "outer-lines-investigation",
    target: "investigate-white-lamp-mail",
    sceneId: "white-lamp-mail",
    label: "核对白灯客材料",
    marker: "匿名材料",
    x: 77,
    y: 69,
    facts: ["white-lamp-first-thread-complete"],
    blocks: [
      "邮电所留下的灯形条款提醒、投递日期和变声警告录音属于同一批匿名材料。",
      "日期证明这些可验证材料都晚于苏禾失踪；举报草稿多次谈及项目，却刻意避开王阙的名字。",
      "归档结论：白灯客在苏禾失踪后才开始留下材料，并有意识地回避王阙。"
    ]
  }),
  v3Task({
    node: "b-designer-revealed",
    target: "investigate-control-room",
    label: "复核控制室记录",
    marker: "操作台",
    x: 48,
    y: 50,
    facts: ["protagonist-is-b-known", "intimidation-plan-authorship"],
    blocks: [
      "系统图纸、操作台习惯和调试日志都指向同一名长期操作者。低清录像中的伤疤位置与你一致。",
      "会议摘要和版本记录表明，恐吓方案由王阙提出，并在出现老人跌亡后仍继续推进。",
      "归档结论：主角就是王阙；恐吓方案的提出与继续执行都与王阙有关。"
    ]
  }),
  v3Task({
    node: "a-survival-revealed",
    target: "investigate-old-clinic",
    label: "核对旧诊所档案",
    marker: "登记桌",
    x: 50,
    y: 53,
    facts: ["a-b-identity-chain-complete", "a-left-clinic-with-sister-known"],
    blocks: [
      "诊所账簿、伤情图、户籍变更与如今的伤疤互相吻合，把空坟后的去向接了起来。",
      "记录同时显示，陈晋年曾在伤后私自带妹妹离院；这是当时的冲动选择，不是他已经死亡的证据。",
      "归档结论：陈晋年到王阙的身份链成立，私自带妹妹离院的责任也被确认。"
    ]
  }),
  v3Task({
    node: "father-company-truth",
    target: "investigate-father-and-company",
    label: "调查父亲与公司",
    marker: "暗层档案",
    x: 48,
    y: 72,
    facts: [
      "old-accident-coverup-proven",
      "father-full-role-known",
      "company-succession-chain",
      "b-prior-mine-ignorance-established"
    ],
    blocks: [
      "暗层中的原始矿图和爆破日志证明旧事故源于非法试采与违规爆破，事故记录随后被篡改。",
      "医疗费协议、物证清单和未寄证言显示，父亲最初受到胁迫，后来又主动参与毁证。",
      "股权沿革和收购目录把旧矿业公司与现集团的资产、档案承接关系连接起来。",
      "风险谈话记录证明，王阙接任项目时并不知道废井就是旧事故现场。"
    ]
  }),
  v3Task({
    node: "white-lamp-identity-revealed",
    target: "investigate-anonymous-hideout",
    label: "调查匿名藏点",
    marker: "匿名终端",
    x: 48,
    y: 56,
    facts: ["three-identities-merged", "white-lamp-self-exculpation-known", "mine-bypass-coordinate-known"],
    blocks: [
      "加密入口、原文件和举报稿的写作痕迹一致，陈晋年、王阙与白灯客是同一个人在不同阶段使用的名字。",
      "删除日志显示，白灯客主动删去了恐吓、封井和苏禾相关内容，为自己保留了免责叙事。",
      "未发送材料中还保存着一组排水洞坐标，可以绕过矿井封墙进入内部。"
    ]
  }),
  v3Task({
    node: "su-he-death-reconstructed",
    target: "investigate-su-death-scene",
    label: "重建苏禾死亡现场",
    marker: "录音与记录",
    x: 31,
    y: 53,
    facts: ["x-pushed-su-known", "b-refused-rescue-recorded", "night-sealing-coverup-proven", "su-death-chain-complete"],
    blocks: [
      "文件袋中的录音证明，小周未经请示把苏禾推入内部竖井；录音里她仍然活着，现场具备施救条件。",
      "小周询问是否施救，王阙亲口拒绝。封井施工记录又显示，小周提前调用了封井小队。",
      "手机取卡痕迹、安保调度和集团服务器索引互相印证，集团随后接受并掩盖了这次封井。",
      "归档结论：推落、拒绝施救、提前封井与集团掩盖构成完整的苏禾死亡证据链。"
    ]
  }),
  v3Task({
    node: "server-evidence-recovered",
    target: "investigate-company-server",
    label: "提取集团服务器证据",
    marker: "证据索引",
    x: 50,
    y: 50,
    facts: ["full-evidence-package-ready"],
    blocks: [
      "原始服务器保留了纸面档案中被清洗的记录：旧矿难、收购胁迫、恐吓版本史、安保封井和记忆诱导计划。",
      "这些记录分别指向集团、父亲、小周和王阙，且能与此前取得的现场材料互证。",
      "归档结论：完整证据包已经形成，可以进入最终交付与处置。"
    ]
  })
]);

function v3Task({node, target, sceneId = null, label, marker, x, y, facts, blocks}) {
  return {
    node,
    target,
    sceneId,
    type: "exploration",
    interactionType: "item",
    label,
    actions: [{
      id: target,
      label,
      marker,
      x,
      y,
      facts,
      submitAfterReading: true,
      blocks: blocks.map((text, index) => ({
        id: `${target}-${index + 1}`,
        type: index === blocks.length - 1 ? "system" : "narration",
        text
      })),
      text: blocks.join("\n")
    }]
  };
}

export function explorationTaskFor(command) {
  const target = command.payload?.explorationId;
  return EXPLORATION_TASKS.find((task) => task.target === target);
}
