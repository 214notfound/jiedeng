import test from "node:test";
import assert from "node:assert/strict";
import {resolveAchievementLoadResult} from "../../assets/js/achievements/game/achievement-load-policy.js";
import {createAchievements} from "../../assets/js/achievements/game/achievements.js";

test("成功读档原样交给成就模块且只显示已提交成就", () => {
  const state = {
    facts: ["map-puzzle-completed"],
    achievements: ["map-restorer"],
    achievementTimes: {"map-restorer": "2026-09-09T00:00:00.000Z"}
  };
  const resolved = resolveAchievementLoadResult({ok: true, data: state});
  assert.equal(resolved.state, state);
  const service = createAchievements({
    getContext: () => ({storageScope: "guest", state: resolved.state}),
    subscribe: () => () => {}
  });
  assert.equal(service.listAchievements()[0].unlocked, true);
  service.dispose();
});

test("只有 SAVE_NOT_FOUND 生成只读初始锁定列表", () => {
  const loadResult = {ok: false, code: "SAVE_NOT_FOUND", message: "暂无存档。"};
  const before = structuredClone(loadResult);
  const resolved = resolveAchievementLoadResult(loadResult);
  assert.equal(resolved.ok, true);
  assert.equal(resolved.notice, "当前还没有游戏存档。");
  assert.deepEqual(resolved.state, {facts: [], achievements: [], achievementTimes: {}});
  assert.deepEqual(loadResult, before);

  const service = createAchievements({
    getContext: () => ({storageScope: "guest", state: resolved.state}),
    subscribe: () => () => {}
  });
  assert.equal(service.listAchievements()[0].unlocked, false);
  service.dispose();
});

for (const [code, message] of [
  ["SAVE_INVALID", "游戏存档损坏，暂时无法读取成就。"],
  ["SAVE_VERSION_UNSUPPORTED", "游戏存档版本不兼容，暂时无法读取成就。"],
  ["SAVE_SCOPE_MISMATCH", "当前登录身份与游戏存档不匹配。"],
  ["STORAGE_UNAVAILABLE", "浏览器存储不可用，暂时无法读取成就。"]
]) {
  test(`${code} 保留失败并且不伪造初始成就状态`, () => {
    const loadResult = {
      ok: false,
      code,
      message: "内部返回说明",
      data: {raw: "必须保留的原数据"}
    };
    const before = structuredClone(loadResult);
    const resolved = resolveAchievementLoadResult(loadResult);
    assert.deepEqual(resolved, {ok: false, message});
    assert.equal("state" in resolved, false);
    assert.deepEqual(loadResult, before);
  });
}

test("未知或不可信读档结果使用通用玩家提示且不生成状态", () => {
  for (const input of [null, {}, {ok: false, code: "UNKNOWN"}]) {
    const resolved = resolveAchievementLoadResult(input);
    assert.equal(resolved.ok, false);
    assert.equal("state" in resolved, false);
    assert.equal(resolved.message, "暂时无法读取成就，请返回主菜单重试。");
  }
});
