import test from "node:test";
import assert from "node:assert/strict";
import {
  PLAYER_FEEDBACK_RESULTS,
  VIEW_STATES,
  createDetailDismissController,
  createViewCoordinator,
  deriveViewState,
  feedbackForResult
} from "../../assets/js/core/game-page-controller.js";

function fakeElement() {
  const classes = new Set();
  return {
    hidden: false,
    inert: false,
    classList: {
      toggle(name, enabled) {
        if (enabled) classes.add(name);
        else classes.delete(name);
      }
    },
    toggleAttribute(name, enabled) {
      if (name === "inert") this.inert = enabled;
    },
    querySelector() {
      return null;
    },
    focus() {},
    hasClass(name) {
      return classes.has(name);
    }
  };
}

test("剧情响应映射到 V2 基础页面", () => {
  assert.equal(
    deriveViewState({status: "ready", presentation: {}, commands: []}),
    VIEW_STATES.READING
  );
  assert.equal(
    deriveViewState({
      status: "waiting-external",
      presentation: null,
      commands: [{commandType: "REQUEST_CONVERSATION"}]
    }),
    VIEW_STATES.EXPLORATION
  );
  assert.equal(
    deriveViewState({status: "ended", presentation: null, commands: []}),
    VIEW_STATES.READING
  );
  assert.equal(
    deriveViewState({status: "error"}),
    null
  );
});

test("覆盖层只允许当前层操作，关闭后返回打开前状态", () => {
  const previousDocument = globalThis.document;
  globalThis.document = {activeElement: {focus() {}}};

  try {
    const sceneRoot = fakeElement();
    const explorationActionsRoot = fakeElement();
    const storyPanel = fakeElement();
    const inventoryRoot = fakeElement();
    const detailRoot = fakeElement();
    const minigameRoot = fakeElement();
    const coordinator = createViewCoordinator({
      sceneRoot,
      explorationActionsRoot,
      storyPanel,
      inventoryRoot,
      detailRoot,
      minigameRoot
    });

    assert.equal(coordinator.getState(), VIEW_STATES.READING);
    assert.equal(storyPanel.hidden, false);
    assert.equal(storyPanel.inert, false);

    assert.equal(coordinator.openOverlay(VIEW_STATES.INVENTORY).ok, true);
    assert.equal(coordinator.getReturnState(), VIEW_STATES.READING);
    assert.equal(storyPanel.hidden, false);
    assert.equal(storyPanel.inert, true);
    assert.equal(inventoryRoot.hidden, false);
    assert.equal(inventoryRoot.inert, false);

    assert.equal(coordinator.openOverlay(VIEW_STATES.DETAIL).ok, true);
    assert.equal(coordinator.getReturnState(), VIEW_STATES.INVENTORY);
    assert.equal(inventoryRoot.inert, true);
    assert.equal(detailRoot.inert, false);

    assert.deepEqual(coordinator.closeOverlay(), {ok: true, state: VIEW_STATES.INVENTORY});
    assert.deepEqual(coordinator.closeOverlay(), {ok: true, state: VIEW_STATES.READING});

    coordinator.showBase(VIEW_STATES.EXPLORATION);
    assert.equal(coordinator.openOverlay(VIEW_STATES.MINIGAME).ok, true);
    assert.equal(coordinator.getReturnState(), VIEW_STATES.EXPLORATION);
    assert.equal(sceneRoot.inert, true);
    assert.equal(minigameRoot.inert, false);
    assert.deepEqual(coordinator.closeOverlay(), {ok: true, state: VIEW_STATES.EXPLORATION});
    assert.equal(sceneRoot.inert, false);
  } finally {
    globalThis.document = previousDocument;
  }
});

function fakeEventTarget() {
  const listeners = new Map();
  return {
    addEventListener(type, listener) { listeners.set(type, listener); },
    removeEventListener(type, listener) {
      if (listeners.get(type) === listener) listeners.delete(type);
    },
    dispatch(type, event = {}) { listeners.get(type)?.(event); },
    has(type) { return listeners.has(type); }
  };
}

test("详情的 ESC、关闭按钮和浏览器返回统一关闭并恢复上一状态", () => {
  let state = VIEW_STATES.EXPLORATION;
  let closeCount = 0;
  const keyTarget = fakeEventTarget();
  const navigationTarget = fakeEventTarget();
  const historyCalls = [];
  const viewCoordinator = {
    getState: () => state,
    closeOverlay() {
      closeCount += 1;
      state = VIEW_STATES.EXPLORATION;
      return {ok: true, state};
    }
  };
  const historyTarget = {
    state: null,
    pushState(value) { this.state = value; historyCalls.push("push"); },
    back() { historyCalls.push("back"); }
  };
  const dismiss = createDetailDismissController({
    viewCoordinator, keyTarget, navigationTarget, historyTarget
  });

  state = VIEW_STATES.DETAIL;
  dismiss.markDetailOpened();
  let prevented = false;
  keyTarget.dispatch("keydown", {key: "Escape", preventDefault() { prevented = true; }});
  assert.equal(prevented, true);
  assert.equal(closeCount, 1);
  assert.deepEqual(historyCalls, ["push", "back"]);
  navigationTarget.dispatch("popstate");
  assert.equal(closeCount, 1, "程序主动回退产生的 popstate 不得重复关闭");

  state = VIEW_STATES.DETAIL;
  dismiss.markDetailOpened();
  navigationTarget.dispatch("popstate");
  assert.equal(closeCount, 2, "Android/浏览器返回应关闭当前详情");
  assert.deepEqual(historyCalls, ["push", "back", "push"]);

  state = VIEW_STATES.DETAIL;
  dismiss.markDetailOpened();
  dismiss.closeDetail();
  assert.equal(closeCount, 3, "详情关闭按钮复用同一关闭入口");
  dismiss.destroy();
  assert.equal(keyTarget.has("keydown"), false);
  assert.equal(navigationTarget.has("popstate"), false);
});

test("六类正式反馈都包含玩家文案和下一步动作", () => {
  const codes = [
    "SAVE_NOT_FOUND",
    "SAVE_INVALID",
    "SAVE_VERSION_UNSUPPORTED",
    "STORAGE_UNAVAILABLE",
    "OPERATION_FAILED",
    "SAVE_SUCCESS"
  ];
  assert.deepEqual(Object.keys(PLAYER_FEEDBACK_RESULTS), codes);
  for (const code of codes) {
    assert.equal(feedbackForResult(code), PLAYER_FEEDBACK_RESULTS[code]);
    assert.ok(PLAYER_FEEDBACK_RESULTS[code].message.length > 0);
    assert.ok(PLAYER_FEEDBACK_RESULTS[code].nextAction.length > 0);
  }
  assert.equal(feedbackForResult("UNKNOWN"), PLAYER_FEEDBACK_RESULTS.OPERATION_FAILED);
});
