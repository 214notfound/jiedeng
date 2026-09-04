// 背包视图：两类物品列表、详情弹窗与焦点恢复，独立订阅状态。
import { element, button, region, createFeedback } from "./view-utils.js";

let nextDialogId = 0;
export function mountInventory({ module, root, showFeedback }) {
  if (typeof showFeedback !== "function") throw new TypeError("缺少反馈回调。");
  const container = region(root);
  const notify = createFeedback(container, showFeedback);
  const browser = element("div", "exploration-inventory-browser");
  const dialog = document.createElement("dialog");
  dialog.className = "exploration-item-dialog modal";
  const title = element("h3", "exploration-title");
  title.id = "exploration-item-title-" + (++nextDialogId);
  dialog.setAttribute("aria-labelledby", title.id);
  const image = document.createElement("img");
  image.width = 240;
  image.height = 240;
  const imageError = element("p", "", "图片暂不可用，仍可阅读物品说明。");
  imageError.hidden = true;
  image.addEventListener("error", () => { image.hidden = true; imageError.hidden = false; });
  const description = element("p", "");
  const source = element("p", "");
  const close = button("关闭详情", () => dialog.close());
  dialog.append(title, image, imageError, description, source, close);
  container.append(browser, dialog);
  let layer = "items";
  let selectedId = null;
  let active = true;

  dialog.addEventListener("close", () => {
    if (!active) return;
    const target = [...browser.querySelectorAll("[data-item-id]")].find((node) => node.dataset.itemId === selectedId);
    (target ?? browser.querySelector("[data-layer]"))?.focus();
    selectedId = null;
  });
  function openItem(itemId) {
    try {
      const item = module.listItems().find((entry) => entry.id === itemId);
      if (!item) throw new Error("这件物品尚未获得。");
      selectedId = item.id;
      title.textContent = item.name;
      image.hidden = false;
      imageError.hidden = true;
      image.alt = item.name;
      image.src = item.image;
      description.textContent = item.description;
      source.textContent = "来源：" + item.source + " · 已获得";
      if (!dialog.open) dialog.showModal();
      close.focus();
    } catch (error) { notify(error.message, "error"); }
  }
  function render() {
    if (!active) return;
    try {
      const items = module.listItems(layer);
      const focusedId = document.activeElement?.dataset.itemId;
      const focusedLayer = document.activeElement?.dataset.layer;
      browser.replaceChildren(element("h2", "exploration-title", "背包"));
      const controls = element("div", "exploration-controls");
      controls.setAttribute("aria-label", "背包分类");
      for (const [id, label] of [["items", "物品"], ["clues", "线索碎片"]]) {
        const tab = button(label, () => {
          layer = id;
          render();
          browser.querySelector('[data-layer="' + id + '"]')?.focus();
        });
        tab.dataset.layer = id;
        tab.setAttribute("aria-pressed", String(layer === id));
        controls.append(tab);
      }
      browser.append(controls);
      if (!items.length) browser.append(element("p", "", "暂无内容。"));
      const list = element("ul", "exploration-inventory");
      for (const item of items) {
        const card = element("li", "content-card");
        const entry = button("", () => openItem(item.id), "exploration-item-button");
        entry.dataset.itemId = item.id;
        entry.setAttribute("aria-label", "查看" + item.name + "详情");
        const thumbnail = document.createElement("img");
        thumbnail.src = item.image;
        thumbnail.alt = "";
        thumbnail.width = 64;
        thumbnail.height = 64;
        entry.append(thumbnail, element("span", "", item.name),
          element("span", "", "来源：" + item.source + " · 已获得"));
        card.append(entry);
        list.append(card);
      }
      browser.append(list);
      if (dialog.open && !module.listItems().some((item) => item.id === selectedId)) dialog.close();
      if (!dialog.open) {
        const candidate = focusedId
          ? [...list.querySelectorAll("[data-item-id]")].find((node) => node.dataset.itemId === focusedId)
          : focusedLayer ? controls.querySelector('[data-layer="' + focusedLayer + '"]') : null;
        candidate?.focus();
      }
    } catch (error) {
      selectedId = null;
      if (dialog.open) dialog.close();
      browser.replaceChildren();
      notify(error.message, "error");
    }
  }
  let unsubscribe;
  try { unsubscribe = module.subscribe(render); }
  catch (error) { container.remove(); throw error; }
  render();
  return () => {
    if (!active) return;
    active = false;
    unsubscribe();
    if (dialog.open) dialog.close();
    container.remove();
  };
}
