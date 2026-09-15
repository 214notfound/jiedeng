<!-- 本文件在 V1 已实现剧情的基础上，定义《借灯》从老宅之后到五个结局的 V3 完整 Node 推进。 -->

# 《借灯》V3 剧情 Node 推进

- **版本：** V3.0 剧情实现稿
- **剧情来源：** `docs/《借灯》完整故事大纲.md`
- **现状依据：** `assets/js/game-line/data/` 下 V1 正式数据
- **结构依据：** `docs/game-line/剧情Node推进.md`、`docs/game-line/剧情模块接口约定.md`
- **范围：** 从现有 V1 开场一直推进到苏禾之死、小周对峙与最终证据处置

人物显示名固定为陈晋年、王阙、小周；运行时继续使用 `companion-x`、`key-a`、`burned-work-id` 等已发布技术 ID。开场工作证只显示王姓，村民只称“王工程师”；完整姓名王阙到 `b-designer-revealed` 才确认。

## 1. 先固定的理解

V3 的主线不是“猜中三个名字是同一人”，而是让玩家逐层承认同一个人做过的事：

1. 所谓“借灯”可以被人为制造。
2. 主角是设计恐吓系统的 王阙。
3. 王阙就是十七年前失踪的 陈晋年。
4. 白灯客也是主角，且他的举报有意删掉了自己的责任。
5. 小周把苏禾推入井中后，王阙明知她还活着，仍亲口选择不报警、不施救。

前四层是为第五层服务的。终局真正的问题不是“我是谁”，而是“我还要删掉哪一部分真相”。

## 2. 设计前提与取舍

### 2.1 以已实现 V1 为准

大纲的“三件随身物品”与当前代码不一致。V3 沿用已实现版本：主角开场随身只有烧毁工作证和蓝玻璃珠，无标记老钥匙由小周后续交付。“不要急着认领任何名字”的警告录音改到白灯客线的变声录音中，不追加为开场物品。

### 2.2 不把未决 TODO 偷偷当成定案

以下内容在大纲中仍未定，V3 Node 只保留剧情接口，不自行填死：

- 主要人物显示名固定为陈晋年、王阙、小周与苏禾。
- “借灯”民俗的具体地域源流。
- 苏禾失踪后公司伪造的完整社会说辞。V3 只要求玩家找到“手机轨迹被人为伪造”的证据，具体伪造地点留给剧本定稿。
- 恐吓装置的工程参数。V3 只固定每种装置必须有可见的供电边界、触发条件和可利用缺陷。

### 2.3 固定的责任边界

- 王阙回村时知道自己在制造恐吓、秘密封井，但不知废井与十七年前矿难相连。
- 苏禾在矿井对峙时才把旧公司、现集团、父亲证言和事故矿井连起来。
- 小周推人是未经请示的个人越权行为；集团随后掩盖、提前封井，因此成为共同责任者。
- 王阙没有下“推人”的命令，但他对活着的苏禾作出了不施救的选择，并默许封井。终局不得用“都是小周做的”替 王阙脱责。
- 白灯客是 王阙在苏禾死后主动建立的责任隔离身份，不做“精神分裂症”诊断，也不把疾病当作免责理由。

## 3. 当前代码基线

| 项目 | 当前实现 | V3 处理 |
| --- | --- | --- |
| 阶段 | `prologue` → `village` → `old-house` | 保留原三阶段，后续新增 `outer-investigation`、`identity-reconstruction`、`mine-return`、`finale` |
| 运行时 Node | 共 11 个，从 `prologue-wake` 到 `week-one-end` | 前 10 个不改语义；`week-one-end` 改为 V1/V3 过渡检查点 |
| 终点 | `week-one-end` 为 `terminal: true` | V3 中改为非终局，真正终点为五个 ending Node |
| 并行内容 | `village-inquiries` 在一个 Node 中发出三个对话 handoff | 首轮四条支线仍用单 Node 多 handoff，避免循环枢纽损害恢复性 |
| 分支 | 引擎支持 `choice` + `CHOICE_MADE` + 事实条件转移 | 用于交证据、拒绝交付和最终三种证据处置 |
| 小游戏结果 | 接口只认 `MAP_PUZZLE_COMPLETED` | 终局追逐/对峙需先扩展小游戏结果契约，见第 9 节 |

## 4. V3 完整推进图

```text
祀堂 → 村口 → 陈家老宅
                   ↓
       首轮四线并行调查
       陈晋年线二 / 王阙线一 / 苏禾线 / 白灯客线一
                   ↓
               第一次汇合：拆鬼
                   ↓
       王阙是设计者 → 陈晋年幸存并成为王阙
                   ↓
          父亲与集团责任链
                   ↓
       白灯客就是王阙，且举报有删节
                   ↓
      第二次汇合：绕过封墙重返矿井
                   ↓
        苏禾之死 → 集团服务器互证
                   ↓
             小周回收证据
              ┌───┴───┐
          交出证据       拒绝交出
              ↓              ↓
       《共犯的终点》   追逐/对峙
                             ┌─┴─┐
                           失败   逃离
                            ↓      ↓
                       《封井之人》  证据处置
                                  ┌──┼──┐
                                销毁 选择公开 完整公开
```

## 5. V3 运行时 Node 总表

P00—O09 的内容拍点沿用 `剧情Node推进.md`；下表给出实际存档和实现应使用的稳定 Node ID。

| 顺序 | 运行时 Node | 内容拍点 | 阶段 | 主要交接 | 默认下一 Node |
| --- | --- | --- | --- | --- | --- |
| 1 | `prologue-wake` | P00—P01 | `prologue` | 对话 | `prologue-belongings` |
| 2 | `prologue-belongings` | P02—P05 | `prologue` | 探索、对话 | `prologue-white-lamp` |
| 3 | `prologue-white-lamp` | P06—P08 | `prologue` | 对话 | `village-arrival` |
| 4 | `village-arrival` | V00—V01 | `village` | 探索 | `village-inquiries` |
| 5 | `village-inquiries` | V02—V12 | `village` | 三场并行对话 | `village-map-and-route` |
| 6 | `village-map-and-route` | V13—V14 | `village` | 地图小游戏 | `old-house-entry` |
| 7 | `old-house-entry` | O00 | `old-house` | 探索 | `old-house-investigation` |
| 8 | `old-house-investigation` | O01—O04 | `old-house` | 探索 | `old-house-clue-confrontation` |
| 9 | `old-house-clue-confrontation` | O05 | `old-house` | 对话 | `old-house-call-at-door` |
| 10 | `old-house-call-at-door` | O06—O08 | `old-house` | 对话 | `week-one-end` |
| 11 | `week-one-end` | O09 | `old-house` | 剧情确认 | `outer-lines-investigation` |
| 12 | `outer-lines-investigation` | G00—G05、R00—R05、S00—S05、W00—W04 | `outer-investigation` | 四组并行探索 | `haunting-system-dismantled` |
| 13 | `haunting-system-dismantled` | D00—D06 | `outer-investigation` | 探索/解谜 | `b-designer-revealed` |
| 14 | `b-designer-revealed` | B20—B26 | `identity-reconstruction` | 探索 | `a-survival-revealed` |
| 15 | `a-survival-revealed` | A20—A27 | `identity-reconstruction` | 探索 | `father-company-truth` |
| 16 | `father-company-truth` | F00—F09 | `identity-reconstruction` | 探索、对话 | `white-lamp-identity-revealed` |
| 17 | `white-lamp-identity-revealed` | W20—W27 | `identity-reconstruction` | 解密/探索 | `mine-route-restored` |
| 18 | `mine-route-restored` | M00—M05 | `mine-return` | 路线解谜、探索 | `su-he-death-reconstructed` |
| 19 | `su-he-death-reconstructed` | M06—M16 | `mine-return` | 探索、录音剧情 | `server-evidence-recovered` |
| 20 | `server-evidence-recovered` | T00—T06 | `finale` | 数据机房探索 | `x-recovery-confrontation` |
| 21 | `x-recovery-confrontation` | T07—T11 | `finale` | 对话、选择 | 条件分支 |
| 22 | `x-showdown` | T12—T15 | `finale` | 追逐/对峙小游戏 | 条件分支 |
| 23 | `evidence-disposition` | T16—T20 | `finale` | 三选一证据操作 | 条件分支 |
| 24 | `ending-accomplice` | EA00—EA03 | `finale` | 无 | 终局 |
| 25 | `ending-defeated` | EB00—EB03 | `finale` | 无 | 终局 |
| 26 | `ending-erasure` | EC00—EC04 | `finale` | 无 | 终局 |
| 27 | `ending-curated-truth` | ED00—ED05 | `finale` | 无 | 终局 |
| 28 | `ending-full-account` | EE00—EE06 | `finale` | 无 | 终局 |

V3 共 28 个运行时 Node，其中 10 个原样保留、1 个修订语义、17 个新增。五个 ending Node 都是 `terminal: true`且无后继 Node；`storyData.endNodeId` 建议指向完整公开的 `ending-full-account`，其余四个仍是合法终局，不得因为不是指定 `endNodeId` 而继续推进。

阶段收束点固定为：`prologue-white-lamp`、`village-map-and-route`、`week-one-end`、`haunting-system-dismantled`、`white-lamp-identity-revealed`、`su-he-death-reconstructed`；五个 ending Node 分别完成 `finale`。其余 Node 不得误发 `STORY_STAGE_COMPLETED`。

### 5.1 新增 Node 的运行时门槛

下表中的 fact ID 是 V3 实现时应登记的稳定 ID。“完成事实”必须先由有权模块正式提交，Node 才能转移。

| Node | 进入需要的关键事实 | 完成事实/条件 | 转移规则 |
| --- | --- | --- | --- |
| `week-one-end` rev.2 | `door-call-incident-completed` | `week-one-end-acknowledged` | 默认到 `outer-lines-investigation` |
| `outer-lines-investigation` | `week-one-end-acknowledged` | `a-gorge-thread-complete`、`project-record-thread-complete`、`su-thread-complete`、`white-lamp-first-thread-complete` 全部成立 | 默认到 `haunting-system-dismantled` |
| `haunting-system-dismantled` | 首轮四线全部完成 | `haunting-is-engineered` | 默认到 `b-designer-revealed` |
| `b-designer-revealed` | `haunting-is-engineered` | `protagonist-is-b-known`、`intimidation-plan-authorship` | 默认到 `a-survival-revealed` |
| `a-survival-revealed` | `protagonist-is-b-known` | `a-b-identity-chain-complete`、`a-left-clinic-with-sister-known` | 默认到 `father-company-truth` |
| `father-company-truth` | `a-b-identity-chain-complete` | `old-accident-coverup-proven`、`father-full-role-known`、`company-succession-chain`、`b-prior-mine-ignorance-established` | 默认到 `white-lamp-identity-revealed` |
| `white-lamp-identity-revealed` | 父亲与集团四个完成事实全部成立 | `three-identities-merged`、`white-lamp-self-exculpation-known`、`mine-bypass-coordinate-known` | 默认到 `mine-route-restored` |
| `mine-route-restored` | 三个白灯客线完成事实全部成立 | `sealed-mine-bypassed` | 默认到 `su-he-death-reconstructed` |
| `su-he-death-reconstructed` | `sealed-mine-bypassed` | `x-pushed-su-known`、`b-refused-rescue-recorded`、`night-sealing-coverup-proven`、`su-death-chain-complete` | 默认到 `server-evidence-recovered` |
| `server-evidence-recovered` | 苏禾之死四个完成事实全部成立 | `full-evidence-package-ready` | 默认到 `x-recovery-confrontation` |
| `x-recovery-confrontation` | `full-evidence-package-ready` | `evidence-handed-to-x` 或 `x-handover-refused`，且两者互斥 | 交出 → `ending-accomplice`；拒绝 → `x-showdown` |
| `x-showdown` | `x-handover-refused` | `x-showdown-lost` 或 `x-showdown-survived`，且两者互斥 | 失败 → `ending-defeated`；生还 → `evidence-disposition` |
| `evidence-disposition` | `x-showdown-survived` | `all-evidence-destroyed`、`curated-evidence-published`、`full-evidence-published` 三选一 | 分别转入三个对应结局 |
| 五个 ending Node | 对应的单一结局事实 | 玩家确认该结局的 acknowledgement 事实 | 全部 `terminal: true`、`transitions: []`，各自返回稳定 `endingId` |

## 6. 后半程详细 Node 表

### 6.1 首轮四线并行调查：`outer-lines-investigation`

四组 handoff 同时开放，顺序不限。它们只交付中间证据，不能提前完成身份合并。

| 拍点 | 地点与玩家行动 | 当场获得的信息/物证 | 玩家此时只能得出的结论 | 进度作用 |
| --- | --- | --- | --- | --- |
| G00 | 根据老宅送葬记录走向山腰旧运输道 | 旧送葬路线、坍方边缘 | 陈晋年的葬礼与当年搜救路线重合 | 开启 陈晋年线二 |
| G01 | 检查浅沟和被灌木遮住的深处排水洞 | 兄妹朝不同深度滚落的地形痕迹 | “两人同处一个落点”的传言不可靠 | 修正坠沟现场 |
| G02 | 检查妹妹实葬坟和 陈晋年衣冠冢 | 空棺记录、旧衣物 | 陈晋年被当作死者，但坟中没有遗体 | 破坏“立坟等于死亡” |
| G03 | 查阅墓地管理夹层 | 搜救终止摘要、邻镇诊所票据编号 | 妹妹次日被找到；陈晋年搜救持续三日后被父亲签字终止 | 留下 陈晋年可能生还的唯一出口 |
| G04 | 小周把“父亲放弃儿子”当成定论，催促离开 | 小周对票据编号表现出过度关注 | 他想知道主角能否沿编号追下去 | 累积小周可疑证据 |
| G05 | 完成该线归档 | `empty-grave-record`、`clinic-ticket-number`、`search-termination-summary` | 陈晋年的死亡只是村庄结论 | 完成 `a-gorge-thread-complete` |
| R00 | 用烧毁工作证的残留权限进入村委旧楼/临时项目部 | 门禁中对 王阙权限的识别 | 主角手里的证件曾有项目高权限 | 开启 王阙线一 |
| R01 | 恢复档案室旧电脑 | 拆迁名单、谈判日志 | 王阙是土地协调负责人，不是外聘逻辑分析师 | 推翻小周的开场说辞 |
| R02 | 查看内部执行表 | `intimidation-execution-sheet` | 白灯、广播、湿脚印都在公司执行任务中 | 证明怪事有人为层 |
| R03 | 查看秘密封井任务单 | `sealed-well-task-order` | 王阙接下了未登记废井的“安全处置” | 建立封井责任，暂不证明 王阙知道旧矿难 |
| R04 | 查看被遮去姓名和正脸的背景调查 | 同籍贯、年龄、户籍变更时间 | 集团掌握 王阙的某个故乡身份秘密 | 为 陈晋年=王阙做延迟提示 |
| R05 | 完成该线归档 | `project-b-role-known`、`intimidation-operation-known`、`secret-sealing-order-known` | 王阙是项目执行者，但现在还不能确认主角就是 王阙 | 完成 `project-record-thread-complete` |
| S00 | 进入废弃小学，根据苏禾寻人启事上的笔迹寻找她的留言 | 教案边缘的线路标记 | 苏禾在失踪前独自调查过怪事 | 开启苏禾线 |
| S01 | 沿广播线、电线和排水设施复核 | `su-circuit-notes` | 苏禾已经找到三类装置的共同物理网络 | 建立她先于白灯客的独立调查 |
| S02 | 打开旧矿图复印件藏点 | `original-mine-map-copy`、`father-testimony-index` | 父辈证言与未登记废井相关，原件不在此处 | 给出后续暗层索引 |
| S03 | 查看苏禾拍下的封井材料 | `sealing-material-photo` | 公司在她失踪前已准备立即封井 | 解释她为何匆忙约 王阙进矿 |
| S04 | 对比苏禾失踪时间和手机移动记录 | `su-phone-route-anomaly` | “自行离村”的轨迹与她最后的调查相冲突 | 补上失踪后社会说辞的疑点 |
| S05 | 完成该线归档 | `su-independent-investigation-known` | 苏禾不是白灯客的合作者，她的调查时间更早 | 完成 `su-thread-complete` |
| W00 | 从拒签户处收集带灯形印记的条款提醒 | `lamp-mark-letters` | 白灯客曾帮助村民规避不利条款 | 开启白灯客线一 |
| W01 | 在废弃邮电所核对最早投递日期 | `white-lamp-first-delivery-date` | 所有白灯客材料都晚于苏禾失踪 | 排除两人长期合作的错误解释 |
| W02 | 播放一段变声警告 | `white-lamp-voice-recording` | 警告只说“不要急着认领任何名字”，不直说三身份 | 代替大纲中未实现的开场录音带 |
| W03 | 查看匿名举报草稿 | `anonymous-report-draft` | 草稿能攻击集团，但每到 王阙的执行记录就中断 | 先呈现“有帮助”，再埋下“有删节” |
| W04 | 完成该线归档 | `white-lamp-post-su-timeline-known`、`anonymous-report-gap-noticed` | 白灯客了解集团内部，但似乎在保护 王阙 | 完成 `white-lamp-first-thread-complete` |

**Node 完成条件：** 四个 thread completion 事实全部成立。单条线中线索可以任意顺序点查，但每条线的 completion 事实只能在表内信息全部传达后由对应外部模块提交。

### 6.2 第一次汇合：`haunting-system-dismantled`

| 拍点 | 内容 | 玩家当前获得的认知 | 进度作用 |
| --- | --- | --- | --- |
| D00 | 用苏禾线路笔记进入小学广播室 | 童谣由定时器和旧扬声器播放 | 拆解广播异象 |
| D01 | 在旧电房取得时控回路和灯具送电记录 | 白灯有明确供电时段，离开支线范围就会熄灭 | 拆解白灯异象 |
| D02 | 检查排水线槽中的导流片和鞋底模 | 湿脚印依赖雨水和预设路面，无水或离开线槽就无法出现 | 拆解脚印异象 |
| D03 | 关闭一组总电源，利用延迟触发穿过监视区 | 恐吓系统并非无所不在，可被反向利用 | 把恐怖规则变成玩法规则 |
| D04 | 已关闭装置被远程重启 | 现在仍有人监视调查，而且掌握项目系统 | 证明威胁是现在进行时 |
| D05 | 小周过快地指出备用供电柜，又装作刚发现 | 小周不只“熟悉现场”，他熟悉系统的具体操作 | 将疑点从态度提升为行动证据 |
| D06 | 归档白灯、广播、湿脚印三类证据 | `haunting-is-engineered`：完成第一重反转，“鬼”是人工装置 | 解锁矿区旧控制室 |

### 6.3 身份与责任串行重建

#### `b-designer-revealed`

| 拍点 | 内容 | 玩家当前获得的认知 | 进度作用 |
| --- | --- | --- | --- |
| B20 | 进入矿区旧控制室，拼合被拆散的系统图纸 | 恐吓系统是一套统一方案，不是村民零散恶作剧 | 建立设计者问题 |
| B21 | 用主角下意识的惯用手势解开操作台 | 主角保留了操作肌肉记忆 | 从外部调查转向自身 |
| B22 | 读取调试日志 | 日志的写作习惯、缩写和工作证残留签名一致；王阙参与设计，不只是执行上级命令 | 锁定 王阙的主动性 |
| B23 | 查看低清调试录像 | 录像中人的伤疤位置、惯用手与主角一致；主角就是 王阙 | 完成第二重反转 |
| B24 | 恢复一段会议摘要 | `intimidation-plan-authorship`：王阙提出用童年“借灯”禁忌驱赶拒签户 | 证明恐吓方案作者 |
| B25 | 读到一名老人跌亡后项目仍继续的记录 | 事故已越过“只是吓人”的边界，王阙仍未停止 | 阻断“不知道会伤人”的辩解 |
| B26 | 小周强调“失忆前的你被公司逼迫” | 这只是部分真话：集团有威胁，王阙也有选择 | 埋下终局自我开脱模板 |

#### `a-survival-revealed`

| 拍点 | 内容 | 玩家当前获得的认知 | 进度作用 |
| --- | --- | --- | --- |
| A20 | 用票据编号找到邻镇旧诊所封存账簿 | 坠沟两日后有一名无名少年被外来人送诊 | 确认 陈晋年可能生还 |
| A21 | 调查无名病人伤情图和转诊记录 | `clinic-ledger`、`injury-chart`：年龄、头伤、面部划伤与现在主角完全对应 | 证明 陈晋年未死 |
| A22 | 核对主角伤疤与伤情图 | 毁容解释了旧村民为何无法靠脸认出 陈晋年 | 排除外貌矛盾 |
| A23 | 读取采药人留下的一次性转述 | 采药人从深排水洞救走 陈晋年，没有通知村中 | 封合 陈晋年的生还因果 |
| A24 | 回看父亲终止搜救文件 | 父亲确实在第三日放弃向排水渠扩搜 | 保留父亲的责任，不因 陈晋年生还而洗白 |
| A25 | 核对 王阙的户籍变更时间、陈晋年的年龄与主角伤痕 | `a-b-identity-chain-complete`：陈晋年伤愈后改从母姓，成为 王阙 | 完成第三重反转 |
| A26 | 蓝玻璃珠触发兄妹离院的片段闪回 | 陈晋年私自带妹妹离院，他的冲动也是死亡因果之一 | 防止 陈晋年变成绝对无罪身份 |
| A27 | 主角明确说出“陈晋年和 王阙是同一个人” | 身份谜的前两个名字合并 | 解锁父亲旧屋暗层 |

#### `father-company-truth`

| 拍点 | 内容 | 玩家当前获得的认知 | 进度作用 |
| --- | --- | --- | --- |
| F00 | 按苏禾留下的证言索引打开父亲旧屋暗层 | 父亲生前保留过翻案材料 | 打破“父亲从未反悔”的单一印象 |
| F01 | 读取原始矿图与爆破日志残页 | `blast-log-fragment`：十七年前非法试采和违规爆破破坏了旧水道 | 推翻“自然山体滑坡” |
| F02 | 读取医疗费协议和改记录文件 | 父亲最初签字是为换取女儿抢救费 | 给出他最初的被迫处境 |
| F03 | 读取物证处理清单 | 父亲后续主动帮助处理目击记录和爆破日志 | 被迫不能覆盖他后续的帮凶行为 |
| F04 | 读取公司对扩大搜救的威胁备忘 | `search-coercion-note`：搜救继续会暴露矿洞和父亲已参与的毁证 | 解释恐惧，但不免除终止搜救的责任 |
| F05 | 读取未寄出证言 | `father-unsent-testimony`：父亲晚年想留下翻案可能，却始终没有公开站出来 | 完成父亲的复杂责任像 |
| F06 | 在河边遗物点取得旧公司股权沿革编号 | 父亲死前在追查旧公司去向 | 把历史线指向现代集团 |
| F07 | 与现集团资产收购目录互证 | `company-succession-chain`：现集团收购了旧矿业公司的项目公司、矿权和历史档案 | 建立现集团灭迹动机 |
| F08 | 恢复 王阙接任时的风险谈话 | 集团用 陈晋年的身份报告威胁 王阙，却没告知废井来历 | 固定“王阙事前不知旧矿难关联” |
| F09 | 主角看见自己与父亲的对应关系 | 两人都受威胁，也都在最后一步主动选择保全自己 | 建立终局道德镜像 |

#### `white-lamp-identity-revealed`

| 拍点 | 内容 | 玩家当前获得的认知 | 进度作用 |
| --- | --- | --- | --- |
| W20 | 用变声录音暗号和主角惯用加密方式打开匿名藏点 | 藏点同时要求 王阙的工作习惯和 陈晋年的私人记忆 | 将三条身份线压到同一人身上 |
| W21 | 对比集团原始文件与匿名举报版本 | 举报保留集团违法，删掉 王阙设计恐吓的记录 | 从“帮助者”转向“编辑真相者” |
| W22 | 恢复删除日志 | `white-lamp-deletion-log`：封井参与、苏禾最后位置、王阙的会议发言都被定向删除 | 证明删节是有意行为 |
| W23 | 查看未发送的媒体邮件与变声录音原声 | 原声、措辞和主角一致；白灯客就是 王阙 | 完成第四重反转 |
| W24 | 小周试图把白灯客解释为“你还有良心” | 白灯客确实帮过村民，但它也是 王阙为自己保留干净位置的名字 | 拒绝简单“赎罪人”结论 |
| W25 | 恢复一张不完整的排水洞坐标纸 | 原始证据和完整密钥仍在封墙后的矿井 | 给出第二次汇合目标 |
| W26 | 主角承认 陈晋年、王阙、白灯客是同一个人使用的三个名字 | `three-identities-merged`：身份谜正式结束 | 将故事问题转为责任问题 |
| W27 | 小周表示愿意“陪你走完” | 他不再催促放弃，因为他需要主角找到最后藏点 | 小周监视目的逼近明牌 |

### 6.4 第二次汇合：重返矿井

#### `mine-route-restored`

| 拍点 | 内容 | 玩家当前获得的认知 | 进度作用 |
| --- | --- | --- | --- |
| M00 | 用原始矿图、坠沟地形和藏点坐标拼出新路线 | 当年救走 陈晋年的排水洞可绕过封堵 | 打通过去与现在的同一空间 |
| M01 | 小周建议走更明显的山口，却“误判”了新封锁 | 他在尝试把主角导向可控路线 | 给玩家最后一次小周疑点 |
| M02 | 从排水洞潜入，利用已掌握的供电盲区躲开装置 | 前面“拆鬼”获得的规则在终局真正有用 | 玩法回收 |
| M03 | 观察两道挡墙、中间废石和速凝浆痕迹 | 当夜封的是唯一公开斜井入口，不是把整个竖井灌满 | 固定可执行的封井方案 |
| M04 | 比对封墙材料与苏禾照片 | 封井用的就是失踪前已运到现场的材料 | 闭合苏禾的时间压力 |
| M05 | 绕过挡墙到达内部平台 | `sealed-mine-bypassed`：集团封住的是可见入口和社会追查，不是一个超自然空间 | 进入苏禾之死现场 |

#### `su-he-death-reconstructed`

| 拍点 | 内容 | 玩家当前获得的认知 | 进度作用 |
| --- | --- | --- | --- |
| M06 | 找到苏禾留在平台的文件袋和录音笔 | 她携带的是复印件，原件在别处；录音笔一直开着 | 避免她带全部原件赴约的不合理 |
| M07 | 录音还原苏禾向 王阙出示父亲证言、股权沿革和原始矿图复印件 | 王阙在此时才首次得知新旧公司和事故矿井的真实关系 | 锁定 王阙的知情时点 |
| M08 | 苏禾说出父亲与 王阙的镜像关系 | 她逼 王阙承认“被逼到这里”和“自己选择留下”可以同时成立 | 把身份问题转成选择问题 |
| M09 | 苏禾说“证据在你自己身上”并准备离开 | 她指的是 王阙的操作痕迹、记忆和藏点习惯，不是与白灯客有联系 | 回收公司让主角重走路线的动机 |
| M10 | 录音中小周从暗处出现，抢手机并把苏禾推入内部竖井 | 推人是小周未请示的越权行为 | 锁定直接加害者 |
| M11 | 井下传来苏禾呼救，小周说“现在放绳还来得及，救不救” | 苏禾当时未死，现场有施救条件 | 排除“无法挽回”的开脱 |
| M12 | 井下叫的是“陈晋年”，录音中 王阙回答“不救/不报警” | `b-refused-rescue-recorded`：主角对不施救作出了明确选择 | 完成第五重反转 |
| M13 | 找到当夜封井施工记录 | `night-sealing-log`：小周提前调用已批准小队，集团后续接受并掩盖了结果 | 从个人越权连到组织共同责任 |
| M14 | 在竖井边找到苏禾手机取卡痕迹和安保操作记录 | `su-route-fabrication-proof`：苏禾失踪后的手机轨迹由安保系统伪造 | 与小学发现的轨迹异常互证 |
| M15 | 主角发现录音笔同时记下了自己的声音 | 无法再把 王阙的决定归给父亲、公司、小周或白灯客 | 三个名字的责任完全合并 |
| M16 | 录音笔给出最后服务器索引，小周不再伪装关心 | `su-death-chain-complete`：玩家已拿到个人责任链，但还需集团原始记录完成法证互证 | 进入终局数据机房 |

### 6.5 终局：证据、小周与选择

#### `server-evidence-recovered`

| 拍点 | 内容 | 获得的证据 | 进度作用 |
| --- | --- | --- | --- |
| T00 | 用录音笔索引进入新矿区数据机房 | 旧项目归档索引 | 开启最后证据互证 |
| T01 | 导出十七年前未篡改的试采、爆破与事故档案 | `original-accident-server-records` | 将父亲证言与原始系统记录互证 |
| T02 | 导出收购尽调、陈晋年/王阙背景报告和项目风险会议 | `acquisition-and-coercion-records` | 证明集团知道旧事故并利用 王阙的身份 |
| T03 | 导出恐吓方案版本史与 王阙的提案记录 | `intimidation-authorship-records` | 证明 王阙主动设计和持续推进恐吓 |
| T04 | 导出小周的安保调度、夜间封井和手机伪造记录 | `security-coverup-records` | 证明小周与集团的后续掩盖 |
| T05 | 导出泄密排查、用药和记忆诱导计划 | `memory-manipulation-records` | 证明开场失忆与重走路线是集团的证据回收方案 |
| T06 | 将服务器材料与现有四组物证生成完整证据包 | `full-evidence-package-ready`：证据已足以区分集团、父亲、小周和主角各自的行为 | 触发小周回收 |

#### `x-recovery-confrontation`

| 拍点 | 内容 | 玩家认知 | 进度作用 |
| --- | --- | --- | --- |
| T07 | 小周站到主角身后，要求“材料给我，我来处理” | 他一路陪同的目标就是让主角找齐原件和密钥 | 终局对峙开始 |
| T08 | 小周承认重启白灯、广播和监视设备 | 他既是引导者，也是调查期间继续“装鬼”的人 | 回收前半程全部可疑行为 |
| T09 | 小周提出最后的开脱：交出证据，就不用再当 陈晋年、王阙或白灯客 | 这是主角第四次借新身份丢下旧责任的机会 | 将主题变成实际选择 |
| T10 | 玩家选择“交出全部证据”或“拒绝交付” | `evidence-handed-to-x` / `x-handover-refused` | 交出则进入 `ending-accomplice`；拒绝则进入 `x-showdown` |
| T11 | 拒绝后小周撤下伪装，开始回收与灭口 | 他的“保护”从来以证据未找齐为前提 | 进入对峙玩法 |

#### `x-showdown`

| 拍点 | 内容 | 进度作用 |
| --- | --- | --- |
| T12 | 玩家利用前面掌握的供电范围、延时器和排水线转移小周 | 不新增凭空的战斗能力，终局只考验已学规则 |
| T13 | 小周利用安保权限封锁出口，试图删除副本 | 建立倒计时压力 |
| T14 | 玩家失败 | 记录 `x-showdown-lost`，进入 `ending-defeated` |
| T15 | 玩家撑到备份外发并逃离控制区 | 记录 `x-showdown-survived`，进入 `evidence-disposition` |

#### `evidence-disposition`

这里不做抽象的“你愿意成为怎样的人”选项，界面必须让玩家看到自己保留和删除的证据组。

| 拍点 | 玩家操作 | 保留 | 删除 | 转移 |
| --- | --- | --- | --- | --- |
| T16 | 查看四组证据包与每组指向的责任人 | 暂无改变 | 暂无改变 | 保持当前 Node |
| T17 | 选择“销毁全部证据” | 无 | 四组全部删除 | `ending-erasure` |
| T18 | 选择“以白灯客名义选择性公开” | 旧矿难、父亲参与、集团收购与掩盖 | 王阙设计恐吓、老人跌亡后继续、不施救、白灯客删证 | `ending-curated-truth` |
| T19 | 选择“完整公开” | 旧矿难、父亲、集团、小周、王阙与白灯客的全部材料 | 无 | `ending-full-account` |
| T20 | 系统在提交前再次列出删除结果 | 选择的实际后果可见 | 不允许按钮文案与真实删除集合不一致 | 确认后只能命中一个结局事实 |

## 7. 五个结局 Node

| ending Node | 结局名 | 必要条件 | 结果 | 主题落点 |
| --- | --- | --- | --- | --- |
| `ending-accomplice` | 《共犯的终点》 | `evidence-handed-to-x` | 小周当面毁掉证据并杀死主角；公司完成最后回收 | 主角又一次把选择交给他人 |
| `ending-defeated` | 《封井之人》 | `x-showdown-lost` | 主角被小周灭口，副本被清除，项目继续 | 知道真相不等于成功保全真相 |
| `ending-erasure` | 《无名者》 | `all-evidence-destroyed` | 主角重新隐姓埋名，村庄被拆，官方记录中什么也没发生 | 改名和删证再次合一 |
| `ending-curated-truth` | 《白灯之后》 | `curated-evidence-published` | 公司遭调查，主角以白灯客身份成为揭密者，自身责任被留在暗处 | 他做了好事，也再次把真相编辑成对自己有利的版本 |
| `ending-full-account` | 《不再借灯》 | `full-evidence-published` | 公司、父亲、小周、王阙和白灯客的全部行为同时公开，主角也接受调查 | 主角第一次不用新名字切割责任 |

五个结局中没有“无辜通关”。完整公开不代表主角被原谅，只代表他不再删节责任。

## 8. 终局必须检查的四组证据

| 证据组 | 必须包含 | 能证明 | 单独使用的限制 |
| --- | --- | --- | --- |
| 旧矿难与父亲 | 原始矿图、爆破日志残页、医疗费协议、物证处理清单、搜救威胁备忘、未寄证言、服务器原始事故记录 | 非法试采、事故篡改、父亲最初被迫与后续主动帮凶 | 父亲证言是间接证据，必须和日志及服务器记录互证 |
| 王阙与恐吓系统 | 拆迁档案、恐吓方案、调试日志和录像、老人跌亡后的项目记录、服务器版本史 | 王阙的项目身份、主动设计和继续推进恐吓 | 不能单独证明 王阙事前知道废井就是事故现场 |
| 苏禾之死与封井 | 苏禾录音笔、封墙物证、夜间封井记录、手机轨迹伪造记录、安保调度日志 | 小周推人、王阙明知可施救仍拒绝、集团后续掩盖 | 只有录音而无工程和调度记录时，难以证明完整组织链 |
| 白灯客的删节 | 匿名信、变声录音原声、加密密钥、原文件与举报稿差异、删除日志 | 白灯客就是 王阙，且举报时有意回避自身责任 | 选择性举报能伤害集团，但不等于完整自首 |

## 9. V3 已实现契约

1. 新小游戏命令带 `gameStyle` 与 `allowedResultFactIds`，统一用 `MINIGAME_RESOLVED` 回报一个结果事实；旧地图拼图仍只接受 `MAP_PUZZLE_COMPLETED`。
2. handoff 的 `completionMode` 缺省为 `all`；`x-showdown-chase` 使用 `any`，生还或失败任一事实即可完成。
3. 技术故障继续使用 `EXTERNAL_INTERACTION_FAILED`，只返回错误并保留旧检查点，不会进入剧情失败结局。
4. 多个转移同时命中时返回 `STORY_AMBIGUOUS_TRANSITION`；每个 ending Node 独立返回自己的 `STORY_ENDED`。
5. `outer-lines-investigation` 的四个 handoff 可同时恢复，已完成目标不会重新发出。

## 10. `week-one-end` 的 V1 存档迁移

`week-one-end` 已经是发布过的稳定 ID，V3 不删除也不改名，但它的语义从“游戏终点”变为“老宅结束、完整调查开始”，因此 `revision` 必须从 `1` 升到 `2`。

| V1 存档情况 | V3 迁移结果 |
| --- | --- |
| 正停在 `week-one-end`，尚未提交 `confirm-week-one-end` | 保留 `nodeId: week-one-end`，把 `nodeRevision` 更新为 `2`，继续显示“继续调查” |
| 已完成 `week-one-end`，且存在 `week-one-end-acknowledged` | 保留原 facts 和 completed IDs，将当前 Node 显式迁移到 `outer-lines-investigation` |
| 旧存档的节点、阶段或事实缺失 | 返回明确的版本不兼容错误，不猜测补齐 |

可以保留 actionId `confirm-week-one-end` 以降低迁移成本，但显示文案应从“结束第一周内容”改为“继续追查”。技术 ID 不允许出现在玩家文案中。

## 11. V3 验收红线

- 在 `haunting-system-dismantled` 完成前，不得确认主角是 王阙。
- 在 `b-designer-revealed` 完成前，不得让录像、档案正脸或 NPC 直接证实主角是 王阙。
- 在 `a-survival-revealed` 完成前，空坟只能证明“没有遗体”，不能单独证明 陈晋年存活。
- 在 `father-company-truth` 完成前，不得让 王阙在回村之前知道废井就是旧事故现场。
- 白灯客的所有可验证行动必须晚于苏禾失踪，两人不得被写成合作者。
- 苏禾的录音必须同时证明“她还活着”、“现场可施救”、“小周发问”和“王阙拒绝”，缺一不得完成 `b-refused-rescue-recorded`。
- 完整公开结局必须包含主角自身证据；只公开公司罪证必须进入选择性公开，不得因文案漂亮而判成完整公开。
- 任何进入条件、完成条件、转移或外部结果缺失都必须显式报错，不允许自动跳过证据、默认选择结局或把失败当成成功。
