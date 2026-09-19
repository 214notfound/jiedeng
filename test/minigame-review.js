import {createV3MinigameGateway, v3MinigameDefinitionFor} from "../assets/js/minigames/v3-handoff/v3-minigame-gateway.js";
import {createInitialBoard, createSolvedBoard, NETWORK_COLS} from "../assets/js/minigames/haunting-network/board-data.js";

const GAME_IDS = Object.freeze({
  network: "haunting-network-puzzle",
  mine: "mine-route-puzzle",
  chase: "x-showdown-chase"
});

const selected = new URLSearchParams(location.search).get("game");
const minigameId = GAME_IDS[selected];
const status = document.querySelector("#review-status");

if (minigameId) {
  const definition = v3MinigameDefinitionFor(minigameId);
  const host = document.querySelector("#review-game");
  const restart = document.querySelector("#review-restart");
  document.querySelector("#review-menu").hidden = true;
  host.hidden = false;
  restart.hidden = false;
  restart.href = `?game=${selected}`;
  document.querySelector(`[data-review-game="${selected}"]`).setAttribute("aria-current", "page");
  document.title = `${definition.title} · 独立验收`;

  const gateway = createV3MinigameGateway({
    container: host,
    onEvent: async (event) => {
      if (event.eventType === "MINIGAME_RESOLVED") {
        status.textContent = `验收结果：${event.resultFactIds.join("、")} · 未写入存档`;
      }
      return {ok: true};
    },
    onClose: () => { location.assign("./minigame-review.html"); }
  });
  gateway.start({
    commandType: "REQUEST_MINIGAME",
    commandId: `review-${selected}-${Date.now()}`,
    payload: {
      minigameId,
      gameStyle: definition.gameStyle,
      allowedResultFactIds: Object.keys(definition.results)
    }
  });
  if (selected === "network") {
    const targetBoard = createSolvedBoard();
    const hintButton = document.querySelector("#review-hint");
    const solveButton = document.querySelector("#review-solve");
    hintButton.hidden = false;
    solveButton.hidden = false;

    function tileAt(index) {
      return host.querySelector(`.mg-network__tile[data-index="${index}"]`);
    }

    function remainingClicks(index) {
      const transform = tileAt(index)?.querySelector(".mg-network__wire")?.style.transform ?? "";
      const match = /rotate\((\d+)deg\)/.exec(transform);
      if (!match) return 0;
      return ((targetBoard[index].solvedRotation - Number(match[1]) + 360) % 360) / 90;
    }

    hintButton.addEventListener("click", () => {
      if (!host.querySelector(".mg-entry-overlay[hidden]")) {
        status.textContent = "请先点击“开始接线”，再查看提示。";
        return;
      }
      host.querySelectorAll(".is-review-hint").forEach((tile) => tile.classList.remove("is-review-hint"));
      const index = targetBoard.findIndex((tile, at) => tile.type !== "blank" && remainingClicks(at) > 0);
      if (index < 0) {
        status.textContent = "线路已对齐，等待通关结果。";
        return;
      }
      tileAt(index).classList.add("is-review-hint");
      status.textContent = `提示：第 ${Math.floor(index / NETWORK_COLS) + 1} 行第 ${index % NETWORK_COLS + 1} 列，高亮方块再顺时针点 ${remainingClicks(index)} 次。`;
    });

    solveButton.addEventListener("click", () => {
      host.querySelector(".mg-entry-overlay:not([hidden]) .button--primary")?.click();
      for (const [index, tile] of targetBoard.entries()) {
        if (tile.type === "blank") continue;
        const clicks = remainingClicks(index);
        for (let turn = 0; turn < clicks; turn += 1) tileAt(index)?.click();
      }
    });

    const reviewParams = new URLSearchParams(location.search);
    if (reviewParams.get("fixture") === "upper-left") {
      const fixture = createSolvedBoard();
      for (const [index, rotation] of [[7, 90], [10, 90], [11, 180], [12, 270]]) {
        fixture[index].rotation = rotation;
      }
      host.querySelector(".mg-entry-overlay .button--primary").click();
      for (const [index, tile] of createInitialBoard().entries()) {
        if (tile.type === "blank") continue;
        const clicks = ((fixture[index].rotation - tile.rotation + 360) % 360) / 90;
        for (let turn = 0; turn < clicks; turn += 1) tileAt(index).click();
      }
      status.textContent = "已重现截图：左上两格未接入，当前有 2 处断口。";
      if (reviewParams.has("demo")) solveButton.click();
    }
  }
  addEventListener("pagehide", () => gateway.destroy(), {once: true});
} else if (selected) {
  status.textContent = "未知小游戏，请重新选择";
}
