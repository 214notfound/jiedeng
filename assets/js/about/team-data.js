/**
 * 《借灯》About Us / Project 数据文件
 * 版本：V1.2
 *
 * 用途：
 * 1. Project Intro 页面
 * 2. Team Overview 页面
 * 3. Person Intro / Member Detail 页面
 * 4. 右侧 Project / Person 导航列表
 *
 * 设计原则：
 * - 页面只负责渲染，不在 HTML 中硬编码成员资料；
 * - 尚未确认的资料一律保持空值 / 空数组，不使用“待补充”等占位文案；
 * - 头像、背景图只保存资源路径；
 * - 后续增加“手写标签 / 编号 / 档案 UI”时，可直接扩展 ui 字段。
 */

export const projectData = {
  id: "project",
  type: "project",
  title: "借灯",
  titleLead: "PROJECT",
  titleGhost: "// WHITE LAMP",
  subtitle: "雨夜山村中的悬疑互动叙事",

  cardSummary:
    "在雨夜山村中调查白灯、旧事故与失落身份，通过阅读、调查、选择和小游戏逐步接近真相。",

  oneSentence:
    "《借灯》是一款以雨夜山村为舞台的网页悬疑互动故事，玩家将通过阅读、调查、选择与小游戏收集线索，在彼此矛盾的名字、记忆与证据中寻找真相。",

  storyBackground: [
    "石涧村是一座背靠废弃矿山的半废弃山村。暴雨、旧祠堂、废弃小学和矿道共同构成了潮湿而封闭的环境。村中流传着“借灯”的禁忌：雨夜出现的白灯不可碰，门外呼唤名字的声音不可回应。",
    "玩家扮演一名在暴雨后于祠堂醒来的失忆者。身边的年轻联络员告诉你，你来到这里是为了调查接连发生的异常事件。但随着调查深入，村民对你的称呼、旧物中的身份信息和被掩埋的事故记录开始互相冲突。你需要弄清这里发生过什么，也要回答“我究竟是谁”。"
  ],

  legend: {
    title: "借灯禁忌",
    description:
      "石涧村相传，客死异乡的人若找不到归途，会在雨夜向活人“借灯”。门前若出现一盏没有火焰却泛着白光的纸灯笼，灯不可碰，门不可开，也不可回应门外呼唤自己名字的声音。",
    rules: [
      "白灯出现时，不要触碰灯笼。",
      "雨夜听见敲门声，不要立刻开门。",
      "门外有人呼唤名字时，不要回应。"
    ]
  },

  coreGameplay: [
    {
      id: "reading-choice",
      title: "阅读与选择",
      description:
        "通过剧情文本和对话选择理解人物关系，并留下能够被后续剧情读取的选择与事实记录。"
    },
    {
      id: "scene-investigation",
      title: "场景调查",
      description:
        "检查人物、旧物和环境中的异常细节，从互相矛盾的信息中建立自己的判断。"
    },
    {
      id: "clue-collection",
      title: "线索收集",
      description:
        "逐步获得钥匙、地图碎片与旧宅证据，并在后续调查中重新理解这些物件的意义。"
    },
    {
      id: "puzzle-progression",
      title: "解谜推进",
      description:
        "完成地图复原等 Mini-game，把分散的线索转化为新的可探索地点和剧情入口。"
    }
  ],

  playerFlow: [
    "雨夜醒来",
    "调查随身物品",
    "进入村庄",
    "询问村民",
    "收集地图碎片",
    "复原地图",
    "探索陈家老宅",
    "继续追查身份与旧事故"
  ],

  features: [
    {
      id: "layered-mystery",
      title: "层层反转的悬疑结构",
      description:
        "从“借灯是真是假”逐渐进入“谁在制造异常”与“玩家自身身份”两个更深层的问题。"
    },
    {
      id: "rainy-atmosphere",
      title: "统一的雨夜山村氛围",
      description:
        "祠堂、废弃小学、旧矿山与白灯等元素共同服务于潮湿、压抑且不完全可信的叙事体验。"
    },
    {
      id: "web-interaction",
      title: "剧情与网页交互结合",
      description:
        "文本、调查、状态记录和 Mini-game 不是独立页面，而是共同推动同一条剧情与线索链。"
    }
  ],

  version: {
    label: "V1 / 第一周内容",
    completed: [
      "完整故事大纲与主要人物关系已经形成。",
      "V1 剧情 Node 与模块接口约定已经整理。"
    ],
    inProgress: [
      "About Us / Project / Member 页面开发与视觉细化。",
      "地图复原 Mini-game 的交互、成功判定与剧情接口接入。",
      "成员头像、背景图和后续手写标签、编号等 UI 资产整理。"
    ]
  },

  info: {
    projectType: "网页悬疑互动故事",
    technology: ["HTML", "CSS", "JavaScript"],
    targetPlatform: "Web 浏览器",
    estimatedPlayTime: "",
    currentVersion: "V1",
    completionDate: ""
  },

  privacyNotice:
    "当前版本为纯前端课程演示，项目介绍与制作组页面只展示成员同意公开的信息，不收集或上传访问者的个人资料。",

  tags: ["STORY", "PUZZLE", "WEB GAME", "MYSTERY"],
  backgroundImage: "",

  ui: {
    archiveNumber: "PROJECT-00",
    handwrittenLabels: [],
    stamps: []
  }
};

export const teamData = {
  id: "team",
  type: "team",
  name: "白灯客",
  englishName: "",
  pageLabel: "TEAM / WHITE LAMP",

  oneSentence:
    "我们尝试以网页交互叙事为媒介，在雨夜山村中讲述关于名字、记忆、责任与身份的悬疑故事。",

  memberOrder: [
    "yu-zhirang",
    "luo-chenfei",
    "gao-bingxuan",
    "lu-zhengsong",
    "yang-meng"
  ],

  divisions: {
    planningAndWriting: "资料整理中，本轮暂不填写具体成员与职责。",
    development: "资料整理中，本轮暂不填写具体成员与职责。",
    visualAndInteraction: "资料整理中，本轮暂不填写具体成员与职责。",
    testingAndIntegration: "资料整理中，本轮暂不填写具体成员与职责。"
  },

  publicContact: null,

  courseInfo: {
    courseName: "",
    instructor: "",
    institution: "",
    completionTime: ""
  },

  ui: {
    archiveNumber: "TEAM-00",
    handwrittenLabels: [],
    stamps: []
  }
};

export const members = [
  {
    id: "yu-zhirang",
    type: "person",
    displayName: "于知让",
    name: "于知让",
    pageCode: "yu-zhirang",

    // 自我介绍中没有明确写项目分工，因此暂不擅自补写。
    role: "",
    roleDisplay: "",

    oneSentence:
      "喜欢把复杂的事情想明白，也习惯先搭起自己的理解体系，再在实践中不断推翻和重建。",

    modules: [],

    bio:
      "一个喜欢把事情想明白、也喜欢把生活过得有点意思的人。正在持续探索 AI 科研、Python、论文阅读与科研表达，也会关注具身智能、神经符号和 LLM。对新东西总忍不住先搭一套自己的理解体系，再一点点推翻重建；也喜欢写故事、做《借灯》这样奇怪但很上头的项目。",

    completedWork: [],

    quote:
      "希望自己不只是“会用 AI”，而是真正拥有独立思考、写代码和做研究的能力。把喜欢的事做深，把想做的事做成。",

    contact: null,
    shortMark: "YZR",
    portraitFile: "yu-zhirang.png",
    portrait: "",
    backgroundImage: "",

    ui: {
      archiveNumber: "MEMBER-01",
      handwrittenLabels: [],
      stamps: []
    }
  },

  {
    id: "gao-bingxuan",
    type: "person",
    displayName: "高冰轩",
    name: "高冰轩",
    pageCode: "gao-bingxuan",

    role: "Mini-game设计 / 介绍页开发",
    roleDisplay: "Mini-game设计 / 介绍页开发",

    oneSentence:
      "负责地图拼图等 Mini-game 与制作组介绍页面的设计和实现，并在项目中练习真正接管 AI 生成的代码。",

    modules: [
      "Mini-game",
      "About Us",
      "交互开发"
    ],

    bio:
      "正在一点点摸索、体验和塑造自己的人，希望知道自己为何而活，并且为此而活，也希望保有清醒的头脑、敏锐的内心和行动的勇气。在本项目中负责 Mini-game 的设计制作以及介绍页开发，并借此继续驯服 AI Coding、提升自己的编程理解与实现能力。",

    completedWork: [],

    quote:
      "希望大家能够喜欢我们的原创游戏《借灯》，也希望自己不只让 AI 把东西做出来，而是真正知道它为什么这样运行。",

    contact: null,
    shortMark: "GBX",
    portraitFile: "gao-bingxuan.png",
    portrait: "",
    backgroundImage: "",

    ui: {
      archiveNumber: "MEMBER-02",
      handwrittenLabels: [],
      stamps: []
    }
  },

  {
    id: "lu-zhengsong",
    type: "person",
    displayName: "卢正松",
    name: "卢正松",
    pageCode: "lu-zhengsong",

    // 自我介绍中没有明确写项目分工，因此暂不擅自补写。
    role: "",
    roleDisplay: "",

    oneSentence:
      "在团队协作和实际开发中学习前端、AI Coding 与 Git，希望每天少掉一点链子，也多一点从零到一的能力。",

    modules: [],

    bio:
      "一位热爱玩乐、拥有超绝松弛感的 AI 患者和编程菜鸟。喜欢飞拉达、蹦极等极限运动，也会在王者峡谷和《黑神话》中搬砖打怪。目前正在从零学习前端，熟悉 Codex 和 Git 协作，并在课程、部门和项目之间不断实践，希望借《借灯》提升编程、AI 使用和团队协作能力。",

    completedWork: [],

    quote:
      "希望通过这次团队项目提高编程、AI 使用和协作能力，也希望您喜欢《借灯》这个故事。",

    contact: null,
    shortMark: "LZS",
    portraitFile: "lu-zhengsong.png",
    portrait: "",
    backgroundImage: "",

    ui: {
      archiveNumber: "MEMBER-03",
      handwrittenLabels: [],
      stamps: []
    }
  },

  {
    id: "yang-meng",
    type: "person",
    displayName: "杨梦",
    name: "杨梦",
    pageCode: "yang-meng",

    role: "程序开发 / 美化设计",
    roleDisplay: "程序开发 / 美化设计",

    oneSentence:
      "参与《借灯》的程序开发与页面美化，把对剧情游戏的兴趣和不断冒出的脑洞落到真正可玩的网页体验中。",

    modules: [
      "程序开发",
      "页面美化"
    ],

    bio:
      "来自税收联培专业，性格外向，喜欢和人聊思路、碰撞脑洞，也愿意围绕一个问题反复推敲。平时喜欢阅读有故事氛围的小说和体验剧情类游戏，开发一款自己喜欢的游戏一直是很期待的事情。本项目中负责程序开发和美化设计，希望一边学习、一边与团队共同把想法变成有意思的小游戏。",

    completedWork: [],

    quote:
      "基础不一定扎实，但愿意学、愿意问，也希望在团队的共同努力下，把《借灯》做成一款真正有意思的小游戏。",

    contact: null,
    shortMark: "YM",
    portraitFile: "yang-meng.png",
    portrait: "",
    backgroundImage: "",

    ui: {
      archiveNumber: "MEMBER-04",
      handwrittenLabels: [],
      stamps: []
    }
  },

  {
    id: "luo-chenfei",
    type: "person",
    displayName: "罗晨菲",
    name: "罗晨菲",
    pageCode: "luo-chenfei",

    // 个人介绍已经收集；项目分工尚未确认，因此相关字段保持空值。
    role: "",
    roleDisplay: "",
    oneSentence:
      "25级徐特立英才班人工智能与工商管理双学位学生，喜欢在开发、机械臂、摄影、健身、绘画和内容创作之间探索。",
    profileFacts: [
      "ENFJ",
      "25级徐特立英才班",
      "人工智能与工商管理双学位"
    ],
    modules: [],
    bio:
      "啥都干过一点：开发过自己的摄影网站、Godot 小游戏，玩过机械臂，玩过摄影陪拍，健身、绘画、写公众号、拍视频剪视频。",
    completedWork: [],
    quote:
      "2026年最大成就：截止9月5号，没有哪天没吃鸡蛋。",
    contact: null,
    shortMark: "LCF",
    portraitFile: "luo-chenfei.png",
    portrait: "",
    backgroundImage: "",

    ui: {
      archiveNumber: "MEMBER-05",
      handwrittenLabels: [],
      stamps: []
    }
  }
];

// 兼容之前 About Us 样板的右侧 Project + Person 列表。
export const aboutEntries = [projectData, ...members];

// 团队总览页成员卡片只读取这些字段。
export const memberCards = members.map((member) => ({
  id: member.id,
  name: member.displayName,
  role: member.roleDisplay,
  summary: member.oneSentence,
  shortMark: member.shortMark,
  portrait: member.portrait,
  portraitFile: member.portraitFile
}));

export function getMemberById(memberId) {
  return members.find((member) => member.id === memberId) ?? null;
}

export function getAboutEntryById(entryId) {
  return aboutEntries.find((entry) => entry.id === entryId) ?? null;
}
