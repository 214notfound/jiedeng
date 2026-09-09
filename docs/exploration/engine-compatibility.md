# 真实剧情引擎兼容说明

## 本轮基准

读取本地 story-line 分支，不切换、不合并、不推送仓库。验收基准提交为 cbece19ed83f0c63369d7b1cf60cb8775be12861。剧情引擎是浏览器中运行的纯 JavaScript 内核，不是另一个 HTTP 后端服务。

八个原样脚本及哈希在 test/exploration/vendor；只为独立验收提供完整依赖，不修改或覆盖团队 assets/js/game-line。实际投产使用团队的原文件。分支后续更新时必须重新测试。

## 加载与所有权

正式协调器先按顺序加载：

1. assets/js/game-line/data/story-registry.js
2. assets/js/game-line/data/prologue.js
3. assets/js/game-line/data/village.js
4. assets/js/game-line/data/old-house.js
5. assets/js/game-line/game/story-validator.js
6. assets/js/game-line/game/story-runtime.js
7. assets/js/game-line/game/story-request.js
8. assets/js/game-line/game/story-engine.js

入口是 window.WhiteLamp.story.enterStory(request)。以上是仓库根目录相对路径；在 pages/exploration/game.html 中引用时前缀应为 ../../。这些为普通脚本，有固定顺序；探索自身为 ES Module，不依赖剧情内部全局对象。

唯一调用者是协调器。探索服务、背包、成就服务均不直接调用该入口。当前包提供挂载接口，实际协调器和状态实现仍由相应负责人维护。

## 最小数据传递

1. 新游戏：协调器传入 contractVersion=1.0、唯一 requestId、source=game-shell、input.type=new-game，以及 context={facts:[],storyCheckpoint:null}。
2. 首次剧情提交成功：把 response.commit.checkpoint 和效果提交到状态模块，再将 response.commands 及状态投影交给探索 host。
3. 玩家操作：探索或对话服务调用 host.dispatchExternalEvent(event,{storageScope})。事件包含 eventId/eventType/source/causedByCommandId/resultFactIds/payload，不包含下一 Node。
4. 协调器先提交外部事实，再把 input={type:external-event,event} 和已提交 facts/checkpoint 交给引擎。
5. 把剧情 commit 的检查点与效果作为一个事务提交；失败不得发布命令、成功通知或新展示。
6. 已提交事实交给成就规则 getAchievementEvents，成就事件由状态模块提交，界面只显示已提交解锁。
7. presentation.blocks/actions 的渲染归游戏壳；原样保持顺序和 actionId。地图启动收到完整 REQUEST_MINIGAME，成功由小游戏发事实。

getContext 必须同步读已恢复的快照，不能每次都返回 Promise。异步账户 getSession 和存档恢复应在挂载之前完成；dispatchExternalEvent 支持异步，但须在事务结果明确后返回。

goals[].goalId 是里程碑 ID，resultFactIds 是事实 ID，例如 burned-work-id-checked 与 burned-work-id-investigated 不可混用。

## 已修正的内容缺项

按《剧情Node推进》核定：工作证能辨认公司与姓 B；蓝珠磨花且无字；小 X 说钥匙在出事地点附近捡到；苏禾是近期失踪的村小学教师；老板称 B 工程师；老人先叫 A 后否认，公开旧事故为学校后山山体滑坡死过孩子；校服旁证据与蓝珠建立实体联系；门外再次呼名后声音消失。具体对白轮数不参与剧情检查点。

已取消的 trust-x/doubt-x 不再添加。本包不揭露后续身份答案。

## 已确认规则：追问对白不记录可选记忆事实

剧情与探索侧已确认采用方案 A。`prologue-key-and-memory` 只以 `key-received-from-x` 为目标；“追问过去，再接过钥匙”只改变本次展示的对白路径，不产生或保存 `x-deflects-memory-question-noticed`。

本包行为：

- 玩家仍能选择追问过去，内容正常展示。
- 确认后只报告当前命令支持的 key-a-given-by-x，完成交钥匙并推进。
- 不把追问选择或对白展示解释为新增剧情事实。
- `reportProgress` 拒绝这项未约定的事实，也不允许用“中途进展”提交完整谈话。
- 原引擎快照保持不变；有专门回归测试固定上述行为。

不要把可选里程碑加入当前 `goalIds`，也不要由对话模块越权补记事实。若未来产品重新要求保存这项选择，必须先由剧情合同提供不会将可选项变成必选条件的正式能力，再同步调整数据和测试；该扩展不属于当前版本。

因此：当前必需主线、追问展示和保存语义已经统一，不再把此项列为待解决的上游缺口。

## 快照检出稳定性

来源清单按文件原始字节计算 SHA-256。快照目录内的 `.gitattributes` 使用 `*.js -text`，防止 Git 在不同平台检出时转换换行并使哈希失效。提交前必须在一次干净的 Git 重新检出后再次运行哈希测试。

## 演示与正式系统的区别

- demo=1：加载原样真实剧情引擎；engine-host.js 模拟协调器、状态提交和 sessionStorage。旧 story-fixture.js 只用于隔离单元测试，不驱动当前浏览器演示。
- 演示地图只用确认框注入成功/取消事件，不提供队友的拼图玩法。
- 演示保存键是 jiedeng:demo:engine-handoff:v3:<storageScope>，不读写正式账户存档。刷新恢复调用真实 resume。
- 不带 demo=1：等待正式宿主。未注入时不可游玩，不能当作已接入账户/存档。
- 正式接入后才可移除演示脚本和其测试依赖；删除前确认页面不会加载它们，不删除队友 demo。
