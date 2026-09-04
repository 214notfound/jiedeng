// 探索与对话服务：接收已提交命令，只向协调器报告事实，不推进 Node、不发放奖励。
import {TASKS,NODE_SCENES,sceneName,taskFor} from "../data/exploration.js";
import {ITEMS} from "../data/items.js";
import {bindHost,requireIds} from "./host-reader.js";

export function validateExplorationContext(context){
  const state=context.state, checkpoint=state?.storyCheckpoint;
  for(const field of ["facts","inventory","clues"])requireIds(state?.[field],field);
  if(!checkpoint||!NODE_SCENES[checkpoint.nodeId]||checkpoint.nodeRevision!==1)throw new Error("剧情检查点不存在或版本不兼容。");
  for(const field of ["completedMilestoneIds","completedNodeIds","completedStageIds"])requireIds(checkpoint[field],field);
  if(!Array.isArray(checkpoint.pendingCommands)||!Array.isArray(context.commands))throw new Error("缺少已提交的剧情命令。");
  requireIds(checkpoint.pendingCommands.map(c=>c.commandId),"pendingCommands");
  requireIds(context.commands.map(c=>c.commandId),"commands");
  if(context.commands.length!==checkpoint.pendingCommands.length)throw new Error("检查点与命令不一致。");
  for(const command of context.commands){
    const target=command.payload?.explorationId??command.payload?.conversationId??command.payload?.minigameId;
    const pending=checkpoint.pendingCommands.find(c=>c.commandId===command.commandId);
    if(!pending||pending.commandType!==command.commandType||pending.targetId!==target)throw new Error("命令尚未提交或已过期。");
    if(command.commandId!=="cmd-"+checkpoint.nodeId+"-"+target)throw new Error("命令 ID 与 Node 清单不一致。");
    if(command.commandType==="REQUEST_MINIGAME"){
      if(target!=="map-puzzle"||command.payload.successFactId!=="map-puzzle-completed")throw new Error("未知小游戏命令。");
      if(checkpoint.nodeId!=="village-map-and-route"||[1,2,3].some(n=>!state.inventory.includes("map-fragment-"+n)||!state.facts.includes("map-fragment-"+n+"-acquired")))throw new Error("地图任务尚未满足条件。");
      continue;
    }
    const task=taskFor(command);
    if(!task||task.node!==checkpoint.nodeId||command.commandType!==("REQUEST_"+(task.type==="exploration"?"EXPLORATION":"CONVERSATION")))throw new Error("未知或不属于当前 Node 的任务。");
    if(!Array.isArray(command.payload.goals))throw new Error("任务缺少目标。");
    if(task.type==="conversation"&&(!Array.isArray(command.payload.npcIds)||!command.payload.npcIds.includes(task.npc)))throw new Error("对话参与者不符。");
  }
}
export function createExploration(host){
  if(typeof host.dispatchExternalEvent!=="function")throw new TypeError("缺少协调器 dispatchExternalEvent。");
  const bound=bindHost(host,validateExplorationContext);
  let busy=false, uncertain=false;
const presented = new Set();
  const optionalMemoryFact = "x-deflects-memory-question-noticed";
  function acceptsOptionalMemory(command) {
    return command.payload.goals.some(goal => goal.goalId === "x-memory-deflection-noticed");
  }
  const commandFor=(context,task)=>context.commands.find(c=>(c.payload?.explorationId??c.payload?.conversationId)===task.target);
  function entries(context){
    const facts=context.state.facts;
    return TASKS.filter(task=>task.node===context.state.storyCheckpoint.nodeId).flatMap(task=>{
      const command=commandFor(context,task);
      return task.actions.filter(action=>command||action.facts.every(f=>facts.includes(f))).map(action=>{
        const completed=action.facts.every(f=>facts.includes(f));
        return {...action,task,completed,available:completed||Boolean(command),command};
      });
    });
  }
  function getCurrentSceneId(){return NODE_SCENES[bound.read().state.storyCheckpoint.nodeId];}
  function getSceneView(sceneId){
    const context=bound.read();
    if(sceneId!==getCurrentSceneId())throw new Error("地点已经变化。");
    return {name:sceneName(sceneId),interactions:entries(context)};
  }
  function getLayout(){
    const context=bound.read();
    const groups=new Map();
    for(const action of entries(context)){
      const id=action.task.type==="conversation"?action.task.target:action.id;
      if(!groups.has(id))groups.set(id,{
        id, x:action.x??action.task.x, y:action.y??action.task.y,marker:action.marker??action.task.marker,
        reveal:"always",interactionIds:[]
      });
      groups.get(id).interactionIds.push(action.id);
    }
    // 同一人物在同地点的历史谈话仅保留当前任务或最近一段，避免位置重叠。
    const hotspots=[...groups.values()];
    const currentTargets=new Set(context.commands.map(c=>c.payload.conversationId));
    const seen=new Set();
    const filtered=hotspots.reverse().filter(h=>{
      const task=TASKS.find(t=>t.target===h.id);
      if(!task?.npc)return true;
      if(seen.has(task.npc))return false;
      if(!currentTargets.has(task.target)&&TASKS.some(t=>t.npc===task.npc&&currentTargets.has(t.target)))return false;
      seen.add(task.npc);return true;
    }).reverse();
    return {playerStart:{x:50,y:92},hotspots:filtered};
  }
  function listItems(layer){
    if(layer!==undefined&&!["items","clues"].includes(layer))throw new Error("未知背包分类。");
    const {state}=bound.read();
    const obtained=new Set([...state.inventory,...state.clues]);
    return ITEMS.filter(item=>obtained.has(item.id)&&(!layer||item.layer===layer)).map(item=>({...item,obtained:true}));
  }
  async function send(task,command,action,eventType,facts,payload){
    if(busy||uncertain)throw new Error("上一操作尚未确认，请等待或重新进入。");
    busy=true;
    try{
      const current=bound.read();
      if(!commandFor(current,task)||commandFor(current,task).commandId!==command.commandId)throw new Error("任务已结束，请刷新当前任务。");
      const event={eventId:"evt-"+command.commandId+"-"+action+"-"+eventType.toLowerCase(),
        eventType,source:task.type,causedByCommandId:command.commandId,resultFactIds:[...facts],payload};
      const result=await host.dispatchExternalEvent(event,{storageScope:bound.scope});
      const after=bound.read();
      if(!result||typeof result.ok!=="boolean"){uncertain=true;throw new Error("操作结果无法确认，请重新进入。");}
      if(!result.ok)throw new Error(result.message||"操作未提交，请重新进入。");
      if(!facts.every(f=>after.state.facts.includes(f))){uncertain=true;throw new Error("事实尚未提交，暂时停止后续操作。");}
      return result;
    }catch(error){
      // 宿主抛错或拒绝可能发生在提交后；暂停避免产生另一笔不确定提交。
      uncertain=true;throw error;
    }finally{busy=false;}
  }
  async function interact(sceneId,actionId,{confirm=false}={}){
    try{
      const context=bound.read();
      if(sceneId!==NODE_SCENES[context.state.storyCheckpoint.nodeId])throw new Error("地点已经变化。");
      const action=entries(context).find(a=>a.id===actionId);
      if(!action)throw new Error("当前没有这个调查任务。");
      if(action.completed)return {ok:true,message:action.text};
      if(action.task.type==="conversation"){
        const token=action.command.commandId+"/"+action.id;
        if(!confirm){
          presented.add(token);
          return {ok:true,message:action.text,requiresConfirmation:true,commandId:action.command.commandId};
        }
        if(!presented.has(token))throw new Error("请先阅读本段谈话。");
      }
      if((action.requiredItems??[]).some(id=>!context.state.inventory.includes(id)))throw new Error("缺少开门所需的旧钥匙。");
      const {task,command}=action;
      const payload=task.type==="conversation"?{conversationId:task.target,npcId:task.npc}:{objectId:action.id};
      // 当前上游版本未允许可选记忆事实；保留对白，只提交命令实际支持的事实。
      // 后续上游把可选目标加入命令时，才会携带该事实，绝不绕过来源校验。
      const facts = action.facts.filter(fact => fact !== optionalMemoryFact || acceptsOptionalMemory(command));
      await send(task,command,action.id,task.type==="conversation"?"NPC_TALKED":"OBJECT_INVESTIGATED",facts,payload);
      return {ok:true,message:action.text};
    }catch(error){console.error("[exploration] 操作未完成。",error);return {ok:false,message:error.message};}
  }
  async function cancel(commandId,errorCode){
    const context=bound.read(), command=context.commands.find(c=>c.commandId===commandId), task=command&&taskFor(command);
    if(!task)throw new Error("取消任务不存在。");
    if(errorCode!==undefined&&(typeof errorCode!=="string"||!errorCode.trim()))throw new Error("错误码无效。");
    return send(task,command,errorCode?"failed":"cancelled",errorCode?"EXTERNAL_INTERACTION_FAILED":"EXTERNAL_INTERACTION_CANCELLED",[],
      {targetId:task.target,...(errorCode?{errorCode}:{})});
  }
  async function reportProgress(commandId,factIds){
    requireIds(factIds,"对话进展事实");
    const context=bound.read(), command=context.commands.find(c=>c.commandId===commandId), task=command&&taskFor(command);
    if(task?.type!=="conversation"||!factIds.length||factIds.some(f=>!task.actions.some(a=>a.facts.includes(f))))throw new Error("进展事实不属于当前对话。");
    if (factIds.includes(optionalMemoryFact) && !acceptsOptionalMemory(command)) {
      throw new Error("当前剧情版本尚未开放这个可选事实。");
    }
    if (task.actions[0].facts.every(fact => context.state.facts.includes(fact) || factIds.includes(fact))) {
      throw new Error("完整谈话请通过确认完成提交，不能作为中途进展。");
    }
    return send(task,command,"progress-"+[...factIds].sort().join("-"),"NPC_TALK_PROGRESS",factIds,{conversationId:task.target,npcId:task.npc});
  }
  function getExitStatus(){
    const context=bound.read(), pending=entries(context).filter(a=>!a.completed);
    return {canLeave:false,message:pending.length?"还需完成："+[...new Set(pending.map(a=>a.task.label))].join("、")+"。":"本轮调查已完成，请按剧情区的当前操作继续。"};
  }
  function getMapCommand(){
    return bound.read().commands.find(c=>c.commandType==="REQUEST_MINIGAME"&&c.payload.minigameId==="map-puzzle")??null;
  }
  return Object.freeze({getCurrentSceneId,getSceneView,getLayout,listItems,interact,cancel,reportProgress,
    getExitStatus,getMapCommand,canStartMapPuzzle:()=>Boolean(getMapCommand()),
    subscribe:bound.subscribe,dispose:bound.dispose});
}
