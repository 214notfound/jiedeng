import test from "node:test";
import assert from "node:assert/strict";
import {createInteractionModule} from "../../assets/js/exploration/integration/game/interaction-module.js";
import {createDemoHost} from "./fixtures/demo-host.js";

function completionFor(input, overrides = {}) {
  return {
    mode: input.mode,
    finalItemId: input.items.at(-1).id,
    metadata: input.metadata,
    ...overrides
  };
}

test("统一阅读器读完后只提交一次 NPC_TALKED 并推进开场节点", async () => {
  const host = createDemoHost();
  host.act("confirm-wake-context");
  const module = createInteractionModule(host);
  const input = module.getReadingInput("shrine", "surface-briefing");
  const before = host.getContext().state;
  assert.equal(before.facts.includes("surface-investigation-task-known"), false);

  const outcome = await module.completeReading(
    "shrine",
    "surface-briefing",
    completionFor(input)
  );

  assert.equal(outcome.ok, true, outcome.message);
  const after = host.getContext().state;
  assert.equal(after.facts.includes("surface-investigation-task-known"), true);
  assert.equal(after.storyCheckpoint.nodeId, "prologue-belongings");
  assert.equal(after.processedEventIds.length - before.processedEventIds.length, 1);
  module.dispose();
});

test("仅取得阅读输入或旧 confirm 都不能绕过真实读完", async () => {
  const host = createDemoHost();
  host.act("confirm-wake-context");
  const module = createInteractionModule(host);
  const before = host.getContext().state;
  module.getReadingInput("shrine", "surface-briefing");
  assert.deepEqual(host.getContext().state, before);
  const bypass = await module.interact("shrine", "surface-briefing", {confirm: true});
  assert.equal(bypass.ok, false);
  assert.match(bypass.message, /先阅读/);
  assert.deepEqual(host.getContext().state, before);
  module.dispose();
});

test("读完回调身份或末段不匹配时拒绝提交", async () => {
  const host = createDemoHost();
  host.act("confirm-wake-context");
  const module = createInteractionModule(host);
  const input = module.getReadingInput("shrine", "surface-briefing");
  const before = host.getContext().state;
  const invalid = await module.completeReading("shrine", "surface-briefing", completionFor(input, {
    metadata: {...input.metadata, commandId: "cmd-wrong"}
  }));
  assert.equal(invalid.ok, false);
  assert.match(invalid.message, /完成信息不一致/);
  assert.deepEqual(host.getContext().state, before);
  module.dispose();
});

test("Host 明确拒绝后可重新打开同一对话并提交成功", async () => {
  const host = createDemoHost();
  host.act("confirm-wake-context");
  let calls = 0;
  const proxy = {
    ...host,
    dispatchExternalEvent(event, meta) {
      calls += 1;
      if (calls === 1) return {ok: false, message: "对话提交失败，请重试。"};
      return host.dispatchExternalEvent(event, meta);
    }
  };
  const module = createInteractionModule(proxy);
  let input = module.getReadingInput("shrine", "surface-briefing");
  const before = host.getContext().state;
  const failed = await module.completeReading("shrine", "surface-briefing", completionFor(input));
  assert.equal(failed.ok, false);
  assert.deepEqual(host.getContext().state, before);

  input = module.getReadingInput("shrine", "surface-briefing");
  const retried = await module.completeReading("shrine", "surface-briefing", completionFor(input));
  assert.equal(retried.ok, true, retried.message);
  assert.equal(calls, 2);
  assert.equal(host.getContext().state.facts.includes("surface-investigation-task-known"), true);
  module.dispose();
});

test("快速连续完成只允许一个 Host 请求在途", async () => {
  const host = createDemoHost();
  host.act("confirm-wake-context");
  let calls = 0;
  let releaseFirst;
  const proxy = {
    ...host,
    dispatchExternalEvent(event, meta) {
      calls += 1;
      return new Promise((resolve) => {
        releaseFirst = () => resolve(host.dispatchExternalEvent(event, meta));
      });
    }
  };
  const module = createInteractionModule(proxy);
  const input = module.getReadingInput("shrine", "surface-briefing");
  const first = module.completeReading("shrine", "surface-briefing", completionFor(input));
  const second = await module.completeReading("shrine", "surface-briefing", completionFor(input));

  assert.equal(second.ok, false);
  assert.equal(calls, 1);
  releaseFirst();
  const completed = await first;
  assert.equal(completed.ok, true, completed.message);
  assert.equal(host.getContext().state.facts.includes("surface-investigation-task-known"), true);
  module.dispose();
});

test("NPC Choice 只选择路径，追问对白不额外记录记忆事实", async () => {
  const host = createDemoHost();
  host.act("confirm-wake-context");
  const module = createInteractionModule(host);

  let input = module.getReadingInput("shrine", "surface-briefing");
  await module.completeReading("shrine", "surface-briefing", completionFor(input));
  await module.interact("shrine", "burned-work-id");
  await module.interact("shrine", "blue-glass-bead");

  const beforeChoice = structuredClone(host.getContext().state);
  const choice = module.getReadingChoiceInput("shrine", [
    "receive-key",
    "ask-memory-and-receive-key"
  ]);
  assert.equal(choice.readingState, "choice");
  assert.deepEqual(choice.actions.map((action) => action.actionId), [
    "receive-key",
    "ask-memory-and-receive-key"
  ]);
  assert.deepEqual(host.getContext().state, beforeChoice);

  input = module.getReadingInput("shrine", "ask-memory-and-receive-key");
  assert.deepEqual(host.getContext().state, beforeChoice);
  const outcome = await module.completeReading(
    "shrine",
    "ask-memory-and-receive-key",
    completionFor(input)
  );
  assert.equal(outcome.ok, true, outcome.message);
  assert.equal(host.getContext().state.facts.includes("key-a-given-by-x"), true);
  assert.equal(host.getContext().state.facts.includes("x-deflects-memory-question-noticed"), false);
  module.dispose();
});
