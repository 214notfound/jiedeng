// 演示跨页面恢复测试；内存替身不访问真实浏览器数据。
import test from "node:test";
import assert from "node:assert/strict";
import { createDemoSession, DEMO_SESSION_KEY } from "./fixtures/demo-session.js";
import { createExploration } from "../../assets/js/game/exploration.js";
function storage() {
  const values = new Map([["teammate-data", "keep"]]);
  return { values, getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value) };
}
test("页面重建恢复调查与物品，重复调查不重复奖励", () => {
  const store = storage();
  const first = createDemoSession(store);
  const module = createExploration(first);
  assert.equal(module.interact("prologue", "prologue-take-key-a").ok, true);
  module.dispose(); first.dispose();
  const second = createDemoSession(store);
  const restored = createExploration(second);
  assert.equal(restored.listItems().length, 1);
  assert.equal(restored.interact("prologue", "prologue-take-key-a").firstTime, false);
  assert.equal(store.values.get("teammate-data"), "keep");
  assert.equal(store.values.size, 2);
});
test("损坏演示记录不会被默认进度覆盖", () => {
  const store = storage();
  store.values.set(DEMO_SESSION_KEY, "{broken");
  assert.throws(() => createDemoSession(store));
  assert.equal(store.values.get(DEMO_SESSION_KEY), "{broken");
});
test("存储读取失败可见，写入失败返回失败而非假成功", t => {
  t.mock.method(console, "error", () => {});
  assert.throws(() => createDemoSession({ getItem: () => { throw new Error("read denied"); } }), /read denied/);
  const store = storage();
  store.setItem = () => { throw new Error("quota"); };
  const module = createExploration(createDemoSession(store));
  assert.equal(module.interact("prologue", "prologue-take-key-a").ok, false);
  assert.equal(store.values.has(DEMO_SESSION_KEY), false);
});
test("移除演示宿主后不会再写入存储", () => {
  const store = storage();
  const host = createDemoSession(store);
  host.dispose(); host.dispose();
  host.dispatch({ type: "OBJECT_INVESTIGATED", payload: { objectId: "prologue-take-key-a", itemId: "key-a" } });
  assert.equal(store.values.has(DEMO_SESSION_KEY), false);
});
