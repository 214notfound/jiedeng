function requireNonEmptyString(value, fieldName) {
  if (typeof value !== "string" || value.trim() === "") {
    throw new TypeError(`${fieldName} 必须是非空字符串`);
  }
  return value;
}

function requireUniqueItems(items, fieldName) {
  const ids = items.map((item) => item.id);
  if (new Set(ids).size !== ids.length) {
    throw new TypeError(`${fieldName} 的 id 不能重复`);
  }
}

function normalizeItems(items, fieldName, defaultKind) {
  if (!Array.isArray(items)) {
    throw new TypeError(`${fieldName} 必须是数组`);
  }

  const normalized = items.map((item, index) => {
    if (!item || typeof item !== "object") {
      throw new TypeError(`${fieldName}[${index}] 必须是对象`);
    }

    const id = requireNonEmptyString(item.id, `${fieldName}[${index}].id`);
    const text = requireNonEmptyString(item.text, `${fieldName}[${index}].text`);
    const kind = item.kind ?? defaultKind;

    requireNonEmptyString(kind, `${fieldName}[${index}].kind`);
    return Object.freeze({id, kind, text});
  });

  requireUniqueItems(normalized, fieldName);
  return normalized;
}

function normalizeActions(actions) {
  if (actions === undefined) {
    return [];
  }
  if (!Array.isArray(actions)) {
    throw new TypeError("actions 必须是数组");
  }

  const normalized = actions.map((action, index) => {
    if (!action || typeof action !== "object") {
      throw new TypeError(`actions[${index}] 必须是对象`);
    }

    return Object.freeze({
      actionId: requireNonEmptyString(action.actionId, `actions[${index}].actionId`),
      label: requireNonEmptyString(action.label, `actions[${index}].label`),
      actionType: action.actionType ?? "advance"
    });
  });

  const ids = normalized.map((action) => action.actionId);
  if (new Set(ids).size !== ids.length) {
    throw new TypeError("actions 的 actionId 不能重复");
  }
  return normalized;
}

export function adaptStoryPresentation(presentation) {
  if (!presentation || typeof presentation !== "object") {
    throw new TypeError("presentation 必须是对象");
  }
  if (!Array.isArray(presentation.blocks)) {
    throw new TypeError("presentation.blocks 必须是数组");
  }

  const items = normalizeItems(
    presentation.blocks.map((block) => ({
      id: block?.blockId,
      kind: block?.blockType,
      text: block?.text
    })),
    "presentation.blocks",
    "narration"
  );

  for (const item of items) {
    if (!["narration", "system"].includes(item.kind)) {
      throw new TypeError(`不支持的剧情文本类型：${item.kind}`);
    }
  }

  return Object.freeze({
    mode: "story",
    items,
    actions: normalizeActions(presentation.actions),
    metadata: Object.freeze({
      presentationId: requireNonEmptyString(
        presentation.presentationId,
        "presentation.presentationId"
      ),
      sceneId: requireNonEmptyString(presentation.sceneId, "presentation.sceneId")
    })
  });
}

export function adaptConversationInput({
  conversation,
  conversationId,
  npcId,
  actionId,
  commandId
}) {
  if (!conversation || typeof conversation !== "object") {
    throw new TypeError("NPC 对话输入必须是对象");
  }

  const speaker = requireNonEmptyString(conversation.speaker, "conversation.speaker");
  const dialogues = normalizeItems(
    conversation.dialogues.map((line) => ({
      id: line?.lineId,
      text: line?.text,
      kind: "dialogue"
    })),
    "conversation.dialogues",
    "dialogue"
  );

  for (const item of dialogues) {
    if (item.kind !== "dialogue") {
      throw new TypeError("NPC 对话条目不允许覆盖 kind");
    }
  }

  return Object.freeze({
    mode: "conversation",
    speaker,
    items: dialogues,
    actions: [],
    metadata: Object.freeze({
      conversationId: requireNonEmptyString(conversationId, "conversationId"),
      npcId: requireNonEmptyString(npcId, "npcId"),
      actionId: requireNonEmptyString(actionId, "actionId"),
      commandId: requireNonEmptyString(commandId, "commandId")
    })
  });
}

export function adaptConversationChoiceInput({
  prompt,
  choices,
  conversationId,
  npcId,
  commandId
}) {
  const normalizedPrompt = normalizeItems([{
    id: prompt?.lineId,
    text: prompt?.text,
    kind: "dialogue"
  }], "conversation.choicePrompt", "dialogue");
  const actions = normalizeActions(choices);
  if (actions.length < 2 || actions.length > 4) {
    throw new TypeError("NPC Choice 必须包含 2 至 4 个选项");
  }
  if (actions.some((action) => action.actionType !== "choice")) {
    throw new TypeError("NPC Choice 的 actionType 必须是 choice");
  }

  return Object.freeze({
    mode: "conversation",
    readingState: "choice",
    items: normalizedPrompt,
    actions,
    metadata: Object.freeze({
      conversationId: requireNonEmptyString(conversationId, "conversationId"),
      npcId: requireNonEmptyString(npcId, "npcId"),
      commandId: requireNonEmptyString(commandId, "commandId")
    })
  });
}
