import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {
  createV3MinigameEvent,
  validateV3MinigameCommand,
  v3MinigameDefinitionFor
} from "../../assets/js/minigames/v3-handoff/v3-minigame-gateway.js";

const COMMANDS = [
  ["haunting-network-puzzle", "puzzle", ["haunting-is-engineered"]],
  ["mine-route-puzzle", "puzzle", ["sealed-mine-bypassed"]],
  ["x-showdown-chase", "chase", ["x-showdown-survived", "x-showdown-lost"]]
];

function command(minigameId, gameStyle, allowedResultFactIds) {
  return {
    commandId: `cmd-node-${minigameId}`,
    commandType: "REQUEST_MINIGAME",
    payload: {minigameId, gameStyle, allowedResultFactIds}
  };
}

test("V3 三个小游戏均只登记入口、出口和允许结果", () => {
  for (const [id, style, facts] of COMMANDS) {
    const definition = v3MinigameDefinitionFor(id);
    assert.equal(definition.gameStyle, style);
    assert.deepEqual(Object.keys(definition.results), facts);
    assert.doesNotThrow(() => validateV3MinigameCommand(command(id, style, facts)));
  }
});

test("V3 小游戏结果使用稳定 MINIGAME_RESOLVED 事件且不指定下一 Node", () => {
  const input = command("x-showdown-chase", "chase", [
    "x-showdown-survived",
    "x-showdown-lost"
  ]);
  assert.deepEqual(createV3MinigameEvent(input, "x-showdown-survived"), {
    eventId: "evt-cmd-node-x-showdown-chase-x-showdown-survived-minigame_resolved",
    eventType: "MINIGAME_RESOLVED",
    source: "minigame",
    causedByCommandId: "cmd-node-x-showdown-chase",
    resultFactIds: ["x-showdown-survived"],
    payload: {minigameId: "x-showdown-chase"}
  });
});

test("V3 小游戏拒绝风格、结果集合或结果值越权", () => {
  assert.throws(
    () => validateV3MinigameCommand(command("mine-route-puzzle", "chase", ["sealed-mine-bypassed"])),
    /类型/
  );
  assert.throws(
    () => validateV3MinigameCommand(command("x-showdown-chase", "chase", ["x-showdown-survived"])),
    /结果/
  );
  assert.throws(
    () => createV3MinigameEvent(
      command("mine-route-puzzle", "puzzle", ["sealed-mine-bypassed"]),
      "x-showdown-lost"
    ),
    /允许范围/
  );
});

test("正式 game.html 加载 V3 小游戏样式且控制器使用真实入口", () => {
  const html = readFileSync(new URL("../../pages/game.html", import.meta.url), "utf8");
  const css = readFileSync(
    new URL("../../assets/css/minigames/v3-handoff.css", import.meta.url),
    "utf8"
  );
  const controller = readFileSync(
    new URL("../../assets/js/core/game-page-controller.js", import.meta.url),
    "utf8"
  );
  assert.match(html, /assets\/css\/minigames\/v3-handoff\.css/);
  assert.match(css, /\.v3-minigame\s*\{[\s\S]*?overflow:\s*auto/);
  assert.match(css, /@media \(max-width: 560px\)[\s\S]*?min-height:\s*44px/);
  assert.match(controller, /createV3MinigameGateway/);
  assert.doesNotMatch(controller, /等待对应玩法模块加载/);
});
