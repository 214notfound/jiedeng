// 音效触发：监听剧情文本渲染结果，在约定台词处播放对应音效。
// 自包含实现：不改动渲染内核与剧情数据，只观察 #game-story 的 .story-block 文本。
(function registerSfxTriggers(global) {
  "use strict";

  if (global.__whiteLampSfxTriggers) return;
  global.__whiteLampSfxTriggers = true;

  const story = document.getElementById("game-story");
  if (!story || typeof MutationObserver !== "function") return;

  function has(text, needle) {
    return text.indexOf(needle) !== -1;
  }

  // 门外呼名的整句只是“陈晋年”加省略号，剥掉尾部标点后唯一匹配。
  function isDoorCall(text) {
    return text.trim().replace(/[…。·.]*$/u, "") === "陈晋年";
  }

  function sfx(id) {
    const coordinator = global.__whiteLampAudio;
    if (!coordinator) return;
    coordinator.playSfx(id).catch(() => {});
  }

  function heartbeat() {
    const coordinator = global.__whiteLampAudio;
    if (!coordinator) return;
    coordinator
      .playSfx("sfx-heartbeat", {loop: true, durationMs: 4000, fadeInMs: 200, fadeOutMs: 900})
      .catch(() => {});
  }

  const triggers = [
    // M-2 苏禾录音
    {test: (t) => has(t, "按下播放"), run: () => sfx("sfx-static")},
    {test: (t) => has(t, "一声闷响"), run: () => sfx("sfx-fall")},
    {test: (t) => has(t, "说话的那个人，是我"), run: heartbeat},
    // A-1 录像
    {test: (t) => has(t, "看不清脸"), run: () => sfx("sfx-static")},
    {test: (t) => has(t, "那个背影，是我"), run: heartbeat},
    // 身份重建
    {test: (t) => has(t, "正站在这里"), run: heartbeat},
    // 终局 / 老宅
    {test: (t) => has(t, "一声枪响"), run: () => sfx("sfx-gunshot")},
    {test: isDoorCall, run: () => sfx("sfx-doorcall")},
    {test: (t) => has(t, "小周追了上来"), run: () => sfx("sfx-chase")}
  ];

  const fired = new Set();
  let pending = false;

  function scan() {
    pending = false;
    story.querySelectorAll(".story-block").forEach((block) => {
      const id = block.dataset.contentId;
      if (!id || fired.has(id)) return;
      const text = block.textContent || "";
      for (const trigger of triggers) {
        if (trigger.test(text)) {
          fired.add(id);
          trigger.run();
          break;
        }
      }
    });
  }

  function scheduleScan() {
    if (pending) return;
    pending = true;
    if (typeof queueMicrotask === "function") queueMicrotask(scan);
    else setTimeout(scan, 0);
  }

  new MutationObserver(scheduleScan).observe(story, {
    childList: true,
    subtree: true,
    characterData: true
  });
})(window);
