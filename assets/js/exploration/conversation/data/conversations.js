// R10 对话展示数据：作为探索板块子包，通过剧情命令和事件合同协作。
export const CONVERSATION_TASKS = Object.freeze([
  {node: "prologue-wake", target: "prologue-briefing", type: "conversation",
    npc: "companion-x", label: "听小X说明来意", marker: "小X", x: 22, y: 55,
    actions: [{id: "surface-briefing", label: "与小X交谈",
      facts: ["surface-investigation-task-known"],
      text: "【小X】我是公司的安全联络员。你最近的记忆出了问题，先别急着勉强自己。石涧村最近不断出现白灯、夜间广播和脚印，公司希望查清是谁在借项目制造混乱。我们先从这些怪事查起。"}]},
  {node: "prologue-belongings", target: "prologue-key-and-memory", type: "conversation",
    npc: "companion-x", label: "从小X处接过钥匙", marker: "小X", x: 50, y: 40,
    actions: [
      {id: "receive-key", label: "接过小X递来的旧钥匙", facts: ["key-a-given-by-x"],
        text: "【小X】这是在你出事地点附近捡到的。先拿着，调查时可能用得上。\n他递来一把没有标记的老钥匙。你还不知道它能打开什么。"},
      {id: "ask-memory-and-receive-key", alternative: true, label: "追问过去，再接过钥匙",
        facts: ["key-a-given-by-x", "x-deflects-memory-question-noticed"],
        text: "【你】我以前是做什么的？\n【小X】先别硬想，能查东西就够了。眼下要查的是村里的异常。\n他把话题岔开，随后递来一把没有标记的老钥匙，说是在你出事地点附近捡到的。"}
    ]},
  {node: "prologue-white-lamp", target: "prologue-lamp-incident", type: "conversation",
    npc: "companion-x", label: "询问白灯", marker: "小X", x: 65, y: 50,
    actions: [{id: "lamp-incident", label: "询问白灯与供电异常",
      facts: ["prologue-lamp-incident-understood"],
      text: "【小X】村里有借灯的禁忌，遇见这种灯别轻易回应。\n祠堂忽然断电。小X比外来人更快找到供电问题，随后白灯消失了。\n【小X】去村口问问吧。最近谁见过怪事，为什么还不搬，项目又出了什么问题——先查这些。"}]},
  {node: "village-inquiries", target: "village-shopkeeper-inquiry", type: "conversation",
    npc: "villager-1", label: "询问小卖部老板", marker: "老板", x: 20, y: 62,
    actions: [{id: "shopkeeper-inquiry", label: "询问小卖部老板",
      facts: ["shopkeeper-inquiry-completed"],
      text: "【老板】项目进村后一直谈搬迁，走了不少人……B工程师，你以前来过，应该知道。\n认出你后，他的语气冷了下来。\n【老板】白灯也是项目推进后重新多起来的，可我没说一定是公司干的。苏禾反对仓促搬迁，还查过白灯、广播和矿区旧线，后来就失踪了。\n【小X】成年人失踪未必和项目有关。别把每件事都扯到公司。\n老板不再争辩，递来一块手绘地图碎片。"}]},
  {node: "village-inquiries", target: "village-holdout-inquiry", type: "conversation",
    npc: "villager-2", label: "询问拒签户", marker: "拒签户", x: 80, y: 63,
    actions: [{id: "holdout-inquiry", label: "询问拒签户",
      facts: ["holdout-inquiry-completed"],
      text: "【拒签户】房子和祖坟都在这里，十几年前的事故还没说清楚。有些事不是赔钱就能算完的。\n【小X】早搬走就没这么多事了，该赔的不是都赔了？\n对方勃然大怒，谈话被迫中断。你没能继续问清旧事故。临走时，对方给你一块地图碎片。"}]},
  {node: "village-inquiries", target: "village-elder-inquiry", type: "conversation",
    npc: "villager-3", label: "询问年老村民", marker: "老人", x: 50, y: 38,
    actions: [{id: "elder-inquiry", label: "询问年老村民",
      facts: ["elder-inquiry-completed"],
      text: "【老人】陈家那个小女孩最宝贝一颗蓝玻璃珠，掉沟里都要捡回来。\n看见你的一个动作，老人突然叫出“A”，又摇头否认。\n【老人】不对，A早死了。当年说是学校后山山体滑坡，死过孩子，从那以后村里就越来越败了。\n【小X】我们来查最近的怪事，不是翻十几年前的账。\n谈话结束，老人给你一块手绘地图碎片。"}]},
  {node: "old-house-clue-confrontation", target: "old-house-clue-confrontation", type: "conversation",
    npc: "companion-x", label: "追问身份矛盾", marker: "小X", x: 55, y: 55,
    actions: [{id: "identity-conflict", label: "向小X追问线索之间的矛盾",
      facts: ["old-house-identity-conflict-raised"],
      text: "【你】工作证、玻璃珠、钥匙，还有屋里的东西，为什么会连在一起？\n【小X】别急着给自己找一个名字。我们现在要查的是最近的怪事。\n他再次把话题从你的身份上移开。"}]},
  {node: "old-house-call-at-door", target: "old-house-door-call", type: "conversation",
    npc: "unknown-caller", label: "听门外的声音", marker: "门外", x: 50, y: 30,
    actions: [{id: "door-call", label: "听门外呼名",
      facts: ["door-call-incident-completed"],
      text: "屋外雨声加重，门边传来细微动静。\n【门外的声音】A……\n【小X】别答，离门远一点。\n声音又响了一次，随后消失。它是在叫死去的A、这间屋子的旧主人，还是你？你无法确定。"}]}
]);

export function conversationTaskFor(command) {
  const target = command.payload?.conversationId;
  return CONVERSATION_TASKS.find((task) => task.target === target);
}
