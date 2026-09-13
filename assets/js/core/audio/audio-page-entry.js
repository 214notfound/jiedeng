import {createAudioCoordinator} from "./audio-coordinator.js";

const coordinator = createAudioCoordinator({
  onError(error, trackId) {
    console.warn("[white-lamp:audio] BGM unavailable", {trackId, error});
  }
});

function startFromUserGesture() {
  coordinator.playBgm("bgm-main");
}

globalThis.addEventListener("pointerdown", startFromUserGesture, {once: true, passive: true});
globalThis.addEventListener("keydown", startFromUserGesture, {once: true, passive: true});
globalThis.addEventListener("pagehide", () => coordinator.destroy(), {once: true});
