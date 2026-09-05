/*
 * puzzle-view.js — 拼图占位视图(渲染 + 交互)
 *
 * 边界：
 * - 本文件属于小游戏模块内部的「可替换视图层」；
 * - 负责画占位网格/拼块、处理拖拽与点击两种放置方式、播放锁定/回弹动画；
 * - 不 import adapter、不 import 契约常量 —— 它不知道剧情与契约的存在；
 * - 判定答案通过注入的 onPlace(pieceId, slotId) 回调向「上层」询问，
 *   由 core 裁决后把结果返回给视图播放。视图本身不持有正确答案。
 *
 * 无缝拼合(本次调整)：
 * - 视图动态生成一张「占位原图」(canvas)，再把它按网格坐标切成 N 个切片；
 * - 每块拼图显示的正是该位置上的原图切片 —— 玩家靠图案把块放回原位；
 * - 拼块/槽位本身没有边框或圆角，全部锁定后即还原为一张无缝的完整图。
 * - 后续换正式画风：传入真实图片 URL 即可(见 mountPuzzle 的 artworkUrl)。
 */

/** 占位原图的每格边长(px)。只决定画布清晰度，与屏幕显示尺寸无关。 */
const ART_CELL = 240;

/**
 * 生成一张「占位地图原图」。
 * 绘制内容故意横跨多个格子(河流、山形、建筑)，让玩家能通过连续图案拼合。
 * @param {number} cols
 * @param {number} rows
 * @returns {string} dataURL
 */
function makeArtwork(cols, rows) {
  const width = cols * ART_CELL;
  const height = rows * ART_CELL;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");

  // 底色：about 同款深灰黑
  ctx.fillStyle = "#121614";
  ctx.fillRect(0, 0, width, height);

  // 极淡的网格参考线(仅占位帮助对齐，正式图不画)
  ctx.strokeStyle = "rgba(239,239,227,0.06)";
  ctx.lineWidth = 1;
  for (let c = 1; c < cols; c += 1) {
    ctx.beginPath();
    ctx.moveTo(c * ART_CELL, 0);
    ctx.lineTo(c * ART_CELL, height);
    ctx.stroke();
  }
  for (let r = 1; r < rows; r += 1) {
    ctx.beginPath();
    ctx.moveTo(0, r * ART_CELL);
    ctx.lineTo(width, r * ART_CELL);
    ctx.stroke();
  }

  // 贯穿整图的“河流”(紫灰渐变带)：任何切块都包含它的一部分，是拼合的主线索
  ctx.strokeStyle = "rgba(120,137,255,0.5)";
  ctx.lineWidth = 30;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(-40, height * 0.28);
  ctx.bezierCurveTo(width * 0.25, height * 0.38, width * 0.7, height * 0.12, width + 40, height * 0.32);
  ctx.stroke();
  ctx.strokeStyle = "rgba(120,137,255,0.12)";
  ctx.lineWidth = 56;
  ctx.beginPath();
  ctx.moveTo(-40, height * 0.28);
  ctx.bezierCurveTo(width * 0.25, height * 0.38, width * 0.7, height * 0.12, width + 40, height * 0.32);
  ctx.stroke();

  // 三块“山形”色斑：散落在不同格，帮助定位
  const hills = [
    { x: 0.22, y: 0.62, s: 0.5, tone: "rgba(90,140,120,0.35)" },
    { x: 0.55, y: 0.82, s: 0.34, tone: "rgba(110,110,160,0.35)" },
    { x: 0.82, y: 0.5, s: 0.42, tone: "rgba(150,120,90,0.32)" }
  ];
  hills.forEach(({ x, y, s, tone }) => {
    ctx.fillStyle = tone;
    ctx.beginPath();
    ctx.ellipse(x * width, y * height, s * ART_CELL, s * ART_CELL * 0.72, 0, 0, Math.PI * 2);
    ctx.fill();
  });

  // 几栋小建筑/树(占位符号)，进一步打破重复感
  ctx.fillStyle = "rgba(230,230,220,0.4)";
  [[0.38, 0.42], [0.66, 0.66], [0.16, 0.18]].forEach(([fx, fy]) => {
    const x = fx * width;
    const y = fy * height;
    const s = ART_CELL * 0.16;
    ctx.fillRect(x - s / 2, y - s / 2, s, s * 0.6);
  });

  return canvas.toDataURL("image/png");
}

/* 自动注入自身样式表：宿主页面无需手动 <link>，视图自包含。 */
let styleInjected = false;
function ensureStyle() {
  if (styleInjected) return;
  styleInjected = true;
  const cssUrl = new URL("./puzzle-view.css", import.meta.url).href;
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = cssUrl;
  link.dataset.pzStyle = "puzzle-view";
  document.head.appendChild(link);
}

/**
 * 把「整图切成第 col 列、第 row 行的一块」所需的背景定位算出来。
 * CSS background-position 百分比公式：
 *   position% 把背景图上同比例的点对准容器同比例的点，
 *   因此第 i 格(cols 等分)使用 i/(cols-1)*100% 即可。
 * @param {number} index 0-based
 * @param {number} total 等分数
 * @returns {string} 例如 "50%"
 */
function slicePosition(index, total) {
  if (total <= 1) return "0%";
  return `${(index / (total - 1)) * 100}%`;
}

/**
 * 从语义 id 解析网格坐标。id 由 core 按 row-major 生成，例如 slot-2-3。
 * @param {string} id 形如 prefix-r-c
 * @returns {{ col: number, row: number }} 0-based 坐标
 */
function coordFromId(id) {
  const [, rowPart, colPart] = id.split("-");
  return { row: Number(rowPart) - 1, col: Number(colPart) - 1 };
}

/**
 * 挂载一局拼图视图。
 *
 * @param {HTMLElement} container
 * @param {Object} options
 * @param {Object} options.level         关卡定义(core 产出): rows/cols/slotIds/pieceIds
 * @param {string[]} options.pieceOrder  待放区拼块展示顺序(core 洗牌结果)
 * @param {{pieceId:string,slotId:string}[]} [options.lockedPairs] 已锁定的语义对(读档恢复用)
 * @param {string} [options.artworkUrl]  正式原图 URL；缺省用 canvas 生成的占位图
 * @param {(pieceId:string, slotId:string) => Object} options.onPlace
 *    放置询问回调，返回 core 判定结果 { ok, locked, completed }
 * @param {() => void} [options.onSolved]  全部锁定完成
 * @param {() => void} [options.onCancelled] 玩家点“放弃”
 * @returns {{ destroy: () => void }}
 */
export function mountPuzzle(container, options) {
  const { level, pieceOrder, lockedPairs = [], artworkUrl, onPlace, onSolved, onCancelled } = options;

  ensureStyle();

  const { rows, cols } = level;
  // 整图切片背景：每个槽/拼块共用同一张原图，只是裁切位置不同
  const artwork = artworkUrl ?? makeArtwork(cols, rows);

  // 取某格背景样式：把原图按 rows*cols 等分后，显示第 row/col 片
  const pieceStyleFor = (row, col) => ({
    backgroundImage: `url("${artwork}")`,
    backgroundSize: `${cols * 100}% ${rows * 100}%`,
    backgroundPosition: `${slicePosition(col, cols)} ${slicePosition(row, rows)}`,
    backgroundRepeat: "no-repeat"
  });

  /* ---------- 构建 DOM ---------- */
  const root = document.createElement("div");
  root.className = "pz-root";

  // 标题行：拼图名称(占位) + 放弃按钮
  const header = document.createElement("div");
  header.className = "pz-header";
  header.innerHTML = `
    <div class="pz-header__title">RECONSTRUCT / MAP PUZZLE</div>
    <button type="button" class="pz-cancel" data-action="cancel">GIVE UP</button>
  `;

  // 中央网格槽区：槽本身不占拼图内容，只是“放置格”
  const board = document.createElement("div");
  board.className = "pz-board";
  board.style.gridTemplateColumns = `repeat(${cols}, var(--pz-cell-size))`;
  const slotEls = new Map(); // slotId -> element
  level.slotIds.forEach((slotId) => {
    const { row, col } = coordFromId(slotId);
    const slot = document.createElement("div");
    slot.className = "pz-slot";
    slot.dataset.slotId = slotId;
    // 空位提示序号(正式画风替换时删除)
    const hint = document.createElement("span");
    hint.className = "pz-slot__hint";
    hint.textContent = `${row * cols + col + 1}`;
    slot.appendChild(hint);
    board.appendChild(slot);
    slotEls.set(slotId, slot);
  });

  // 待放区(托盘)：散块显示原图对应切片
  const tray = document.createElement("div");
  tray.className = "pz-tray";
  const pieceEls = new Map(); // pieceId -> element

  const makePieceEl = (pieceId) => {
    const { row, col } = coordFromId(pieceId);
    const piece = document.createElement("div");
    piece.className = "pz-piece";
    piece.dataset.pieceId = pieceId;
    Object.assign(piece.style, pieceStyleFor(row, col));
    piece.title = `piece: ${row + 1}x${col + 1}`; // 悬停可核对坐标(调试用)
    return piece;
  };

  pieceOrder.forEach((pieceId) => {
    const piece = makePieceEl(pieceId);
    tray.appendChild(piece);
    pieceEls.set(pieceId, piece);
  });

  // 状态行
  const status = document.createElement("div");
  status.className = "pz-status";

  root.append(header, board, tray, status);
  container.appendChild(root);

  /* ---------- 内部状态 ---------- */
  let lockedCount = lockedPairs.length;
  let completed = false;
  let selectedPieceId = null;   // 点击模式选中的块
  let dragPieceId = null;       // 正在拖拽的块
  let suppressNextClick = false; // pointerup 已把“点击”消费掉，阻止 click 二次触发

  const syncStatus = () => {
    status.textContent = `LOCKED ${lockedCount} / ${level.pieceIds.length}`;
  };

  // 已有锁定(读档恢复场景)：直接把拼块放进对应槽
  lockedPairs.forEach(({ pieceId, slotId }) => {
    const pieceEl = pieceEls.get(pieceId);
    const slotEl = slotEls.get(slotId);
    if (pieceEl && slotEl) {
      settlePieceIntoSlot(pieceEl, slotEl);
      pieceEls.delete(pieceId);
    }
  });

  /* ---------- 放置逻辑(点击与拖拽共用) ---------- */
  function attemptPlace(pieceId, slotId) {
    if (completed) return;
    const result = onPlace(pieceId, slotId);
    const pieceEl = pieceEls.get(pieceId);
    const slotEl = slotEls.get(slotId);
    if (!pieceEl || !slotEl) return;

    if (result && result.ok && result.locked) {
      // 正确：把块从托盘移到槽内锁定，此时无边框 → 与相邻块无缝
      pieceEls.delete(pieceId);
      settlePieceIntoSlot(pieceEl, slotEl);
      lockedCount += 1;
      syncStatus();

      if (result.completed) {
        completed = true;
        showDone();
        onSolved?.();
      }
    } else if (result && result.ok && !result.locked) {
      // 错误：拼块回弹一次
      bouncePieceBack(pieceEl);
    }
    // result.ok === false：非法目标，静默忽略(debug 可 console.warn)
  }

  function settlePieceIntoSlot(pieceEl, slotEl) {
    pieceEl.classList.remove("pz-piece--dragging", "pz-piece--selected");
    slotEl.innerHTML = "";             // 清掉空位提示序号
    slotEl.appendChild(pieceEl);
    slotEl.classList.add("pz-slot--filled");
  }

  function showDone() {
    const done = document.createElement("div");
    done.className = "pz-done";
    done.textContent = "PUZZLE RESTORED // 地图已复原";
    root.insertBefore(done, tray);
  }

  /* ---------- 点击模式: 先选块, 再点槽 ---------- */
  function handlePieceClick(pieceId) {
    if (completed) return;
    if (!pieceEls.has(pieceId)) return; // 已经锁定的块不可再选

    // 切换选中
    if (selectedPieceId === pieceId) {
      selectedPieceId = null;
      pieceEls.get(pieceId).classList.remove("pz-piece--selected");
      return;
    }
    // 取消旧的选中
    if (selectedPieceId && pieceEls.has(selectedPieceId)) {
      pieceEls.get(selectedPieceId).classList.remove("pz-piece--selected");
    }
    selectedPieceId = pieceId;
    pieceEls.get(pieceId).classList.add("pz-piece--selected");
  }

  function handleSlotClick(slotId) {
    if (!selectedPieceId) return;
    const pieceId = selectedPieceId;
    selectedPieceId = null;
    if (pieceEls.has(pieceId)) {
      pieceEls.get(pieceId).classList.remove("pz-piece--selected");
    }
    attemptPlace(pieceId, slotId);
  }

  /* ---------- 拖拽模式(Pointer Events, 鼠标/触屏统一) ---------- */
  function onPointerDown(event) {
    const pieceEl = event.target.closest(".pz-piece");
    if (!pieceEl || completed) return;
    const pieceId = pieceEl.dataset.pieceId;
    if (!pieceEls.has(pieceId)) return; // 已锁定的块

    // 如果正处于点击选中, 清掉
    if (selectedPieceId) {
      const prev = pieceEls.get(selectedPieceId);
      prev?.classList.remove("pz-piece--selected");
      selectedPieceId = null;
    }

    dragPieceId = pieceId;
    pieceEl.setPointerCapture?.(event.pointerId);
    pieceEl.classList.add("pz-piece--dragging");

    // 记录起点, 以便判定“算拖拽还是算点击”
    pieceEl.dataset.dragStartX = String(event.clientX);
    pieceEl.dataset.dragStartY = String(event.clientY);
  }

  function onPointerMove(event) {
    if (!dragPieceId || !pieceEls.has(dragPieceId)) return;
    const pieceEl = pieceEls.get(dragPieceId);

    // 拖拽跟手: 直接以指针位置为中心(占位简化, 不精确计算 offset)
    const rect = pieceEl.getBoundingClientRect();
    const x = event.clientX - rect.width / 2;
    const y = event.clientY - rect.height / 2;
    pieceEl.style.position = "fixed";
    pieceEl.style.left = `${x}px`;
    pieceEl.style.top = `${y}px`;
    pieceEl.style.margin = "0";
    // 拖出托盘时不参与 flex 布局占位
    pieceEl.style.pointerEvents = "none";
  }

  function resetDraggedPiece() {
    if (!dragPieceId) return;
    const pieceEl = pieceEls.get(dragPieceId);
    dragPieceId = null;
    if (!pieceEl) return;
    pieceEl.classList.remove("pz-piece--dragging");
    pieceEl.style.position = "";
    pieceEl.style.left = "";
    pieceEl.style.top = "";
    pieceEl.style.margin = "";
    pieceEl.style.pointerEvents = "";
    delete pieceEl.dataset.dragStartX;
    delete pieceEl.dataset.dragStartY;
  }

  function onPointerCancel() {
    resetDraggedPiece();
  }

  function onPointerUp(event) {
    if (!dragPieceId) return;
    const pieceId = dragPieceId;
    dragPieceId = null;

    const pieceEl = pieceEls.get(pieceId);
    if (!pieceEl) return;

    // 清理拖拽样式
    pieceEl.classList.remove("pz-piece--dragging");
    pieceEl.style.position = "";
    pieceEl.style.left = "";
    pieceEl.style.top = "";
    pieceEl.style.margin = "";
    pieceEl.style.pointerEvents = "";

    // 判断落点槽位
    const startX = Number(pieceEl.dataset.dragStartX);
    const startY = Number(pieceEl.dataset.dragStartY);
    delete pieceEl.dataset.dragStartX;
    delete pieceEl.dataset.dragStartY;

    const moved = Math.hypot(event.clientX - startX, event.clientY - startY) > 6;
    if (!moved) {
      // 几乎没移动 → 视为“点击选中”，走点击模式。
      // 置位抑制标志，避免紧随其后的原生 click 再触发一次 toggle。
      suppressNextClick = true;
      handlePieceClick(pieceId);
      return;
    }

    // 命中检测: 用指针位置找最上层元素
    const hit = document.elementFromPoint(event.clientX, event.clientY);
    const slotEl = hit?.closest(".pz-slot");
    if (slotEl) {
      attemptPlace(pieceId, slotEl.dataset.slotId);
    } else {
      // 没放到任何槽: 自动回弹
      bouncePieceBack(pieceEl);
    }
  }

  function bouncePieceBack(pieceEl) {
    pieceEl.classList.remove("pz-piece--reject");
    void pieceEl.offsetWidth; // 强制 reflow，使动画能重复播放
    pieceEl.classList.add("pz-piece--reject");
  }

  /* ---------- 事件绑定(全部委托到 root, 便于卸载, 多实例互不干扰) ---------- */
  root.addEventListener("pointerdown", onPointerDown);
  root.addEventListener("pointermove", onPointerMove);
  root.addEventListener("pointerup", onPointerUp);
  root.addEventListener("pointercancel", onPointerCancel);

  function onClick(event) {
    // 如果这次点击已由 pointerup 消费(未移动的“点击选中”)，直接跳过。
    if (suppressNextClick) {
      suppressNextClick = false;
      return;
    }

    const cancelBtn = event.target.closest("[data-action='cancel']");
    if (cancelBtn) {
      onCancelled?.();
      return;
    }
    // 点击模式: 点击拼块或槽位
    const pieceEl = event.target.closest(".pz-piece");
    if (pieceEl && pieceEls.has(pieceEl.dataset.pieceId)) {
      handlePieceClick(pieceEl.dataset.pieceId);
      return;
    }
    const slotEl = event.target.closest(".pz-slot");
    if (slotEl) {
      handleSlotClick(slotEl.dataset.slotId);
    }
  }
  root.addEventListener("click", onClick);

  syncStatus();

  /* ---------- 卸载 ---------- */
  return {
    destroy() {
      resetDraggedPiece();
      root.removeEventListener("pointerdown", onPointerDown);
      root.removeEventListener("pointermove", onPointerMove);
      root.removeEventListener("pointerup", onPointerUp);
      root.removeEventListener("pointercancel", onPointerCancel);
      root.removeEventListener("click", onClick);
      root.remove();
    }
  };
}

