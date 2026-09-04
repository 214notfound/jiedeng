# 成就模块接口说明

R16 由 assets/js/achievements 独立维护规则和页面，页面为 pages/achievements/achievements.html。使用 assets/css/achievements/achievements.css，并复用探索模块基础卡片样式。

## 输入与规则

`getAchievementEvents(context)` 从已提交 context.state.facts 与 achievements 判断，返回待提交事件数组。出现 map-puzzle-completed 且尚无 map-restorer 时返回：

```js
{
  eventId: "achievement-map-restorer",
  eventType: "ACHIEVEMENT_UNLOCKED",
  onceKey: "achievement:map-restorer",
  payload: { achievementId: "map-restorer" }
}
```

状态模块按局和 storageScope、onceKey 幂等提交。协调器在外部/剧情事务提交成功后调用此规则，将返回事件提交到状态模块，再通知视图。剧情不得自己发 ACHIEVEMENT_UNLOCKED。重复调用返回同一待提交事件；已提交解锁后返回空数组。

通知不是唯一依据：即使错过 STORY_MILESTONE_REACHED 等通知，下次从已提交 facts 重算也能找出待解锁项。失败时不把返回的待提交事件当成成功。正式成就规则事件须加入公共登记表并明确 producer 为成就模块。

## 展示接口

`createAchievements({getContext,subscribe})` 返回 listAchievements、subscribe、dispose。只需要：
- storageScope 为 guest 或 account:<userId>；
- state.facts 和 state.achievements 为唯一字符串数组；
- state.achievementTimes 可选，用 ISO 时间字符串记录已解锁成就。

不需要探索 Node、inventory、commands 或写接口。map-restorer 没有地图事实时视为不一致并报错；地图事实已成立但解锁事件待提交时仍显示未解锁，不假装写入成功。

`mountAchievements({module,root,showFeedback,notifyUnlocks=true})` 显示列表，返回卸载函数。showFeedback(message,kind)。同一个 service 实例只选一个视图发新解锁提示；初始已解锁不重播。多实例整合时协调器必须指定唯一提示方，其余传 false。

`mountAchievementsPage({host,documentRoot=document})` 挂载独立页面并返回清理函数，关闭历史解锁通知。页面往返、身份切换时清理并重建。成就服务引用 exploration/game/host-reader.js 的通用身份订阅辅助，视图引用 view-utils.js；不依赖探索业务服务或 Node 数据。提交包须保留这些基础依赖。

## 验收边界

新档锁定，真实地图完成事实提交后由本模块判断并请求解锁；存档按身份保存已提交状态。独立演示跨页和刷新已验证；真实账户、真实地图和正式存档仍待各负责人联合验收。账户与退出顺序见 ../exploration/interface.md。

本轮地图完成事件已交给原样的真实剧情引擎验证，背包与成就展示使用提交后的状态；小游戏成功输入由测试入口模拟，不代表已验收地图玩法。测试存储按 guest/account:a/account:b 隔离，不代表已经实现团队账户和正式存档。
