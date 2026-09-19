// 视频让位：结局 / 灯暗灯亮等视频自带音效，播放期间把 BGM 压低，结束后淡回。
// 自包含实现：观察 video-player 在 <body> 上标记的 data-video-playing 属性，不改动视频播放器。
(function registerVideoDuck(global) {
  "use strict";

  if (global.__whiteLampVideoDuck) return;
  global.__whiteLampVideoDuck = true;

  if (typeof MutationObserver !== "function") return;

  function update() {
    const coordinator = global.__whiteLampAudio;
    if (!coordinator) return;
    const playing = document.body.getAttribute("data-video-playing") === "true";
    if (playing) coordinator.duck();
    else coordinator.unduck();
  }

  new MutationObserver(update).observe(document.body, {
    attributes: true,
    attributeFilter: ["data-video-playing"]
  });
  update();
})(window);
