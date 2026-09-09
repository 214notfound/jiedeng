import test from "node:test";
import assert from "node:assert/strict";
import {splitSpeakerLabel} from "../../assets/js/core/game-ui.js";

test("橙光式姓名牌只拆分正文开头的完整角色标签", () => {
  assert.deepEqual(
    splitSpeakerLabel("【老板】买东西自己拿。"),
    {speaker: "老板", text: "买东西自己拿。"}
  );
  assert.deepEqual(
    splitSpeakerLabel("雨声里传来【老板】的招呼。"),
    {speaker: null, text: "雨声里传来【老板】的招呼。"}
  );
  assert.deepEqual(
    splitSpeakerLabel("【未闭合的标签"),
    {speaker: null, text: "【未闭合的标签"}
  );
  assert.deepEqual(
    splitSpeakerLabel("【  】不能作为角色名。"),
    {speaker: null, text: "【  】不能作为角色名。"}
  );
});
