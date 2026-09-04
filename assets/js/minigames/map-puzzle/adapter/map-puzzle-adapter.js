/*
 * map-puzzle-adapter.js — 小游戏模块对剧情/协调器的「唯一出口」
 *
 * 边界（严格遵守两份团队文档）：
 * - 只负责三件事：接收并校验 REQUEST_MINIGAME 命令、装配 core+view 跑一局、
 *   在成功/取消/失败时按契约格式组装外部事件交给协调器；
 * - 绝不传 nextNodeId、绝不改 currentNodeId、绝不写状态与存档、
 *   绝不决定「事实是否被接受」（那是状态模块与剧情模块的职责）。
 *
 * 依赖方向：本文件允许 import core（规则）与 view（渲染），
 * view 只通过这里注入的 onPlace 回调与 core 对话（依赖倒置，view 不 import core）。
 */

import {
  MINIGAME_ID,
  SUCCESS_FACT_ID,
  EVENT_TYPE_COMPLETED,
  EVENT_TYPE_CANCELLED,
  EVENT_TYPE_FAILED,
  EVENT_SOURCE,
  COMMAND_TYPE
} from "./contract-constants.js";
import { createPuzzleLevel, createPuzzleSession, tryPlacePiece, isPuzzleCompleted } from "../core/puzzle-core.js";
import { mountPuzzle } from "../view/puzzle-view.js";

let eventSequence = 0;

/**
 * 创建 map-puzzle 小游戏适配器。
 *
 * @param {Object} deps
 * @param {HTMLElement} deps.container     挂载拼图视图的容器
 * @param {(event: Object) => void} deps.onEvent  把外部事件交给协调器的回调
 * @param {() => string} [deps.createEventId]     eventId 工厂，用于保证事件唯一
 * @param {Object} [deps.level]            可选：直接传入关卡定义（默认 3×3）
 * @param {Function} [deps.mountView]       可选：视图工厂（测试或替换渲染器）
 * @returns {{
 *   start: (command: Object) => void,
 *   cancel: () => void,
 *   fail: (errorCode: string) => void,
 *   destroy: () => void
 * }}
 */
export function createMapPuzzleAdapter({ container, onEvent, createEventId, level, mountView = mountPuzzle }) {
  if (!container || typeof container.appendChild !== "function") {
    throw new TypeError("[map-puzzle] container 必须是可挂载的 DOM 容器");
  }
  if (typeof onEvent !== "function") {
    throw new TypeError("[map-puzzle] onEvent 必须是函数");
  }
  if (createEventId !== undefined && typeof createEventId !== "function") {
    throw new TypeError("[map-puzzle] createEventId 必须是函数");
  }
  if (typeof mountView !== "function") {
    throw new TypeError("[map-puzzle] mountView 必须是函数");
  }

  // —— 内部运行句柄：一局只允许一个活动会话 ——
  let session = null;          // core 会话
  let activeCommand = null;    // 正在执行的剧情命令（用于回填 causedByCommandId）
  let viewApi = null;          // view 暴露的销毁句柄
  let finished = false;        // 已完成上报后拒绝取消等后续请求

  const defaultEventId = () => `evt-${MINIGAME_ID}-${Date.now()}-${eventSequence++}`;
  const nextEventId = createEventId ?? defaultEventId;

  function requireEventId() {
    const eventId = nextEventId();
    if (typeof eventId !== "string" || eventId.trim() === "") {
      throw new Error("[map-puzzle] eventId 生成失败");
    }
    return eventId;
  }

  /** 校验命令是否符合契约；不合法直接抛错（由协调器决定如何处理）。 */
  function assertValidCommand(command) {
    if (!command || typeof command !== "object") {
      throw new Error(`[map-puzzle] 命令缺失: ${JSON.stringify(command)}`);
    }
    if (command.commandType !== COMMAND_TYPE) {
      throw new Error(
        `[map-puzzle] 期望 ${COMMAND_TYPE}, 收到 ${command.commandType}`
      );
    }
    if (typeof command.commandId !== "string" || command.commandId.trim() === "") {
      throw new Error("[map-puzzle] commandId 缺失或无效");
    }
    const payload = command.payload ?? {};
    if (payload.minigameId !== MINIGAME_ID) {
      throw new Error(
        `[map-puzzle] 期望 minigameId=${MINIGAME_ID}, 收到 ${payload.minigameId}`
      );
    }
    if (payload.successFactId !== SUCCESS_FACT_ID) {
      // 契约 6.4 允许剧情声明 successFactId；V1 事实登记表里 minigame
      // 唯一能产生的事实就是 map-puzzle-completed，不一致视为命令错误。
      throw new Error(
        `[map-puzzle] successFactId 与 V1 事实登记不符: ${payload.successFactId}`
      );
    }
  }

  /**
   * 启动一局。收到协调器转发的 REQUEST_MINIGAME 命令后调用。
   * @param {Object} command 契约命令，至少含 commandId/commandType/payload
   */
  function start(command) {
    assertValidCommand(command);

    // 若上一局还在运行（如重复命令），先清场，避免叠层。
    teardown();

    const levelDef = level ?? createPuzzleLevel({ rows: 3, cols: 3 });
    session = createPuzzleSession(levelDef);
    activeCommand = command;
    finished = false;

    viewApi = mountView(container, {
      level: levelDef,
      pieceOrder: session.pieceOrder,
      // V1 只恢复剧情的原 commandId，不把拼图坐标或中间布局写入剧情检查点。
      lockedPairs: [],

      // view 把「玩家想放哪块到哪个槽」的意图交回来，
      // 判定永远走 core，view 不持有答案。
      onPlace: (pieceId, slotId) => tryPlacePiece(session, pieceId, slotId),

      onSolved: () => {
        if (!isPuzzleCompleted(session)) return;
        emitCompleted();
      },

      onCancelled: () => {
        // 玩家主动退出：交给协调器，剧情保留当前 Node。
        cancel();
      }
    });
  }

  /** 玩家主动取消（也可由外部 UI 调用）。完成后不可取消。 */
  function cancel() {
    if (!activeCommand || finished) return;
    emitCancelled();
    // 取消即退出本局：view 清场，等待协调器决定重试或离开。
    teardown();
  }

  /** 模块内部执行失败，需带契约可识别的错误码。 */
  function fail(errorCode) {
    if (!activeCommand || finished) return;
    if (typeof errorCode !== "string" || errorCode.trim() === "") {
      throw new Error("[map-puzzle] errorCode 缺失或无效");
    }
    onEvent({
      eventId: requireEventId(),
      eventType: EVENT_TYPE_FAILED,
      source: EVENT_SOURCE,
      causedByCommandId: activeCommand.commandId,
      resultFactIds: [],
      payload: { targetId: MINIGAME_ID, errorCode }
    });
    teardown();
  }

  /** 组装成功事件。resultFactIds 固定为登记事实（契约 4.2 / Node 清单 §5）。 */
  function emitCompleted() {
    if (!activeCommand || finished) return;
    finished = true;
    onEvent({
      eventId: requireEventId(),
      eventType: EVENT_TYPE_COMPLETED,
      source: EVENT_SOURCE,
      causedByCommandId: activeCommand.commandId,
      resultFactIds: [SUCCESS_FACT_ID],
      payload: { puzzleId: MINIGAME_ID }
    });
    // 注意：成功后不 teardown——留下「已完成」画面，
    // 由协调器在收到事件、完成状态提交后决定何时 destroy() 进入下一幕。
  }

  /** 组装取消事件：resultFactIds 必须为空数组（契约 4.3）。 */
  function emitCancelled() {
    if (!activeCommand || finished) return;
    onEvent({
      eventId: requireEventId(),
      eventType: EVENT_TYPE_CANCELLED,
      source: EVENT_SOURCE,
      causedByCommandId: activeCommand.commandId,
      resultFactIds: [],
      payload: { targetId: MINIGAME_ID }
    });
  }

  function teardown() {
    if (viewApi) {
      viewApi.destroy();
      viewApi = null;
    }
    session = null;
    activeCommand = null;
    finished = false;
  }

  function destroy() {
    teardown();
  }

  return { start, cancel, fail, destroy };
}
