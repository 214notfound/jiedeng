// R10 对话展示数据：作为探索板块子包，通过剧情命令和事件合同协作。
export const CONVERSATION_TASKS = Object.freeze([
  {node: "prologue-wake", target: "prologue-briefing", type: "conversation",
    interactionType: "conversation",
    npc: "companion-x", label: "听小周说明来意", marker: "小周", x: 50, y: 40,
    actions: [{id: "surface-briefing", label: "与小周交谈",
      facts: ["surface-investigation-task-known"],
      text: "【？？？】你醒了？先别急着站起来，你昏迷了一段时间，先让身体适应一会"
        + "\n【你】你是谁？"
        + "\n【小周】我姓周。你可以叫我小周。"
        + "\n【你】......"
        + "\n【小周】哦哦，我是公司新晋的安全联络员，这几天由我跟着你。"
        + "\n【你】我为什么会在这里？"
        + "\n【小周】你是公司委托的外聘调查员，我们在调查这个村子的一些怪事，我是协助你的"
        + "\n【小周】你之前说你发现了什么，抛下我冲来祠堂，当我赶到的时候，就发现你昏迷倒在祠堂外面。是我把你挪进来的。"
        + "\n【你】我为什么会昏迷？我现在连自己的名字都想不起来了……"
        + "\n【小周】……你的工作证上写着名字。我也是刚刚认识你几天，至于昏迷，我怎么知道。"
        + "\n【小周】先办正事。石涧村最近老出怪事，公司让我们查清楚。"}]},
  {node: "prologue-belongings", target: "prologue-key-and-memory", type: "conversation",
    interactionType: "conversation",
    npc: "companion-x", label: "从小周处接过钥匙", marker: "小周", x: 50, y: 40,
    choicePrompt: {
      lineId: "prologue-key-choice",
      text: "【小周】他把一把钥匙递到你面前，却没有立刻松手。"
    },
    actions: [
      {id: "receive-key", label: "直接接过钥匙", facts: ["key-a-given-by-x"],
        text: "【小周】这是在你出事的地方附近捡的。先拿着，调查时用得上。\n是一把没有任何标记的老钥匙。齿磨得很平，握柄被手汗浸得发亮。"},
      {id: "ask-memory-and-receive-key", alternative: true, label: "先问他一个问题",
        facts: ["key-a-given-by-x"],
        text: "【你】我以前是做什么的？\n【小周】……你以前就是这样，一有事想不通就盯着人问。\n【你】你刚才说了“以前”，你认识我很久吗？\n【小周】……我说的是前几天，你老是这样抓着细节不放，我们和你合作都要提心吊胆的，难怪公司要请你来调查这些破事。\n【小周】不说了，我们该走了。\n他把话题岔开，把钥匙塞进你手里，说是在你出事地点附近捡到的。"}
    ]},
  {node: "prologue-white-lamp", target: "prologue-lamp-incident", type: "conversation",
    interactionType: "conversation",
    npc: "companion-x", label: "询问白灯", marker: "小周", x: 50, y: 40,
    actions: [{id: "lamp-incident", label: "询问白灯与供电异常",
      facts: ["prologue-lamp-incident-understood"],
      text: "【旁白】你正要走出门外一探究竟，小周一把把你拦下。"
        + "\n【小周】村里有借灯的禁忌。这种灯亮着的时候，别出门也别应声，否则会有可怕的事情发生"
        + "\n【你】借灯？借谁的灯？这种老迷信的事情你也信吗？"
        + "\n【小周】老一辈的说法，你问这么多干什么，而且说不定真的有什么古怪呢"
        + "\n【旁白】祠堂忽然断电。黑下来的一瞬间，你听见小周已经动身了。"
        + "\n【旁白】他摸黑走到配电箱前，拉开闸，动作熟得像在自己家。灯灭了。雨里什么都没有。"
        + "\n【你】你以前来过这儿？"
        + "\n【小周】公司在附近还有别的点。这种配电箱我见得多。"
        + "\n【小周】走吧，去村口。最近谁见过怪事、谁不肯搬、项目到底出了什么问题——先查这三样。"}]},
  {node: "village-inquiries", target: "village-shopkeeper-inquiry", type: "conversation",
    interactionType: "conversation",
    npc: "villager-1", label: "询问小卖部老板", marker: "老板", x: 22, y: 50,
    actions: [{id: "shopkeeper-inquiry", label: "询问小卖部老板",
      facts: ["shopkeeper-inquiry-completed"],
      text: "【老板】项目进村后一直谈搬迁，走了不少人……王工程师，你以前来过，应该知道。\n认出你后，他的语气冷了下来。\n【老板】白灯也是项目推进后重新多起来的，可我没说一定是公司干的。苏禾反对仓促搬迁，还查过白灯、广播和矿区旧线，后来就失踪了。\n【小周】成年人失踪未必和项目有关。别把每件事都扯到公司。\n老板不再争辩，递来一块手绘地图碎片。"}]},
  {node: "village-inquiries", target: "village-holdout-inquiry", type: "conversation",
    interactionType: "conversation",
    npc: "villager-2", label: "询问拒签户", marker: "拒签户", x: 78, y: 50,
    actions: [{id: "holdout-inquiry", label: "询问拒签户",
      facts: ["holdout-inquiry-completed"],
      text: "【拒签户】房子和祖坟都在这里，十几年前的事故还没说清楚。有些事不是赔钱就能算完的。\n【小周】早搬走就没这么多事了，该赔的不是都赔了？\n对方勃然大怒，谈话被迫中断。你没能继续问清旧事故。临走时，对方给你一块地图碎片。"}]},
  {node: "village-inquiries", target: "village-elder-inquiry", type: "conversation",
    interactionType: "conversation",
    npc: "villager-3", label: "询问年老村民", marker: "老人", x: 50, y: 38,
    actions: [{id: "elder-inquiry", label: "询问年老村民",
      facts: ["elder-inquiry-completed"],
      text: "【老人】陈家那个小女孩最宝贝一颗蓝玻璃珠，掉沟里都要捡回来。\n看见你的一个动作，老人突然叫出“陈晋年”，又摇头否认。\n【老人】不对，陈晋年早死了。当年说是学校后山山体滑坡，死过孩子，从那以后村里就越来越败了。\n【小周】我们来查最近的怪事，不是翻十几年前的账。\n谈话结束，老人给你一块手绘地图碎片。"}]},
  {node: "old-house-clue-confrontation", target: "old-house-clue-confrontation", type: "conversation",
    interactionType: "conversation",
    npc: "companion-x", label: "追问身份矛盾", marker: "小周", x: 55, y: 55,
    actions: [{id: "identity-conflict", label: "向小周追问线索之间的矛盾",
      facts: ["old-house-identity-conflict-raised"],
      text: "【你】工作证、玻璃珠、钥匙，还有屋里的东西，为什么会连在一起？\n【小周】别急着给自己找一个名字。我们现在要查的是最近的怪事。\n他再次把话题从你的身份上移开。"}]},
  {node: "old-house-call-at-door", target: "old-house-door-call", type: "conversation",
    interactionType: "conversation",
    npc: "unknown-caller", label: "听门外的声音", marker: "门外", x: 50, y: 30,
    actions: [{id: "door-call", label: "听门外呼名",
      facts: ["door-call-incident-completed"],
      text: "屋外雨声加重，门边传来细微动静。\n【门外的声音】陈晋年……\n【小周】别答，离门远一点。\n声音又响了一次，随后消失。它是在叫死去的陈晋年、这间屋子的旧主人，还是你？你无法确定。"}]},
  {node: "x-recovery-confrontation", target: "x-recovery-demand", type: "conversation",
    interactionType: "conversation",
    npc: "companion-x", label: "听小周说明回收要求", marker: "小周", x: 72, y: 55,
    actions: [{id: "x-recovery-demand", label: "与小周对峙",
      facts: ["x-recovery-demand-delivered"],
      text: "【小周】我陪你回来，不是为了替你找回身份。公司需要你重新启动装置，把散落的证据全部找出来。\n【小周】现在装置已经恢复，服务器里的东西也被你整理齐了。把完整证据包交给我，这次调查就到这里。\n【你】所以一路上的保护、提醒和阻拦，都是为了最后回收证据。\n【小周】你可以这么理解。东西交出来，其他事我来处理。"}]}
]);

export function conversationTaskFor(command) {
  const target = command.payload?.conversationId;
  return CONVERSATION_TASKS.find((task) => task.target === target);
}
