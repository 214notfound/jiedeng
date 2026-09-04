// 本文件校验剧情入口请求、检查点和外部事件，并统一构造公开错误响应。
(function initializeStoryRequestBoundary(global) {
  "use strict";

  global.WhiteLampStoryInternal = global.WhiteLampStoryInternal || {};
  const internal = global.WhiteLampStoryInternal;
  const rules = internal.storyRules;
  const runtime = internal.storyRuntime;
  const inputTypes = ["new-game", "resume", "story-action", "external-event"];
  const commandTypes = {
    exploration: "REQUEST_EXPLORATION",
    conversation: "REQUEST_CONVERSATION",
    minigame: "REQUEST_MINIGAME",
  };
  const eventTypesByCapability = {
    exploration: ["OBJECT_INVESTIGATED"],
    conversation: ["NPC_TALK_PROGRESS", "NPC_TALKED"],
    minigame: ["MAP_PUZZLE_COMPLETED"],
  };
  const completionRequiredEventTypes = ["NPC_TALKED", "MAP_PUZZLE_COMPLETED"];
  const errorMessages = {
    STORY_INVALID_REQUEST: "剧情请求无效，请重试或返回主菜单。",
    STORY_INVALID_NODE_DATA: "剧情数据无法加载，请联系开发者。",
    STORY_UNKNOWN_NODE: "当前剧情无法读取。你可以重试或返回主菜单。",
    STORY_REVISION_MISMATCH: "此存档与当前剧情版本不兼容。",
    STORY_INVALID_ACTION: "这个操作现在不可用，请刷新当前剧情。",
    STORY_ENTRY_CONDITION_FAILED: "当前条件不足，暂时无法进入下一段剧情。",
    STORY_STALE_EXTERNAL_EVENT: "这次交互已经失效，请从当前剧情重新开始。",
    STORY_EXTERNAL_RESULT_INCOMPLETE: "交互结果不完整，请继续完成当前内容。",
    STORY_AMBIGUOUS_TRANSITION: "剧情出现冲突分支，已停止推进。",
    STORY_NO_TRANSITION: "剧情暂时无法继续，你可以返回主菜单。",
    STORY_EXTERNAL_FAILED: "外部交互执行失败，你可以重试或返回主菜单。",
  };

  if (!rules || !runtime) {
    throw new Error("[white-lamp:story] 剧情校验器或运行规则未按顺序加载");
  }

  function hasText(value) {
    return typeof value === "string" && value.trim() !== "";
  }

  function hasDuplicates(values) {
    return values.some((value, index) => values.indexOf(value) !== index);
  }

  function createErrorResponse(storyData, requestId, code, message, recoveryActions) {
    return {
      contractVersion: storyData.contractVersion || "1.0",
      requestId: hasText(requestId) ? requestId : "unknown-request",
      status: "error",
      commit: null,
      presentation: null,
      commands: [],
      notifications: [],
      error: {
        errorCode: code,
        userMessage: errorMessages[code] || errorMessages.STORY_INVALID_REQUEST,
        developerMessage: message,
        recoveryActions: recoveryActions || ["retry", "return-menu"],
      },
    };
  }

  function validateCheckpoint(checkpoint, storyData) {
    if (!rules.isObject(checkpoint)) {
      return { code: "STORY_INVALID_REQUEST", message: "storyCheckpoint 必须是对象" };
    }
    const node = rules.findById(storyData.nodes, checkpoint.nodeId);
    if (!node) {
      return { code: "STORY_UNKNOWN_NODE", message: `未知 Node：${checkpoint.nodeId}` };
    }
    if (checkpoint.nodeRevision !== node.revision) {
      return {
        code: "STORY_REVISION_MISMATCH",
        message: `${node.id} revision ${checkpoint.nodeRevision} 与当前 ${node.revision} 不一致`,
      };
    }
    const arrayFields = [
      "completedMilestoneIds",
      "completedNodeIds",
      "completedStageIds",
      "pendingCommands",
    ];
    const badArray = arrayFields.find((field) => !Array.isArray(checkpoint[field]));
    if (badArray) {
      return {
        code: "STORY_INVALID_REQUEST",
        message: `storyCheckpoint.${badArray} 必须是数组`,
      };
    }
    for (const field of arrayFields.slice(0, 3)) {
      if (hasDuplicates(checkpoint[field])) {
        return { code: "STORY_INVALID_REQUEST", message: `${field} 存在重复 ID` };
      }
    }
    const milestoneIds = node.milestones.map((milestone) => milestone.id);
    const badMilestone = checkpoint.completedMilestoneIds.find(
      (id) => !milestoneIds.includes(id),
    );
    const badNode = checkpoint.completedNodeIds.find(
      (id) => !rules.findById(storyData.nodes, id),
    );
    const badStage = checkpoint.completedStageIds.find(
      (id) => !storyData.stages.includes(id),
    );
    if (badMilestone || badNode || badStage) {
      return {
        code: "STORY_INVALID_REQUEST",
        message: `检查点包含未知 ID：${badMilestone || badNode || badStage}`,
      };
    }
    const commandIds = checkpoint.pendingCommands.map((command) => command.commandId);
    if (hasDuplicates(commandIds)) {
      return { code: "STORY_INVALID_REQUEST", message: "pendingCommands 存在重复 ID" };
    }
    for (const pending of checkpoint.pendingCommands) {
      const handoff =
        rules.isObject(pending) &&
        node.handoffs.find(
          (item) => `cmd-${node.id}-${item.id}` === pending.commandId,
        );
      if (
        !handoff ||
        pending.commandType !== commandTypes[handoff.capability] ||
        pending.targetId !== handoff.targetId
      ) {
        return {
          code: "STORY_INVALID_REQUEST",
          message: `等待命令不属于当前 Node：${pending && pending.commandId}`,
        };
      }
    }
    return null;
  }

  function validateRequest(request, storyData) {
    if (!rules.isObject(request)) {
      return { code: "STORY_INVALID_REQUEST", message: "请求必须是对象" };
    }
    if (request.contractVersion !== storyData.contractVersion) {
      return {
        code: "STORY_INVALID_REQUEST",
        message: `contractVersion 应为 ${storyData.contractVersion}`,
      };
    }
    if (!hasText(request.requestId) || !hasText(request.source)) {
      return {
        code: "STORY_INVALID_REQUEST",
        message: "requestId 和 source 必须是非空字符串",
      };
    }
    if (!rules.isObject(request.input) || !inputTypes.includes(request.input.type)) {
      return { code: "STORY_INVALID_REQUEST", message: "input.type 不合法" };
    }
    if (!rules.isObject(request.context) || !Array.isArray(request.context.facts)) {
      return { code: "STORY_INVALID_REQUEST", message: "context.facts 必须是数组" };
    }
    if (
      request.context.facts.some((factId) => !hasText(factId)) ||
      hasDuplicates(request.context.facts)
    ) {
      return {
        code: "STORY_INVALID_REQUEST",
        message: "context.facts 必须是无重复的非空字符串数组",
      };
    }
    if (request.input.type === "new-game") {
      if (request.context.storyCheckpoint !== null || request.context.facts.length !== 0) {
        return {
          code: "STORY_INVALID_REQUEST",
          message: "new-game 必须使用空事实和 null 检查点",
        };
      }
      return null;
    }
    const checkpointError = validateCheckpoint(request.context.storyCheckpoint, storyData);
    if (checkpointError) {
      return checkpointError;
    }
    if (request.input.type === "story-action" && !hasText(request.input.actionId)) {
      return { code: "STORY_INVALID_REQUEST", message: "story-action 缺少 actionId" };
    }
    if (request.input.type === "external-event") {
      const event = request.input.event;
      if (
        !rules.isObject(event) ||
        !hasText(event.eventId) ||
        !hasText(event.eventType) ||
        !hasText(event.source) ||
        !hasText(event.causedByCommandId) ||
        !Array.isArray(event.resultFactIds) ||
        !rules.isObject(event.payload) ||
        event.resultFactIds.some((factId) => !hasText(factId)) ||
        hasDuplicates(event.resultFactIds)
      ) {
        return { code: "STORY_INVALID_REQUEST", message: "external-event 字段不完整" };
      }
    }
    return null;
  }

  function validateExternalEvent(event, node, checkpoint, storyData, facts) {
    const pending = checkpoint.pendingCommands.find(
      (command) => command.commandId === event.causedByCommandId,
    );
    const handoff = runtime.findHandoffByCommand(node, event.causedByCommandId);
    if (!pending || !handoff) {
      return {
        code: "STORY_STALE_EXTERNAL_EVENT",
        message: `命令不属于当前等待任务：${event.causedByCommandId}`,
      };
    }
    if (event.source !== handoff.capability) {
      return {
        code: "STORY_INVALID_REQUEST",
        message: `事件来源 ${event.source} 与命令 ${handoff.capability} 不匹配`,
      };
    }
    const payloadError = validateExternalPayload(event, handoff);
    if (payloadError) {
      return { code: "STORY_INVALID_REQUEST", message: payloadError };
    }
    if (event.eventType === "EXTERNAL_INTERACTION_FAILED") {
      if (event.resultFactIds.length > 0) {
        return { code: "STORY_INVALID_REQUEST", message: "失败事件不能携带事实" };
      }
      return {
        code: "STORY_EXTERNAL_FAILED",
        message: `外部模块执行失败：${event.payload.errorCode}`,
      };
    }
    if (event.eventType === "EXTERNAL_INTERACTION_CANCELLED") {
      return event.resultFactIds.length === 0
        ? { cancelled: true, handoff }
        : { code: "STORY_INVALID_REQUEST", message: "取消事件不能携带事实" };
    }
    if (!eventTypesByCapability[handoff.capability].includes(event.eventType)) {
      return {
        code: "STORY_INVALID_REQUEST",
        message: `${event.eventType} 不能完成 ${handoff.capability} 命令`,
      };
    }
    const allowedFacts = runtime.getHandoffFactIds(node, handoff);
    for (const factId of event.resultFactIds) {
      const fact = rules.findById(storyData.facts, factId);
      if (!allowedFacts.includes(factId) || !fact || fact.producer !== event.source) {
        return {
          code: "STORY_INVALID_REQUEST",
          message: `${event.source} 无权为当前命令产生事实：${factId}`,
        };
      }
      if (!facts.includes(factId)) {
        return {
          code: "STORY_EXTERNAL_RESULT_INCOMPLETE",
          message: `状态模块尚未提交事件声明的事实：${factId}`,
        };
      }
    }
    return {
      handoff,
      completionRequired: completionRequiredEventTypes.includes(event.eventType),
    };
  }

  function validateExternalPayload(event, handoff) {
    if (event.eventType === "OBJECT_INVESTIGATED") {
      return hasText(event.payload.objectId) ? null : "调查事件缺少 objectId";
    }
    if (["NPC_TALK_PROGRESS", "NPC_TALKED"].includes(event.eventType)) {
      return hasText(event.payload.conversationId) &&
        hasText(event.payload.npcId) &&
        event.payload.conversationId === handoff.targetId &&
        handoff.npcIds.includes(event.payload.npcId)
        ? null
        : "对话事件的 conversationId 或 npcId 与命令不匹配";
    }
    if (event.eventType === "MAP_PUZZLE_COMPLETED") {
      return event.payload.puzzleId === handoff.targetId
        ? null
        : "小游戏 puzzleId 与命令不匹配";
    }
    if (event.eventType === "EXTERNAL_INTERACTION_CANCELLED") {
      return event.payload.targetId === handoff.targetId
        ? null
        : "取消事件 targetId 与命令不匹配";
    }
    if (event.eventType === "EXTERNAL_INTERACTION_FAILED") {
      return event.payload.targetId === handoff.targetId &&
        hasText(event.payload.errorCode)
        ? null
        : "失败事件字段与命令不匹配";
    }
    return null;
  }

  internal.storyRequest = {
    createErrorResponse,
    validateExternalEvent,
    validateRequest,
  };
})(window);
