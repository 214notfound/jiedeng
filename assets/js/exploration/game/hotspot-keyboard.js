// 场景热点的方向键导航；Enter 与空格仍使用原生 button 行为。
const DIRECTION_BY_KEY = Object.freeze({
  ArrowUp: { x: 0, y: -1 },
  ArrowDown: { x: 0, y: 1 },
  ArrowLeft: { x: -1, y: 0 },
  ArrowRight: { x: 1, y: 0 }
});

export function findDirectionalHotspotIndex(points, currentIndex, key) {
  const direction = DIRECTION_BY_KEY[key];
  const current = points[currentIndex];
  if (!direction || !current) return -1;

  let bestIndex = -1;
  let bestScore = Number.POSITIVE_INFINITY;

  points.forEach((point, index) => {
    if (index === currentIndex) return;
    const offsetX = point.x - current.x;
    const offsetY = point.y - current.y;
    const forwardDistance = offsetX * direction.x + offsetY * direction.y;
    if (forwardDistance <= 0) return;

    const sideDistance = Math.abs(offsetX * direction.y - offsetY * direction.x);
    const score = forwardDistance + sideDistance * 2;
    if (score < bestScore) {
      bestScore = score;
      bestIndex = index;
    }
  });

  return bestIndex;
}

export function moveHotspotFocus(event, container) {
  if (!DIRECTION_BY_KEY[event.key]) return false;

  const buttons = [...container.querySelectorAll(".scene-hotspot")];
  const currentIndex = buttons.indexOf(event.target);
  const points = buttons.map((button) => ({
    x: Number(button.dataset.hotspotX),
    y: Number(button.dataset.hotspotY)
  }));
  const nextIndex = findDirectionalHotspotIndex(points, currentIndex, event.key);
  if (nextIndex < 0) return false;

  event.preventDefault();
  buttons[nextIndex].focus();
  return true;
}
