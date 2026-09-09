import test from "node:test";
import assert from "node:assert/strict";
import {
  containsTechnicalFeedback,
  playerFacingFeedback,
  storageResultFeedback
} from "../../assets/js/core/player-feedback.js";

test("正式反馈隐藏技术字段并保留普通中文提示", () => {
  assert.equal(containsTechnicalFeedback("commandId 无效"), true);
  assert.equal(
    playerFacingFeedback("commandId 无效", {type: "error"}),
    "操作没有完成，请重试；仍无法继续时请返回主菜单。"
  );
  assert.equal(
    playerFacingFeedback("缺少开门所需的旧钥匙。", {type: "warning"}),
    "缺少开门所需的旧钥匙。"
  );
});

test("读档错误映射为玩家可执行的下一步", () => {
  assert.equal(
    storageResultFeedback({ok: false, code: "SAVE_NOT_FOUND", message: "暂无存档。"}),
    "没有找到可继续的存档，请返回主菜单开始新游戏。"
  );
  assert.equal(
    storageResultFeedback({ok: false, code: "SAVE_VERSION_UNSUPPORTED"}, {compact: true}),
    "检测到旧版存档，当前版本不能继续"
  );
  assert.equal(
    storageResultFeedback({ok: false, code: "STORAGE_UNAVAILABLE"}),
    "暂时无法读取游戏进度，请检查浏览器存储设置后重试。"
  );
});

test("保存结果不会把错误码或内部消息交给页面", () => {
  assert.equal(
    storageResultFeedback({ok: false, code: "STORAGE_UNAVAILABLE"}, {operation: "save"}),
    "保存失败，请检查浏览器存储设置后重试。"
  );
  assert.equal(storageResultFeedback({ok: true}, {operation: "save"}), "进度已保存。");
});
