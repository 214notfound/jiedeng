// 背包视图：只读展示已提交物品；详情统一挂载到 controller 管理的 detail-root。
import {element, button, region, createFeedback, playerMessage} from "./view-utils.js";

export function mountInventory({module, root, detailRoot, showFeedback, openDetail}) {
  if (typeof showFeedback !== "function") throw new TypeError("缺少反馈回调。");
  if (!detailRoot?.append) throw new TypeError("缺少详情容器。");
  if (typeof openDetail !== "function") throw new TypeError("缺少统一详情入口。");

  const container = region(root);
  const detail = region(detailRoot);
  const notify = createFeedback(container, showFeedback);
  const browser = element("div", "exploration-inventory-browser");
  const detailTitle = element("h2", "exploration-title", "详情");
  const detailImage = document.createElement("img");
  detailImage.width = 240;
  detailImage.height = 240;
  detailImage.alt = "";
  const detailImageError = element("p", "resource-fallback", "图片暂不可用，仍可阅读物品说明。");
  detailImageError.hidden = true;
  detailImage.addEventListener("error", () => {
    detailImage.hidden = true;
    detailImageError.hidden = false;
  });
  const detailDescription = element("p");
  const detailSource = element("p");
  detail.append(detailTitle, detailImage, detailImageError, detailDescription, detailSource);
  container.append(browser);

  let layer = "items";
  let active = true;

  function renderDetail(itemId) {
    const item = module.listItems().find((entry) => entry.id === itemId);
    if (!item) throw new Error("这件物品尚未获得。");

    detailTitle.textContent = item.name;
    detailImage.hidden = false;
    detailImageError.hidden = true;
    detailImage.alt = item.name;
    detailImage.src = item.image;
    detailDescription.textContent = item.description;
    detailSource.textContent = "来源：" + item.source + " · 已获得";
  }

  function openItem(itemId) {
    try {
      renderDetail(itemId);
      const result = openDetail(itemId);
      if (!result?.ok) {
        throw new Error(result?.message || "详情暂时无法打开。");
      }
    } catch (error) {
      notify(playerMessage(error.message, "暂时无法查看这项内容，请重试。"), "error");
    }
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
        const thumbnailError = element(
          "span",
          "resource-fallback resource-fallback--thumbnail",
          "图片暂不可用"
        );
        thumbnailError.hidden = true;
        thumbnail.addEventListener("error", () => {
          thumbnail.hidden = true;
          thumbnailError.hidden = false;
        }, {once: true});
        entry.append(
          thumbnail,
          thumbnailError,
          element("span", "", item.name),
          element("span", "", "来源：" + item.source + " · 已获得")
        );
        card.append(entry);
        list.append(card);
      }
      browser.append(list);
      const candidate = focusedId
        ? [...list.querySelectorAll("[data-item-id]")]
          .find((node) => node.dataset.itemId === focusedId)
        : focusedLayer
          ? controls.querySelector('[data-layer="' + focusedLayer + '"]')
          : null;
      candidate?.focus();
    } catch (error) {
      browser.replaceChildren();
      notify(playerMessage(error.message, "背包暂时无法读取，请重试。"), "error");
    }
  }

  let unsubscribe;
  try {
    unsubscribe = module.subscribe(render);
  } catch (error) {
    container.remove();
    detail.remove();
    throw error;
  }
  render();

  return () => {
    if (!active) return;
    active = false;
    unsubscribe();
    container.remove();
    detail.replaceChildren();
    detail.remove();
  };
}
