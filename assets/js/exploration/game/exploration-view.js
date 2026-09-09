// 探索视图：渲染当前场景与调查状态；不离开场景，也不推进剧情 Node。
import { buildHotspotViews } from "./hotspot-view.js";
import { element, button, region, createFeedback, playerMessage } from "./view-utils.js";
import { mountInventory } from "./inventory.js";
export { mountAchievements } from "../../achievements/game/achievements-view.js";

export function mountExploration({
  module, sceneRoot, actionsRoot, inventoryRoot, detailRoot,
  showFeedback, openDetail, openConversation
}) {
  if (typeof showFeedback !== "function") {
    throw new TypeError("缺少全局反馈入口。");
  }
  if (![sceneRoot, actionsRoot, inventoryRoot, detailRoot].every((root) => root?.append)) {
    throw new TypeError("缺少约定区域。");
  }
  if (typeof openDetail !== "function") {
    throw new TypeError("缺少统一详情入口。");
  }
  if (typeof openConversation !== "function") {
    throw new TypeError("缺少统一阅读入口。");
  }
  const scene = region(sceneRoot);
  const actions = region(actionsRoot);
  const notify = createFeedback(scene, showFeedback);
  const heading = element("h2", "exploration-title");
  const help = element("p", "exploration-help", "点击场景中发光的物体或人物，查看线索或开始交谈。");
  const stage = element("div", "exploration-stage scene-coordinate-space");
  const hotspots = element("div", "exploration-hotspots");
  stage.append(hotspots);
  scene.append(heading, help, stage);
  let active = true;
  let inventoryView;

  function startConversation(sceneId, actionId, node) {
    const conversationInput = module.getReadingInput?.(sceneId, actionId);
    if (!conversationInput) return false;

    node.disabled = true;
    openConversation(conversationInput, {
      onComplete: async (result) => {
        const outcome = await module.completeReading(sceneId, actionId, result);
        if (active) {
          notify(
            playerMessage(outcome.message, "交谈未完成，请重试。"),
            outcome.ok ? "success" : "warning"
          );
        }
        if (active && !outcome.ok) node.disabled = false;
        return outcome;
      },
      onFailure: () => {
        if (active) node.disabled = false;
      },
      onClose: () => {
        if (active) node.disabled = false;
      }
    });
    return true;
  }
  function render() {
    if (!active) return;
    try {
      const sceneId = module.getCurrentSceneId();
      const view = module.getSceneView(sceneId);
      const layout = module.getLayout();
      stage.dataset.sceneId = sceneId;
      heading.textContent = view.name;
      stage.setAttribute("aria-label", view.name + "探索区域");
      const views = buildHotspotViews(view, layout);
      hotspots.replaceChildren(...views.map((hotspot) => {
        const action = hotspot.interaction;
        const node = button(hotspot.marker, async () => {
          if (!active) return;
          if (action.interactionType === "conversation") {
            if (!startConversation(sceneId, action.id, node)) {
              notify("这段对话当前不可用，请刷新后重试。", "warning");
            }
            return;
          }
          if (action.interactionType !== "item") {
            notify("热点类型无法识别，未执行任何操作。", "error");
            return;
          }
          node.disabled = true;
          const result = await module.interact(sceneId, action.id);
          if (!active) return;
          node.disabled = false;
          notify(playerMessage(result.speaker ? "【" + result.speaker + "】" + result.message : result.message,
            "调查未完成，请重试或稍后再来。"),
            result.ok ? "success" : "warning");
          if (result.ok && module.listItems().some((item) => item.id === action.id)) {
            hotspots.querySelector('[data-hotspot-id="' + action.id + '"]')?.focus();
            inventoryView.openItem(action.id);
          }
        }, "scene-hotspot" + (action.completed ? " is-completed" : "")
          + (!action.available ? " is-disabled" : ""));
        node.style.left = hotspot.x + "%";
        node.style.top = hotspot.y + "%";
        node.dataset.hotspotId = hotspot.id;
        node.dataset.hotspotX = String(hotspot.x);
        node.dataset.hotspotY = String(hotspot.y);
        node.dataset.interactionType = action.interactionType;
        node.setAttribute("aria-disabled", String(!action.available));
        node.setAttribute("aria-label", action.label + (action.completed ? "，已调查，可回读" : ""));
        return node;
      }));
      const alternatives = view.interactions.filter(action => action.alternative && !action.completed);
      actions.replaceChildren();
      if (alternatives.length) {
        actions.append(element("h2", "exploration-title", "可选交谈方式"));
      }
      for (const alternative of alternatives) {
        const alternativeButton = button(alternative.label, async () => {
          if (!active || startConversation(sceneId, alternative.id, alternativeButton)) return;
          const result = await module.interact(sceneId, alternative.id);
          if (active) notify(playerMessage(result.message, "操作未完成，请重试。"), result.ok ? "success" : "warning");
        });
        actions.append(alternativeButton);
      }
    } catch (error) {
      hotspots.replaceChildren();
      actions.replaceChildren();
      heading.textContent = "探索暂不可用";
      notify(playerMessage(error.message, "探索暂时无法使用，请返回主菜单后重试。"), "error");
    }
  }
  let unsubscribe;
  try {
    unsubscribe = module.subscribe(render);
    inventoryView = mountInventory({
      module,
      root: inventoryRoot,
      detailRoot,
      showFeedback,
      openDetail
    });
  } catch (error) {
    unsubscribe?.();
    scene.remove();
    actions.remove();
    throw error;
  }
  render();
  return () => {
    if (!active) return;
    active = false;
    unsubscribe();
    inventoryView.dispose();
    scene.remove();
    actions.remove();
  };
}
