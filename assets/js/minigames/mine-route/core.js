import {moveEntity} from "../shared-2d/movement.js";
import {isNear} from "../shared-2d/interaction.js";
import {
  MINE_DOOR, MINE_EXIT, MINE_INSPECT_POINTS, MINE_LAMPS, MINE_PLAYER_START,
  MINE_VALVE, MINE_WALLS, MINE_WORLD
} from "./map-data.js";

export function createMineState() {
  return {
    player: {...MINE_PLAYER_START},
    valveOpen: false,
    doorDiscovered: false,
    completed: false,
    lamps: Object.fromEntries(MINE_LAMPS.map((lamp) => [lamp.id, false])),
    objective: "寻找进入矿井内部的道路"
  };
}

export function mineWalls(state) {
  return state.valveOpen ? [...MINE_WALLS] : [...MINE_WALLS, MINE_DOOR];
}

export function updateMineState(state, controls, dt) {
  if (state.completed) return state;
  const player = moveEntity(state.player, controls, 245, dt, mineWalls(state), MINE_WORLD);
  const doorDiscovered = state.doorDiscovered || (!state.valveOpen && isNear(player, MINE_DOOR, 145));
  return {
    ...state,
    player,
    doorDiscovered,
    objective: state.valveOpen
      ? "通道已经打开，继续深入"
      : doorDiscovered ? "寻找控制阀门，打开封闭通道" : state.objective
  };
}

export function mineInteraction(state) {
  if (!state.valveOpen && isNear(state.player, MINE_VALVE, 105)) {
    return {type: "valve", text: "[E] 操作排水控制阀"};
  }
  if (!state.valveOpen && isNear(state.player, MINE_DOOR, 125)) {
    return {type: "door", text: "通道已封闭"};
  }
  if (state.valveOpen && isNear(state.player, MINE_EXIT, 115)) {
    return {type: "exit", text: "[E] 进入内部竖井"};
  }
  for (const lamp of MINE_LAMPS) {
    if (!state.lamps[lamp.id] && isNear(state.player, lamp, lamp.radius)) {
      return {type: "lamp", id: lamp.id, text: "[E] 点亮旧矿灯"};
    }
  }
  for (const point of MINE_INSPECT_POINTS) {
    if (isNear(state.player, point, point.radius)) {
      return {type: "inspect", id: point.id, text: point.prompt, detail: point.text};
    }
  }
  return null;
}

export function interactMine(state) {
  const interaction = mineInteraction(state);
  if (interaction?.type === "valve") {
    return {...state, valveOpen: true, objective: "通道已经打开，继续深入"};
  }
  if (interaction?.type === "door") {
    return {...state, doorDiscovered: true, objective: "寻找控制阀门，打开封闭通道"};
  }
  if (interaction?.type === "exit" && state.valveOpen) {
    return {...state, completed: true};
  }
  if (interaction?.type === "lamp") {
    return {...state, lamps: {...state.lamps, [interaction.id]: true}};
  }
  return state;
}
