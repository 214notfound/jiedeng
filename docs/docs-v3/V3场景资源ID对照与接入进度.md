# V3 场景资源、ID 对照与接入进度

- **版本：** 1.0
- **交付来源：** 杨梦《场景及效果汇总》、图片汇总、第二批草图
- **整理 / 探索侧负责人：** 卢正松
- **用途：** 冻结美术资源到剧情、探索、对话、小游戏接口的对应关系，并记录当前任务完成度

## 1. 当前结论

杨梦本批交付已通过静态接收检查：26 张正式 JPG 全部为 1280×720，覆盖 16 类场景结构、3 个小游戏的入口/出口、证据处置背景和 5 个独立结局。草图、标注稿与交付模板共 78 份，已作为追溯材料单独保存。

本次已经完成“一级任务”中可以独立完成的部分：素材入库、稳定英文文件名、场景与 `targetId` / `endingId` 对照、第一条外围调查链的资源契约和自动检查。尚未把图片直接挂到正式页面；该动作依赖公共 V3 运行时基线，必须在最新 `release-v3` 合入并复核后继续，不能通过替换 V2 `village` 默认图来绕过。

## 2. 任务清单完成度

| 序号 | 原任务 | 当前状态 | 已完成 | 仍需完成 / 对接人 |
| --- | --- | --- | --- | --- |
| 1.1 | 接收并检查杨梦场景交付 | **完成** | 26 张正式图尺寸、数量、类别检查；78 份草图/模板归档 | 杨梦只需处理后续视觉整改 |
| 1.2 | 场景、目标与资源 ID 对照 | **完成** | 26 个 `assetId` 已登记；第一条链及 14 个 V3 handoff 可追溯 | 若剧情改 `targetId`，需剧情负责人先走变更确认 |
| 1.3 | 对象与 NPC 规则冻结 | **完成（接口层）** | 拍点与运行时 ID 分离；完成对象采用聚合 `objectId`；`companion-x` 职责已区分 | 多热点存档事实尚未登记，不能擅自拆分完成事件；对接高冰轩/剧情 |
| 1.4 | 第一条外围链资源准备 | **完成** | Hub 图、山腰图、四入口映射与首个目标资源齐全 | 运行时 Hub/子场景投影及阅读后提交尚待编码 |
| 1.5 | 正式页面接入与浏览器验收 | **未完成** | 已有测试可保证资源存在和尺寸正确 | 高冰轩确认公共状态/存档/页面基线；卢正松再接场景与热点；三方浏览器验收 |
| 2 | 外围其余三条调查 | **素材完成，功能未开始** | 村委、小学、邮电所正式图已入库 | 卢正松实现调查内容；高冰轩联调；杨梦按截图整改 |
| 3 | 身份重建与矿井 | **素材完成，功能未开始** | 对应 10 张正式图已入库 | 卢正松接探索/小游戏结果；高冰轩做状态恢复与页面验收 |
| 4 | 五结局与终局 | **素材完成，功能未开始** | 证据处置、追逐 3 状态、5 个结局图已入库 | 卢正松接结果；高冰轩接统一阅读/选择/成就；杨梦视觉验收 |
| 5 | 存档、音频、移动端总验收 | **未开始** | 场景图统一为 16:9，可进入验收 | 高冰轩主责；杨梦提供音频；卢正松配合业务状态复测 |

## 3. 场景与接口对照

| 美术 assetId | sceneId | variantId | 对应业务接口 |
| --- | --- | --- | --- |
| `outer-investigation-hub` | `village` | `outer-investigation-hub` | 外围四个探索 `targetId` 的导航 Hub |
| `mountain-routes` | `mountain-routes` | `default` | `investigate-gorge-and-grave` |
| `project-records` | `project-records`（`village` 子场景） | `default` | `investigate-project-records` |
| `su-trail` | `su-trail`（`village` 子场景） | `default` | `investigate-su-trail` |
| `white-lamp-mail` | `white-lamp-mail`（`village` 子场景） | `default` | `investigate-white-lamp-mail` |
| `haunting-network-entry/exit` | `haunting-network` | `entry/exit` | `haunting-network-puzzle` |
| `mine-control-room` | `mine-control-room` | `default` | `investigate-control-room` |
| `old-clinic-environment/detail` | `old-clinic` | `environment/detail` | `investigate-old-clinic` |
| `father-house/hidden-layer` | `father-house` | `default/hidden-layer` | `investigate-father-and-company` |
| `anonymous-hideout` | `anonymous-hideout` | `default` | `investigate-anonymous-hideout` |
| `mine-route-entry/exit` | `sealed-mine` | `route-entry/route-exit` | `mine-route-puzzle` |
| `su-death-scene` | `sealed-mine` | `su-death-scene` | `investigate-su-death-scene` |
| `company-server` | `data-center` | `server-evidence` | `investigate-company-server` |
| `x-showdown-entry/success/failure` | `data-center` | `showdown-entry/showdown-success/showdown-failure` | `x-recovery-demand`、`x-showdown-chase` |
| `evidence-disposition` | `village-exit` | `evidence-disposition` | 剧情 `evidence-disposition` 选择页背景 |
| `ending-*` 五张 | `village-exit` | 对应 `endingId` | 五个终局 Node |

代码中的唯一资源登记入口为 `assets/js/exploration/data/v3-scene-assets.js`。页面不得根据中文文件名猜场景，也不得扫描目录自动决定剧情状态。

## 4. 对象、拍点与完成事件

杨梦草图中的 `G00`、`R01`、`T06` 等编号只用于文档追溯，不是运行时 `objectId`。在剧情尚未登记中间事实前，一个探索 `targetId` 对应一个聚合完成对象：

| targetId | 当前完成 objectId | 完成事实 |
| --- | --- | --- |
| `investigate-gorge-and-grave` | `investigate-gorge-and-grave` | `a-gorge-thread-complete` |
| `investigate-project-records` | `investigate-project-records` | `project-record-thread-complete` |
| `investigate-su-trail` | `investigate-su-trail` | `su-thread-complete` |
| `investigate-white-lamp-mail` | `investigate-white-lamp-mail` | `white-lamp-first-thread-complete` |
| `investigate-control-room` | `investigate-control-room` | 该 handoff 允许的两个事实 |
| `investigate-old-clinic` | `investigate-old-clinic` | 该 handoff 允许的两个事实 |
| `investigate-father-and-company` | `investigate-father-and-company` | 该 handoff 允许的四个事实 |
| `investigate-anonymous-hideout` | `investigate-anonymous-hideout` | 该 handoff 允许的三个事实 |
| `investigate-su-death-scene` | `investigate-su-death-scene` | 该 handoff 允许的四个事实 |
| `investigate-company-server` | `investigate-company-server` | `full-evidence-package-ready` |

同一场景的多个视觉拍点可以依次构成统一阅读内容，但在中间事实未冻结前，不能让每个拍点各自提交同一个完成事实，也不能只靠 DOM 或内存记录“已经点过”。

## 5. NPC 对照

| NPC | npcId | 出现场景 | 接口职责 |
| --- | --- | --- | --- |
| 小周 / 小 X | `companion-x` | 山腰、控制室、匿名藏点、矿井路线、数据机房 | 只有 `x-recovery-demand` 是 V3 正式对话 handoff；其他画面出现或提示不等于独立剧情对话命令 |

人物如烘焙在背景中，只能作为环境叙事；若需要可点击、换表情或独立焦点，必须改为人物层并由杨梦另交透明素材。

## 6. 第一条链下一步

1. 高冰轩确认最新公共运行时已经支持 V3 事实、存档白名单、`week-one-end@2`、多命令和统一阅读结束回调。
2. 卢正松把 `outer-lines-investigation` 投影为 `outer-investigation-hub` 视觉变体，四个入口只导航、不提交事实。
3. 卢正松接 `mountain-routes` 和聚合对象 `investigate-gorge-and-grave`，阅读完成后只提交一次 `OBJECT_INVESTIGATED`。
4. 高冰轩验证状态拒绝、失败重试、焦点恢复、保存/读档和移动端 `contain`。
5. 杨梦只根据正式页面截图处理构图或安全区整改，不再改运行时 ID。

## 7. 不得误做

- 不覆盖现有 V2 `village.png`；V3 Hub 必须使用独立 variant。
- 不把导航入口当探索完成事件。
- 不把草图拍点编号当 `objectId`。
- 不在探索模块写 `nextNodeId`。
- 不在小游戏中继续使用旧 `MAP_PUZZLE_COMPLETED`；V3 使用 `MINIGAME_RESOLVED`。
- 不因素材齐全就宣称 V3 功能已经可玩；正式页面接入和浏览器验收仍是独立完成条件。
