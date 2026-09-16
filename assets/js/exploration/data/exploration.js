// R09/R12 探索目标：只描述可调查物体，不包含对白职责。

export const EXPLORATION_TASKS = Object.freeze([
  {
    node: "prologue-belongings", target: "shrine-belongings", type: "exploration",
    interactionType: "item",
    label: "检查随身物品",
    actions: [
      {id: "burned-work-id", label: "查看烧毁的工作证", marker: "证件", x: 25, y: 75,
        facts: ["burned-work-id-investigated"],
        text: "工作证烧得只剩半张。公司标识还在，姓名那一栏露出一个姓：Wang。烧痕的边缘整整齐齐，有些奇怪，头像却是彻底认不出了"},
      {id: "blue-glass-bead", label: "查看蓝玻璃珠", marker: "玻璃珠", x: 75, y: 75,
        facts: ["blue-glass-bead-investigated"],
        text: "一颗磨花的蓝色玻璃珠，是刚刚从你口袋里拿出来的，没有文字，也看不出产地。珠子表面磨得很匀，是长年被人捏在指间来回搓的那种磨法。你的手指碰到它，下意识地收紧了，就好像是……"}
    ]
  },
  {
    node: "village-arrival", target: "village-arrival-observation", type: "exploration",
    interactionType: "item",
    label: "观察村口",
    actions: [
      {id: "village-decline", label: "观察村口环境", marker: "村口", x: 15, y: 30,
        facts: ["village-decline-observed"],
        text: "几间屋子锁着门，窗户用塑料布蒙上，门口的春联褪成了白色，透露着一种诡谲的气氛。"
              + "\n 墙上贴着搬迁告示，落款是两年前，可路边的施工围挡是新的。水泥墩底下还有没干透的漆痕。"
              + "\n【独白】雨越下越大了呢……先探索探索村子吧。"},
      {id: "su-he-notice", label: "查看苏禾寻人启事", marker: "启事", x: 85, y: 30,
        facts: ["su-he-missing-notice-observed"],
        text: "电线杆和墙上贴着同一张启事：苏禾，村小学教师，近期失踪。启事贴了一层又一层。最底下那层被雨泡烂了，最上面那张还是干的。"}
    ]
  },
  {
    node: "old-house-entry", target: "old-house-door", type: "exploration",
    interactionType: "item", label: "打开老宅",
    actions: [
      {id: "old-house-door", label: "用旧钥匙打开宅门", marker: "宅门", x: 50, y: 30,
        facts: ["old-house-door-opened"], requiredItems: ["key-a"],
        text: "钥匙插进去，转得很顺。锁是老锁，钥匙也是把旧钥匙，可锁芯里干干净净，一点锈都没有。"
              + "\n【小周】这种老锁都松。走走走。\n门里有股潮气，混着陈皮的味道。"}
    ]
  },
  {
    node: "old-house-investigation", target: "old-house-clues", type: "exploration",
    interactionType: "item",
    label: "核对屋内线索",
    actions: [
      {id: "old-photograph", label: "查看家庭照片", marker: "照片", x: 21, y: 22,
        facts: ["old-photograph-clue-known"],
        text: "照片上有三个人。父亲站在后面，前面是那个少年和更小的女孩。少年的脸是完整的，一点伤也没有，清秀中透露着一种倔强。玻璃上有反光，你看不清自己的脸。"},
      {id: "school-uniform", label: "查看妹妹的校服", marker: "校服", x: 22, y: 66,
        facts: ["school-uniform-clue-known"],
        text: "一件脏脏的旧校服，虽然有明显的岁月痕迹，但是还能看出曾经是被珍爱的衣服。旁边有个铁盒，盒里压着一张照片：小女孩举着一颗蓝玻璃珠，对着镜头灿烂的笑。你把掌心的珠子放到照片旁边。一样的颜色，一样的大小。"},
      {id: "height-marks", label: "查看身高刻痕", marker: "刻痕", x: 84, y: 30,
        facts: ["height-marks-clue-known"],
        text: "门框上刻着一道一道的横线，旁边写着年份，有几道还写着名字。最高的那一道写着“陈晋年”，年份停在一个地方，再往上就没了。下面还有半道更矮的，名字刻到一半，笔画歪了。"},
      {id: "funeral-list", label: "查看送葬名单", marker: "名单", x: 86, y: 78,
        facts: ["funeral-list-clue-known"],
        text: "一张手写的丧葬记录，纸已经发脆，边角被虫蛀了。上面有两行是后补的，墨色比别的深。一行是妹妹的名字，另一行是陈晋年。两行写的是同一年。落款处有一个签名，笔画很重，把纸都压出了印子。"}
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
      {type: "system", text: "这就是当年陈晋年掉下来摔死的地方吗……"},
      {type: "narration", text: "送葬的路线和当年的搜救路线，在山腰那条旧运输道上重合了。"},
      {type: "narration", text: "坍方的边缘还留着下过沟的痕。浅沟和深排水洞，通向两个不同的落点。"},
      {type: "narration", text: "【你】为什么会有两个不同的落点？难道说……"},
      {type: "narration", text: "你快步走向兄妹的坟头，仔细听着雨声敲落的声音……"},
      {type: "narration", text: "【你】两座坟挨着，但是只有妹妹那座是实葬，这说明陈晋年不在这里。难道说，兄妹俩没有停在同一个地方，哥哥没有死！"},
      {type: "system", text: "原来即使一个人没有尸体，也可以被下葬吗……"},
      {type: "narration", text: "你们走入旁边的管理房。"},
      {type: "narration", text: "管理房的夹层里夹着几页纸。原来当年，陈晋年带着妹妹掉下山沟之后，展开了全方位的搜救。但是搜救在第三日停了，签字的正是那位父亲。最终陈晋年没找到"},
      {type: "system", text: "……亲手签字，停止找自己的孩子，甚至为他下葬了空坟，为什么？"},
      {type: "narration", text: "同一页的角上，抄着一个编号。是邻镇一家诊所的票据。"},
      {type: "narration", text: "小周凑过来看了一眼那个编号，脸色变了，催你赶紧下山。"}
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
      {type: "narration", text: "村委旧楼的门禁记录还在。翻到某一页，编号和一张旧工作证对得上：王阙。"},
      {type: "narration", text: "楼上的旧电脑还能开机。桌面上有一个表格，叫“恐吓执行表”。"},
      {type: "narration", text: "表格里是日期、白灯、广播、封井。一栏一栏，有人填过，有人打过勾。"},
      {type: "system", text: "白灯和广播……这些都是照着表做出来的。"},
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
      {type: "narration", text: "废弃小学的教室里还留着苏禾的东西。黑板上画着一张图。"},
      {type: "narration", text: "广播、电路、排水，三样东西画在一张图上，中间用虚线连着。"},
      {type: "system", text: "她也在把这几件事放在一起看。"},
      {type: "narration", text: "抽屉里有一张矿图，折了又折。还有几张照片，拍的是封井用的材料。"},
      {type: "narration", text: "桌上的手机没电了。机身背面贴着一张课程表，写着她的名字。"},
      {type: "system", text: "她查到的地方，和现在我站的地方，差不多远了。"},
      {type: "system", text: "……她后来去了哪儿呢。"}
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
      {type: "narration", text: "邮电所早就空了。柜台上落着一层灰，灰上有一沓东西。"},
      {type: "narration", text: "几张剪成灯形的纸，边角剪得很齐。一份投递单。还有一盘磁带。"},
      {type: "narration", text: "投递单上的日期，全都在苏禾失踪之后。"},
      {type: "narration", text: "录音机还能转。磁带里是一个变过声的人声，说了三遍同一句话。"},
      {type: "narration", text: "【录音】“我是……白灯客，我要举报……”"},
      {type: "narration", text: "举报的草稿写了三遍，改了三遍。每一遍都在骂这个项目。"},
      {type: "system", text: "项目，公司，王阙——"},
      {type: "system", text: "……不对。王阙一次都没有出现。"},
      {type: "narration", text: "草稿的最后一行被划掉了。划得很用力，把纸划破了。"}
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
      {type: "narration", text: "墙上钉着系统图纸。操作台边上一圈磨得发白，比别处深。"},
      {type: "narration", text: "调试日志里，同一个人的操作顺序重复了两年。这一串顺序，你刚才也做过。"},
      {type: "narration", text: "屏幕上还留着一段脸部的停帧。伤疤在左边，从眉骨一直拉到下颌。"},
      {type: "narration", text: "你抬起手，摸了摸自己的左脸。位置一样，长度也一样。"},
      {type: "narration", text: "会议摘要里，恐吓方案的提出人写着一个名字：王阙。"},
      {type: "narration", text: "版本记录一条一条往下排。中间有一条写着：首次执行后，村里一名老人从台阶上跌了下去。"},
      {type: "narration", text: "下一条的更新日期，在他死后第四天。"},
      {type: "narration", text: "【你】……"}
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
      {type: "narration", text: "诊所的账簿还在。有一页记着一笔没收钱的账，日期接着空坟那一年。"},
      {type: "narration", text: "夹在账簿里的是一张伤情图。左脸，从眉骨到下颌，烧痕，缝了三十几针。边角上写着一个名字：陈晋年。"},
      {type: "narration", text: "名字上有过一道涂改，底下压着另一个名字。"},
      {type: "system", text: "……王阙。"},
      {type: "narration", text: "户籍底册上那一栏也是改过的，改动日期在事故之后的第三个月。"},
      {type: "system", text: "所以坟是空的。因为他没有死，只是换了张脸，换了个名字。"},
      {type: "narration", text: "底下还压着一页离院登记。伤后第七天，陈晋年自己签的字，把妹妹带出了诊所。"},
      {type: "narration", text: "签字栏里，“与患者关系”那一格写着两个字：兄长。"}
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
      {type: "narration", text: "父亲旧屋的地板下面还有一层，得挪开柜子才看得见。"},
      {type: "narration", text: "暗层里堆着最原始的那几张矿图和爆破日志。用药量、爆破时间、报批时间，三样对不上。"},
      {type: "narration", text: "旁边压着一份事故报告，抄的是改过之后的那一版。"},
      {type: "narration", text: "再下面是一个牛皮纸袋。里面有一份医疗费协议，签字的日期在事故之后第九天。"},
      {type: "narration", text: "袋底还有一封信，写好了没有寄。信里有一句，“是他们逼我的”。"},
      {type: "system", text: "一开始，他是被逼的。"},
      {type: "narration", text: "同一只袋子底下，还压着一份物证清单。交件那一栏，签的还是父亲。"},
      {type: "narration", text: "日期在那封没寄出去的信之后。"},
      {type: "system", text: "后来……他自己动了手。"},
      {type: "narration", text: "股权沿革和收购目录把旧矿业公司和现在的集团接在了一起。矿权、档案、人，一起转的。"},
      {type: "narration", text: "最底下是一份风险谈话记录。谈话对象写着王阙，日期在他接任之前。"},
      {type: "narration", text: "记录里有一行：受访者表示，只知该井曾封闭，不清楚封闭原因。"},
      {type: "system", text: "他接手的时候，还不知道井底下是什么。"}
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
      {type: "narration", text: "藏点在一间上锁的杂物间里，门后是一台老式的加密终端。"},
      {type: "narration", text: "终端里还留着原文件。错字、换行的习惯，和别处那几版一模一样。"},
      {type: "narration", text: "【你】难道说，写字的人，和坐在操作台前的人，是同一个人？陈晋年。王阙。白灯客。三个名字，三段时间，一种笔迹"},
      {type: "narration", text: "回收站是空的，清得很干净。可日志还在。你凑近点开"},
      {type: "narration", text: "日志上被删掉的是三条：恐吓、封井、苏禾。删的日期是同一晚，删完还做了一次覆写。"},
      {type: "system", text: "留下的那一半，正好是没有他的那一半。"},
      {type: "narration", text: "未发送的草稿里夹着一组坐标。是矿井的排水洞，旁边注了一行小字：从这里可以绕过封墙。"}
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
      {type: "narration", text: "文件袋里的录音笔还能转。按下播放。"},
      {type: "narration", text: "【苏禾】你现在叫什么，你不是晋年了吗"},
      {type: "narration", text: "【过去的你】我叫王阙，我再也不想和抛弃自己的老爸有任何关系了，我叫王阙，和我妈妈一个姓，现在是，以后也是"},
      {type: "narration", text: "【苏禾】那你为什么要做这些事，加害无辜之人，强制搬迁村里曾经你的长辈，同龄人，你这么做，比你父亲恶毒多少倍？"},
      {type: "narration", text: "【苏禾】我知道你们想要我手里的证据，我也知道，周队长就在赶来的路上，我今天来，本来就是抱着必死的决心。"},
      {type: "narration", text: "【苏禾】我想来，因为我要当面看着你，当面质问你，为什么"},
      {type: "narration", text: "背景传来嘈杂的脚步声，似乎某些人正在飞速赶来，你没有说话"},
      {type: "narration", text: "【苏禾】我相信你还是你，那些证据就在你心中，即使你不愿意承认，就像你不愿意承认你是晋年这件事一样，你忘却不了的"},
      {type: "narration", text: "紧接着是嘈杂的人声，混乱中，一声闷响，和一段很长的、往下坠的声音。"},
      {type: "narration", text: "再往后，是小周的声音。他喊的是“人掉下去了”。"},
      {type: "narration", text: "录音的后半段，旁边有人问了一句：人还活着。救不救。"},
      {type: "narration", text: "苏禾的声音像是从遥远的天边传来，断断续续的，喊着“晋年”，“晋年”……"},
      {type: "narration", text: "隔了几秒，你回答，走吧，证据已经被销毁了。"},
      {type: "system", text: "说话的那个人，是我。"},
      {type: "narration", text: "文件袋底下还压着几张纸。是封井的调度单。"},
      {type: "narration", text: "调用封井小队的申请时间，比人掉下去的时间还要早。"},
      {type: "system", text: "人还没掉下去，封井队就叫好了。"},
      {type: "narration", text: "再往后是手机的取卡记录、一份安保调度表，和一张集团服务器的索引。"},
      {type: "narration", text: "索引上，这一条被归进了“项目现场清理”。"},
      {type: "system", text: "有人在上面替他把这件事收了尾。"}
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
      {type: "narration", text: "旧矿难的原始报告，收购时用的胁迫记录，恐吓方案的每一个版本。"},
      {type: "narration", text: "封井的安保调度，还有一份叫“记忆诱导”的计划书。"},
      {type: "system", text: "记忆诱导……难怪我想不起来，是我以白灯客的名义举报公司，被发现了而已"},
      {type: "narration", text: "计划书的执行记录里，最近的几条，日期就在上周。"},
      {type: "system", text: "所以我什么都想不起来——不是撞坏了头。"},
      {type: "narration", text: "这些记录一份一份都在。指向集团，指向父亲，指向小周，也指向王阙。"}
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
      blocks: blocks.map((entry, index) => {
        const explicit = entry !== null && typeof entry === "object";
        return {
          id: `${target}-${index + 1}`,
          type: explicit ? entry.type : (index === blocks.length - 1 ? "system" : "narration"),
          text: explicit ? entry.text : entry
        };
      }),
      text: blocks.map((entry) => (entry !== null && typeof entry === "object" ? entry.text : entry)).join("\n")
    }]
  };
}

export function explorationTaskFor(command) {
  const target = command.payload?.explorationId;
  return EXPLORATION_TASKS.find((task) => task.target === target);
}
