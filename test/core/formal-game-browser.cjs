// 正式游戏 URL 抽检。需要 Playwright，禁止使用 debug=1 或 Demo 页面。
const fs = require("node:fs");
const path = require("node:path");
const http = require("node:http");
const os = require("node:os");
const assert = require("node:assert/strict");
const {chromium} = require(process.env.PLAYWRIGHT_MODULE_PATH || "playwright");

const root = path.resolve(__dirname, "../..");
const output = fs.mkdtempSync(path.join(os.tmpdir(), "jiedeng-formal-game-"));
const sessionKey = "white-lamp:auth:session:v1";
const saveKey = "white-lamp:save:guest:v2";
const legacySaveKey = "white-lamp:save:guest:v1";
const guestSession = {
  schemaVersion: 1,
  userId: "guest",
  username: "游客",
  userType: "guest",
  storageScope: "guest",
  startedAt: "2026-09-10T00:00:00.000Z"
};
const technicalPattern = /(?:\b(?:nodeId|commandId|eventType|factId|storyCheckpoint|storageScope)\b|[A-Z]{2,}(?:_[A-Z0-9]+)+|at\s+\w+\s*\()/;

function startServer() {
  const mime = {
    ".html": "text/html; charset=utf-8",
    ".js": "text/javascript; charset=utf-8",
    ".mjs": "text/javascript; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".svg": "image/svg+xml",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".woff2": "font/woff2",
    ".ttf": "font/ttf"
  };
  const server = http.createServer((request, response) => {
    const pathname = decodeURIComponent(new URL(request.url, "http://local").pathname);
    const file = path.resolve(root, "." + pathname);
    if (!file.startsWith(root + path.sep) || !fs.existsSync(file) || !fs.statSync(file).isFile()) {
      response.writeHead(404).end();
      return;
    }
    response.setHeader("Content-Type", mime[path.extname(file).toLowerCase()] || "application/octet-stream");
    response.end(fs.readFileSync(file));
  });
  return new Promise((resolve) => server.listen(0, "127.0.0.1", () => resolve(server)));
}

async function createContext(browser, options = {}) {
  const context = await browser.newContext({viewport: options.viewport || {width: 1280, height: 900}});
  await context.addInitScript((setup) => {
    if (setup.session) sessionStorage.setItem(setup.sessionKey, JSON.stringify(setup.session));
    for (const entry of setup.storageEntries) localStorage.setItem(entry[0], entry[1]);
    if (setup.failRead || setup.failWrite) {
      const originalGet = Storage.prototype.getItem;
      const originalSet = Storage.prototype.setItem;
      Storage.prototype.getItem = function(key) {
        if (setup.failRead && this === window.localStorage && String(key).startsWith("white-lamp:save:")) {
          throw new DOMException("blocked", "SecurityError");
        }
        return originalGet.call(this, key);
      };
      Storage.prototype.setItem = function(key, value) {
        if (setup.failWrite && this === window.localStorage && String(key).startsWith("white-lamp:save:")) {
          throw new DOMException("quota", "QuotaExceededError");
        }
        return originalSet.call(this, key, value);
      };
    }
  }, {
    sessionKey,
    session: options.withSession === false ? null : guestSession,
    storageEntries: options.storageEntries || [],
    failRead: Boolean(options.failRead),
    failWrite: Boolean(options.failWrite)
  });
  if (options.missingCover) {
    await context.route("**/assets/images/backgrounds/cover.jpg", (route) => route.fulfill({
      status: 404,
      contentType: "text/plain",
      body: "missing"
    }));
  }
  if (options.missingItem) {
    await context.route("**/assets/images/exploration/items/key-a.svg", (route) => route.fulfill({
      status: 404,
      contentType: "text/plain",
      body: "missing"
    }));
  }
  return context;
}

async function visibleFeedback(page) {
  const feedback = page.locator("#feedback:not([hidden])");
  await feedback.waitFor();
  return (await feedback.innerText()).trim();
}

async function assertPlayerSafe(page) {
  const text = await page.locator("body").innerText();
  assert.doesNotMatch(text, technicalPattern);
  assert.equal(new URL(page.url()).searchParams.has("debug"), false);
}

(async () => {
  const server = await startServer();
  const base = "http://127.0.0.1:" + server.address().port;
  let browser;
  const completed = [];
  let validSave = null;
  try {
    browser = await chromium.launch({channel: "msedge", headless: true});

    // C01 + C20（装饰背景 404）：正式新游戏仍可阅读，并完成三视口横向溢出检查。
    {
      const context = await createContext(browser, {missingCover: true});
      const page = await context.newPage();
      await page.goto(base + "/pages/game.html?mode=new");
      await page.locator("#game-story .story-block").waitFor();
      for (const width of [390, 768, 1280]) {
        await page.setViewportSize({width, height: width === 390 ? 844 : 900});
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
        await page.screenshot({path: path.join(output, "new-" + width + ".png"), fullPage: true});
      }
      const readingBeforeFailure = await page.locator("#game-story").innerText();
      const rejectedResult = await page.evaluate(() => globalThis.WhiteLamp.game.handleStoryAction("invalid-test-action"));
      assert.equal(rejectedResult.ok, false);
      assert.equal(await page.locator("#game-story").innerText(), readingBeforeFailure);
      assert.match(await visibleFeedback(page), /重试|返回主菜单/);
      await assertPlayerSafe(page);
      completed.push("C01", "C14", "C20-background");
      await context.close();
    }

    // C05：非法启动方式。
    {
      const context = await createContext(browser);
      const page = await context.newPage();
      await page.goto(base + "/pages/game.html?mode=wrong");
      assert.match(await visibleFeedback(page), /返回主菜单/);
      await assertPlayerSafe(page);
      completed.push("C05");
      await context.close();
    }

    // C06：无会话直接进入正式游戏页。
    {
      const context = await createContext(browser, {withSession: false});
      const page = await context.newPage();
      await page.goto(base + "/pages/game.html?mode=new");
      await page.waitForURL("**/pages/authorize/login.html");
      completed.push("C06");
      await context.close();
    }

    // C07：无档继续。
    {
      const context = await createContext(browser);
      const page = await context.newPage();
      await page.goto(base + "/pages/game.html?mode=continue");
      assert.match(await visibleFeedback(page), /没有找到可继续的存档/);
      await assertPlayerSafe(page);
      completed.push("C07");
      await context.close();
    }

    // C08：坏档不被覆盖。
    {
      const broken = "{not-json";
      const context = await createContext(browser, {storageEntries: [[saveKey, broken]]});
      const page = await context.newPage();
      await page.goto(base + "/pages/game.html?mode=continue");
      assert.match(await visibleFeedback(page), /存档无法读取/);
      assert.equal(await page.evaluate((key) => localStorage.getItem(key), saveKey), broken);
      await assertPlayerSafe(page);
      completed.push("C08");
      await context.close();
    }

    // C09：旧版本存档保留。
    {
      const legacy = JSON.stringify({schemaVersion: 1});
      const context = await createContext(browser, {storageEntries: [[legacySaveKey, legacy]]});
      const page = await context.newPage();
      await page.goto(base + "/pages/game.html?mode=continue");
      assert.match(await visibleFeedback(page), /旧版存档/);
      assert.equal(await page.evaluate((key) => localStorage.getItem(key), legacySaveKey), legacy);
      await assertPlayerSafe(page);
      completed.push("C09");
      await context.close();
    }

    // C11：存储读取失败。
    {
      const context = await createContext(browser, {failRead: true});
      const page = await context.newPage();
      await page.goto(base + "/pages/game.html?mode=continue");
      assert.match(await visibleFeedback(page), /浏览器存储设置/);
      await assertPlayerSafe(page);
      completed.push("C11");
      await context.close();
    }

    // C12：存储写入失败时不能显示保存成功。
    {
      const context = await createContext(browser, {failWrite: true});
      const page = await context.newPage();
      await page.goto(base + "/pages/game.html?mode=new");
      await page.locator("#game-story .story-block").waitFor();
      await page.getByRole("button", {name: "保存进度"}).click();
      const message = await visibleFeedback(page);
      assert.match(message, /保存失败/);
      assert.doesNotMatch(message, /进度已保存/);
      await assertPlayerSafe(page);
      completed.push("C12");
      await context.close();
    }

    // C13：正常保存。
    {
      const context = await createContext(browser);
      const page = await context.newPage();
      await page.goto(base + "/pages/game.html?mode=new");
      await page.locator("#game-story .story-block").waitFor();
      await page.getByRole("button", {name: "保存进度"}).click();
      assert.equal(await visibleFeedback(page), "进度已保存。");
      validSave = await page.evaluate((key) => localStorage.getItem(key), saveKey);
      assert.ok(validSave);
      await assertPlayerSafe(page);
      completed.push("C13");
      await context.close();
    }

    // C04：有效存档可从正式 continue URL 恢复。
    {
      const context = await createContext(browser, {storageEntries: [[saveKey, validSave]]});
      const page = await context.newPage();
      await page.goto(base + "/pages/game.html?mode=continue");
      await page.locator("#game-story .story-block").waitFor();
      await assertPlayerSafe(page);
      completed.push("C04");
      await context.close();
    }

    // C20（内容图片 404）：缩略图与详情图降级，物品文字仍可读取。
    {
      const context = await createContext(browser, {missingItem: true});
      const page = await context.newPage();
      await page.goto(base + "/pages/game.html?mode=new");
      await page.locator("#game-story .story-block").waitFor();
      await page.evaluate(() => globalThis.WhiteLamp.game.update({
        eventId: "evt-test-resource-item",
        eventType: "ITEM_ACQUIRED",
        onceKey: "once-test-resource-item",
        payload: {itemId: "key-a"}
      }));
      await page.getByRole("button", {name: "背包", exact: true}).click();
      const itemEntry = page.locator('[data-item-id="key-a"]');
      await itemEntry.waitFor();
      await page.locator(".resource-fallback--thumbnail:not([hidden])").waitFor();
      await itemEntry.click();
      await page.locator("#detail-root:not([hidden]) .resource-fallback:not([hidden])").waitFor();
      assert.match(await page.locator("#detail-root").innerText(), /图片暂不可用|旧钥匙/);
      await assertPlayerSafe(page);
      completed.push("C20-item");
      await context.close();
    }

    // C02 / C03：菜单覆盖确认必须尊重玩家选择。
    {
      const context = await createContext(browser, {storageEntries: [[saveKey, validSave]]});
      const page = await context.newPage();
      await page.goto(base + "/pages/menu.html");
      page.once("dialog", (dialog) => dialog.dismiss());
      await page.getByRole("button", {name: "开始新游戏"}).click();
      assert.match(page.url(), /pages[/]menu[.]html$/);
      page.once("dialog", (dialog) => dialog.accept());
      await page.getByRole("button", {name: "开始新游戏"}).click();
      await page.waitForURL("**/pages/game.html?mode=new");
      completed.push("C02", "C03");
      await context.close();
    }

    // C10：键名属于当前游客但内容声明为其他账户时拒绝载入。
    {
      const mismatchedState = JSON.parse(validSave);
      mismatchedState.storageScope = "account:other-user";
      const mismatchedSave = JSON.stringify(mismatchedState);
      const context = await createContext(browser, {storageEntries: [[saveKey, mismatchedSave]]});
      const page = await context.newPage();
      await page.goto(base + "/pages/game.html?mode=continue");
      assert.match(await visibleFeedback(page), /不属于此账户/);
      assert.equal(await page.evaluate((key) => localStorage.getItem(key), saveKey), mismatchedSave);
      await assertPlayerSafe(page);
      completed.push("C10");
      await context.close();
    }

    console.log("正式 URL 抽检通过：" + completed.join(", "));
    console.log("截图目录：" + output);
  } finally {
    await browser?.close();
    await new Promise((resolve) => server.close(resolve));
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
