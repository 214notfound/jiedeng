// 探索视图：渲染当前场景与调查状态；不离开场景，也不推进剧情 Node。
import { buildHotspotViews } from "./hotspot-view.js";
import { element, button, region, createFeedback, playerMessage } from "./view-utils.js";
import { mountInventory } from "./inventory.js";
import { characterAssetFor } from "../data/character-assets.js";
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
  const notify = createFeedback(scene, showFeedback);
  const heading = element("h2", "exploration-title");
  const help = element("p", "exploration-help", "点击场景中发光的物体或人物，查看线索或开始交谈。");
  const stage = element("div", "exploration-stage scene-coordinate-space");
  const backdrop = document.createElement("img");
  backdrop.className = "exploration-scene-image";
  backdrop.alt = "";
  const character = document.createElement("img");
  character.className = "exploration-character-visual";
  character.alt = "";
  character.hidden = true;
  const hotspots = element("div", "exploration-hotspots");
  stage.append(backdrop, character, hotspots);
  scene.append(heading, help, stage);
  let active = true;
  let inventoryView;

  function clearCharacter() {
    character.hidden = true;
    character.removeAttribute("src");
    character.removeAttribute("data-character-id");
    character.removeAttribute("data-placement");
  }

  function showCharacter(npcId) {
    const asset = characterAssetFor(npcId);
    if (!asset) {
      clearCharacter();
      return;
    }
    character.src = asset.src;
    character.dataset.characterId = npcId;
    character.dataset.placement = asset.placement;
    character.hidden = false;
  }

  function startConversation(sceneId, actionId, node) {
    const conversationInput = module.getReadingInput?.(sceneId, actionId);
    if (!conversationInput) return false;

    node.disabled = true;
    showCharacter(conversationInput.metadata?.npcId);
    openConversation(conversationInput, {
      onComplete: async (result) => {
        const outcome = await module.completeReading(sceneId, actionId, result);
        if (active) {
          notify(
            playerMessage(outcome.message, "交谈未完成，请重试。"),
            outcome.ok ? "success" : "warning",
            outcome.ok ? undefined : "OPERATION_FAILED"
          );
        }
        if (active && outcome.ok) clearCharacter();
        if (active && !outcome.ok) node.disabled = false;
        return outcome;
      },
      onFailure: () => {
        if (active) node.disabled = false;
      },
      onClose: () => {
        clearCharacter();
        if (active) node.disabled = false;
      }
    });
    return true;
  }

  function startConversationChoice(sceneId, hotspot, node) {
    const choiceInput = module.getReadingChoiceInput?.(
      sceneId,
      hotspot.interactions.map((action) => action.id)
    );
    if (!choiceInput) return false;

    node.disabled = true;
    showCharacter(choiceInput.metadata?.npcId);
    openConversation(choiceInput, {
      onAction: (selectedActionId) => {
        const selected = hotspot.interactions.find((action) => action.id === selectedActionId);
        if (!selected || !startConversation(sceneId, selected.id, node)) {
          node.disabled = false;
          notify("这项对话当前不可用，请重新选择人物。", "warning");
        }
      },
      onClose: () => {
        clearCharacter();
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
      if (view.sceneImage && backdrop.src !== view.sceneImage) backdrop.src = view.sceneImage;
      stage.dataset.sceneId = view.sceneId;
      stage.dataset.sceneVariant = view.sceneVariant;
      heading.textContent = view.name;
      stage.setAttribute("aria-label", view.name + "探索区域");
      const views = buildHotspotViews(view, layout);
      hotspots.replaceChildren(...views.map((hotspot) => {
        const action = hotspot.interaction;
        const node = button(hotspot.marker, async () => {
          if (!active) return;
          if (action.interactionType === "conversation") {
            if (!startConversationChoice(sceneId, hotspot, node)
              && !startConversation(sceneId, action.id, node)) {
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
            result.ok ? "success" : "warning",
            result.ok ? undefined : "OPERATION_FAILED");
          if (result.ok && module.getItemDetail?.(action.id)) {
            hotspots.querySelector('[data-hotspot-id="' + action.id + '"]')?.focus();
            inventoryView.openTarget(action.id);
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
    } catch (error) {
      hotspots.replaceChildren();
      heading.textContent = "探索暂不可用";
      notify(
        playerMessage(error.message, "探索暂时无法使用，请返回主菜单后重试。"),
        "error",
        "OPERATION_FAILED"
      );
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
    throw error;
  }
  render();
  return () => {
    if (!active) return;
    active = false;
    clearCharacter();
    unsubscribe();
    inventoryView.dispose();
    scene.remove();
  };
}
