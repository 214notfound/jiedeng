<!-- 本文件约定探索模块的职责、宿主输入与外部事件交接。 -->

# 探索模块接口说明

## 职责边界

探索功能覆盖 R09、R12：场景发光热点、鼠标点击调查、调查结果回读和两层背包。R10 的对白与事件生产位于 `assets/js/exploration/conversation` 子目录，见 `../conversation/interface.md`；页面通过 `assets/js/exploration/integration` 组合二者。这样 `assets/js` 一级只保留 `exploration` 与 `achievements` 两个业务目录。

探索模块不拥有剧情 Node 推进、NPC 对话、账户、存档、成就结算和地图小游戏。正式协调器提供已提交状态与剧情命令，探索只提交外部事件。

## 宿主输入

`createExploration(host)` 的 `host` 必须提供：

| 字段 | 类型 | 约定 |
| --- | --- | --- |
| `getContext()` | Function | 同步返回当前已提交投影 |
| `subscribe(listener)` | Function | 状态变化通知，返回清理函数 |
| `dispatchExternalEvent(event)` | Function | 可异步；成功返回 `{ok:true, state, duplicate?, warning?}`，失败返回 `{ok:false, code, error}`；由宿主负责校验与事务提交 |

`getContext()` 返回：

```js
{
  storageScope: "guest", // 或 account:<userId>
  state: {
    facts: [],
    inventory: [],
    clues: [],
    storyCheckpoint: {
      nodeId: "prologue-belongings",
      nodeRevision: 1,
      completedMilestoneIds: [],
      completedNodeIds: [],
      completedStageIds: [],
      pendingCommands: []
    }
  },
  commands: []
}
```

`storageScope` 在模块实例生命周期内不可改变。账户与异步存档恢复必须先完成，再挂载模块；身份切换时卸载旧实例并重新创建。

## 公开接口

`createExploration(host)` 返回：

| 方法 | 参数 | 返回 |
| --- | --- | --- |
| `getCurrentSceneId()` | 无 | `shrine/village/old-house` |
| `getSceneView(sceneId)` | 当前地点 ID | 名称、稳定场景展示字段及交互列表 |
| `getLayout()` | 无 | 当前剧情 Node 的百分比热点；不包含玩家位置或距离门槛 |
| `listItems(layer?)` | `items/clues`，可省略 | 已获得背包条目 |
| `getItemDetail(itemId)` | 稳定物品/线索 ID | 已提交或已调查条目的只读详情；不可读时为 `null` |
| `interact(sceneId, actionId)` | 当前地点和动作 ID | `{ok,message}` |
| `cancel(commandId,errorCode?)` | 探索命令 ID、可选错误码 | 协调器结果 |
| `getMapCommand()` | 无 | 地图命令或 `null` |
| `canStartMapPuzzle()` | 无 | 布尔值 |
| `subscribe(listener)` | 回调 | 清理函数 |
| `dispose()` | 无 | 释放订阅并使实例失效 |

背包目录保存 `id/name/image/detailImage?/description/source`。`image` 是背包列表使用的轻量缩略图；`detailImage` 是可选正式特写，详情优先使用它，缺省时回退到 `image`。运行时 `state.inventory` 中的 ID 返回 `layer:"items"`，`state.clues` 中的 ID 返回 `layer:"clues"`；同一 ID 同时出现在两数组会被拒绝。地图碎片和完整地图属于物品，老宅照片、校服、刻痕、名单均由真实状态作为线索提供。

`getSceneView(sceneId)` 额外稳定返回 `sceneId/sceneVariant/sceneImage`。普通场景的 `sceneVariant` 为 `default`；老宅只允许 `door-closed/door-open`。探索模块依据已提交的 `old-house-door-opened` 事实生成该展示字段，页面只消费结果，不得读取事实、检查热点是否消失或根据 Node 自行推断图片。

## 探索事件

调查完成事件：

```js
{
  eventId: "evt-<commandId>-<actionId>-object_investigated",
  eventType: "OBJECT_INVESTIGATED",
  source: "exploration",
  causedByCommandId: "<剧情命令 ID>",
  resultFactIds: ["<当前目标允许的事实 ID>"],
  payload: { objectId: "<物体 ID>" }
}
```

取消或失败使用 `EXTERNAL_INTERACTION_CANCELLED` / `EXTERNAL_INTERACTION_FAILED`，结果事实必须为空；失败载荷必须包含 `errorCode`。事件不包含下一 Node。`resultFactIds` 只是候选事实，由宿主交给剧情引擎校验；剧情响应、检查点和状态事件成功后才原子提交为正式事实。探索模块不得调用 `applyGameEvent()`。

## 页面组合

### 场景人物入口的视觉边界

NPC 在场景中的坐标只表示一个发光点击点。三张场景背景不绘制 NPC 的头像、半身或全身，也不依据人物头部、身体或对话框遮挡范围换算坐标。玩家点击发光点后，页面进入统一 `reading` 流程，并由探索视图中的独立人物层显示本次被点击的 NPC；退出或成功读完后清除人物层。人物展示不反向改变场景热点坐标，也不新增全局页面状态。

第一周人物映射为 `companion-x`（小X）、`villager-1`（小卖部老板）、`villager-2`（拒签户）、`villager-3`（年老村民）。`unknown-caller` 是门外声音，不显示人物。A、B、苏禾和白灯客素材不在第一周探索链路中加载，避免越过当前剧情范围或提前泄露身份线。

场景中的可见按钮文案只作为当前开发兜底和无障碍名称；最终视觉按页面规则显示为光点或图标，不把长标签画进场景背景。NPC 点位与物体点位若属于不同剧情 Node，不会同时渲染，不能仅凭静态坐标距离判为点击冲突。

“查看当前调查状态”只显示调查待办或提示玩家按剧情区操作继续。`getExitStatus()` 保留原返回结构，不执行离场或切换 Node。

`createInteractionModule(host)` 是页面适配器，组合探索和对话的只读视图并按动作归属路由，不保存业务状态。它向现有 `mountExploration` 提供统一接口，避免页面直接了解两个业务子包。

正式页面由 `game-page-controller.js` 将 Host、地图入口和统一页面状态交给 `mountExploration`。探索模块只挂载到正式容器，不再维护独立游戏页或第二套页面状态。

`openMap(command)` 接收完整 `REQUEST_MINIGAME` 命令。地图成功事件由小游戏模块发送；探索模块不伪造成功事实，也不决定 `go-old-house`。

## 团队联调

- 剧情协调器确认正式 Host 函数名、事务结果和错误恢复。
- 状态负责人提供唯一的 `facts/inventory/clues/storyCheckpoint` 投影。
- 账户与存档负责人以 `storageScope` 隔离游客和账户，并在挂载前完成恢复。
- 地图负责人消费完整命令并提交 `MAP_PUZZLE_COMPLETED`；宿主在成功提交后再调用成就规则并登记成就。
- 游戏壳渲染剧情 `presentation.actions`，探索不得接管 Node 推进。
- 操作失败只把 `OPERATION_FAILED` 交给全局反馈映射，不在探索侧建立另一套最终玩家文案；详情的“×”、ESC 和浏览器/Android 返回继续由全局统一关闭。

测试夹具只用于自动化验收，不驱动正式页面。账户、剧情、成就和小游戏仍保留各自入口与职责边界。
