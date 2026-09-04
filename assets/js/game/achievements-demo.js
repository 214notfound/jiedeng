// 成就页演示组装；正式入口使用已恢复的团队宿主调用页面挂载函数。
import { createDemoSession, DEMO_SESSION_KEY } from "../../../test/game/fixtures/demo-session.js";
import { mountAchievementsPage } from "./achievements-page.js";

let session;
try {
  session = createDemoSession(window.sessionStorage);
  const notice = document.getElementById("demo-notice");
  if (notice) {
    notice.hidden = false;
    notice.textContent = "演示模式：展示当前标签页的演示成就。";
    document.querySelector(".achievement-navigation a").href = "game.html?demo=1";
  }
  console.info("[achievements-demo]", {
    version: "V1", mode: "demo",
    currentNodeId: session.getContext().state.currentNodeId,
    storageKey: DEMO_SESSION_KEY
  });
  mountAchievementsPage({ host: session });
} catch (error) {
  session?.dispose();
  const feedback = document.getElementById("achievement-feedback");
  feedback.hidden = false;
  feedback.textContent = "演示进度无法读取，原记录未修改。请返回探索检查。";
  console.error("[achievements-demo] 演示加载失败。", error);
}
window.addEventListener("pagehide", (event) => {
  if (!event.persisted) session?.dispose();
});
