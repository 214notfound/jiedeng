import test from "node:test";
import assert from "node:assert/strict";
import {EXPLORATION_TASKS} from "../../assets/js/exploration/data/exploration.js";
import {CONVERSATION_TASKS} from "../../assets/js/exploration/conversation/data/conversations.js";

function actionCoordinates(tasks) {
  return Object.fromEntries(tasks.flatMap((task) =>
    task.actions.map((action) => [action.id, [task.x ?? action.x, task.y ?? action.y]]))
  );
}

test("E1 三场景调查锚点与 1280×720 标记草图一致", () => {
  assert.deepEqual(actionCoordinates(EXPLORATION_TASKS), {
    "burned-work-id": [25, 75],
    "blue-glass-bead": [75, 75],
    "village-decline": [25, 50],
    "su-he-notice": [75, 65],
    "old-house-door": [50, 30],
    "old-photograph": [20, 40],
    "school-uniform": [28, 75],
    "height-marks": [80, 40],
    "funeral-list": [72, 75]
  });
});

test("E1 人物锚点与 1280×720 标记草图一致", () => {
  assert.deepEqual(actionCoordinates(CONVERSATION_TASKS), {
    "surface-briefing": [50, 40],
    "receive-key": [50, 40],
    "ask-memory-and-receive-key": [50, 40],
    "lamp-incident": [50, 40],
    "shopkeeper-inquiry": [20, 62],
    "holdout-inquiry": [80, 63],
    "elder-inquiry": [50, 38],
    "identity-conflict": [55, 55],
    "door-call": [50, 30]
  });
});

test("E1 热点显式声明最终布局所需的交互类型", () => {
  assert.ok(EXPLORATION_TASKS.length > 0);
  assert.ok(CONVERSATION_TASKS.length > 0);
  assert.ok(EXPLORATION_TASKS.every((task) => task.interactionType === "item"));
  assert.ok(CONVERSATION_TASKS.every((task) => task.interactionType === "conversation"));
});

test("E1 坐标保持百分比范围且老宅门与门外声音只复用视觉锚点", () => {
  for (const [id, coordinates] of Object.entries({
    ...actionCoordinates(EXPLORATION_TASKS),
    ...actionCoordinates(CONVERSATION_TASKS)
  })) {
    assert.ok(coordinates.every((value) => value >= 0 && value <= 100), `${id} 坐标超出百分比范围`);
  }

  const door = actionCoordinates(EXPLORATION_TASKS)["old-house-door"];
  const caller = actionCoordinates(CONVERSATION_TASKS)["door-call"];
  assert.deepEqual(caller, door);
  assert.notEqual(
    CONVERSATION_TASKS.find((task) => task.actions.some((action) => action.id === "door-call")).target,
    EXPLORATION_TASKS.find((task) => task.actions.some((action) => action.id === "old-house-door")).target
  );
});
