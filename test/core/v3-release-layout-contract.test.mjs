import test from "node:test";
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";

const gameHtmlUrl = new URL("../../pages/game.html", import.meta.url);
const gameCssUrl = new URL("../../assets/css/game.css", import.meta.url);

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function declarationBlock(css, selector) {
  const match = css.match(new RegExp(`${escapeRegExp(selector)}\\s*\\{([^}]*)\\}`));
  assert.ok(match, `缺少 ${selector} 样式规则`);
  return match[1];
}

test("V3 正式游戏页以完整动态视口作为唯一外层尺寸", async () => {
  const css = await readFile(gameCssUrl, "utf8");
  const htmlRule = declarationBlock(css, "html");
  const bodyRule = declarationBlock(css, "body");
  const shellRule = declarationBlock(css, ".game-shell");
  const layoutRule = declarationBlock(css, ".game-layout");
  const mainRule = declarationBlock(css, ".game-main");

  assert.match(htmlRule, /height:\s*100%;/);
  assert.match(bodyRule, /min-height:\s*100vh;/);
  assert.match(bodyRule, /height:\s*100%;/);
  assert.match(bodyRule, /overflow:\s*hidden;/);

  assert.match(shellRule, /display:\s*flex;/);
  assert.match(shellRule, /flex-direction:\s*column;/);
  assert.match(shellRule, /width:\s*100%;/);
  assert.match(shellRule, /height:\s*100%;/);
  assert.match(shellRule, /min-height:\s*100dvh;/);
  assert.match(shellRule, /overflow:\s*hidden;/);

  assert.match(layoutRule, /flex:\s*1 1 0;/);
  assert.match(layoutRule, /width:\s*100%;/);
  assert.match(layoutRule, /max-width:\s*none;/);
  assert.match(layoutRule, /min-height:\s*0;/);
  assert.match(layoutRule, /margin:\s*0;/);
  assert.match(layoutRule, /overflow:\s*hidden;/);

  assert.match(mainRule, /width:\s*100%;/);
  assert.match(mainRule, /min-height:\s*0;/);
  assert.match(mainRule, /overflow:\s*hidden;/);
});

test("V3 正式游戏顶栏占满容器且不恢复旧版居中宽度限制", async () => {
  const [html, css] = await Promise.all([
    readFile(gameHtmlUrl, "utf8"),
    readFile(gameCssUrl, "utf8")
  ]);
  const headerRule = declarationBlock(css, ".game-header");

  assert.match(html, /<div class="game-shell">\s*<header class="game-header">/);
  assert.match(headerRule, /display:\s*flex;/);
  assert.match(headerRule, /align-items:\s*center;/);
  assert.match(headerRule, /width:\s*100%;/);
  assert.match(headerRule, /max-width:\s*none;/);
  assert.match(headerRule, /margin:\s*0 0 14px;/);
  assert.doesNotMatch(headerRule, /max-width:\s*1440px;/);
  assert.doesNotMatch(headerRule, /margin:\s*0 auto/);
});
