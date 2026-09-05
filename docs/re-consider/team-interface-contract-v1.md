<!-- 本文件是已废弃的团队接口草案，只保留用于追溯历史讨论。 -->

# 《借灯》V1 团队开发接口约定（废案）

> **废案，仅供追溯。** 本文件不得作为开发或联调依据；剧情模块以 `docs/剧情模块接口约定.md` 和 `docs/V1剧情运行Node清单.md` 为准。

**版本：** V1.0 草案  
**维护人：** 全局与存档负责人  
**适用范围：** 第一周版本：祠堂醒来 → 村口 → 陈家老宅，以及手绘地图复原、存档和一项成就。

---

## 0. 先读这一节：什么是本文件中的“接口”

接口不是要求每个人先会写复杂代码。它是模块之间的**交接规则**：

> 甲同学完成一件事后，乙同学怎样知道这件事已完成，并在自己的功能里产生正确结果。

例如：拼图组完成“手绘地图复原”后，剧情要开放陈家老宅、背包要出现完整地图、成就页要点亮成就、存档要记住结果。本文件规定它们用同一个英文名称和同一份游戏状态来沟通。

### 0.1 本版本采用的产品前提（请团队确认）

本文件暂按以下方案写：

- 一台浏览器只保存一份本地身份资料和一份游戏进度；不提供切换多个账号。
- 注册/登录只用于本机课程演示；绝不输入真实密码。
- 玩家可手动保存；刷新后可继续唯一的一份有效进度。

> 注意：这与原 PRD 中“注册用户与游客拥有独立存档”的要求不同。全组若正式采用本方案，必须同步修改 PRD；若不能修改，则需要把下面的单份存档改为“每个用户/游客一份存档”。

### 0.2 四条总规则

1. **同一件游戏内容只用一个 ID。** 例如“刻有 A 的钥匙”永远是 `key-a`，不能有人写 `a-key`、有人写 `keyA`。
2. **只有状态模块能修改游戏状态。** 剧情、探索、拼图、成就模块提出“发生了什么”，不能各自随意改存档。
3. **只有存档模块读写浏览器本地存储。** 其他模块不得直接使用 `localStorage`。
4. **所有关键操作都要有玩家可见反馈。** 成功、缺少条件、保存失败或存档损坏都不能静默。

### 0.3 队员什么时候需要查这份文档（速查表）

不需要每次开发都从头读完整份文档；遇到下面的情况，查对应章节即可。

| 开发时遇到的情况 | 先查哪一节 | 查完后要做什么 |
| --- | --- | --- |
| 我要新建一个页面，或给按钮加跳转 | 第 1 节“页面地图” | 使用规定的页面路径；确认从哪里进入、完成后能回哪里 |
| 我不知道这项功能由谁做，或我能不能改某个文件 | 第 2 节“模块职责” | 找到主负责人；公共文件先沟通，不直接覆盖 |
| 我要给新物品、人物、剧情、图片或按钮取名 | 第 3 节“共同名词” | 先找有没有已有 ID；没有就申请新增，不能自己造多个名字 |
| 我的功能完成后，应该让剧情/背包/成就发生什么变化 | 第 4 节“功能影响表” | 找到对应中文行为和英文事件；按示例把结果交给全局状态模块 |
| 我要放美术素材、写按钮样式、增加弹窗或提示 | 第 5 节“素材和公共界面” | 按素材命名和公共 CSS 组件复用；不要另做一套风格 |
| 我要提交 PR，或审核别人的 PR | 第 6 节“分支、PR 与验收” | 使用 PR 模板并完成最低自测；审核时逐项检查 |
| 发现 PRD、故事、美术稿和本文件说法不一致 | 第 7 节“待确认事项” | 暂停自行决定，记录问题，交给全组确认后再更新本文件 |
| 不知道接下来项目该先做什么 | 第 8 节“启动顺序” | 按顺序推进，先完成会影响其他人的公共骨架 |

### 0.4 最简单的判断口诀

> **要新建、要命名、要影响别人、要改公共文件、要提交代码时，就先查。**

如果查完仍然没有答案，不要临时自创规则。先在组内提出问题，由全局负责人记录结论并更新本文件；这样下一位遇到同样的问题就不用重新猜。

---

## 1. 清单一：页面地图与页面接口

页面路径就是网页文件的“门牌号”。链接、跳转和 PR 中的文件位置都必须使用下面的路径。

> 根据 PRD 的 R01—R21，项目按“入口、账户、全局、剧情、探索、小游戏、存档、成就、介绍”等**模块**分工，并没有“页面负责人”这个角色。一个页面可以承载多个模块：例如 `game.html` 同时承载剧情、探索、背包、拼图、存档和全局提示。因此表中的“涉及模块”用于说明谁可以在什么范围内接入，而不是把整个页面交给某一个人。

| 页面中文名 | 文件路径 | 英文页面名/页面 ID | 涉及模块（PRD 需求） | 从哪里进入 | 可以前往 |
| --- | --- | --- | --- | --- |
| 游戏封面 | `index.html` | `cover` | 入口（R01） | 打开网站 | 登录、注册、游客进入 |
| 注册 | `pages/auth/register.html` | `register` | 账户（R02） | 封面 | 登录、主菜单（成功后） |
| 登录 | `pages/auth/login.html` | `login` | 账户（R03、R04） | 封面、注册 | 主菜单 |
| 主菜单 | `pages/menu.html` | `menu` | 全局/导航（R05）、存档（R06） | 登录或游客进入后 | 新游戏、继续游戏、成就、项目介绍、制作组 |
| 游戏主界面 | `pages/game.html` | `game` | 全局/状态（R11、R21）、存档（R06、R14、R15）、剧情（R07、R08）、探索/背包（R09、R10、R12）、小游戏（R13） | 主菜单 | 主菜单、背包面板、保存 |
| 成就 | `pages/achievements.html` | `achievements` | 成就（R16） | 主菜单 | 主菜单 |
| 项目介绍 | `pages/about/project.html` | `project-about` | 介绍（R17） | 主菜单 | 制作组、主菜单 |
| 制作组介绍 | `pages/about/team.html` | `team-about` | 介绍（R18） | 主菜单、项目介绍 | 各成员页、主菜单 |
| 成员个人页 | `pages/about/members/<name>.html` | `member-<name>` | 介绍（R19） | 制作组介绍 | 制作组介绍 |

### 1.1 页面跳转怎么写

跨页面的基础跳转优先使用普通链接；这样鼠标、键盘和手机都能使用：

```html
<!-- 从 pages/menu.html 进入游戏页。 -->
<a class="button button--primary" href="game.html">开始新游戏</a>

<!-- 从 pages/game.html 返回主菜单。 -->
<a class="button button--secondary" href="menu.html">返回主菜单</a>
```

`button` 是公共按钮组件名，`button--primary` 表示主要操作，`button--secondary` 表示次要操作。CSS 负责人实现它们，其他页面直接复用，不重新发明按钮样式。

### 1.2 模块开发者修改页面时的 PR 检查

任何模块的 PR 只要新建或修改了 HTML 页面，至少说明：

- 页面文件路径；
- 本模块在该页面增加或修改了哪个区域；
- 本页面有哪些入口和出口；
- 390px 手机宽度和桌面宽度是否可用；
- 页面使用了哪些公共 CSS 组件；
- 是否有死链或控制台报错。

其中 `game.html` 是共享页面：剧情模块只改 `game-story`，探索/拼图模块只改 `game-scene` 或 `game-actions`，背包模块只改 `inventory-panel`，全局模块维护保存按钮和 `feedback`。任何人若需改变这些公共区域的名称或整页结构，先与全局模块负责人商定。

---

## 2. 清单二：模块职责与交接结果

“负责某模块”必须能说清楚最终交付什么，而不只是“我来做这个页面”。

| 模块 | 建议目录/文件 | 负责人交付物 | 交给其他模块的结果 |
| --- | --- | --- | --- |
| 全局状态 | `assets/js/core/state.js` | 初始状态、统一状态更新 | 当前剧情、背包、调查、选择、拼图、成就状态 |
| 存档 | `assets/js/core/storage.js` | 保存、读取、校验、损坏提示 | 一份有效游戏状态，或可理解的错误 |
| 页面导航 | `assets/js/core/navigation.js` | 页面保护、返回、安全跳转 | 登录后进入菜单；无存档时禁用继续游戏 |
| 账户 | `assets/js/auth/auth.js` | 注册、登录、本机身份资料 | “已登录/未登录”状态和昵称 |
| 剧情 | `assets/js/data/prologue.js`、`assets/js/data/village.js`、`assets/js/data/old-house.js`、`assets/js/game/story-engine.js` | 节点文本、选项、节点推进 | 进入何处、玩家作出了什么选择 |
| 探索和对话 | `assets/js/game/exploration.js` | 热点、物品调查、村民对话 | 完成调查、获得物品、对话完成 |
| 背包 | `assets/js/game/inventory.js` | 物品展示与详情面板 | 只读取背包状态，不自行保存 |
| 拼图 | `assets/js/minigames/map-puzzle.js` | 地图碎片交互和完成判定 | 地图已复原 |
| 成就 | `assets/js/game/achievements.js` | 成就判定、提示、成就页展示 | 已解锁的成就 |
| 美术/视觉 | `assets/images/`、视觉稿 | 素材、视觉规范、验收反馈 | 可直接引用的图片和视觉决定 |

### 2.1 谁可以改哪些核心文件

| 文件 | 主维护人 | 其他成员是否可直接修改 |
| --- | --- | --- |
| `state.js` | 全局负责人 | 不可以；先提需求或在 PR 中说明 |
| `storage.js` | 存档负责人 | 不可以；先提需求或在 PR 中说明 |
| `game.html` 的公共结构 | 游戏壳/全局负责人 | 原则上不可以；通过约定区域接入 |
| `base.css` | 公共样式负责人 | 不可以随意改；新组件先讨论 |
| 自己模块目录 | 对应模块负责人 | 可以 |
| 剧情数据文件 | 对应剧情负责人 | 可以，但不能修改其他阶段内容 |

---

## 3. 清单三：共同名词、文件名与英文 ID

### 3.1 命名格式

| 用途 | 格式 | 示例 |
| --- | --- | --- |
| 文件、文件夹、CSS 类名 | 小写英文 + 连字符（kebab-case） | `map-puzzle.js`、`old-house.css`、`feedback--error` |
| JavaScript 变量、函数 | 小驼峰（camelCase） | `currentNodeId`、`saveGame()` |
| 常量、事件名称 | 大写英文 + 下划线（UPPER_SNAKE_CASE） | `MAP_PUZZLE_COMPLETED` |
| 游戏内容 ID | 小写英文 + 连字符（kebab-case） | `key-a`、`map-fragment-1` |
| 剧情节点 ID | 阶段 + 连字符 + 简短动作 | `prologue-wake`、`village-map-puzzle` |

### 3.2 已冻结的中文 → 英文约定

| 中文 | 英文 ID / 名称 | 备注 |
| --- | --- | --- |
| 《借灯》项目技术前缀 | `jiedeng` | 即使最终展示名待确认，存储键先统一使用此技术前缀 |
| 封面 | `cover` | 页面 ID |
| 主菜单 | `menu` | 页面 ID |
| 游戏主界面 | `game` | 页面 ID |
| 祠堂醒来 | `prologue` | 阶段 ID |
| 村口 | `village` | 阶段 ID |
| 陈家老宅 | `old-house` | 阶段 ID |
| 第一周内容结束 | `week-one-end` | 阶段/结尾节点 ID |
| 小 X | `companion-x` | 人物 ID；若剧情组公布正式姓名，再统一改一次 |
| 村民一/二/三 | `villager-1`、`villager-2`、`villager-3` | 正式姓名确定后，可在文案显示姓名，但 ID 不再改 |
| 刻有 A 的钥匙 | `key-a` | 物品 ID |
| 地图碎片一/二/三 | `map-fragment-1`、`map-fragment-2`、`map-fragment-3` | 物品 ID |
| 完整村庄地图 | `restored-village-map` | 物品 ID |
| 照片 | `old-photograph` | 老宅线索 ID |
| 校服 | `school-uniform` | 老宅线索 ID |
| 身高刻痕 | `height-marks` | 老宅线索 ID |
| 送葬名单 | `funeral-list` | 老宅线索 ID |
| 手绘地图复原 | `map-puzzle` | 小游戏 ID |
| 残图归一（成就） | `map-restorer` | 成就 ID |
| 相信小 X | `trust-x` | 选择 ID |
| 怀疑小 X | `doubt-x` | 选择 ID |
| 保存成功提示 | `save-success` | 反馈 ID |
| 存档无法读取提示 | `save-invalid` | 反馈 ID |

### 3.3 暂不编造的内容

PRD 只说“祠堂三件随身物品”，没有给出正式名称。剧情组需要先提交名称和用途；在确认前，临时使用：

```text
personal-item-1
personal-item-2
personal-item-3
```

一旦剧情组确认正式中文名，**只改显示名称，不改已经发布的 ID**。例如第一件最终叫“铜铃”，仍可保留内部 ID `personal-item-1`；或者在第一版联调前统一替换为 `bronze-bell`，之后冻结。

---

## 4. 清单四：功能影响表与事件接口

### 4.1 先用中文理解“事件”

事件不是一个难懂的 JavaScript 词。它只是给游戏里发生的事情一张标准通知单。

例如玩家拼好地图时，拼图模块发出一张通知：

> **发生的事情：地图拼图完成。**

全局系统拿到通知后更新进度；背包、剧情和成就再读取更新后的进度。这能避免拼图模块私自改三个页面、最后忘了改存档的问题。

### 4.2 V1 功能影响表：中文结果与英文事件一一对应

| 玩家行为 | 玩家立刻看到什么 | 英文事件 | 统一携带的信息 | 全局应更新什么 | 后续影响 |
| --- | --- | --- | --- | --- | --- |
| 点击“新游戏” | 进入祠堂醒来 | `GAME_STARTED` | 无 | 初始状态、节点、阶段 | 开始剧情 |
| 调查祠堂物品 | 物品说明、获得提示 | `OBJECT_INVESTIGATED` | `objectId`、可选 `itemId` | 已调查对象、背包 | 够三件后可离开 |
| 首次与村民交谈 | 对话、获得碎片提示 | `NPC_TALKED` | `npcId`、`rewardItemId` | 已对话人物、背包 | 三人均谈完可拼图 |
| 作出信任/怀疑选择 | 对应的小 X 反馈 | `CHOICE_MADE` | `choiceId` | 选择标记 | 后续对白不同 |
| 获得某件物品 | 背包新增物品 | `ITEM_ACQUIRED` | `itemId` | 背包 | 可作为后续条件 |
| 地图拼图成功 | 拼图成功、完整地图提示 | `MAP_PUZZLE_COMPLETED` | `puzzleId` | 拼图完成、背包、成就 | 开放陈家老宅 |
| 解锁成就 | 只出现一次解锁提示 | `ACHIEVEMENT_UNLOCKED` | `achievementId` | 成就列表 | 成就页点亮 |
| 点击保存 | 保存成功/失败提示 | `GAME_SAVED` | 无 | 保存时间 | 刷新后可继续 |
| 点击继续游戏 | 回到最后保存节点 | `GAME_LOADED` | 无 | 恢复全部状态 | 继续剧情 |

### 4.3 代码中怎样使用事件：最小实际示例

以下是**以后由全局/前端负责人实现一次**的通用入口。其他模块只需要按格式调用它，不必每个人自己写存档逻辑。

```js
// state.js：负责游戏状态更新。所有源文件开头写中文用途注释。

export function applyGameEvent(gameState, event) {
  switch (event.type) {
    case "OBJECT_INVESTIGATED": {
      const { objectId, itemId } = event.payload;

      if (!gameState.investigated.includes(objectId)) {
        gameState.investigated.push(objectId);
      }

      if (itemId && !gameState.inventory.includes(itemId)) {
        gameState.inventory.push(itemId);
      }
      break;
    }

    case "MAP_PUZZLE_COMPLETED": {
      gameState.puzzle.mapRestored = true;

      if (!gameState.inventory.includes("restored-village-map")) {
        gameState.inventory.push("restored-village-map");
      }

      if (!gameState.achievements.includes("map-restorer")) {
        gameState.achievements.push("map-restorer");
      }

      gameState.currentNodeId = "old-house-arrival";
      gameState.stage = "old-house";
      break;
    }
  }

  return gameState;
}
```

探索成员调查“刻有 A 的钥匙”时，使用同一个入口：

```js
// exploration.js：负责调查交互；不直接写 localStorage。

const nextState = applyGameEvent(currentState, {
  type: "OBJECT_INVESTIGATED",
  payload: {
    objectId: "old-house-door",
    itemId: "key-a"
  }
});
```

拼图成员完成地图时，只需要发出这一件事：

```js
// map-puzzle.js：拼图成功后通知全局状态模块。

const nextState = applyGameEvent(currentState, {
  type: "MAP_PUZZLE_COMPLETED",
  payload: {
    puzzleId: "map-puzzle"
  }
});
```

这两个成员都**不应该**各自写：

```js
// 禁止：各模块直接写本地存储，容易相互覆盖。
localStorage.setItem("jiedeng_save", JSON.stringify(currentState));
```

保存应该只由 `storage.js` 完成：

```js
// storage.js：负责唯一的本地存储入口。

export function saveGame(gameState) {
  localStorage.setItem("jiedeng_save", JSON.stringify(gameState));
}
```

### 4.4 避免重复奖励的规则

所有“首次获得”都先检查对应 ID 是否已经存在：

```js
if (!currentState.inventory.includes("key-a")) {
  // 只在第一次发放钥匙。
}
```

所以玩家可以重新阅读物品说明，却不会获得两把钥匙；读取存档后也不会重新触发成就。

---

## 5. 清单五：素材、公共界面与游戏页区域

### 5.1 素材文件命名

| 中文用途 | 文件路径示例 | 规则 |
| --- | --- | --- |
| 祠堂背景 | `assets/images/backgrounds/shrine-bg.jpg` | 场景名 + `-bg` |
| 陈家老宅背景 | `assets/images/backgrounds/old-house-bg.jpg` | 阶段/场景名 + `-bg` |
| 刻有 A 的钥匙 | `assets/images/items/key-a.png` | 必须与物品 ID 相同 |
| 地图碎片一 | `assets/images/items/map-fragment-1.png` | 必须与物品 ID 相同 |
| 小 X 立绘 | `assets/images/characters/companion-x.png` | 必须与人物 ID 相同 |
| 雨声音效 | `assets/audio/sfx/rain.mp3` | 用途名，不用“最终版” |

美术成员交付素材时必须同时说明：文件名、用途、是否透明背景、建议显示位置、版权/来源。前端成员不应擅自拉伸或裁掉重要内容；实际页面效果由美术确认。

### 5.2 公共 CSS 组件名

以下 CSS 类名由公共样式负责人实现，其他页面可直接使用：

| 中文界面组件 | 英文 CSS 类名 | 用途 |
| --- | --- | --- |
| 主按钮 | `button button--primary` | 开始游戏、确认、保存 |
| 次按钮 | `button button--secondary` | 返回、取消 |
| 危险操作按钮 | `button button--danger` | 确认覆盖存档 |
| 成功提示 | `feedback feedback--success` | 保存成功、获得物品 |
| 警告提示 | `feedback feedback--warning` | 尚未调查完毕 |
| 错误提示 | `feedback feedback--error` | 登录失败、存档损坏 |
| 内容卡片 | `content-card` | 成就、介绍、成员信息 |
| 弹窗遮罩 | `modal-backdrop` | 背包、确认覆盖存档 |
| 弹窗内容 | `modal` | 背包详情、确认框 |
| 已完成状态 | `is-completed` | 调查过的热点、已完成拼图 |
| 已禁用状态 | `is-disabled` | 无存档时的继续游戏按钮 |

### 5.3 游戏页固定区域

`pages/game.html` 是全游戏的“舞台”。公共结构先预留这些区域，模块只能往自己的区域填内容，不随意重写整页：

```html
<!-- game.html：游戏主界面的公共结构。 -->
<header class="game-header">
  <a class="button button--secondary" href="menu.html">返回主菜单</a>
  <button class="button button--primary" id="save-button" type="button">保存游戏</button>
</header>

<main>
  <section id="game-scene" aria-label="当前场景"></section>
  <section id="game-story" aria-label="剧情内容"></section>
  <section id="game-actions" aria-label="可执行操作"></section>
  <aside id="inventory-panel" aria-label="背包"></aside>
  <div id="feedback" aria-live="polite"></div>
</main>
```

| 区域 ID | 谁写入内容 | 不应该放什么 |
| --- | --- | --- |
| `game-scene` | 场景/探索模块 | 存档逻辑 |
| `game-story` | 剧情模块 | 背包详情 |
| `game-actions` | 剧情、探索、拼图模块 | 长篇介绍文案 |
| `inventory-panel` | 背包模块 | 新剧情节点 |
| `feedback` | 全局提示工具 | 永久剧情内容 |

---

## 6. 清单六：分支、PR 与验收规则

### 6.1 Git 分支命名

```text
feature/core-storage       全局状态与存档
feature/auth               注册和登录
feature/prologue-story     祠堂剧情
feature/village-exploration 村口探索与对话
feature/map-puzzle         地图拼图
feature/achievements       成就页和成就展示
feature/about-pages        项目、团队和成员页面
feature/site-style         公共样式与响应式布局
```

每位成员从包含公共骨架的最新提交创建自己的分支。不要在自己的分支里顺手修改无关模块。

### 6.2 PR 描述模板

```md
## 本次完成
- [用一句话说明功能]

## 修改文件
- [文件路径]

## 使用的接口
- [例如：`MAP_PUZZLE_COMPLETED`、`restored-village-map`]

## 自测方式
1. [从哪个页面开始]
2. [点击/操作什么]
3. [预期看到什么]

## 未完成或需讨论
- [没有则写“无”]
```

### 6.3 合并前最低验收

| 检查项 | 验收问题 |
| --- | --- |
| 页面可达 | 能否从现有入口到达此功能，并返回？ |
| 名称一致 | 是否使用本文件规定的路径、ID、素材名和 CSS 类名？ |
| 主流程有效 | 操作后是否真的改变游戏进度，而非只弹出一段文案？ |
| 不重复结算 | 重复点击、刷新或读档后，物品/成就会不会重复出现？ |
| 存档正确 | 保存、刷新、继续后，当前节点、背包、调查和拼图结果是否一致？ |
| 错误可见 | 缺条件或失败时，玩家是否看到能理解的提示？ |
| 基本适配 | 390px 手机宽度下，核心按钮能否点击且没有横向溢出？ |

---

## 7. 在开始写代码前，必须由全组确认的事项

下列内容不是全局负责人一个人能替大家决定的。开会确认后，在方框内填写结论和负责人，并将本文件版本号改为 `V1.0 已确认`。

| 待确认事项 | 为什么必须确认 | 最终结论 | 确认人 |
| --- | --- | --- | --- |
| 是否采用单浏览器、单用户、单存档 | 影响原 PRD 的账户/游客验收 | 待确认 | 待填写 |
| 游戏展示名：`《借灯》` 或其他 | 影响封面、README、介绍页和素材 | 待确认 | 待填写 |
| 小 X 和三位村民的正式显示名 | 影响剧情文案和人物资料 | 待确认 | 待填写 |
| 三件随身物品的名称、获得方式和用途 | 决定物品 ID 与祠堂通关条件 | 待确认 | 待填写 |
| 小 X 信任选择的真实选项和后续影响 | 决定选择 ID 和剧情分支 | 待确认 | 待填写 |
| 拼图交互方式 | 必须同时考虑鼠标、触屏和键盘 | 待确认 | 待填写 |
| 第一项成就的正式名称与触发条件 | 必须实际可解锁，不能是空壳 | 待确认 | 待填写 |
| 公共视觉风格和素材来源 | 美术决定风格，前端负责实现 | 待确认 | 待填写 |
| 每个模块的实际负责人 | 防止重复开发和 PR 冲突 | 待确认 | 待填写 |

---

## 8. 建议的启动顺序

1. 全组确认第 7 节，特别是存档方案是否符合课程验收。
2. 全局负责人提交第一版骨架：目录、空页面、`game.html` 公共区域、初始状态、保存/读取的最小实现。
3. 所有人从这次提交创建功能分支。
4. 剧情组先冻结 V1 节点、物品、人物和选择清单；全局负责人把新增 ID 追加到第 3 节。
5. 视觉组给出素材命名和风格稿；公共样式负责人实现第 5.2 节组件。
6. 各模块按第 4 节事件接口接入游戏主流程。
7. 每个 PR 按第 6 节自测；全局负责人审核后合并。

> 本文档不是为了限制组员，而是为了让大家各自完成的部分最后真的能连成一款游戏。任何需要新增 ID、事件或公共文件的 PR，先更新本文件，再开始实现。
