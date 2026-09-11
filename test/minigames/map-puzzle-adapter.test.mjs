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

function eventHarness(createEventId, eventResult = {ok: true}) {
  const events = [];
  let callbacks;
  const instance = createMapPuzzleAdapter({
    container,
    onEvent: (event) => {
      events.push(event);
      return typeof eventResult === "function" ? eventResult(event) : eventResult;
    },
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

test("成功事件严格符合 V1 外部事件格式", async () => {
  const harness = eventHarness(() => "evt-success");
  for (const pieceId of harness.callbacks().level.pieceIds) {
    const slotId = harness.callbacks().level.correctMap[pieceId];
    harness.callbacks().onPlace(pieceId, slotId);
  }
  const result = await harness.callbacks().onSolved();
  assert.equal(result.ok, true);
  assert.deepEqual(harness.events, [{
    eventId: "evt-success",
    eventType: "MAP_PUZZLE_COMPLETED",
    source: "minigame",
    causedByCommandId: validCommand.commandId,
    resultFactIds: ["map-puzzle-completed"],
    payload: { puzzleId: "map-puzzle" }
  }]);
  await harness.callbacks().onSolved();
  assert.equal(harness.events.length, 1);
});

test("完成结果被协调器拒绝时不锁死适配器，可由页面退出后重新开始", async () => {
  let eventId = 0;
  const harness = eventHarness(() => `evt-rejected-${++eventId}`, {ok: false});
  for (const pieceId of harness.callbacks().level.pieceIds) {
    harness.callbacks().onPlace(pieceId, harness.callbacks().level.correctMap[pieceId]);
  }

  const rejected = await harness.callbacks().onSolved();
  assert.equal(rejected.ok, false);
  await harness.callbacks().onSolved();
  assert.equal(harness.events.length, 2, "拒绝后不得把本局误标记为已提交");
  assert.notEqual(harness.events[0].eventId, harness.events[1].eventId);
});

test("退出后重新打开会创建全新拼图局，不恢复中间摆放进度", () => {
  const harness = eventHarness(() => "evt-cancel-and-reopen");
  const firstView = harness.callbacks();
  const firstPieceId = firstView.level.pieceIds[0];
  const firstSlotId = firstView.level.correctMap[firstPieceId];
  assert.equal(firstView.onPlace(firstPieceId, firstSlotId).locked, true);

  harness.instance.cancel();
  harness.instance.start(validCommand);
  const reopenedView = harness.callbacks();
  assert.deepEqual(reopenedView.lockedPairs, []);
  assert.equal(
    reopenedView.onPlace(firstPieceId, firstSlotId).locked,
    true,
    "同一拼块应能在新局中重新放置"
  );
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
