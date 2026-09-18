import {overlaps} from "../shared-2d/collision.js";
import {isNear} from "../shared-2d/interaction.js";
import {moveEntity} from "../shared-2d/movement.js";
import {chasePlayer} from "./enemy.js";
import {
  CHASE_ENEMY_START, CHASE_EVIDENCE, CHASE_EXIT, CHASE_PLAYER_START, CHASE_WALLS, CHASE_WORLD
} from "./map-data.js";

export function createChaseState() {
  return {
    player: {...CHASE_PLAYER_START},
    enemy: {...CHASE_ENEMY_START},
    evidence: CHASE_EVIDENCE.map((item) => ({...item})),
    hp: 3,
    invincibleUntil: 0,
    result: null
  };
}

export function evidenceCount(state) {
  return state.evidence.filter((item) => item.collected).length;
}

export function nearbyEvidence(state) {
  return state.evidence.find((item) => !item.collected && isNear(state.player, item, 88)) ?? null;
}

export function collectNearbyEvidence(state) {
  const target = nearbyEvidence(state);
  if (!target || state.result) return state;
  return {
    ...state,
    evidence: state.evidence.map((item) => item.id === target.id ? {...item, collected: true} : item)
  };
}

export function updateChaseState(state, controls, dt, now) {
  if (state.result) return state;
  const player = moveEntity(state.player, controls, 250, dt, CHASE_WALLS, CHASE_WORLD);
  const enemy = chasePlayer(state.enemy, player, 158, dt, CHASE_WALLS, CHASE_WORLD);
  let hp = state.hp;
  let invincibleUntil = state.invincibleUntil;
  if (overlaps(player, enemy) && now >= invincibleUntil) {
    hp -= 1;
    invincibleUntil = now + 1000;
  }
  const result = hp <= 0
    ? "failure"
    : evidenceCount(state) === 3 && overlaps(player, CHASE_EXIT) ? "success" : null;
  return {...state, player, enemy, hp, invincibleUntil, result};
}
