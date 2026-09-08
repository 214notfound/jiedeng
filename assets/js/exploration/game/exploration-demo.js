// 显式独立演示：使用测试宿主展示新 Node 合同，不调用账户和正式剧情引擎。
import {createEngineHost,DEMO_KEY} from "../../../../test/exploration/fixtures/engine-host.js";
import {loadDemoEngine} from "../../../../test/exploration/fixtures/engine-loader.js";
import {mountGamePage} from "./game-page.js";
const enterStory = await loadDemoEngine();
const host=createEngineHost({enterStory,storage:window.sessionStorage});
const notice=document.getElementById("demo-notice");
notice.hidden=false;notice.textContent="联调演示：使用真实剧情引擎；地图成功为模拟，存档为本标签页独立记录。";
document.getElementById("achievements-link").href="../achievements/achievements.html?demo=1";
const stop=mountGamePage({host,openMap:async command=>{
 const accepted=window.confirm("模拟地图复原成功？取消只回报取消事件。");
 const target="map-puzzle";
 host.dispatchExternalEvent({eventId:"evt-"+command.commandId+"-"+(accepted?"complete":"cancel"),
   eventType:accepted?"MAP_PUZZLE_COMPLETED":"EXTERNAL_INTERACTION_CANCELLED",source:"minigame",
   causedByCommandId:command.commandId,resultFactIds:accepted?["map-puzzle-completed"]:[],
   payload:accepted?{puzzleId:target}:{targetId:target}},{storageScope:"guest"});
}});
const story=document.getElementById("game-story");
function render(){
 const presentation=host.getPresentation();
 story.replaceChildren();
 const p=document.createElement("p");p.textContent=presentation.text;story.append(p);
 for(const action of presentation.actions){
   const button=document.createElement("button");button.type="button";button.textContent=action.label;
   button.dataset.storyAction = action.actionId;
   button.addEventListener("click",()=>{try{host.act(action.actionId);}catch(error){document.getElementById("feedback").textContent=error.message;}});
   story.append(button);
 }
}
const unlisten=host.subscribe(render);render();
console.info("[exploration-demo]",{version:"engine-handoff-v3",mode:"demo",node:host.getContext().state.storyCheckpoint.nodeId,storageKey:DEMO_KEY+":guest"});
window.addEventListener("pagehide",()=>{unlisten();stop();host.dispose();},{once:true});
window.addEventListener("pageshow",event=>{if(event.persisted)window.location.reload();});
