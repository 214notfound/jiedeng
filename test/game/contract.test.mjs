// 团队接入契约自检：不调用真实账户、不操作浏览器存档。
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { createDemoHost } from "./fixtures/demo-host.js";
import { createExploration } from "../../assets/js/game/exploration.js";
import { getScenes, getItems, getSceneLayout } from "../../assets/js/data/exploration.js";
function setup() { const host = createDemoHost(); return { host, module: createExploration(host) }; }
function finish(module, sceneId) {
  for (const action of module.getSceneView(sceneId).interactions) assert.equal(module.interact(sceneId, action.id).ok, true, action.id);
}
test("团队所有内容 ID 使用 kebab-case；素材文件名与物品一致", () => {
  for (const item of getItems()) {
    assert.match(item.id, /^[a-z0-9]+(?:-[a-z0-9]+)*$/);
    assert.ok(existsSync(new URL(item.image)));
    assert.ok(item.image.endsWith("/" + item.id + ".svg"));
    assert.ok(item.name && item.description && item.source);
  }
  for (const scene of getScenes()) {
    assert.equal(scene.stageId, scene.id);
    for (const action of scene.interactions) assert.match(action.id, /^[a-z0-9]+(?:-[a-z0-9]+)*$/);
  }
  assert.deepEqual(getSceneLayout("village").hotspots.filter((item) => item.type === "character").map((item) => item.id),
    ["villager-1", "villager-2", "villager-3"]);
});
test("调查只提交标准事件；无状态写入，录音先查看后播放", () => {
  const host = createDemoHost(); const events = [];
  const module = createExploration({ ...host, dispatch(event) { events.push(event); return host.dispatch(event); } });
  assert.equal(module.interact("prologue", "prologue-play-warning-tape").ok, false);
  assert.equal(events.length, 0);
  assert.equal(module.interact("prologue", "prologue-take-key-a").ok, true);
  assert.deepEqual(events[0], { type: "OBJECT_INVESTIGATED", payload: { objectId: "prologue-take-key-a", itemId: "key-a" } });
  assert.equal(module.interact("prologue", "prologue-take-key-a").firstTime, false);
  assert.equal(events.length, 1);
  module.interact("prologue", "prologue-take-warning-tape");
  assert.equal(module.interact("prologue", "prologue-play-warning-tape").ok, true);
});
test("小X两次对白不重叠，村民奖励、地图和结束点顺序正确", () => {
  const { host, module } = setup();
  assert.equal(module.interact("village", "village-talk-majority").ok, false);
  assert.equal(module.interact("prologue", "prologue-talk-x-after-lamp").ok, false);
  finish(module, "prologue");
  for (const id of ["village-talk-confused-elder", "village-talk-majority", "village-talk-refuser"]) module.interact("village", id);
  assert.equal(module.canStartMapPuzzle(), true);
  assert.equal(host.dispatch({ type: "MAP_PUZZLE_COMPLETED", payload: { puzzleId: "map-puzzle" } }).ok, true);
  assert.equal(module.canStartMapPuzzle(), false);
  assert.equal(module.listAchievements()[0].id, "map-restorer");
  assert.equal(module.listAchievements()[0].unlocked, true);
  finish(module, "old-house");
  assert.equal(host.getContext().state.stage, "week-one-end");
  assert.equal(module.listItems("items").length, 6);
  assert.equal(module.listItems("clues").length, 5);
});
test("重建不重复奖励，身份切换后旧模块拒绝读写", () => {
  const { host, module } = setup();
  module.interact("prologue", "prologue-take-key-a");
  const restored = createExploration(host);
  assert.equal(restored.interact("prologue", "prologue-take-key-a").firstTime, false);
  const before = host.getContext().state;
  host.switchScope("account:another");
  assert.equal(module.interact("prologue", "prologue-check-wound").ok, false);
  assert.throws(() => module.listItems(), /身份/);
  assert.deepEqual(host.getContext().state, before);
});
test("拒绝宿主未落账、异常和异步返回，不显示虚假成功", () => {
  const host = createDemoHost();
  for (const dispatch of [() => ({ ok: true }), () => ({ ok: false, message: "拒绝" }), () => Promise.resolve({ ok: true }), () => { throw new Error("故障"); }]) {
    const module = createExploration({ ...host, dispatch });
    assert.equal(module.interact("prologue", "prologue-take-key-a").ok, false);
  }
});
test("保留其他模块字段与未知物品，不使用独立演示校验整个存档", () => {
  const host = createDemoHost();
  const module = createExploration({ ...host, getContext() {
    const context = host.getContext(); context.state.inventory.push("teammate-item");
    context.state.extraStory = { chapter: 4 }; return context;
  } });
  assert.deepEqual(module.listItems(), []);
});
test("订阅可清理，重复卸载安全，不留下监听", () => {
  const { host, module } = setup();
  let calls = 0;
  module.subscribe(() => calls++);
  assert.equal(host.listenerCount(), 1);
  module.dispose(); module.dispose();
  assert.equal(host.listenerCount(), 0);
  host.switchScope("account:new");
  assert.equal(calls, 0);
  assert.throws(() => module.subscribe(() => {}), /卸载/);
});
test("团队入口无存储、全局命名空间与公共文件依赖", () => {
  for (const file of ["exploration.js", "exploration-view.js"]) {
    const source = readFileSync(new URL("../../assets/js/game/" + file, import.meta.url), "utf8");
    assert.doesNotMatch(source, /localStorage|sessionStorage|window\.JieDeng|\.\.\/core\//);
  }
});
