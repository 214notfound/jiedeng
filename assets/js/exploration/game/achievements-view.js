// 成就视图：展示状态并按指定通知方发出一次提示，不修改全局成就。
import { element, region, createFeedback } from "./view-utils.js";

// 同一模块实例只允许一个视图承担通知，其他视图仍可展示。
const notificationOwners = new WeakMap();
export function mountAchievements({ module, root, showFeedback, notifyUnlocks = true }) {
  if (typeof showFeedback !== "function") throw new TypeError("缺少反馈回调。");
  if (!root?.append) throw new TypeError("缺少成就挂载容器。");
  const initial = module.listAchievements();
  const seen = new Set(initial.filter((item) => item.unlocked).map((item) => item.id));
  const owner = {};
  if (notifyUnlocks && !notificationOwners.has(module)) notificationOwners.set(module, owner);
  const container = region(root);
  const notify = createFeedback(container, showFeedback);
  const list = element("div", "exploration-achievements");
  container.append(list);
  let active = true;
  function render() {
    if (!active) return;
    try {
      const items = module.listAchievements();
      if (notifyUnlocks && !notificationOwners.has(module)) notificationOwners.set(module, owner);
      list.replaceChildren(element("h2", "exploration-title", "成就"));
      for (const item of items) {
        const card = element("article", "content-card");
        card.append(element("h3", "", item.name), element("p", "", item.description),
          element("p", "", item.unlocked ? "已解锁" : "未解锁"));
        if (item.unlockedAt) {
          const time = element("time", "", new Date(item.unlockedAt).toLocaleString("zh-CN"));
          time.dateTime = item.unlockedAt;
          card.append(time);
        }
        list.append(card);
        if (item.unlocked && !seen.has(item.id)) {
          // 在调用外部反馈前记录，避免反馈同步重入导致重复通知。
          seen.add(item.id);
          if (notificationOwners.get(module) === owner) notify("成就解锁：" + item.name, "success");
        }
      }
    } catch (error) {
      list.replaceChildren();
      notify(error.message, "error");
    }
  }
  let unsubscribe;
  try { unsubscribe = module.subscribe(render); }
  catch (error) {
    if (notificationOwners.get(module) === owner) notificationOwners.delete(module);
    container.remove();
    throw error;
  }
  render();
  return () => {
    if (!active) return;
    active = false;
    unsubscribe();
    if (notificationOwners.get(module) === owner) notificationOwners.delete(module);
    container.remove();
  };
}
