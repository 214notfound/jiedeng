/*
 * puzzle-core.js — 拼图核心(规则与状态)
 *
 * 边界：
 * - 本文件属于小游戏模块内部，只回答「拼图放得对不对、完成没有」；
 * - 不包含任何 DOM / CSS / 动画代码；
 * - 不 import 契约常量、不产生契约事件（那是 adapter 的职责）；
 * - 不读写 localStorage / 存档（进度由状态模块通过 serialize/restore 搬运）。
 *
 * 关键设计：拼块与槽位只用「语义 ID」关联（pieceId -> slotId），
 * 不用像素坐标，因此天然满足接口约定 5.2「检查点不得保存棋子/图片坐标」。
 */

/**
 * 创建一局拼图的关卡定义。
 * 网格按 row-major 编号：第 r 行第 c 列的槽位 id 为 `slot-r-c`。
 *
 * @param {Object} config
 * @param {number} config.rows          行数（如 3）
 * @param {number} config.cols          列数（如 3）
 * @param {Object} [config.correctMap]  可选：pieceId -> slotId 的覆盖映射；
 *                                      缺省时按顺序一一对应（第 1 块放第 1 格…）。
 * @returns {{
 *   rows: number,
 *   cols: number,
 *   slotIds: string[],
 *   pieceIds: string[],
 *   correctMap: Record<string,string>
 * }}
 */
export function createPuzzleLevel({ rows, cols, correctMap }) {
  if (!Number.isInteger(rows) || !Number.isInteger(cols) || rows <= 0 || cols <= 0) {
    throw new Error(`[puzzle-core] rows/cols 必须是正整数, 收到 rows=${rows}, cols=${cols}`);
  }

  const slotIds = [];
  const pieceIds = [];
  for (let r = 1; r <= rows; r += 1) {
    for (let c = 1; c <= cols; c += 1) {
      slotIds.push(`slot-${r}-${c}`);
      pieceIds.push(`piece-${r}-${c}`);
    }
  }

  const generated = Object.fromEntries(
    pieceIds.map((pieceId, index) => [pieceId, slotIds[index]])
  );

  const resolvedMap = correctMap ?? generated;
  if (!resolvedMap || typeof resolvedMap !== "object" || Array.isArray(resolvedMap)) {
    throw new Error("[puzzle-core] correctMap 必须是对象");
  }
  const mappedPieceIds = Object.keys(resolvedMap);
  if (
    mappedPieceIds.length !== pieceIds.length ||
    mappedPieceIds.some((pieceId) => !pieceIds.includes(pieceId)) ||
    pieceIds.some((pieceId) => !Object.hasOwn(resolvedMap, pieceId))
  ) {
    throw new Error("[puzzle-core] correctMap 必须完整覆盖当前关卡的全部拼块");
  }
  const mappedSlotIds = Object.values(resolvedMap);
  if (
    mappedSlotIds.some((slotId) => !slotIds.includes(slotId)) ||
    new Set(mappedSlotIds).size !== mappedSlotIds.length
  ) {
    throw new Error("[puzzle-core] correctMap 包含未知或重复槽位");
  }

  return {
    rows,
    cols,
    slotIds,
    pieceIds,
    correctMap: { ...resolvedMap }
  };
}

/**
 * 洗牌：返回打乱后的拼块 id 列表，用于「待放区」展示顺序。
 * rng 可注入（便于测试复现）；缺省用 Math.random。
 *
 * @param {string[]} pieceIds
 * @param {() => number} [rng]
 * @returns {string[]}
 */
export function shufflePieceIds(pieceIds, rng = Math.random) {
  const result = [...pieceIds];
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/**
 * 创建一局会话状态。任何一次放置都以该对象为唯一事实来源。
 *
 * @param {ReturnType<typeof createPuzzleLevel>} level
 * @param {Object} [options]
 * @param {string[]} [options.pieceOrder]  待放区展示顺序；缺省自动洗牌
 * @returns {{
 *   level: typeof level,
 *   placed: Record<string,string>,   // pieceId -> slotId（已正确放置的锁定对）
 *   total: number,
 *   lockedCount: number
 * }}
 */
export function createPuzzleSession(level, { pieceOrder } = {}) {
  const resolvedOrder = pieceOrder ?? shufflePieceIds(level.pieceIds);
  if (
    !Array.isArray(resolvedOrder) ||
    resolvedOrder.length !== level.pieceIds.length ||
    new Set(resolvedOrder).size !== resolvedOrder.length ||
    resolvedOrder.some((pieceId) => !level.pieceIds.includes(pieceId))
  ) {
    throw new Error("[puzzle-core] pieceOrder 必须完整且不能包含重复或未知拼块");
  }
  return {
    level,
    placed: {},                                  // pieceId -> slotId
    total: level.pieceIds.length,
    lockedCount: 0,
    pieceOrder: [...resolvedOrder]
  };
}

/**
 * 尝试把一块拼图放到一个槽位。
 * 这是唯一允许修改会话状态的入口，规则只有一条：
 *   若 pieceId 的目标槽位 === slotId，则锁定；否则不锁定。
 *
 * @param {ReturnType<typeof createPuzzleSession>} session
 * @param {string} pieceId
 * @param {string} slotId
 * @returns {{ ok: boolean, locked: boolean, completed: boolean, reason?: string }}
 *   - ok=false          拼块/槽位非法，或拼块已放置
 *   - locked=true       放置正确并新锁定（ok 必为 true）
 *   - locked=false      放置错误，未锁定（ok 仍为 true，交给 UI 做回弹）
 *   - completed         本次锁定后是否恰好全部完成
 */
export function tryPlacePiece(session, pieceId, slotId) {
  const { level, placed } = session;

  if (!level.pieceIds.includes(pieceId)) {
    return { ok: false, locked: false, completed: false, reason: "unknown-piece" };
  }
  if (!level.slotIds.includes(slotId)) {
    return { ok: false, locked: false, completed: false, reason: "unknown-slot" };
  }
  if (placed[pieceId] !== undefined) {
    return { ok: false, locked: false, completed: false, reason: "already-placed" };
  }

  const correct = level.correctMap[pieceId] === slotId;
  if (!correct) {
    // 语义正确：请求合法但放错位置；UI 应把拼块弹回待放区。
    return { ok: true, locked: false, completed: false };
  }

  placed[pieceId] = slotId;
  session.lockedCount += 1;
  const completed = session.lockedCount === session.total;
  return { ok: true, locked: true, completed };
}

/**
 * 判断整局是否完成（全部锁定）。
 * @param {ReturnType<typeof createPuzzleSession>} session
 * @returns {boolean}
 */
export function isPuzzleCompleted(session) {
  return session.lockedCount === session.total;
}

/**
 * 导出进度：只保留「已锁定的语义对」，不含任何坐标/DOM 信息。
 * 供状态/存档模块在需要时保存小游戏自己的进度（契约 5.2）。
 *
 * @param {ReturnType<typeof createPuzzleSession>} session
 * @returns {{ pieceId: string, slotId: string }[]}
 */
export function serializePuzzleProgress(session) {
  return Object.entries(session.placed).map(([pieceId, slotId]) => ({ pieceId, slotId }));
}

/**
 * 从存档进度恢复：把已锁定的语义对重新写回会话。
 * 不做任何持久化，只负责「把别人交来的进度放回内存」。
 *
 * @param {ReturnType<typeof createPuzzleSession>} session
 * @param {{ pieceId: string, slotId: string }[]} pairs
 */
export function restorePuzzleProgress(session, pairs = []) {
  const { level } = session;
  pairs.forEach(({ pieceId, slotId }) => {
    // 只接受「确实是正确映射」的对，防止脏存档污染状态。
    if (level.correctMap[pieceId] === slotId && session.placed[pieceId] === undefined) {
      session.placed[pieceId] = slotId;
      session.lockedCount += 1;
    }
  });
}

