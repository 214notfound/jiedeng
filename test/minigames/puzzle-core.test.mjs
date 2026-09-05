import test from "node:test";
import assert from "node:assert/strict";

import {
  createPuzzleLevel,
  createPuzzleSession,
  isPuzzleCompleted,
  shufflePieceIds,
  tryPlacePiece
} from "../../assets/js/minigames/map-puzzle/core/puzzle-core.js";

test("V1 3x3 关卡生成九个唯一拼块和槽位", () => {
  const level = createPuzzleLevel({ rows: 3, cols: 3 });
  assert.equal(level.pieceIds.length, 9);
  assert.equal(level.slotIds.length, 9);
  assert.equal(new Set(level.pieceIds).size, 9);
  assert.equal(new Set(level.slotIds).size, 9);
});

test("洗牌不修改输入数组", () => {
  const input = ["piece-1", "piece-2", "piece-3"];
  const before = [...input];
  const shuffled = shufflePieceIds(input, () => 0);
  assert.deepEqual(input, before);
  assert.notEqual(shuffled, input);
  assert.deepEqual([...shuffled].sort(), [...input].sort());
});

test("正确放置锁定，错误放置不锁定", () => {
  const level = createPuzzleLevel({ rows: 1, cols: 2 });
  const session = createPuzzleSession(level, { pieceOrder: level.pieceIds });
  assert.deepEqual(tryPlacePiece(session, "piece-1-1", "slot-1-2"), {
    ok: true, locked: false, completed: false
  });
  assert.deepEqual(tryPlacePiece(session, "piece-1-1", "slot-1-1"), {
    ok: true, locked: true, completed: false
  });
});

test("未知拼块、未知槽位和重复放置均被拒绝", () => {
  const level = createPuzzleLevel({ rows: 1, cols: 1 });
  const session = createPuzzleSession(level, { pieceOrder: level.pieceIds });
  assert.equal(tryPlacePiece(session, "missing", "slot-1-1").reason, "unknown-piece");
  assert.equal(tryPlacePiece(session, "piece-1-1", "missing").reason, "unknown-slot");
  assert.equal(tryPlacePiece(session, "piece-1-1", "slot-1-1").completed, true);
  assert.equal(tryPlacePiece(session, "piece-1-1", "slot-1-1").reason, "already-placed");
});

test("只有最后一块正确锁定后才完成", () => {
  const level = createPuzzleLevel({ rows: 1, cols: 2 });
  const session = createPuzzleSession(level, { pieceOrder: level.pieceIds });
  assert.equal(isPuzzleCompleted(session), false);
  assert.equal(tryPlacePiece(session, "piece-1-1", "slot-1-1").completed, false);
  assert.equal(tryPlacePiece(session, "piece-1-2", "slot-1-2").completed, true);
  assert.equal(isPuzzleCompleted(session), true);
});

test("自定义映射必须完整且槽位不能重复或未知", () => {
  assert.throws(
    () => createPuzzleLevel({ rows: 1, cols: 2, correctMap: { "piece-1-1": "slot-1-1" } }),
    /完整覆盖/
  );
  assert.throws(
    () => createPuzzleLevel({ rows: 1, cols: 2, correctMap: {
      "piece-1-1": "slot-1-1", "piece-1-2": "slot-1-1"
    } }),
    /重复槽位/
  );
  assert.throws(
    () => createPuzzleLevel({ rows: 1, cols: 2, correctMap: {
      "piece-1-1": "slot-1-1", "piece-1-2": "missing"
    } }),
    /未知或重复槽位/
  );
});

test("拼块顺序必须完整且不能重复或包含未知项", () => {
  const level = createPuzzleLevel({ rows: 1, cols: 2 });
  assert.throws(() => createPuzzleSession(level, { pieceOrder: ["piece-1-1"] }), /pieceOrder/);
  assert.throws(
    () => createPuzzleSession(level, { pieceOrder: ["piece-1-1", "piece-1-1"] }),
    /pieceOrder/
  );
  assert.throws(
    () => createPuzzleSession(level, { pieceOrder: ["piece-1-1", "missing"] }),
    /pieceOrder/
  );
});
