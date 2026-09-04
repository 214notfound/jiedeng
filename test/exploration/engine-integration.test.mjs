// 使用 story-line 原样引擎快照验收探索与成就；没有测试专用剧情转移表。
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import crypto from "node:crypto";
import { createEngineHost, DEMO_KEY } from "./fixtures/engine-host.js";
import { createExploration } from "../../assets/js/exploration/game/exploration.js";
import { createAchievements } from "../../assets/js/achievements/game/achievements.js";

const scripts = ["data/story-registry.js","data/prologue.js","data/village.js","data/old-house.js",
  "game/story-validator.js","game/story-runtime.js","game/story-request.js","game/story-engine.js"];

function engine() {
  const box = { window: {}, console: { info() {}, error() {} } };
  vm.createContext(box);
  for (const file of scripts) {
    const text = fs.readFileSync(new URL("./vendor/game-line/" + file, import.meta.url), "utf8");
    vm.runInContext(text, box, { filename: file });
  }
  return box.window.WhiteLamp.story.enterStory;
}
function setup(options = {}) {
  const host = createEngineHost({ enterStory: engine(), ...options });
  return { host, exploration: createExploration(host) };
}
function memoryStorage() {
  const rows = new Map();
  return { getItem: key => rows.get(key) ?? null, setItem: (key, value) => rows.set(key, value) };
}
async function click(module, id) {
  let result = await module.interact(module.getCurrentSceneId(), id);
  if (result.requiresConfirmation) result = await module.interact(module.getCurrentSceneId(), id, { confirm: true });
  assert.equal(result.ok, true, result.message);
}
async function belongings(host, module) {
  host.act("confirm-wake-context");
  await click(module, "surface-briefing");
  await click(module, "burned-work-id");
  await click(module, "blue-glass-bead");
}
async function village(host, module, optional = false) {
  await belongings(host, module);
  await click(module, optional ? "ask-memory-and-receive-key" : "receive-key");
  host.act("confirm-white-lamp");
  await click(module, "lamp-incident");
  host.act("leave-shrine");
  await click(module, "village-decline");
  await click(module, "su-he-notice");
}
function mapEvent(host, cancelled = false) {
  const command = host.getContext().commands.find(c => c.commandType === "REQUEST_MINIGAME");
  return { eventId: "map-" + (cancelled ? "cancel" : "complete"),
    eventType: cancelled ? "EXTERNAL_INTERACTION_CANCELLED" : "MAP_PUZZLE_COMPLETED",
    source: "minigame", causedByCommandId: command.commandId,
    resultFactIds: cancelled ? [] : ["map-puzzle-completed"],
    payload: cancelled ? { targetId: "map-puzzle" } : { puzzleId: "map-puzzle" } };
}

test("上游八个脚本逐字节匹配来源清单", () => {
  const manifest = JSON.parse(fs.readFileSync(new URL("./vendor/source.json", import.meta.url), "utf8"));
  assert.equal(manifest.files.length, 8);
  for (const item of manifest.files) {
    const file = item.source.replace("assets/js/", "./vendor/");
    const bytes = fs.readFileSync(new URL(file, import.meta.url));
    assert.equal(crypto.createHash("sha256").update(bytes).digest("hex"), item.sha256);
  }
});

const orders = [
  ["shopkeeper-inquiry","holdout-inquiry","elder-inquiry"],
  ["shopkeeper-inquiry","elder-inquiry","holdout-inquiry"],
  ["holdout-inquiry","shopkeeper-inquiry","elder-inquiry"],
  ["holdout-inquiry","elder-inquiry","shopkeeper-inquiry"],
  ["elder-inquiry","shopkeeper-inquiry","holdout-inquiry"],
  ["elder-inquiry","holdout-inquiry","shopkeeper-inquiry"]
];
for (const [index, order] of orders.entries()) {
  test("真实引擎全11节点与村民顺序 " + order.join("/"), async () => {
    const { host, exploration } = setup();
    await village(host, exploration, index % 2 === 0);
    assert.equal(host.getContext().commands.length, 3);
    for (const [i, action] of order.entries()) {
      await click(exploration, action);
      assert.equal(exploration.listItems().filter(item => item.id.startsWith("map-fragment")).length, i + 1);
    }
    const before = host.getContext().state;
    host.dispatchExternalEvent(mapEvent(host, true), { storageScope: "guest" });
    assert.deepEqual(host.getContext().state.facts, before.facts);
    host.dispatchExternalEvent(mapEvent(host), { storageScope: "guest" });
    assert.equal(host.getContext().state.storyCheckpoint.nodeId, "village-map-and-route");
    assert.equal(host.getContext().state.achievements.length, 1);
    host.act("go-old-house");
    await click(exploration, "old-house-door");
    for (const action of ["height-marks","funeral-list","school-uniform","old-photograph"]) await click(exploration, action);
    assert.equal(host.getContext().state.clues.length, 4);
    assert.equal(host.getContext().state.inventory.includes("height-marks"), false);
    await click(exploration, "identity-conflict");
    await click(exploration, "door-call");
    host.act("confirm-week-one-end");
    const state = host.getContext().state;
    assert.equal(state.ended, true);
    assert.equal(state.storyCheckpoint.completedNodeIds.length, 11);
    assert.deepEqual(state.storyCheckpoint.completedStageIds, ["prologue","village","old-house"]);
    assert.equal(host.getContext().commands.length, 0);
    assert.equal(createAchievements(host).listAchievements()[0].unlocked, true);
    exploration.dispose(); host.dispose();
  });
}

test("当前引擎的可选事实缺口：拒绝越权事实，正常保留追问对白和交钥匙", async () => {
  const { host, exploration } = setup();
  await belongings(host, exploration);
  const command = host.getContext().commands[0];
  const before = host.getContext();
  const unsupported = { eventId: "optional-raw", eventType: "NPC_TALK_PROGRESS", source: "conversation",
    causedByCommandId: command.commandId, resultFactIds: ["x-deflects-memory-question-noticed"],
    payload: { conversationId: "prologue-key-and-memory", npcId: "companion-x" } };
  assert.throws(() => host.dispatchExternalEvent(unsupported, { storageScope: "guest" }), /无权/);
  assert.deepEqual(host.getContext(), before);
  await assert.rejects(exploration.reportProgress(command.commandId, unsupported.resultFactIds), /尚未开放/);
  await click(exploration, "ask-memory-and-receive-key");
  assert.equal(host.getContext().state.inventory.includes("key-a"), true);
  assert.equal(host.getContext().state.facts.includes("x-deflects-memory-question-noticed"), false);
});

test("刷新使用真实resume，不重发钥匙；游客和两个账户的夹具存储域独立", async () => {
  const storage = memoryStorage();
  const first = setup({ storage, scope: "account:a" });
  await belongings(first.host, first.exploration);
  const before = first.host.getContext().commands;
  first.exploration.dispose(); first.host.dispose();
  const second = setup({ storage, scope: "account:a" });
  assert.deepEqual(second.host.getContext().commands, before);
  await click(second.exploration, "receive-key");
  second.host.dispose();
  const third = setup({ storage, scope: "account:a" });
  assert.equal(third.host.getContext().state.inventory.filter(id => id === "key-a").length, 1);
  for (const scope of ["guest", "account:b"]) {
    const other = setup({ storage, scope });
    assert.equal(other.host.getContext().state.inventory.includes("key-a"), false);
    assert.equal(other.host.getContext().state.storyCheckpoint.nodeId, "prologue-wake");
  }
});

test("存储失败不发布新快照，不提前显示对白已完成", async () => {
  const storage = memoryStorage();
  const { host, exploration } = setup({ storage });
  host.act("confirm-wake-context");
  let updates = 0;
  host.subscribe(() => updates++);
  const before = host.getContext();
  storage.setItem = () => { throw new Error("QuotaExceeded"); };
  await exploration.interact("shrine", "surface-briefing");
  const result = await exploration.interact("shrine", "surface-briefing", { confirm: true });
  assert.equal(result.ok, false);
  assert.deepEqual(host.getContext(), before);
  assert.equal(updates, 0);
});

test("同ID重放幂等、篡改重放拒绝、过期和错来源拒绝", () => {
  const { host } = setup();
  host.act("confirm-wake-context");
  const command = host.getContext().commands[0];
  const event = { eventId: "replayed", eventType: "NPC_TALKED", source: "conversation",
    causedByCommandId: command.commandId, resultFactIds: ["surface-investigation-task-known"],
    payload: { conversationId: "prologue-briefing", npcId: "companion-x" } };
  assert.throws(() => host.dispatchExternalEvent({ ...event, source: "exploration" }, { storageScope: "guest" }));
  host.dispatchExternalEvent(event, { storageScope: "guest" });
  const before = host.getContext();
  host.dispatchExternalEvent(event, { storageScope: "guest" });
  assert.deepEqual(host.getContext(), before);
  assert.throws(() => host.dispatchExternalEvent({ ...event, resultFactIds: [] }, { storageScope: "guest" }), /内容发生变化/);
  assert.throws(() => host.dispatchExternalEvent({ ...event, eventId: "late" }, { storageScope: "guest" }), /STALE/);
});

test("中途进展不能提前结束完整谈话", async () => {
  const { host, exploration } = setup();
  host.act("confirm-wake-context");
  const command = host.getContext().commands[0];
  await assert.rejects(exploration.reportProgress(command.commandId, ["surface-investigation-task-known"]), /不能作为中途进展/);
  assert.equal(host.getContext().state.storyCheckpoint.nodeId, "prologue-wake");
});

test("损坏存档不删除不覆盖，旧格式事件被真实引擎拒绝", () => {
  const storage = memoryStorage();
  storage.setItem(DEMO_KEY + ":guest", "{broken");
  assert.throws(() => setup({ storage }));
  assert.equal(storage.getItem(DEMO_KEY + ":guest"), "{broken");
  const enterStory = engine();
  const start = enterStory({ contractVersion: "1.0", requestId: "start", source: "game-shell",
    input: { type: "new-game" }, context: { facts: [], storyCheckpoint: null } });
  const rejected = enterStory({ contractVersion: "1.0", requestId: "old", source: "game-shell",
    input: { type: "external-event", event: { type: "OBJECT_INVESTIGATED", payload: { objectId: "old-key" } } },
    context: { facts: [], storyCheckpoint: start.commit.checkpoint } });
  assert.equal(rejected.error.errorCode, "STORY_INVALID_REQUEST");
});
