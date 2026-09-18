// 成就视图：展示状态并按指定通知方发出一次提示，不修改全局成就。
import { element, region, createFeedback, playerMessage } from "./view-utils.js";

const notificationOwners = new WeakMap();
const CATEGORY_LABELS = Object.freeze({
  investigation: "调查札记",
  truth: "灯下真相",
  ending: "终局余烬"
});
const CATEGORY_ORDER = Object.freeze(["investigation", "truth", "ending"]);
const ENDING_MARKS = Object.freeze(["Ⅰ", "Ⅱ", "Ⅲ", "Ⅳ", "Ⅴ"]);

function displayName(item) {
  if (!item.secret || item.unlocked) return item.name;
  return `未明之章 · ${ENDING_MARKS[item.sequence - 1] ?? item.sequence}`;
}

function displayDescription(item) {
  // 未解锁时不渲染说明，避免成就页反向暴露剧情线索；解锁后再展示完整文案。
  return item.unlocked ? item.description : null;
}

function createCard(item) {
  const card = element("article", "achievement-card");
  card.classList.toggle("achievement-card--unlocked", item.unlocked);
  card.classList.toggle("achievement-card--locked", !item.unlocked);
  card.dataset.achievementId = item.id;

  const mark = element("span", "achievement-card__mark", item.unlocked ? "灯" : "影");
  mark.setAttribute("aria-hidden", "true");
  const copy = element("div", "achievement-card__copy");
  const status = item.available === false
    ? "记录异常"
    : item.unlocked ? "已解锁" : "未解锁";
  copy.append(
    element("p", "achievement-card__status", status),
    element("h3", "achievement-card__title", displayName(item))
  );
  const description = displayDescription(item);
  if (description) {
    copy.append(element("p", "achievement-card__description", description));
  }
  if (item.warning) {
    copy.append(element("p", "achievement-warning",
      playerMessage(item.warning, "这项成就暂时无法确认。")));
  }
  if (item.unlockedAt) {
    const time = element("time", "achievement-card__time",
      new Date(item.unlockedAt).toLocaleString("zh-CN"));
    time.dateTime = item.unlockedAt;
    copy.append(time);
  }
  card.append(mark, copy);
  return card;
}

export function mountAchievements({ module, root, showFeedback, notifyUnlocks = true }) {
  if (typeof showFeedback !== "function") throw new TypeError("缺少反馈回调。");
  if (!root?.append) throw new TypeError("缺少成就挂载容器。");
  const initial = module.listAchievements();
  const seen = new Set(initial.filter((item) => item.unlocked).map((item) => item.id));
  const owner = {};
  if (notifyUnlocks && !notificationOwners.has(module)) notificationOwners.set(module, owner);
  const container = region(root);
  const notify = createFeedback(container, showFeedback);
  const list = element("div", "achievement-catalogue");
  container.append(list);
  let active = true;

  function render() {
    if (!active) return;
    try {
      const items = module.listAchievements();
      if (notifyUnlocks && !notificationOwners.has(module)) notificationOwners.set(module, owner);
      const unlockedCount = items.filter((item) => item.unlocked).length;
      const summary = element("section", "achievement-summary");
      summary.setAttribute("aria-label", "成就进度");
      summary.append(
        element("p", "achievement-summary__eyebrow", "ARCHIVE / 雨夜记录"),
        element("p", "achievement-summary__count", `${unlockedCount} / ${items.length}`),
        element("p", "achievement-summary__copy", "每一次调查、选择与抵达，都会在这里留下一点灯光。")
      );
      const progress = element("div", "achievement-summary__progress");
      progress.setAttribute("role", "progressbar");
      progress.setAttribute("aria-valuemin", "0");
      progress.setAttribute("aria-valuemax", String(items.length));
      progress.setAttribute("aria-valuenow", String(unlockedCount));
      const progressFill = element("span", "achievement-summary__progress-fill");
      progressFill.style.width = `${items.length ? unlockedCount / items.length * 100 : 0}%`;
      progress.append(progressFill);
      summary.append(progress);

      const sections = CATEGORY_ORDER.map((category) => {
        const section = element("section", "achievement-group");
        const heading = element("h2", "achievement-group__title", CATEGORY_LABELS[category]);
        const grid = element("div", "achievement-grid");
        for (const item of items.filter((entry) => entry.category === category)) {
          grid.append(createCard(item));
        }
        section.append(heading, grid);
        return section;
      });
      list.replaceChildren(summary, ...sections);

      for (const item of items) {
        if (item.unlocked && !seen.has(item.id)) {
          seen.add(item.id);
          if (notificationOwners.get(module) === owner) notify("成就解锁：" + item.name, "success");
        }
      }
    } catch (error) {
      list.replaceChildren();
      notify(playerMessage(error.message, "成就暂时无法读取，请返回游戏重试。"), "error");
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
