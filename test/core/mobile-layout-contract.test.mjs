import test from "node:test";
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";

const gameCssUrl = new URL("../../assets/css/game.css", import.meta.url);
const explorationCssUrl = new URL(
  "../../assets/css/exploration/exploration.css",
  import.meta.url
);

test("390px 阅读页占满动态视口且对话框填充场景下方剩余空间", async () => {
  const css = await readFile(gameCssUrl, "utf8");

  assert.match(css, /@media \(max-width: 520px\)/);
  assert.match(css, /\.game-shell\s*\{[\s\S]*?display:\s*flex;[\s\S]*?min-height:\s*100dvh;/);
  assert.match(css, /\.game-layout\s*\{[\s\S]*?flex:\s*1 0 auto;[\s\S]*?width:\s*100%;/);
  assert.match(
    css,
    /\.game-main\[data-view-state="reading"\]\s*\{[\s\S]*?grid-template-rows:\s*auto auto minmax\(190px, 1fr\);/
  );
  assert.match(
    css,
    /\.game-main\[data-view-state="reading"\] \.story-panel\s*\{[\s\S]*?align-self:\s*stretch;[\s\S]*?max-height:\s*none;/
  );
});

test("390px 人物层按通用左右位置底部锚定并随场景等比放大", async () => {
  const css = await readFile(gameCssUrl, "utf8");

  assert.match(
    css,
    /\.exploration-character-visual:not\(\[hidden\]\)\s*\{[\s\S]*?bottom:\s*0;[\s\S]*?width:\s*54%;[\s\S]*?height:\s*96%;[\s\S]*?object-position:\s*center bottom;/
  );
  assert.match(css, /data-placement="left"[\s\S]*?left:\s*2%;/);
  assert.match(css, /data-placement="right"[\s\S]*?right:\s*2%;/);
  assert.doesNotMatch(css, /companion-x|villager-[1-3]/);
});

test("U4 手机布局继续复用探索模块的 16:9 场景坐标空间", async () => {
  const css = await readFile(explorationCssUrl, "utf8");

  assert.match(css, /\.exploration-module \.exploration-stage\s*\{[\s\S]*?aspect-ratio:\s*16 \/ 9;/);
  assert.match(css, /\.exploration-scene-image\s*\{[\s\S]*?object-fit:\s*contain;/);
});
