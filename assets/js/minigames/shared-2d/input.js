const CONTROL_CODES = new Set(["KeyW", "KeyA", "KeyS", "KeyD", "KeyE", "Escape"]);

export function createKeyboardInput({target = globalThis, onPause = () => {}} = {}) {
  const down = new Set();
  const pressed = new Set();
  let enabled = true;

  function clear() {
    down.clear();
    pressed.clear();
  }

  function keydown(event) {
    if (!enabled || !CONTROL_CODES.has(event.code)) return;
    event.preventDefault?.();
    if (event.code === "Escape") {
      if (!event.repeat) onPause();
      return;
    }
    if (!down.has(event.code)) pressed.add(event.code);
    down.add(event.code);
  }

  function keyup(event) {
    if (CONTROL_CODES.has(event.code)) down.delete(event.code);
  }

  target.addEventListener?.("keydown", keydown);
  target.addEventListener?.("keyup", keyup);
  target.addEventListener?.("blur", clear);

  return Object.freeze({
    movement: () => ({
      up: enabled && down.has("KeyW"), down: enabled && down.has("KeyS"),
      left: enabled && down.has("KeyA"), right: enabled && down.has("KeyD")
    }),
    consume(code) {
      if (!enabled || !pressed.has(code)) return false;
      pressed.delete(code);
      return true;
    },
    setEnabled(value) {
      enabled = Boolean(value);
      if (!enabled) clear();
    },
    clear,
    destroy() {
      clear();
      target.removeEventListener?.("keydown", keydown);
      target.removeEventListener?.("keyup", keyup);
      target.removeEventListener?.("blur", clear);
    }
  });
}
