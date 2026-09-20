import test from "node:test";
import assert from "node:assert/strict";
import {
  createGameView,
  createReadingView,
  splitSpeakerLabel,
  splitReadingText,
  validateReadingInput
} from "../../assets/js/core/game-ui.js";

class FakeElement {
  constructor(tagName) {
    this.tagName = tagName.toUpperCase();
    this.children = [];
    this.attributes = new Map();
    this.dataset = {};
    this.disabled = false;
    this.parentElement = null;
    this.textContent = "";
    this.style = {};
    this.listeners = new Map();
  }

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

  addEventListener(type, listener) {
    this.listeners.set(type, listener);
  }

  dispatch(type) {
    return this.listeners.get(type)?.();
  }

  querySelectorAll(selector) {
    return selector === "button"
      ? this.children.filter((child) => child.tagName === "BUTTON")
      : [];
  }

  setAttribute(name, value) {
    this.attributes.set(name, String(value));
  }

  getAttribute(name) {
    return this.attributes.get(name) ?? null;
  }

  removeAttribute(name) {
    this.attributes.delete(name);
    if (name.startsWith("data-")) {
      const key = name.slice(5).replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
      delete this.dataset[key];
    }
  }

  remove() {
    if (!this.parentElement) return;
    this.parentElement.children = this.parentElement.children.filter((child) => child !== this);
    this.parentElement = null;
  }
}

function withFakeDocument(run) {
  const previousDocument = globalThis.document;
  globalThis.document = {createElement: (tagName) => new FakeElement(tagName)};
  return Promise.resolve()
    .then(run)
    .finally(() => { globalThis.document = previousDocument; });
}

test("multi-line dialogue and narration are split into one reading outlet", () => {
  assert.deepEqual(
    splitReadingText("【你】我以前是做什么的？\n【小X】先别硬想，能查东西就够了。\n他把话题岔开，随后递来一把老钥匙。"),
    [
      {speaker: "你", text: "我以前是做什么的？"},
      {speaker: "小X", text: "先别硬想，能查东西就够了。"},
      {speaker: null, text: "他把话题岔开，随后递来一把老钥匙。"}
    ]
  );
});

test("same-line speaker labels split only at valid label boundaries", () => {
  assert.deepEqual(
    splitReadingText("【小X】村里有借灯的禁忌。祠堂忽然断电。 【小X】去村口问问吧。"),
    [
      {speaker: "小X", text: "村里有借灯的禁忌。祠堂忽然断电。"},
      {speaker: "小X", text: "去村口问问吧。"}
    ]
  );
  assert.deepEqual(
    splitReadingText("雨声里传来【老板】的招呼。"),
    [{speaker: null, text: "雨声里传来【老板】的招呼。"}]
  );
});

function readingInput(overrides = {}) {
  return {
    mode: "story",
    items: [
      {id: "line-1", kind: "narration", text: "第一段。"},
      {id: "line-2", kind: "system", text: "第二段。"}
    ],
    actions: [{actionId: "continue-story", label: "继续调查", actionType: "advance"}],
    metadata: {presentationId: "presentation-1"},
    ...overrides
  };
}

test("V4 mixed labels change only the visual skin and preserve completion identity", () => withFakeDocument(() => {
  const storyElement = new FakeElement("div");
  const actionsElement = new FakeElement("div");
  const panel = new FakeElement("section");
  storyElement.closest = () => panel;
  const completions = [];
  const input = readingInput({mode: "conversation", items: [{
    id: "mixed", kind: "dialogue", text: "【小周】别出去。\n【旁白】雨声更近了。\n【独白】他在怕什么？\n【你】为什么？"
  }]});
  const before = JSON.stringify(input);
  const view = createReadingView({storyElement, actionsElement, onComplete: r => completions.push(r)});
  view.open(input);
  for (const [index, skin] of ["dialogue", "narration", "inner", "dialogue"].entries()) {
    if (index) view.next();
    assert.equal(panel.dataset.visualKind, skin);
    assert.equal(panel.dataset.contentKind, "dialogue");
    assert.equal(storyElement.children.length, skin === "dialogue" ? 2 : 1);
    assert.equal(completions.length, 0);
  }
  view.next();
  view.next();
  assert.equal(completions.length, 1);
  assert.equal(completions[0].finalItemId, "mixed");
  assert.equal(completions[0].mode, "conversation");
  assert.equal(JSON.stringify(input), before);
  view.close();
  assert.equal(panel.dataset.visualKind, undefined);
}));

test("V4 system prompt keeps its type and action while sharing the inner skin", () => withFakeDocument(() => {
  const storyElement = new FakeElement("div");
  const actionsElement = new FakeElement("div");
  const calls = [];
  const view = createReadingView({storyElement, actionsElement, onAction: id => calls.push(id)});
  view.open(readingInput({items: [{id: "entry", kind: "system", text: "【系统提示】是否进入？"}]}));
  assert.equal(storyElement.dataset.contentKind, "system");
  assert.equal(storyElement.dataset.visualKind, "inner");
  assert.equal(storyElement.children.length, 1);
  assert.equal(storyElement.children[0].textContent, "是否进入？");
  view.next();
  actionsElement.children[0].dispatch("click");
  assert.deepEqual(calls, ["continue-story"]);
}));

test("橙光式姓名牌只拆分正文开头的完整角色标签", () => {
  assert.deepEqual(
    splitSpeakerLabel("【老板】买东西自己拿。"),
    {speaker: "老板", text: "买东西自己拿。"}
  );
  assert.deepEqual(
    splitSpeakerLabel("雨声里传来【老板】的招呼。"),
    {speaker: null, text: "雨声里传来【老板】的招呼。"}
  );
  assert.deepEqual(
    splitSpeakerLabel("【未闭合的标签"),
    {speaker: null, text: "【未闭合的标签"}
  );
  assert.deepEqual(
    splitSpeakerLabel("【  】不能作为角色名。"),
    {speaker: null, text: "【  】不能作为角色名。"}
  );
});

test("阅读输入缺字段、类型不匹配或 ID 重复时明确拒绝", () => {
  assert.throws(
    () => validateReadingInput({...readingInput(), actions: undefined}),
    /阅读输入\.actions/
  );
  assert.throws(
    () => validateReadingInput(readingInput({items: [
      {id: "same", kind: "narration", text: "一"},
      {id: "same", kind: "system", text: "二"}
    ]})),
    /id 不能重复/
  );
  assert.throws(
    () => validateReadingInput(readingInput({mode: "conversation"})),
    /kind 与 mode 不匹配/
  );
});

test("阅读器逐段显示且只在末尾触发一次完成回调", async () => withFakeDocument(() => {
  const storyElement = new FakeElement("div");
  const actionsElement = new FakeElement("div");
  const completions = [];
  const view = createReadingView({
    storyElement,
    actionsElement,
    onComplete: (result) => completions.push(result)
  });

  view.open(readingInput());
  assert.equal(storyElement.children.at(-1).textContent, "第一段。");
  assert.deepEqual(actionsElement.querySelectorAll("button").map((button) => button.textContent), ["继续"]);

  view.next();
  assert.equal(storyElement.children.at(-1).textContent, "第二段。");
  assert.equal(completions.length, 0);

  view.next();
  view.next();
  assert.equal(completions.length, 1);
  assert.equal(completions[0].finalItemId, "line-2");
  assert.deepEqual(actionsElement.querySelectorAll("button").map((button) => button.textContent), ["继续调查"]);

  view.close();
  assert.equal(completions.length, 1, "关闭不得伪装成阅读完成");
}));

test("异步段落前置钩子完成前不显示正文且阻止继续操作", async () => withFakeDocument(async () => {
  const storyElement = new FakeElement("div");
  const actionsElement = new FakeElement("div");
  let release;
  const gate = new Promise((resolve) => { release = resolve; });
  const view = createReadingView({
    storyElement,
    actionsElement,
    beforeRenderItem: () => gate
  });

  view.open(readingInput());
  assert.equal(storyElement.children.length, 0);
  assert.equal(actionsElement.children[0].disabled, true);
  view.next();
  release();
  await Promise.resolve();
  await Promise.resolve();
  assert.equal(storyElement.children.at(-1).textContent, "第一段。");
  assert.equal(actionsElement.children[0].disabled, false);
}));

test("同一条对白中的角色与旁白按段落推进，不在一个对话框内形成长滚动文本", () => withFakeDocument(() => {
  const storyElement = new FakeElement("div");
  const actionsElement = new FakeElement("div");
  const view = createReadingView({storyElement, actionsElement});

  view.open({
    mode: "conversation",
    items: [{
      id: "key-dialogue",
      kind: "dialogue",
      text: "【你】我以前是做什么的？\n【小X】先别硬想。\n他把话题岔开。"
    }],
    actions: [],
    metadata: {conversationId: "conversation-1", npcId: "companion-x", actionId: "key", commandId: "command-1"}
  });

  assert.equal(storyElement.children.at(-1).textContent, "我以前是做什么的？");
  view.next();
  assert.equal(storyElement.children.at(-1).textContent, "先别硬想。");
  view.next();
  assert.equal(storyElement.children.at(-1).textContent, "他把话题岔开。");
}));

test("NPC Choice 提交期间可见忙碌状态、阻止连点并在失败后允许重试", async () => withFakeDocument(async () => {
  const storyElement = new FakeElement("div");
  const actionsElement = new FakeElement("div");
  let submitCount = 0;
  let finishSubmit;
  const pending = new Promise((resolve) => { finishSubmit = resolve; });
  const view = createReadingView({
    storyElement,
    actionsElement,
    onAction: async () => {
      submitCount += 1;
      return pending;
    }
  });
  view.open({
    mode: "conversation",
    readingState: "choice",
    items: [{id: "choice-prompt", kind: "dialogue", text: "请选择。"}],
    actions: [
      {actionId: "choice-a", label: "选择一", actionType: "choice"},
      {actionId: "choice-b", label: "选择二", actionType: "choice"}
    ],
    metadata: {conversationId: "conversation-1"}
  });

  const [firstButton, secondButton] = actionsElement.querySelectorAll("button");
  const firstSubmission = firstButton.dispatch("click");
  secondButton.dispatch("click");
  assert.equal(submitCount, 1);
  assert.equal(actionsElement.getAttribute("aria-busy"), "true");
  assert.equal(firstButton.disabled, true);
  assert.equal(actionsElement.children.at(-1).textContent, "正在处理，请稍候……");

  finishSubmit({ok: false});
  await firstSubmission;
  assert.equal(actionsElement.getAttribute("aria-busy"), "false");
  assert.equal(firstButton.disabled, false);
  assert.equal(actionsElement.children.at(-1).textContent, "操作没有完成，请重试。");
}));

test("阅读操作异常只进控制台，页面不显示内部错误详情", async () => withFakeDocument(async () => {
  const previousConsoleError = console.error;
  const errors = [];
  console.error = (...args) => errors.push(args);
  try {
    const storyElement = new FakeElement("div");
    const actionsElement = new FakeElement("div");
    const view = createReadingView({
      storyElement,
      actionsElement,
      onAction: async () => { throw new Error("commandId=internal-command"); }
    });
    view.open(readingInput({items: [{id: "line", kind: "narration", text: "正文。"}]}));
    view.next();
    const [button] = actionsElement.querySelectorAll("button");
    await button.dispatch("click");

    assert.equal(actionsElement.children.at(-1).textContent, "操作没有完成，请重试。");
    assert.doesNotMatch(actionsElement.children.at(-1).textContent, /commandId|internal-command/);
    assert.equal(button.disabled, false);
    assert.equal(errors.length, 1);
  } finally {
    console.error = previousConsoleError;
  }
}));

test("系统提示复用统一阅读框并把选择交回页面控制器", async () => {
  const previousDocument = globalThis.document;
  const storyElement = new FakeElement("div");
  const actionsElement = new FakeElement("div");
  const elements = new Map([
    ["game-story", storyElement],
    ["game-actions", actionsElement]
  ]);
  globalThis.document = {
    createElement: (tagName) => new FakeElement(tagName),
    getElementById: (id) => elements.get(id) ?? null
  };
  const selectedActions = [];

  try {
    const gameView = createGameView();
    gameView.openSystemPrompt({
      presentationId: "ui-map-puzzle-entry",
      sceneId: "village",
      blocks: [{
        blockId: "map-puzzle-entry-message",
        blockType: "system",
        text: "【系统提示】三块地图碎片已经集齐，是否现在复原地图？"
      }],
      actions: [
        {actionId: "enter-map-puzzle", label: "进入游戏", actionType: "choice"},
        {actionId: "dismiss-map-prompt", label: "稍后再说", actionType: "choice"}
      ]
    }, {
      onAction: async (actionId) => {
        selectedActions.push(actionId);
        return {ok: true};
      }
    });

    assert.equal(storyElement.children.length, 1, "操作提示不冒充人物姓名");
    assert.equal(storyElement.dataset.contentKind, "system");
    assert.equal(storyElement.dataset.visualKind, "inner");
    assert.match(storyElement.children.at(-1).textContent, /三块地图碎片已经集齐/);
    assert.deepEqual(
      actionsElement.querySelectorAll("button").map((button) => button.textContent),
      ["读完"]
    );

    gameView.getReadingView().next();
    const promptActions = actionsElement.querySelectorAll("button");
    assert.deepEqual(promptActions.map((button) => button.textContent), ["进入游戏", "稍后再说"]);
    await promptActions[1].dispatch("click");
    assert.deepEqual(selectedActions, ["dismiss-map-prompt"]);
  } finally {
    globalThis.document = previousDocument;
  }
});

test("剧情结束状态以终章卡片呈现，不混入 NPC 对话或旧系统提示", async () => {
  const previousDocument = globalThis.document;
  const storyElement = new FakeElement("div");
  const actionsElement = new FakeElement("div");
  globalThis.document = {
    createElement: (tagName) => new FakeElement(tagName),
    getElementById: (id) => ({"game-story": storyElement, "game-actions": actionsElement}[id] ?? null)
  };

  try {
    const gameView = createGameView();
    gameView.renderResponse({status: "ended", commit: {checkpoint: {nodeId: "ending-full-account"}}});
    assert.deepEqual(storyElement.children.map((child) => child.textContent), [
      "终章", "不再借灯", "这一夜的故事已落定。"
    ]);
    assert.deepEqual(actionsElement.children.map((child) => child.textContent), ["查看成就", "返回主菜单"]);
    assert.deepEqual(actionsElement.children.map((child) => child.href), [
      "achievements/achievements.html", "menu.html"
    ]);
    assert.equal(storyElement.dataset.readingMode, "finale");
  } finally {
    globalThis.document = previousDocument;
  }
});

test("正式剧情响应允许页面控制器接收一次真实阅读完成回调", async () => {
  const previousDocument = globalThis.document;
  const storyElement = new FakeElement("div");
  const actionsElement = new FakeElement("div");
  globalThis.document = {
    createElement: (tagName) => new FakeElement(tagName),
    getElementById: (id) => ({"game-story": storyElement, "game-actions": actionsElement}[id] ?? null)
  };
  let completed = 0;

  try {
    const gameView = createGameView();
    gameView.renderResponse({
      status: "ready",
      presentation: {
        presentationId: "present-outer-lines-investigation-four-threads-open",
        sceneId: "village",
        blocks: [{blockId: "four-threads-emerge", blockType: "narration", text: "四条线索浮出水面。"}],
        actions: []
      }
    }, {onComplete: () => { completed += 1; }});

    gameView.getReadingView().next();
    gameView.getReadingView().next();
    assert.equal(completed, 1);
  } finally {
    globalThis.document = previousDocument;
  }
});
