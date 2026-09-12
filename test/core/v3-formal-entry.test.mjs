import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

const gameHtml = readFileSync(new URL("../../pages/game.html", import.meta.url), "utf8");

test("V3 正式剧情扩展按依赖顺序加载", () => {
  const scripts = [
    "data/story-registry.js",
    "data/prologue.js",
    "data/village.js",
    "data/old-house.js",
    "data/v3/registry-extension.js",
    "data/v3/outer-investigation.js",
    "data/v3/identity-reconstruction.js",
    "data/v3/mine-return.js",
    "data/v3/finale.js",
    "game/story-validator.js",
    "game/story-runtime.js",
    "game/story-request.js",
    "game/story-engine.js"
  ];
  let previousIndex = -1;
  for (const script of scripts) {
    const index = gameHtml.indexOf(`assets/js/game-line/${script}`);
    assert.notEqual(index, -1, `缺少正式剧情脚本：${script}`);
    assert.ok(index > previousIndex, `剧情脚本加载顺序错误：${script}`);
    previousIndex = index;
  }
});
