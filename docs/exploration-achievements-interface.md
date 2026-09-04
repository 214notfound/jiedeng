# 《借灯》探索与成就模块接口说明

当前分支布局为 assets/css、assets/js、assets/images、pages、docs、test。新增适配事项与实际分支检查见 [分支接入检查](branch-integration.md)；旧根目录 css/js 提交包不适用于此分支。

背包统一导入入口为 assets/js/game/inventory.js，原样导出 mountInventory（参数、返回与错误处理同本文背包视图章节），没有新增存储。exploration-prologue.js 仅保存本模块调查数据，不替代剧情负责人维护的 prologue.js。

适用范围：R09 探索、R10 村民对话、R12 背包、R16 成就。V1 到陈家老宅第一次隔门呼名为止。本文对应 exploration.js 新入口，不对应旧 game.html 的独立存储协议。

## 当前交付状态

交付包含两个模块：探索 R09/R10/R12，以及成就 R16。成就有独立页面 pages/achievements.html、只读服务和页面入口。正式账户、存档、剧情壳和 R13 拼图接入待联合验收。

跨页面演示使用独立标签页记录，刷新保留。本包同时提供 pages/game.html 和 pages/achievements.html 及各自控制器。账户 Demo、公共 core 和旧存档不在本次修改范围。同路径若已有共享页面或旧控制器，须比较后整合，保留剧情、菜单、保存等成员已接入的内容。

目录沿用 assets/js/data、assets/js/game、assets/css、assets/images、pages、docs。账户保留实际 authorize 路径。本提交不覆盖团队公共约定文件；草案中的单用户单存档与 PRD 隔离要求冲突，仍按账户 storageScope 区分。草案中的 applyGameEvent 是示例，不是已接通的宿主。

## 1. 职责边界

| 本模块负责 | 由其他模块负责 |
| --- | --- |
| 物体热点、行走视点、前置条件、调查和回读 | 全局阶段推进、剧情分支、返回菜单 |
| 村民对话动作和首次碎片奖励请求 | 主剧情节点和信任选择 |
| 物品／线索碎片查询、图片详情、关闭恢复焦点 | 唯一全局状态、保存／读取、旧档迁移 |
| 成就状态展示、一次提示 | 地图真实玩法、完成真实性、全局成就结算 |
| 本模块快照一致性校验与局部界面清理 | 账户验证、身份变更通知、存储失败处理 |

正式业务服务不读取账户列表、密码摘要或浏览器存储，不持有另一份可写进度。探索视图只追加和删除自己的子容器，不替换 game-scene 等共享区域，不写 game-story。game-page.js 是页面组合入口，负责 feedback、保存按钮回调和生命周期；保存仍交由注入函数完成。独立成就页维护自己的列表与错误提示。

## 2. 合并联调时必须确认

| 负责人 | 需提供或确认 |
| --- | --- |
| 账户／入口 | 等待异步 window.WhiteLamp.auth.getSession() 成功后取得 storageScope；失败显示错误，data 为 null 时进入登录流程 |
| 状态／存档 | getContext、dispatch、subscribe 的同步内存接口；账户域校验；事件原子更新；实际持久化与恢复 |
| 剧情 | 当前 stage 投影、必要动作清单、NPC_TALKED.interactionId、onLeave 的节点推进 |
| R13 地图 | openMap 入口、真实完成事件、重复提交幂等；不能用演示确认框代替玩法 |
| 全局提示 | 成就解锁提示唯一负责方；全局已提示时视图设置 notifyUnlocks:false |
| 公共样式／页面 | 指定挂载容器、模块外部 CSS、与公共组件叠加后的视觉验收 |

正式宿主未交付前，不能把下面的输入契约写成全队已经存在的接口。账户文档中的 white-lamp 存档键只是示例，不能当作已确认存档 API。

## 3. 宿主输入接口

创建方式：createExploration({ getContext, dispatch, subscribe })。三个参数必须是函数，返回服务对象；读取快照，写入请求只交给宿主。

| 接口 | 参数 | 返回及错误 |
| --- | --- | --- |
| getContext() | 无 | 同步 { storageScope, state }；不可读取时抛错，不回退游客 |
| dispatch(event, meta) | 事件对象；meta 为 { storageScope } | 同步 { ok:true } 或 { ok:false,message }；异常可抛出。Promise 不受支持 |
| subscribe(listener) | 无参数回调 | 返回取消订阅函数。完整状态更新后通知，身份变化也必须通知 |

dispatch 的成功含义是内存状态已经原子更新，动作与奖励同时可读；不是宣称磁盘保存成功。宿主必须比较 meta.storageScope 与当前身份，并在写入前自行复核前置条件和奖励白名单。异步磁盘保存由存档负责人另行处理并显示结果，不能让本模块猜测保存是否成功。

失败应不改变进度。异步返回、抛错、格式错误、失败却落账或成功未落账时，本实例暂停后续操作，等待重新载入有效状态。模块不能回滚宿主已发生的写入。订阅异常会记录控制台错误，不中断其他订阅；取消订阅幂等。

state 最小投影：

```js
{
  stage: "prologue", // prologue | village | old-house | week-one-end
  investigated: [], // 动作 ID，包含对白 interactionId
  inventory: [], // 物品 ID
  puzzle: { mapRestored: false },
  achievements: [], // 成就 ID
  achievementTimes: {} // 可选：成就 ID -> ISO 时间字符串
}
```

currentNodeId 等额外字段由宿主管理。本模块不修改也不要求完整存档只包含这些字段。三个 ID 数组须为不重复的字符串数组；允许其他模块的 ID，但列表只展示本模块目录内已获得物品。若全局结构不同，在 getContext 中投影，不另存进度。

校验包括：记录的前置动作和奖励一致；祠堂完成后才可到村口；地图完成后才可到老宅；不得提前完成未来场景动作；地图标记、完整地图、map-restorer 成就一起存在；提供的成就时间必须可解析。其他模块字段不会被删改。本校验器不是全游戏存档校验器，也不是防作弊或账户认证边界：完整伪造的本地快照不能靠前端证明其历史真实性。

账户 storageScope 为 guest 或 account:<userId>。实例绑定创建时的域；身份改变或通知时无法确认身份，旧实例停止读写，视图清空。宿主必须先卸载旧视图、dispose 旧实例，再读取新身份存档并重新创建；不能先切换账户却继续使用旧实例。

## 4. 事件和数据流

| 行为 | 事件 | payload |
| --- | --- | --- |
| 调查／播放 | OBJECT_INVESTIGATED | { objectId, itemId? } |
| 小X／村民对白 | NPC_TALKED | { npcId, interactionId, rewardItemId? } |
| R13 真实成功后提交全局 | MAP_PUZZLE_COMPLETED | { puzzleId:"map-puzzle" } |
| 全局对外通知成就 | ACHIEVEMENT_UNLOCKED | { achievementId:"map-restorer" } |

本模块只发出前两类。地图入口回调只打开游戏，不宣布完成。成就视图读取全局状态，不再发送解锁写入事件。ITEM_ACQUIRED 如由全局发出属于通知，不应再次发放同一物品。

objectId 是动作 ID，不是布局热点 ID。例如 prologue-take-key-a，钥匙来源是祠堂，不采用草案示例中的 old-house-door。小X两段对白共享 companion-x，但 interactionId 不同，必须分别记录；只记录 NPC ID 会吞掉第二段对白。

MAP_PUZZLE_COMPLETED 由全局验证村民与碎片条件后，一次更新 mapRestored、restored-village-map、map-restorer、解锁时间和阶段。所有订阅应在完整更新后通知。物品与成就只首次结算；重复调查只回读文本，不发事件。

目录查询 getScenes() 提供动作、前置条件、completionInteractionIds；getItems() 提供 id、name、image、description、source、layer，不含运行时获得状态。服务 listItems() 按当前状态过滤并补充 obtained:true，玩家界面只用该查询，避免泄露未获得线索。

共同 ID：companion-x；villager-1/2/3；key-a、badge-b、warning-tape；map-fragment-1/2/3、restored-village-map；old-photograph、school-uniform、height-marks、funeral-list；map-restorer。新增动作和 badge-b/warning-tape 等补充项仍需全组确认。素材使用同名 SVG，不将扩展名伪装成 PNG。

录音带先查看再播放；小X先初次交谈，再按白灯条件追问；出口与断电行为接续；三村民可任意顺序；老宅先开门再核对四类线索，最后呼名。同一物体的连续动作共用一个热点，完成后替换下一动作；其他热点保持独立。原剧情目录中的旧 ID 由 exploration.js 单向转换，不自动迁移旧存档。

## 5. 公开服务方法

除 interact 将运行失败转换为结果外，读取／配置错误会抛异常；界面层负责显示错误。未知场景、非法分类、无效快照、身份变化、已卸载都不可当作空数据继续。

| 方法及参数 | 返回 | 用途 |
| --- | --- | --- |
| getCurrentSceneId() | 场景 ID | 结束状态 week-one-end 映射为 old-house 回读 |
| getSceneView(sceneId) | 场景对象与 interactions；含 unlocked、available、completed | 展示动作 |
| getExitStatus(sceneId) | { canLeave, message } | 未完成时列出当前可做的必要动作；村口提示拼图 |
| interact(sceneId, interactionId) | { ok, message, firstTime?, speaker? } | 首次提交或重复回读；错误不创建替代状态 |
| listItems(layer?) | 目录对象数组，obtained:true | 可选 items/clues；只返回已获得内容 |
| listAchievements() | 成就数组，含 unlocked、unlockedAt | 未解锁时间为 null |
| canStartMapPuzzle() | boolean | 三人、碎片、阶段条件齐全且地图尚未完成 |
| subscribe(listener) | stop() | 订阅宿主变化，stop 可重复调用 |
| dispose() | undefined | 解除所有订阅，重复调用安全 |

示例（exploration 是已创建实例）：

```js
const result = exploration.interact("prologue", "prologue-take-warning-tape");
showFeedback(result.message, result.ok ? "success" : "warning");
const collected = exploration.listItems("items");
const exit = exploration.getExitStatus("prologue");
```

getSceneView 返回目录文本供渲染，不是剧情保密 API。UI 只呈现当前开放且适合当前进度的动作。

## 6. 界面接口与退出清理

| 导出 | 参数 | 返回 |
| --- | --- | --- |
| mountExploration | { module, sceneRoot, actionsRoot, inventoryRoot, showFeedback, openMap, onLeave? } | unmount() |
| mountInventory | { module, root, showFeedback } | unmount() |
| mountAchievements | { module, root, showFeedback, notifyUnlocks? } | unmount() |

探索视图已挂载背包，不要在同一背包区域再挂一次。独立背包导出供其他页面按需使用。成就可从 achievements-view.js 导入，也可从 exploration-view.js 重导出入口导入。

showFeedback(message, kind) 的 kind 为 success/warning/error；必须同步处理消息，其抛错会使用本模块可见备用提示。openMap(puzzleId) 和 onLeave(sceneId) 可同步或返回 Promise，失败会显示错误。onLeave 缺失时无法真正离开，必须在正式入口接好。不要在页面卸载后让外部异步任务继续修改已销毁的游戏壳。

notifyUnlocks 默认 true。同一 module 实例多视图只有一个负责提示；读档挂载不重播历史成就。若不同页面实例或全局统一提示，由入口指定唯一通知方，其他传 false。

入口示意（所有 host 和回调由对应负责人实现，不是可独立运行脚本）：

```js
import { createExploration } from "./exploration.js";
import { mountExploration, mountAchievements } from "./exploration-view.js";

const exploration = createExploration(host);
const removeExploration = mountExploration({
  module: exploration,
  sceneRoot: document.getElementById("game-scene"),
  actionsRoot: document.getElementById("game-actions"),
  inventoryRoot: document.getElementById("inventory-panel"),
  showFeedback,
  openMap,
  onLeave
});
const removeAchievements = mountAchievements({
  module: exploration,
  root: achievementContainer,
  showFeedback,
  notifyUnlocks: false // 示例：全局已负责解锁提示
});
function teardown() {
  removeExploration();
  removeAchievements();
  exploration.dispose();
}
```

页面加载 assets/css/exploration.css。所有样式限定 .exploration-module，使用外部 CSS、语义 button、可见焦点、aria 状态和原生 dialog。方向键/WASD 移动视点，E/Enter 调查近处目标；Tab 是无需行走的可访问入口。当前是二维灰度探索布局，不是三维第一人称场景。

背包详情可用关闭按钮或 Escape 关闭，焦点返回物品卡片；显示图片失败时保留说明。卸载仅清除本模块节点与订阅，不删除共享区域或队友节点。模块无外部框架依赖；structuredClone、dialog 和 ES modules 需要现代浏览器。

## 7. 演示内容与移除前提

test/game/exploration-demo.html 与 test/game/achievements-demo.html 可往返。两个演示入口通过 test/game/fixtures/demo-session.js 读取同一标签页的 sessionStorage，唯一键为 jiedeng:demo:exploration-achievements:v1。记录仅供演示，不读取或迁移正式账户存档。刷新保留，关闭标签页通常清除；浏览器恢复标签页时可能保留。

确认框只模拟地图成功。演示的跨页与刷新验证不能替代真实 R13、账户隔离及正式保存验收。坏记录或存储异常会报错，不覆盖原记录。

正式游戏入口、状态宿主、真实地图、账户与保存恢复全部通过联调后，可移除两个演示 HTML、两个演示 JS，并在两个页面控制器中一起移除 demo 查询参数入口；测试 fixture 保留用于自动测试。正式 game.html、achievements.html 和两个模块必须保留。不要删除账户负责人 Demo；共享游戏页需逐段整合。旧档迁移由存档负责人备份后处理。

## 8. 运行、测试与提交

在项目根运行静态服务器：

```powershell
py -m http.server 8000
```

访问 http://localhost:8000/test/game/exploration-demo.html；也可使用 VS Code Live Server，不能仅双击 HTML。

Node 24 下运行随包测试：

```powershell
node --test test/game/contract.test.mjs test/game/adversarial.test.mjs test/game/achievements.test.mjs test/game/demo-session.test.mjs
```

不覆盖团队 package.json；项目若明确配置 CommonJS，请由负责人调整 ES Module 配置或以 node --experimental-default-type=module --test 执行上述测试文件。可选浏览器脚本及验收步骤见 [验收记录](acceptance.md)。提交顺序见 [上传清单](github-upload.md)。

模块按数据、校验、服务、探索视图、背包视图、成就视图拆分，修改规则不需要改页面，修改样式不需要改存档。接口依赖明确但并非零耦合：全局快照、同步提交语义、ID 和阶段协议必须共同维护。

## 9. R16 独立成就页面接入

正式页面：pages/achievements.html。页面样式：achievements.css；页面入口：achievements-page.js。只读服务位于 achievements.js，目录位于 data/achievements.js。成就服务不导入探索服务、场景目录或写入接口。

createAchievements({ getContext, subscribe }) 返回 listAchievements()、subscribe(listener)、dispose()。getContext 同步返回 storageScope 及最小 state：{ achievements:[], puzzle:{ mapRestored:false }, achievementTimes:{} }。achievementTimes 可省略；不要求 stage、inventory 或 investigated，更不要求 dispatch。只校验成就 ID 数组、地图完成与成就记录一致性、可选解锁时间；来源与全局事件真实性由全局负责人验证。错误抛出，由页面显示。身份变化后的实例不可复用。

mountAchievementsPage({ host, documentRoot? }) 中 host 提供上述两个函数，documentRoot 默认为 document；返回可重复调用的卸载函数。初始化失败会显示错误并抛出异常；重复挂载会先清理旧实例；页面离开时清理，浏览器往返缓存恢复时重新校验。页面禁用解锁弹窗，避免读档或刷新时重复通知。

正式页的游戏壳入口应在异步读取当前会话、加载对应存档成功后调用：

```js
import { mountAchievementsPage } from "./achievements-page.js";

// restoredHost 由全局入口在会话与存档读取成功后提供。
const unmount = mountAchievementsPage({ host: restoredHost });
// 全局入口在注销或切换身份前调用 unmount()，再加载新身份。
```

该调用示意由入口负责人整合到自己的页面脚本。当前交付没有实现 restoredHost；直接访问尚未接入宿主的正式页会显示无法读取提示，不假装当前账户成就全锁定。验收演示可打开 test/game/achievements-demo.html 查看，并由探索演示导航跳转。

本包 game.html 已提供 achievements.html 链接，成就页返回 game.html。共享页负责人整合时保留这两个方向的导航。demo=1 仅打开专用演示进度，不调用账户接口切换身份，不覆盖正式数据。

## 10. R09/R10/R12 游戏页面接入

正式页面 pages/game.html，外部样式 game.css 与 exploration.css，页面入口 game-page.js。

mountGamePage({ host, openMap?, onLeave?, saveProgress?, documentRoot? }) 返回可重复调用的卸载函数。host 提供 getContext、dispatch、subscribe；documentRoot 默认为 document。openMap(puzzleId) 和 onLeave(sceneId) 含义同探索视图接口；未提供时点击相应操作会显示暂不可用，正式联调必须补齐。

saveProgress() 可同步或返回 Promise，结果必须为 { ok:boolean, message?:string }。未提供函数时保存按钮禁用；保存期间阻止重复提交，失败可见，卸载后不再显示异步返回。该函数由存档负责人提供，必须自行绑定和复核 storageScope，承担真实写入与错误处理；页面不实现存储。

页面启动会创建探索服务和独立成就服务。成就预览负责新解锁提示，独立成就页不重播通知。重复挂载先清理旧实例；卸载保留共享区域和剧情内容；浏览器往返缓存恢复时重新校验状态。

```js
import { mountGamePage } from "./game-page.js";

// 以下对象与回调由账户、存档、剧情和地图负责人提供。
const unmount = mountGamePage({
  host: restoredHost,
  openMap: openRealMap,
  onLeave: continueStory,
  saveProgress: saveCurrentGame
});
// 更换身份之前调用 unmount()，再读取新身份的进度并重新挂载。
```

通过静态服务器访问 pages/game.html?demo=1 可直接体验本包页面。其成就链接指向 pages/achievements.html?demo=1，返回继续原演示进度。演示模式的保存按钮禁用，演示动作由专用宿主保留在当前标签页，不充当正式保存功能。

不带 demo 参数的页面等待正式入口注入恢复后的宿主；未注入时显示无法读取，而不会把缺失账户当成游客新游戏。地图仍须真实 R13 联调。
