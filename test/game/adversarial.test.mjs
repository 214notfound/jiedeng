// 探索接口对抗性回归测试：伪造状态、提交重入、身份切换和订阅异常。
import test from "node:test";
import assert from "node:assert/strict";
import { createExploration } from "../../assets/js/game/exploration.js";
import { createDemoHost } from "./fixtures/demo-host.js";

function withState(mutator) {
  const host = createDemoHost();
  return { ...host, getContext() {
    const context = host.getContext();
    mutator(context.state);
    return context;
  } };
}
test("伪造老宅阶段不能跳过祠堂和地图", () => {
  assert.throws(() => createExploration(withState((state) => { state.stage = "old-house"; })), /祠堂|地图/);
});
test("直接塞入成就、完整地图或线索不能绕过来源校验", () => {
  for (const mutate of [
    (state) => state.achievements.push("map-restorer"),
    (state) => state.inventory.push("restored-village-map"),
    (state) => state.inventory.push("key-a"),
    (state) => { state.puzzle.mapRestored = true; }
  ]) assert.throws(() => createExploration(withState(mutate)), /来源|状态|记录/);
});
test("伪造已播放录音但未查看录音带的记录被拒绝", () => {
  assert.throws(() => createExploration(withState((state) => {
    state.investigated.push("prologue-play-warning-tape");
  })), /前置条件/);
});
test("重复ID和非字符串ID被拒绝", () => {
  for (const value of [["external-item", "external-item"], [null], [{}]]) {
    assert.throws(() => createExploration(withState((state) => { state.inventory = value; })), /ID/);
  }
});
test("状态提交同步重入只允许一个事件", () => {
  const host = createDemoHost();
  let count = 0;
  let nested;
  const module = createExploration({ ...host, dispatch(event, metadata) {
    count++;
    assert.deepEqual(metadata, { storageScope: "guest" });
    nested = module.interact("prologue", "prologue-take-key-a");
    return host.dispatch(event);
  } });
  assert.equal(module.interact("prologue", "prologue-take-key-a").ok, true);
  assert.equal(nested.ok, false);
  assert.equal(count, 1);
});
test("异步失败不产生未处理拒绝，并暂停后续写入", async (t) => {
  const errors = [];
  t.mock.method(console, "error", (...args) => errors.push(args));
  const host = createDemoHost();
  let calls = 0;
  const module = createExploration({ ...host, dispatch() {
    calls++;
    return Promise.reject(new Error("网络故障"));
  } });
  assert.equal(module.interact("prologue", "prologue-take-key-a").ok, false);
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(module.interact("prologue", "prologue-check-wound").ok, false);
  assert.equal(calls, 1);
  assert.ok(errors.length >= 2);
});
test("宿主成功但未落账时暂停操作，禁止盲目重试", (t) => {
  t.mock.method(console, "error", () => {});
  const host = createDemoHost();
  let calls = 0;
  const module = createExploration({ ...host, dispatch() { calls++; return { ok: true }; } });
  assert.equal(module.interact("prologue", "prologue-take-key-a").ok, false);
  assert.equal(module.interact("prologue", "prologue-check-wound").ok, false);
  assert.equal(calls, 1);
});
test("切换身份后再切回也不能复用旧模块实例", () => {
  const host = createDemoHost();
  const module = createExploration(host);
  module.subscribe(() => {});
  host.switchScope("account:b");
  host.switchScope("guest");
  assert.throws(() => module.listItems(), /身份/);
  module.dispose();
});
test("渲染订阅异常不阻止已提交事件与其他订阅", (t) => {
  const errors = [];
  t.mock.method(console, "error", (...args) => errors.push(args));
  const host = createDemoHost();
  const module = createExploration(host);
  let calls = 0;
  module.subscribe(() => { throw new Error("渲染失败"); });
  module.subscribe(() => calls++);
  assert.equal(module.interact("prologue", "prologue-take-key-a").ok, true);
  assert.equal(calls, 1);
  assert.equal(errors.length, 1);
});
test("单个取消订阅失败不阻止其余清理", (t) => {
  t.mock.method(console, "error", () => {});
  const host = createDemoHost();
  let cleared = 0;
  const module = createExploration({ ...host, subscribe() {
    return () => { cleared++; if (cleared === 1) throw new Error("取消失败"); };
  } });
  module.subscribe(() => {});
  module.subscribe(() => {});
  module.dispose();
  module.dispose();
  assert.equal(cleared, 2);
});
test("离开提示列出当前缺项，不能只给笼统提示", () => {
  const module = createExploration(createDemoHost());
  const result = module.getExitStatus("prologue");
  assert.equal(result.canLeave, false);
  assert.match(result.message, /钥匙/);
  assert.match(result.message, /工作证/);
  assert.doesNotMatch(result.message, /断电/);
});
test("持久化宿主恢复后的查询结果一致，模块不另建存档", () => {
  const host = createDemoHost("account:a");
  const module = createExploration(host);
  module.interact("prologue", "prologue-take-key-a");
  const serialized = JSON.stringify(host.getContext());
  const restored = createExploration({
    getContext: () => JSON.parse(serialized),
    dispatch: () => ({ ok: false, message: "只读恢复检查" }),
    subscribe: () => () => {}
  });
  assert.deepEqual(restored.listItems(), module.listItems());
  assert.equal(restored.interact("prologue", "prologue-take-key-a").firstTime, false);
});

test("取消函数抛错后订阅也不再调用", (t) => {
  t.mock.method(console, "error", () => {});
  const host = createDemoHost();
  let notify;
  let calls = 0;
  const module = createExploration({ ...host, subscribe(listener) {
    notify = listener;
    return () => { throw new Error("取消失败"); };
  } });
  const stop = module.subscribe(() => calls++);
  stop();
  notify();
  assert.equal(calls, 0);
});

test("会话读取失败仍通知视图清空，并锁定旧实例", (t) => {
  t.mock.method(console, "error", () => {});
  const host = createDemoHost();
  let broken = false;
  let calls = 0;
  const module = createExploration({ ...host, getContext() {
    if (broken) throw new Error("会话丢失");
    return host.getContext();
  } });
  module.subscribe(() => calls++);
  broken = true;
  host.switchScope("guest");
  assert.equal(calls, 1);
  broken = false;
  assert.throws(() => module.listItems(), /身份/);
});
