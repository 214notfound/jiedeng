# 成就模块接口说明

## 职责边界

R16 位于 `assets/js/achievements`，独立页面为 `pages/achievements/achievements.html`。成就模块只根据已提交事实生成待提交事件，并显示已提交成就；不推进剧情、不完成地图、不写账户存档。

## 规则接口

`getAchievementEvents(context)` 读取 `state.facts` 和 `state.achievements`。存在 `map-puzzle-completed` 且尚未提交 `map-restorer` 时返回：

```js
{
  eventId: "achievement-map-restorer",
  eventType: "ACHIEVEMENT_UNLOCKED",
  onceKey: "achievement:map-restorer",
  payload: { achievementId: "map-restorer" }
}
```

状态模块按游戏局、`storageScope` 和 `onceKey` 幂等提交。规则返回事件不等于解锁成功；只有状态提交后，页面才显示已解锁。

## 展示接口

`createAchievements({getContext,subscribe})` 返回 `listAchievements/subscribe/dispose`。输入要求：

- `storageScope` 为 `guest` 或 `account:<userId>`；
- `state.facts`、`state.achievements` 为无重复字符串数组；
- `state.achievementTimes` 可选，值为 ISO 时间字符串。

`listAchievements()` 每项包含 `id/name/description/image/unlocked/unlockedAt/available/warning`。单条记录缺少地图事实或时间无效时，该条返回 `available:false` 和说明，页面显示“记录异常，暂不可用”；其他卡片及页面生命周期不受影响。

`mountAchievements({module,root,showFeedback,notifyUnlocks=true})` 返回卸载函数。同一服务实例只允许一个视图负责新解锁提示。`mountAchievementsPage({host,documentRoot?})` 挂载独立页面，跨页或身份切换时应销毁旧实例。

## 联调边界

地图模块提交 `map-puzzle-completed`；状态/协调器调用规则并提交成就；账户和存档负责人保存对应 `storageScope` 的结果。演示跨页刷新已验证，正式账户、正式存档和真实地图仍需团队联合验收。
