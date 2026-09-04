// 可选 Edge 浏览器验收：启动临时静态服务，截图仅写系统临时目录。
const fs = require("node:fs");
const path = require("node:path");
const http = require("node:http");
const assert = require("node:assert/strict");
const { chromium } = require(process.env.PLAYWRIGHT_MODULE_PATH || "playwright");
const root = path.resolve(__dirname, "../..");
const out = fs.mkdtempSync(path.join(require("node:os").tmpdir(), "jiedeng-browser-"));
(async () => {
  const server = http.createServer((req, res) => {
    const file = path.resolve(root, "." + decodeURIComponent(new URL(req.url, "http://localhost").pathname));
    if (!file.startsWith(path.resolve(root) + path.sep) || !fs.existsSync(file) || !fs.statSync(file).isFile()) { res.writeHead(404).end(); return; }
    res.setHeader("Content-Type", ({ ".js":"text/javascript", ".css":"text/css", ".html":"text/html", ".svg":"image/svg+xml" })[path.extname(file)] || "application/octet-stream");
    res.end(fs.readFileSync(file));
  });
  await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
  let browser;
  try {
    browser = await chromium.launch({ channel: "msedge", headless: true });
    const page = await browser.newPage({ viewport: { width: 1200, height: 850 } });
    const errors = [];
    page.on("pageerror", error => errors.push(error.message));
    const base = "http://127.0.0.1:" + server.address().port;
    await page.goto(base + "/test/game/exploration-demo.html");
    await page.locator(".scene-hotspot").first().waitFor();
    await page.getByRole("link", { name: "查看成就" }).click();
    await page.locator(".exploration-achievements").waitFor();
    assert.match(await page.locator("#achievement-list").textContent(), /未解锁/);
    await page.getByRole("link", { name: "返回探索" }).click();
    await page.locator(".scene-hotspot").first().waitFor();
    await page.getByRole("button", { name: "离开当前地点", exact:true }).click();
    assert.match(await page.locator("#feedback").textContent(), /钥匙/);
    const stage = page.locator(".exploration-stage");
    await stage.focus();
    const before = await page.locator(".exploration-viewpoint").evaluate(node => node.style.left);
    await page.keyboard.press("ArrowRight");
    assert.notEqual(await page.locator(".exploration-viewpoint").evaluate(node => node.style.left), before);
    await page.getByRole("button", { name: "查看警告录音带", exact: true }).click();
    await page.getByRole("button", { name: "播放警告录音", exact: true }).click();
    assert.match(await page.locator("#feedback").textContent(), /不要急着/);
    await page.getByRole("button", { name: "查看老宅钥匙", exact: true }).click();
    await page.locator('[data-item-id="key-a"]').click();
    assert.equal(await page.locator("dialog[open]").count(), 1);
    await page.locator("dialog img").evaluate(img => img.decode());
    assert.ok(await page.locator("dialog img").evaluate(img => img.naturalWidth > 0));
    await page.keyboard.press("Escape");
    await page.waitForFunction(() => document.activeElement?.dataset.itemId === "key-a");
    assert.equal(await page.locator("dialog[open]").count(), 0);
    await page.getByRole("button", { name: "与小X交谈", exact: true }).click();
    await page.getByRole("button", { name: "检查伤口", exact: true }).click();
    await page.getByRole("button", { name: "查看烧毁的工作证", exact: true }).click();
    await page.getByRole("button", { name: "观察窗外的白灯", exact: true }).click();
    await page.getByRole("button", { name: "追问小X", exact: true }).click();
    await page.getByRole("button", { name: "寻找祠堂出口", exact: true }).click();
    await page.getByRole("button", { name: "观察小X处理断电", exact: true }).click();
    for (const name of ["询问记忆混乱的老人", "询问多数村民", "询问拒签户"]) await page.getByRole("button", { name, exact:true }).click();
    await page.getByRole("button", { name: "线索碎片", exact:true }).click();
    assert.equal(await page.locator(".exploration-inventory li").count(), 3);
    page.once("dialog", dialog => dialog.accept());
    await page.getByRole("button", { name: "复原手绘地图", exact:true }).click();
    assert.match(await page.locator("#achievement-preview").textContent(), /已解锁/);
    await page.getByRole("link", { name: "查看成就" }).click();
    await page.locator(".exploration-achievements").waitFor();
    assert.match(await page.locator("#achievement-list").textContent(), /已解锁/);
    await page.reload();
    await page.locator(".exploration-achievements").waitFor();
    assert.match(await page.locator("#achievement-list").textContent(), /已解锁/);
    assert.equal(await page.locator("#achievement-feedback").isVisible(), false);
    await page.setViewportSize({ width:390, height:844 });
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    await page.screenshot({ path:out + "/achievements-390.png", fullPage:true });
    await page.setViewportSize({ width:1200, height:850 });
    await page.getByRole("link", { name: "返回探索" }).click();
    await page.locator(".scene-hotspot").first().waitFor();
    assert.match(await page.locator(".exploration-title").first().textContent(), /老宅/);
    for (const name of ["用“A”字钥匙开门", "核对家庭照片", "核对妹妹的校服", "核对身高刻痕", "核对送葬名单", "留意门外的呼名"]) await page.getByRole("button", { name, exact:true }).click();
    assert.match(await page.locator("#feedback").textContent(), /第一周内容结束/);
    await page.setViewportSize({ width:390, height:844 });
    await page.evaluate(() => sessionStorage.removeItem("jiedeng:demo:exploration-achievements:v1"));
    await page.goto(base + "/test/game/exploration-demo.html");
    await page.locator(".scene-hotspot").first().waitFor();
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), "390px 横向溢出");
    await page.screenshot({ path:out + "/exploration-390.png", fullPage:true });
    const isolation = await page.evaluate(async () => {
      const { createDemoHost } = await import("/test/game/fixtures/demo-host.js");
      const { createExploration } = await import("/assets/js/game/exploration.js");
      const { mountExploration } = await import("/assets/js/game/exploration-view.js");
      const host = createDemoHost(); const module = createExploration(host);
      const sceneRoot = document.createElement("section"), actionsRoot = document.createElement("section"), inventoryRoot = document.createElement("aside");
      document.body.append(sceneRoot, actionsRoot, inventoryRoot);
      const sibling = document.createElement("span"); sibling.textContent="队友内容"; sceneRoot.append(sibling);
      const unmount = mountExploration({ module, sceneRoot, actionsRoot, inventoryRoot, showFeedback:()=>{}, openMap:()=>{} });
      unmount(); unmount(); module.dispose();
      const result = sibling.isConnected && host.listenerCount() === 0 && sceneRoot.children.length === 1;
      sceneRoot.remove(); actionsRoot.remove(); inventoryRoot.remove();
      return result;
    });
    assert.equal(isolation, true);
    const failures = await page.evaluate(async () => {
      const { createDemoHost } = await import("/test/game/fixtures/demo-host.js");
      const { createExploration } = await import("/assets/js/game/exploration.js");
      const { mountInventory } = await import("/assets/js/game/inventory-view.js");
      const host = createDemoHost();
      let scope = "guest";
      let listener;
      const module = createExploration({
        getContext: () => ({ ...host.getContext(), storageScope:scope }),
        dispatch: host.dispatch,
        subscribe: callback => { listener = callback; return host.subscribe(callback); }
      });
      module.interact("prologue", "prologue-take-key-a");
      const root = document.createElement("aside"); document.body.append(root);
      const unmount = mountInventory({ module, root, showFeedback:() => { throw new Error("feedback down"); } });
      root.querySelector('[data-item-id="key-a"]').click();
      const opened = root.querySelector("dialog").open;
      scope = "account:other"; listener();
      const closed = !root.querySelector("dialog").open;
      const cleared = root.querySelectorAll("[data-item-id]").length === 0;
      const fallback = [...root.querySelectorAll('[role="alert"]')].some(node => !node.hidden && node.textContent);
      unmount(); module.dispose(); root.remove();
      return { opened, closed, cleared, fallback:Boolean(fallback), listeners:host.listenerCount() };
    });
    assert.deepEqual(failures, { opened:true, closed:true, cleared:true, fallback:true, listeners:0 });
    const notifications = await page.evaluate(async () => {
      const { createDemoHost } = await import("/test/game/fixtures/demo-host.js");
      const { createExploration } = await import("/assets/js/game/exploration.js");
      const { getScenes } = await import("/assets/js/data/exploration.js");
      const { mountAchievements } = await import("/assets/js/game/achievements-view.js");
      const { mountExploration } = await import("/assets/js/game/exploration-view.js");
      const host = createDemoHost();
      const module = createExploration(host);
      for (const scene of getScenes().slice(0, 2)) {
        for (const action of scene.interactions) {
          const result = module.interact(scene.id, action.id);
          if (!result.ok) throw new Error(result.message);
        }
      }
      let lateFeedback = 0;
      const roots = Array.from({ length:3 }, () => document.createElement("section"));
      document.body.append(...roots);
      const remove = mountExploration({
        module, sceneRoot:roots[0], actionsRoot:roots[1], inventoryRoot:roots[2],
        showFeedback:() => { lateFeedback++; },
        openMap:() => Promise.reject(new Error("map unavailable"))
      });
      [...roots[1].querySelectorAll("button")].find(node => node.textContent === "复原手绘地图").click();
      remove();
      await new Promise(resolve => setTimeout(resolve, 0));
      roots.forEach(root => root.remove());
      let count = 0;
      const a = document.createElement("section"), b = document.createElement("section");
      document.body.append(a, b);
      const options = { module, showFeedback:() => { count++; } };
      const stopA = mountAchievements({ ...options, root:a });
      const stopB = mountAchievements({ ...options, root:b });
      const result = host.dispatch({ type:"MAP_PUZZLE_COMPLETED", payload:{ puzzleId:"map-puzzle" } });
      const both = a.textContent.includes("已解锁") && b.textContent.includes("已解锁");
      stopA(); stopB();
      const stopRestored = mountAchievements({ ...options, root:a });
      stopRestored(); module.dispose(); a.remove(); b.remove();
      return { count, both, ok:result.ok, lateFeedback, listeners:host.listenerCount() };
    });
    assert.deepEqual(notifications, { count:1, both:true, ok:true, lateFeedback:0, listeners:0 });
    await page.goto(base + "/pages/achievements.html");
    assert.equal(await page.locator("#achievement-feedback").isVisible(), true);
    assert.equal(await page.locator(".exploration-achievements").count(), 0);
    const formalPage = await page.evaluate(async () => {
      const { mountAchievementsPage } = await import("/assets/js/game/achievements-page.js");
      const listeners = new Set();
      const host = {
        getContext: () => ({ storageScope:"account:test", state:{
          achievements:["map-restorer"], puzzle:{mapRestored:true}
        } }),
        subscribe: fn => { listeners.add(fn); return () => listeners.delete(fn); }
      };
      const stopFirst = mountAchievementsPage({ host });
      const stopSecond = mountAchievementsPage({ host });
      const result = { count:document.querySelectorAll(".exploration-achievements").length,
        unlocked:document.getElementById("achievement-list").textContent.includes("已解锁"),
        listeners:listeners.size };
      stopFirst(); stopSecond(); stopSecond();
      return { ...result, remaining:listeners.size };
    });
    assert.deepEqual(formalPage, { count:1, unlocked:true, listeners:1, remaining:0 });
    await page.goto(base + "/pages/game.html?demo=1");
    await page.locator(".scene-hotspot").first().waitFor();
    assert.equal(await page.locator("#demo-notice").isVisible(), true);
    assert.equal(await page.locator("#save-button").isDisabled(), true);
    for (const name of ["与小X交谈", "检查伤口", "查看老宅钥匙", "查看烧毁的工作证",
      "查看警告录音带", "播放警告录音", "观察窗外的白灯", "追问小X",
      "寻找祠堂出口", "观察小X处理断电", "询问多数村民", "询问拒签户", "询问记忆混乱的老人"]) {
      await page.getByRole("button", { name, exact:true }).click();
    }
    page.once("dialog", dialog => dialog.accept());
    await page.getByRole("button", { name:"复原手绘地图", exact:true }).click();
    await page.getByRole("link", { name:"查看成就" }).click();
    assert.match(page.url(), /pages\/achievements\.html\?demo=1$/);
    await page.locator(".exploration-achievements").waitFor();
    assert.match(await page.locator("#achievement-list").textContent(), /已解锁/);
    await page.reload();
    await page.locator(".exploration-achievements").waitFor();
    assert.match(await page.locator("#achievement-list").textContent(), /已解锁/);
    await page.getByRole("link", { name:"返回探索" }).click();
    await page.locator(".scene-hotspot").first().waitFor();
    assert.match(page.url(), /pages\/game\.html\?demo=1$/);
    assert.match(await page.locator(".exploration-title").first().textContent(), /老宅/);
    await page.setViewportSize({ width:390, height:844 });
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    await page.screenshot({ path:out + "/game-page-390.png", fullPage:true });
    await page.goto(base + "/pages/game.html");
    assert.equal(await page.locator(".scene-hotspot").count(), 0);
    const gamePage = await page.evaluate(async () => {
      const { createDemoHost } = await import("/test/game/fixtures/demo-host.js");
      const { mountGamePage } = await import("/assets/js/game/game-page.js");
      const host = createDemoHost("account:check");
      const story = document.getElementById("game-story");
      const sibling = document.createElement("p");
      sibling.textContent = "剧情模块内容"; story.append(sibling);
      let calls = 0, finishSave;
      const stopFirst = mountGamePage({host});
      const initiallyDisabled = document.getElementById("save-button").disabled;
      const stopSecond = mountGamePage({host, saveProgress:() => {
        calls++; return new Promise(resolve => { finishSave = resolve; });
      }});
      const saveButton = document.getElementById("save-button");
      saveButton.click(); saveButton.click();
      const duringSave = saveButton.disabled;
      finishSave({ok:false, message:"测试保存失败"});
      await new Promise(resolve => setTimeout(resolve,0));
      const failedVisible = document.getElementById("feedback").textContent === "测试保存失败";
      const oneView = document.querySelectorAll(".exploration-stage").length === 1;
      stopFirst(); stopSecond(); stopSecond();
      return {initiallyDisabled, duringSave, calls, failedVisible, oneView,
        listeners:host.listenerCount(), siblingKept:sibling.isConnected, disabled:saveButton.disabled};
    });
    assert.deepEqual(gamePage, {initiallyDisabled:true, duringSave:true, calls:1,
      failedVisible:true, oneView:true, listeners:0, siblingKept:true, disabled:true});
    assert.deepEqual(errors, []);
    const layoutPage = await browser.newPage();
    await layoutPage.goto(base + "/pages/game.html?demo=1");
    await layoutPage.locator(".scene-hotspot").first().waitFor();
    for (const width of [390, 768, 1280]) {
      await layoutPage.setViewportSize({width, height:900});
      const overlaps = await layoutPage.locator(".scene-hotspot").evaluateAll(nodes => {
        const rects = nodes.map(node => ({name:node.textContent, rect:node.getBoundingClientRect()}));
        return rects.flatMap((a,i) => rects.slice(i+1).filter(b =>
          Math.min(a.rect.right,b.rect.right)-Math.max(a.rect.left,b.rect.left)>1 &&
          Math.min(a.rect.bottom,b.rect.bottom)-Math.max(a.rect.top,b.rect.top)>1
        ).map(b => [a.name,b.name]));
      });
      assert.deepEqual(overlaps, [], "初始热点不应重叠，宽度 " + width);
      assert.ok(await layoutPage.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    }
    await layoutPage.screenshot({path:out+"/game-assets-1280.png", fullPage:true});
    for (const name of ["game", "achievements"]) {
      await layoutPage.goto(require("node:url").pathToFileURL(path.join(root,"pages",name+".html")).href);
      await layoutPage.waitForFunction(() => document.body.textContent.includes("当前直接打开了本地文件"));
    }
    await layoutPage.close();
    console.log("截图目录：" + out);
    console.log("PASS: Edge headless scoped V1 flow; keyboard; item dialog/image/Escape/focus; leave hints; scope-switch clearing; feedback fallback; 390px layout; sibling preservation and cleanup.");
  } finally { if (browser) await browser.close(); server.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
