import test from "node:test";
import assert from "node:assert/strict";
import {createInitialBoard} from "../../assets/js/minigames/haunting-network/board-data.js";
import {createV3MinigameGateway} from "../../assets/js/minigames/v3-handoff/v3-minigame-gateway.js";

class FakeElement {
  constructor(tagName) {
    this.tagName = tagName.toUpperCase();
    this.children = [];
    this.parentElement = null;
    this.dataset = {};
    this.attributes = new Map();
    this.listeners = new Map();
    this.style = {setProperty() {}};
    this.classes = new Set();
    this.classList = {
      toggle: (name, force) => {
        if (force) this.classes.add(name);
        else this.classes.delete(name);
      }
    };
    this.textContent = "";
    this.disabled = false;
  }

  set className(value) { this.classes = new Set(value.split(/\s+/).filter(Boolean)); }
  get className() { return [...this.classes].join(" "); }
  append(...children) {
    for (const child of children) {
      child.parentElement = this;
      this.children.push(child);
    }
  }
  replaceChildren(...children) {
    for (const child of this.children) child.parentElement = null;
    this.children = [];
    this.append(...children);
  }
  remove() {
    if (!this.parentElement) return;
    this.parentElement.children = this.parentElement.children.filter((child) => child !== this);
    this.parentElement = null;
  }
  setAttribute(name, value) { this.attributes.set(name, String(value)); }
  addEventListener(type, listener, options) {
    const entries = this.listeners.get(type) ?? [];
    entries.push({listener, once: options?.once === true});
    this.listeners.set(type, entries);
  }
  removeEventListener(type, listener) {
    this.listeners.set(type, (this.listeners.get(type) ?? []).filter((entry) => entry.listener !== listener));
  }
  click() {
    if (this.disabled) return;
    const event = {target: this};
    for (let node = this; node; node = node.parentElement) {
      for (const entry of [...(node.listeners.get("click") ?? [])]) {
        entry.listener(event);
        if (entry.once) node.removeEventListener("click", entry.listener);
      }
    }
  }
  closest(selector) {
    if (selector === "[data-index]" && this.dataset.index !== undefined) return this;
    return this.parentElement?.closest(selector) ?? null;
  }
  querySelectorAll(selector) {
    const matches = [];
    for (const child of this.children) {
      if (selector === "button" && child.tagName === "BUTTON") matches.push(child);
      matches.push(...child.querySelectorAll(selector));
    }
    return matches;
  }
  querySelector(selector) {
    if (selector === "button:not(:disabled)") {
      return this.querySelectorAll("button").find((button) => !button.disabled) ?? null;
    }
    return null;
  }
  focus() {}
}

function find(root, predicate) {
  if (predicate(root)) return root;
  for (const child of root.children) {
    const result = find(child, predicate);
    if (result) return result;
  }
  return null;
}

function countClass(root, className) {
  return Number(root.classes.has(className))
    + root.children.reduce((sum, child) => sum + countClass(child, className), 0);
}

test("Game 1 的实际点击路径完成全局闭合并提交剧情结果", async () => {
  const previousDocument = globalThis.document;
  globalThis.document = {
    head: new FakeElement("head"),
    createElement: (tagName) => new FakeElement(tagName),
    querySelector: () => null
  };
  try {
    const container = new FakeElement("section");
    const events = [];
    let closed = 0;
    const gateway = createV3MinigameGateway({
      container,
      onEvent: async (event) => { events.push(event); return {ok: true}; },
      onClose: () => { closed += 1; }
    });
    gateway.start({
      commandType: "REQUEST_MINIGAME",
      commandId: "cmd-haunting-test",
      payload: {
        minigameId: "haunting-network-puzzle",
        gameStyle: "puzzle",
        allowedResultFactIds: ["haunting-is-engineered"]
      }
    });

    const board = find(container, (node) => node.classes.has("mg-network__board"));
    assert.ok(board);
    assert.ok(countClass(board, "mg-network__open-end") > 0);
    find(container, (node) => node.textContent === "开始接线").click();
    const hintButton = find(container, (node) => node.textContent === "查看线路提示");
    assert.equal(hintButton.disabled, false);
    hintButton.click();
    assert.match(find(container, (node) => node.classes.has("mg-network__hint-detail")).textContent,
      /第 1 行第 3 列高亮方块，顺时针再转 1 次/);
    assert.equal(board.children[2].classes.has("is-hint"), true);
    for (const [index, tile] of createInitialBoard().entries()) {
      if (tile.type === "server") continue;
      const clicks = ((tile.solvedRotation - tile.rotation + 360) % 360) / 90;
      for (let i = 0; i < clicks; i += 1) {
        const cell = board.children[index];
        assert.equal(cell.disabled, false, `tile ${index} should be clickable`);
        cell.click();
      }
    }
    assert.equal(countClass(board, "mg-network__open-end"), 2);
    assert.equal(events.length, 0);
    const summary = find(container, (node) => node.classes.has("mg-network__summary"));
    assert.match(summary.textContent, /主控网络未闭合：2 处断口，16\/16 个节点接入/);
    for (let i = 0; i < 3; i += 1) board.children[12].click();
    assert.equal(countClass(board, "mg-network__open-end"), 0);
    assert.equal(summary.textContent, "主控网络已闭合");
    assert.equal(hintButton.disabled, true);
    assert.equal(events.length, 1);
    assert.equal(events[0].eventType, "MINIGAME_RESOLVED");
    assert.deepEqual(events[0].resultFactIds, ["haunting-is-engineered"]);
    await new Promise(setImmediate);
    find(container, (node) => node.textContent === "继续剧情").click();
    assert.equal(closed, 1);
    gateway.destroy();
  } finally {
    globalThis.document = previousDocument;
  }
});
