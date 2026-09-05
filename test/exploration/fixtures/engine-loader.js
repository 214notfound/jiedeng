// 独立演示专用：按约定顺序加载原样保留的剧情引擎快照。
const scripts = [
  "data/story-registry.js", "data/prologue.js", "data/village.js", "data/old-house.js",
  "game/story-validator.js", "game/story-runtime.js", "game/story-request.js", "game/story-engine.js"
];
let pending;
export function loadDemoEngine() {
  if (!pending) pending = (async () => {
    // 真实页面已经加载自己的剧情引擎时，不覆盖其命名空间。
    if (window.WhiteLamp?.story?.enterStory) return window.WhiteLamp.story.enterStory;
    for (const file of scripts) {
      await new Promise((resolve, reject) => {
        const script = document.createElement("script");
        script.src = new URL("../vendor/game-line/" + file, import.meta.url).href;
        script.onload = resolve;
        script.onerror = () => reject(new Error("剧情脚本加载失败：" + file));
        document.head.append(script);
      });
    }
    const enterStory = window.WhiteLamp?.story?.enterStory;
    if (typeof enterStory !== "function") throw new Error("剧情引擎入口不可用。");
    return enterStory;
  })();
  return pending;
}

