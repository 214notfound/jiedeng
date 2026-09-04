// 成就模块独立性与身份边界回归。
import test from "node:test";
import assert from "node:assert/strict";
import { createAchievements } from "../../assets/js/game/achievements.js";
function setup() {
  let context = { storageScope: "guest", state: { achievements: [], puzzle: { mapRestored: false } } };
  const listeners = new Set();
  const host = { getContext: () => context, subscribe: fn => { listeners.add(fn); return () => listeners.delete(fn); } };
  return { host, listeners, set: next => { context = next; for (const fn of listeners) fn(); } };
}
test("成就服务仅用只读投影，不需要探索阶段或 dispatch", () => {
  const { host } = setup();
  const service = createAchievements(host);
  assert.equal(service.listAchievements()[0].unlocked, false);
  assert.deepEqual(Object.keys(service).sort(), ["dispose", "listAchievements", "subscribe"]);
  service.dispose();
});
test("成就服务可恢复解锁与时间，保留其他模块成就", () => {
  const { host, set } = setup();
  set({ storageScope: "guest", state: { achievements: ["map-restorer", "other"], puzzle: { mapRestored: true },
    achievementTimes: { "map-restorer": "2026-09-04T00:00:00.000Z" } } });
  const item = createAchievements(host).listAchievements()[0];
  assert.equal(item.unlocked, true);
  assert.equal(item.unlockedAt, "2026-09-04T00:00:00.000Z");
});
test("成就服务拒绝地图与解锁记录矛盾", () => {
  const { host, set } = setup();
  set({ storageScope: "guest", state: { achievements: ["map-restorer"], puzzle: { mapRestored: false } } });
  assert.throws(() => createAchievements(host), /不一致/);
});
test("成就身份变更会通知清理，切回原身份也不能复用旧实例", t => {
  t.mock.method(console, "error", () => {});
  const { host, set, listeners } = setup();
  const service = createAchievements(host);
  let calls = 0;
  service.subscribe(() => calls++);
  const state = { achievements: [], puzzle: { mapRestored: false } };
  set({ storageScope: "account:another", state });
  set({ storageScope: "guest", state });
  assert.equal(calls, 2);
  assert.throws(() => service.listAchievements(), /身份/);
  service.dispose(); service.dispose();
  assert.equal(listeners.size, 0);
});
