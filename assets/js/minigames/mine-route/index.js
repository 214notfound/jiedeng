import {calculateCamera, worldToScreen} from "../shared-2d/camera.js";
import {createGameLoop} from "../shared-2d/game-loop.js";
import {createKeyboardInput} from "../shared-2d/input.js";
import {createEntryBriefingOverlay, createPauseOverlay, element, ensureStylesheet} from "../shared-2d/ui-base.js";
import {createMineState, interactMine, mineInteraction, updateMineState} from "./core.js";
import {
  MINE_DOOR, MINE_EXIT, MINE_INSPECT_POINTS, MINE_LAMPS, MINE_VALVE, MINE_WALLS, MINE_WORLD
} from "./map-data.js";

function position(node, entity) {
  node.style.left = `${entity.x}px`;
  node.style.top = `${entity.y}px`;
  node.style.width = `${entity.w}px`;
  node.style.height = `${entity.h}px`;
}

const ASSET_ROOT = "../assets/images/minigames";

function sprite(src, alt, className = "mg2d-sprite") {
  const image = element("img", className);
  image.src = `${ASSET_ROOT}/${src}`;
  image.alt = alt;
  image.setAttribute("aria-hidden", "true");
  return image;
}

export function mountMineRoute(container, {onResult, onCancel, onTechnicalError = () => {}}) {
  void onTechnicalError;
  ensureStylesheet("../assets/js/minigames/mine-route/styles.css", "mine-route");
  let state = createMineState();
  let paused = false;
  let started = false;
  let submitting = false;
  let destroyed = false;
  let noticeTimer = null;

  const root = element("section", "mg2d mg-mine");
  const hud = element("div", "mg2d-hud");
  const objective = element("div", "mg2d-objective");
  objective.append(element("h1", "mg2d-title", "还原矿井路线"));
  const objectiveText = element("p", "mg2d-objective__text", state.objective);
  objective.append(objectiveText);
  hud.append(objective, element("p", "mg2d-controls", "WASD 移动　E 互动　ESC 暂停"));

  const stage = element("div", "mg2d-stage");
  const world = element("div", "mg2d-world mg-mine__world");
  world.style.width = `${MINE_WORLD.width}px`;
  world.style.height = `${MINE_WORLD.height}px`;
  for (const wall of MINE_WALLS) {
    const node = element("div", "mg2d-wall");
    position(node, wall);
    world.append(node);
  }
  const door = element("div", "mg-mine__door");
  position(door, MINE_DOOR);
  door.append(sprite("game2/prop_blocked_gate.png", "封闭通道"), element("span", "mg-mine__label", "封闭通道"));
  const valve = element("div", "mg-mine__valve");
  position(valve, MINE_VALVE);
  valve.append(sprite("game2/prop_drain_valve.png", "排水控制阀"), element("span", "mg-mine__label", "排水阀"));
  const exit = element("div", "mg-mine__exit");
  position(exit, MINE_EXIT);
  exit.append(sprite("game2/prop_inner_shaft_exit.png", "内部竖井"), element("span", "mg-mine__label", "内部竖井"));
  const player = element("div", "mg2d-player");
  player.append(sprite("game2/player_candle_sprite.png", "蜡烛"));
  player.setAttribute("aria-label", "蜡烛光源");
  const inspectMarkers = new Map();
  for (const point of MINE_INSPECT_POINTS) {
    const marker = element("span", "mg-mine__inspect");
    marker.style.left = `${point.x}px`;
    marker.style.top = `${point.y}px`;
    marker.setAttribute("aria-hidden", "true");
    marker.dataset.inspectId = point.id;
    world.append(marker);
    inspectMarkers.set(point.id, marker);
  }
  const lampMarkers = new Map();
  for (const lamp of MINE_LAMPS) {
    const marker = element("span", "mg-mine__lamp-marker");
    marker.style.left = `${lamp.x}px`;
    marker.style.top = `${lamp.y}px`;
    marker.setAttribute("aria-hidden", "true");
    marker.dataset.lampId = lamp.id;
    world.append(marker);
    lampMarkers.set(lamp.id, marker);
  }
  world.append(door, valve, exit, player);
  const darkness = element("div", "mg-mine__darkness");
  const lampLights = new Map();
  for (const lamp of MINE_LAMPS) {
    const light = element("div", "mg-mine__lamp-light");
    light.style.width = `${lamp.lightRadius * 2}px`;
    light.style.height = `${lamp.lightRadius * 2}px`;
    light.hidden = true;
    light.setAttribute("aria-hidden", "true");
    lampLights.set(lamp.id, light);
  }
  const notice = element("div", "mg-mine__notice");
  notice.hidden = true;
  notice.setAttribute("role", "status");
  notice.setAttribute("aria-live", "polite");
  const noticeText = element("p", "mg-mine__notice-text");
  const noticeClose = element("button", "mg-mine__notice-close", "关闭");
  noticeClose.type = "button";
  notice.append(noticeText, noticeClose);
  const prompt = element("p", "mg2d-prompt");
  prompt.setAttribute("role", "status");
  stage.append(world, darkness, ...lampLights.values(), notice, prompt);
  root.append(hud, stage);
  container.append(root);

  let loop;
  let input;
  let pauseOverlay;

  function hideNotice() {
    if (noticeTimer !== null) {
      clearTimeout(noticeTimer);
      noticeTimer = null;
    }
    notice.hidden = true;
  }

  function showNotice(text) {
    if (noticeTimer !== null) clearTimeout(noticeTimer);
    noticeText.textContent = text;
    notice.hidden = false;
    noticeTimer = setTimeout(() => {
      noticeTimer = null;
      notice.hidden = true;
    }, 4000);
  }

  noticeClose.addEventListener("click", hideNotice);

  function resume() {
    if (submitting) return;
    paused = false;
    input.setEnabled(true);
    pauseOverlay.hide();
  }

  function togglePause() {
    if (submitting || destroyed) return;
    paused = !paused;
    input.setEnabled(!paused);
    if (paused) pauseOverlay.show();
    else pauseOverlay.hide();
  }

  function requestExit() {
    if (submitting) return;
    submitting = true;
    input.setEnabled(false);
    Promise.resolve(onCancel()).then((outcome) => {
      if (!outcome?.ok && !destroyed) {
        submitting = false;
        paused = true;
        pauseOverlay.show();
      }
    }).catch(() => {
      submitting = false;
      if (!destroyed) pauseOverlay.show();
    });
  }

  input = createKeyboardInput({onPause: togglePause});
  input.setEnabled(false);
  pauseOverlay = createPauseOverlay(root, {onResume: resume, onExit: requestExit});
  function begin() {
    started = true;
    entryOverlay.hide();
    input.setEnabled(true);
    loop.start();
  }
  const entryOverlay = createEntryBriefingOverlay(root, {
    title: "还原矿井路线",
    objective: "在黑暗矿井中找到排水控制阀，打开封闭通道，最后抵达内部竖井。",
    controls: "操作：WASD 移动，E 互动，ESC 暂停。",
    restriction: "需要先打开排水阀，封闭通道才会解除。",
    startLabel: "进入矿井",
    onStart: begin,
    onExit: onCancel
  });

  function render() {
    const viewport = {width: stage.clientWidth, height: stage.clientHeight};
    const camera = calculateCamera(state.player, viewport, MINE_WORLD);
    world.style.transform = `translate3d(${-camera.x}px, ${-camera.y}px, 0)`;
    position(player, state.player);
    const screen = worldToScreen({x: state.player.x + state.player.w / 2, y: state.player.y + state.player.h / 2}, camera);
    stage.style.setProperty("--light-x", `${screen.x}px`);
    stage.style.setProperty("--light-y", `${screen.y}px`);
    door.hidden = state.valveOpen;
    valve.classList.toggle("is-active", state.valveOpen);
    for (const lamp of MINE_LAMPS) {
      const active = state.lamps[lamp.id] === true;
      lampMarkers.get(lamp.id).classList.toggle("is-active", active);
      const light = lampLights.get(lamp.id);
      light.hidden = !active;
      if (active) {
        const lampScreen = worldToScreen(lamp, camera);
        light.style.left = `${lampScreen.x}px`;
        light.style.top = `${lampScreen.y}px`;
      }
    }
    objectiveText.textContent = state.objective;
    const interaction = mineInteraction(state);
    prompt.textContent = submitting ? "正在保存结果……" : interaction?.text ?? "";
    prompt.hidden = !prompt.textContent;
  }

  function update(dt) {
    if (!started || paused || submitting || destroyed) return;
    state = updateMineState(state, input.movement(), dt);
    if (input.consume("KeyE")) {
      const interaction = mineInteraction(state);
      state = interactMine(state);
      if (interaction?.type === "inspect") showNotice(interaction.detail);
      if (interaction?.type === "lamp") showNotice("旧矿灯亮了起来。");
      if (state.completed) {
        submitting = true;
        input.setEnabled(false);
        Promise.resolve(onResult("success")).catch(() => {});
      }
    }
    render();
  }

  loop = createGameLoop(update);
  render();
  root.focus?.();

  return Object.freeze({
    destroy() {
      if (destroyed) return;
      destroyed = true;
      loop.stop();
      input.destroy();
      hideNotice();
      noticeClose.removeEventListener("click", hideNotice);
      pauseOverlay.destroy();
      entryOverlay.destroy();
      root.remove();
    }
  });
}
