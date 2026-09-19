// 成就规则独立于剧情引擎，只有状态提交成功后才显示解锁。
import test from "node:test";
import assert from "node:assert/strict";
import {getAchievementEvents,createAchievements} from "../../assets/js/achievements/game/achievements.js";
import {ACHIEVEMENTS} from "../../assets/js/achievements/data/achievements.js";
import {STORY_FACT_DEFINITIONS} from "../../assets/js/core/game-contract.js";
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
test("单条成就记录异常时降级，不影响成就列表",()=>{
 const inconsistent={storageScope:"guest",state:{facts:[],achievements:["map-restorer"]}};
 assert.deepEqual(getAchievementEvents(inconsistent),[]);
 const service=createAchievements({getContext:()=>inconsistent,subscribe:()=>()=>{}});
 assert.equal(service.listAchievements()[0].available,false);
 assert.match(service.listAchievements()[0].warning,/缺少地图完成事实/);
 const invalidTime={storageScope:"guest",state:{facts:["map-puzzle-completed"],achievements:["map-restorer"],
   achievementTimes:{"map-restorer":"invalid"}}};
 const timed=createAchievements({getContext:()=>invalidTime,subscribe:()=>()=>{}});
 assert.equal(timed.listAchievements()[0].available,false);
});
test("五个结局成就按正式剧情顺序独立登记",()=>{
 const endings=ACHIEVEMENTS.filter((item)=>item.category==="ending");
 assert.deepEqual(endings.map((item)=>item.id),[
  "ending-accomplice",
  "ending-defeated",
  "ending-erasure",
  "ending-curated-truth",
  "ending-full-account"
 ]);
 assert.deepEqual(endings.map((item)=>item.sequence),[1,2,3,4,5]);
 assert.equal(new Set(endings.map((item)=>item.requiredFacts[0])).size,5);
});
test("一次状态提交可以补登记所有已经满足但尚未解锁的成就",()=>{
 const context={storageScope:"guest",state:{
  facts:[
   "map-puzzle-completed",
   "week-one-end-acknowledged",
   "ending-full-account-acknowledged"
  ],
  achievements:[]
 }};
 assert.deepEqual(getAchievementEvents(context).map((event)=>event.payload.achievementId),[
  "map-restorer",
  "old-house-echo",
  "ending-full-account"
 ]);
 context.state.achievements.push("map-restorer");
 assert.deepEqual(getAchievementEvents(context).map((event)=>event.payload.achievementId),[
  "old-house-echo",
  "ending-full-account"
 ]);
});
test("所有成就条件只引用全局契约已经登记的事实",()=>{
 const registered=new Set(STORY_FACT_DEFINITIONS.map((fact)=>fact.id));
 for(const item of ACHIEVEMENTS){
  assert.ok(item.requiredFacts.length>0,item.id+" 缺少解锁条件");
  for(const factId of item.requiredFacts){
   assert.ok(registered.has(factId),item.id+" 引用了未登记事实 "+factId);
  }
 }
});
