// 本文件编排剧情统一入口，只协调请求边界、运行规则和公开响应，不保存任何游戏状态。
(function initializeStoryEngine(global) {
  "use strict";

  global.WhiteLamp = global.WhiteLamp || {};
  global.WhiteLampStoryInternal = global.WhiteLampStoryInternal || {};
  const internal = global.WhiteLampStoryInternal;
  const data = internal.storyData;
  const rules = internal.storyRules;
  const runtime = internal.storyRuntime;
  const requestBoundary = internal.storyRequest;

  if (!data || !rules || !runtime || !requestBoundary) {
    throw new Error("[white-lamp:story] 剧情脚本未按规定顺序加载");
  }

  function createStoryEngine(storyData) {
    let validation;
    try {
      validation = rules.validateStoryData(storyData);
    } catch (error) {
      validation = {
        ok: false,
        issues: [
          `剧情数据校验器无法读取结构：${
            error && error.message ? error.message : String(error)
          }`,
        ],
      };
    }

    function fail(requestId, code, message, recoveryActions) {
      return requestBoundary.createErrorResponse(
        storyData,
        requestId,
        code,
        message,
        recoveryActions,
      );
    }

    function enterStory(request) {
      const requestId = request && request.requestId;
      try {
        if (!validation.ok) {
          return fail(
            requestId,
            "STORY_INVALID_NODE_DATA",
            validation.issues.join(" | "),
            ["return-menu"],
          );
        }
        const requestError = requestBoundary.validateRequest(request, storyData);
        if (requestError) {
          return fail(
            requestId,
            requestError.code,
            requestError.message,
            requestError.code === "STORY_REVISION_MISMATCH"
              ? ["return-menu"]
              : undefined,
          );
        }

        const facts = request.context.facts.slice();
        const checkpoint =
          request.input.type === "new-game"
            ? runtime.createInitialCheckpoint(storyData)
            : runtime.copyCheckpoint(request.context.storyCheckpoint);
        const events = [];
        const notifications = [];
        let node = rules.findById(storyData.nodes, checkpoint.nodeId);

        if (request.input.type === "new-game") {
          notifications.push(
            runtime.createNotification(
              requestId,
              "STORY_NODE_ENTERED",
              { nodeId: node.id, nodeRevision: node.revision },
              node.id,
            ),
          );
        }

        if (request.input.type === "story-action") {
          const action = rules.findById(node.actions, request.input.actionId);
          if (
            !action ||
            !rules.evaluateCondition(
              action.availableWhen,
              facts,
              checkpoint.completedMilestoneIds,
            )
          ) {
            return fail(
              requestId,
              "STORY_INVALID_ACTION",
              `Node ${node.id} 不允许操作：${request.input.actionId}`,
            );
          }
          runtime.appendEffect(
            storyData,
            events,
            facts,
            action.effect,
            requestId,
            `${node.id}-${action.id}`,
            `${node.id}:${action.id}:${action.effect.id}`,
          );
        }

        let externalResult = null;
        if (request.input.type === "external-event") {
          externalResult = requestBoundary.validateExternalEvent(
            request.input.event,
            node,
            checkpoint,
            storyData,
            facts,
          );
          if (externalResult.code) {
            return fail(
              requestId,
              externalResult.code,
              externalResult.message,
            );
          }
          if (externalResult.cancelled) {
            return createSuccessResponse(
              storyData,
              requestId,
              "waiting-external",
              checkpoint,
              [],
              null,
              checkpoint.pendingCommands.map((pending) =>
                runtime.createCommand(node, pending),
              ),
              [],
            );
          }
        }

        const milestoneError = runtime.reconcileMilestones(
          storyData,
          node,
          checkpoint,
          facts,
          requestId,
          events,
          notifications,
        );
        if (milestoneError) {
          return fail(requestId, "STORY_INVALID_REQUEST", milestoneError);
        }

        if (externalResult) {
          const goalsComplete = externalResult.handoff.goalIds.every((goalId) =>
            checkpoint.completedMilestoneIds.includes(goalId),
          );
          if (externalResult.completionRequired && !goalsComplete) {
            const missing = externalResult.handoff.goalIds.filter(
              (goalId) => !checkpoint.completedMilestoneIds.includes(goalId),
            );
            return fail(
              requestId,
              "STORY_EXTERNAL_RESULT_INCOMPLETE",
              `命令 ${request.input.event.causedByCommandId} 缺少目标：${missing.join(", ")}`,
            );
          }
          if (goalsComplete) {
            checkpoint.pendingCommands = checkpoint.pendingCommands.filter(
              (command) =>
                command.commandId !== request.input.event.causedByCommandId,
            );
          }
        }

        const advanceResult = advanceCompletedNodes(
          storyData,
          requestId,
          facts,
          checkpoint,
          events,
          notifications,
          node,
        );
        if (advanceResult.error) {
          return fail(
            requestId,
            advanceResult.error.code,
            advanceResult.error.message,
            advanceResult.error.recoveryActions,
          );
        }
        node = advanceResult.node;
        if (node.terminal && checkpoint.completedNodeIds.includes(node.id)) {
          return createSuccessResponse(
            storyData,
            requestId,
            "ended",
            checkpoint,
            events,
            null,
            [],
            notifications,
          );
        }

        runtime.addEligibleCommands(node, checkpoint, facts);
        const presentationResult = runtime.createPresentation(
          node,
          facts,
          checkpoint.completedMilestoneIds,
        );
        if (presentationResult.error) {
          return fail(
            requestId,
            "STORY_INVALID_NODE_DATA",
            presentationResult.error,
            ["return-menu"],
          );
        }
        const commands = checkpoint.pendingCommands.map((pending) =>
          runtime.createCommand(node, pending),
        );
        const presentation = presentationResult.value;
        if (!presentation && commands.length === 0) {
          return fail(
            requestId,
            "STORY_NO_TRANSITION",
            `Node ${node.id} 未完成，但没有可执行操作或外部命令`,
          );
        }
        return createSuccessResponse(
          storyData,
          requestId,
          presentation ? "ready" : "waiting-external",
          checkpoint,
          events,
          presentation,
          commands,
          notifications,
        );
      } catch (error) {
        console.error("[white-lamp:story] enterStory 未处理异常", error);
        return fail(
          requestId,
          "STORY_INVALID_REQUEST",
          error && error.stack ? error.stack : String(error),
        );
      }
    }

    return { enterStory, validation };
  }

  function advanceCompletedNodes(
    storyData,
    requestId,
    facts,
    checkpoint,
    events,
    notifications,
    initialNode,
  ) {
    let node = initialNode;
    let transitionCount = 0;
    while (
      rules.evaluateCondition(
        node.completion,
        facts,
        checkpoint.completedMilestoneIds,
      ) && checkpoint.pendingCommands.length === 0
    ) {
      if (!checkpoint.completedNodeIds.includes(node.id)) {
        (node.onComplete || []).forEach((effect) =>
          runtime.appendEffect(
            storyData,
            events,
            facts,
            effect,
            requestId,
            node.id,
            `${node.id}:${effect.id}`,
          ),
        );
        checkpoint.completedNodeIds.push(node.id);
        notifications.push(
          runtime.createNotification(
            requestId,
            "STORY_NODE_COMPLETED",
            { nodeId: node.id },
            node.id,
          ),
        );
        if (
          node.completesStage &&
          !checkpoint.completedStageIds.includes(node.stageId)
        ) {
          checkpoint.completedStageIds.push(node.stageId);
          notifications.push(
            runtime.createNotification(
              requestId,
              "STORY_STAGE_COMPLETED",
              { stageId: node.stageId },
              node.stageId,
            ),
          );
        }
      }
      if (node.terminal) {
        notifications.push(
          runtime.createNotification(
            requestId,
            "STORY_ENDED",
            { endingId: node.endingId },
            node.endingId,
          ),
        );
        return { node };
      }

      const transitionResult = runtime.chooseTransition(
        node,
        facts,
        checkpoint.completedMilestoneIds,
      );
      if (transitionResult.errorCode) {
        return {
          node,
          error: {
            code: transitionResult.errorCode,
            message: transitionResult.message,
          },
        };
      }
      const nextNode = rules.findById(
        storyData.nodes,
        transitionResult.transition.to,
      );
      if (!rules.evaluateCondition(nextNode.enterWhen, facts, [])) {
        return {
          node,
          error: {
            code: "STORY_ENTRY_CONDITION_FAILED",
            message: `进入 ${nextNode.id} 时条件不成立`,
          },
        };
      }
      checkpoint.nodeId = nextNode.id;
      checkpoint.nodeRevision = nextNode.revision;
      checkpoint.completedMilestoneIds = [];
      checkpoint.pendingCommands = [];
      node = nextNode;
      notifications.push(
        runtime.createNotification(
          requestId,
          "STORY_NODE_ENTERED",
          { nodeId: node.id, nodeRevision: node.revision },
          node.id,
        ),
      );
      const milestoneError = runtime.reconcileMilestones(
        storyData,
        node,
        checkpoint,
        facts,
        requestId,
        events,
        notifications,
      );
      if (milestoneError) {
        return {
          node,
          error: { code: "STORY_INVALID_REQUEST", message: milestoneError },
        };
      }
      transitionCount += 1;
      if (transitionCount > storyData.nodes.length) {
        return {
          node,
          error: {
            code: "STORY_INVALID_NODE_DATA",
            message: "剧情转移超过 Node 总数，可能存在自动循环",
            recoveryActions: ["return-menu"],
          },
        };
      }
    }
    return { node };
  }

  function createSuccessResponse(
    storyData,
    requestId,
    status,
    checkpoint,
    events,
    presentation,
    commands,
    notifications,
  ) {
    return {
      contractVersion: storyData.contractVersion,
      requestId,
      status,
      commit: { checkpoint, events },
      presentation,
      commands,
      notifications,
      error: null,
    };
  }

  const engine = createStoryEngine(data);
  internal.createStoryEngine = createStoryEngine;
  global.WhiteLamp.story = Object.freeze({ enterStory: engine.enterStory });

  console.info("[white-lamp:story] 剧情引擎启动", {
    moduleVersion: data.moduleVersion,
    contractVersion: data.contractVersion,
    startNodeId: data.startNodeId,
    endNodeId: data.endNodeId,
    nodeCount: data.nodes.length,
    validation: engine.validation.ok ? "passed" : "failed",
  });
  if (!engine.validation.ok) {
    engine.validation.issues.forEach((issue) =>
      console.error("[white-lamp:story] 剧情数据校验失败", issue),
    );
  }
})(window);
