export function overlaps(a, b) {
  return a.x < b.x + b.w
    && a.x + a.w > b.x
    && a.y < b.y + b.h
    && a.y + a.h > b.y;
}

export function moveWithCollisions(entity, dx, dy, walls) {
  const next = {...entity};
  next.x += dx;
  for (const wall of walls) {
    if (!overlaps(next, wall)) continue;
    next.x = dx > 0 ? wall.x - next.w : wall.x + wall.w;
  }
  next.y += dy;
  for (const wall of walls) {
    if (!overlaps(next, wall)) continue;
    next.y = dy > 0 ? wall.y - next.h : wall.y + wall.h;
  }
  return next;
}
