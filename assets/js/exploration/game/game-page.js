// 游戏页面组合层：挂载探索和成就预览，将保存、地图、剧情交给外部接口。
import { createExploration } from "./exploration.js";
import { createAchievements } from "./achievements.js";
import { mountExploration } from "./exploration-view.js";
import { mountAchievements } from "./achievements-view.js";

const activePages = new WeakMap();
export function mountGamePage({
  host, openMap, onLeave, saveProgress, documentRoot = document
}) {
  const sceneRoot = documentRoot.getElementById("game-scene");
  const actionsRoot = documentRoot.getElementById("game-actions");
  const inventoryRoot = documentRoot.getElementById("inventory-panel");
  const feedback = documentRoot.getElementById("feedback");
  const saveButton = documentRoot.getElementById("save-button");
  const preview = documentRoot.getElementById("achievement-preview");
  if (!sceneRoot || !actionsRoot || !inventoryRoot || !feedback) {
    throw new Error("游戏页面缺少必要容器。");
  }
  activePages.get(sceneRoot)?.();
  const view = documentRoot.defaultView;
  let exploration;
  let achievements;
  let removeExploration;
  let removeAchievements;
  let disposed = false;
  let saving = false;
  const notify = (message, kind = "error") => {
    if (disposed) return;
    feedback.textContent = message;
    feedback.dataset.kind = kind;
  };
  try {
    exploration = createExploration(host);
    removeExploration = mountExploration({
      module: exploration, sceneRoot, actionsRoot, inventoryRoot, showFeedback: notify,
      openMap: openMap ?? (() => { throw new Error("地图暂不可用，请稍后再试。"); }),
      onLeave: onLeave ?? (() => { throw new Error("暂时无法前进，请稍后再试。"); })
    });
    if (preview) {
      achievements = createAchievements(host);
      removeAchievements = mountAchievements({ module: achievements, root: preview, showFeedback: notify });
    }
    notify("选择物体或人物开始调查。", "info");
  } catch (error) {
    removeExploration?.();
    removeAchievements?.();
    exploration?.dispose();
    achievements?.dispose();
    notify("暂时无法读取游戏进度，请重新进入。");
    console.error("[game-page] 页面初始化失败。", error);
    throw error;
  }

  async function save() {
    if (disposed || saving || typeof saveProgress !== "function") return;
    saving = true;
    saveButton.disabled = true;
    try {
      // 提交前后核对绑定身份；具体保存和存储域校验由存档接口负责。
      exploration.getCurrentSceneId();
      const result = await saveProgress();
      if (disposed) return;
      exploration.getCurrentSceneId();
      if (!result || typeof result.ok !== "boolean") throw new Error("保存结果无法确认，请检查后重试。");
      notify(result.message || (result.ok ? "保存成功。" : "保存失败。"), result.ok ? "success" : "error");
    } catch (error) {
      notify("保存未完成，请检查当前进度后重试。");
      console.error("[game-page] 保存失败。", error);
    } finally {
      saving = false;
      if (!disposed) saveButton.disabled = false;
    }
  }
  if (saveButton) {
    saveButton.disabled = typeof saveProgress !== "function";
    saveButton.addEventListener("click", save);
  }
  function stop() {
    if (disposed) return;
    disposed = true;
    removeExploration();
    removeAchievements?.();
    exploration.dispose();
    achievements?.dispose();
    saveButton?.removeEventListener("click", save);
    if (saveButton) saveButton.disabled = true;
    view?.removeEventListener("pagehide", leavePage);
    view?.removeEventListener("pageshow", restorePage);
    activePages.delete(sceneRoot);
  }
  function leavePage(event) {
    if (!event.persisted) stop();
  }
  function restorePage(event) {
    if (!event.persisted) return;
    stop();
    try { mountGamePage({ host, openMap, onLeave, saveProgress, documentRoot }); }
    catch { /* 初始化函数已显示并记录错误。 */ }
  }
  activePages.set(sceneRoot, stop);
  view?.addEventListener("pagehide", leavePage);
  view?.addEventListener("pageshow", restorePage);
  return stop;
}

// 显式演示模式只使用专用标签页记录；正式入口仍由游戏壳注入宿主。
if (typeof window !== "undefined"
  && window.location.pathname.endsWith("/pages/game.html")
  && new URLSearchParams(window.location.search).get("demo") === "1") {
  import("./exploration-demo.js").catch((error) => {
    const feedback = document.getElementById("feedback");
    if (feedback) feedback.textContent = "演示加载失败，请重新打开页面。";
    console.error("[game-page] 演示入口加载失败。", error);
  });
}
