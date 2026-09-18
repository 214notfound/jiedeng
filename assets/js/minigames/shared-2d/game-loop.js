export function createGameLoop(update, options = {}) {
  const requestFrame = options.requestFrame ?? globalThis.requestAnimationFrame?.bind(globalThis);
  const cancelFrame = options.cancelFrame ?? globalThis.cancelAnimationFrame?.bind(globalThis);
  const maxDelta = options.maxDelta ?? 0.05;
  if (typeof update !== "function" || typeof requestFrame !== "function") {
    throw new TypeError("2D game loop requires update and requestAnimationFrame");
  }
  let frameId = null;
  let running = false;
  let previous = 0;

  function tick(timestamp) {
    if (!running) return;
    const dt = previous ? Math.min(maxDelta, Math.max(0, (timestamp - previous) / 1000)) : 0;
    previous = timestamp;
    update(dt, timestamp);
    if (running) frameId = requestFrame(tick);
  }

  function start() {
    if (running) return;
    running = true;
    previous = 0;
    frameId = requestFrame(tick);
  }

  function stop() {
    running = false;
    if (frameId !== null) cancelFrame?.(frameId);
    frameId = null;
    previous = 0;
  }

  return Object.freeze({start, stop, isRunning: () => running});
}
