// 章节背景音乐：监听章节名变化，按阶段切换 BGM（交叉淡入淡出）。
// 自包含实现：不修改 game-page-controller.js，只观察 #chapter-name 的文本。
(function registerStageBgm(global) {
  "use strict";

  if (global.__whiteLampStageBgm) return;
  global.__whiteLampStageBgm = true;

  const chapterEl = document.getElementById("chapter-name");
  if (!chapterEl || typeof MutationObserver !== "function") return;

  // 章节名（updateChapterName 渲染出的中文）→ 曲目。
  const CHAPTER_BGM = {
    "序章": "bgm-rain",
    "序章 · 旧祠堂": "bgm-rain",
    "村口调查": "bgm-rain",
    "陈家老宅": "bgm-house",
    "外围调查": "bgm-night",
    "身份重建": "bgm-truth",
    "重返矿井": "bgm-abyss",
    "终局": "bgm-abyss"
  };

  // 有雨场景：在这些章节叠加雨声环境音（sfx-rain 循环），离开时淡出。
  const RAIN_CHAPTERS = new Set([
    "序章",
    "序章 · 旧祠堂",
    "村口调查",
    "陈家老宅",
    "外围调查",
    "终局"
  ]);

  let current = null;
  let rainPlaying = false;

  function syncRain(label) {
    const coordinator = global.__whiteLampAudio;
    if (!coordinator) return;
    const shouldRain = RAIN_CHAPTERS.has(label);
    if (shouldRain && !rainPlaying) {
      rainPlaying = true;
      coordinator.playSfx("sfx-rain", {loop: true, fadeInMs: 2000}).then((res) => {
        if (!res.ok) rainPlaying = false; // 素材缺失时复位，下次进入再试
      });
    } else if (!shouldRain && rainPlaying) {
      rainPlaying = false;
      coordinator.stopSfx("sfx-rain", {fadeMs: 1500});
    }
  }

  function apply() {
    const label = (chapterEl.textContent || "").trim();
    const coordinator = global.__whiteLampAudio;
    if (!coordinator) return;

    const trackId = CHAPTER_BGM[label];
    if (trackId && trackId !== current) {
      current = trackId;
      coordinator.playBgm(trackId).catch(() => {});
    }
    syncRain(label);
  }

  new MutationObserver(apply).observe(chapterEl, {
    childList: true,
    characterData: true,
    subtree: true
  });
  apply();
})(window);
