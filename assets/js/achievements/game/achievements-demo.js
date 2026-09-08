// 独立成就演示：读取与探索相同的专用会话，真实账户需由入口恢复。
import {createEngineHost} from "../../../../test/exploration/fixtures/engine-host.js";
import {loadDemoEngine} from "../../../../test/exploration/fixtures/engine-loader.js";
import {mountAchievementsPage} from "./achievements-page.js";
const enterStory = await loadDemoEngine();
const host=createEngineHost({enterStory,storage:window.sessionStorage});
const notice=document.getElementById("demo-notice");notice.hidden=false;
notice.textContent="独立演示进度，不代表当前账户的正式成就。";
document.querySelector(".achievement-link").href="../exploration/game.html?demo=1";
const stop=mountAchievementsPage({host});
window.addEventListener("pagehide",()=>{stop();host.dispose();},{once:true});
window.addEventListener("pageshow",event=>{if(event.persisted)window.location.reload();});
