// 成就规则与读取：从已提交事实判定，返回待提交事件，由状态模块持久化。
import {MAP_ACHIEVEMENT} from "../data/achievements.js";
import {bindHost,requireIds} from "./host-binding.js";
function validate(context){
  const state=context.state;
  requireIds(state?.facts,"facts");requireIds(state?.achievements,"achievements");
  if(state.achievementTimes!==undefined
    && (!state.achievementTimes || typeof state.achievementTimes!=="object"
      || Array.isArray(state.achievementTimes)))throw new Error("成就时间表格式无效。");
}
export function getAchievementEvents(context){
  validate(context);
  if(!context.state.facts.includes("map-puzzle-completed")||context.state.achievements.includes(MAP_ACHIEVEMENT.id))return [];
  return [{eventId:"achievement-map-restorer",eventType:"ACHIEVEMENT_UNLOCKED",
    onceKey:"achievement:map-restorer",payload:{achievementId:MAP_ACHIEVEMENT.id}}];
}
export function createAchievements(host){
  const bound=bindHost(host,validate);
  function listAchievements(){
    const {state}=bound.read();
    const unlocked=state.achievements.includes(MAP_ACHIEVEMENT.id);
    const unlockedAt=state.achievementTimes?.[MAP_ACHIEVEMENT.id]??null;
    const missingFact=unlocked&&!state.facts.includes("map-puzzle-completed");
    const invalidTime=unlockedAt!==null
      && (!unlocked||typeof unlockedAt!=="string"||Number.isNaN(Date.parse(unlockedAt)));
    const available=!missingFact&&!invalidTime;
    const warning=missingFact
      ?"成就记录缺少地图完成事实。"
      :invalidTime?"成就解锁时间无效。":null;
    return [{...MAP_ACHIEVEMENT,unlocked:available&&unlocked,
      unlockedAt:available?unlockedAt:null,available,warning}];
  }
  return Object.freeze({listAchievements,subscribe:bound.subscribe,dispose:bound.dispose});
}
