# 剧情目标与探索事实对照

本表从探索与对话两个数据目录核对，基准为新版 V1 Node 清单。动作 ID 是界面内部标识，不是剧情 actionId。正式事件携带收到的 commandId，不重新创建命令。OBJECT_INVESTIGATED 由探索模块生产，NPC_TALKED 由独立对话子包生产。

| Node | handoff / 目标 ID | 内部动作 ID | 完成事实 | 事件 |
| --- | --- | --- | --- | --- |
| prologue-wake | prologue-briefing | surface-briefing | surface-investigation-task-known | NPC_TALKED |
| prologue-belongings | shrine-belongings | burned-work-id | burned-work-id-investigated | OBJECT_INVESTIGATED |
| prologue-belongings | shrine-belongings | blue-glass-bead | blue-glass-bead-investigated | OBJECT_INVESTIGATED |
| prologue-belongings | prologue-key-and-memory | receive-key | key-a-given-by-x | NPC_TALKED |
| prologue-belongings | prologue-key-and-memory | ask-memory-and-receive-key | key-a-given-by-x<br>x-deflects-memory-question-noticed | NPC_TALKED |
| prologue-white-lamp | prologue-lamp-incident | lamp-incident | prologue-lamp-incident-understood | NPC_TALKED |
| village-arrival | village-arrival-observation | village-decline | village-decline-observed | OBJECT_INVESTIGATED |
| village-arrival | village-arrival-observation | su-he-notice | su-he-missing-notice-observed | OBJECT_INVESTIGATED |
| village-inquiries | village-shopkeeper-inquiry | shopkeeper-inquiry | shopkeeper-inquiry-completed | NPC_TALKED |
| village-inquiries | village-holdout-inquiry | holdout-inquiry | holdout-inquiry-completed | NPC_TALKED |
| village-inquiries | village-elder-inquiry | elder-inquiry | elder-inquiry-completed | NPC_TALKED |
| old-house-entry | old-house-door | old-house-door | old-house-door-opened | OBJECT_INVESTIGATED |
| old-house-investigation | old-house-clues | old-photograph | old-photograph-clue-known | OBJECT_INVESTIGATED |
| old-house-investigation | old-house-clues | school-uniform | school-uniform-clue-known | OBJECT_INVESTIGATED |
| old-house-investigation | old-house-clues | height-marks | height-marks-clue-known | OBJECT_INVESTIGATED |
| old-house-investigation | old-house-clues | funeral-list | funeral-list-clue-known | OBJECT_INVESTIGATED |
| old-house-clue-confrontation | old-house-clue-confrontation | identity-conflict | old-house-identity-conflict-raised | NPC_TALKED |
| old-house-call-at-door | old-house-door-call | door-call | door-call-incident-completed | NPC_TALKED |

同一探索 handoff 可以报告多个对象；对话先显示、确认后报告。当前引擎不接受可选记忆事实；追问对白保留，但只报告交钥匙事实。详情见 engine-compatibility.md 和 ../conversation/interface.md。

## 地图交接

village-map-and-route 的 map-puzzle 命令交给小游戏模块；成功由该模块发 MAP_PUZZLE_COMPLETED，source=minigame，payload.puzzleId=map-puzzle，resultFactIds=[map-puzzle-completed]。三块碎片必须已获得。探索不模拟正式地图成功；仅演示入口使用确认框注入测试事件。

## 剧情操作（不是探索事件）

以下由正式剧情 presentation 渲染，回传 actionId 给协调器；演示夹具仅模拟这些按钮。

| Node | actionId | 剧情负责记录的事实 |
| --- | --- | --- |
| prologue-wake | confirm-wake-context | prologue-wake-context-known |
| prologue-white-lamp | confirm-white-lamp | white-lamp-witnessed |
| prologue-white-lamp | leave-shrine | leave-shrine-chosen |
| village-map-and-route | go-old-house | old-house-route-chosen |
| week-one-end | confirm-week-one-end | week-one-end-acknowledged |

## 命令与奖励

本清单 handoff ID 与目标 ID 对应，运行时命令为 cmd-{nodeId}-{handoffId}。例如 cmd-prologue-belongings-shrine-belongings。正式命令仍来自已提交的剧情响应。

调查/谈话完成不直接增加背包。剧情 onReach/onComplete 的奖励和检查点由状态模块事务提交；地图事实提交后成就模块独立判断解锁。
