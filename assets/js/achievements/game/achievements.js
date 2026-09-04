// 成就规则与读取：从已提交事实判定，返回待提交事件，由状态模块持久化。
import {MAP_ACHIEVEMENT} from "../data/achievements.js";
import {bindHost,requireIds} from "../../exploration/game/host-reader.js";
function validate(context){
  const state=context.state;
  requireIds(state?.facts,"facts");requireIds(state?.achievements,"achievements");
  if(state.achievements.includes(MAP_ACHIEVEMENT.id)&&!state.facts.includes("map-puzzle-completed"))throw new Error("成就缺少地图完成事实。");
  const time=state.achievementTimes?.[MAP_ACHIEVEMENT.id];
  if(time!==undefined&&(!state.achievements.includes(MAP_ACHIEVEMENT.id)||typeof time!=="string"||Number.isNaN(Date.parse(time))))throw new Error("成就时间无效。");
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
    return [{...MAP_ACHIEVEMENT,unlocked:state.achievements.includes(MAP_ACHIEVEMENT.id),
      unlockedAt:state.achievementTimes?.[MAP_ACHIEVEMENT.id]??null}];
  }
  return Object.freeze({listAchievements,subscribe:bound.subscribe,dispose:bound.dispose});
}

