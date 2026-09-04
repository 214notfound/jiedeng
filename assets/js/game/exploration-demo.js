// 探索演示组装：使用游戏页面控制器与独立的标签页进度。
import { createDemoSession, DEMO_SESSION_KEY } from "../../../test/game/fixtures/demo-session.js";
import { mountGamePage } from "./game-page.js";

const feedback = document.getElementById("feedback");
let host;
let unmount;
try {
  host = createDemoSession(window.sessionStorage);
  console.info("[exploration-demo]", {
    version: "V1", mode: "demo",
    currentNodeId: host.getContext().state.currentNodeId,
    storageKey: DEMO_SESSION_KEY
  });
  const notice = document.getElementById("demo-notice");
  if (notice) {
    notice.hidden = false;
    notice.textContent = "演示模式：进度保存在当前标签页；地图完成由确认框模拟。";
  }
  const link = document.getElementById("achievements-link");
  if (link) link.href = "achievements.html?demo=1";
  unmount = mountGamePage({
    host,
    onLeave: () => { feedback.textContent = "必要调查已完成，演示进度已更新。"; },
    openMap: () => {
      if (window.confirm("仅演示：模拟地图复原成功？")) {
        const result = host.dispatch({
          type: "MAP_PUZZLE_COMPLETED", payload: { puzzleId: "map-puzzle" }
        });
        if (!result.ok) feedback.textContent = result.message;
      }
    }
  });
} catch (error) {
  unmount?.();
  host?.dispose();
  feedback.textContent = "演示进度无法读取或保存，原记录未修改。";
  console.error("[exploration-demo] 演示初始化失败。", error);
}
window.addEventListener("pagehide", () => {
  unmount?.();
  host?.dispose();
});
window.addEventListener("pageshow", (event) => {
  if (event.persisted) window.location.reload();
});
