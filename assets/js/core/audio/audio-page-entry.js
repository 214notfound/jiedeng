import {createAudioCoordinator} from "./audio-coordinator.js";
import {DEFAULT_BGM} from "./audio-config.js";

const coordinator = createAudioCoordinator({
  onError(error, trackId) {
    console.warn("[white-lamp:audio] audio unavailable", {trackId, error});
  }
});

// 暴露给 stage-bgm / sfx-triggers / video-duck 等同页脚本使用。
globalThis.__whiteLampAudio = coordinator;

// 游戏页由 stage-bgm 决定曲目，封面页等其它页面播放默认氛围曲。
const hasChapterName = Boolean(document.getElementById("chapter-name"));

let gestureListenersBound = false;
let loggedStarted = false;

function renderToggle(button) {
  if (!button) return;
  const muted = coordinator.isMuted();
  button.setAttribute("aria-pressed", String(muted));
  button.setAttribute("aria-label", muted ? "打开声音" : "关闭声音");
  button.title = muted ? "打开声音" : "关闭声音";
  const icon = button.querySelector("[data-audio-icon]");
  if (icon) icon.textContent = muted ? "🔇" : "🔊";
}

function unbindGestures() {
  if (!gestureListenersBound) return;
  globalThis.removeEventListener("pointerdown", startFromUserGesture);
  globalThis.removeEventListener("keydown", startFromUserGesture);
  gestureListenersBound = false;
}

async function startFromUserGesture() {
  if (hasChapterName && coordinator.isPlaying()) {
    // 游戏页且已有曲目（stage-bgm 已选定）：仅恢复被浏览器拦截的播放。
    await coordinator.resume();
  } else {
    // 封面页等，或游戏页尚无曲目：播放默认氛围曲。
    await coordinator.playBgm(DEFAULT_BGM);
  }
  if (coordinator.isRunning()) {
    if (!loggedStarted) {
      console.info("[white-lamp:audio] 声音已开始播放");
      loggedStarted = true;
    }
    unbindGestures();
  }
}

function bindPageAudio() {
  const toggleButton = document.getElementById("audio-toggle-button");
  renderToggle(toggleButton);
  toggleButton?.addEventListener("click", async () => {
    coordinator.setMuted(!coordinator.isMuted());
    renderToggle(toggleButton);
    if (coordinator.isMuted()) return;
    await startFromUserGesture();
  });

  // 先尝试自动播放；被浏览器拦截时，保留监听直到首次成功。
  startFromUserGesture();
  globalThis.addEventListener("pointerdown", startFromUserGesture, {passive: true});
  globalThis.addEventListener("keydown", startFromUserGesture, {passive: true});
  gestureListenersBound = true;
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", bindPageAudio, {once: true});
} else {
  bindPageAudio();
}

globalThis.addEventListener("pagehide", () => coordinator.destroy(), {once: true});
globalThis.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible") startFromUserGesture();
}, {passive: true});
