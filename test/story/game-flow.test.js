// 本文件在 Node 内存环境中回归验证游戏流程的事务提交与副作用顺序。
"use strict";

const assert = require("node:assert/strict");
const { test } = require("node:test");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const projectRoot = path.resolve(__dirname, "../..");
console.log(`[game-flow-test] mode=node-real-story projectRoot=${projectRoot}`);

const storyScripts = [
  "assets/js/game-line/data/story-registry.js",
  "assets/js/game-line/data/prologue.js",
  "assets/js/game-line/data/village.js",
  "assets/js/game-line/data/old-house.js",
  "assets/js/game-line/game/story-validator.js",
  "assets/js/game-line/game/story-runtime.js",
  "assets/js/game-line/game/story-request.js",
  "assets/js/game-line/game/story-engine.js"
];

function createContext() {
  const context = { console };
  context.window = context;
  vm.createContext(context);
  for (const relativePath of storyScripts) {
    vm.runInContext(
      fs.readFileSync(path.join(projectRoot, relativePath), "utf8"),
      context,
      { filename: relativePath }
    );
  }
  return context;
}

// 只转换本项目使用的 named ESM 导入，保持生产模块和真实剧情引擎参与测试。
function loadCoreModule(context, relativePath, cache = new Map()) {
  if (cache.has(relativePath)) return cache.get(relativePath);
  const absolutePath = path.join(projectRoot, relativePath);
  const source = fs.readFileSync(absolutePath, "utf8");
  const exported = [];
  for (const match of source.matchAll(/export\s+(?:const|function|class|let|var)\s+([A-Za-z_$][\w$]*)/g)) {
    exported.push(match[1]);
  }
  for (const match of source.matchAll(/export\s*\{([^}]+)\}/g)) {
    for (const name of match[1].split(",").map((item) => item.trim()).filter(Boolean)) {
      exported.push(name.split(/\s+as\s+/)[0].trim());
    }
  }
  const module = {};
  cache.set(relativePath, module);
  let transformed = source.replace(
    /import\s*\{([\s\S]*?)\}\s*from\s*["']([^"']+)["']\s*;?/g,
    (_full, names, specifier) => {
      const dependency = path.posix.normalize(
        path.posix.join(path.posix.dirname(relativePath.replaceAll("\\", "/")), specifier)
      );
      return `const {${names}} = __import(${JSON.stringify(dependency)});`;
    }
  );
  transformed = transformed.replace(/export\s+(?=(?:const|function|class|let|var)\s)/g, "");
  transformed = transformed.replace(/export\s*\{[^}]+\}\s*;?/g, "");
  transformed = `(function(){\n${transformed}\nreturn {${[...new Set(exported)].join(",")}};\n})()`;
  context.__import = (dependency) => loadCoreModule(context, dependency, cache);
  Object.assign(module, vm.runInContext(transformed, context, { filename: relativePath }));
  return module;
}

function createHarness(options = {}) {
  const context = createContext();
  const flowModule = loadCoreModule(context, "assets/js/core/game-flow.js");
  const log = [];
  const errors = [];
  let commands = [];
  const observations = [];
  const flow = flowModule.createGameFlow({
    storageScope: "guest",
    story: context.WhiteLamp.story,
    onCommandsChange: (value) => { commands = value; log.push("commands"); },
    onStateChange: (state) => {
      log.push("state");
      observations.push({ state, commands });
    },
    onPresentation: options.onPresentation,
    notificationHandlers: {
      STORY_NODE_ENTERED: () => log.push("notification")
    },
    onError: (error) => errors.push(error)
  });
  return { flow, log, errors, observations };
}

function talked(eventId, conversationId = "prologue-briefing") {
  return {
    eventId,
    eventType: "NPC_TALKED",
    source: "conversation",
    causedByCommandId: "cmd-prologue-wake-prologue-briefing",
    resultFactIds: ["surface-investigation-task-known"],
    payload: { conversationId, npcId: "companion-x" }
  };
}

async function start(harness) {
  const result = await harness.flow.startNewGame();
  assert.equal(result.ok, true);
  const wake = await harness.flow.handleStoryAction("confirm-wake-context");
  assert.equal(wake.ok, true);
  return result;
}

test("非法 conversationId 不产生状态或通知变化，随后同 ID 可修正成功并去重", async () => {
  const harness = createHarness();
  await start(harness);
  const before = harness.flow.getStateSnapshot();
  const logLength = harness.log.length;
  const rejected = await harness.flow.handleExternalEvent(talked("evt-same", "wrong-conversation"));
  assert.equal(rejected.ok, false);
  assert.deepEqual(harness.flow.getStateSnapshot(), before);
  assert.equal(harness.log.length, logLength);

  const accepted = await harness.flow.handleExternalEvent(talked("evt-same"));
  assert.equal(accepted.ok, true);
  assert.equal(accepted.state.processedExternalEventIds.includes("evt-same"), true);
  const after = harness.flow.getStateSnapshot();
  const duplicate = await harness.flow.handleExternalEvent(talked("evt-same"));
  assert.equal(duplicate.duplicate, true);
  assert.deepEqual(harness.flow.getStateSnapshot(), after);
});

test("命令发布先于状态通知", async () => {
  const harness = createHarness();
  await start(harness);
  harness.log.length = 0;
  harness.observations.length = 0;
  const result = await harness.flow.handleExternalEvent(talked("evt-order"));
  assert.equal(result.ok, true);
  assert.deepEqual(harness.log.slice(0, 2), ["commands", "state"]);
  assert.equal(harness.observations.length, 1, "只发布一次完整交易，不发布候选状态");
  const { state, commands } = harness.observations[0];
  assert.equal(state, result.state);
  assert.equal(JSON.stringify(commands.map(c => c.commandId)),
    JSON.stringify(state.storyCheckpoint.pendingCommands.map(c => c.commandId)));
  assert.ok(commands.every(c => c.payload), "订阅者必须同时获得完整命令载荷");
});

test("合法探索与对话事件结算剧情奖励", async () => {
  const harness = createHarness();
  await start(harness);
  await harness.flow.handleExternalEvent(talked("evt-briefing"));
  const state = harness.flow.getState();
  const exploreCommand = state.storyCheckpoint.pendingCommands.find(
    (command) => command.commandType === "REQUEST_EXPLORATION"
  );
  assert.ok(exploreCommand);
  const burnedWorkId = await harness.flow.handleExternalEvent({
    eventId: "evt-burned-work-id",
    eventType: "OBJECT_INVESTIGATED",
    source: "exploration",
    causedByCommandId: exploreCommand.commandId,
    resultFactIds: ["burned-work-id-investigated"],
    payload: { objectId: "burned-work-id" }
  });
  assert.equal(burnedWorkId.ok, true);
  const blueGlassBead = await harness.flow.handleExternalEvent({
    eventId: "evt-blue-glass-bead",
    eventType: "OBJECT_INVESTIGATED",
    source: "exploration",
    causedByCommandId: exploreCommand.commandId,
    resultFactIds: ["blue-glass-bead-investigated"],
    payload: { objectId: "blue-glass-bead" }
  });
  assert.equal(blueGlassBead.ok, true);
  const conversationCommand = harness.flow.getState().storyCheckpoint.pendingCommands.find(
    (command) => command.commandType === "REQUEST_CONVERSATION"
  );
  assert.ok(conversationCommand);
  const received = await harness.flow.handleExternalEvent({
    eventId: "evt-key",
    eventType: "NPC_TALKED",
    source: "conversation",
    causedByCommandId: conversationCommand.commandId,
    resultFactIds: ["key-a-given-by-x"],
    payload: { conversationId: "prologue-key-and-memory", npcId: "companion-x" }
  });
  assert.equal(received.ok, true);
  assert.equal(harness.flow.getState().inventory.includes("key-a"), true);
});

test("调查对象不能冒领同一命令下其他对象的事实", async () => {
  const harness = createHarness();
  await start(harness);
  await harness.flow.handleExternalEvent(talked("evt-briefing-for-mismatch"));
  const before = harness.flow.getState();
  const exploreCommand = before.storyCheckpoint.pendingCommands.find(
    (command) => command.commandType === "REQUEST_EXPLORATION"
  );

  const result = await harness.flow.handleExternalEvent({
    eventId: "evt-mismatched-object-fact",
    eventType: "OBJECT_INVESTIGATED",
    source: "exploration",
    causedByCommandId: exploreCommand.commandId,
    resultFactIds: ["blue-glass-bead-investigated"],
    payload: {objectId: "burned-work-id"}
  });

  assert.equal(result.ok, false);
  assert.equal(harness.flow.getState(), before, "失败事件不能污染已提交状态");
  assert.equal(before.facts.includes("blue-glass-bead-investigated"), false);
  assert.equal(before.investigated.includes("burned-work-id"), false);
});

test("提交后 presentation 抛错不回滚，返回副作用警告", async () => {
  const harness = createHarness({ onPresentation: () => { throw new Error("render failed"); } });
  const result = await harness.flow.startNewGame();
  assert.equal(result.ok, true);
  assert.equal(result.warning.errorCode, "FLOW_EFFECT_FAILED");
  assert.ok(harness.errors.some((error) => error.errorCode === "FLOW_EFFECT_FAILED"));
  assert.equal(harness.flow.getState().storyCheckpoint.nodeId, "prologue-wake");
});

// 仅替代浏览器视图与交互设备；游戏页控制器、剧情、状态和成就规则均运行生产代码。
for (const entry of ["formal", "debug"]) {
  test(`${entry} 地图入口统一结算成就，再发布展示，重复事件不重复解锁`, async () => {
    const context = createContext();
    const cache = new Map();
    let controls, response, mapEvents;
    const rendered = [];
    const mapStarts = [];
    const systemPrompts = [];
    const elements = new Map();
    context.URLSearchParams = URLSearchParams;
    context.location = { pathname: "/pages/game.html", search: "?mode=new&debug=1" };
    context.addEventListener = () => {};
    const storyPanel = {
      hidden: false,
      classList: { toggle() {} },
      toggleAttribute() {},
      querySelector() { return null; },
      focus() {}
    };
    context.document = {
      body: { dataset: { page: "game" } },
      activeElement: { focus() {} },
      addEventListener() {},
      removeEventListener() {},
      getElementById(id) {
        if (!elements.has(id)) {
          const listeners = new Map();
          elements.set(id, {
            hidden: false,
            disabled: false,
            textContent: id === "open-minigame-button" ? "地图" : "",
            dataset: {},
            classList: { toggle() {} },
            toggleAttribute() {},
            addEventListener(type, listener) { listeners.set(type, listener); },
            removeEventListener(type, listener) {
              if (listeners.get(type) === listener) listeners.delete(type);
            },
            click() { return listeners.get("click")?.({}); },
            replaceChildren() {},
            querySelector() { return null; },
            closest(selector) { return id === "game-story" && selector === ".story-panel" ? storyPanel : null; },
            focus() {}
          });
        }
        return elements.get(id);
      }
    };
    cache.set("assets/js/core/navigation.js", {
      getCurrentUser: async () => ({ storageScope: "guest" }),
      goToMenu() {}
    });
    cache.set("assets/js/core/game-ui.js", {
      createGameView(options) {
        controls = options;
        return {
          renderState: (state) => rendered.push(JSON.parse(JSON.stringify(state))),
          renderResponse: (value) => { response = value; },
          openSystemPrompt: (presentation, callbacks) => {
            systemPrompts.push({presentation, callbacks});
          },
          recordNotification() {}
        };
      }
    });
    cache.set("assets/js/exploration/integration/game/interaction-module.js", {
      createInteractionModule: () => ({ dispose() {} })
    });
    cache.set("assets/js/exploration/game/exploration-view.js", { mountExploration: () => () => {} });
    cache.set("assets/js/minigames/map-puzzle/adapter/map-puzzle-adapter.js", {
      createMapPuzzleAdapter(options) {
        mapEvents = options;
        return { destroy() {}, start(command) { mapStarts.push(command); } };
      }
    });
    loadCoreModule(context, "assets/js/core/game-page-controller.js", cache);
    await new Promise(setImmediate);
    assert.ok(response, "正式游戏页控制器必须完成初始化");

    if (entry === "formal") {
      const action = response.presentation.actions[0];
      await controls.onStoryAction(action.actionId);
      const command = response.commands[0];
      const beforeFailure = JSON.stringify(context.WhiteLamp.game.getState());
      assert.equal(context.WhiteLamp.gamePage.failNextExternalEvent().ok, true);
      const failed = await controls.onDebugCommand(command);
      assert.equal(failed.ok, false);
      assert.equal(failed.code, "DEBUG_FORCED_FAILURE");
      assert.equal(JSON.stringify(context.WhiteLamp.game.getState()), beforeFailure,
        "受控失败不能提交事实或改变检查点");
    }

    // 沿真实节点推进到地图任务，使用同一页面的联调按钮完成此前的交互。
    for (let step = 0; step < 40 && !response.commands.some(c => c.commandType === "REQUEST_MINIGAME"); step++) {
      const action = response.presentation?.actions?.[0];
      const result = action
        ? await controls.onStoryAction(action.actionId)
        : await controls.onDebugCommand(response.commands[0]);
      assert.equal(result?.ok, true, `推进失败：${JSON.stringify(result)}`);
    }
    const command = response.commands.find(c => c.commandType === "REQUEST_MINIGAME");
    assert.ok(command, "真实主线应到达地图任务");
    const mapButton = elements.get("open-minigame-button");
    assert.equal(mapButton.disabled, false, "三块碎片收集完成后必须启用地图入口");
    assert.equal(mapButton.textContent, "复原手绘地图");
    assert.equal(systemPrompts.length, 1);
    const systemPrompt = systemPrompts[0];
    assert.match(systemPrompt.presentation.blocks[0].text, /三块地图碎片已经集齐/);
    assert.deepEqual(
      Array.from(systemPrompt.presentation.actions, action => action.label),
      ["进入游戏", "稍后再说"]
    );
    assert.equal(context.WhiteLamp.gamePage.getViewState(), "reading");

    if (entry === "formal") {
      const dismissed = await systemPrompt.callbacks.onAction("dismiss-map-prompt");
      assert.equal(dismissed.ok, true);
      assert.equal(context.WhiteLamp.gamePage.getViewState(), "exploration");
      assert.equal(mapStarts.length, 0, "稍后再说不得启动小游戏");
      mapButton.click();
    } else {
      const entered = await systemPrompt.callbacks.onAction("enter-map-puzzle");
      assert.equal(entered.ok, true);
    }
    assert.equal(context.WhiteLamp.gamePage.getViewState(), "minigame");
    assert.equal(mapStarts.at(-1).commandId, command.commandId);

    const cancelResult = await mapEvents.onEvent({
      eventId: `evt-map-cancel-${entry}`,
      eventType: "EXTERNAL_INTERACTION_CANCELLED",
      source: "minigame",
      causedByCommandId: command.commandId,
      resultFactIds: [],
      payload: {targetId: command.payload.minigameId}
    });
    assert.equal(cancelResult.ok, true);
    assert.equal(context.WhiteLamp.gamePage.getViewState(), "exploration");
    assert.equal(context.WhiteLamp.game.getState().facts.includes("map-puzzle-completed"), false);
    assert.equal(mapButton.disabled, false, "退出后原命令必须继续提供重开入口");
    assert.equal(systemPrompts.length, 1, "同一地图命令取消后不得重复弹出入口提示");
    mapButton.click();
    assert.equal(mapStarts.length, 2, "重新进入必须启动新的一局");

    const event = {
      eventId: "evt-map-test", eventType: "MAP_PUZZLE_COMPLETED", source: "minigame",
      causedByCommandId: command.commandId,
      resultFactIds: [command.payload.successFactId],
      payload: { puzzleId: command.payload.minigameId }
    };
    if (entry === "formal") {
      context.WhiteLamp.gamePage.failNextExternalEvent();
      const rejected = await mapEvents.onEvent(event);
      assert.equal(rejected.ok, false);
      assert.equal(context.WhiteLamp.gamePage.getViewState(), "exploration");
      assert.equal(context.WhiteLamp.game.getState().facts.includes("map-puzzle-completed"), false);
      assert.equal(mapButton.disabled, false, "提交失败后必须保留重新进入入口");
      assert.match(elements.get("feedback").textContent, /未能保存/);
      mapButton.click();
      event.eventId = "evt-map-test-retry";
    }
    rendered.length = 0;
    const result = entry === "formal"
      ? await mapEvents.onEvent(event)
      : await controls.onDebugCommand(command);
    assert.equal(result.ok, true);
    const game = context.WhiteLamp.game;
    const state = game.getState();
    assert.equal(state.achievements.filter(id => id === "map-restorer").length, 1);
    assert.equal(state.storyCheckpoint.nodeId, "village-map-and-route", "完成拼图后不得自动进入老宅");
    assert.equal(state.facts.includes("old-house-route-chosen"), false);
    assert.ok(state.inventory.includes("restored-village-map"));
    assert.ok(state.unlockedLocations.includes("old-house"));
    assert.ok(response.presentation?.actions?.some(action => action.actionId === "go-old-house"));
    assert.match(response.presentation?.blocks?.[0]?.text, /恭喜你，成功解锁【陈家老宅】相关剧情/);
    assert.ok(rendered.length > 0);
    assert.ok(rendered.every(s => s.facts.includes("map-puzzle-completed") && s.achievements.includes("map-restorer")),
      "展示不能收到已完成地图但尚未结算成就的中间状态");
    const before = JSON.stringify(state);
    event.eventId = state.processedExternalEventIds.at(-1);
    const duplicate = await mapEvents.onEvent(event);
    assert.equal(duplicate.duplicate, true);
    assert.equal(JSON.stringify(game.getState()), before);
  });
}
