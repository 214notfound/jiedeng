# 《借灯》V2 游戏页面容器与显隐规则 · H1-A 交接物（v5 交付版）

> **状态**：H1 终稿 · **v5 用户已确认所有决策（含 C4 升格）**，2026-09-08
> **作者**：高冰轩（页面/UI）
> **读者**：罗晨菲（协调器）、卢正松（探索/对话）、于知让（剧情）、杨梦（场景美术）
> **本版本相对 v4 的变更**：
> 1. C4 升格（inventory `<aside>` → `<div hidden>` 覆盖层）从"已建议"升级为"用户最终确认"，状态行打勾
> 2. §十四新增"H1 经验教训"小节，把 C2 画蛇添足的反思落纸（供团队后续 H2+ 复用）
> 3. §十一变更记录补 v5 行

## 优先级与引用文档（按本次交叉自检确定）

1. **罗晨菲《V2界面状态切换约定》§1–§6**（正式页面容器约定，本规范最高优先级）
2. **现状 `pages/game.html` 真实 DOM**（容器 ID 必须已存在或本规范明确新增）
3. **PRD V2 §U1/§U3/§U5/§G1/§G5**（结构与验收原文）
4. **剧情接口约定 V1 §6/§10**（数据契约，无 ID 约束）

> 本规范与罗晨菲 §2 冲突时，以罗晨菲为准并修订本规范。与剧情接口约定无冲突。

---

## 一、H1 已确认决策（A 方案）

| # | 决策点 | 选择 | 依据 |
|---|---|---|---|
| 1 | 容器 ID | **沿用现状 DOM**，不另起新 ID（除确实缺失的 `#detail-root`） | 罗晨菲 §2 + 现状 game.html |
| 2 | 场景层拆分 | **不拆**——`#game-scene` + `#exploration-actions` 现状即可 | 罗晨菲 §2 + exploration-view.js 实现 |
| 3 | 背包形态 | ✅ **升格为覆盖层**——`<aside>` → `<div id="inventory-panel" hidden>`（2026-09-08 高冰轩最终确认 C4）| PRD V2 §U3 共同验收范围 2 |
| 4 | 顶栏 3 入口 | **背包 / 地图 / 成就**（成就用 `<a>` 跳转现有页） | 方案 C 决策 |
| 5 | 章节名 | **顶部常驻**——新增 `#chapter-name` | 章节名 Y 方案 |
| 6 | 反馈条 | **沿用 `#feedback`** | 已存在，无改名必要 |
| 7 | 阅读 DOM | **复用 `#game-story` + `#game-actions`** | U2 阅读组件在现状节点升级 |
| 8 | reading 态开顶栏入口 | **允许**——打开后回 reading 状态本身 | 罗晨菲 §3 + §5.1 |
| 9 | reading 与 4 覆盖层关系 | **正交**——reading 可与 inventory/minigame 共存 | 罗晨菲 §5.1 "打开前状态 reading \| exploration" |

---



## 二、容器结构示意图（ASCII 备份）

```
┌───────────────────────────────────────────────────────────┐
│  #return-menu-button  #chapter-name  [背包][地图][成就]   ← 新增顶栏 3 入口
├───────────────────────────────────────────────────────────┤
│  #feedback  (hidden, 默认)                                ← 沿用现状
├───────────────────────────────────────────────────────────┤
│                                                           │
│  #game-scene                                              │
│    └─ #exploration-actions                                │
│                                                           │
│  ┌─#game-story──────┐ ┌─#inventory-panel (hidden)──┐      │ ← reading 主显示
│  │                   │ │ #detail-root (hidden)      │      │  ← inventory 覆盖层
│  │  旁白/系统/对白   │ │ <走马灯详情 / 物品列表>    │      │    detail 覆盖层
│  │  (reading 态)     │ │                            │      │
│  └─#game-actions───┘ └────────────────────────────┘      │
│                                                           │
│  #minigame-root (hidden)                                  ← minigame 覆盖层
└───────────────────────────────────────────────────────────┘
```

**z-index 分层**：
- `#feedback` / 顶栏：`z-index: 100`
- `#inventory-panel`、`#detail-root`、`#minigame-root`、`#reading`： `z-index: 50`
- 场景层 `#game-scene` / `#exploration-actions`：默认 0

---

## 三、7 容器清单（最终版）

| # | 容器 ID | 来源 | 容器性质 | 显示规则 | 谁往里挂 |
|---|---|---|---|---|---|
| 1 | `#feedback` | game.html 现状（第 27 行） | 固定层（始终显示，`hidden` 时不占位） | 始终在 DOM；内容可用时显示，反之 `hidden` | 罗晨菲协调器 |
| 2 | `#return-menu-button` + `#save-button` + `[新增背包][地图][成就]` | game.html 现状 + 本规范新增 | 顶栏按钮组（chrome） | 始终可点（顶栏不在五状态主容器范围） | 你（按钮 DOM）+ 协调器挂回调 |
| 3 | `#chapter-name`（新增节点） | 本规范新增 | 顶栏常驻章节名 | 始终显示 | 罗晨菲协调器根据 `gameState.storyCheckpoint` 填字 |
| 4 | `#game-scene` | game.html 现状（第 31 行） | 场景图（基础层） | exploration 态显示，其他态 `hidden` | 探索模块（卢正松）+ 协调器切换 `hidden` |
| 5 | `#exploration-actions` | game.html 现状（第 34 行） | 场景热点按钮 | exploration 态可点；其他态 `hidden` 或 `pointer-events:none` | 探索模块（卢正松） |
| 6 | `#game-story` | game.html 现状（第 40 行） | 阅读主内容 | reading 态显示 | 你的统一阅读组件 |
| 7 | `#game-actions` | game.html 现状（第 43 行） | 阅读按钮（继续/选择） | reading 态显示 | 你的统一阅读组件 |
| 8 | `#inventory-panel` | game.html 现状（第 48 行） | **必须升格为覆盖层**：`<aside>` → `<div hidden>` | inventory 态显示，其他态 `hidden` + 锁背景 | 探索模块（卢正松） |
| 9 | `#detail-root`（新增） | 本规范新增 | 覆盖层（detail 态） | detail 态显示，其他态 `hidden` + 锁背景 | 探索模块（卢正松） |
| 10 | `#minigame-root` | game.html 现状（第 36 行）+ V2 §U1 锁定 | 覆盖层（minigame 态） | minigame 态显示，其他态 `hidden` | 拼图 adapter |

> **原 § 三"阅读/详情/背包/小游戏四个互斥覆盖层"措辞微调**：现在背包被识别为覆盖层；reading 与四个覆盖层之间是**显隐正交**（reading 可与 inventory/minigame 共存——见 §七 Q3）。这就是 V2 §3 罗晨菲"打开前状态 reading | exploration"两值允许的依据。

---

## 四、显隐规则矩阵

### 4.1 主规则

- 同一时刻**只有一个"主显示层"亮着**：reading / exploration / detail / inventory / minigame 五选一（**依据 V2界面状态切换约定 §1 第 1 条与 PRD V2 §G1**）
- reading 态允许覆盖层从顶栏按钮触发（罗晨菲 §3 inventory/minigame 行 + §5.1 "打开前状态 reading | exploration"）
- 覆盖层打开时 `#exploration-actions` 必须 `pointer-events:none`（V2 §U3 锁背景）
- 隐藏层不占位不接收点击（V2 §U1 原文："**隐藏区域不得占位或接受输入**"）

### 4.2 5 状态 × 5 覆盖层（含 reading 与覆盖层共存情况）

| 状态主显示 | `#game-scene` | `#exploration-actions` | `#game-story` + `#game-actions` | `#inventory-panel` | `#detail-root` | `#minigame-root` |
|---|---|---|---|---|---|---|
| **reading** | `hidden` | `hidden` | **主显示** | `hidden` | `hidden` | `hidden` |
| **exploration** | **主显示** | **主显示（可点）** | `hidden` | `hidden` | `hidden` | `hidden` |
| **detail** | 显示（背景图） | **锁**（`pointer-events:none`） | `hidden` | `hidden` | **主显示** | `hidden` |
| **inventory** | 显示（背景图） | **锁** | `hidden` | **主显示** | `hidden` | `hidden` |
| **minigame** | 显示（背景图） | **锁** | `hidden` | `hidden` | `hidden` | **主显示** |
| reading + inventory（顶栏触发） | `hidden` | `hidden` | **主显示** | **主显示**（其上覆盖） | `hidden` | `hidden` |
| reading + minigame（顶栏触发） | `hidden` | `hidden` | **主显示** | `hidden` | `hidden` | **主显示** |
| exploration + 多人对话（罗晨菲 §4 行 4） | **主显示** | **主显示** | `hidden` | `hidden` | `hidden` | `hidden` |

> **重要修正**：我之前把"reading 和场景 / 探索"做成互斥。现在对齐罗晨菲 §2 后，**reading 态时场景图也是 `hidden`**——背景锁不出现。

### 4.3 边缘场景规则

| 场景 | 行为 | 依据 |
|---|---|---|
| 阅读中弹详情 | 切 detail，关闭回 reading | V2 §U3 "关闭详情/背包时恢复原界面及焦点" |
| 探索中开背包 | 切 inventory，关闭回 exploration | V2 §U3 + §E4 |
| 探索中点开地图拼图 | 切 minigame，取消回 exploration / 完成 → 新剧情决定 | V2 §U3 依赖 |
| 顶栏打开背包（在 reading 时） | 进入 inventory，关闭回 reading | 罗晨菲 §3 行 inventory + §5.1 |
| 顶栏打开地图（在 reading 时） | 进入 minigame，取消或完成回 reading | 罗晨菲 §3 行 minigame + §5.1 |
| 多村民命令 | 保持 exploration，由玩家选择一个后进入 reading；**不自动执行第一个** | 罗晨菲 §4 行 4 原文 |
| 终局（`ended`） | 切 reading，显示结局（无 `commands`）| 罗晨菲 §4 行 `ended` |
| 错误响应（`error`） | 保留最近一个有效界面状态，**不推进剧情**，显示玩家能理解的错误提示 | 罗晨菲 §4 行 `error` |
| 存档恢复失败 | "无档 / 坏档 / 版本不兼容 / 存储不可用"4 种不同提示，不伪装成新游戏 | 罗晨菲 §6 + PRD V2 §U5 |
| 拼图取消 | 回 exploration；**不产生完成事实** | 罗晨菲 §3 行 minigame |

---

## 五、覆盖层行为规则（U3）

### 5.1 打开覆盖层（来自罗晨菲 §5.1 原文）

```text
请求类型：detail | inventory | minigame
打开前状态：reading | exploration
目标 ID：线索 ID、地图命令 ID 等（由对应模块提供）
```

协调器行为：记录 `returnState` 和必要的焦点元素 → 显示目标覆盖层 → 锁定背景（`#exploration-actions` 设 `pointer-events:none`）。

**业务模块不能直接修改 `hidden`**：这是协调器的职责（罗晨菲 §5.1 末尾）。

### 5.2 关闭覆盖层（来自罗晨菲 §5.2 原文）

- 销毁或清理当前覆盖层的临时监听
- 恢复 `returnState` 对应容器和焦点
- **关闭本身不提交剧情事实、不改变 `storyCheckpoint`**

### 5.3 操作结果（来自罗晨菲 §5.3 原文）

| 结果 | 行为 | 依据 |
|---|---|---|
| 成功 | 真实事件交给 `game-flow.handleExternalEvent`；只有 `ok: true` 才刷新完成状态 | §5.3 第 1 行 |
| 取消 | 回到约定的上一个界面，不产生事实 | §5.3 第 2 行 |
| 失败 | `{ok: false, ...}`；保留原状态和已有数据 | §5.3 第 3 行 |

---

## 六、U5 玩家反馈原文对应

| 项 | 原文来源 |
|---|---|
| 反馈区位置 | PRD V2 §U5 "**页面只渲染中文剧情、调查结果和操作提示**" + 共同验收范围 3 "**高冰轩负责显示位置**" |
| 删除的内容 | PRD V2 §U5 "**删除"阶段/节点"代码标签、流程日志和命令详情**" + V2 共同验收范围 3 + 罗晨菲 §1 第 5 条 |
| 失败时显示 | PRD V2 §U5 "**失败时显示下一步动作**" |
| 禁止直赋 textContent | PRD V2 §U5 "**不把 `eventType`、`commandId`、事实 ID、错误码或异常对象直接赋给 `textContent`**" |
| 反馈统一通道 | V2 共同验收范围 3 "**玩家提示由触发问题的模块提供含义（高冰轩负责显示位置，罗晨菲负责在正式页面阻止内部数据直接显示。）**" |
| 完整错误文案 | PRD V2 §G5 "**为"没有存档、存档损坏、版本不兼容、存储不可用、操作失败、保存成功"分别定义玩家能理解的中文提示**" + 罗晨菲 §1 第 5 条 |

**你负责的具体动作**：

1. 把游戏模块、剧情模块、探索模块对 `document.body.textContent`、`.innerHTML` 的可疑用法列个清单 → 通知对应模块的人改
2. 维护一张"错误码→中文提示"映射表（17 条，罗晨菲 §1 + PRD V2 §G5 + 剧情接口约定 §10.3）
3. 提供 `#feedback` 与顶栏的连接方式（统一通道）

---

## 七、U4 响应式原文对应

| 项 | V2 原文 |
|---|---|
| 视口宽度 | PRD V2 共同验收范围 1 "**1280px、390px 指浏览器内容区域宽度**" + V2 §U4 依赖 "**高冰轩分别把浏览器内容区域设为 390、768、1280px 并截图**" |
| 页面要求 | PRD V2 共同验收范围 1 "**页面不能横向溢出，文字、按钮和场景关键物体不能被遮住**" |
| 缩放规则 | V2 §U4 "**固定场景图缩放规则；保证热点随同一容器缩放**" |
| 可点区域 | V2 §U4 "**保证发光点和按钮有足够大的鼠标点击区域**" |
| 资源失败降级 | V2 §U4 "**资源失败时保留文字和返回操作**" |
| 问题归属 | V2 §U4 依赖 "**图片裁切归杨梦、容器缩放归高冰轩、坐标归卢正松**" |

**注意**：现状 game.html 没有 `#game-scene` 的固定宽高比——你需要在 `game.css` 加 `aspect-ratio` 或等比缩放规则，让 1280/768/390 三视口下 `#exploration-actions` 仍按比例贴图。

---

## 八、U2 阅读组件 API 草案

```js
const reading = createReadingView({
  mount: { story: '#game-story', actions: '#game-actions' },  // 现状 DOM
  onComplete: (result) => { /* 末尾触发一次 */ },
  onAction:  (actionId) => { /* 玩家点了继续/选择 */ },
  onBusyChange: (busy) => { /* 协调器锁定当前剧情操作 */
});

reading.open(presentation);   // input: { blocks: [{type, text, speaker?}],
                             //          actions: [{type, label, payload}] }
reading.close();             // 强制关闭（不提交事实）
reading.resume(checkpoint);  // 存档恢复时用
```

**字段对齐剧情接口约定 §6.2**：`blocks[].blockType` 只允许 `narration`/`system`；**对白不进 presentation**——必须在对话模式下由对话模块另外传入。

---

## 九、交付物清单与 PRD V2 原文对齐

| 你的任务 | PRD V2 原文 | 你的交付物 |
|---|---|---|
| **U1 页面结构** | "**将页面拆成背景场景层、剧情/对话阅读层、详情层、背包层、小游戏层和固定导航反馈区**" | 重构 game.html（升格 inventory 为覆盖层 + 新增 #detail-root + 顶栏 3 入口按钮）|
| **U2 统一阅读组件** | "按顺序**一次展示一个文本块**；区分**旁白、系统文字和人物对白**；显示说话人及合法操作" | `assets/js/ui/reading-view.js`（消费 #game-story + #game-actions）|
| **U3 覆盖层** | "**控制层级、焦点和关闭按钮；打开时记录返回目标并禁止背景点击**" | 覆盖层基础设施（协调器职责，你提供容器 + CSS + 焦点恢复）|
| **U4 响应式** | "**固定场景图缩放规则；保证热点随同一容器缩放；保证发光点和按钮有足够大的鼠标点击区域；资源失败时保留文字和返回操作**" | game.css 三视口样式 + 三视口验证截图 |
| **U5 反馈清理** | "**页面只渲染中文剧情、调查结果和操作提示；删除"阶段/节点"代码标签、流程日志和命令详情；失败时显示下一步动作；不把内部 ID 赋给 textContent**" | 删除 game-ui.js 内部标签 + 维护错误映射表 |

---

## 十、待对接口清单

### 12.1 你的 TODO（容器侧）

- [ ] **DOM 改动 1**：`<aside class="game-sidebar">` 改为 `<div id="inventory-panel" class="inventory-panel" hidden>`（升格覆盖层）
- [ ] **DOM 改动 2**：在 `<main class="game-layout">` 内新增 `<section id="detail-root" class="detail-root" hidden></section>`
- [ ] **DOM 改动 3**：在顶栏 `<header class="game-header">` 内新增：
  ```html
  <button id="open-inventory-button">背包</button>
  <button id="open-minigame-button">地图</button>
  <a href="achievements/achievements.html">成就</a>
  ```
- [ ] **DOM 改动 4**：在顶栏内新增 `<span id="chapter-name">序章</span>` 章节名显示节点
- [ ] **CSS 改动**：补 `aspect-ratio` 三视口缩放 + `#exploration-actions` 在 `#game-scene` 内定位规则
- [ ] **删除**：移除 game-ui.js 中"节点 / 命令卡 / 流程日志"DOM 输出（参考 PRD V2 §U5）

### 12.2 于知让 TODO（你等他给）

- [ ] 真实的 `prologue-wake` presentation 样例（字段对齐剧情接口约定 §6.2）
- [ ] 11 个 Node 的标题清单（用于 `#chapter-name` 默认值参考）

### 12.3 卢正松 TODO（你等他给）

- [ ] 真实 NPC 对话数据样例结构（避开 presentation.blocks 路径）
- [ ] `#exploration-actions` 热点按钮 DOM 结构和样式（在你的容器内渲染）
- [ ] `#inventory-panel` 内容渲染逻辑
- [ ] `#detail-root` 内容渲染逻辑
- [ ] 调查/详情请求字段命名（与协调器对齐 V2 §5.1）

### 12.4 罗晨菲 TODO（协调器侧）

- [ ] 同意你"升格 inventory 为覆盖层 + 新增 #detail-root + 顶栏 3 入口"
- [ ] 给出"顶栏按钮点击事件"协调器签名（如 `host.requestOpenDetail(targetId)`）
- [ ] 同意"顶栏在 reading 态也可触发"（§7 Q3 已决策）

### 12.5 杨梦 TODO（你等他给）

- [ ] 三场景正式图（1280×720 缩放锚点）

---

## 十一、变更记录

| 版本 | 日期 | 变更 | 原因 |
|---|---|---|---|
| **v5** | 2026-09-08 | **C4 升格决策最终确认**：用户（高冰轩）明确拍板"`<aside>` 永久侧栏 → `<div id="inventory-panel" hidden>` 覆盖层"；状态行打勾；新增 §十四经验教训 | 用户在 09:54 确认 C4 升格；C2 反思（不要凭想象拆层）需落纸供 H2+ 复用 |
| **v4** | 2026-09-08 | **H1 终稿**：精简文档首部为"已确认决策摘要"；§十五改名为"H1 修订决策档案"；去掉所有"我之前方案"叙述，直接呈现最终结论 | 用户已确认 Q1/Q2/Q3 采纳 A 方案，文档作为正式交接物 |
| v3 | 2026-09-08 | 容器 ID 全部对齐 `pages/game.html` 现状 ID；删除"拆分底图/热点层"提议 | 罗晨菲 §2 是事实标准，拆分无依据 |
| v3 | 2026-09-08 | `#inventory-panel` 从永久侧栏升格为覆盖层 | V2 §U3 共同验收范围 2 强制锁背景 |
| v3 | 2026-09-08 | 新增 `#detail-root`（现状 DOM 缺失）| 罗晨菲 §2 "ID 待确认" 必须落实 |
| v3 | 2026-09-08 | 顶栏新增 3 入口按钮 + 章节名 `#chapter-name` | 方案 C 决策落实 |
| v2 | 2026-09-08 | 剧情接口契约 A1–A9 修订 | 与《剧情模块接口约定(1).md》对齐 |
| v1 | 2026-09-08 | 初稿：6 容器（早期讨论版，已废止） | — |

---

## 十二、H1 已确认决策（用户已采纳 A 方案，无需再拍板）

> 本节保留作为决策审计追踪，**不再作为待拍板项**。如需追溯原始问题，请参考上一轮对话。

1. **inventory 升格为覆盖层 vs 保留永久侧栏** → 已采纳**升格为覆盖层**
2. **reading 态是否允许顶栏打开 inventory/minigame** → 已采纳**允许**
3. **detail 容器新增位置** → `#inventory-panel` 之前（弹出顺序：详情 > 背包 > 拼图）
4. **`#chapter-name` 节点位置** → 顶栏右上，字体小、灰底色

---

## 十三、H1 修订决策档案（v4 终稿）

### 13.1 罗晨菲《V2界面状态切换约定》§2 容器清单原文

```
| 状态 | 当前可见容器 | 正式容器确认人 |
| `reading` | `#game-story`、`#game-actions`；独立阅读层 ID 待确认 | 高冰轩 |
| `exploration` | `#game-scene`、`#exploration-actions` | 高冰轩 |
| `detail` | 详情容器 ID 待确认 | 高冰轩 |
| `inventory` | `#inventory-panel`（是否作为覆盖层待确认） | 高冰轩 |
| `minigame` | `#minigame-root` | 高冰轩 |
```

罗晨菲 §2 末尾原文："容器必须满足：显示状态下可操作，隐藏状态下不占位、不接收点击；切换后不能同时显示两个主状态。"

### 13.2 H1 vs 罗晨菲 §2 + 现状 game.html 的对齐结果

| 罗晨菲 §2 / 现状 DOM | H1 最终方案 | 决策依据 |
|---|---|---|
| `#game-story` + `#game-actions`（reading） | **沿用**——U2 阅读组件在此节点升级 | 节点已存在且 `createGameView` 已用（`game-ui.js` 第 23-24 行 `requiredElement`） |
| `#game-scene` + `#exploration-actions`（exploration） | **沿用** | 节点已存在，`mountExploration` 已用 |
| `#inventory-panel` 现状是 `<aside>` 永久侧栏（game.html 第 47-49 行） | **升格为覆盖层** `<div id="inventory-panel" hidden>` | V2 §U3 共同验收范围 2："**打开线索详情、背包或小游戏窗口时，玩家不能误点窗口后面场景里的发光物体或人物**" |
| `#minigame-root` | **沿用** | V2 §U1 已锁定："**地图 adapter 只挂载到 `#minigame-root`**" |
| `#feedback` | **沿用** | 已在 game.html 第 27 行 |
| （未指定：阅读章节名）| **新增** `#chapter-name` 节点 | 高冰轩与罗晨菲共议，决定章节名顶部常驻 |
| （未指定：详情容器）| **新增** `#detail-root` 节点 | 罗晨菲 §2 标注"ID 待确认"，本规范落实 |
| （未指定：顶栏 3 入口）| **新增** 3 按钮 + `<a>` 链接 | 方案 C 决策：背包/地图/成就（成就用 `<a>` 跳转独立页，最小改动）|

### 13.3 H1 决策对其他成员的明确影响

| 模块 | 影响 | 你需要做什么 |
|---|---|---|
| **罗晨菲协调器** | DOM 物理结构基本不变；新增 4 个 ID 需要协调器认；顶栏按钮需要协调器提供回调签名 | 发起一次会议对齐 §十二 12.4 |
| **卢正松探索模块** | `#inventory-panel` 行为变化（永久显示 → 默认 hidden / 按钮触发）；`#exploration-actions` 仍在 `#game-scene` 内（位置不变） | 通知 `inventory-view.js` 适配新挂载规则 |
| **卢正松对话模块** | 你的阅读组件吃对话 input，对话模块需给真实样例 | 索取对话样例结构（§十二 12.3） |
| **拼图 adapter** | 无影响 | 无 |
| **阅读组件（你写）** | mount 改为 `#game-story` + `#game-actions` 双节点 | 自己改即可 |
| **杨梦场景** | 三视口截图验证需要在你 CSS 改造后做 | 通知她等 CSS 定稿 |
| **于知让剧情** | 无 ID 影响；只需提供真实 `prologue-wake` presentation 样例 | 索取真实样例（§十二 12.2） |

### 13.4 H1 引用的所有文档

| 文档 | 路径 | 用途 |
|---|---|---|
| 罗晨菲《V2界面状态切换约定》 | `D:\xwechat_files\wxid_1imdna2mee1g12_20a4\msg\file\2026-09\V2界面状态切换约定.md` | 本规范最高优先级 |
| 现状 `pages/game.html` | `pages/game.html` | DOM ID 锚点 |
| 剧情模块接口约定（V1）| `剧情模块接口约定(1).md` | 数据契约、无 ID 冲突 |
| PRD V2 | `项目需求文档v2(1).md` | §U1/§U3/§U4/§U5 原文引用 |
| PRD V1 | `《借灯》网页交互故事需求文档（PRD V1）.md` | R12/R21 备份约束 |

---

## 十四、H1 经验教训（v5 新增 · 供 H2+ 复用）

> 本节是 H1 迭代过程的反思，**不属于交付物**，但作为团队后续 H2/H3 的工作守则记录下来。

### 14.1 C2 教训：不要凭想象拆层

**症状**：v1/v2 草案里，我看到 PRD V2 写"探索从 WASD 改为点击发光热点"，就**脑补**出"热点层应该独立"的架构，自拟了 `#scene-background` + `#scene-hotspots-layer` 两个容器。

**错在哪**：中间跳了三步——
1. **没读现状 DOM**：`pages/game.html` 第 31–34 行 `#game-scene` 已经包含场景图+热点按钮，本来就是一个整体
2. **没问模块负责人**：卢正松（探索/对话）的 `exploration-view.js` 本来就把热点按钮挂到 `#game-scene` 里
3. **没验证现状够不够用**：现状能跑，为什么要拆？

**拆开后的副作用**：
| 问题 | 复杂度来源 |
|---|---|
| 坐标对齐 | 热点层和底图层坐标系必须完全一致（视口缩放、padding、background-size） |
| 状态同步 | exploration 切走时，底图层 `hidden=false`、热点层 `hidden=true`，两层 `hidden` 要分别控制 |
| 事件冒泡 | 底图层要 `pointer-events:none`、热点层要 `pointer-events:auto` |
| 回归风险 | 改现状 DOM 会让卢正松的现有代码坏掉 |

**三条工作守则**（适用于后续 H2+）：

1. **设计容器前先读现状 DOM**——读不到就读不到，不要靠文档脑补
2. **现状能用的不要拆**——拆之前必须回答"现状哪里不够用"
3. **不确定归属的，问负责人**——热点是卢正松的，不是我的

### 14.2 H1 整体教训：H1 的职责是"翻译"，不是"设计"

H1 阶段三个交付物的本质：

| 阶段 | 我的产出 | 我应该做的事 |
|---|---|---|
| H0 | 跑通 V1 基线 | 读现状、看现状、确认现状能跑 |
| H1（这次）| 容器 ID 清单 + 显隐规则表 | **把罗晨菲的 §2 + 现状 DOM + PRD V2 §U1 翻译成一张表** |
| H2+ | 真实 DOM 改动 | 改之前先把翻译表对齐 |

**越界信号**：如果你在 H1 阶段写了"我建议新增 XX 容器"或"我建议把 YY 拆成两层"——**先停下来**，回到 §十三的修订决策档案核对你是否真的读完了现状 DOM 和罗晨菲的 §1–§6。

### 14.3 协作铁律（再次立）

来自项目长期记忆 `.workbuddy/memory/MEMORY.md`：

> 先对接口再写实现；每接口双方在正式 game.html 跑通 成功/取消/连点；问题按归属回退。

H1 没有写实现，**但 H1 的翻译表就是 H2+ 的接口**。一旦发出去罗晨菲/卢正松按这个表改 DOM，回退成本很高——所以 H1 的"画蛇添足"风险比 H2 还大。

---

## 附录 A：方案 C 页面布局示意图（描述）

> 因为对话中已生成 5 张方案 C 布局示意图，本附录给出文字版结构描述，对照阅读：

### 桌面 1280px 三区

```
[顶栏 64px]    #return-menu-button  #chapter-name(左对齐)         [背包][地图][成就]  #save-button
[反馈条 32px]  #feedback (默认 hidden，触发时滑入)
[主区(弹性)]   #game-scene (含 #exploration-actions)
[剧情条 ~40%]  #game-story + #game-actions  ← reading 态才显示
[覆盖层]      #detail-root  #inventory-panel  #minigame-root (全部 hidden 默认)
```

### 三视口差异

| 视口 | 顶栏处理 | 主区占屏 |
|---|---|---|
| 1280px | 完整 3 入口 | 100% 全宽 |
| 768px | 3 入口压缩为图标 | 100% 全宽 |
| 390px | 3 入口缩到右上角汉堡 | 100% 全宽，剧情条占 ~50% 屏幕高度 |

---

## 附录 B：阅读组件 4 API 签名（详解）

```js
// 1. open(input) —— 协调器塞数据进来
reading.open({
  blocks: [
    { blockType: 'narration', text: '暴雨停了。你在祠堂里醒来。' },
    { blockType: 'system',    text: '近期的记忆留下了一段空白。' }
    // 注意：对白(speaker + text)由对话模块另外传入，blocks 不带 speaker
  ],
  actions: [
    { actionType: 'advance', label: '继续阅读', actionId: 'cont-1' },
    { actionType: 'choice',  label: '检查随身物品', actionId: 'inspect-1' }
  ]
});

// 2. close() —— 强制关闭（玩家按 Esc 或外部中断）
reading.close();  // 不调 onComplete，不调 onAction

// 3. onComplete(result) —— 末尾才触发（由 actionType: 'advance' 推进）
reading.setCallback('onComplete', (result) => {
  // result = { finalActionId, finalBlockId, input, ... }
  // 调一次后清空，防重复
});

// 4. onAction(actionId) —— 玩家点了非 advance 的按钮
reading.setCallback('onAction', (actionId) => {
  // 只在 actionType !== 'advance' 时触发
});
```

**双模式说明**：阅读组件吃**两种**输入——剧情 `presentation`（如上）和对话 `conversation`（`{ speaker, dialogues: [{lineId, text, choices?}] }`，由卢正松给）。
