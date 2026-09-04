// 成就规则独立于剧情引擎，只有状态提交成功后才显示解锁。
import test from "node:test";
import assert from "node:assert/strict";
import {getAchievementEvents,createAchievements} from "../../assets/js/achievements/game/achievements.js";
test("地图事实生成一次稳定事件，剧情通知丢失也能重算",()=>{
 const context={storageScope:"guest",state:{facts:["map-puzzle-completed"],achievements:[]}};
 const event=getAchievementEvents(context)[0];
 assert.equal(event.eventType,"ACHIEVEMENT_UNLOCKED");assert.equal(event.onceKey,"achievement:map-restorer");
 assert.deepEqual(getAchievementEvents(context),[event]);
 context.state.achievements.push("map-restorer");assert.deepEqual(getAchievementEvents(context),[]);
});
test("显示只读取已提交成就，保留其他模块成就",()=>{
 const context={storageScope:"account:a",state:{facts:["map-puzzle-completed"],achievements:["other"]}};
 const service=createAchievements({getContext:()=>context,subscribe:()=>()=>{}});
 assert.equal(service.listAchievements()[0].unlocked,false);
 context.state.achievements.push("map-restorer");assert.equal(service.listAchievements()[0].unlocked,true);
 service.dispose();assert.throws(()=>service.listAchievements());
});
test("无地图事实的成就和不合法时间被拒绝",()=>{
 assert.throws(()=>getAchievementEvents({state:{facts:[],achievements:["map-restorer"]}}));
 assert.throws(()=>createAchievements({getContext:()=>({storageScope:"guest",state:{facts:[],achievements:[],achievementTimes:{"map-restorer":"invalid"}}}),subscribe:()=>()=>{}}));
});

