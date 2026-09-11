# V2 剧情与 NPC 阅读适配样例

> 适用范围：将 PR #23 剧情响应和卢正松 NPC 样例转换为统一阅读输入。
> 实现位置：`assets/js/core/reading-contract.js`。

## 0. 资产核对结论（2026-09-09）

| 来源 | 已有内容 | 没有的内容 | 当前处理 |
|---|---|---|---|
| 同级目录 `v2-luzhengsong/` | 4 份 Markdown；三场景 9 个物体动作、9 个 NPC/声音对话动作的 ID/目标/事实/参考坐标；老板 15 段完整对白 | 小 X、拒签户、老人、门外声音等其余完整逐句对白；NPC 立绘、头像、音频 | 老板对白已录入 `conversations-v2.js`；其余任务继续使用旧单段文本回退，不补写剧情 |
| PR #23（`d8a4b87`） | 新增 `docs/game-line/V2剧情接口确认.md`，说明 `StoryRequest/StoryResponse`、`presentation` 和 `commands` 契约 | 没有新增或修改剧情 JS；没有 NPC 对话数据；没有图片、音频等 NPC 美术资产；文档第 5 节仍把 8 组真实请求/响应列为“必须补充” | 只作为接口依据，不把它误当成剧情/NPC 资产包 |
| 仓库既有剧情模块 | `assets/js/game-line/data/` 下已有 `prologue.js`、`village.js`、`old-house.js` 和 11 Node 运行数据 | 这些文件不是 PR #23 新增内容；不包含 NPC 立绘 | 继续由剧情引擎提供正式 `presentation`，阅读组件只消费返回值 |

因此，目前可直接用于 V2 橙光式多段 NPC 阅读的新增资产只有“老板 15 段对白”。`v2-luzhengsong/` 的对象表属于业务映射和构图交接，不是完整剧情脚本；PR #23 属于接口说明，不是剧情内容提交。

## 1. 剧情样例

原始 `presentation`：

```js
{
  presentationId: "present-prologue-wake",
  sceneId: "shrine",
  blocks: [
    {
      blockId: "rain-has-stopped",
      blockType: "narration",
      text: "暴雨停了。你在一座潮湿的旧祠堂里醒来。"
    },
    {
      blockId: "recent-memory-gap",
      blockType: "narration",
      text: "思考和行动都没有问题，但近期的记忆只剩下一段空白。"
    }
  ],
  actions: [
    {
      actionId: "confirm-wake-context",
      label: "确认当前处境",
      actionType: "advance"
    }
  ]
}
```

适配调用：

```js
const input = adaptStoryPresentation(presentation);
reader.open(input);
```

结果：

```text
rain-has-stopped
→ 继续
→ recent-memory-gap
→ 阅读完毕
→ 显示“确认当前处境”
→ onAction("confirm-wake-context")
→ gameFlow.handleStoryAction("confirm-wake-context")
```

“继续”不产生 `story-action`；只有玩家点击剧情 action 才进入 game-flow。

## 2. NPC 样例

卢正松老板样例的展示数据：

```js
{
  speaker: "老板",
  dialogues: [
    {
      lineId: "shopkeeper-01",
      text: "【旁白】小卖部的卷帘门只升起一半。"
    },
    {
      lineId: "shopkeeper-02",
      text: "【老板】买东西自己拿。"
    }
  ]
}
```

业务身份不放进展示数据：

```js
const input = adaptConversationInput({
  conversation,
  conversationId: "village-shopkeeper-inquiry",
  npcId: "villager-1",
  actionId: "shopkeeper-inquiry",
  commandId: originalCommand.commandId
});
```

阅读结束后的正确链路：

```text
reader.onComplete()
→ 对话适配器确认 conversation
→ interact(..., {confirm: true})
→ 生成 NPC_TALKED
→ host.dispatchExternalEvent(event)
→ game-flow
→ 最新 StoryResponse
```

阅读器不能直接提交 `NPC_TALKED`。

## 3. 字段映射表

| 来源字段 | 统一字段 | 说明 |
|---|---|---|
| `presentation.blocks[].blockId` | `items[].id` | 阅读定位，不存档 |
| `presentation.blocks[].blockType` | `items[].kind` | 只允许 narration/system |
| `presentation.blocks[].text` | `items[].text` | 原文显示 |
| `dialogues[].lineId` | `items[].id` | 阅读定位，不存档 |
| `dialogues[].text` | `items[].text` | 适配阶段保留原文；渲染阶段把开头 `【角色】` 标签移入姓名牌 |
| `presentation.actions[].actionId` | `actions[].actionId` | 只在剧情阅读结束后显示 |
| `commandId` | `metadata.commandId` | 业务内部使用，不渲染 |

## 4. 交接验收

- [ ] 剧情两段文本按原顺序显示。
- [ ] action 只在最后出现。
- [ ] 老板 15 段对白按原顺序显示。
- [ ] `lineId` 没有丢失或改名。
- [ ] `speaker` 不被错误地套到每一条台词上。
- [ ] `【旁白】`、`【老板】`、`【你】`、`【小 X】` 的文字与身份都保留，渲染时标签显示为姓名牌。
- [ ] NPC 读完前不发送 `NPC_TALKED`。
- [ ] 关闭不伪造完成。
- [ ] 连续点击不重复完成。
- [ ] 失败不显示“已完成”。
