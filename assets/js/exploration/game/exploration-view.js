// 探索视图：热点、移动与任务提示；背包和成就由独立视图维护。
import { buildHotspotViews } from "./hotspot-view.js";
import { findNearestHotspotIndex } from "./exploration-movement.js";
import { moveHotspotFocus } from "./hotspot-keyboard.js";
import { element, button, region, createFeedback } from "./view-utils.js";
import { mountInventory } from "./inventory.js";
export { mountAchievements } from "../../achievements/game/achievements-view.js";

const MOVEMENT = {
  ArrowUp: [0, -1], w: [0, -1], ArrowDown: [0, 1], s: [0, 1],
  ArrowLeft: [-1, 0], a: [-1, 0], ArrowRight: [1, 0], d: [1, 0]
};
export function mountExploration({
  module, sceneRoot, actionsRoot, inventoryRoot, showFeedback, openMap
}) {
  if (typeof showFeedback !== "function" || typeof openMap !== "function") {
    throw new TypeError("缺少全局反馈或地图入口。");
  }
  if (![sceneRoot, actionsRoot, inventoryRoot].every((root) => root?.append)) {
    throw new TypeError("缺少约定区域。");
  }
  const scene = region(sceneRoot);
  const actions = region(actionsRoot);
  const notify = createFeedback(scene, showFeedback);
  const heading = element("h2", "exploration-title");
  const help = element("p", "exploration-help",
    "方向键或 WASD 行走，靠近后按 E/Enter 调查；Tab 可直接选择热点。");
  const stage = element("div", "exploration-stage");
  stage.tabIndex = 0;
  stage.setAttribute("role", "group");
  const hotspots = element("div", "exploration-hotspots");
  const marker = element("span", "exploration-viewpoint", "视点");
  marker.setAttribute("aria-hidden", "true");
  const nearby = element("p", "exploration-nearby");
  nearby.setAttribute("aria-live", "polite");
  stage.append(hotspots, marker);
  scene.append(heading, help, stage, nearby);
  let currentScene = null;
  let position = { x: 50, y: 90 };
  let active = true;

  function offerConfirmation(result, sceneId, actionId) {
    if (!result.requiresConfirmation || !active) return;
    actions.querySelector(".conversation-confirmation")?.remove();
    const choices = element("div", "conversation-confirmation");
    choices.append(button("确认交谈完成", async () => {
      const outcome = await module.interact(sceneId, actionId, {confirm:true});
      if (active) notify(outcome.message, outcome.ok ? "success" : "warning");
      choices.remove();
    }), button("暂不交谈", () => {
      callExternal(() => module.cancel(result.commandId));
      choices.remove();
    }));
    actions.append(choices);
    choices.querySelector("button").focus();
  }

  function proximity() {
    const buttons = [...hotspots.querySelectorAll(".scene-hotspot")];
    const index = findNearestHotspotIndex(buttons.map((node) => ({
      x: Number(node.dataset.hotspotX), y: Number(node.dataset.hotspotY)
    })), position, 12);
    return buttons[index] ?? null;
  }
  function paintPosition() {
    marker.style.left = position.x + "%";
    marker.style.top = position.y + "%";
    const target = proximity();
    nearby.textContent = target
      ? "附近：" + target.textContent + "。按 E 或 Enter 调查。"
      : "附近没有目标，请继续移动。";
  }
  function callExternal(callback, argument) {
    try {
      if (typeof callback !== "function") throw new Error("剧情继续接口尚未接入。");
      Promise.resolve(callback(argument)).catch((error) => {
        console.error("[exploration-view] 外部操作失败。", error);
        if (active) notify("操作未完成，请重试或返回主菜单。", "error");
      });
    } catch (error) {
      console.error("[exploration-view] 外部操作失败。", error);
      notify(error.message, "error");
    }
  }
  stage.addEventListener("keydown", (event) => {
    if (!active || event.target !== stage) return;
    const vector = MOVEMENT[event.key] ?? MOVEMENT[event.key.toLowerCase()];
    if (vector) {
      event.preventDefault();
      position = {
        x: Math.max(3, Math.min(97, position.x + vector[0] * 4)),
        y: Math.max(3, Math.min(97, position.y + vector[1] * 4))
      };
      paintPosition();
    } else if (["e", "E", "Enter"].includes(event.key)) {
      event.preventDefault();
      proximity()?.click();
    }
  });
  hotspots.addEventListener("keydown", (event) => moveHotspotFocus(event, hotspots));

  function render() {
    if (!active) return;
    try {
      const sceneId = module.getCurrentSceneId();
      const view = module.getSceneView(sceneId);
      const layout = module.getLayout();
      const focused = document.activeElement?.dataset.hotspotId;
      const changedScene = currentScene !== null && currentScene !== sceneId;
      if (currentScene !== sceneId) position = { ...layout.playerStart };
      currentScene = sceneId;
      heading.textContent = view.name;
      marker.hidden = false;
      stage.setAttribute("aria-label", view.name + "探索区域");
      const views = buildHotspotViews(view, layout);
      hotspots.replaceChildren(...views.map((hotspot) => {
        const action = hotspot.interaction;
        const node = button(hotspot.marker + " · " + action.label, async () => {
          if (!active) return;
          node.disabled = true;
          const result = await module.interact(sceneId, action.id);
          if (!active) return;
          node.disabled = false;
          notify(result.speaker ? "【" + result.speaker + "】" + result.message : result.message,
            result.ok ? "success" : "warning");
          offerConfirmation(result, sceneId, action.id);
        }, "scene-hotspot" + (action.completed ? " is-completed" : "")
          + (!action.available ? " is-disabled" : ""));
        node.style.left = hotspot.x + "%";
        node.style.top = hotspot.y + "%";
        node.dataset.hotspotId = hotspot.id;
        node.dataset.hotspotX = String(hotspot.x);
        node.dataset.hotspotY = String(hotspot.y);
        node.setAttribute("aria-disabled", String(!action.available));
        node.setAttribute("aria-label", action.label + (action.completed ? "，已调查，可回读" : ""));
        return node;
      }));
      if (focused) {
        const replacement = [...hotspots.children].find((node) => node.dataset.hotspotId === focused);
        (replacement ?? stage).focus();
      } else if (changedScene && scene.contains(document.activeElement)) stage.focus();
      paintPosition();
      actions.replaceChildren(element("h2", "exploration-title", "当前调查"));
      const tasks = element("ul", "exploration-tasks");
      for (const { interaction } of views) {
        tasks.append(element("li", "", interaction.label + (interaction.completed ? " · 已完成" : "")));
      }
      actions.append(tasks);
      for (const alternative of view.interactions.filter(action => action.alternative && !action.completed)) {
        actions.append(button(alternative.label, async () => {
          const result = await module.interact(sceneId, alternative.id);
          if (active) notify(result.message, result.ok ? "success" : "warning");
          offerConfirmation(result, sceneId, alternative.id);
        }));
      }
      actions.append(button("离开当前地点", () => {
        if (!active) return;
        try {
          const status = module.getExitStatus(module.getCurrentSceneId());
          notify(status.message, status.canLeave ? "success" : "warning");
        } catch (error) { notify(error.message, "error"); }
      }));
      if (module.canStartMapPuzzle()) actions.append(button("复原手绘地图", () => {
        if (!active) return;
        try { if (module.canStartMapPuzzle()) callExternal(openMap, module.getMapCommand()); }
        catch (error) { notify(error.message, "error"); }
      }, "button button--primary"));
    } catch (error) {
      hotspots.replaceChildren();
      actions.replaceChildren();
      heading.textContent = "探索暂不可用";
      marker.hidden = true;
      nearby.textContent = "";
      notify(error.message, "error");
    }
  }
  let unsubscribe;
  let unmountInventory;
  try {
    unsubscribe = module.subscribe(render);
    unmountInventory = mountInventory({ module, root: inventoryRoot, showFeedback });
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
    unmountInventory();
    scene.remove();
    actions.remove();
  };
}
