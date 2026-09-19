import {analyzeNetwork, rotateTile} from "./core.js";
import {createInitialBoard, NETWORK_COLS, NETWORK_ROWS} from "./board-data.js";
import {createEntryBriefingOverlay, element, ensureStylesheet} from "../shared-2d/ui-base.js";

const LABELS = Object.freeze({lamp: "白灯控制器", broadcast: "广播控制器", drain: "排水控制器"});
const ICONS = Object.freeze({
  server: "../assets/images/minigames/game1/icon_main_control.png",
  lamp: "../assets/images/minigames/game1/icon_white_lamp.png",
  broadcast: "../assets/images/minigames/game1/icon_broadcast.png",
  drain: "../assets/images/minigames/game1/icon_drain.png"
});

function icon(src, alt) {
  const image = element("img", "mg-network__icon");
  image.src = src;
  image.alt = alt;
  image.setAttribute("aria-hidden", "true");
  return image;
}

export function mountHauntingNetwork(container, {onResult, onCancel, onTechnicalError = () => {}}) {
  void onTechnicalError;
  ensureStylesheet("../assets/js/minigames/haunting-network/styles.css", "haunting-network");
  let board = createInitialBoard();
  let finished = false;
  let started = false;

  const root = element("section", "mg-network");
  const header = element("header", "mg-network__header");
  const exit = element("button", "button", "退出，稍后再来");
  exit.type = "button";
  exit.addEventListener("click", onCancel);
  const heading = element("div", "mg-network__heading");
  heading.append(
    element("h1", "mg-network__title", "拆解控制室网络"),
    element("p", "mg-network__objective", "恢复完整控制网络")
  );
  header.append(heading, exit);

  const layout = element("div", "mg-network__layout");
  const boardRoot = element("div", "mg-network__board");
  boardRoot.style.setProperty("--network-cols", String(NETWORK_COLS));
  const statusPanel = element("aside", "mg-network__devices");
  statusPanel.append(element("h2", "mg-network__devices-title", "装置状态"));
  const deviceRows = new Map();
  for (const id of ["lamp", "broadcast", "drain"]) {
    const row = element("div", "mg-network__device");
    row.append(element("span", "mg-network__device-name", LABELS[id]));
    const value = element("strong", "mg-network__device-state", "OFFLINE");
    row.append(value);
    statusPanel.append(row);
    deviceRows.set(id, value);
  }
  statusPanel.append(element("p", "mg-network__help", "旋转线路，使所有管线接入同一网络。"));
  layout.append(boardRoot, statusPanel);
  const message = element("p", "mg-network__message", "所有线路都必须连入中央主控，且不能留下断头。")
  message.setAttribute("role", "status");
  root.append(header, layout, message);
  container.append(root);

  function render() {
    const state = analyzeNetwork(board, NETWORK_ROWS, NETWORK_COLS);
    boardRoot.replaceChildren();
    board.forEach((tile, index) => {
      const cell = element("button", `mg-network__tile mg-network__tile--${tile.type}`);
      cell.type = "button";
      cell.dataset.index = String(index);
      cell.disabled = !started || finished || tile.type === "blank";
      cell.classList.toggle("is-connected", tile.type !== "blank" && state.connected.has(index));
      const wire = element("span", `mg-network__wire mg-network__wire--${tile.type}`);
      wire.style.transform = `rotate(${tile.rotation}deg)`;
      cell.append(wire);
      if (tile.type === "server") {
        cell.append(icon(ICONS.server, "中央主控"), element("span", "mg-network__tile-label", "主控"));
      }
      if (tile.type === "terminal") {
        cell.append(icon(ICONS[tile.terminalId], LABELS[tile.terminalId]),
          element("span", "mg-network__tile-label", LABELS[tile.terminalId].slice(0, 2)));
      }
      const row = Math.floor(index / NETWORK_COLS) + 1;
      const col = index % NETWORK_COLS + 1;
      const tileLabel = tile.type === "terminal" ? LABELS[tile.terminalId]
        : tile.type === "server" ? "中央主控"
          : tile.type === "blank" ? "空白" : "线路";
      cell.setAttribute("aria-label", `${row} 行 ${col} 列 ${tileLabel}`);
      boardRoot.append(cell);
    });
    for (const [id, value] of deviceRows) {
      const connected = state.terminals[id] === true;
      value.textContent = connected ? "CONNECTED" : "OFFLINE";
      value.classList.toggle("is-connected", connected);
    }
    if (!state.completed) {
      message.textContent = `已接入 ${state.connectedTileCount}/${state.activeTileCount} 个节点，未闭合接口 ${state.openEnds.length} 处。`;
    }
    if (state.completed && !finished) {
      finished = true;
      message.textContent = "网络还原完成：三套装置来自同一人工控制系统。正在保存结果……";
      boardRoot.querySelectorAll("button").forEach((button) => { button.disabled = true; });
      Promise.resolve(onResult("success")).catch(() => {});
    }
  }

  function handleClick(event) {
    const cell = event.target.closest("[data-index]");
    if (!cell || finished) return;
    board = rotateTile(board, Number(cell.dataset.index));
    render();
  }
  boardRoot.addEventListener("click", handleClick);
  const entryOverlay = createEntryBriefingOverlay(root, {
    title: "拆解控制室网络",
    objective: "恢复完整控制网络。",
    controls: "操作：点击线路方块，每次顺时针旋转 90°。",
    restriction: "旋转线路，使所有管线接入同一网络。任何断头都会阻止完成。",
    startLabel: "开始接线",
    onStart() {
      started = true;
      entryOverlay.hide();
      render();
      boardRoot.querySelector("button:not(:disabled)")?.focus();
    },
    onExit: onCancel
  });
  render();

  return Object.freeze({
    destroy() {
      boardRoot.removeEventListener("click", handleClick);
      exit.removeEventListener("click", onCancel);
      entryOverlay.destroy();
      root.remove();
    }
  });
}
