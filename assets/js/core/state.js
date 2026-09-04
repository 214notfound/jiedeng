
// 1.定义变量层
    // 定义初始游戏状态
export const SAVE_SCHEMA_VERSION = 1;

    //确定全局事件
export const GAME_EVENTS = Object.freeze({
    GAME_STARTED:"GAME_STARTED",
    STORY_NODE_CHANGED:"STORY_NODE_CHANGED", // 玩家正在看哪一段剧情
    STAGE_PROGRESS_UPDATED: "STAGE_PROGRESS_UPDATED", //玩家已经完成了哪些阶段性任务
    OBJECT_INVESTIGATED: "OBJECT_INVESTIGATED",
    NPC_TALKED: "NPC_TALKED",
    CHOICE_MADE: "CHOICE_MADE",
    ITEM_ACQUIRED: "ITEM_ACQUIRED",
    MAP_PUZZLE_COMPLETED: "MAP_PUZZLE_COMPLETED",
    ACHIEVEMENT_UNLOCKED: "ACHIEVEMENT_UNLOCKED"

});

// 2.初始化游戏层：
    // 定义初始化游戏函数
export function createInitialGameState(storageScope){
    const validStorageScope = requireStorageScope(storageScope);

    return{
        schemaVersion: SAVE_SCHEMA_VERSION,
        storageScope: validStorageScope,

        currentNodeId: "prologue-wake",
        stage: "prologue",

        stageProgress: {
            "prologue-started": true
        },

        choices: {},
        investigated: [],
        talkedTo: [],
        inventory: [],

        puzzle: {
            mapRestored: false
        },

        achievements: [],
        updatedAt: null
    };
}


// 3.辅助检查工具的提前布局：
    //定义账户storagescope格式
const STORAGE_SCOPE_PATTERN =
  /^(guest|account:[A-Za-z0-9-]+)$/;

    //校验真实的storagescope,以后用storagescope来替代ownerId
export function requireStorageScope(storageScope){
    if(
        typeof storageScope !== "string" || !STORAGE_SCOPE_PATTERN.test(storageScope)
    ){
        throw new TypeError(
            "storageScope 必须是 guest或account:<用户UUID>"
        );
    }

    return storageScope;
}


    // 校验游戏内容 ID，例如 key-a、prologue-wake、map-puzzle。
const GAME_ID_PATTERN =
  /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

    // 从事件参数中读取并检查一个游戏 ID。
function requireGameId(payload, fieldName, eventType) {
  const value = payload[fieldName];

  if (
    typeof value !== "string" ||
    !GAME_ID_PATTERN.test(value)
  ) {
    throw new TypeError(
      `${eventType} 的 ${fieldName} 必须是有效的 kebab-case ID`
    );
  }

  return value;
}

    // 向数组添加内容；如果已经存在，就保持原数组不重复添加。
function addUnique(list, value) {
  if (list.includes(value)) {
    return list;
  }

  return [...list, value];
}

    // 检查事件本身是否具备 type，并保证 payload 至少是空对象。
function checkEvent(event) {
  if (!event || typeof event !== "object") {
    throw new TypeError("游戏事件必须是一个对象");
  }

  if (typeof event.type !== "string") {
    throw new TypeError("游戏事件缺少 type");
  }

  return event.payload ?? {};
}

// 4.更新状态层：
    // 接收一个旧状态和一个游戏事件，返回更新后的新状态。
    // 注意：本函数不直接修改旧状态。
export function applyGameEvent(gameState, event){
    //还是先检验gamestate合不合规
    if (!gameState || typeof gameState !== "object") {
        throw new TypeError(
            "applyGameEvent 缺少有效的 gameState"
        );
    }
    const payload = checkEvent(event);

    switch (event.type) {
        // 游戏内重新开始时，保留当前账户/游客的存储域。
        case GAME_EVENTS.GAME_STARTED:{
            return createInitialGameState(
              gameState.storageScope
            );
        }

        // 剧情组切换到指定剧情节点。
        case GAME_EVENTS.STORY_NODE_CHANGED:{
            //下面两个代码块表示检查一下nodeId和stageId的格式，正确就把它写入新的游戏状态
            const nodeId = requireGameId(
                payload,
                "nodeId",
                event.type
            )
            const stageId = requireGameId(
                payload,
                "stageId",
                event.type
            )
            return {
                ...gameState,
                currentNodeId: nodeId,
                stage: stageId
            };
        }

        //更新某个阶段性任务状态 
        case GAME_EVENTS.STAGE_PROGRESS_UPDATED:{
            const progressId = requireGameId(
                payload,
                "progressId",
                event.type
            );
            if (typeof payload.completed !== "boolean") {
                throw new TypeError(
                `${event.type} 的 completed 必须是 true 或 false`
                );
            }

            return {
                ...gameState,
                stageProgress: {
                ...gameState.stageProgress,
                [progressId]: payload.completed
                }
            };
        }
        
        //更新物品状态（调查物品后）
        case GAME_EVENTS.OBJECT_INVESTIGATED:{
            const objectId = requireGameId(
                payload,
                "objectId",
                event.type
            );

            const nextInventory = payload.itemId
              ? addUnique(
                    gameState.inventory,
                    requireGameId(
                        payload,
                        "itemId",
                        event.type
                    )
              )
              :gameState.inventory;
            return {
                ...gameState,
                investigated: addUnique(
                gameState.investigated,
                objectId
                ),
                inventory: nextInventory
            };
        }

        // 首次与人物交谈；可选地获得奖励物品。
        case GAME_EVENTS.NPC_TALKED: {
            const npcId = requireGameId(
                payload,
                "npcId",
                event.type
            );

            const nextInventory = payload.rewardItemId
                ? addUnique(
                    gameState.inventory,
                    requireGameId(
                    payload,
                    "rewardItemId",
                    event.type
                    )
                )
                : gameState.inventory;

            return {
                ...gameState,
                talkedTo: addUnique(
                gameState.talkedTo,
                npcId
                ),
                inventory: nextInventory
            };
        } 
        
         // 记录一个已经发生过的选择。
        case GAME_EVENTS.CHOICE_MADE: {
            const choiceId = requireGameId(
                payload,
                "choiceId",
                event.type
            );

            return {
                ...gameState,
                choices: {
                ...gameState.choices,
                [choiceId]: true
                }
            };
        }

        // 单独获得物品。
        case GAME_EVENTS.ITEM_ACQUIRED: {
            const itemId = requireGameId(
                payload,
                "itemId",
                event.type
            );

            return {
                ...gameState,
                inventory: addUnique(
                gameState.inventory,
                itemId
                )
            };
        }

        // V1 唯一小游戏：地图复原。
        case GAME_EVENTS.MAP_PUZZLE_COMPLETED: {
        const puzzleId = requireGameId(
            payload,
            "puzzleId",
            event.type
        );

        if (puzzleId !== "map-puzzle") {
            throw new Error(
            `未知的拼图 ID：${puzzleId}`
            );
        }

        return {
            ...gameState,

            puzzle: {
            ...gameState.puzzle,
            mapRestored: true
            },

            inventory: addUnique(
            gameState.inventory,
            "restored-village-map"
            ),

            achievements: addUnique(
            gameState.achievements,
            "map-restorer"
            ),

            stageProgress: {
            ...gameState.stageProgress,
            "village-map-puzzle-completed": true,
            "old-house-unlocked": true
            }
        };
        }

        // 解锁一项成就。
        case GAME_EVENTS.ACHIEVEMENT_UNLOCKED: {
            const achievementId = requireGameId(
                payload,
                "achievementId",
                event.type
            );

            return {
                ...gameState,
                achievements: addUnique(
                    gameState.achievements,
                    achievementId
                )
            };
        }

        default:
            throw new Error(`state.js 不支持事件：${event.type}`);


    }
}
