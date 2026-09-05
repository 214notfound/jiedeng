import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

import { createMapPuzzleAdapter } from "../../assets/js/minigames/map-puzzle/adapter/map-puzzle-adapter.js";

const container = { appendChild() {} };
const onEvent = () => {};
const validCommand = {
  commandId: "cmd-village-map-and-route-map-puzzle",
  commandType: "REQUEST_MINIGAME",
  payload: {
    minigameId: "map-puzzle",
    successFactId: "map-puzzle-completed"
  }
};

function adapter() {
  return createMapPuzzleAdapter({ container, onEvent });
}

function eventHarness(createEventId) {
  const events = [];
  let callbacks;
  const instance = createMapPuzzleAdapter({
    container,
    onEvent: (event) => events.push(event),
    createEventId,
    mountView: (_container, options) => {
      callbacks = options;
      return { destroy() {} };
    }
  });
  instance.start(validCommand);
  return { instance, events, callbacks: () => callbacks };
}

test("创建时拒绝无效依赖", () => {
  assert.throws(() => createMapPuzzleAdapter({ container: null, onEvent }), /container/);
  assert.throws(() => createMapPuzzleAdapter({ container, onEvent: null }), /onEvent/);
  assert.throws(
    () => createMapPuzzleAdapter({ container, onEvent, createEventId: "invalid" }),
    /createEventId/
  );
});

test("拒绝缺失或错误的 V1 命令字段", () => {
  assert.throws(() => adapter().start(null), /命令缺失/);
  assert.throws(() => adapter().start({ ...validCommand, commandId: "" }), /commandId/);
  assert.throws(
    () => adapter().start({ ...validCommand, commandType: "REQUEST_EXPLORATION" }),
    /REQUEST_MINIGAME/
  );
  assert.throws(
    () => adapter().start({ ...validCommand, payload: { ...validCommand.payload, minigameId: "other" } }),
    /minigameId/
  );
  assert.throws(
    () => adapter().start({ ...validCommand, payload: { minigameId: "map-puzzle" } }),
    /successFactId/
  );
  assert.throws(
    () => adapter().start({ ...validCommand, payload: {
      ...validCommand.payload, successFactId: "other-fact"
    } }),
    /successFactId/
  );
});

test("成功事件严格符合 V1 外部事件格式", () => {
  const harness = eventHarness(() => "evt-success");
  for (const pieceId of harness.callbacks().level.pieceIds) {
    const slotId = harness.callbacks().level.correctMap[pieceId];
    harness.callbacks().onPlace(pieceId, slotId);
  }
  harness.callbacks().onSolved();
  assert.deepEqual(harness.events, [{
    eventId: "evt-success",
    eventType: "MAP_PUZZLE_COMPLETED",
    source: "minigame",
    causedByCommandId: validCommand.commandId,
    resultFactIds: ["map-puzzle-completed"],
    payload: { puzzleId: "map-puzzle" }
  }]);
  harness.callbacks().onSolved();
  assert.equal(harness.events.length, 1);
});

test("取消和失败事件不携带事实", () => {
  const cancelled = eventHarness(() => "evt-cancelled");
  cancelled.instance.cancel();
  assert.deepEqual(cancelled.events[0], {
    eventId: "evt-cancelled",
    eventType: "EXTERNAL_INTERACTION_CANCELLED",
    source: "minigame",
    causedByCommandId: validCommand.commandId,
    resultFactIds: [],
    payload: { targetId: "map-puzzle" }
  });

  const failed = eventHarness(() => "evt-failed");
  failed.instance.fail("PUZZLE_RENDER_FAILED");
  assert.deepEqual(failed.events[0], {
    eventId: "evt-failed",
    eventType: "EXTERNAL_INTERACTION_FAILED",
    source: "minigame",
    causedByCommandId: validCommand.commandId,
    resultFactIds: [],
    payload: { targetId: "map-puzzle", errorCode: "PUZZLE_RENDER_FAILED" }
  });
});

test("默认 eventId 在不同 Adapter 实例间保持唯一", () => {
  const first = eventHarness();
  const second = eventHarness();
  first.instance.cancel();
  second.instance.cancel();
  assert.notEqual(first.events[0].eventId, second.events[0].eventId);
});

test("正式实现不越过 Minigame V1 技术边界", () => {
  const source = [
    "../../assets/js/minigames/map-puzzle/adapter/map-puzzle-adapter.js",
    "../../assets/js/minigames/map-puzzle/core/puzzle-core.js",
    "../../assets/js/minigames/map-puzzle/view/puzzle-view.js"
  ].map((path) => fs.readFileSync(new URL(path, import.meta.url), "utf8")).join("\n");

  for (const forbidden of [
    /localStorage\s*[.\[]/,
    /sessionStorage\s*[.\[]/,
    /nextNodeId\s*=/,
    /currentNodeId\s*=/,
    /enterStory\s*\(/,
    /applyGameEvent\s*\(/,
    /ACHIEVEMENT_UNLOCKED/
  ]) {
    assert.doesNotMatch(source, forbidden);
  }
});
