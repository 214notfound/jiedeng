// 新剧情合同回归：顺序、命令来源、并行对话、幂等和异常提交。
import test from "node:test";
import assert from "node:assert/strict";
import {createExploration} from "../../assets/js/exploration/game/exploration.js";
import {createDemoHost,DEMO_KEY,initialState} from "./fixtures/demo-host.js";
import {TASKS} from "../../assets/js/exploration/data/exploration.js";
import {ITEMS} from "../../assets/js/exploration/data/items.js";
test("谈话内容先展示，确认前不能记录完成事实",async()=>{
 const host=createDemoHost(),module=createExploration(host);host.act("confirm-wake-context");
 assert.equal((await module.interact("shrine","surface-briefing",{confirm:true})).ok,false);
 const preview=await module.interact("shrine","surface-briefing");
 assert.equal(preview.requiresConfirmation,true);assert.equal(host.getContext().state.facts.includes("surface-investigation-task-known"),false);
 await click(module,"surface-briefing");assert.equal(host.getContext().state.facts.includes("surface-investigation-task-known"),true);
});
test("对话进展和取消不提前发钥匙",async()=>{
 const host=createDemoHost(),module=createExploration(host);
 host.act("confirm-wake-context");await click(module,"surface-briefing");await click(module,"burned-work-id");await click(module,"blue-glass-bead");
 const command=host.getContext().commands[0];
 await module.reportProgress(command.commandId,["x-deflects-memory-question-noticed"]);
 assert.equal(host.getContext().commands[0].commandId,command.commandId);
 assert.equal(host.getContext().state.inventory.includes("key-a"),false);
 await module.cancel(command.commandId);await click(module,"receive-key");
 assert.equal(host.getContext().state.inventory.filter(i=>i==="key-a").length,1);
});
test("重复事件在命令结束后重放仍不重复应用",()=>{
 const host=createDemoHost();host.act("confirm-wake-context");
 const command=host.getContext().commands[0];
 const event={eventId:"same-event",eventType:"NPC_TALKED",source:"conversation",causedByCommandId:command.commandId,
 resultFactIds:["surface-investigation-task-known"],payload:{conversationId:"prologue-briefing",npcId:"companion-x"}};
 host.dispatchExternalEvent(event,{storageScope:"guest"});
 const before=host.getContext();host.dispatchExternalEvent(event,{storageScope:"guest"});
 assert.deepEqual(host.getContext(),before);
});
test("没有三块碎片就不能接受地图命令",()=>{
 const state=initialState();state.storyCheckpoint.nodeId="village-map-and-route";
 state.storyCheckpoint.pendingCommands=[{commandId:"cmd-village-map-and-route-map-puzzle",commandType:"REQUEST_MINIGAME",targetId:"map-puzzle"}];
 assert.throws(()=>createExploration({getContext:()=>({storageScope:"guest",state,commands:[{commandId:"cmd-village-map-and-route-map-puzzle",commandType:"REQUEST_MINIGAME",payload:{minigameId:"map-puzzle",successFactId:"map-puzzle-completed"}}]}),subscribe:()=>()=>{},dispatchExternalEvent:()=>({ok:true})}));
});

async function click(module,id){
 let result=await module.interact(module.getCurrentSceneId(),id);
 if(result.requiresConfirmation)result=await module.interact(module.getCurrentSceneId(),id,{confirm:true});
 assert.equal(result.ok,true,result.message);
}
async function reachVillage(host,module){
 host.act("confirm-wake-context");await click(module,"surface-briefing");
 await click(module,"burned-work-id");await click(module,"blue-glass-bead");await click(module,"receive-key");
 host.act("confirm-white-lamp");await click(module,"lamp-incident");host.act("leave-shrine");
 await click(module,"village-decline");await click(module,"su-he-notice");
}
function mapEvent(host,override={}){
 const cmd=host.getContext().commands.find(c=>c.commandType==="REQUEST_MINIGAME");
 return {eventId:"test-map",eventType:"MAP_PUZZLE_COMPLETED",source:"minigame",causedByCommandId:cmd?.commandId,
 resultFactIds:["map-puzzle-completed"],payload:{puzzleId:"map-puzzle"},...override};
}
test("初始只有工作证和玻璃珠，没有旧录音与钥匙",()=>{
 const host=createDemoHost();const module=createExploration(host);
 assert.deepEqual(module.listItems().map(i=>i.id),["burned-work-id","blue-glass-bead"]);
 assert.equal(module.getSceneView("shrine").interactions.length,0);
 assert.equal(ITEMS.length,11);assert.equal(ITEMS.some(i=>i.name.includes("A")),false);
});
test("未确认开场不能谈话，两个物品调查后才取得交钥匙命令",async()=>{
 const host=createDemoHost(),module=createExploration(host);
 assert.equal((await module.interact("shrine","surface-briefing")).ok,false);
 host.act("confirm-wake-context");await click(module,"surface-briefing");await click(module,"blue-glass-bead");
 assert.equal(host.getContext().commands.some(c=>c.payload.conversationId==="prologue-key-and-memory"),false);
 await click(module,"burned-work-id");await click(module,"receive-key");
 assert.ok(module.listItems().some(i=>i.id==="key-a"));assert.equal(host.getContext().state.storyCheckpoint.nodeId,"prologue-white-lamp");
});
test("同一个探索命令可回报多个对象，回读不重复提交",async()=>{
 const host=createDemoHost(),module=createExploration(host);
 host.act("confirm-wake-context");await click(module,"surface-briefing");
 const id=host.getContext().commands[0].commandId;
 await click(module,"burned-work-id");const count=host.getContext().state.processedEventIds.length;
 await click(module,"burned-work-id");assert.equal(host.getContext().state.processedEventIds.length,count);
 assert.equal(host.getContext().commands[0].commandId,id);await click(module,"blue-glass-bead");
});
test("可选追问记录事实，不是必须完成的门槛",async()=>{
 const host=createDemoHost(),module=createExploration(host);
 host.act("confirm-wake-context");await click(module,"surface-briefing");await click(module,"burned-work-id");await click(module,"blue-glass-bead");
 await click(module,"ask-memory-and-receive-key");
 assert.ok(host.getContext().state.facts.includes("x-deflects-memory-question-noticed"));
});
for(const order of [
 ["shopkeeper-inquiry","holdout-inquiry","elder-inquiry"],["shopkeeper-inquiry","elder-inquiry","holdout-inquiry"],
 ["holdout-inquiry","shopkeeper-inquiry","elder-inquiry"],["holdout-inquiry","elder-inquiry","shopkeeper-inquiry"],
 ["elder-inquiry","shopkeeper-inquiry","holdout-inquiry"],["elder-inquiry","holdout-inquiry","shopkeeper-inquiry"]]){
 test("村民并行顺序 "+order.join(","),async()=>{
  const host=createDemoHost(),module=createExploration(host);await reachVillage(host,module);
  assert.equal(host.getContext().commands.length,3);
  for(let i=0;i<3;i++){await click(module,order[i]);assert.equal(module.listItems().filter(x=>x.id.startsWith("map-fragment")).length,i+1);}
  host.dispatchExternalEvent(mapEvent(host),{storageScope:"guest"});
  assert.equal(host.getContext().state.storyCheckpoint.nodeId,"village-map-and-route");
  assert.equal(host.getContext().state.achievements.includes("map-restorer"),true);
  host.act("go-old-house");assert.equal(host.getContext().state.storyCheckpoint.nodeId,"old-house-entry");
 });
}
test("老宅四线索、对质、呼名、明确结束连续完成",async()=>{
 const host=createDemoHost(),module=createExploration(host);await reachVillage(host,module);
 for(const id of ["elder-inquiry","holdout-inquiry","shopkeeper-inquiry"])await click(module,id);
 host.dispatchExternalEvent(mapEvent(host),{storageScope:"guest"});host.act("go-old-house");
 await click(module,"old-house-door");
 for(const id of ["funeral-list","height-marks","school-uniform","old-photograph"])await click(module,id);
 assert.equal(host.getContext().state.clues.length,4);
 await click(module,"identity-conflict");await click(module,"door-call");
 assert.equal(host.getContext().state.ended,false);host.act("confirm-week-one-end");
 assert.equal(host.getContext().state.ended,true);assert.equal(host.getContext().state.storyCheckpoint.completedNodeIds.length,11);
});
test("伪造来源、过期命令和跨任务事实全部拒绝",()=>{
 const host=createDemoHost();host.act("confirm-wake-context");
 const c=host.getContext().commands[0],event={eventId:"bad",eventType:"NPC_TALKED",source:"conversation",causedByCommandId:c.commandId,
 resultFactIds:["surface-investigation-task-known"],payload:{conversationId:"prologue-briefing",npcId:"companion-x"}};
 for(const change of [{source:"exploration"},{causedByCommandId:"old-command"},{resultFactIds:["map-puzzle-completed"]}]){
  assert.throws(()=>host.dispatchExternalEvent({...event,...change},{storageScope:"guest"}));
 }
 assert.equal(host.getContext().state.facts.length,1);
});
test("取消和失败保持当前任务，不产生事实",async()=>{
 const host=createDemoHost(),module=createExploration(host);host.act("confirm-wake-context");
 const c=host.getContext().commands[0],before=host.getContext().state.facts;
 await module.cancel(c.commandId);assert.equal(host.getContext().commands[0].commandId,c.commandId);
 await module.cancel(c.commandId,"DIALOGUE_LOAD_FAILED");assert.deepEqual(host.getContext().state.facts,before);
});
test("重入锁、保存失败和成功未落账不会继续交互",async()=>{
 const host=createDemoHost();host.act("confirm-wake-context");let resolve,calls=0;
 const proxy={...host,dispatchExternalEvent:()=>{calls++;return new Promise(r=>resolve=r);}};
 const module=createExploration(proxy);
 await module.interact("shrine","surface-briefing");
 const first=module.interact("shrine","surface-briefing",{confirm:true});
 assert.equal((await module.interact("shrine","surface-briefing",{confirm:true})).ok,false);assert.equal(calls,1);
 resolve({ok:true});assert.equal((await first).ok,false);assert.equal((await module.interact("shrine","surface-briefing",{confirm:true})).ok,false);
});
test("身份切换后旧服务拒绝读写，清理订阅",async()=>{
 const host=createDemoHost();let scope="guest";const module=createExploration({...host,getContext:()=>({...host.getContext(),storageScope:scope})});
 const stop=module.subscribe(()=>{});assert.equal(host.listenerCount(),1);scope="account:b";
 assert.throws(()=>module.listItems());scope="guest";assert.throws(()=>module.listItems());
 stop();module.dispose();assert.equal(host.listenerCount(),0);
});
test("刷新恢复相同命令，损坏记录原样保留，写入失败无假成功",async()=>{
 const data=new Map(),storage={getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v)};
 const host=createDemoHost({storage});host.act("confirm-wake-context");
 const id=host.getContext().commands[0].commandId;const restored=createDemoHost({storage});
 assert.equal(restored.getContext().commands[0].commandId,id);
 const module=createExploration(restored);storage.setItem=()=>{throw new Error("Quota");};
 await module.interact("shrine","surface-briefing");
 assert.equal((await module.interact("shrine","surface-briefing",{confirm:true})).ok,false);
 assert.equal(restored.getContext().state.storyCheckpoint.nodeId,"prologue-wake");
 data.set(DEMO_KEY,"{broken");assert.throws(()=>createDemoHost({storage}));assert.equal(data.get(DEMO_KEY),"{broken");
});
test("所有对象事实按新文档命名且不会在事件中指定下一 Node",async()=>{
 const host=createDemoHost();host.act("confirm-wake-context");let event;
 const module=createExploration({...host,dispatchExternalEvent:(e,m)=>{event=e;return host.dispatchExternalEvent(e,m);}});
 await click(module,"surface-briefing");
 assert.equal(event.source,"conversation");assert.ok(event.causedByCommandId);assert.ok(event.eventId);
 assert.equal("nextNodeId" in event,false);assert.deepEqual(event.payload,{conversationId:"prologue-briefing",npcId:"companion-x"});
 assert.ok(TASKS.every(t=>t.actions.every(a=>a.facts.every(f=>/^[a-z0-9-]+$/.test(f)))));
});
