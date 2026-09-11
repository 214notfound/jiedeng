import test from "node:test";
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";

const gameHtmlUrl = new URL("../../pages/game.html", import.meta.url);
const gameCssUrl = new URL("../../assets/css/game.css", import.meta.url);

test("详情卡片只有一个可见关闭入口且使用无障碍名称", async () => {
  const html = await readFile(gameHtmlUrl, "utf8");
  const closeIds = html.match(/id="close-detail-button"/g) ?? [];

  assert.equal(closeIds.length, 1);
  assert.match(html, /class="detail-card"[^>]*>[\s\S]*id="close-detail-button"/);
  assert.match(html, /id="close-detail-button"[\s\S]*aria-label="关闭详情"[\s\S]*>×<\/button>/);
  assert.doesNotMatch(html, />\s*关闭详情\s*<\/button>/);
});

test("详情卡片限制视口高度并让长内容在卡片内滚动", async () => {
  const css = await readFile(gameCssUrl, "utf8");

  assert.match(css, /\.detail-root:not\(\[hidden\]\)\s*\{\s*display:\s*grid;/);
  assert.match(css, /\.detail-root\s*>\s*\.exploration-module\s*\{[\s\S]*overflow-y:\s*auto;/);
  assert.match(css, /\.detail-root\s*>\s*\.detail-card,[\s\S]*max-height:\s*min\(82dvh,\s*760px\)/);
  assert.match(css, /\.detail-card__close\s*\{[\s\S]*width:\s*44px;[\s\S]*height:\s*44px;/);
});

test("横版、方版和竖版详情图均保持原比例完整显示", async () => {
  const css = await readFile(gameCssUrl, "utf8");

  assert.match(css, /\.detail-root\s*>\s*\.exploration-module img\s*\{[\s\S]*width:\s*auto;[\s\S]*height:\s*auto;/);
  assert.match(css, /\.detail-root\s*>\s*\.exploration-module img\s*\{[\s\S]*max-width:\s*100%;/);
  assert.match(css, /\.detail-root\s*>\s*\.exploration-module img\s*\{[\s\S]*object-fit:\s*contain;/);
}
);
