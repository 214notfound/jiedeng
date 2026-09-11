import test from "node:test";
import assert from "node:assert/strict";
import {
  adaptConversationChoiceInput,
  adaptConversationInput,
  adaptStoryPresentation
} from "../../assets/js/core/reading-contract.js";
import {V2_CONVERSATIONS} from "../../assets/js/exploration/conversation/data/conversations-v2.js";

const presentation = {
  presentationId: "present-prologue-wake",
  sceneId: "shrine",
  blocks: [
    {blockId: "line-1", blockType: "narration", text: "暴雨停了。"},
    {blockId: "line-2", blockType: "system", text: "你醒来了。"}
  ],
  actions: [
    {actionId: "confirm-wake-context", label: "确认当前处境", actionType: "advance"}
  ]
};

test("剧情 presentation 规范化为统一阅读输入", () => {
  const result = adaptStoryPresentation(presentation);

  assert.equal(result.mode, "story");
  assert.deepEqual(result.items.map((item) => item.id), ["line-1", "line-2"]);
  assert.equal(result.items[1].kind, "system");
  assert.equal(result.actions[0].actionId, "confirm-wake-context");
  assert.equal(result.metadata.sceneId, "shrine");
});

test("NPC dialogues 保留顺序和业务身份", () => {
  const result = adaptConversationInput({
    conversation: {
      speaker: "老板",
      dialogues: [
        {lineId: "shopkeeper-01", text: "【旁白】卷帘门只升起一半。"},
        {lineId: "shopkeeper-02", text: "【老板】买东西自己拿。"}
      ]
    },
    conversationId: "village-shopkeeper-inquiry",
    npcId: "villager-1",
    actionId: "shopkeeper-inquiry",
    commandId: "cmd-village-inquiries-village-shopkeeper-inquiry"
  });

  assert.equal(result.mode, "conversation");
  assert.deepEqual(result.items.map((item) => item.id), ["shopkeeper-01", "shopkeeper-02"]);
  assert.equal(result.items[0].text.startsWith("【旁白】"), true);
  assert.equal(result.metadata.npcId, "villager-1");
});

test("NPC Choice 输入只提供分支选项，不伪装成已完成对白", () => {
  const result = adaptConversationChoiceInput({
    prompt: {lineId: "key-choice", text: "【小X】他把钥匙递到你面前。"},
    choices: [
      {actionId: "receive-key", label: "直接接过钥匙", actionType: "choice"},
      {actionId: "ask-memory", label: "追问过去", actionType: "choice"}
    ],
    conversationId: "prologue-key-and-memory",
    npcId: "companion-x",
    commandId: "cmd-prologue-belongings-prologue-key-and-memory"
  });

  assert.equal(result.mode, "conversation");
  assert.equal(result.readingState, "choice");
  assert.deepEqual(result.actions.map((action) => action.actionId), ["receive-key", "ask-memory"]);
  assert.equal(result.items.length, 1);
  assert.equal("actionId" in result.metadata, false);
});

test("正式 V2 老板资产保留 15 段顺序", () => {
  const conversation = V2_CONVERSATIONS["shopkeeper-inquiry"];
  const result = adaptConversationInput({
    conversation,
    conversationId: "village-shopkeeper-inquiry",
    npcId: "villager-1",
    actionId: "shopkeeper-inquiry",
    commandId: "cmd-village-inquiries-village-shopkeeper-inquiry"
  });

  assert.equal(result.items.length, 15);
  assert.equal(result.items[0].id, "shopkeeper-01");
  assert.equal(result.items.at(-1).id, "shopkeeper-15");
  assert.equal(result.items[11].text.startsWith("【小 X】"), true);
});

test("适配器拒绝缺失或重复字段", () => {
  assert.throws(
    () => adaptStoryPresentation({...presentation, blocks: [
      {blockId: "missing-text", blockType: "narration"}
    ]}),
    /presentation\.blocks\[0\]\.text/
  );
  assert.throws(
    () => adaptConversationInput({
      conversation: {speaker: "老板"},
      conversationId: "conversation",
      npcId: "npc",
      actionId: "action",
      commandId: "command"
    }),
    /conversation\.dialogues/
  );
  assert.throws(
    () => adaptConversationInput({
      conversation: {speaker: "老板", dialogues: [
        {lineId: "same", text: "一"},
        {lineId: "same", text: "二"}
      ]},
      conversationId: "conversation",
      npcId: "npc",
      actionId: "action",
      commandId: "command"
    }),
    /不能重复/
  );
  assert.throws(
    () => adaptConversationChoiceInput({
      prompt: {lineId: "choice", text: "请选择。"},
      choices: [{actionId: "only-one", label: "唯一选项", actionType: "choice"}],
      conversationId: "conversation",
      npcId: "npc",
      commandId: "command"
    }),
    /2 至 4/
  );
});
