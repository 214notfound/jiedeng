# V3 场景资源、ID 对照与接入进度

- **版本：** 1.1（PR57 合入后的本地实施状态）
- **交付来源：** 杨梦《场景及效果汇总》、图片汇总、第二批草图
- **整理 / 探索侧负责人：** 卢正松
- **用途：** 冻结美术资源到剧情、探索、对话、小游戏接口的对应关系，并记录当前任务完成度

## 1. 当前结论

杨梦本批交付已通过静态接收检查：26 张正式 JPG 全部为 1280×720，覆盖 16 类场景结构、3 个小游戏的入口/出口、证据处置背景和 5 个独立结局。草图、标注稿与交付模板共 78 份，已作为追溯材料单独保存。

PR57 的公共 V3 运行时已合入本地 `V3-exploration`。本分支现已完成素材入库、资源 ID 对照、10 个探索 handoff、1 个对话 handoff、3 个小游戏入口与结果回传、五个结局场景映射，以及第一条外围调查 Hub。正式状态、剧情与交互模块的自动化纵向链已从 `week-one-end@1` 迁移并运行到《不再借灯》结局。

尚不能宣称最终交付完成：真实浏览器桌面/390px 视觉、键盘焦点、五条结局逐条人工截图与音频配置仍需三方验收；三个小游戏按 PRD 只实现入口和结果回传，没有扩展具体玩法。

## 2. 任务清单完成度

| 序号 | 原任务 | 当前状态 | 已完成 | 仍需完成 / 对接人 |
| --- | --- | --- | --- | --- |
| 1.1 | 接收并检查杨梦场景交付 | **完成** | 26 张正式图尺寸、数量、类别检查；78 份草图/模板归档 | 杨梦只需处理后续视觉整改 |
| 1.2 | 场景、目标与资源 ID 对照 | **完成** | 26 个 `assetId` 已登记；第一条链及 14 个 V3 handoff 可追溯 | 若剧情改 `targetId`，需剧情负责人先走变更确认 |
| 1.3 | 对象与 NPC 规则冻结 | **完成（接口层）** | 拍点与运行时 ID 分离；完成对象采用聚合 `objectId`；`companion-x` 职责已区分 | 多热点存档事实尚未登记，不能擅自拆分完成事件；对接高冰轩/剧情 |
| 1.4 | 第一条外围链资源与功能 | **完成（自动化）** | Hub 四入口只导航；山腰图和聚合对象已接入；阅读结束后只提交一次 | 高冰轩/杨梦做正式浏览器截图验收 |
| 1.5 | 正式页面接入与浏览器验收 | **部分完成** | 正式控制器已接 V3 阅读、场景和小游戏入口；契约测试通过 | 缺真实浏览器桌面、390px、焦点和失败重试人工验收；高冰轩主责 |
| 2 | 外围其余三条调查 | **完成（自动化）** | 村委、小学、邮电所场景、聚合阅读和事实回传已接入 | 杨梦按正式截图整改；高冰轩验收保存/重试 |
| 3 | 身份重建与矿井 | **完成（PRD 范围内自动化）** | 控制室、诊所两层、父亲旧屋两层、匿名藏点、矿井路线入口/出口、死亡现场均接入 | 三个小游戏的具体玩法不在本阶段 PRD；真实浏览器验收待高冰轩 |
| 4 | 五结局与终局 | **完成（自动化）** | 服务器、小周回收对话、交付/拒绝、追逐双结果、证据处置和五张结局图均已连通 | 五结局逐条人工截图、成就页面视觉验收待高冰轩/杨梦 |
| 5 | 存档、音频、移动端总验收 | **部分完成** | V3 中途保存/读取、待办恢复及完整公开纵向链自动化通过 | 音频配置尚未交付；移动端、焦点、错误存档和五路径浏览器验收待高冰轩，卢正松配合 |

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

## 6. 下一步交接

1. 卢正松在 `V3-exploration` 完成本地代码复核、全量非浏览器测试和提交，不直接推远端。
2. 高冰轩从正式 `pages/game.html` 验收桌面与 390px：外围 Hub、两类第二层场景、三种小游戏入口/出口、五个结局、关闭后焦点和失败重试。
3. 杨梦根据上述正式页面截图确认裁切、安全区、文字遮挡和五个结局画面；只做视觉整改，不改变运行时 ID。
4. 杨梦补交音频文件与切换点；高冰轩接全局音频，卢正松只核对业务触发位置。
5. 浏览器验收通过后，再由用户决定是否推送分支和创建 PR。

## 7. 不得误做

- 不覆盖现有 V2 `village.png`；V3 Hub 必须使用独立 variant。
- 不把导航入口当探索完成事件。
- 不把草图拍点编号当 `objectId`。
- 不在探索模块写 `nextNodeId`。
- 不在小游戏中继续使用旧 `MAP_PUZZLE_COMPLETED`；V3 使用 `MINIGAME_RESOLVED`。
- 不因素材齐全就宣称 V3 功能已经可玩；正式页面接入和浏览器验收仍是独立完成条件。
