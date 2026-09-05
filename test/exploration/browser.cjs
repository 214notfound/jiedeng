// Edge 浏览器回归：新 Node 流程、键盘、背包、跨页及错误清理。
const fs=require("node:fs"),path=require("node:path"),http=require("node:http"),assert=require("node:assert/strict");
const {chromium}=require(process.env.PLAYWRIGHT_MODULE_PATH||"playwright");
const root=path.resolve(__dirname,"../..");
const out=fs.mkdtempSync(path.join(require("node:os").tmpdir(),"jiedeng-story-"));
(async()=>{
 const server=http.createServer((req,res)=>{
  const file=path.resolve(root,"."+decodeURIComponent(new URL(req.url,"http://local").pathname));
  if(!file.startsWith(root+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile()){res.writeHead(404).end();return;}
  res.setHeader("Content-Type",({".js":"text/javascript",".html":"text/html",".css":"text/css",".svg":"image/svg+xml"})[path.extname(file)]||"text/plain");
  res.end(fs.readFileSync(file));
 });
 await new Promise(resolve=>server.listen(0,"127.0.0.1",resolve));
 let browser;
 try{
  browser=await chromium.launch({channel:"msedge",headless:true});
  const page=await browser.newPage({viewport:{width:1280,height:900}}),errors=[],missing=[];
  page.on("pageerror",e=>errors.push(e.message));
  page.on("response",r=>{if(r.status()>=400&&!r.url().endsWith("/favicon.ico"))missing.push(r.url());});
  const base="http://127.0.0.1:"+server.address().port, url=base+"/pages/exploration/game.html?demo=1";
  await page.goto(url);await page.locator(".exploration-stage").waitFor();
  async function click(name){
   await page.getByRole("button",{name,exact:true}).click();
   const confirm=page.getByRole("button",{name:"确认交谈完成",exact:true});
   if(await confirm.count())await confirm.click();
  }
  async function layout(){
   for(const width of [390,768,1280]){
    await page.setViewportSize({width,height:900});
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),"horizontal overflow "+width);
    const overlaps=await page.locator(".scene-hotspot").evaluateAll(nodes=>{
     const rects=nodes.map(n=>({label:n.textContent,r:n.getBoundingClientRect()}));
     return rects.flatMap((a,i)=>rects.slice(i+1).filter(b=>Math.min(a.r.right,b.r.right)-Math.max(a.r.left,b.r.left)>1&&Math.min(a.r.bottom,b.r.bottom)-Math.max(a.r.top,b.r.top)>1).map(b=>[a.label,b.label]));
    });
    assert.deepEqual(overlaps,[],"overlap "+width);
   }
  }
  await page.locator('[data-story-action="confirm-wake-context"]').click();await layout();
  assert.equal(await page.evaluate(() => typeof window.WhiteLamp?.story?.enterStory), "function");
  await page.locator(".exploration-stage").focus();
  const before=await page.locator(".exploration-viewpoint").evaluate(n=>n.style.left);
  await page.keyboard.press("ArrowLeft");
  assert.notEqual(await page.locator(".exploration-viewpoint").evaluate(n=>n.style.left),before);
  for(let i=0;i<6;i++)await page.keyboard.press("ArrowLeft");
  for(let i=0;i<9;i++)await page.keyboard.press("ArrowUp");
  await page.keyboard.press("e");
  assert.match(await page.locator("#feedback").textContent(),/广播和脚印/);
  await click("确认交谈完成");
  await layout();await page.screenshot({path:out+"/belongings-1280.png",fullPage:true});
  await click("查看烧毁的工作证");
  await page.locator('[data-item-id="burned-work-id"]').click();
  await page.locator("dialog img").evaluate(img=>img.decode());
  await page.keyboard.press("Escape");
  assert.equal(await page.locator("dialog[open]").count(),0);
  await click("查看蓝玻璃珠");await click("追问过去，再接过钥匙");
  assert.ok(await page.locator('[data-item-id="key-a"]').count());
  await page.locator('[data-story-action="confirm-white-lamp"]').click();
  await click("询问白灯与供电异常");
  await page.locator('[data-story-action="leave-shrine"]').click();
  await layout();await click("观察村口环境");await click("查看苏禾寻人启事");await layout();
  await page.screenshot({path:out+"/villagers-1280.png",fullPage:true});
  for(const name of ["询问年老村民","询问小卖部老板","询问拒签户"])await click(name);
  page.once("dialog",d=>d.dismiss());await click("复原手绘地图");
  assert.equal(await page.locator('[data-story-action="go-old-house"]').count(),0);
  page.once("dialog",d=>d.accept());await click("复原手绘地图");
  assert.match(await page.locator("#achievement-preview").textContent(),/已解锁/);
  assert.match(await page.locator(".exploration-title").first().textContent(),/村口/);
  await page.getByRole("link",{name:"查看成就"}).click();
  await page.locator(".exploration-achievements").waitFor();assert.match(await page.locator("#achievement-list").textContent(),/已解锁/);
  await page.reload();await page.locator(".exploration-achievements").waitFor();
  assert.match(await page.locator("#achievement-list").textContent(),/已解锁/);
  await page.getByRole("link",{name:"返回探索"}).click();await page.locator(".exploration-stage").waitFor();
  await page.locator('[data-story-action="go-old-house"]').click();await click("用旧钥匙打开宅门");await layout();
  for(const name of ["查看送葬名单","查看身高刻痕","查看妹妹的校服","查看家庭照片"])await click(name);
  await click("向小X追问线索之间的矛盾");await click("听门外呼名");
  await page.locator('[data-story-action="confirm-week-one-end"]').click();
  await page.setViewportSize({width:390,height:844});await page.screenshot({path:out+"/end-390.png",fullPage:true});
  const state=await page.evaluate(()=>JSON.parse(sessionStorage.getItem("jiedeng:demo:engine-handoff:v3:guest")));
  assert.equal(state.ended,true);assert.equal(state.storyCheckpoint.completedNodeIds.length,11);
  assert.equal(state.clues.length,4);assert.equal(state.achievements.length,1);
  await page.goto(base+"/pages/exploration/game.html");
  assert.equal(await page.locator(".scene-hotspot").count(),0);
  const cleanup=await page.evaluate(async()=>{
   const {createDemoHost}=await import("/test/exploration/fixtures/demo-host.js");
   const {mountGamePage}=await import("/assets/js/exploration/game/game-page.js");
   const host=createDemoHost(),story=document.getElementById("game-story");
   const sibling=document.createElement("p");sibling.textContent="队友内容";story.append(sibling);
   const stop1=mountGamePage({host});const stop2=mountGamePage({host});
   const count=document.querySelectorAll(".exploration-stage").length;
   stop1();stop2();stop2();return {count,kept:sibling.isConnected,listeners:host.listenerCount()};
  });
  assert.deepEqual(cleanup,{count:1,kept:true,listeners:0});
  assert.deepEqual(errors,[]);assert.deepEqual(missing,[]);
  console.log("PASS Edge: 11 Nodes, keyboard, dialogue confirmation, images, six viewport/scene checks, inventory, map cancel, achievement refresh, cleanup.");
  console.log("Screenshots: "+out);
 }finally{if(browser)await browser.close();server.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
