// 仅供演示和测试：按 Node 清单产生命令，用于验证外部接口，不是团队剧情引擎。
import {INTERACTION_TASKS} from "../../../assets/js/exploration/integration/data/tasks.js";
export const NODES=[
 {id:"prologue-wake",stage:"prologue",needs:["prologue-wake-context-known","surface-investigation-task-known"],action:"confirm-wake-context",actionFact:"prologue-wake-context-known",label:"确认醒来的处境",text:"暴雨停了。你在祠堂醒来，近期的记忆一片空白。小X自称公司的安全联络员。"},
 {id:"prologue-belongings",stage:"prologue",needs:["burned-work-id-investigated","blue-glass-bead-investigated","key-a-given-by-x"],text:"检查随身的工作证和蓝玻璃珠，再与小X交谈。"},
 {id:"prologue-white-lamp",stage:"prologue",needs:["white-lamp-witnessed","prologue-lamp-incident-understood","leave-shrine-chosen"],action:"confirm-white-lamp",actionFact:"white-lamp-witnessed",label:"确认看见白灯",text:"一盏白灯出现在窗外。"},
 {id:"village-arrival",stage:"village",needs:["village-decline-observed","su-he-missing-notice-observed"],text:"村口留下搬迁与施工的痕迹，还有一张寻人启事。"},
 {id:"village-inquiries",stage:"village",needs:["shopkeeper-inquiry-completed","holdout-inquiry-completed","elder-inquiry-completed"],text:"三名村民各有话要说，你可以自行选择先问谁。"},
 {id:"village-map-and-route",stage:"village",needs:["map-puzzle-completed","old-house-route-chosen"],text:"地图碎片已经集齐。复原后，再决定是否前往老宅。"},
 {id:"old-house-entry",stage:"old-house",needs:["old-house-door-opened"],text:"陈家老宅的门锁锈迹斑斑。"},
 {id:"old-house-investigation",stage:"old-house",needs:["old-photograph-clue-known","school-uniform-clue-known","height-marks-clue-known","funeral-list-clue-known"],text:"屋内留下四类旧物和记录，调查顺序不限。"},
 {id:"old-house-clue-confrontation",stage:"old-house",needs:["old-house-identity-conflict-raised"],text:"这些线索彼此牵连，你决定问问小X。"},
 {id:"old-house-call-at-door",stage:"old-house",needs:["door-call-incident-completed"],text:"门外忽然响起声音。"},
 {id:"week-one-end",stage:"old-house",needs:["week-one-end-acknowledged"],action:"confirm-week-one-end",actionFact:"week-one-end-acknowledged",label:"确认第一周内容结束",text:"第一周内容结束。关于怪事、公司与陈家，你还没有得到全部答案。"}
];
const has=(state,ids)=>ids.every(f=>state.facts.includes(f));
const milestoneIds=[
 ["wake-context-known","surface-task-known"],
 ["burned-work-id-checked","blue-glass-bead-checked","key-received-from-x"],
 ["white-lamp-seen","lamp-incident-understood","leave-shrine-decided"],
 ["village-decline-seen","su-he-notice-seen"],
 ["shopkeeper-thread-complete","holdout-thread-complete","elder-thread-complete"],
 ["map-restored","old-house-route-selected"],["old-house-door-opened"],
 ["photograph-clue-known","uniform-clue-known","height-clue-known","funeral-clue-known"],
 ["identity-conflict-raised"],["door-call-finished"],["week-one-end-confirmed"]
];
export function commandsFor(state){
 const node=NODES.find(n=>n.id===state.storyCheckpoint.nodeId);
 if(state.ended)return [];
 const commands=INTERACTION_TASKS.filter(t=>t.node===node.id).filter(t=>!has(state,t.type==="exploration"?t.actions.flatMap(a=>a.facts):t.actions[0].facts)).filter(t=>{
   if(t.target==="prologue-briefing")return has(state,["prologue-wake-context-known"]);
   if(t.target==="prologue-key-and-memory")return has(state,["burned-work-id-investigated","blue-glass-bead-investigated"]);
   if(t.target==="prologue-lamp-incident")return has(state,["white-lamp-witnessed"]);
   return true;
 }).map(t=>({commandId:"cmd-"+node.id+"-"+t.target,
   commandType:t.type==="exploration"?"REQUEST_EXPLORATION":"REQUEST_CONVERSATION",
   payload:{[t.type==="exploration"?"explorationId":"conversationId"]:t.target,
     ...(t.type==="conversation"?{npcIds:t.npc==="unknown-caller"?["unknown-caller","companion-x"]:[t.npc,...(t.npc!=="companion-x"?["companion-x"]:[])]}:{}),
     goals:[...(t.type==="exploration"?t.actions.flatMap(a=>a.facts):t.actions[0].facts).map(f=>({goalId:f,description:t.label})),
       ...(t.target==="prologue-key-and-memory"?[{goalId:"x-memory-deflection-noticed",description:"可选追问"}]:[])]}}));
 if(node.id==="village-map-and-route"&&!has(state,["map-puzzle-completed"])&&has(state,["map-fragment-1-acquired","map-fragment-2-acquired","map-fragment-3-acquired"]))
 commands.push({commandId:"cmd-village-map-and-route-map-puzzle",commandType:"REQUEST_MINIGAME",payload:{minigameId:"map-puzzle",successFactId:"map-puzzle-completed"}});
 return commands;
}
export function storyActions(state){
 const node=NODES.find(n=>n.id===state.storyCheckpoint.nodeId);
 if(state.ended)return [];
 if(node.action&&!state.facts.includes(node.actionFact))return [{actionId:node.action,label:node.label,fact:node.actionFact}];
 if(node.id==="prologue-white-lamp"&&has(state,["prologue-lamp-incident-understood"]))return [{actionId:"leave-shrine",label:"离开祠堂",fact:"leave-shrine-chosen"}];
 if(node.id==="village-map-and-route"&&has(state,["map-puzzle-completed"]))return [{actionId:"go-old-house",label:"前往陈家老宅",fact:"old-house-route-chosen"}];
 return [];
}
export function settle(state){
 // 测试宿主模拟剧情奖励；正式模式必须提交实际 StoryResponse.commit。
 const rewards=[
 ["key-a-given-by-x","inventory","key-a"],["shopkeeper-inquiry-completed","inventory","map-fragment-1"],
 ["holdout-inquiry-completed","inventory","map-fragment-2"],["elder-inquiry-completed","inventory","map-fragment-3"],
 ["map-puzzle-completed","inventory","restored-village-map"],
 ["old-photograph-clue-known","clues","old-photograph"],["school-uniform-clue-known","clues","school-uniform"],
 ["height-marks-clue-known","clues","height-marks"],["funeral-list-clue-known","clues","funeral-list"]
 ];
 for(const [fact,field,id] of rewards)if(state.facts.includes(fact)&&!state[field].includes(id)){
   state[field].push(id);
   if(field==="inventory")state.facts.push(id+"-acquired");
 }
 if(state.facts.includes("map-puzzle-completed")&&!state.facts.includes("old-house-unlocked"))state.facts.push("old-house-unlocked");
 const completed=NODES.filter(n=>has(state,n.needs));
 const current=NODES.find(n=>!has(state,n.needs))??NODES.at(-1);
 state.ended=completed.length===NODES.length;
 state.storyCheckpoint={nodeId:current.id,nodeRevision:1,
   completedMilestoneIds:milestoneIds[NODES.indexOf(current)].filter((id,index)=>state.facts.includes(current.needs[index])),
   completedNodeIds:completed.map(n=>n.id),
   completedStageIds:["prologue","village","old-house"].filter(stage=>NODES.filter(n=>n.stage===stage).every(n=>has(state,n.needs))),
   pendingCommands:[]};
 state.storyCheckpoint.pendingCommands=commandsFor(state).map(c=>({commandId:c.commandId,commandType:c.commandType,targetId:c.payload.explorationId??c.payload.conversationId??c.payload.minigameId}));
 if(current.id==="prologue-belongings"&&state.facts.includes("x-deflects-memory-question-noticed"))state.storyCheckpoint.completedMilestoneIds.push("x-memory-deflection-noticed");
}
