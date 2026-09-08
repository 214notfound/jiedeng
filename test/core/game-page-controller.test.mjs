import test from "node:test";
import assert from "node:assert/strict";
import {
  VIEW_STATES,
  createViewCoordinator,
  deriveViewState
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
