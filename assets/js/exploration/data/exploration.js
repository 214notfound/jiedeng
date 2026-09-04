// 探索与对话的目标、台词和布局；Node 转移与发奖由剧情及状态模块维护。
export const NODE_SCENES = Object.freeze({
  "prologue-wake":"shrine", "prologue-belongings":"shrine", "prologue-white-lamp":"shrine",
  "village-arrival":"village", "village-inquiries":"village", "village-map-and-route":"village",
  "old-house-entry":"old-house", "old-house-investigation":"old-house",
  "old-house-clue-confrontation":"old-house", "old-house-call-at-door":"old-house", "week-one-end":"old-house"
});
const sceneNames = {shrine:"祠堂", village:"村口", "old-house":"陈家老宅"};
// facts 均来自 V1 Node 清单；文字为目标对应的展示台词，不把点击次数提交给剧情。
export const TASKS = Object.freeze([
  {node:"prologue-wake", target:"prologue-briefing", type:"conversation", npc:"companion-x", label:"听小X说明来意", marker:"小X", x:22,y:55,
    actions:[{id:"surface-briefing", label:"与小X交谈", facts:["surface-investigation-task-known"], text:"【小X】我是公司的安全联络员。你最近的记忆出了问题，先别急着勉强自己。石涧村最近不断出现白灯、夜间广播和脚印，公司希望查清是谁在借项目制造混乱。我们先从这些怪事查起。"}]},
  {node:"prologue-belongings", target:"shrine-belongings", type:"exploration", label:"检查随身物品",
    actions:[
      {id:"burned-work-id", label:"查看烧毁的工作证", marker:"证件", x:25,y:75, facts:["burned-work-id-investigated"], text:"工作证烧毁了大半，但还能辨认项目公司的标识和姓氏“B”。至少，这证明你与项目公司有现实联系。"},
      {id:"blue-glass-bead", label:"查看蓝玻璃珠", marker:"玻璃珠", x:75,y:75, facts:["blue-glass-bead-investigated"], text:"掌心是一颗磨花的蓝色玻璃珠，上面没有文字，也看不出来源。你不知道为什么把这件不起眼的旧物带在身上。"}
    ]},
  {node:"prologue-belongings", target:"prologue-key-and-memory", type:"conversation", npc:"companion-x", label:"从小X处接过钥匙", marker:"小X",x:50,y:40,
    actions:[
      {id:"receive-key", label:"接过小X递来的旧钥匙", facts:["key-a-given-by-x"], text:"【小X】这是在你出事地点附近捡到的。先拿着，调查时可能用得上。\n他递来一把没有标记的老钥匙。你还不知道它能打开什么。"},
      {id:"ask-memory-and-receive-key", alternative:true, label:"追问过去，再接过钥匙", facts:["key-a-given-by-x","x-deflects-memory-question-noticed"], text:"【你】我以前是做什么的？\n【小X】先别硬想，能查东西就够了。眼下要查的是村里的异常。\n他把话题岔开，随后递来一把没有标记的老钥匙，说是在你出事地点附近捡到的。"}
    ]},
  {node:"prologue-white-lamp",target:"prologue-lamp-incident",type:"conversation",npc:"companion-x",label:"询问白灯",marker:"小X",x:65,y:50,
    actions:[{id:"lamp-incident",label:"询问白灯与供电异常",facts:["prologue-lamp-incident-understood"],text:"【小X】村里有借灯的禁忌，遇见这种灯别轻易回应。\n祠堂忽然断电。小X比外来人更快找到供电问题，随后白灯消失了。\n【小X】去村口问问吧。最近谁见过怪事，为什么还不搬，项目又出了什么问题——先查这些。"}]},
  {node:"village-arrival",target:"village-arrival-observation",type:"exploration",label:"观察村口",
    actions:[
      {id:"village-decline",label:"观察村口环境",marker:"村口",x:25,y:50,facts:["village-decline-observed"],text:"不少屋子已经空了，搬迁和施工的痕迹留在路边。村里的衰败并不只是怪谈留下的结果。"},
      {id:"su-he-notice",label:"查看苏禾寻人启事",marker:"启事",x:75,y:65,facts:["su-he-missing-notice-observed"],text:"路口和墙上贴着苏禾的寻人启事：村小学教师，近期失踪。有人还在寻找她，这不是旧传闻，而是村里正在发生的事。"}
    ]},
  {node:"village-inquiries",target:"village-shopkeeper-inquiry",type:"conversation",npc:"villager-1",label:"询问小卖部老板",marker:"老板",x:20,y:62,
    actions:[{id:"shopkeeper-inquiry",label:"询问小卖部老板",facts:["shopkeeper-inquiry-completed"],text:"【老板】项目进村后一直谈搬迁，走了不少人……B工程师，你以前来过，应该知道。\n认出你后，他的语气冷了下来。\n【老板】白灯也是项目推进后重新多起来的，可我没说一定是公司干的。苏禾反对仓促搬迁，还查过白灯、广播和矿区旧线，后来就失踪了。\n【小X】成年人失踪未必和项目有关。别把每件事都扯到公司。\n老板不再争辩，递来一块手绘地图碎片。"}]},
  {node:"village-inquiries",target:"village-holdout-inquiry",type:"conversation",npc:"villager-2",label:"询问拒签户",marker:"拒签户",x:80,y:63,
    actions:[{id:"holdout-inquiry",label:"询问拒签户",facts:["holdout-inquiry-completed"],text:"【拒签户】房子和祖坟都在这里，十几年前的事故还没说清楚。有些事不是赔钱就能算完的。\n【小X】早搬走就没这么多事了，该赔的不是都赔了？\n对方勃然大怒，谈话被迫中断。你没能继续问清旧事故。临走时，对方给你一块地图碎片。"}]},
  {node:"village-inquiries",target:"village-elder-inquiry",type:"conversation",npc:"villager-3",label:"询问年老村民",marker:"老人",x:50,y:38,
    actions:[{id:"elder-inquiry",label:"询问年老村民",facts:["elder-inquiry-completed"],text:"【老人】陈家那个小女孩最宝贝一颗蓝玻璃珠，掉沟里都要捡回来。\n看见你的一个动作，老人突然叫出“A”，又摇头否认。\n【老人】不对，A早死了。当年说是学校后山山体滑坡，死过孩子，从那以后村里就越来越败了。\n【小X】我们来查最近的怪事，不是翻十几年前的账。\n谈话结束，老人给你一块手绘地图碎片。"}]},
  {node:"old-house-entry",target:"old-house-door",type:"exploration",label:"打开老宅",
    actions:[{id:"old-house-door",label:"用旧钥匙打开宅门",marker:"宅门",x:50,y:30,facts:["old-house-door-opened"],requiredItems:["key-a"],text:"小X交出的旧钥匙转动了门锁。你还不知道他为什么会有这把钥匙。"}]},
  {node:"old-house-investigation",target:"old-house-clues",type:"exploration",label:"核对屋内线索",
    actions:[
      {id:"old-photograph",label:"查看家庭照片",marker:"照片",x:20,y:40,facts:["old-photograph-clue-known"],text:"照片里有A、妹妹和父亲。A当时的面容完整，与如今脸上留有伤痕的你并不相同。"},
      {id:"school-uniform",label:"查看妹妹的校服",marker:"校服",x:28,y:75,facts:["school-uniform-clue-known"],text:"旧校服旁的盒子里留着妹妹拿着同款蓝玻璃珠的照片。你把掌心的珠子与照片对照，确认这种玻璃珠曾是她珍爱的东西。"},
      {id:"height-marks",label:"查看身高刻痕",marker:"刻痕",x:80,y:40,facts:["height-marks-clue-known"],text:"刻痕旁的时间说明：事故发生时，A已经约十七岁，妹妹才是村小学生。"},
      {id:"funeral-list",label:"查看送葬名单",marker:"名单",x:72,y:75,facts:["funeral-list-clue-known"],text:"旧丧葬记录表明，妹妹死于十七年前事故后的那段时间，A也被村里作为死者送葬。老人说“A早死了”，并非毫无依据。"}
    ]},
  {node:"old-house-clue-confrontation",target:"old-house-clue-confrontation",type:"conversation",npc:"companion-x",label:"追问身份矛盾",marker:"小X",x:55,y:55,
    actions:[{id:"identity-conflict",label:"向小X追问线索之间的矛盾",facts:["old-house-identity-conflict-raised"],text:"【你】工作证、玻璃珠、钥匙，还有屋里的东西，为什么会连在一起？\n【小X】别急着给自己找一个名字。我们现在要查的是最近的怪事。\n他再次把话题从你的身份上移开。"}]},
  {node:"old-house-call-at-door",target:"old-house-door-call",type:"conversation",npc:"unknown-caller",label:"听门外的声音",marker:"门外",x:50,y:30,
    actions:[{id:"door-call",label:"听门外呼名",facts:["door-call-incident-completed"],text:"屋外雨声加重，门边传来细微动静。\n【门外的声音】A……\n【小X】别答，离门远一点。\n声音又响了一次，随后消失。它是在叫死去的A、这间屋子的旧主人，还是你？你无法确定。"}]}
]);
export function getSceneLayout(sceneId) {
  return {layoutLabel:sceneNames[sceneId], playerStart:{x:50,y:92}, hotspots:[]};
}
export function sceneName(sceneId) { return sceneNames[sceneId] ?? "探索"; }
export function actionsFor(task) { return task.actions.map(a=>({...a,task})); }
export function taskFor(command) {
  const target=command.payload?.explorationId ?? command.payload?.conversationId;
  return TASKS.find(task=>task.target===target);
}
