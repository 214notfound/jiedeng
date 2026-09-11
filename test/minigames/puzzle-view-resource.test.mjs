import test from "node:test";
import assert from "node:assert/strict";
import {
  mountPuzzle,
  watchArtworkResource
} from "../../assets/js/minigames/map-puzzle/view/puzzle-view.js";

class FakeImage {
  static latest;

  constructor() {
    FakeImage.latest = this;
  }

  set src(value) {
    this.url = value;
  }
}

test("data URL 无需网络即可进入地图视图", () => {
  let loaded = 0;
  let failed = 0;
  watchArtworkResource("data:image/png;base64,AA==", {
    ImageConstructor: FakeImage,
    onLoad: () => loaded += 1,
    onError: () => failed += 1
  });
  assert.equal(loaded, 1);
  assert.equal(failed, 0);
});

test("地图图片失败只报告失败，不伪造加载成功", () => {
  let loaded = 0;
  let failed = 0;
  watchArtworkResource("/missing-map.png", {
    ImageConstructor: FakeImage,
    onLoad: () => loaded += 1,
    onError: () => failed += 1
  });
  FakeImage.latest.onerror();
  FakeImage.latest.onload();
  assert.equal(loaded, 0);
  assert.equal(failed, 1);
});

test("卸载地图后忽略迟到的图片结果", () => {
  let changed = 0;
  const stop = watchArtworkResource("/slow-map.png", {
    ImageConstructor: FakeImage,
    onLoad: () => changed += 1,
    onError: () => changed += 1
  });
  stop();
  FakeImage.latest.onerror?.();
  FakeImage.latest.onload?.();
  assert.equal(changed, 0);
});

class FakeElement {
  constructor(tagName = "div") {
    this.tagName = tagName;
    this.children = [];
    this.dataset = {};
    this.style = {};
    this.listeners = new Map();
    this.classes = new Set();
    this.hidden = false;
    this.textContent = "";
    this.parentNode = null;
    this.classList = {
      add: (...names) => names.forEach((name) => this.classes.add(name)),
      remove: (...names) => names.forEach((name) => this.classes.delete(name))
    };
  }

  set className(value) {
    this.classes = new Set(String(value).split(/\s+/).filter(Boolean));
  }

  get className() {
    return [...this.classes].join(" ");
  }

  set innerHTML(_value) {
    this.children = [];
  }

  append(...nodes) {
    nodes.forEach((node) => this.appendChild(node));
  }

  appendChild(node) {
    node.parentNode = this;
    this.children.push(node);
    return node;
  }

  insertBefore(node, reference) {
    node.parentNode = this;
    const index = this.children.indexOf(reference);
    if (index < 0) this.children.push(node);
    else this.children.splice(index, 0, node);
    return node;
  }

  addEventListener(type, listener) {
    this.listeners.set(type, listener);
  }

  removeEventListener(type, listener) {
    if (this.listeners.get(type) === listener) this.listeners.delete(type);
  }

  dispatch(type, target) {
    return this.listeners.get(type)?.({target});
  }

  setAttribute(name, value) {
    this[name] = String(value);
  }

  closest(selector) {
    if (selector.startsWith(".") && this.classes.has(selector.slice(1))) return this;
    return this.parentNode?.closest?.(selector) ?? null;
  }

  remove() {
    if (!this.parentNode) return;
    this.parentNode.children = this.parentNode.children.filter((child) => child !== this);
    this.parentNode = null;
  }
}

function findByClass(root, className) {
  if (root.classes?.has(className)) return root;
  for (const child of root.children ?? []) {
    const match = findByClass(child, className);
    if (match) return match;
  }
  return null;
}

test("拼图只在协调器确认提交成功后显示完成状态", async () => {
  const previousDocument = globalThis.document;
  const head = new FakeElement("head");
  globalThis.document = {
    head,
    createElement: (tagName) => new FakeElement(tagName)
  };
  const container = new FakeElement("section");
  let resolveSubmission;
  const submission = new Promise((resolve) => { resolveSubmission = resolve; });

  try {
    mountPuzzle(container, {
      level: {
        rows: 1,
        cols: 1,
        slotIds: ["slot-1-1"],
        pieceIds: ["piece-1-1"]
      },
      pieceOrder: ["piece-1-1"],
      artworkUrl: "data:image/png;base64,AA==",
      onPlace: () => ({ok: true, locked: true, completed: true}),
      onSolved: () => submission
    });

    const root = findByClass(container, "pz-root");
    root.dispatch("click", findByClass(root, "pz-piece"));
    root.dispatch("click", findByClass(root, "pz-slot"));
    assert.equal(findByClass(root, "pz-done"), null, "提交确认前不得显示完成");
    assert.match(findByClass(root, "pz-status").textContent, /正在确认/);

    resolveSubmission({ok: true});
    await submission;
    await Promise.resolve();
    assert.ok(findByClass(root, "pz-done"), "协调器确认后才能显示完成");
  } finally {
    globalThis.document = previousDocument;
  }
});
