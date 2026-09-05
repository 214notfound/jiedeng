// R09 探索移动：维护玩家在灰度布局中的位置，并判断附近可交互热点。
const MOVEMENT_BY_KEY = Object.freeze({
  ArrowUp: { x: 0, y: -1 },
  w: { x: 0, y: -1 },
  W: { x: 0, y: -1 },
  ArrowDown: { x: 0, y: 1 },
  s: { x: 0, y: 1 },
  S: { x: 0, y: 1 },
  ArrowLeft: { x: -1, y: 0 },
  a: { x: -1, y: 0 },
  A: { x: -1, y: 0 },
  ArrowRight: { x: 1, y: 0 },
  d: { x: 1, y: 0 },
  D: { x: 1, y: 0 }
});

function clamp(value, minimum, maximum) {
  return Math.min(maximum, Math.max(minimum, value));
}

export function findNearestHotspotIndex(points, position, maximumDistance) {
  let nearestIndex = -1;
  let nearestDistance = Number.POSITIVE_INFINITY;

  points.forEach((point, index) => {
    const distance = Math.hypot(point.x - position.x, point.y - position.y);
    if (distance <= maximumDistance && distance < nearestDistance) {
      nearestDistance = distance;
      nearestIndex = index;
    }
  });

  return nearestIndex;
}

export function createExplorationMovement({ stage, hotspotContainer, viewpointMarker, statusElement }) {
  const positionsByScene = new Map();
  let currentSceneId = null;
  const step = 4;
  const interactionDistance = 12;

  function setStatus(message) {
    if (statusElement.textContent !== message) statusElement.textContent = message;
  }

  function getButtons() {
    return [...hotspotContainer.querySelectorAll(".scene-hotspot")];
  }

  function getCurrentPosition() {
    return positionsByScene.get(currentSceneId) ?? { x: 50, y: 88 };
  }

  function findNearbyButton() {
    const buttons = getButtons();
    const points = buttons.map((button) => ({
      x: Number(button.dataset.hotspotX),
      y: Number(button.dataset.hotspotY)
    }));
    const index = findNearestHotspotIndex(points, getCurrentPosition(), interactionDistance);
    return index >= 0 ? buttons[index] : null;
  }

  function renderPosition() {
    if (!currentSceneId) return;
    const position = getCurrentPosition();
    viewpointMarker.style.left = `${position.x}%`;
    viewpointMarker.style.top = `${position.y}%`;

    const nearbyButton = findNearbyButton();
    for (const button of getButtons()) {
      button.dataset.nearby = String(button === nearbyButton);
    }

    if (!nearbyButton) {
      setStatus("附近没有可调查目标。继续移动，或按 Tab 直接选择热点。");
      return;
    }
    const label = nearbyButton.querySelector(".scene-hotspot-label")?.textContent ?? "调查目标";
    setStatus(`附近：${label}。按 E 或 Enter 调查。`);
  }

  function syncScene(sceneId, startPosition = { x: 50, y: 88 }) {
    currentSceneId = sceneId;
    if (!positionsByScene.has(sceneId)) {
      positionsByScene.set(sceneId, {
        x: clamp(startPosition.x, 3, 97),
        y: clamp(startPosition.y, 3, 97)
      });
    }
    renderPosition();
  }

  function handleKeydown(event) {
    if (event.target !== stage) return;

    const movement = MOVEMENT_BY_KEY[event.key];
    if (movement) {
      event.preventDefault();
      const current = getCurrentPosition();
      positionsByScene.set(currentSceneId, {
        x: clamp(current.x + movement.x * step, 3, 97),
        y: clamp(current.y + movement.y * step, 3, 97)
      });
      renderPosition();
      return;
    }

    if (!["e", "E", "Enter"].includes(event.key)) return;
    const nearbyButton = findNearbyButton();
    if (!nearbyButton) return;
    event.preventDefault();
    nearbyButton.click();
  }

  stage.addEventListener("keydown", handleKeydown);
  stage.addEventListener("click", (event) => {
    if (event.target === stage || event.target === hotspotContainer) stage.focus();
  });

  return Object.freeze({ syncScene, getCurrentPosition });
}
