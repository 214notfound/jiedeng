import {createAudioCoordinator} from "./audio-coordinator.js";

const coordinator = createAudioCoordinator({
  onError(error, trackId) {
    console.warn("[white-lamp:audio] BGM unavailable", {trackId, error});
  }
});

let gestureListenersBound = false;

function renderToggle(button) {
  if (!button) return;
  const muted = coordinator.isMuted();
  button.setAttribute("aria-pressed", String(muted));
  button.setAttribute("aria-label", muted ? "打开声音" : "关闭声音");
  button.title = muted ? "打开声音" : "关闭声音";
  const icon = button.querySelector("[data-audio-icon]");
  if (icon) icon.textContent = muted ? "🔇" : "🔊";
}

async function startFromUserGesture() {
  const result = await coordinator.playBgm("bgm-main");
  if (result.ok && gestureListenersBound) {
    globalThis.removeEventListener("pointerdown", startFromUserGesture);
    globalThis.removeEventListener("keydown", startFromUserGesture);
    gestureListenersBound = false;
  }
  return result;
}

function bindPageAudio() {
  const toggleButton = document.getElementById("audio-toggle-button");
  renderToggle(toggleButton);
  toggleButton?.addEventListener("click", async () => {
    const result = coordinator.setMuted(!coordinator.isMuted());
    renderToggle(toggleButton);
    if (!result.ok || coordinator.isMuted()) return;
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
globalThis.addEventListener("pageshow", startFromUserGesture, {passive: true});
globalThis.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible") startFromUserGesture();
}, {passive: true});
