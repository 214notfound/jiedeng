import {moveWithCollisions} from "../shared-2d/collision.js";
import {centerOf} from "../shared-2d/interaction.js";

export function chasePlayer(enemy, player, speed, dt, walls, world) {
  const from = centerOf(enemy);
  const to = centerOf(player);
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const distance = Math.hypot(dx, dy) || 1;
  const moved = moveWithCollisions(
    enemy,
    dx / distance * speed * dt,
    dy / distance * speed * dt,
    walls
  );
  moved.x = Math.max(0, Math.min(world.width - moved.w, moved.x));
  moved.y = Math.max(0, Math.min(world.height - moved.h, moved.y));
  return moved;
}
