<!-- 本文件把《剧情Node推进》的内容拍点整理成可供全局状态、存档和外部模块直接联调的 V1 运行时 Node。 -->

# V1 剧情运行 Node 清单

- **版本：** V1.0
- **内容来源：** `剧情Node推进.md`
- **接口依据：** `剧情模块接口约定.md`
- **用途：** 冻结 V1 起点、阶段、运行时 Node、完成事实、外部交接和出口
- **状态：** V1.0 换位审核完成，可交付全局开发

## 1. 固定结论

- 起始 Node：`prologue-wake`
- V1 结束 Node：`week-one-end`
- 阶段顺序：`prologue` → `village` → `old-house`
- V1 共 11 个运行时 Node。
- 所有 Node 初始 `revision` 均为 `1`；未特别标注时，`completesStage: false`、`terminal: false`、`endingId: null`。
- P00、V11、O07 等编号只用于追溯原内容，不进入存档。
- 同一段对话无论聊几轮，都属于同一个 Node handoff；对话模块只在产生稳定事实或整段完成时回报剧情。
- 三名村民的谈话同属 `village-inquiries`，可以按任意顺序完成。

剧情内容以 `剧情Node推进.md` 为准。钥匙在玩家眼中是**无标记老钥匙**，`key-a` 只是内部技术 ID，界面和美术不得提前显示字母 A。祠堂内检查的随身物品是烧毁的工作证和蓝玻璃珠，钥匙由小 X 随后交给主角；旧 PRD 中“三件随身物品”和“刻有 A 的钥匙”的写法不再作为剧情实现依据。

运行时 Node 只在以下位置拆分：需要等待外部模块、允许存档恢复、出现选择或分支、完成阶段、进入终点。相邻的叙述和同一场谈话不再机械拆开。

## 2. 固定 ID

### 人物

| ID | 当前身份 |
| --- | --- |
| `companion-x` | 小 X |
| `villager-1` | 小卖部老板 |
| `villager-2` | 拒签户 |
| `villager-3` | 年老村民 |
| `unknown-caller` | 老宅门外声音；身份暂不揭示 |

正式姓名以后可以修改显示文案，上述运行时 ID 不再改名。

### 物品、线索、地点和小游戏

| 类型 | ID |
| --- | --- |
| 物品 | `burned-work-id`、`blue-glass-bead`、`key-a`、`map-fragment-1`、`map-fragment-2`、`map-fragment-3`、`restored-village-map` |
| 老宅线索 | `old-photograph`、`school-uniform`、`height-marks`、`funeral-list` |
| 地点 | `shrine`、`village`、`old-house` |
| 小游戏 | `map-puzzle` |

三块地图碎片与村民的编号对应只用于稳定发奖：`villager-1` 给碎片一，`villager-2` 给碎片二，`villager-3` 给碎片三，不额外表达剧情重要性。

新游戏初始背包只包含 `burned-work-id` 和 `blue-glass-bead`，但二者尚未调查，所以不预置对应调查事实。`key-a` 在 `prologue-belongings` 中由小 X 交付后加入。

### 剧情操作

| `actionId` | 所在 Node | 可用条件 | 提交成功后记录的事实 |
| --- | --- | --- | --- |
| `confirm-wake-context` | `prologue-wake` | 进入 Node 后 | `prologue-wake-context-known` |
| `confirm-white-lamp` | `prologue-white-lamp` | 进入 Node 后 | `white-lamp-witnessed` |
| `leave-shrine` | `prologue-white-lamp` | `prologue-lamp-incident-understood` | `leave-shrine-chosen` |
| `go-old-house` | `village-map-and-route` | `map-puzzle-completed` | `old-house-route-chosen` |
| `confirm-week-one-end` | `week-one-end` | 进入 Node 后 | `week-one-end-acknowledged` |

界面只能回传这里登记的 `actionId`，不能根据按钮文案判断剧情。
剧情校验操作可用后，通过 `STORY_FACT_RECORDED` 提交表中事实；状态提交失败时，操作不算完成。

## 3. Node 总览

| 顺序 | 运行时 Node | 原内容 | 阶段 | 外部交接 | 下一 Node |
| --- | --- | --- | --- | --- | --- |
| 1 | `prologue-wake` | P00—P01 | `prologue` | 对话 | `prologue-belongings` |
| 2 | `prologue-belongings` | P02—P05 | `prologue` | 探索、对话 | `prologue-white-lamp` |
| 3 | `prologue-white-lamp` | P06—P08 | `prologue` | 对话 | `village-arrival` |
| 4 | `village-arrival` | V00—V01 | `village` | 探索 | `village-inquiries` |
| 5 | `village-inquiries` | V02—V12 | `village` | 三场并行对话 | `village-map-and-route` |
| 6 | `village-map-and-route` | V13—V14 | `village` | 小游戏 | `old-house-entry` |
| 7 | `old-house-entry` | O00 | `old-house` | 探索 | `old-house-investigation` |
| 8 | `old-house-investigation` | O01—O04 | `old-house` | 探索 | `old-house-clue-confrontation` |
| 9 | `old-house-clue-confrontation` | O05 | `old-house` | 对话 | `old-house-call-at-door` |
| 10 | `old-house-call-at-door` | O06—O08 | `old-house` | 对话 | `week-one-end` |
| 11 | `week-one-end` | O09 | `old-house` | 无 | 无 |

## 4. Node 定义

### 4.1 `prologue-wake`

- **目标：** 玩家确认自己近期失忆，认识小 X 的表面身份，并接受“调查村中怪事”的当前任务。
- **进入条件：** 新游戏固定进入，无额外事实。
- **里程碑：**
  - `wake-context-known` ← `prologue-wake-context-known`
  - `surface-task-known` ← `surface-investigation-task-known`
- **对话 handoff：** `prologue-briefing`，`startWhen: prologue-wake-context-known`，参与者 `companion-x`；必须让玩家知道小 X 自称公司安全联络员，公司希望调查白灯、广播和脚印等异常。
- **完成条件：** 两个里程碑全部完成。
- **出口：** `prologue-belongings`

### 4.2 `prologue-belongings`

- **目标：** 玩家检查工作证和蓝玻璃珠，从小 X 处取得旧钥匙；若追问过去，小 X 会把话题拉回调查。
- **进入条件：** `surface-investigation-task-known`
- **里程碑：**
  - `burned-work-id-checked` ← `burned-work-id-investigated`
  - `blue-glass-bead-checked` ← `blue-glass-bead-investigated`
  - `key-received-from-x` ← `key-a-given-by-x`
  - 可选 `x-memory-deflection-noticed` ← `x-deflects-memory-question-noticed`
- **探索 handoff：** `shrine-belongings`；目标是完成工作证和玻璃珠调查。
- **对话 handoff：** `prologue-key-and-memory`，`startWhen` 要求工作证和玻璃珠均已调查，参与者 `companion-x`；必须完成交付钥匙，可选回应玩家对过去的追问。
- **里程碑效果：** `key-received-from-x` 首次达成时提交 `ITEM_ACQUIRED { itemId: "key-a" }`。
- **完成条件：** 前三个必需里程碑完成；可选里程碑不阻断流程。
- **出口：** `prologue-white-lamp`

### 4.3 `prologue-white-lamp`

- **目标：** 玩家亲眼遭遇第一盏白灯，得知借灯禁忌，并注意到小 X 对供电异常熟悉。
- **进入条件：** `burned-work-id-investigated`、`blue-glass-bead-investigated`、`key-a-given-by-x`
- **里程碑：**
  - `white-lamp-seen` ← `white-lamp-witnessed`
  - `lamp-incident-understood` ← `prologue-lamp-incident-understood`
  - `leave-shrine-decided` ← `leave-shrine-chosen`
- **对话 handoff：** `prologue-lamp-incident`，`startWhen: white-lamp-witnessed`，参与者 `companion-x`；必须传达借灯禁忌、小 X 很快找到供电问题，以及两人接下来去村口调查。
- **完成条件：** 三个里程碑全部完成。
- **阶段：** 完成 `prologue`。
- **出口：** `village-arrival`

### 4.4 `village-arrival`

- **目标：** 玩家看见村庄衰败、搬迁施工和苏禾寻人启事，建立怪事背后的现实背景。
- **进入条件：** `leave-shrine-chosen`
- **里程碑：**
  - `village-decline-seen` ← `village-decline-observed`
  - `su-he-notice-seen` ← `su-he-missing-notice-observed`
- **探索 handoff：** `village-arrival-observation`；目标是观察村口环境和苏禾寻人启事。
- **完成条件：** 两个里程碑全部完成。
- **出口：** `village-inquiries`

### 4.5 `village-inquiries`

- **目标：** 玩家从三名村民处取得公司、怪事、苏禾、旧事故及 A/B 身份暗线，并收集三块地图碎片。
- **进入条件：** `village-decline-observed`、`su-he-missing-notice-observed`
- **里程碑：**
  - `shopkeeper-thread-complete` ← `shopkeeper-inquiry-completed`
  - `holdout-thread-complete` ← `holdout-inquiry-completed`
  - `elder-thread-complete` ← `elder-inquiry-completed`
- **完成条件：** 三个里程碑全部完成，完成顺序不限。
- **出口：** `village-map-and-route`

三场对话的目标和即时效果固定如下：

| handoff | 参与者 | 对话必须传达什么 | 里程碑首次效果 |
| --- | --- | --- | --- |
| `village-shopkeeper-inquiry` | `villager-1`、`companion-x` | 项目进村后人口搬离；老板称主角为 B 工程师；怪事与项目时间重合；苏禾查过怪事和公司后失踪；小 X 为公司辩护并限制解释方向 | `ITEM_ACQUIRED { itemId: "map-fragment-1" }` |
| `village-holdout-inquiry` | `villager-2`、`companion-x` | 拒签涉及房屋、祖坟和旧事故；小 X 用公司立场激怒对方并中断深挖 | `ITEM_ACQUIRED { itemId: "map-fragment-2" }` |
| `village-elder-inquiry` | `villager-3`、`companion-x` | 蓝玻璃珠与陈家旧事有关；老人一度称主角为 A 又否认；旧事故的公开版本是山体滑坡；小 X 再次阻止追问 | `ITEM_ACQUIRED { itemId: "map-fragment-3" }` |

对话模块只有在本行内容全部传达后，才能提交该行对应的完成事实。一次谈话可以分任意轮数，中途可用 `NPC_TALK_PROGRESS` 回报，但不能提前完成里程碑或发放碎片。

### 4.6 `village-map-and-route`

- **目标：** 玩家复原手绘地图，取得完整地图并决定前往陈家老宅。
- **进入条件：** `shopkeeper-inquiry-completed`、`holdout-inquiry-completed`、`elder-inquiry-completed`
- **里程碑：**
  - `map-restored` ← `map-puzzle-completed`
  - `old-house-route-selected` ← `old-house-route-chosen`
- **小游戏 handoff：** `map-puzzle`，`startWhen` 要求 `map-fragment-1-acquired`、`map-fragment-2-acquired`、`map-fragment-3-acquired` 全部成立；成功时返回 `MAP_PUZZLE_COMPLETED` 和 `map-puzzle-completed`。
- **里程碑效果：** `map-restored` 首次达成时，一次性提交：
  - `ITEM_ACQUIRED { itemId: "restored-village-map" }`
  - `LOCATION_UNLOCKED { locationId: "old-house" }`
- **完成条件：** 地图已复原，玩家随后选择前往老宅。
- **阶段：** 完成 `village`。
- **出口：** `old-house-entry`

### 4.7 `old-house-entry`

- **目标：** 玩家抵达陈家老宅，并确认小 X 交出的旧钥匙可以开门。
- **进入条件：** `key-a-acquired`、`restored-village-map-acquired`、`old-house-unlocked`、`old-house-route-chosen`
- **里程碑：** `old-house-door-opened` ← `old-house-door-opened`
- **探索 handoff：** `old-house-door`；目标是使用 `key-a` 打开老宅。
- **完成条件：** 门已打开。
- **出口：** `old-house-investigation`

### 4.8 `old-house-investigation`

- **目标：** 玩家按任意顺序调查照片、校服、身高刻痕和送葬名单，建立 A、妹妹及陈家旧事的基础轮廓。
- **进入条件：** `old-house-door-opened`
- **里程碑：**
  - `photograph-clue-known` ← `old-photograph-clue-known`
  - `uniform-clue-known` ← `school-uniform-clue-known`
  - `height-clue-known` ← `height-marks-clue-known`
  - `funeral-clue-known` ← `funeral-list-clue-known`
- **探索 handoff：** `old-house-clues`；四项调查顺序不限，重复调查可以重读，但不能重复记录线索。
- **里程碑效果：** 四个里程碑首次达成时，分别提交 `CLUE_RECORDED`，`clueId` 依次为 `old-photograph`、`school-uniform`、`height-marks`、`funeral-list`。
- **完成条件：** 四个里程碑全部完成。
- **出口：** `old-house-clue-confrontation`

### 4.9 `old-house-clue-confrontation`

- **目标：** 玩家把工作证、玻璃珠、钥匙和屋内线索联系起来，明确感到身份矛盾；小 X 立即压下这一问题。
- **进入条件：** `old-photograph-clue-known`、`school-uniform-clue-known`、`height-marks-clue-known`、`funeral-list-clue-known`
- **里程碑：** `identity-conflict-raised` ← `old-house-identity-conflict-raised`
- **对话 handoff：** `old-house-clue-confrontation`，参与者 `companion-x`；必须让玩家感到线索之间存在身份冲突，并让小 X 把注意力重新引向最近的怪事。
- **完成条件：** 里程碑完成。
- **出口：** `old-house-call-at-door`

### 4.10 `old-house-call-at-door`

- **目标：** 门外声音呼唤 A，小 X 阻止主角回应；事件结束后仍不能确定声音在叫谁。
- **进入条件：** `old-house-identity-conflict-raised`
- **里程碑：** `door-call-finished` ← `door-call-incident-completed`
- **对话 handoff：** `old-house-door-call`，参与者 `unknown-caller`、`companion-x`；必须出现“A”的呼名、小 X 的“别答”警告，并保留对声音目标的多种解释。
- **完成条件：** 里程碑完成。
- **出口：** `week-one-end`

### 4.11 `week-one-end`

- **目标：** 收束 V1：当前主线仍是追查怪事与公司，主角和陈家的关系已经成为无法忽视的问题，但不能揭露三重身份答案。
- **进入条件：** `door-call-incident-completed`
- **里程碑：** `week-one-end-confirmed` ← `week-one-end-acknowledged`
- **完成条件：** 玩家确认第一周内容结束提示。
- **阶段：** 完成 `old-house`。
- **终点：** `terminal: true`，`endingId: "week-one-end"`，无后继 Node。

## 5. 事实登记表

| `factId` | 唯一产生模块 | 产生时机 |
| --- | --- | --- |
| `prologue-wake-context-known` | `story` | 玩家确认醒来、失忆和小 X 表面身份的开场内容 |
| `surface-investigation-task-known` | `conversation` | `prologue-briefing` 完成任务说明 |
| `burned-work-id-investigated` | `exploration` | 工作证调查完成 |
| `blue-glass-bead-investigated` | `exploration` | 蓝玻璃珠调查完成 |
| `key-a-given-by-x` | `conversation` | 小 X 完成交付钥匙 |
| `x-deflects-memory-question-noticed` | `conversation` | 玩家追问过去且小 X 转移话题；可选 |
| `key-a-acquired` | `state` | `ITEM_ACQUIRED key-a` 提交成功后派生 |
| `white-lamp-witnessed` | `story` | 第一盏白灯的展示被确认 |
| `prologue-lamp-incident-understood` | `conversation` | 借灯禁忌、供电疑点和村口计划均已传达 |
| `leave-shrine-chosen` | `story` | 玩家选择离开祠堂 |
| `village-decline-observed` | `exploration` | 村口衰败、搬迁和施工痕迹调查完成 |
| `su-he-missing-notice-observed` | `exploration` | 苏禾寻人启事调查完成 |
| `shopkeeper-inquiry-completed` | `conversation` | 小卖部对话的全部目标已经传达 |
| `holdout-inquiry-completed` | `conversation` | 拒签户对话的全部目标已经传达 |
| `elder-inquiry-completed` | `conversation` | 老人对话的全部目标已经传达 |
| `map-fragment-1-acquired` | `state` | `ITEM_ACQUIRED map-fragment-1` 提交成功后派生 |
| `map-fragment-2-acquired` | `state` | `ITEM_ACQUIRED map-fragment-2` 提交成功后派生 |
| `map-fragment-3-acquired` | `state` | `ITEM_ACQUIRED map-fragment-3` 提交成功后派生 |
| `map-puzzle-completed` | `minigame` | `map-puzzle` 成功判定完成 |
| `restored-village-map-acquired` | `state` | `ITEM_ACQUIRED restored-village-map` 提交成功后派生 |
| `old-house-unlocked` | `state` | `LOCATION_UNLOCKED old-house` 提交成功后派生 |
| `old-house-route-chosen` | `story` | 玩家在地图完成后选择前往老宅 |
| `old-house-door-opened` | `exploration` | 使用 `key-a` 成功开门 |
| `old-photograph-clue-known` | `exploration` | 确认照片中的 A、妹妹和父亲，且 A 当时面容完整 |
| `school-uniform-clue-known` | `exploration` | 确认妹妹旧物与蓝玻璃珠的实体联系 |
| `height-marks-clue-known` | `exploration` | 确认事故时 A 约十七岁、妹妹才是小学生 |
| `funeral-list-clue-known` | `exploration` | 确认妹妹死亡，A 也被村里作为死者送葬 |
| `old-house-identity-conflict-raised` | `conversation` | O05 的身份矛盾和小 X 转移话题均已传达 |
| `door-call-incident-completed` | `conversation` | 呼名、阻止回应和多解状态均已传达 |
| `week-one-end-acknowledged` | `story` | 玩家确认 V1 结束提示 |

状态模块只接受登记表中指定模块产生对应事实。以后增加事实可以追加登记，但不得用新名称重复表达同一个结果。

## 6. handoff 返回规则

| handoff 类型 | 成功或进展事件 | `resultFactIds` | 结束条件 |
| --- | --- | --- | --- |
| 对话 | 进展用 `NPC_TALK_PROGRESS`，结束用 `NPC_TALKED` | 只能提交当前对话目标对应的 `conversation` 事实 | 必需目标全部传达后才能结束 |
| 探索 | `OBJECT_INVESTIGATED` | 只能提交当前调查目标对应的 `exploration` 事实 | 单个目标完成即可回报，同一 handoff 可回报多次 |
| 小游戏 | `MAP_PUZZLE_COMPLETED` | 固定为 `map-puzzle-completed` | 小游戏成功判定完成 |

所有事件必须带由剧情命令产生的 `causedByCommandId`。取消使用 `EXTERNAL_INTERACTION_CANCELLED`，执行失败使用 `EXTERNAL_INTERACTION_FAILED`；两者的 `resultFactIds` 必须为空，剧情保留当前 Node。

## 7. 给全局模块的最低开发输入

全局负责人可以直接按本文实现：

1. 新游戏使用下面的初始剧情检查点，初始事实列表为空，初始背包按第 2 节设置；
2. 事实集合支持登记、去重和按产生模块校验；
3. 检查点保存当前 Node、当前里程碑、已完成 Node/阶段及 `pendingCommands`；
4. 三名村民对话可以同时出现在 `pendingCommands`，完成顺序不限；
5. 里程碑首次达成时支持 `onReach`，Node 首次完成时支持 `onComplete`；
6. `ITEM_ACQUIRED`、`CLUE_RECORDED`、`LOCATION_UNLOCKED` 与检查点按事务提交；
7. 状态模块不得根据 `MAP_PUZZLE_COMPLETED` 或其他外部事件自行选择下一 Node；
8. `week-one-end` 完成后返回 `ended`，不再请求后继 Node。

```js
{
  nodeId: "prologue-wake",
  nodeRevision: 1,
  completedMilestoneIds: [],
  completedNodeIds: [],
  completedStageIds: [],
  pendingCommands: []
}
```

运行时 `commandId` 固定按 `cmd-{nodeId}-{handoffId}` 生成。同一 handoff 在刷新、重试和读档后必须得到同一个 ID。

## 8. 换位审核

审核问题：如果只拿到 `剧情模块接口约定.md` 和本文，全局负责人能否开始开发状态、存档和流程协调器？

审核标准：

- 起始 Node、结束 Node 和全部出口是否明确；
- 每个 Node 何时完成是否能由事实判断；
- 每个事实由谁产生是否明确；
- 外部任务、返回事件和即时奖励是否能一一对应；
- 任意顺序对话、读档和重复结算是否有确定处理方式；
- 是否还需要全局负责人猜剧情含义。

**审核结论：足够开发。** 全局负责人不需要猜测起点、出口、完成条件、事实来源、即时效果、并行任务或初始检查点，可以开始实现状态、存档和流程协调器。

审核中发现并修正了四项原设计缺口：

1. 增加 `onReach`，使三名村民能够各自完成、各自发放地图碎片；
2. 增加 handoff 的 `startWhen`，防止说明对话早于白灯出现等顺序错误；
3. 增加 `CLUE_RECORDED`，让老宅调查结果进入线索记录而不是被当成普通物品；
4. 明确初始背包和无标记钥匙，消除旧 PRD 与 `剧情Node推进.md` 的冲突。

最终反查结果：11 个 Node ID 唯一；10 条出口都指向已登记 Node；30 个事实 ID 唯一且都有唯一产生模块；P00—P08、V00—V14、O00—O09 均被覆盖一次，没有遗漏或重复归属。

联调前仍要把团队公共约定中“状态模块直接设置下一 Node”的旧示例删掉，并登记 `NPC_TALK_PROGRESS`、`CLUE_RECORDED` 等新增事件。这是公共文档同步工作，不影响全局负责人按本文开始开发。
