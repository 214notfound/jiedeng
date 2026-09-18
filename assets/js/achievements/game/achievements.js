// 成就规则与读取：从已提交事实判定，返回待提交事件，由状态模块持久化。
import {ACHIEVEMENTS} from "../data/achievements.js";
import {bindHost,requireIds} from "./host-binding.js";

function validate(context){
  const state=context.state;
  requireIds(state?.facts,"facts");
  requireIds(state?.achievements,"achievements");
  if(state.achievementTimes!==undefined
    && (!state.achievementTimes || typeof state.achievementTimes!=="object"
      || Array.isArray(state.achievementTimes)))throw new Error("成就时间表格式无效。");
}

function hasRequiredFacts(state, achievement){
  return achievement.requiredFacts.every((factId)=>state.facts.includes(factId));
}

export function getAchievementEvents(context){
  validate(context);
  return ACHIEVEMENTS
    .filter((item)=>hasRequiredFacts(context.state,item)
      && !context.state.achievements.includes(item.id))
    .map((item)=>({
      eventId:"achievement-"+item.id,
      eventType:"ACHIEVEMENT_UNLOCKED",
      onceKey:"achievement:"+item.id,
      payload:{achievementId:item.id}
    }));
}

export function createAchievements(host){
  const bound=bindHost(host,validate);
  function listAchievements(){
    const {state}=bound.read();
    return ACHIEVEMENTS.map((item)=>{
      const unlocked=state.achievements.includes(item.id);
      const unlockedAt=state.achievementTimes?.[item.id]??null;
      const missingFact=unlocked&&!hasRequiredFacts(state,item);
      const invalidTime=unlockedAt!==null
        && (!unlocked||typeof unlockedAt!=="string"||Number.isNaN(Date.parse(unlockedAt)));
      const available=!missingFact&&!invalidTime;
      const warning=missingFact
        ?item.id==="map-restorer"
          ?"成就记录缺少地图完成事实。"
          :"成就记录缺少对应剧情事实。"
        :invalidTime?"成就解锁时间无效。":null;
      return {...item,unlocked:available&&unlocked,
        unlockedAt:available?unlockedAt:null,available,warning};
    });
  }
  return Object.freeze({listAchievements,subscribe:bound.subscribe,dispose:bound.dispose});
}
