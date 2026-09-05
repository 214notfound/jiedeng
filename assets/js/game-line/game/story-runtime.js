// 本文件提供剧情运行期的里程碑、效果、外部命令、展示和转移计算，不负责请求边界。
(function initializeStoryRuntime(global) {
  "use strict";

  global.WhiteLampStoryInternal = global.WhiteLampStoryInternal || {};
  const internal = global.WhiteLampStoryInternal;
  const rules = internal.storyRules;
  const commandTypes = {
    exploration: "REQUEST_EXPLORATION",
    conversation: "REQUEST_CONVERSATION",
    minigame: "REQUEST_MINIGAME",
  };

  if (!rules) {
    throw new Error("[white-lamp:story] story-validator.js 未先加载");
  }

  function copyObject(value) {
    return value === undefined ? undefined : JSON.parse(JSON.stringify(value));
  }

  function createInitialCheckpoint(storyData) {
    return {
      nodeId: storyData.startNodeId,
      nodeRevision: rules.findById(storyData.nodes, storyData.startNodeId).revision,
      completedMilestoneIds: [],
      completedNodeIds: [],
      completedStageIds: [],
      pendingCommands: [],
    };
  }

  function copyCheckpoint(checkpoint) {
    return {
      nodeId: checkpoint.nodeId,
      nodeRevision: checkpoint.nodeRevision,
      completedMilestoneIds: checkpoint.completedMilestoneIds.slice(),
      completedNodeIds: checkpoint.completedNodeIds.slice(),
      completedStageIds: checkpoint.completedStageIds.slice(),
      pendingCommands: checkpoint.pendingCommands.map((command) => ({
        commandId: command.commandId,
        commandType: command.commandType,
        targetId: command.targetId,
      })),
    };
  }

  function createStateEvent(effect, requestId, scopeId, onceKey) {
    return {
      eventId: `story-event-${requestId}-${scopeId}-${effect.id}`,
      eventType: effect.eventType,
      onceKey,
      payload: copyObject(effect.payload),
    };
  }

  function createNotification(requestId, eventType, payload, subjectId) {
    return {
      eventId: `story-note-${requestId}-${eventType
        .toLowerCase()
        .replaceAll("_", "-")}-${subjectId}`,
      eventType,
      payload: copyObject(payload),
    };
  }

  function appendEffect(
    storyData,
    events,
    facts,
    effect,
    requestId,
    scopeId,
    onceKey,
  ) {
    events.push(createStateEvent(effect, requestId, scopeId, onceKey));
    if (
      effect.eventType === "STORY_FACT_RECORDED" &&
      !facts.includes(effect.payload.factId)
    ) {
      facts.push(effect.payload.factId);
    }
    const targetId =
      effect.payload.itemId || effect.payload.locationId || effect.payload.choiceId;
    storyData.facts
      .filter(
        (fact) =>
          fact.producer === "state" &&
          fact.derivedFrom &&
          fact.derivedFrom.eventType === effect.eventType &&
          fact.derivedFrom.targetId === targetId,
      )
      .forEach((fact) => {
        if (!facts.includes(fact.id)) {
          facts.push(fact.id);
        }
      });
  }

  function reconcileMilestones(
    storyData,
    node,
    checkpoint,
    facts,
    requestId,
    events,
    notifications,
  ) {
    const previousIds = checkpoint.completedMilestoneIds.slice();
    const satisfiedIds = node.milestones
      .filter((milestone) => rules.evaluateCondition(milestone.satisfiedWhen, facts, []))
      .map((milestone) => milestone.id);
    const missingPrevious = previousIds.find((id) => !satisfiedIds.includes(id));
    if (missingPrevious) {
      return `检查点里程碑 ${missingPrevious} 对应的事实不存在`;
    }
    checkpoint.completedMilestoneIds = node.milestones
      .map((milestone) => milestone.id)
      .filter((id) => satisfiedIds.includes(id));

    node.milestones.forEach((milestone) => {
      if (
        checkpoint.completedMilestoneIds.includes(milestone.id) &&
        !previousIds.includes(milestone.id)
      ) {
        (milestone.onReach || []).forEach((effect) =>
          appendEffect(
            storyData,
            events,
            facts,
            effect,
            requestId,
            `${node.id}-${milestone.id}`,
            `${node.id}:${milestone.id}:${effect.id}`,
          ),
        );
        notifications.push(
          createNotification(
            requestId,
            "STORY_MILESTONE_REACHED",
            { nodeId: node.id, milestoneId: milestone.id },
            `${node.id}-${milestone.id}`,
          ),
        );
      }
    });
    return null;
  }

  function findHandoffByCommand(node, commandId) {
    return node.handoffs.find(
      (handoff) => `cmd-${node.id}-${handoff.id}` === commandId,
    );
  }

  function getHandoffFactIds(node, handoff) {
    const factIds = [];
    handoff.goalIds.forEach((goalId) => {
      const milestone = rules.findById(node.milestones, goalId);
      rules.getConditionFactIds(milestone.satisfiedWhen).forEach((factId) => {
        if (!factIds.includes(factId)) {
          factIds.push(factId);
        }
      });
    });
    return factIds;
  }

  function addEligibleCommands(node, checkpoint, facts) {
    node.handoffs.forEach((handoff) => {
      const commandId = `cmd-${node.id}-${handoff.id}`;
      const alreadyPending = checkpoint.pendingCommands.some(
        (command) => command.commandId === commandId,
      );
      const goalsComplete = handoff.goalIds.every((goalId) =>
        checkpoint.completedMilestoneIds.includes(goalId),
      );
      if (
        !alreadyPending &&
        !goalsComplete &&
        rules.evaluateCondition(
          handoff.startWhen,
          facts,
          checkpoint.completedMilestoneIds,
        )
      ) {
        checkpoint.pendingCommands.push({
          commandId,
          commandType: commandTypes[handoff.capability],
          targetId: handoff.targetId,
        });
      }
    });
  }

  function createCommand(node, pending) {
    const handoff = findHandoffByCommand(node, pending.commandId);
    const goals = handoff.goalIds.map((goalId) => ({
      goalId,
      description: rules.findById(node.milestones, goalId).intent,
    }));
    if (handoff.capability === "conversation") {
      return {
        commandId: pending.commandId,
        commandType: pending.commandType,
        payload: {
          conversationId: handoff.targetId,
          npcIds: handoff.npcIds.slice(),
          goals,
        },
      };
    }
    if (handoff.capability === "exploration") {
      return {
        commandId: pending.commandId,
        commandType: pending.commandType,
        payload: { explorationId: handoff.targetId, goals },
      };
    }
    return {
      commandId: pending.commandId,
      commandType: pending.commandType,
      payload: {
        minigameId: handoff.targetId,
        successFactId: getHandoffFactIds(node, handoff)[0],
      },
    };
  }

  function createPresentation(node, facts, milestoneIds) {
    const matches = node.presentations.filter((presentation) =>
      rules.evaluateCondition(presentation.when, facts, milestoneIds),
    );
    if (matches.length > 1) {
      return {
        error: `Node ${node.id} 同时命中多个 presentation：${matches
          .map((item) => item.id)
          .join(", ")}`,
      };
    }
    if (matches.length === 0) {
      return { value: null };
    }
    const source = matches[0];
    const actions = source.actionIds
      .map((actionId) => rules.findById(node.actions, actionId))
      .filter((action) =>
        rules.evaluateCondition(action.availableWhen, facts, milestoneIds),
      )
      .map((action) => ({
        actionId: action.id,
        label: action.label,
        actionType: action.actionType,
      }));
    return {
      value: {
        presentationId: `present-${node.id}-${source.id}`,
        sceneId: source.sceneId,
        blocks: source.blocks.map((block) => ({
          blockId: block.id,
          blockType: block.blockType,
          text: block.text,
        })),
        actions,
      },
    };
  }

  function chooseTransition(node, facts, milestoneIds) {
    const matches = node.transitions.filter(
      (transition) =>
        transition.when !== undefined &&
        rules.evaluateCondition(transition.when, facts, milestoneIds),
    );
    if (matches.length > 1) {
      return {
        errorCode: "STORY_AMBIGUOUS_TRANSITION",
        message: `Node ${node.id} 同时命中转移：${matches
          .map((transition) => transition.id)
          .join(", ")}`,
      };
    }
    if (matches.length === 1) {
      return { transition: matches[0] };
    }
    const fallback = node.transitions.find((transition) => transition.when === undefined);
    return fallback
      ? { transition: fallback }
      : {
          errorCode: "STORY_NO_TRANSITION",
          message: `Node ${node.id} 完成后没有可用出口`,
        };
  }

  internal.storyRuntime = {
    addEligibleCommands,
    appendEffect,
    chooseTransition,
    copyCheckpoint,
    createCommand,
    createInitialCheckpoint,
    createNotification,
    createPresentation,
    findHandoffByCommand,
    getHandoffFactIds,
    reconcileMilestones,
  };
})(window);
