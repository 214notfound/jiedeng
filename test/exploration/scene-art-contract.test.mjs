import test from "node:test";
import assert from "node:assert/strict";
import {existsSync} from "node:fs";
import {fileURLToPath} from "node:url";
import {EXPLORATION_TASKS} from "../../assets/js/exploration/data/exploration.js";
import {CONVERSATION_TASKS} from "../../assets/js/exploration/conversation/data/conversations.js";
import {
  sceneAssetFor,
  scenePresentationFor
} from "../../assets/js/exploration/data/scene-assets.js";
import {characterAssetFor} from "../../assets/js/exploration/data/character-assets.js";
import {ITEMS} from "../../assets/js/exploration/data/items.js";

function actionCoordinates(tasks) {
  return Object.fromEntries(tasks.flatMap((task) =>
    task.actions.map((action) => [action.id, [task.x ?? action.x, task.y ?? action.y]]))
  );
}

test("E1 三场景调查锚点与 1280×720 标记草图一致", () => {
  assert.deepEqual(actionCoordinates(EXPLORATION_TASKS), {
    "burned-work-id": [25, 75],
    "blue-glass-bead": [75, 75],
    "village-decline": [15, 30],
    "su-he-notice": [85, 30],
    "old-house-door": [50, 30],
    "old-photograph": [20, 40],
    "school-uniform": [28, 75],
    "height-marks": [80, 40],
    "funeral-list": [72, 75]
  });
});

test("E1 NPC 发光点击点与 1280×720 标记草图一致", () => {
  assert.deepEqual(actionCoordinates(CONVERSATION_TASKS), {
    "surface-briefing": [50, 40],
    "receive-key": [50, 40],
    "ask-memory-and-receive-key": [50, 40],
    "lamp-incident": [50, 40],
    "shopkeeper-inquiry": [22, 50],
    "holdout-inquiry": [78, 50],
    "elder-inquiry": [50, 38],
    "identity-conflict": [55, 55],
    "door-call": [50, 30]
  });
});

test("E1 村口百分比坐标与 1280×720 标记像素一致", () => {
  const villageCoordinates = {
    ...actionCoordinates(EXPLORATION_TASKS),
    ...actionCoordinates(CONVERSATION_TASKS)
  };
  const expectedPixels = {
    "village-decline": [192, 216],
    "su-he-notice": [1088, 216],
    "shopkeeper-inquiry": [282, 360],
    "holdout-inquiry": [998, 360],
    "elder-inquiry": [640, 274]
  };

  for (const [id, pixels] of Object.entries(expectedPixels)) {
    const [x, y] = villageCoordinates[id];
    assert.deepEqual([Math.round(x * 12.8), Math.round(y * 7.2)], pixels);
  }
});

test("E1 村口物体点与 NPC 点由剧情 Node 互斥，不会同时生成点击区", () => {
  const villageObjectNodes = new Set(
    EXPLORATION_TASKS
      .filter((task) => task.actions.some((action) =>
        ["village-decline", "su-he-notice"].includes(action.id)))
      .map((task) => task.node)
  );
  const villageNpcNodes = new Set(
    CONVERSATION_TASKS
      .filter((task) => task.actions.some((action) =>
        ["shopkeeper-inquiry", "holdout-inquiry", "elder-inquiry"].includes(action.id)))
      .map((task) => task.node)
  );

  assert.deepEqual([...villageObjectNodes], ["village-arrival"]);
  assert.deepEqual([...villageNpcNodes], ["village-inquiries"]);
  assert.equal([...villageObjectNodes].some((node) => villageNpcNodes.has(node)), false);
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

test("E1 正式场景按地点和老宅门状态选择同一坐标空间背景", () => {
  assert.match(sceneAssetFor("shrine"), /scenes\/shrine\.png$/);
  assert.match(sceneAssetFor("village"), /scenes\/village\.png$/);
  assert.match(sceneAssetFor("old-house"), /old-house-door-closed\.png$/);
  assert.match(
    sceneAssetFor("old-house", {variantId: "door-open"}),
    /old-house-door-open\.png$/
  );
  assert.deepEqual(
    scenePresentationFor("old-house", {facts: []}).variantId,
    "door-closed"
  );
  assert.deepEqual(
    scenePresentationFor("old-house", {facts: ["old-house-door-opened"]}).variantId,
    "door-open"
  );
  assert.equal(sceneAssetFor("unknown"), null);
});

test("E1 正式场景和已确认物品特写资源均可读取", () => {
  const urls = [
    sceneAssetFor("shrine"),
    sceneAssetFor("village"),
    sceneAssetFor("old-house"),
    sceneAssetFor("old-house", {variantId: "door-open"}),
    ...ITEMS
      .filter((item) => [
        "blue-glass-bead",
        "su-he-notice",
        "old-photograph",
        "school-uniform"
      ].includes(item.id))
      .map((item) => item.detailImage ?? item.image)
  ];

  for (const url of urls) assert.equal(existsSync(fileURLToPath(url)), true, url);
  for (const id of ["blue-glass-bead", "old-photograph", "school-uniform"]) {
    assert.match(ITEMS.find((item) => item.id === id).image, /\.svg$/);
    assert.match(ITEMS.find((item) => item.id === id).detailImage, /\.png$/);
  }
  assert.match(ITEMS.find((item) => item.id === "burned-work-id").image, /\.svg$/);
  assert.match(ITEMS.find((item) => item.id === "funeral-list").image, /\.svg$/);
});

test("E1 第一周 NPC 人物层使用独立素材且门外声音不显示人物", () => {
  const expected = {
    "companion-x": "companion-x.png",
    "villager-1": "villager-1.png",
    "villager-2": "villager-2.png",
    "villager-3": "villager-3.png"
  };

  for (const [npcId, filename] of Object.entries(expected)) {
    const asset = characterAssetFor(npcId);
    assert.ok(asset, npcId);
    assert.equal(existsSync(fileURLToPath(asset.src)), true, asset.src);
    assert.match(asset.src, new RegExp(`${filename}$`));
  }
  assert.equal(characterAssetFor("unknown-caller"), null);
});
