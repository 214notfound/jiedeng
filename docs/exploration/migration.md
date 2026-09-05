# 新剧情合同迁移说明

优先依据本次提供的《剧情模块接口约定》V1.0、《V1 剧情运行 Node 清单》V1.0，以及聊天中“每个根目录按模块建子目录”的约定。旧 PRD 的通用可访问性、反馈、背包、成就与保存验收仍适用；以下剧情内容按新 Node 清单替换。

| 旧版 | 本版 |
| --- | --- |
| assets/js/game、assets/js/data | assets/js 一级只保留 exploration 与 achievements；对话、共用工具和组合适配归 exploration 子目录 |
| assets/css 下直接放模块文件 | assets/css/exploration 与 assets/css/achievements |
| assets/images/items | assets/images/exploration/items |
| docs 根下混放模块说明 | docs/exploration 与 docs/achievements |
| test/game | test/exploration 与 test/achievements |
| pages/game.html、pages/achievements.html | pages/exploration/game.html、pages/achievements/achievements.html |
| 刻有 A 的钥匙作为初始热点 | 无标记旧钥匙，由小 X 交付；技术 ID 仍为 key-a |
| badge-b、warning-tape | burned-work-id、blue-glass-bead |
| 初始空背包，点击取得三件物品 | 初始工作证和玻璃珠已在背包，但未调查；钥匙稍后提交奖励 |
| 录音带查看再播放 | 工作证和玻璃珠调查后，与小 X 交谈交钥匙 |
| 地图成功直接进老宅 | 地图成功后出现 go-old-house，玩家选择后才推进 |
| OBJECT_INVESTIGATED 使用旧动作 ID | objectId 使用对象 ID，并带 eventId/causedByCommandId/resultFactIds |
| 只按 npcId 记录谈话 | conversationId + npcId；支持 NPC_TALK_PROGRESS |
| 视图接到成功即认为奖励已获得 | 只读取事务提交后的 inventory/clues |
| 成就依赖 puzzle.mapRestored 等旧字段 | 成就模块按 map-puzzle-completed 事实生成待提交解锁事件 |
| onLeave 自行决定下一阶段 | 移除，由协调器执行剧情 presentation.actionId |

这是内容与协议迁移，不是把旧录音带重命名为玻璃珠。旧存档事实不能自动改名重用。演示采用新键 jiedeng:demo:engine-handoff:v3:<storageScope>，保留旧键原值，不覆盖旧演示进度；正式旧档迁移由剧情/存档负责人提供规则。

## 保留的功能

灰度界面、物体/人物分区、方向键与 WASD 位移、近处 E/Enter 调查、可聚焦热点、回读与防重复、具体缺项提示、两类背包、图片详情和关闭焦点恢复、独立成就页、刷新演示恢复、错误反馈、页面清理均保留。对话改为独立子包，保留先展示再确认、可选追问和取消/失败事实回报；成就仍独立判定。

没有把过时的录音带、A 字钥匙素材和旧阶段推进代码并存进新包。旧包可留作外部备份，但不要同时复制到仓库。本包不提供覆盖团队 assets/js/game-line、authorize、core、minigames、主菜单和首页的文件。真实引擎原样快照只放在测试目录，供验收复现。

## 剧情 ID 与边界

11 个 Node：prologue-wake、prologue-belongings、prologue-white-lamp、village-arrival、village-inquiries、village-map-and-route、old-house-entry、old-house-investigation、old-house-clue-confrontation、old-house-call-at-door、week-one-end。

场景 shrine/village/old-house 与阶段 prologue/village/old-house 不混用。调查事实与对话事实的生产者分别为 exploration 和 conversation。人物为 companion-x、villager-1/2/3、unknown-caller。热点文字用人物特征，不用同一个“人”字替代所有角色。

新版明确要求 old-house-clue-confrontation 后再 old-house-call-at-door，最后确认 week-one-end。不会揭露 A/B/白灯客三重身份答案。story-line 最新接入说明已明确主动取消 V1 的 trust-x/doubt-x 选项，不再把它列为漏做项。

## 接入准备

同名 game.js 只要位于不同模块目录并不会造成 Git 文件冲突，真正要避免的是跨模块重写同一文件和双方同时控制 Node。当前目录已按模块隔离。最后接入团队共享页面时，按本包 interface.md 把外部事件交给协调器；不可直接把 demo-host 当作正式 core。

## 从当前仓库目录迁移

- assets/js/exploration/date 拼写应为 data。本包已使用 data；旧 date 中仍是旧剧情，不要仅重命名后与新版混用。
- 当前 pages/exploration/game.html 的 ../assets 路径少一层，本包已改为 ../../assets，并包含资源所属模块目录。
- 当前 pages/exploration/achievements.html 迁到 pages/achievements/achievements.html，成就 JS/CSS 分别迁到 assets/js/achievements 和 assets/css/achievements。
- 当前脚本匹配 /pages/game.html 的演示条件也已改成 /pages/exploration/game.html；不再依赖缺失的 test/game/fixtures/demo-session.js。
- 旧 docs/exploration-achievements-interface.md 中 type/payload、直接推进 stage、地图同时结算成就的约定已失效，由本包 exploration、conversation、achievements 三份接口说明替代。

手动合并时先在仓库之外备份旧模块，再逐个比较本包文件。确认旧文件没有其他模块引用后，才由仓库维护者移除旧 date、旧成就页面/脚本以及旧接口文档。不要递归删除整个 assets、pages、docs、test，也不要改动 test/authorize 或队友 demo。
