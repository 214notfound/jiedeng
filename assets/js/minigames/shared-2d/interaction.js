export function centerOf(entity) {
  return {x: entity.x + entity.w / 2, y: entity.y + entity.h / 2};
}

export function isNear(entity, target, radius) {
  const a = centerOf(entity);
  const b = target.w === undefined
    ? {x: target.x, y: target.y}
    : centerOf(target);
  return Math.hypot(a.x - b.x, a.y - b.y) <= radius;
}
