// R10 对话展示数据：作为探索板块子包，通过剧情命令和事件合同协作。
export const CONVERSATION_TASKS = Object.freeze([
  {node: "prologue-wake", target: "prologue-briefing", type: "conversation",
    interactionType: "conversation",
    npc: "companion-x", label: "听小周说明来意", marker: "小周", x: 50, y: 40,
    actions: [{id: "surface-briefing", label: "与小周交谈",
      facts: ["surface-investigation-task-known"],
      text: "【？？？】你醒了？先别急着站起来，你昏迷了一段时间，先让身体适应一会。"
        + "\n【你】你是谁？"
        + "\n【小周】我姓周。你可以叫我小周。"
        + "\n【你】......"
        + "\n【小周】哦哦，我是公司新晋的安全联络员，这几天由我跟着你。"
        + "\n【旁白】他望着你笑了笑，你感觉头痛稍微好点了"
        + "\n【你】我为什么会在这里？"
        + "\n【小周】你是公司委托的外聘调查员，我们在调查这个村子的一些怪事，我是来协助你的"
        + "\n【小周】在之前的一次调查中，你说你发现了什么，抛下我冲来祠堂。当我赶到的时候，就发现你昏迷倒在祠堂外面。是我把你挪进来的呀。"
        + "\n【你】我为什么会昏迷？我现在连自己的名字都想不起来了……"
        + "\n【小周】怎么会这样……你的工作证上写着名字。我也是刚刚认识你几天，至于昏迷，我就不太清楚了。"
        + "\n【小周】先办正事吧。石涧村最近老出怪事，公司让我们查清楚。"}]},
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
        text: "【你】我以前是做什么的？"
              + "\n【小周】你以前和现在一样，老爱问东问西。"
              + "\n【你】你刚才说了“以前”，你认识我很久吗？"
              + "\n【小周】……不是你问我的吗？我说的是几天前。"
              + "\n【旁白】你转念一想，也没啥不对的。他把钥匙塞进你手里，说是在你出事地点附近捡到的。"}
    ]},
  {node: "prologue-white-lamp", target: "prologue-lamp-incident", type: "conversation",
    interactionType: "conversation",
    npc: "companion-x", label: "询问白灯", marker: "小周", x: 50, y: 40,
    actions: [{id: "lamp-incident", label: "询问白灯与供电异常",
      facts: ["prologue-lamp-incident-understood"],
      text: "【旁白】你正要走出门外一探究竟，小周眼疾手快，一把将你拦下。"
        + "\n【小周】村里有借灯的禁忌。这种灯亮着的时候，别出门也别应声，否则会有可怕的事情发生"
        + "\n【你】借灯？借谁的灯？这种老迷信的事情你也信吗？"
        + "\n【小周】老一辈的说法，说不定真的有什么古怪呢，你看看那灯，你不觉得心里发毛吗？"
        + "\n【旁白】小周说完，打了一个寒颤。"
        + "\n【旁白】祠堂内忽然断电。眼前除了那盏灯，一片漆黑，小周更用力的抓住了你的手臂。"
        + "\n【小周】你看，这不就出事了吗？"
        + "\n【旁白】话虽这么说，他还是摸黑走到配电箱前，拉开闸，屋内暗黄的灯重新亮起了，雨里什么都没有。"
        + "\n【你】刚刚那么黑，你怎么找到这个电闸的？"
        + "\n【小周】其实你晕过去的那段时间就断过蛮多次电的，每次都是我去拉的电闸呀！"
        + "\n【旁白】小周一脸无奈的看着你"
        + "\n【小周】走吧，去村口。我觉得可以问问最近谁见过怪事、谁不肯搬、项目到底出了什么问题这三个问题"
        + "\n【旁白】你们动身了，你莫名其妙的觉得，这家伙似乎比看上去要可靠。"}]},
        
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
      text: "【拒签户】……你们说什么我也不会搬。至于地图，反正也没什么用了，如果你们是为了调查，那就拿去吧。"
        + "\n【旁白】他把一张褶皱的地图残片给了你，似乎有些不情愿。"
        + "\n【拒签户】房子和祖坟都在这里。十几年前的事故还没说清楚，赔多少钱都算不完。搬迁，哼哼。"
        + "\n【你】事故？什么事故？"
        + "\n【拒签户】你们好意思问我？那年——"
        + "\n【小周】早搬走不就没这么多事了。该赔的不是都赔了？"
        + "\n【旁白】拒签户的脸一下子涨红了。他指着门，让你们滚出去。门在你身后用力的关上。"
        + "\n【你】你刚才为什么插话？我们都快问出来了。"
        + "\n【小周】什么叫快问出来了，他就是纯粹发泄不满，你没看出来？反正地图我们也拿到了，我可没时间听他在这撒气，说一些没用的东西。"
        + "\n【旁白】小周生气的走开了，留你一个人站在原地"
        + "\n【你】……"}]},
  {node: "village-inquiries", target: "village-elder-inquiry", type: "conversation",
    interactionType: "conversation",
    npc: "villager-3", label: "询问年老村民", marker: "老人", x: 50, y: 38,
    actions: [{id: "elder-inquiry", label: "询问年老村民",
      facts: ["elder-inquiry-completed"],
      text: "【旁白】你看到了一个年老的村民，双目浑浊，似乎已经有些神志不清了"
        + "\n【你】老人家，我想问问苏禾——"
        + "\n【老人】……小陈？"
        + "\n【旁白】老人盯着你的手，脸上的表情微微变化，可是眼里更加迷茫了。然后他摇了摇头。"
        + "\n【老人】不对。小陈早死了，和他可爱的陈家妹妹一起……真是可怜啊，还记得那时候……"
        + "\n【独白】这个老头似乎有点糊涂了，看来只能顺着他聊下去"
        + "\n【你】老爷爷，你刚刚说的，就究竟是怎么一回事？"
        + "\n【老人】当初学校后山塌了，压死了好多孩子，可爱的陈家妹妹也奄奄一息，她哥哥小陈半夜求医，好像是雨天路滑，失足跌入山沟，一同死去了……"
        + "\n【老人】也是记不清哪一年了。反正从那以后，村里就一年不如一年。"
        + "\n【旁白】老人流露出痛苦的神情，不知为什么，你有种揪心的刺痛，或许是同情村里人的遭遇吧，你想。"
        + "\n【小周】我们事来查最近的怪事，不是翻十几年前的账的。老头，你有村子的地图吗？"
        + "\n【旁白】老人看了小周一眼，没再说什么"
        + "\n【旁白】临走前，老人给了你一块手绘地图碎片。"
        + "\n【老人】走吧。这地方是留不住人的。"}]},
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
      text: "【旁白】屋外的雨声忽然大了。门板上传来很轻的动静，像是指甲在轻轻的抓门，遥远的传来，却又像是近在咫尺。"
        + "\n【门外的声音】陈晋年……"
        + "\n【小周】别答！离门远一点。"
        + "\n【旁白】声音又响了一次，雨还在下，滴答，滴答，隆隆，隆隆。"
        + "\n【旁白】小周背贴着门站了很久。过了一会儿才开口。"
        + "\n【小周】……山里的老房子，风从门缝里钻进来，什么声都像，看来是我太敏感了。"
        + "\n【独白】他刚才不是说，别答吗。风声，有什么好答的。"}]},
  {node: "x-recovery-confrontation", target: "x-recovery-demand", type: "conversation",
    interactionType: "conversation",
    npc: "companion-x", label: "听小周说明回收要求", marker: "小周", x: 72, y: 55,
    actions: [{id: "x-recovery-demand", label: "与小周对峙",
      facts: ["x-recovery-demand-delivered"],
      text: "【小周】那个……有件事，我要和你坦白一下。"
        + "\n【小周】我陪你回来，不是为了替你找身份的，而是公司需要你重启装置，把散出去的证据收回来。"
        + "\n【你】收回来。"
        + "\n【小周】对。装置现在恢复了，服务器里的东西你也整理齐了。把完整的那一份给我，这趟就算完了。"
        + "\n【你】一路上提醒我别出门，拦着我不让问老人，抢着去看那个票据编号。都是为今天。"
        + "\n【小周】怎么能这么说呢，那个时候我是真的害怕，又是山上，又是坟头，鬼知道会发生些什么"
        + "\n【旁白】说到这里，小周的身体明显缩了缩。"
        + "\n【小周】你放心。证据给我，别的我来处理，你好好休息，养养身体。这一路上，你的经历我都看在眼里，我不仅仅有对你的同情，还有对公司的愤懑，咱们一起检举他们！"}]}
]);

export function conversationTaskFor(command) {
  const target = command.payload?.conversationId;
  return CONVERSATION_TASKS.find((task) => task.target === target);
}
