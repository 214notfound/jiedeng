export function element(tag, className, text) {
  const node = document.createElement(tag);
  node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

export function ensureStylesheet(url, id) {
  if (document.querySelector(`link[data-minigame-style="${id}"]`)) return;
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = url;
  link.dataset.minigameStyle = id;
  document.head.append(link);
}

export function createEntryBriefingOverlay(root, {
  title,
  objective,
  controls,
  restriction,
  startLabel = "开始游戏",
  onStart,
  onExit
}) {
  const overlay = element("div", "mg-entry-overlay");
  overlay.setAttribute("role", "dialog");
  overlay.setAttribute("aria-modal", "true");
  const card = element("div", "mg-entry-overlay__card");
  card.append(
    element("h2", "mg-entry-overlay__title", title),
    element("p", "mg-entry-overlay__objective", objective),
    element("p", "mg-entry-overlay__controls", controls),
    element("p", "mg-entry-overlay__restriction", restriction)
  );
  const start = element("button", "button button--primary", startLabel);
  start.type = "button";
  const exit = element("button", "button", "退出，稍后再来");
  exit.type = "button";
  start.addEventListener("click", onStart, {once: true});
  exit.addEventListener("click", onExit);
  card.append(start, exit);
  overlay.append(card);
  root.append(overlay);
  start.focus();
  return Object.freeze({
    hide() { overlay.hidden = true; },
    destroy() {
      exit.removeEventListener("click", onExit);
      overlay.remove();
    }
  });
}

export function createPauseOverlay(root, {onResume, onExit}) {
  const overlay = element("div", "mg2d-pause");
  overlay.hidden = true;
  const card = element("div", "mg2d-pause__card");
  card.append(element("h2", "mg2d-pause__title", "游戏暂停"));
  const resume = element("button", "button button--primary", "继续游戏");
  resume.type = "button";
  resume.addEventListener("click", onResume);
  const exit = element("button", "button", "退出，稍后再来");
  exit.type = "button";
  exit.addEventListener("click", onExit);
  card.append(resume, exit);
  overlay.append(card);
  root.append(overlay);
  return Object.freeze({
    show() { overlay.hidden = false; resume.focus(); },
    hide() { overlay.hidden = true; },
    destroy() {
      resume.removeEventListener("click", onResume);
      exit.removeEventListener("click", onExit);
      overlay.remove();
    }
  });
}
