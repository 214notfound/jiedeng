// 转场效果：监听剧情文本渲染结果，在约定台词处触发闪黑 / 抖动 / 无信号花屏。
// 自包含实现：不改动渲染内核（game-ui.js）与剧情数据，只观察 #game-story 的 .story-block 文本。
(function registerTransitions(global) {
  "use strict";

  if (global.__whiteLampTransitions) return;
  global.__whiteLampTransitions = true;

  const scene = document.getElementById("game-scene");
  const story = document.getElementById("game-story");
  if (!scene || !story || typeof MutationObserver !== "function") return;

  // —— 遮罩层结构 ——
  const overlay = document.createElement("div");
  overlay.className = "wl-transition";
  overlay.setAttribute("aria-hidden", "true");
  const black = document.createElement("div");
  black.className = "wl-transition__black";
  const red = document.createElement("div");
  red.className = "wl-transition__red";
  const noise = document.createElement("canvas");
  noise.className = "wl-transition__noise";
  overlay.append(black, red, noise);
  scene.appendChild(overlay);

  // —— 雪花：每 70ms 重画一帧随机噪点 ——
  const nctx = noise.getContext("2d");
  function renderNoise() {
    const w = noise.width = Math.max(2, Math.floor(scene.clientWidth / 4));
    const h = noise.height = Math.max(2, Math.floor(scene.clientHeight / 4));
    const img = nctx.createImageData(w, h);
    const d = img.data;
    for (let i = 0; i < d.length; i += 4) {
      const v = (Math.random() * 255) | 0;
      d[i] = d[i + 1] = d[i + 2] = v;
      d[i + 3] = 255;
    }
    nctx.putImageData(img, 0, 0);
  }

  // —— 时间轴与清理 ——
  let timers = [];
  let staticTimer = null;
  let rafId = null;
  function later(fn, ms) {
    const timer = setTimeout(fn, ms);
    timers.push(timer);
    return timer;
  }
  function reset() {
    timers.forEach(clearTimeout);
    timers = [];
    if (staticTimer) {
      clearInterval(staticTimer);
      staticTimer = null;
    }
    if (rafId) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
    overlay.className = "wl-transition";
    overlay.setAttribute("aria-hidden", "true");
    noise.style.clipPath = "";
    noise.style.opacity = "";
    scene.classList.remove("wl-scene-flicker", "wl-scene-shake");
  }

  const fx = {
    // 闪黑：heavy 为窒息式（灯闪→黑漫上→红晕喘→慢退），否则为轻版（快速压黑再淡出）。
    flashBlack(heavy) {
      reset();
      if (!heavy) {
        overlay.classList.add("is-flash");
        overlay.removeAttribute("aria-hidden");
        later(reset, 900);
        return;
      }
      scene.classList.add("wl-scene-flicker");
      later(() => {
        overlay.classList.add("is-creeping");
        overlay.removeAttribute("aria-hidden");
        later(() => {
          overlay.classList.add("is-pulsing");
          later(() => {
            overlay.classList.remove("is-creeping", "is-pulsing");
            overlay.classList.add("is-fading");
            later(reset, 1500);
          }, 1000);
        }, 550);
      }, 260);
    },

    // 暴力抖动：大位移 + 旋转 + 模糊
    shake() {
      reset();
      scene.classList.remove("wl-scene-shake");
      void scene.offsetWidth;
      scene.classList.add("wl-scene-shake");
      later(() => scene.classList.remove("wl-scene-shake"), 650);
    },

    // 无信号花屏：先在一处花屏，再扩散到全屏；退出时慢慢缩回那一点并淡出
    staticNoise() {
      reset();
      renderNoise();
      staticTimer = setInterval(renderNoise, 70);
      overlay.classList.add("is-static");
      overlay.removeAttribute("aria-hidden");
      const seedX = 15 + Math.random() * 70; // 随机起始点（%）
      const seedY = 15 + Math.random() * 70;
      const grow = 650, hold = 650, fade = 800;
      noise.style.opacity = "0";
      const t0 = performance.now();
      function growStep(now) {
        const t = Math.min(1, (now - t0) / grow);
        const e = 1 - Math.pow(1 - t, 3); // 扩散先快后慢
        noise.style.clipPath = "circle(" + (e * 150).toFixed(1) + "% at " + seedX + "% " + seedY + "%)";
        noise.style.opacity = String(Math.min(1, t * 2.5));
        if (t < 1) {
          rafId = requestAnimationFrame(growStep);
        } else {
          later(shrinkStep, hold);
        }
      }
      function shrinkStep() {
        const t1 = performance.now();
        function step(now) {
          const t = Math.min(1, (now - t1) / fade);
          const e = t * t; // 收束先慢后快
          noise.style.clipPath = "circle(" + ((1 - e) * 150).toFixed(1) + "% at " + seedX + "% " + seedY + "%)";
          noise.style.opacity = String(Math.max(0, 1 - t));
          if (t < 1) {
            rafId = requestAnimationFrame(step);
          } else {
            reset();
          }
        }
        rafId = requestAnimationFrame(step);
      }
      rafId = requestAnimationFrame(growStep);
    },

    // 抖动 + 闪黑（连招）：先抖，黑随即漫上，红晕喘后慢退
    shakeToBlack() {
      reset();
      scene.classList.add("wl-scene-shake");
      later(() => scene.classList.remove("wl-scene-shake"), 650);
      later(() => {
        overlay.classList.add("is-creeping");
        overlay.removeAttribute("aria-hidden");
        later(() => {
          overlay.classList.add("is-pulsing");
          later(() => {
            overlay.classList.remove("is-creeping", "is-pulsing");
            overlay.classList.add("is-fading");
            later(reset, 1500);
          }, 900);
        }, 550);
      }, 120);
    }
  };

  // —— 台词 → 转场 对照表（只引用文本，不改动剧情数据）——
  function has(text, needle) {
    return text.indexOf(needle) !== -1;
  }
  // 门外呼名的整句只是“陈晋年”加省略号，剥掉尾部标点后唯一匹配。
  function isDoorCall(text) {
    return text.trim().replace(/[…。·.]*$/u, "") === "陈晋年";
  }
  const triggers = [
    // M-2 苏禾录音
    { test: (t) => has(t, "按下播放"), run: () => fx.staticNoise() },
    { test: (t) => has(t, "一声闷响"), run: () => fx.shake() },
    { test: (t) => has(t, "说话的那个人，是我"), run: () => fx.flashBlack(true) },
    // O-2 玻璃反光 / A-1 录像
    { test: (t) => has(t, "你看不清自己的脸"), run: () => fx.flashBlack(false) },
    { test: (t) => has(t, "看不清脸"), run: () => fx.staticNoise() },
    { test: (t) => has(t, "你的手自己抬了起来"), run: () => fx.shake() },
    { test: (t) => has(t, "那个背影，是我"), run: () => fx.flashBlack(true) },
    // 身份重建
    { test: (t) => has(t, "正站在这里"), run: () => fx.flashBlack(true) },
    // 终局 / 老宅
    { test: (t) => has(t, "一声枪响"), run: () => fx.shakeToBlack() },
    { test: isDoorCall, run: () => fx.shake() },
    { test: (t) => has(t, "小周追了上来"), run: () => fx.shake() }
  ];

  // —— 监听剧情文本，合并同一次渲染的多次 DOM 变更后统一匹配 ——
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
