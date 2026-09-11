import test from "node:test";
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";

const ROOT = new URL("../../", import.meta.url);
const FORMAL_VIEW_FILES = [
  "assets/js/core/game-page-controller.js",
  "assets/js/core/game-ui.js",
  "assets/js/core/navigation.js",
  "assets/js/exploration/game/exploration-view.js",
  "assets/js/exploration/game/inventory-view.js",
  "assets/js/minigames/map-puzzle/view/puzzle-view.js"
];

test("正式游戏页保留全部稳定反馈和内容挂载点", async () => {
  const html = await readFile(new URL("pages/game.html", ROOT), "utf8");
  for (const id of [
    "feedback",
    "game-scene",
    "exploration-actions",
    "game-story",
    "game-actions",
    "inventory-panel",
    "detail-root",
    "minigame-root"
  ]) {
    assert.match(html, new RegExp("id=[\\\"']" + id + "[\\\"']"), "缺少 #" + id);
  }
  assert.match(html, /id="feedback"[^>]+aria-live="polite"/);
});

test("正式视图不把原始异常或结果对象直接写入 DOM", async () => {
  for (const file of FORMAL_VIEW_FILES) {
    const source = await readFile(new URL(file, ROOT), "utf8");
    assert.doesNotMatch(
      source,
      /textContent[ \t]*=[ \t]*(?:error|result)[.](?:message|code)/,
      file + " 直接显示了内部返回字段"
    );
    assert.doesNotMatch(
      source,
      /textContent[ \t]*=[ \t]*JSON[.]stringify[(]/,
      file + " 直接显示了内部对象"
    );
  }
});

test("正式页面与独立演示入口保持分离", async () => {
  const html = await readFile(new URL("pages/game.html", ROOT), "utf8");
  assert.doesNotMatch(html, /exploration-demo|achievements-demo|demo=1/);
  assert.match(html, /game-page-controller[.]js/);
});
