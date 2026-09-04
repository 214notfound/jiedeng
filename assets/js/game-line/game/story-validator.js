// 本文件校验剧情数据结构、稳定 ID、条件引用、外部交接和起止 Node 可达性。
(function initializeStoryValidator(global) {
  "use strict";

  global.WhiteLampStoryInternal = global.WhiteLampStoryInternal || {};
  const internal = global.WhiteLampStoryInternal;
  const idPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
  const conditionFields = [
    "allFacts",
    "anyFacts",
    "noneFacts",
    "allMilestones",
    "anyMilestones",
  ];
  const capabilities = ["exploration", "conversation", "minigame"];
  const actionTypes = ["advance", "choice"];
  const blockTypes = ["narration", "system"];
  const effectTypes = [
    "STORY_FACT_RECORDED",
    "CHOICE_MADE",
    "ITEM_ACQUIRED",
    "CLUE_RECORDED",
    "LOCATION_UNLOCKED",
  ];

  function isObject(value) {
    return Boolean(value) && typeof value === "object" && !Array.isArray(value);
  }

  function hasText(value) {
    return typeof value === "string" && value.trim() !== "";
  }

  function findById(values, id) {
    return values.find((value) => value && value.id === id);
  }

  function containsDuplicate(values) {
    return values.some((value, index) => values.indexOf(value) !== index);
  }

  function evaluateCondition(condition, facts, milestones) {
    if (condition === undefined) {
      return true;
    }
    const factIds = Array.isArray(facts) ? facts : [];
    const milestoneIds = Array.isArray(milestones) ? milestones : [];
    const allFacts = condition.allFacts || [];
    const anyFacts = condition.anyFacts || [];
    const noneFacts = condition.noneFacts || [];
    const allMilestones = condition.allMilestones || [];
    const anyMilestones = condition.anyMilestones || [];

    return (
      allFacts.every((id) => factIds.includes(id)) &&
      (anyFacts.length === 0 || anyFacts.some((id) => factIds.includes(id))) &&
      noneFacts.every((id) => !factIds.includes(id)) &&
      allMilestones.every((id) => milestoneIds.includes(id)) &&
      (anyMilestones.length === 0 ||
        anyMilestones.some((id) => milestoneIds.includes(id)))
    );
  }

  function getConditionFactIds(condition) {
    if (!isObject(condition)) {
      return [];
    }
    return ["allFacts", "anyFacts", "noneFacts"].flatMap((field) =>
      Array.isArray(condition[field]) ? condition[field] : [],
    );
  }

  function validateId(value, path, issues) {
    if (!hasText(value) || !idPattern.test(value)) {
      issues.push(`${path} 必须是 kebab-case ID`);
    }
  }

  function validateIdList(values, path, issues) {
    if (!Array.isArray(values)) {
      issues.push(`${path} 必须是数组`);
      return;
    }
    values.forEach((value, index) => validateId(value, `${path}[${index}]`, issues));
    if (containsDuplicate(values)) {
      issues.push(`${path} 存在重复 ID`);
    }
  }

  function validateCondition(
    condition,
    path,
    knownFacts,
    knownMilestones,
    issues,
  ) {
    if (condition === undefined) {
      return;
    }
    if (!isObject(condition)) {
      issues.push(`${path} 必须是条件对象`);
      return;
    }
    const unknownFields = Object.keys(condition).filter(
      (field) => !conditionFields.includes(field),
    );
    unknownFields.forEach((field) => issues.push(`${path}.${field} 不是合法条件字段`));

    conditionFields.forEach((field) => {
      if (condition[field] === undefined) {
        return;
      }
      const ids = condition[field];
      if (!Array.isArray(ids) || ids.length === 0) {
        issues.push(`${path}.${field} 必须是非空数组`);
        return;
      }
      if (containsDuplicate(ids)) {
        issues.push(`${path}.${field} 存在重复 ID`);
      }
      ids.forEach((id, index) => {
        validateId(id, `${path}.${field}[${index}]`, issues);
        const registry = field.endsWith("Facts") ? knownFacts : knownMilestones;
        if (!registry.includes(id)) {
          issues.push(`${path}.${field} 引用了未登记 ID：${id}`);
        }
      });
    });
  }

  function validateEffect(effect, path, data, issues) {
    if (!isObject(effect)) {
      issues.push(`${path} 必须是状态事件对象`);
      return;
    }
    validateId(effect.id, `${path}.id`, issues);
    if (!effectTypes.includes(effect.eventType)) {
      issues.push(`${path}.eventType 未登记：${effect.eventType}`);
    }
    if (!isObject(effect.payload)) {
      issues.push(`${path}.payload 必须是对象`);
      return;
    }

    const targetRules = {
      STORY_FACT_RECORDED: ["factId", data.facts.map((fact) => fact.id)],
      CHOICE_MADE: ["choiceId", null],
      ITEM_ACQUIRED: ["itemId", data.items],
      CLUE_RECORDED: ["clueId", data.clues],
      LOCATION_UNLOCKED: ["locationId", data.locations],
    };
    const rule = targetRules[effect.eventType];
    if (!rule) {
      return;
    }
    const targetId = effect.payload[rule[0]];
    validateId(targetId, `${path}.payload.${rule[0]}`, issues);
    if (rule[1] && !rule[1].includes(targetId)) {
      issues.push(`${path}.payload.${rule[0]} 未登记：${targetId}`);
    }
    if (effect.eventType === "STORY_FACT_RECORDED") {
      const fact = findById(data.facts, targetId);
      if (fact && fact.producer !== "story") {
        issues.push(`${path} 不能记录由 ${fact.producer} 产生的事实：${targetId}`);
      }
    }
  }

  function validateNode(node, data, nodeIds, globalActionIds, issues) {
    const path = `node[${node && node.id ? node.id : "unknown"}]`;
    if (!isObject(node)) {
      issues.push(`${path} 必须是对象`);
      return;
    }
    validateId(node.id, `${path}.id`, issues);
    if (!hasText(node.sourceRef)) {
      issues.push(`${path}.sourceRef 不能为空`);
    }
    if (!data.stages.includes(node.stageId)) {
      issues.push(`${path}.stageId 未登记：${node.stageId}`);
    }
    if (!Number.isInteger(node.revision) || node.revision < 1) {
      issues.push(`${path}.revision 必须是正整数`);
    }
    if (!hasText(node.intent)) {
      issues.push(`${path}.intent 不能为空`);
    }

    const milestoneIds = Array.isArray(node.milestones)
      ? node.milestones.map((milestone) => milestone && milestone.id)
      : [];
    if (milestoneIds.length === 0) {
      issues.push(`${path}.milestones 至少包含一项`);
    }
    validateIdList(milestoneIds, `${path}.milestones`, issues);
    validateCondition(node.enterWhen, `${path}.enterWhen`, data.facts.map((fact) => fact.id), milestoneIds, issues);

    const effectIds = [];
    (node.milestones || []).forEach((milestone, milestoneIndex) => {
      const milestonePath = `${path}.milestones[${milestoneIndex}]`;
      if (!isObject(milestone) || !hasText(milestone.intent)) {
        issues.push(`${milestonePath}.intent 不能为空`);
      }
      validateCondition(
        milestone && milestone.satisfiedWhen,
        `${milestonePath}.satisfiedWhen`,
        data.facts.map((fact) => fact.id),
        milestoneIds,
        issues,
      );
      const onReach = milestone && milestone.onReach ? milestone.onReach : [];
      if (!Array.isArray(onReach)) {
        issues.push(`${milestonePath}.onReach 必须是数组`);
      } else {
        onReach.forEach((effect, effectIndex) => {
          validateEffect(effect, `${milestonePath}.onReach[${effectIndex}]`, data, issues);
          if (effect && effect.id) {
            effectIds.push(effect.id);
          }
        });
      }
    });

    validateCondition(
      node.completion,
      `${path}.completion`,
      data.facts.map((fact) => fact.id),
      milestoneIds,
      issues,
    );
    if (
      !isObject(node.completion) ||
      (!node.completion.allMilestones && !node.completion.anyMilestones)
    ) {
      issues.push(`${path}.completion 必须引用本 Node 的里程碑`);
    }

    const handoffIds = Array.isArray(node.handoffs)
      ? node.handoffs.map((handoff) => handoff && handoff.id)
      : [];
    validateIdList(handoffIds, `${path}.handoffs`, issues);
    (node.handoffs || []).forEach((handoff, handoffIndex) => {
      const handoffPath = `${path}.handoffs[${handoffIndex}]`;
      if (!isObject(handoff)) {
        issues.push(`${handoffPath} 必须是对象`);
        return;
      }
      if (!capabilities.includes(handoff.capability)) {
        issues.push(`${handoffPath}.capability 未登记：${handoff.capability}`);
      }
      validateId(handoff.targetId, `${handoffPath}.targetId`, issues);
      validateIdList(handoff.goalIds, `${handoffPath}.goalIds`, issues);
      (handoff.goalIds || []).forEach((goalId) => {
        if (!milestoneIds.includes(goalId)) {
          issues.push(`${handoffPath}.goalIds 引用了未知里程碑：${goalId}`);
          return;
        }
        const milestone = findById(node.milestones, goalId);
        getConditionFactIds(milestone.satisfiedWhen).forEach((factId) => {
          const fact = findById(data.facts, factId);
          if (fact && fact.producer !== handoff.capability) {
            issues.push(
              `${handoffPath} 不能要求 ${handoff.capability} 产生 ${fact.producer} 事实：${factId}`,
            );
          }
        });
      });
      validateCondition(
        handoff.startWhen,
        `${handoffPath}.startWhen`,
        data.facts.map((fact) => fact.id),
        milestoneIds,
        issues,
      );
      if (handoff.capability === "conversation") {
        validateIdList(handoff.npcIds, `${handoffPath}.npcIds`, issues);
        (handoff.npcIds || []).forEach((npcId) => {
          if (!data.characters.includes(npcId)) {
            issues.push(`${handoffPath}.npcIds 引用了未知人物：${npcId}`);
          }
        });
      }
      if (
        handoff.capability === "minigame" &&
        !data.minigames.includes(handoff.targetId)
      ) {
        issues.push(`${handoffPath}.targetId 引用了未知小游戏：${handoff.targetId}`);
      }
    });

    const actionIds = Array.isArray(node.actions)
      ? node.actions.map((action) => action && action.id)
      : [];
    validateIdList(actionIds, `${path}.actions`, issues);
    actionIds.forEach((actionId) => globalActionIds.push(actionId));
    (node.actions || []).forEach((action, actionIndex) => {
      const actionPath = `${path}.actions[${actionIndex}]`;
      if (!isObject(action)) {
        issues.push(`${actionPath} 必须是对象`);
        return;
      }
      if (!hasText(action.label)) {
        issues.push(`${actionPath}.label 不能为空`);
      }
      if (!actionTypes.includes(action.actionType)) {
        issues.push(`${actionPath}.actionType 未登记：${action.actionType}`);
      }
      validateCondition(
        action.availableWhen,
        `${actionPath}.availableWhen`,
        data.facts.map((fact) => fact.id),
        milestoneIds,
        issues,
      );
      validateEffect(action.effect, `${actionPath}.effect`, data, issues);
      if (
        action.actionType === "choice" &&
        action.effect &&
        action.effect.eventType !== "CHOICE_MADE"
      ) {
        issues.push(`${actionPath} 的 choice 必须产生 CHOICE_MADE`);
      }
    });

    const presentationIds = Array.isArray(node.presentations)
      ? node.presentations.map((presentation) => presentation && presentation.id)
      : [];
    validateIdList(presentationIds, `${path}.presentations`, issues);
    (node.presentations || []).forEach((presentation, presentationIndex) => {
      const presentationPath = `${path}.presentations[${presentationIndex}]`;
      if (!isObject(presentation)) {
        issues.push(`${presentationPath} 必须是对象`);
        return;
      }
      validateCondition(
        presentation.when,
        `${presentationPath}.when`,
        data.facts.map((fact) => fact.id),
        milestoneIds,
        issues,
      );
      if (!data.locations.includes(presentation.sceneId)) {
        issues.push(`${presentationPath}.sceneId 未登记：${presentation.sceneId}`);
      }
      if (!Array.isArray(presentation.blocks)) {
        issues.push(`${presentationPath}.blocks 必须是数组`);
      } else {
        const blockIds = presentation.blocks.map((block) => block && block.id);
        validateIdList(blockIds, `${presentationPath}.blocks`, issues);
        presentation.blocks.forEach((block, blockIndex) => {
          if (!blockTypes.includes(block && block.blockType)) {
            issues.push(`${presentationPath}.blocks[${blockIndex}].blockType 不合法`);
          }
          if (!hasText(block && block.text)) {
            issues.push(`${presentationPath}.blocks[${blockIndex}].text 不能为空`);
          }
        });
      }
      validateIdList(presentation.actionIds, `${presentationPath}.actionIds`, issues);
      (presentation.actionIds || []).forEach((actionId) => {
        if (!actionIds.includes(actionId)) {
          issues.push(`${presentationPath}.actionIds 引用了未知操作：${actionId}`);
        }
      });
    });

    if (!Array.isArray(node.onComplete)) {
      issues.push(`${path}.onComplete 必须是数组`);
    } else {
      node.onComplete.forEach((effect, effectIndex) => {
        validateEffect(effect, `${path}.onComplete[${effectIndex}]`, data, issues);
        if (effect && effect.id) {
          effectIds.push(effect.id);
        }
      });
    }
    if (containsDuplicate(effectIds)) {
      issues.push(`${path} 的 onReach/onComplete 效果 ID 重复`);
    }

    const transitionIds = Array.isArray(node.transitions)
      ? node.transitions.map((transition) => transition && transition.id)
      : [];
    validateIdList(transitionIds, `${path}.transitions`, issues);
    let defaultTransitionCount = 0;
    (node.transitions || []).forEach((transition, transitionIndex) => {
      const transitionPath = `${path}.transitions[${transitionIndex}]`;
      if (!isObject(transition)) {
        issues.push(`${transitionPath} 必须是对象`);
        return;
      }
      if (!nodeIds.includes(transition.to)) {
        issues.push(`${transitionPath}.to 指向未知 Node：${transition.to}`);
      }
      if (transition.when === undefined) {
        defaultTransitionCount += 1;
      } else {
        validateCondition(
          transition.when,
          `${transitionPath}.when`,
          data.facts.map((fact) => fact.id),
          milestoneIds,
          issues,
        );
      }
    });
    if (defaultTransitionCount > 1) {
      issues.push(`${path} 最多只能有一个默认转移`);
    }

    if (typeof node.completesStage !== "boolean") {
      issues.push(`${path}.completesStage 必须是布尔值`);
    }
    if (typeof node.terminal !== "boolean") {
      issues.push(`${path}.terminal 必须是布尔值`);
    } else if (node.terminal) {
      if (transitionIds.length !== 0) {
        issues.push(`${path} 是终局，transitions 必须为空`);
      }
      validateId(node.endingId, `${path}.endingId`, issues);
    } else {
      if (transitionIds.length === 0) {
        issues.push(`${path} 不是终局，必须有出口`);
      }
      if (node.endingId !== null) {
        issues.push(`${path}.endingId 在非终局必须为 null`);
      }
    }
  }

  function validateStoryData(data) {
    const issues = [];
    if (!isObject(data)) {
      return { ok: false, issues: ["剧情数据必须是对象"] };
    }
    if (data.contractVersion !== "1.0") {
      issues.push(`contractVersion 必须是 1.0，实际为 ${data.contractVersion}`);
    }
    if (!hasText(data.moduleVersion)) {
      issues.push("moduleVersion 不能为空");
    }
    ["stages", "characters", "items", "clues", "locations", "minigames"].forEach(
      (field) => validateIdList(data[field], field, issues),
    );
    if (!Array.isArray(data.facts)) {
      issues.push("facts 必须是数组");
    } else {
      const factIds = data.facts.map((fact) => fact && fact.id);
      validateIdList(factIds, "facts", issues);
      data.facts.forEach((fact, index) => {
        if (!isObject(fact) || !capabilities.concat(["story", "state"]).includes(fact.producer)) {
          issues.push(`facts[${index}].producer 未登记`);
        }
        if (fact && fact.producer === "state") {
          if (
            !isObject(fact.derivedFrom) ||
            !["ITEM_ACQUIRED", "LOCATION_UNLOCKED", "CHOICE_MADE"].includes(
              fact.derivedFrom.eventType,
            ) ||
            !hasText(fact.derivedFrom.targetId)
          ) {
            issues.push(`facts[${index}].derivedFrom 未正确声明状态派生来源`);
          }
          if (
            fact.derivedFrom &&
            fact.derivedFrom.eventType === "ITEM_ACQUIRED" &&
            !data.items.includes(fact.derivedFrom.targetId)
          ) {
            issues.push(`facts[${index}].derivedFrom 引用了未知物品`);
          }
          if (
            fact.derivedFrom &&
            fact.derivedFrom.eventType === "LOCATION_UNLOCKED" &&
            !data.locations.includes(fact.derivedFrom.targetId)
          ) {
            issues.push(`facts[${index}].derivedFrom 引用了未知地点`);
          }
        }
      });
    }
    if (!Array.isArray(data.nodes)) {
      issues.push("nodes 必须是数组");
      return { ok: false, issues };
    }

    const nodeIds = data.nodes.map((node) => node && node.id);
    validateIdList(nodeIds, "nodes", issues);
    validateId(data.startNodeId, "startNodeId", issues);
    validateId(data.endNodeId, "endNodeId", issues);
    if (!nodeIds.includes(data.startNodeId)) {
      issues.push(`起始 Node 不存在：${data.startNodeId}`);
    }
    if (!nodeIds.includes(data.endNodeId)) {
      issues.push(`结束 Node 不存在：${data.endNodeId}`);
    }
    if (Array.isArray(data.expectedNodeIds)) {
      const missing = data.expectedNodeIds.filter((id) => !nodeIds.includes(id));
      const unexpected = nodeIds.filter((id) => !data.expectedNodeIds.includes(id));
      missing.forEach((id) => issues.push(`缺少 V1 Node：${id}`));
      unexpected.forEach((id) => issues.push(`出现未登记 V1 Node：${id}`));
    }

    const globalActionIds = [];
    data.nodes.forEach((node) =>
      validateNode(node, data, nodeIds, globalActionIds, issues),
    );
    if (containsDuplicate(globalActionIds)) {
      issues.push("全部 Node 范围内存在重复 actionId");
    }

    const visited = [];
    const waiting = nodeIds.includes(data.startNodeId) ? [data.startNodeId] : [];
    while (waiting.length > 0) {
      const currentId = waiting.shift();
      if (visited.includes(currentId)) {
        continue;
      }
      visited.push(currentId);
      const current = findById(data.nodes, currentId);
      (current && Array.isArray(current.transitions) ? current.transitions : []).forEach(
        (transition) => {
          if (transition && nodeIds.includes(transition.to) && !visited.includes(transition.to)) {
            waiting.push(transition.to);
          }
        },
      );
    }
    if (!visited.includes(data.endNodeId)) {
      issues.push(`从 ${data.startNodeId} 无法到达 ${data.endNodeId}`);
    }
    nodeIds
      .filter((id) => !visited.includes(id))
      .forEach((id) => issues.push(`Node 无法从起点到达：${id}`));

    return { ok: issues.length === 0, issues };
  }

  internal.storyRules = {
    evaluateCondition,
    findById,
    getConditionFactIds,
    isObject,
    validateStoryData,
  };
})(window);
