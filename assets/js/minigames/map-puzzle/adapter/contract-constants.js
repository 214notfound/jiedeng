/*
 * contract-constants.js — 与剧情模块交互的全部契约常量
 *
 * 目的：把「从两份团队文档抄来的固定值」集中在一处，
 * 便于对照《剧情模块接口约定.md》与《V1 剧情运行 Node 清单.md》逐项审核。
 * adapter 只从这里取值，不散落魔法字符串。
 *
 * 出处说明（开发时核对依据）：
 * - minigameId / puzzleId  ：Node 清单 §2「小游戏 ID」= map-puzzle
 * - successFactId / 事实   ：Node 清单 §5 事实登记表 = map-puzzle-completed
 *                            （唯一产生模块 = minigame，产生时机 = map-puzzle 成功判定完成）
 * - 成功事件类型            ：接口约定 §4.3 外部事件登记表 = MAP_PUZZLE_COMPLETED
 * - 取消 / 失败事件         ：接口约定 §4.3 = EXTERNAL_INTERACTION_CANCELLED / _FAILED
 * - source                 ：接口约定 §4.2 示例 = "minigame"（模块 ID，仅追踪用）
 * - commandType            ：接口约定 §6.4 命令表 = REQUEST_MINIGAME
 */

/** 剧情等待的本小游戏 ID（Node 清单：`map-puzzle`）。 */
export const MINIGAME_ID = "map-puzzle";

/** 成功后向状态模块声明的唯一事实 ID（事实登记表，minigame 为唯一产生者）。 */
export const SUCCESS_FACT_ID = "map-puzzle-completed";

/** 成功完成时上报的事件类型（接口约定外部事件表）。 */
export const EVENT_TYPE_COMPLETED = "MAP_PUZZLE_COMPLETED";

/** 玩家主动退出时上报的事件类型（resultFactIds 必须为空）。 */
export const EVENT_TYPE_CANCELLED = "EXTERNAL_INTERACTION_CANCELLED";

/** 模块内部执行失败时上报的事件类型（resultFactIds 必须为空）。 */
export const EVENT_TYPE_FAILED = "EXTERNAL_INTERACTION_FAILED";

/** 产生事件的模块 ID（仅用于追踪，不参与剧情分支）。 */
export const EVENT_SOURCE = "minigame";

/** 本模块接收的剧情命令类型（接口约定 §6.4）。 */
export const COMMAND_TYPE = "REQUEST_MINIGAME";

