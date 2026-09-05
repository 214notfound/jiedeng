// R16 独立页面入口：接收已恢复的宿主，挂载成就并管理页面退出。
import { createAchievements } from "./achievements.js";
import { mountAchievements } from "./achievements-view.js";

const activePages = new WeakMap();
export function mountAchievementsPage({ host, documentRoot = document }) {
  const root = documentRoot.getElementById("achievement-list");
  const feedback = documentRoot.getElementById("achievement-feedback");
  if (!root || !feedback) throw new Error("成就页面缺少必要容器。");
  activePages.get(root)?.();
  let service;
  let unmount;
  const view = documentRoot.defaultView;
  const showFeedback = (message) => {
    feedback.textContent = message;
    feedback.hidden = false;
  };
  try {
    service = createAchievements(host);
    feedback.hidden = true;
    // 解锁提示由游戏内的通知方负责；成就页展示已恢复的状态。
    unmount = mountAchievements({
      module: service, root, showFeedback, notifyUnlocks: false
    });
  } catch (error) {
    service?.dispose();
    showFeedback("暂时无法读取成就，请返回游戏重试。");
    console.error("[achievements-page] 页面初始化失败。", error);
    throw error;
  }
  let disposed = false;
  const stop = () => {
    if (disposed) return;
    disposed = true;
    unmount();
    service.dispose();
    view?.removeEventListener("pagehide", leavePage);
    view?.removeEventListener("pageshow", restorePage);
    activePages.delete(root);
  };
  function leavePage(event) {
    // 浏览器往返缓存会保留页面，恢复时重新校验身份与状态。
    if (!event.persisted) stop();
  }
  function restorePage(event) {
    if (!event.persisted) return;
    stop();
    try { mountAchievementsPage({ host, documentRoot }); }
    catch { /* 初始化函数已显示错误并记录原因。 */ }
  }
  activePages.set(root, stop);
  view?.addEventListener("pagehide", leavePage);
  view?.addEventListener("pageshow", restorePage);
  return stop;
}

// 显式演示入口读取专用记录，不切换正式账户。
if (typeof window !== "undefined"
  && window.location.pathname.endsWith("/pages/achievements/achievements.html")
  && new URLSearchParams(window.location.search).get("demo") === "1") {
  import("./achievements-demo.js").catch((error) => {
    const feedback = document.getElementById("achievement-feedback");
    if (feedback) {
      feedback.hidden = false;
      feedback.textContent = "演示加载失败，请重新打开页面。";
    }
    console.error("[achievements-page] 演示入口加载失败。", error);
  });
}
