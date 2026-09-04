# 探索与对话模块接口说明

本版依据本地 story-line 分支 docs/game-line 中的四份剧情文档，并使用 cbece19ed83f0c63369d7b1cf60cb8775be12861 的真实引擎验证。新规定优先于旧演示和已废弃公共约定。负责 R09/R10/R12；成就 R16 见 ../achievements/interface.md。只交付文件包，不直接修改仓库。

## 模块边界与目录

脚本放在 assets/js/exploration/data 和 assets/js/exploration/game，样式放在 assets/css/exploration，素材在 assets/images/exploration/items，页面为 pages/exploration/game.html。剧情组继续使用 assets/js/game-line。本包不提供同名公共 game/data 文件。

探索负责热点、行走、对象调查、具体对白和两类背包。剧情决定 Node、前置和出口；协调器是 enterStory 的唯一调用者；全局状态校验来源并提交；保存由存档模块负责。探索不传 nextNodeId、不改 currentNodeId、不直接调用 enterStory、不直接发奖。物品和线索来自已提交 inventory/clues。

## 宿主输入（需要全局负责人实现）

`createExploration(host)` 返回探索服务。host 由协调器注入，不是 window.WhiteLamp.story 本身。

| 方法 | 参数 | 返回与时序 |
| --- | --- | --- |
| getContext() | 无 | 同步读取下面的模块投影，失败抛错 |
| subscribe(listener) | 无参数更新回调 | 返回取消订阅函数；完整提交后及身份变更时通知 |
| dispatchExternalEvent(event, meta) | 新格式外部事件；meta={storageScope} | 同步或 Promise<{ok:boolean,message?:string}>；必须等外部事实、剧情检查点及效果提交结果确定后返回 |

getContext 返回：

```js
{
  storageScope: "guest", // 或 account:<userId>
  state: {
    facts: [],
    inventory: ["burned-work-id", "blue-glass-bead"],
    clues: [],
    storyCheckpoint: {
      nodeId: "prologue-wake",
      nodeRevision: 1,
      completedMilestoneIds: [],
      completedNodeIds: [],
      completedStageIds: [],
      pendingCommands: []
    }
  },
  commands: [] // 已提交的 StoryResponse.commands；与 pendingCommands 对应
}
```

这是探索需要的投影，不是完整游戏存档 schema。协调器必须在 StoryResponse.commit 提交成功后提供命令。commands 的 payload 与剧情文档完全一致。对于相同 Node/handoff，commandId 固定为 cmd-{nodeId}-{handoffId}；禁止重建随机 commandId。

本模块校验命令、身份、字段和当前目标，不能代替状态模块的事务、事实生产者登记及全存档校验。未知目标或 Node 版本报错，不猜测下一节点。其他模块字段允许保留。

## 外部事件

调查发 OBJECT_INVESTIGATED，payload.objectId 是调查目标 ID（如 burned-work-id），不再使用旧 prologue-take-key-a 动作 ID。对话发 NPC_TALKED 或 NPC_TALK_PROGRESS，必须有 conversationId 和 npcId。

```js
{
  eventId: "evt-cmd-prologue-belongings-shrine-belongings-burned-work-id-object_investigated",
  eventType: "OBJECT_INVESTIGATED",
  source: "exploration",
  causedByCommandId: "cmd-prologue-belongings-shrine-belongings",
  resultFactIds: ["burned-work-id-investigated"],
  payload: { objectId: "burned-work-id" }
}
```

source 固定为事实登记表指定的 exploration 或 conversation。事件先交协调器；状态按 eventId 去重、校验当前命令及事实生产者，成功后协调器再调用 enterStory。不可把这里的结果数组直接拼到全局事实中。事件 ID 在同一局同一操作重试时稳定，去重记录必须按存储域和游戏局隔离。

同一探索命令允许报告多个对象；报告一个对象后，其余目标未完成时命令必须保留。三名村民同时存在三个命令。取消/失败分别发送 EXTERNAL_INTERACTION_CANCELLED/EXTERNAL_INTERACTION_FAILED，resultFactIds 为空，payload.targetId 对应当前任务；失败还带 errorCode。

## 服务方法

| 方法 | 参数 | 返回/错误 |
| --- | --- | --- |
| getCurrentSceneId() | 无 | shrine/village/old-house；检查点错误抛错 |
| getSceneView(sceneId) | 当前地点 | {name,interactions}；只列当前 Node 已发出的任务和可回读结果 |
| getLayout() | 无 | 当前热点坐标、标记和动作；不包含剧情转移 |
| listItems(layer?) | items 或 clues，可省略 | 已获得目录项，包含 id/name/image/description/source/layer/obtained:true |
| interact(sceneId, actionId, options?) | options 可为 {confirm:true} | Promise<{ok,message,requiresConfirmation?,commandId?}>；不确定提交后锁定写入 |
| reportProgress(commandId,factIds) | 当前对话及已向玩家传达的事实 | Promise<提交结果>；只接受该对话拥有的事实，格式或来源错误抛错 |
| cancel(commandId,errorCode?) | 当前探索/对话命令；可选错误码 | Promise<提交结果>；无错误码为主动取消，否则为执行失败 |
| getMapCommand() | 无 | 当前完整 REQUEST_MINIGAME 命令或 null |
| canStartMapPuzzle() | 无 | 是否存在合法地图命令 |
| getExitStatus() | 无 | {canLeave:false,message}；说明当前缺项或请使用剧情操作，不自行推进 |
| subscribe(listener) | 更新回调 | 取消函数 |
| dispose() | 无 | 清理全部订阅，可重复调用 |

对话首次 interact 展示完整目标对应内容，返回 requiresConfirmation:true，不报告完成；玩家确认后再次传 confirm:true 才报告谈话事实。确认标记只在当前视图实例内保存，不写成 Node 的句子序号。读档后可以重放谈话，再确认。可选追问入口单独展示，跳过不阻断交钥匙。

多轮对话可接入 reportProgress；调用方必须确保事实确已传达。完整谈话的必需事实不能借进展接口提前结算，必须通过确认完成。修改对白轮数不修改事实 ID。内置对白已按《剧情Node推进》补齐 B 工作证、钥匙来源、苏禾身份、旧事故和老宅四类证据。

当前上游版本没有把可选 x-memory-deflection-noticed 纳入交钥匙 handoff 的目标，因此拒绝其对应事实。当前界面保留追问对白，只提交 key-a-given-by-x；不伪造可选事实。详见 engine-compatibility.md。上游修复后必须重新联合验收，不可仅在 goalIds 加一项把可选变为必选。

## 页面与界面挂载

`mountGamePage({host,openMap?,saveProgress?,documentRoot?})` 返回卸载函数。页面组合探索、背包和成就预览；不渲染正式 game-story，不代做剧情操作。全局入口在状态恢复后挂载，并自行渲染 StoryResponse.presentation.actions，按 actionId 回传协调器。

openMap 接收完整命令对象，而非旧版字符串 puzzleId。小游戏完成后由小游戏模块提交文档规定的 MAP_PUZZLE_COMPLETED；地图取消不能回报完成。旧 onLeave 参数已移除：leave-shrine/go-old-house 都由剧情 presentation 指定，不能以旧“离开地点”回调跳 Node。

saveProgress() 返回或异步返回 {ok,message?}；未接入时按钮禁用，失败不得显示成功。真实保存由负责人绑定并复核 storageScope；本模块仅做页面前后身份复核。

底层 `mountExploration({module,sceneRoot,actionsRoot,inventoryRoot,showFeedback,openMap})` 返回清理函数；showFeedback(message,kind)，openMap(command)。只创建本模块子容器。背包可单独通过 inventory.js 的 `mountInventory({module,root,showFeedback})` 挂载；module 仅需 listItems 和 subscribe。

页面公共区仍保留 game-scene、game-story、game-actions、inventory-panel、feedback、save-button。合并到团队 pages/game.html 时只整合所需区域与导入，不整页覆盖。当前模块独立页面与成就页可双向导航。

## 账户及生命周期

账户脚本仍按 config、storage、crypto、auth-service 顺序加载；await window.WhiteLamp.auth.getSession() 后判断 ok 和 data。失败显示 message；data:null 走登录。按 storageScope 读取存档，异步加载期间身份变化则丢弃旧结果；得到有效投影后挂载。

退出先停止旧界面及旧写入，logout 成功才去登录页；失败可见。退出不删除存档。两个独立页面都要重新恢复会话，不能假定跨页保留上一页变量。账户示例 white-lamp:save:<scope>:v1 不是已确认保存 API，本包不创建或迁移该键。

## 正式接入仍需确认

协调器的实际函数名及事件事务结果、全局 clues 投影、成就提交时序、会话切换通知、失败后的重试/返回菜单操作由各负责人协商。本包 dispatchExternalEvent 是适配输入约定，不宣称团队已经实现。

本包已经用真实 game-line 引擎完成流程验证；其原样快照仅在 test/exploration/vendor/game-line，正式接入使用团队 assets/js/game-line。engine-host.js 仅模拟全局状态、协调器与演示保存，不允许当作正式 core 直接上线。

新游戏由协调器先以 context={facts:[],storyCheckpoint:null} 调用 enterStory，提交首次响应后再挂载探索。本文 getContext 示例是首次提交后的投影，不是 new-game 请求体。引擎 payload.goals[].goalId 是里程碑 ID，不等于 resultFactIds 中的事实 ID，不能直接相互复制。
