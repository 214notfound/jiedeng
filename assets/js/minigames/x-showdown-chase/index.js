import {calculateCamera} from "../shared-2d/camera.js";
import {createGameLoop} from "../shared-2d/game-loop.js";
import {createKeyboardInput} from "../shared-2d/input.js";
import {createEntryBriefingOverlay, createPauseOverlay, element, ensureStylesheet} from "../shared-2d/ui-base.js";
import {
  collectNearbyEvidence, createChaseState, evidenceCount, nearbyEvidence, updateChaseState
} from "./core.js";
import {CHASE_EVIDENCE, CHASE_EXIT, CHASE_WALLS, CHASE_WORLD} from "./map-data.js";

function position(node, entity) {
  node.style.left = `${entity.x}px`;
  node.style.top = `${entity.y}px`;
  node.style.width = `${entity.w}px`;
  node.style.height = `${entity.h}px`;
}

const ASSET_ROOT = "../assets/images/minigames";
const CHARACTER_SPRITES = Object.freeze({
  player: "game3/wangque_sprite_topdown.png",
  enemy: "game3/xiaozhou_sprite_topdown.png"
});
const CHARACTER_ASSET_VERSION = "20260918-v1";

function sprite(src, alt, className = "mg2d-sprite") {
  const image = element("img", className);
  image.src = `${ASSET_ROOT}/${src}`;
  image.alt = alt;
  image.setAttribute("aria-hidden", "true");
  return image;
}

export function mountXShowdownChase(container, {onResult, onCancel, onTechnicalError = () => {}}) {
  void onTechnicalError;
  ensureStylesheet("../assets/js/minigames/x-showdown-chase/styles.css", "x-showdown-chase");
  let state = createChaseState();
  let started = false;
  let paused = false;
  let submitting = false;
  let destroyed = false;

  const root = element("section", "mg2d mg-chase");
  const hud = element("div", "mg2d-hud");
  const objective = element("div", "mg2d-objective");
  objective.append(element("h1", "mg2d-title", "逃离数据机房"));
  const objectiveText = element("p", "mg2d-objective__text", "收集 3 份关键证据并抵达出口");
  objective.append(objectiveText);
  const meters = element("div", "mg-chase__meters");
  const hp = element("strong", "mg-chase__hp");
  const evidenceMeter = element("strong", "mg-chase__evidence-count");
  meters.append(hp, evidenceMeter);
  hud.append(objective, meters, element("p", "mg2d-controls", "WASD 移动　E 收集　ESC 暂停"));

  const stage = element("div", "mg2d-stage");
  const world = element("div", "mg2d-world mg-chase__world");
  world.style.width = `${CHASE_WORLD.width}px`;
  world.style.height = `${CHASE_WORLD.height}px`;
  for (const wall of CHASE_WALLS) {
    const node = element("div", "mg2d-wall mg-chase__cabinet");
    position(node, wall);
    world.append(node);
  }
  const evidenceNodes = new Map();
  for (const item of CHASE_EVIDENCE) {
    const node = element("div", "mg-chase__evidence");
    node.append(sprite("game3/icon_evidence.png", "关键证据"), element("span", "mg-chase__label", "证据"));
    position(node, item);
    world.append(node);
    evidenceNodes.set(item.id, node);
  }
  const exit = element("div", "mg-chase__exit");
  const lockedExit = sprite("game3/prop_exit_locked.png", "锁定出口");
  const openExit = sprite("game3/prop_exit_open.png", "开放出口");
  openExit.hidden = true;
  exit.append(lockedExit, openExit, element("span", "mg-chase__label", "出口"));
  position(exit, CHASE_EXIT);
  const player = element("div", "mg2d-player");
  player.append(sprite(`${CHARACTER_SPRITES.player}?v=${CHARACTER_ASSET_VERSION}`, "王阙"));
  player.setAttribute("aria-label", "王阙");
  const enemy = element("div", "mg-chase__enemy");
  enemy.append(sprite(`${CHARACTER_SPRITES.enemy}?v=${CHARACTER_ASSET_VERSION}`, "小周"));
  enemy.setAttribute("aria-label", "小周");
  world.append(exit, player, enemy);
  const prompt = element("p", "mg2d-prompt");
  prompt.setAttribute("role", "status");
  stage.append(world, prompt);
  root.append(hud, stage);

  const rules = element("div", "mg-chase__rules");
  const rulesCard = element("div", "mg-chase__rules-card");
  rulesCard.append(
    element("h2", "mg-chase__rules-title", "行动规则"),
    element("p", "", "避开小周，收集机房内的 3 份关键证据。证据齐全后抵达出口即成功；生命值归零则失败。")
  );
  const startButton = element("button", "button button--primary", "开始行动");
  startButton.type = "button";
  rulesCard.append(startButton);
  rules.append(rulesCard);
  root.append(rules);
  rules.hidden = true;
  container.append(root);

  let loop;
  let input;
  let pauseOverlay;

  function resume() {
    if (submitting || !started) return;
    paused = false;
    input.setEnabled(true);
    pauseOverlay.hide();
  }

  function togglePause() {
    if (submitting || destroyed || !started) return;
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

  function render(now = performance.now()) {
    const viewport = {width: stage.clientWidth, height: stage.clientHeight};
    const camera = calculateCamera(state.player, viewport, CHASE_WORLD);
    world.style.transform = `translate3d(${-camera.x}px, ${-camera.y}px, 0)`;
    position(player, state.player);
    position(enemy, state.enemy);
    player.classList.toggle("is-invincible", now < state.invincibleUntil);
    for (const item of state.evidence) evidenceNodes.get(item.id).hidden = item.collected;
    const count = evidenceCount(state);
    hp.textContent = `生命 ${"♥".repeat(Math.max(0, state.hp))}${"♡".repeat(Math.max(0, 3 - state.hp))}`;
    evidenceMeter.textContent = `证据 ${count}/3`;
    exit.classList.toggle("is-locked", count < 3);
    lockedExit.hidden = count >= 3;
    openExit.hidden = count < 3;
    const target = nearbyEvidence(state);
    prompt.textContent = submitting
      ? "正在保存结果……"
      : target ? "按 E 收集关键证据" : count < 3 ? "" : "证据已齐，前往出口";
    prompt.hidden = !prompt.textContent;
  }

  function submitResult(result) {
    if (submitting) return;
    submitting = true;
    input.setEnabled(false);
    render();
    Promise.resolve(onResult(result)).catch(() => {});
  }

  function update(dt, now) {
    if (!started || paused || submitting || destroyed) return;
    state = updateChaseState(state, input.movement(), dt, now);
    if (input.consume("KeyE")) state = collectNearbyEvidence(state);
    if (state.result) submitResult(state.result);
    render(now);
  }

  function begin() {
    started = true;
    entryOverlay.hide();
    input.setEnabled(true);
    loop.start();
  }

  startButton.addEventListener("click", begin, {once: true});
  loop = createGameLoop(update);
  const entryOverlay = createEntryBriefingOverlay(root, {
    title: "逃离数据机房",
    objective: "躲开小周，收集 3 份关键证据，并带着证据抵达出口。",
    controls: "操作：WASD 移动，E 收集证据，ESC 暂停。",
    restriction: "不能攻击小周；收集满 3/3 后出口才会解锁。生命值归零则失败。",
    startLabel: "开始逃离",
    onStart: begin,
    onExit: onCancel
  });
  render();

  return Object.freeze({
    destroy() {
      if (destroyed) return;
      destroyed = true;
      loop.stop();
      input.destroy();
      pauseOverlay.destroy();
      entryOverlay.destroy();
      root.remove();
    }
  });
}
