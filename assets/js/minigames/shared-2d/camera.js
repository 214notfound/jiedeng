export function calculateCamera(player, viewport, world) {
  const maxX = Math.max(0, world.width - viewport.width);
  const maxY = Math.max(0, world.height - viewport.height);
  return {
    x: Math.max(0, Math.min(maxX, player.x + player.w / 2 - viewport.width / 2)),
    y: Math.max(0, Math.min(maxY, player.y + player.h / 2 - viewport.height / 2))
  };
}

export function worldToScreen(entity, camera) {
  return {x: entity.x - camera.x, y: entity.y - camera.y};
}
