export const CHASE_WORLD = Object.freeze({width: 1600, height: 900});
export const CHASE_PLAYER_START = Object.freeze({x: 120, y: 420, w: 38, h: 46});
export const CHASE_ENEMY_START = Object.freeze({x: 610, y: 420, w: 42, h: 50});
export const CHASE_EXIT = Object.freeze({x: 1460, y: 360, w: 82, h: 150});

export const CHASE_WALLS = Object.freeze([
  {x: 0, y: 0, w: 1600, h: 48},
  {x: 0, y: 852, w: 1600, h: 48},
  {x: 0, y: 0, w: 48, h: 900},
  {x: 1552, y: 0, w: 48, h: 900},
  {x: 420, y: 160, w: 150, h: 220},
  {x: 420, y: 530, w: 150, h: 210},
  {x: 820, y: 120, w: 150, h: 220},
  {x: 820, y: 560, w: 150, h: 220},
  {x: 1180, y: 300, w: 145, h: 250}
]);

export const CHASE_EVIDENCE = Object.freeze([
  {id: "evidence-a", x: 250, y: 160, w: 42, h: 42, collected: false},
  {id: "evidence-b", x: 1050, y: 165, w: 42, h: 42, collected: false},
  {id: "evidence-c", x: 720, y: 735, w: 42, h: 42, collected: false}
]);
