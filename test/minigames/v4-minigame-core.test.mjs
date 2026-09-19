import test from "node:test";
import assert from "node:assert/strict";
import {analyzeNetwork, connectorsFor, rotateTile} from "../../assets/js/minigames/haunting-network/core.js";
import {createInitialBoard, createSolvedBoard} from "../../assets/js/minigames/haunting-network/board-data.js";
import {calculateCamera} from "../../assets/js/minigames/shared-2d/camera.js";
import {createGameLoop} from "../../assets/js/minigames/shared-2d/game-loop.js";
import {createKeyboardInput} from "../../assets/js/minigames/shared-2d/input.js";
import {inputVector} from "../../assets/js/minigames/shared-2d/movement.js";
import {createMineState, interactMine, mineInteraction, mineWalls} from "../../assets/js/minigames/mine-route/core.js";
import {
  MINE_DOOR, MINE_EXIT, MINE_INSPECT_POINTS, MINE_LAMPS, MINE_VALVE, MINE_WALLS
} from "../../assets/js/minigames/mine-route/map-data.js";
import {
  collectNearbyEvidence, createChaseState, evidenceCount, updateChaseState
} from "../../assets/js/minigames/x-showdown-chase/core.js";
import {CHASE_EXIT} from "../../assets/js/minigames/x-showdown-chase/map-data.js";

test("Game 1 固定盘面初始未完成，完整管网接通后完成", () => {
  const initial = analyzeNetwork(createInitialBoard());
  assert.equal(initial.completed, false);
  const result = analyzeNetwork(createSolvedBoard());
  assert.equal(result.completed, true);
  assert.equal(result.activeTileCount, 16);
  assert.equal(result.connectedTileCount, 16);
  assert.equal(result.openEnds.length, 0);
  assert.deepEqual(result.terminals, {lamp: true, broadcast: true, drain: true});
});

test("Game 1 所有非空格每次严格旋转 90 度，空白格固定", () => {
  const board = createInitialBoard();
  for (const index of [2, 6, 12]) {
    const rotated = rotateTile(board, index);
    assert.equal(rotated[index].rotation, (board[index].rotation + 90) % 360);
  }
  assert.strictEqual(rotateTile(board, 0), board);
  assert.deepEqual(connectorsFor({type: "blank", rotation: 90}), []);
});

test("Game 1 rejects dangling connectors even when all terminals remain connected", () => {
  const board = createSolvedBoard();
  board[0] = {type: "straight", rotation: 90};
  const result = analyzeNetwork(board);
  assert.deepEqual(result.terminals, {lamp: true, broadcast: true, drain: true});
  assert.equal(result.completed, false);
  assert.equal(result.activeTileCount, 17);
  assert.equal(result.connectedTileCount, 16);
  assert.ok(result.openEnds.length > 0);
});

test("Game 1 reproduces the all-lit but unclosed server shown in the report", () => {
  for (const rotation of [90, 180, 270]) {
    const board = createSolvedBoard();
    board[12] = {...board[12], rotation};
    const result = analyzeNetwork(board);
    assert.deepEqual(result.terminals, {lamp: true, broadcast: true, drain: true});
    assert.equal(result.connectedTileCount, 16);
    assert.equal(result.activeTileCount, 16);
    assert.equal(result.openEnds.length, 2);
    assert.equal(result.completed, false);
  }
});

test("Game 1 recovers from the two isolated upper-left tiles in the second screenshot", () => {
  let board = createSolvedBoard();
  for (const [index, rotation] of [[7, 90], [10, 90], [11, 180], [12, 270]]) {
    board[index] = {...board[index], rotation};
  }
  const stuck = analyzeNetwork(board);
  assert.equal(stuck.connectedTileCount, 14);
  assert.deepEqual(stuck.openEnds.map(({index, direction}) => `${index}${direction}`), ["5S", "6E"]);
  assert.equal(stuck.completed, false);

  for (const [index, clicks] of [[7, 3], [10, 3], [11, 3], [12, 1]]) {
    for (let turn = 0; turn < clicks; turn += 1) board = rotateTile(board, index);
  }
  assert.equal(analyzeNetwork(board).completed, true);
});

test("Game 1 detects connectors aimed at the edge, a blank, or a mismatched neighbor", () => {
  const edge = createSolvedBoard();
  edge[2] = {...edge[2], rotation: 0};
  assert.ok(analyzeNetwork(edge).openEnds.some((entry) => entry.reason === "edge"));

  const blank = createSolvedBoard();
  blank[2] = {...blank[2], rotation: 270};
  assert.ok(analyzeNetwork(blank).openEnds.some((entry) => entry.reason === "blank"));

  const mismatch = createSolvedBoard();
  mismatch[6] = {...mismatch[6], rotation: 0};
  assert.ok(analyzeNetwork(mismatch).openEnds.some((entry) => entry.reason === "mismatch"));
});

test("Shared 2D 斜向输入归一化且 Camera 会限制在 World 内", () => {
  const direction = inputVector({up: true, right: true});
  assert.ok(Math.abs(Math.hypot(direction.x, direction.y) - 1) < 1e-12);
  assert.deepEqual(
    calculateCamera({x: 990, y: 790, w: 20, h: 20}, {width: 400, height: 300}, {width: 1000, height: 800}),
    {x: 600, y: 500}
  );
  assert.deepEqual(
    calculateCamera({x: 0, y: 0, w: 20, h: 20}, {width: 1200, height: 900}, {width: 1000, height: 800}),
    {x: 0, y: 0}
  );
});

test("Shared 2D 输入销毁后移除全部监听器", () => {
  const listeners = new Map();
  const target = {
    addEventListener(type, listener) { listeners.set(type, listener); },
    removeEventListener(type, listener) { if (listeners.get(type) === listener) listeners.delete(type); }
  };
  const input = createKeyboardInput({target});
  assert.deepEqual([...listeners.keys()].sort(), ["blur", "keydown", "keyup"]);
  input.destroy();
  assert.equal(listeners.size, 0);
});

test("Shared 2D loop 停止时取消 RAF 且 dt 限幅", () => {
  const frames = [];
  const cancelled = [];
  const deltas = [];
  let nextFrameId = 0;
  const loop = createGameLoop((dt) => deltas.push(dt), {
    requestFrame(callback) { frames.push(callback); nextFrameId += 1; return nextFrameId; },
    cancelFrame(id) { cancelled.push(id); },
    maxDelta: 0.05
  });
  loop.start();
  frames.shift()(100);
  frames.shift()(300);
  assert.deepEqual(deltas, [0, 0.05]);
  loop.stop();
  assert.equal(loop.isRunning(), false);
  assert.deepEqual(cancelled, [3]);
});

test("Game 2 阀门打开前门属于碰撞体，打开后才可在竖井结算", () => {
  let state = createMineState();
  assert.equal(mineWalls(state).at(-1), MINE_DOOR);
  state = {...state, player: {...MINE_VALVE}};
  state = interactMine(state);
  assert.equal(state.valveOpen, true);
  assert.equal(mineWalls(state).includes(MINE_DOOR), false);
  assert.equal(state.completed, false);
  state = interactMine({...state, player: {...MINE_EXIT}});
  assert.equal(state.completed, true);
});

test("Game 2 inspect points are repeatable and do not change progression", () => {
  const base = createMineState();
  for (const point of MINE_INSPECT_POINTS) {
    const player = {x: point.x - 19, y: point.y - 23, w: 38, h: 46};
    const state = {...base, player};
    const interaction = mineInteraction(state);
    assert.equal(interaction.type, "inspect");
    assert.equal(interaction.id, point.id);
    assert.equal(interaction.text, point.prompt);
    assert.equal(interaction.detail, point.text);
    assert.strictEqual(interactMine(state), state);
    assert.equal(mineInteraction(state).type, "inspect");
  }
});

test("Game 2 lamps activate independently and leave the interaction candidates", () => {
  const base = createMineState();
  assert.deepEqual(base.lamps, {"mine-lamp-a": false, "mine-lamp-b": false});
  for (const lamp of MINE_LAMPS) {
    const state = {...base, player: {x: lamp.x - 19, y: lamp.y - 23, w: 38, h: 46}};
    assert.equal(mineInteraction(state).type, "lamp");
    const lit = interactMine(state);
    assert.equal(lit.lamps[lamp.id], true);
    for (const other of MINE_LAMPS.filter((entry) => entry.id !== lamp.id)) {
      assert.equal(lit.lamps[other.id], false);
    }
    assert.notEqual(mineInteraction(lit)?.type, "lamp");
    assert.equal(lit.completed, false);
    assert.equal(lit.objective, base.objective);
  }
});

test("Game 2 optional points do not sit inside collision walls", () => {
  for (const point of [...MINE_INSPECT_POINTS, ...MINE_LAMPS]) {
    assert.equal(MINE_WALLS.some((wall) => (
      point.x > wall.x && point.x < wall.x + wall.w
      && point.y > wall.y && point.y < wall.y + wall.h
    )), false, `${point.id} overlaps a wall`);
  }
});

test("Game 3 每份证据只计数一次", () => {
  let state = createChaseState();
  state = {...state, player: {...state.evidence[0]}};
  state = collectNearbyEvidence(state);
  assert.equal(evidenceCount(state), 1);
  state = collectNearbyEvidence(state);
  assert.equal(evidenceCount(state), 1);
});

test("Game 3 碰撞扣一血并提供 1000ms 无敌时间", () => {
  const base = createChaseState();
  const colliding = {...base, enemy: {...base.player}};
  const first = updateChaseState(colliding, {}, 0, 100);
  assert.equal(first.hp, 2);
  assert.equal(first.invincibleUntil, 1100);
  const second = updateChaseState(first, {}, 0, 500);
  assert.equal(second.hp, 2);
  const third = updateChaseState(second, {}, 0, 1100);
  assert.equal(third.hp, 1);
});

test("Game 3 证据不足时出口不结算，3/3 后进入出口成功", () => {
  const base = createChaseState();
  const atExit = {...base, player: {...CHASE_EXIT}, enemy: {...base.enemy, x: 600, y: 100}};
  assert.equal(updateChaseState(atExit, {}, 0, 0).result, null);
  const complete = {
    ...atExit,
    evidence: atExit.evidence.map((item) => ({...item, collected: true}))
  };
  assert.equal(updateChaseState(complete, {}, 0, 0).result, "success");
});

test("Game 3 生命归零返回玩法 failure", () => {
  const base = createChaseState();
  const state = {...base, hp: 1, enemy: {...base.player}};
  assert.equal(updateChaseState(state, {}, 0, 2000).result, "failure");
});
