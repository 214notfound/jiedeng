import {moveWithCollisions} from "./collision.js";

export function inputVector({up, down, left, right}) {
  const x = Number(Boolean(right)) - Number(Boolean(left));
  const y = Number(Boolean(down)) - Number(Boolean(up));
  const length = Math.hypot(x, y);
  return length > 0 ? {x: x / length, y: y / length} : {x: 0, y: 0};
}

export function moveEntity(entity, controls, speed, dt, walls, bounds) {
  const direction = inputVector(controls);
  const moved = moveWithCollisions(
    entity,
    direction.x * speed * dt,
    direction.y * speed * dt,
    walls
  );
  moved.x = Math.max(0, Math.min(bounds.width - moved.w, moved.x));
  moved.y = Math.max(0, Math.min(bounds.height - moved.h, moved.y));
  return moved;
}
