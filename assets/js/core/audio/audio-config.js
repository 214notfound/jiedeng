const AUDIO_TRACKS = Object.freeze({
  "bgm-main": Object.freeze({
    id: "bgm-main",
    type: "bgm",
    src: new URL("../../../audio/bgm/main.mp3", import.meta.url).href
  })
});

export {AUDIO_TRACKS};
