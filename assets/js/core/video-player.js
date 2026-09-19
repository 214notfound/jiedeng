// game.html 位于 pages/，因此此路径从正式页面文档根目录解析到 assets/videos/。
const VIDEO_ASSET_PATH = "../assets/videos/";

export const VIDEO_CUE_MAP = Object.freeze({
  whiteLampFirstSeen: Object.freeze({
    cueId: "prologue-white-lamp-first-seen",
    filename: "light_up.mp4"
  }),
  shrinePowerCut: Object.freeze({
    cueId: "prologue-shrine-power-cut",
    filename: "cut-off.mp4"
  }),
  "ending-accomplice": Object.freeze({cueId: "ending-accomplice", filename: "the_ending.mp4"}),
  "ending-defeated": Object.freeze({cueId: "ending-defeated", filename: "close_well.mp4"}),
  "ending-erasure": Object.freeze({cueId: "ending-erasure", filename: "unnamed.mp4"}),
  "ending-curated-truth": Object.freeze({cueId: "ending-curated-truth", filename: "after_whitelamp.mp4"}),
  "ending-full-account": Object.freeze({cueId: "ending-full-account", filename: "no_more_lamp.mp4"})
});

export function resolveVideoSource(filename) {
  if (typeof filename !== "string" || !filename.trim()) {
    throw new TypeError("视频文件名必须是非空字符串");
  }
  return `${VIDEO_ASSET_PATH}${encodeURIComponent(filename)}`;
}

function isStoryContext(context) {
  return context?.input?.mode === "story";
}

export function videoCueForReading(context) {
  const input = context?.input;
  const item = context?.item;
  const segment = context?.segment;
  const text = typeof segment?.text === "string" ? segment.text : "";
  if (!input || !item || !segment) return null;

  if (
    isStoryContext(context)
    && input.metadata?.presentationId === "present-prologue-white-lamp-first-white-lamp"
    && item.id === "lamp-outside-shrine"
    && text.includes("突然亮起了一盏灯")
  ) {
    return VIDEO_CUE_MAP.whiteLampFirstSeen;
  }

  if (
    input.mode === "conversation"
    && input.metadata?.conversationId === "prologue-lamp-incident"
    && input.metadata?.actionId === "lamp-incident"
    && text.includes("祠堂内忽然断电")
  ) {
    return VIDEO_CUE_MAP.shrinePowerCut;
  }

  if (isStoryContext(context) && item.id === "ending-title") {
    const endingId = Object.keys(VIDEO_CUE_MAP).find((key) =>
      key.startsWith("ending-")
      && input.metadata?.presentationId === `present-${key}-ending-summary`
    );
    return endingId ? VIDEO_CUE_MAP[endingId] : null;
  }

  return null;
}

export function createVideoPlayer({documentTarget = globalThis.document, mountTarget} = {}) {
  if (!documentTarget || typeof documentTarget.createElement !== "function") {
    throw new TypeError("视频播放器需要可用的 document");
  }

  const playedCueIds = new Set();
  let activeOverlay = null;
  const container = mountTarget ?? documentTarget.body;

  function cleanup(overlay, video) {
    if (overlay !== activeOverlay) return;
    activeOverlay = null;
    video?.pause?.();
    video?.removeAttribute?.("src");
    if (overlay?._whiteLampGameShell?.dataset) {
      delete overlay._whiteLampGameShell.dataset.videoPlaying;
    }
    overlay.remove?.();
    documentTarget.body?.removeAttribute?.("data-video-playing");
  }

  function playCue(cue) {
    if (!cue || playedCueIds.has(cue.cueId)) return Promise.resolve(false);
    playedCueIds.add(cue.cueId);

    if (activeOverlay) cleanup(activeOverlay, activeOverlay.querySelector?.("video"));

    const overlay = documentTarget.createElement("div");
    overlay.className = "wl-video-overlay";
    overlay.tabIndex = -1;
    overlay.setAttribute("role", "presentation");
    overlay.setAttribute("aria-hidden", "true");

    const video = documentTarget.createElement("video");
    video.className = "wl-video-overlay__video";
    video.src = resolveVideoSource(cue.filename);
    video.autoplay = true;
    video.playsInline = true;
    video.preload = "auto";
    video.setAttribute("aria-hidden", "true");
    overlay.append(video);
    container?.append?.(overlay);
    documentTarget.body?.setAttribute("data-video-playing", "true");
    const gameShell = documentTarget.querySelector?.(".game-shell");
    if (gameShell?.dataset) gameShell.dataset.videoPlaying = "true";
    overlay._whiteLampGameShell = gameShell;
    activeOverlay = overlay;
    overlay.focus?.();

    return new Promise((resolve) => {
      let settled = false;
      const finish = () => {
        if (settled) return;
        settled = true;
        cleanup(overlay, video);
        resolve(true);
      };

      video.addEventListener?.("ended", finish, {once: true});
      video.addEventListener?.("error", finish, {once: true});
      video.addEventListener?.("abort", finish, {once: true});
      video.load?.();
      try {
        const playResult = video.play?.();
        if (playResult && typeof playResult.catch === "function") {
          playResult.catch(finish);
        }
      } catch {
        finish();
      }
    });
  }

  function playForReading(context) {
    const cue = videoCueForReading(context);
    return cue ? playCue(cue) : undefined;
  }

  return Object.freeze({
    playCue,
    playForReading,
    hasPlayed(cueId) {
      return playedCueIds.has(cueId);
    },
    reset() {
      if (activeOverlay) cleanup(activeOverlay, activeOverlay.querySelector?.("video"));
      playedCueIds.clear();
    }
  });
}
