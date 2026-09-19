// 音频素材清单与音量配置。
// 所有素材路径、章节→曲目映射、音量层级都集中在这里，便于单独调参而不动逻辑代码。

function audioUrl(relPath) {
  return new URL(`../../../audio/${relPath}`, import.meta.url).href;
}

function makeTrack(id, type, relPath, gain = 1) {
  return Object.freeze({id, type, src: audioUrl(relPath), gain});
}

// 音量层级：master(总) → bgm(背景音乐层) / sfx(音效层)。
// 想让「背景音乐 > 音效」，调 bgm / sfx 这两个数即可（把 sfx 设得比 bgm 低）。
const VOLUME = Object.freeze({
  master: 0.9,
  bgm: 0.5,
  sfx: 0.42,
  duckLevel: 0.18, // 视频播放时 BGM 压低到正常音量的 18%
  bgmFadeMs: 2500, // 切歌 crossfade 时长（毫秒）
  duckFadeMs: 800  // 视频让位淡入淡出时长（毫秒）
});

// 章节 → 背景音乐。七个阶段归并为五种情绪，相邻阶段复用。
const BGM_STAGE_MAP = Object.freeze({
  prologue: "bgm-rain",
  village: "bgm-rain",
  "old-house": "bgm-house",
  "outer-investigation": "bgm-night",
  "identity-reconstruction": "bgm-truth",
  "mine-return": "bgm-abyss",
  finale: "bgm-abyss"
});

// 封面页（无章节）等场景的默认曲目。
const DEFAULT_BGM = "bgm-rain";

const AUDIO_TRACKS = Object.freeze({
  "bgm-rain":  makeTrack("bgm-rain",  "bgm", "bgm/bgm-rain.mp3"),
  "bgm-house": makeTrack("bgm-house", "bgm", "bgm/bgm-house.mp3", 1.25), // 老宅曲听感偏小，单独抬一点
  "bgm-night": makeTrack("bgm-night", "bgm", "bgm/bgm-night.mp3"),
  "bgm-truth": makeTrack("bgm-truth", "bgm", "bgm/bgm-truth.mp3"),
  "bgm-abyss": makeTrack("bgm-abyss", "bgm", "bgm/bgm-abyss.mp3"),
  "sfx-gunshot":   makeTrack("sfx-gunshot",   "sfx", "sfx/sfx-gunshot.mp3"),
  "sfx-static":    makeTrack("sfx-static",    "sfx", "sfx/sfx-static.mp3"),
  "sfx-fall":      makeTrack("sfx-fall",      "sfx", "sfx/sfx-fall.mp3"),
  "sfx-doorcall":  makeTrack("sfx-doorcall",  "sfx", "sfx/sfx-doorcall.mp3"),
  "sfx-chase":     makeTrack("sfx-chase",     "sfx", "sfx/sfx-chase.mp3"),
  "sfx-heartbeat": makeTrack("sfx-heartbeat", "sfx", "sfx/sfx-heartbeat.mp3"),
  "sfx-rain":      makeTrack("sfx-rain",      "sfx", "sfx/sfx-rain.mp3", 0.4)
});

export {AUDIO_TRACKS, BGM_STAGE_MAP, DEFAULT_BGM, VOLUME};
