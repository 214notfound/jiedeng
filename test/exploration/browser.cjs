// 正式 V2 页面浏览器回归：E1-E5，不使用独立探索演示页或 V1 页面接口。
const fs = require("node:fs");
const path = require("node:path");
const http = require("node:http");
const os = require("node:os");
const assert = require("node:assert/strict");
const {chromium} = require(process.env.PLAYWRIGHT_MODULE_PATH || "playwright");

const projectRoot = path.resolve(__dirname, "../..");
const outputDirectory = fs.mkdtempSync(path.join(os.tmpdir(), "jiedeng-v2-e1-e5-"));

function contentType(file) {
  return ({
    ".css": "text/css",
    ".html": "text/html",
    ".js": "text/javascript",
    ".jpg": "image/jpeg",
    ".png": "image/png",
    ".svg": "image/svg+xml"
  })[path.extname(file).toLowerCase()] || "application/octet-stream";
}

async function run() {
  const server = http.createServer((request, response) => {
    const requestPath = decodeURIComponent(new URL(request.url, "http://local").pathname);
    const file = path.resolve(projectRoot, `.${requestPath}`);
    if (!file.startsWith(`${projectRoot}${path.sep}`)
      || !fs.existsSync(file)
      || !fs.statSync(file).isFile()) {
      response.writeHead(404).end();
      return;
    }
    response.setHeader("Content-Type", contentType(file));
    response.end(fs.readFileSync(file));
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));

  let browser;
  try {
    browser = await chromium.launch({channel: "msedge", headless: true});
    const page = await browser.newPage({viewport: {width: 1280, height: 900}});
    const pageErrors = [];
    const missingResources = [];
    page.on("pageerror", (error) => pageErrors.push(error.message));
    page.on("response", (response) => {
      if (response.status() >= 400 && !response.url().endsWith("/favicon.ico")) {
        missingResources.push(`${response.status()} ${response.url()}`);
      }
    });

    const base = `http://127.0.0.1:${server.address().port}`;
    await page.goto(`${base}/pages/authorize/login.html`);
    page.once("dialog", (dialog) => dialog.accept());
    await page.getByRole("button", {name: "游客进入", exact: true}).click();
    await page.waitForURL("**/pages/menu.html");
    await page.goto(`${base}/pages/game.html?mode=new&debug=1`);
    await page.waitForFunction(() => globalThis.WhiteLamp?.gamePage?.getViewState);

    async function waitForState(state) {
      await page.locator(`.game-main[data-view-state="${state}"]`).waitFor();
    }

    async function clickVisibleButton(name) {
      const control = page.getByRole("button", {name, exact: true});
      await control.waitFor();
      await control.click();
    }

    async function finishReading() {
      while (true) {
        const control = page.locator(".story-action--continue");
        if (!await control.isVisible().catch(() => false)) return;
        const label = (await control.textContent()).trim();
        await control.click();
        if (label === "读完") return;
      }
    }

    async function finishStoryAction(label) {
      await waitForState("reading");
      await finishReading();
      await clickVisibleButton(label);
    }

    const capturedCharacters = new Set();
    async function completeNpc(actionLabel, choiceLabel, expectedState = "exploration") {
      const characterByAction = {
        "与小X交谈": "companion-x",
        "接过小X递来的旧钥匙": "companion-x",
        "询问白灯与供电异常": "companion-x",
        "询问小卖部老板": "villager-1",
        "询问拒签户": "villager-2",
        "询问年老村民": "villager-3",
        "向小X追问线索之间的矛盾": "companion-x",
        "听门外呼名": null
      };
      const expectedCharacterId = characterByAction[actionLabel];
      await waitForState("exploration");
      assert.equal(await page.locator(".exploration-character-visual:not([hidden])").count(), 0);
      await clickVisibleButton(actionLabel);
      await waitForState("reading");
      if (expectedCharacterId) {
        const visual = page.locator(
          `.exploration-character-visual[data-character-id="${expectedCharacterId}"]:not([hidden])`
        );
        await visual.waitFor();
        await visual.evaluate((image) => image.decode());
        assert.equal(await visual.evaluate((image) => image.naturalWidth > 0), true);
        const [visualRect, stageRect] = await Promise.all([
          visual.boundingBox(),
          page.locator(".exploration-stage").boundingBox()
        ]);
        assert.ok(visualRect && stageRect);
        assert.ok(visualRect.x >= stageRect.x - 1 && visualRect.y >= stageRect.y - 1);
        assert.ok(visualRect.x + visualRect.width <= stageRect.x + stageRect.width + 1);
        assert.ok(visualRect.y + visualRect.height <= stageRect.y + stageRect.height + 1);
        if (!capturedCharacters.has(expectedCharacterId)) {
          capturedCharacters.add(expectedCharacterId);
          await page.screenshot({
            path: path.join(outputDirectory, `reading-${expectedCharacterId}.png`),
            fullPage: true
          });
          if (expectedCharacterId === "companion-x") {
            await page.setViewportSize({width: 390, height: 844});
            assert.equal(
              await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
              true
            );
            const [mobileVisualRect, mobileStageRect] = await Promise.all([
              visual.boundingBox(),
              page.locator(".exploration-stage").boundingBox()
            ]);
            assert.ok(mobileVisualRect && mobileStageRect);
            assert.ok(mobileVisualRect.x >= mobileStageRect.x - 1);
            assert.ok(mobileVisualRect.x + mobileVisualRect.width
              <= mobileStageRect.x + mobileStageRect.width + 1);
            await page.screenshot({
              path: path.join(outputDirectory, "reading-companion-x-mobile.png"),
              fullPage: true
            });
            await page.setViewportSize({width: 1280, height: 900});
          }
        }
      } else {
        assert.equal(await page.locator(".exploration-character-visual:not([hidden])").count(), 0);
      }
      assert.equal(await page.locator(".exploration-hotspots").evaluate((node) =>
        getComputedStyle(node).pointerEvents), "none");
      if (choiceLabel) {
        assert.equal(await page.getByRole("button", {name: "继续", exact: true}).count(), 0);
        await clickVisibleButton(choiceLabel);
      }
      await finishReading();
      await waitForState(expectedState);
      await page.waitForFunction(() => !document.querySelector(
        ".exploration-character-visual:not([hidden])"
      ));
    }

    async function closeDetail(expectedReturn = "exploration") {
      await waitForState("detail");
      const card = page.locator(".detail-card");
      const close = page.getByRole("button", {name: "关闭详情", exact: true});
      const [cardRect, closeRect] = await Promise.all([card.boundingBox(), close.boundingBox()]);
      assert.ok(cardRect && closeRect);
      assert.ok(closeRect.x >= cardRect.x && closeRect.y >= cardRect.y);
      assert.ok(closeRect.x + closeRect.width <= cardRect.x + cardRect.width + 1);
      assert.ok(closeRect.y + closeRect.height <= cardRect.y + cardRect.height + 1);
      assert.ok(closeRect.width >= 44 && closeRect.height >= 44);
      await close.click();
      await waitForState(expectedReturn);
    }

    async function checkExplorationLayout() {
      await page.locator(".exploration-scene-image").evaluate((image) => image.decode());
      for (const width of [390, 768, 1280]) {
        await page.setViewportSize({width, height: width === 390 ? 844 : 900});
        assert.equal(
          await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
          true,
          `horizontal overflow at ${width}`
        );
        const result = await page.evaluate(() => {
          const stage = document.querySelector(".exploration-stage");
          const image = document.querySelector(".exploration-scene-image");
          const stageRect = stage.getBoundingClientRect();
          const buttons = [...document.querySelectorAll(".scene-hotspot")];
          const points = buttons.map((button) => {
            const rect = button.getBoundingClientRect();
            const expectedX = stageRect.left + stageRect.width * Number(button.dataset.hotspotX) / 100;
            const expectedY = stageRect.top + stageRect.height * Number(button.dataset.hotspotY) / 100;
            return {
              id: button.dataset.hotspotId,
              rect: {left: rect.left, top: rect.top, right: rect.right, bottom: rect.bottom,
                width: rect.width, height: rect.height},
              drift: Math.hypot(rect.left + rect.width / 2 - expectedX,
                rect.top + rect.height / 2 - expectedY)
            };
          });
          const overlaps = points.flatMap((left, index) => points.slice(index + 1)
            .filter((right) => Math.min(left.rect.right, right.rect.right)
              - Math.max(left.rect.left, right.rect.left) > 1
              && Math.min(left.rect.bottom, right.rect.bottom)
              - Math.max(left.rect.top, right.rect.top) > 1)
            .map((right) => [left.id, right.id]));
          const imageRatio = image.naturalWidth / image.naturalHeight;
          const stageRatio = stageRect.width / stageRect.height;
          const scale = Math.min(stageRect.width / image.naturalWidth,
            stageRect.height / image.naturalHeight);
          return {
            imageLoaded: image.complete && image.naturalWidth > 0,
            maxLetterbox: Math.max(stageRect.width - image.naturalWidth * scale,
              stageRect.height - image.naturalHeight * scale),
            ratioDifference: Math.abs(imageRatio - stageRatio),
            points,
            overlaps
          };
        });
        assert.equal(result.imageLoaded, true);
        assert.ok(result.maxLetterbox < 1, `scene image letterbox ${result.maxLetterbox} at ${width}`);
        assert.ok(result.ratioDifference < 0.001);
        assert.deepEqual(result.overlaps, [], `hotspot overlap at ${width}`);
        for (const point of result.points) {
          assert.ok(point.rect.width >= 44 && point.rect.height >= 44, `${point.id} hit area`);
          assert.ok(point.drift < 0.75, `${point.id} drift ${point.drift} at ${width}`);
        }
      }
      await page.setViewportSize({width: 1280, height: 900});
    }

    // E4：reading -> inventory -> detail，两级返回且恢复原按钮焦点。
    await waitForState("reading");
    await clickVisibleButton("背包");
    await waitForState("inventory");
    await clickVisibleButton("查看烧毁的工作证详情");
    await closeDetail("inventory");
    assert.equal(
      await page.evaluate(() => document.activeElement?.getAttribute("aria-label")),
      "查看烧毁的工作证详情"
    );
    await clickVisibleButton("关闭背包");
    await waitForState("reading");

    await finishStoryAction("确认当前处境");
    await checkExplorationLayout();

    // E3：探索态只有光点；点击后 reading 显示独立人物层，读完后清除。
    await completeNpc("与小X交谈");
    await checkExplorationLayout();

    // E2：失败不落账、不打开详情；同一热点可重试。
    await page.evaluate(() => globalThis.WhiteLamp.gamePage.failNextExternalEvent());
    await clickVisibleButton("查看烧毁的工作证");
    assert.equal(await page.locator('.game-main[data-view-state="detail"]').count(), 0);
    assert.equal(await page.evaluate(() => WhiteLamp.game.getState().facts
      .includes("burned-work-id-investigated")), false);
    await clickVisibleButton("查看烧毁的工作证");
    await waitForState("detail");
    assert.equal(await page.locator("#detail-root").getAttribute("data-target-id"), "burned-work-id");
    assert.equal(await page.locator("#game-scene").getAttribute("inert"), "");
    await closeDetail();
    assert.equal(await page.evaluate(() => document.activeElement?.dataset.hotspotId), "burned-work-id");

    await clickVisibleButton("查看蓝玻璃珠");
    assert.match(
      await page.locator("#detail-root .detail-card__content img").getAttribute("src"),
      /blue-glass-bead\.png$/
    );
    await closeDetail();
    await completeNpc("接过小X递来的旧钥匙", "追问过去，再接过钥匙", "reading");
    assert.equal(await page.evaluate(() => WhiteLamp.game.getState().facts
      .includes("x-deflects-memory-question-noticed")), false);

    await finishStoryAction("看向祠堂外");
    await completeNpc("询问白灯与供电异常", undefined, "reading");
    await finishStoryAction("前往村口");

    // E1/E2：村口物品 Node 与人物 Node 分离。
    await checkExplorationLayout();
    assert.deepEqual(
      await page.locator(".scene-hotspot").evaluateAll((nodes) => nodes
        .map((node) => node.dataset.hotspotId).sort()),
      ["su-he-notice", "village-decline"]
    );
    await clickVisibleButton("观察村口环境");
    await clickVisibleButton("查看苏禾寻人启事");
    await closeDetail();

    // 三名村民共用正式阅读链，人物层不改变已冻结热点坐标。
    await completeNpc("询问年老村民");
    await completeNpc("询问小卖部老板");
    await completeNpc("询问拒签户");

    // 地图取消后仍回探索；完成后成就只解锁一次。
    await clickVisibleButton("地图");
    await waitForState("minigame");
    await clickVisibleButton("返回上一页");
    await waitForState("exploration");
    assert.equal(await page.evaluate(() => WhiteLamp.game.getState().facts
      .includes("map-puzzle-completed")), false);

    await clickVisibleButton("地图");
    await waitForState("minigame");
    for (let row = 1; row <= 3; row += 1) {
      for (let column = 1; column <= 3; column += 1) {
        await page.locator(`[data-piece-id="piece-${row}-${column}"]`).click();
        await page.locator(`[data-slot-id="slot-${row}-${column}"]`).click();
      }
    }
    await waitForState("reading");
    assert.equal(await page.evaluate(() => WhiteLamp.game.getState().achievements
      .filter((id) => id === "map-restorer").length), 1);
    await finishStoryAction("前往陈家老宅");

    // E1/E4：门关/门开资源和四项线索详情。
    await waitForState("exploration");
    assert.equal(await page.locator(".exploration-stage").getAttribute("data-scene-variant"), "default");
    assert.match(await page.locator(".exploration-scene-image").getAttribute("src"), /old-house-door-closed\.png$/);
    await clickVisibleButton("用旧钥匙打开宅门");
    await page.waitForFunction(() => document.querySelector(".exploration-stage")
      ?.dataset.sceneVariant === "door-open");
    assert.match(await page.locator(".exploration-scene-image").getAttribute("src"), /old-house-door-open\.png$/);
    for (const label of ["查看送葬名单", "查看身高刻痕", "查看妹妹的校服", "查看家庭照片"]) {
      await clickVisibleButton(label);
      await closeDetail();
    }

    await completeNpc("向小X追问线索之间的矛盾");
    await completeNpc("听门外呼名", undefined, "reading");
    await finishStoryAction("结束第一周内容");
    await page.screenshot({path: path.join(outputDirectory, "e1-e5-end-1280.png"), fullPage: true});

    await clickVisibleButton("保存进度");
    assert.match(await page.locator("#feedback").textContent(), /保存/);
    await page.goto(`${base}/pages/achievements/achievements.html`);
    await page.locator(".exploration-achievements").waitFor();
    assert.match(await page.locator("#achievement-list").textContent(), /残图归一[\s\S]*已解锁/);
    await page.reload();
    await page.locator(".exploration-achievements").waitFor();
    assert.match(await page.locator("#achievement-list").textContent(), /残图归一[\s\S]*已解锁/);

    assert.deepEqual(pageErrors, []);
    assert.deepEqual(missingResources, []);
    console.log("PASS V2 formal page: E1-E5, 11 Nodes, 3 viewports, Host retry, reading, detail return, map, achievement and save/reload.");
    console.log(`Screenshots: ${outputDirectory}`);
  } finally {
    if (browser) await browser.close();
    server.close();
  }
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
