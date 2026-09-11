import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

const gameHtml = readFileSync(new URL("../../pages/game.html", import.meta.url), "utf8");
const gameCss = readFileSync(new URL("../../assets/css/game.css", import.meta.url), "utf8");
const gameUi = readFileSync(new URL("../../assets/js/core/game-ui.js", import.meta.url), "utf8");
const controller = readFileSync(
  new URL("../../assets/js/core/game-page-controller.js", import.meta.url),
  "utf8"
);

const REQUIRED_IDS = [
  "feedback",
  "return-menu-button",
  "open-inventory-button",
  "open-minigame-button",
  "save-button",
  "chapter-name",
  "game-scene",
  "exploration-actions",
  "game-story",
  "game-actions",
  "inventory-panel",
  "close-inventory-button",
  "detail-root",
  "close-detail-button",
  "minigame-root"
];

function countId(id) {
  return [...gameHtml.matchAll(new RegExp(`\\bid=["']${id}["']`, "g"))].length;
}

function openingTagFor(id) {
  return gameHtml.match(new RegExp(`<[^>]+\\bid=["']${id}["'][^>]*>`, "i"))?.[0] ?? "";
}

test("U1 正式页面的固定挂载点各存在且只存在一次", () => {
  for (const id of REQUIRED_IDS) {
    assert.equal(countId(id), 1, `#${id} 应且仅应存在一次`);
  }
  assert.match(gameCss, /\[hidden\]\s*\{\s*display:\s*none\s*!important;/);
  assert.match(gameCss, /\.is-view-locked\s*\{[^}]*pointer-events:\s*none;/s);
});

test("U1 覆盖层默认隐藏，小游戏只使用唯一空挂载点", () => {
  for (const id of ["inventory-panel", "detail-root", "minigame-root"]) {
    assert.match(openingTagFor(id), /\shidden(?:\s|>)/, `#${id} 必须默认隐藏`);
  }

  const minigameContent = gameHtml.match(
    /<section[^>]+id=["']minigame-root["'][^>]*>([\s\S]*?)<\/section>/i
  )?.[1];
  assert.equal(minigameContent?.trim(), "", "小游戏容器不得预置另一套页面");
  assert.match(controller, /createMapPuzzleAdapter\(\{[\s\S]*?container:\s*minigameRoot,/);
});

test("小游戏独占视口但保留 V2 规定的全局导航与反馈出口", () => {
  assert.match(
    gameCss,
    /\.minigame-root\s*\{[\s\S]*?inset:\s*0;[\s\S]*?overflow:\s*hidden;[\s\S]*?background:\s*#080b11;[\s\S]*?border:\s*0;/
  );
  assert.match(
    gameCss,
    /body:has\(\.game-main\[data-view-state="minigame"\]\)\s*\{[\s\S]*?overflow:\s*hidden;/
  );
  assert.match(
    gameCss,
    /\.game-shell:has\(\.game-main\[data-view-state="minigame"\]\) \.game-header\s*\{[\s\S]*?position:\s*fixed;[\s\S]*?z-index:\s*100;/
  );
  assert.match(
    gameCss,
    /\.game-shell:has\(\.game-main\[data-view-state="minigame"\]\) > \.feedback:not\(\[hidden\]\)\s*\{[\s\S]*?position:\s*fixed;[\s\S]*?z-index:\s*100;/
  );
  assert.doesNotMatch(
    gameCss,
    /data-view-state="minigame"[^}]*#(?:return-menu-button|save-button)/,
    "小游戏状态不得隐藏返回菜单或保存入口"
  );
  assert.match(
    controller,
    /mapAdapter\.start\(command\);[\s\S]*?minigameRoot\.querySelector\(FOCUSABLE_SELECTOR\);[\s\S]*?focus/
  );
});

test("U5 正式页面保留统一反馈区且不直接放置调试内容", () => {
  const feedbackTag = openingTagFor("feedback");
  assert.match(feedbackTag, /\srole=["']status["']/);
  assert.match(feedbackTag, /\saria-live=["']polite["']/);
  assert.match(feedbackTag, /\shidden(?:\s|>)/);

  assert.doesNotMatch(gameHtml, /(?:debug=1|联调按钮|流程日志|命令详情)/);
  const visibleText = gameHtml
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<!--([\s\S]*?)-->/g, "")
    .replace(/<[^>]+>/g, " ");
  assert.doesNotMatch(
    visibleText,
    /(?:\bNode\b|eventType|commandId|storyCheckpoint|pendingCommands|resultFactIds|[A-Z]{2,}_[A-Z0-9_]+)/
  );
  assert.doesNotMatch(gameUi, /\.innerHTML\s*=/, "阅读内容必须使用 textContent 渲染");
});
