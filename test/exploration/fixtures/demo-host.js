// 独立演示宿主：内存事务及专用会话记录，绝不用于正式账户或存档。
import {TASKS,taskFor} from "../../../assets/js/exploration/data/exploration.js";
import {validateExplorationContext} from "../../../assets/js/exploration/game/exploration.js";
import {getAchievementEvents} from "../../../assets/js/achievements/game/achievements.js";
import {NODES,commandsFor,storyActions,settle} from "./story-fixture.js";
export const DEMO_KEY="jiedeng:demo:story-contract:v2";
const clone=value=>JSON.parse(JSON.stringify(value));
export function initialState(){
 const state={version:2,kind:"story-contract-demo",facts:[],inventory:["burned-work-id","blue-glass-bead"],clues:[],
 achievements:[],achievementTimes:{},processedEventIds:[],storyCheckpoint:null,ended:false};
 settle(state);return state;
}
export function createDemoHost({storage=null,scope="guest",initial=null}={}){
 let current=initial?clone(initial):initialState();
 let disposed=false;
 const listeners=new Set();
 if(storage){
   const raw=storage.getItem(DEMO_KEY);
   if(raw!==null)current=JSON.parse(raw);
 }
 const contextOf=state=>({storageScope:scope,state:clone(state),commands:commandsFor(state)});
 function validate(state){
   if(state?.version!==2||state.kind!=="story-contract-demo"||!Array.isArray(state.processedEventIds))throw new Error("演示记录版本不兼容，请保留原数据并重新检查。");
   validateExplorationContext(contextOf(state));getAchievementEvents(contextOf(state));
   const check=clone(state);settle(check);
   if(JSON.stringify(check)!==JSON.stringify(state))throw new Error("演示检查点或奖励记录不一致。");
 }
 validate(current);
 function publish(candidate){
   for(const event of getAchievementEvents(contextOf(candidate))){
     candidate.achievements.push(event.payload.achievementId);
     candidate.achievementTimes[event.payload.achievementId]=new Date().toISOString();
   }
   validate(candidate);
   if(storage)storage.setItem(DEMO_KEY,JSON.stringify(candidate));
   current=candidate;
   for(const listener of [...listeners])try{listener();}catch(error){console.error("[demo] 订阅失败。",error);}
 }
 function getContext(){if(disposed)throw new Error("演示宿主已卸载。");return contextOf(current);}
 function dispatchExternalEvent(event,meta){
   if(disposed||meta?.storageScope!==scope)throw new Error("身份已失效。");
   if(typeof event?.eventId!=="string"||!event.eventId)throw new Error("事件 ID 无效。");
   if(current.processedEventIds.includes(event.eventId))return {ok:true};
   const command=commandsFor(current).find(c=>c.commandId===event.causedByCommandId);
   if(!command)throw new Error("STORY_STALE_EXTERNAL_EVENT");
   if(!Array.isArray(event.resultFactIds)||new Set(event.resultFactIds).size!==event.resultFactIds.length)throw new Error("事实列表无效。");
   const task=taskFor(command), payload=event.payload;
   if(!payload||typeof payload!=="object")throw new Error("事件载荷无效。");
   if(["EXTERNAL_INTERACTION_CANCELLED","EXTERNAL_INTERACTION_FAILED"].includes(event.eventType)){
     const target=command.payload.explorationId??command.payload.conversationId??command.payload.minigameId;
     if(event.resultFactIds.length||payload.targetId!==target||event.source!==(task?.type??"minigame"))throw new Error("取消/失败不能报告完成事实。");
     if(event.eventType==="EXTERNAL_INTERACTION_FAILED"&&!payload.errorCode)throw new Error("失败缺少错误码。");
   }else if(command.commandType==="REQUEST_MINIGAME"){
     if(event.source!=="minigame"||event.eventType!=="MAP_PUZZLE_COMPLETED"||payload.puzzleId!=="map-puzzle"||event.resultFactIds.length!==1||event.resultFactIds[0]!=="map-puzzle-completed")throw new Error("小游戏事件无效。");
   }else{
     if(event.source!==task.type)throw new Error("事实来源无权。");
     const allowed=task.actions.flatMap(a=>a.facts);
     if(event.resultFactIds.some(f=>!allowed.includes(f)))throw new Error("事实不属于当前任务。");
     if(task.type==="exploration"){
       const action=task.actions.find(a=>a.id===payload.objectId);
       if(event.eventType!=="OBJECT_INVESTIGATED"||!action||action.facts.length!==event.resultFactIds.length||!action.facts.every(f=>event.resultFactIds.includes(f)))throw new Error("调查结果不完整。");
       if((action.requiredItems??[]).some(id=>!current.inventory.includes(id)))throw new Error("缺少钥匙。");
     }else{
       if(!["NPC_TALKED","NPC_TALK_PROGRESS"].includes(event.eventType)||payload.conversationId!==task.target||payload.npcId!==task.npc)throw new Error("谈话来源不符。");
       if(event.eventType==="NPC_TALKED"&&!task.actions[0].facts.every(f=>current.facts.includes(f)||event.resultFactIds.includes(f)))throw new Error("STORY_EXTERNAL_RESULT_INCOMPLETE");
     }
   }
   const candidate=clone(current);
   candidate.processedEventIds.push(event.eventId);
   for(const fact of event.resultFactIds)if(!candidate.facts.includes(fact))candidate.facts.push(fact);
   settle(candidate);publish(candidate);return {ok:true};
 }
 function act(actionId){
   if(disposed)throw new Error("演示宿主已卸载。");
   const action=storyActions(current).find(a=>a.actionId===actionId);
   if(!action)throw new Error("STORY_INVALID_ACTION");
   const candidate=clone(current);candidate.facts.push(action.fact);settle(candidate);publish(candidate);
 }
 return {getContext,dispatchExternalEvent,act,
   getPresentation(){return {text:NODES.find(n=>n.id===current.storyCheckpoint.nodeId).text,actions:storyActions(current),ended:current.ended};},
   subscribe(listener){if(disposed)throw new Error("已卸载");listeners.add(listener);return ()=>listeners.delete(listener);},
   listenerCount:()=>listeners.size,dispose(){disposed=true;listeners.clear();}};
}
