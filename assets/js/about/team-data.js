// 介绍页共享数据：项目说明、团队分工与成员公开简介。
export const projectData = {
  title: "借灯 / WHITE LAMP",
  subtitle: "V1 · 网页交互悬疑故事",
  description: "《借灯》是一款浏览器交互故事。玩家从祠堂雨夜醒来，调查石涧村的怪事，收集线索、与村民对话并复原手绘地图；V1 将故事推进到陈家老宅的隔门呼名事件。",
  tags: ["剧情", "探索", "地图拼图", "本地存档", "V1"]
};

export const members = [
  { id: "yu-zhirang", name: "于知让", role: "账户 / 剧情", description: "负责本地注册、登录、游客会话，以及祠堂、村口和陈家老宅三阶段剧情引擎与内容。", shortMark: "于" },
  { id: "luo-chenfei", name: "罗晨菲", role: "全局 / 存档", description: "负责主菜单、全站导航、统一状态更新、保存恢复和全局操作反馈。", shortMark: "罗" },
  { id: "lu-zhengsong", name: "卢正松", role: "探索 / 成就", description: "负责祠堂、村口、老宅的热点调查，小 X 与村民对话，背包、线索和成就展示。", shortMark: "卢" },
  { id: "yang-meng", name: "杨梦", role: "入口 / 视觉", description: "负责游戏封面、入口视觉和桌面端、移动端的进入体验。", shortMark: "杨" },
  { id: "gao-bingxuan", name: "高冰轩", role: "小游戏 / 介绍", description: "负责手绘地图复原小游戏、项目介绍、制作组介绍和成员页面。", shortMark: "高" }
];
