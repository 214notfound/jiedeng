# 探索模块接口说明

## 职责边界

探索功能覆盖 R09、R12：场景热点、键盘移动、物体调查、调查结果回读和两层背包。R10 的对白与事件生产位于 `assets/js/exploration/conversation` 子目录，见 `../conversation/interface.md`；页面通过 `assets/js/exploration/integration` 组合二者。这样 `assets/js` 一级只保留 `exploration` 与 `achievements` 两个业务目录。

探索模块不拥有剧情 Node 推进、NPC 对话、账户、存档、成就结算和地图小游戏。正式协调器提供已提交状态与剧情命令，探索只提交外部事件。

## 宿主输入

`createExploration(host)` 的 `host` 必须提供：

| 字段 | 类型 | 约定 |
| --- | --- | --- |
| `getContext()` | Function | 同步返回当前已提交投影 |
| `subscribe(listener)` | Function | 状态变化通知，返回清理函数 |
| `dispatchExternalEvent(event, meta)` | Function | 可异步，返回 `{ok, message?}` |

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
| `getSceneView(sceneId)` | 当前地点 ID | 名称及物体交互列表 |
| `getLayout()` | 无 | 玩家起点和物体热点 |
| `listItems(layer?)` | `items/clues`，可省略 | 已获得背包条目 |
| `interact(sceneId, actionId)` | 当前地点和动作 ID | `{ok,message}` |
| `cancel(commandId,errorCode?)` | 探索命令 ID、可选错误码 | 协调器结果 |
| `getMapCommand()` | 无 | 地图命令或 `null` |
| `canStartMapPuzzle()` | 无 | 布尔值 |
| `subscribe(listener)` | 回调 | 清理函数 |
| `dispose()` | 无 | 释放订阅并使实例失效 |

背包目录只保存 `id/name/image/description/source`。运行时 `state.inventory` 中的 ID 返回 `layer:"items"`，`state.clues` 中的 ID 返回 `layer:"clues"`；同一 ID 同时出现在两数组会被拒绝。地图碎片和完整地图属于物品，老宅照片、校服、刻痕、名单均由真实状态作为线索提供。

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

取消或失败使用 `EXTERNAL_INTERACTION_CANCELLED` / `EXTERNAL_INTERACTION_FAILED`，结果事实必须为空；失败载荷必须包含 `errorCode`。事件不包含下一 Node。协调器按 `eventId`、当前命令、事实生产者和 `storageScope` 校验并原子提交。

## 页面组合

`createInteractionModule(host)` 是页面适配器，组合探索和对话的只读视图并按动作归属路由，不保存业务状态。它向现有 `mountExploration` 提供统一接口，避免页面直接了解两个业务子包。

`mountGamePage({host,openMap?,saveProgress?,documentRoot?})` 返回卸载函数。正式模式由游戏壳注入宿主、地图入口和保存函数；不带 `demo=1` 时不会自行创建状态。演示模式使用真实剧情引擎快照及专用 `sessionStorage`，不是正式存档。

`openMap(command)` 接收完整 `REQUEST_MINIGAME` 命令。地图成功事件由小游戏模块发送；探索模块不伪造成功事实，也不决定 `go-old-house`。

## 团队联调

- 剧情协调器确认正式 Host 函数名、事务结果和错误恢复。
- 状态负责人提供唯一的 `facts/inventory/clues/storyCheckpoint` 投影。
- 账户与存档负责人以 `storageScope` 隔离游客和账户，并在挂载前完成恢复。
- 地图负责人消费完整命令并提交 `MAP_PUZZLE_COMPLETED`。
- 游戏壳渲染剧情 `presentation.actions`，探索不得接管 Node 推进。

测试夹具和 `demo=1` 只能用于独立验收。正式接入完成前不得删除队友页面、演示、账户、剧情或小游戏文件。
