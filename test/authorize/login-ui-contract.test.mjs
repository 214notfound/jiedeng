import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

const loginHtml = readFileSync(
  new URL("../../pages/authorize/login.html", import.meta.url),
  "utf8"
);
const registerHtml = readFileSync(
  new URL("../../pages/authorize/register.html", import.meta.url),
  "utf8"
);
const authorizeCss = readFileSync(
  new URL("../../assets/css/authorize.css", import.meta.url),
  "utf8"
);

function countId(id) {
  return [...loginHtml.matchAll(new RegExp(`\\bid=["']${id}["']`, "g"))].length;
}

test("登录页保留认证脚本依赖与唯一功能挂载点", () => {
  const requiredIds = [
    "page-status",
    "clear-session-button",
    "login-form",
    "username",
    "username-error",
    "password",
    "password-error",
    "guest-button"
  ];
  for (const id of requiredIds) {
    assert.equal(countId(id), 1, `#${id} 应且仅应存在一次`);
  }

  const scripts = [
    "config.js",
    "storage.js",
    "crypto.js",
    "auth-service.js",
    "page-ui.js",
    "login-page.js"
  ];
  let previousIndex = -1;
  for (const script of scripts) {
    const index = loginHtml.indexOf(script);
    assert.ok(index > previousIndex, `${script} 应保持原有加载顺序`);
    previousIndex = index;
  }
});

test("登录表单保留字段、自动填充和无障碍契约", () => {
  assert.match(loginHtml, /<form[^>]+id="login-form"[^>]+novalidate/);
  assert.match(loginHtml, /id="username"[\s\S]*?name="username"[\s\S]*?autocomplete="username"/);
  assert.match(loginHtml, /id="password"[\s\S]*?name="password"[\s\S]*?autocomplete="current-password"/);
  assert.match(loginHtml, /id="page-status"[^>]+role="status"[^>]+aria-live="polite"[^>]+hidden/);
  assert.match(loginHtml, /data-password-toggle="password"[^>]+aria-pressed="false"/);
  assert.match(loginHtml, /type="submit"[^>]+data-submit-control/);
});

test("V3 登录视觉使用专属作用域且不套用到注册页", () => {
  assert.match(loginHtml, /<body class="auth-page auth-page--login">/);
  assert.doesNotMatch(registerHtml, /auth-page--login/);
  assert.match(loginHtml, /<title>登录 \| 借灯<\/title>/);
  assert.match(loginHtml, /<h1 class="brand-title">借灯<\/h1>/);
  assert.match(authorizeCss, /\.auth-page--login\s*\{/);
  assert.match(authorizeCss, /url\("\.\.\/images\/backgrounds\/cover\.jpg"\)/);
});

test("V3 色板、字体、控件尺寸和减少动态效果均已落地", () => {
  const tokens = {
    "color-bg": "#07090e",
    "color-bg-elevated": "#0d1118",
    "color-lamp": "#f5f0e3",
    "color-paper": "#ece7dc",
    "color-accent": "#d8c6a4",
    "color-mist": "#8fb8ce",
    "color-rain": "#5d7f9e",
    "color-danger": "#c17a74",
    "color-cinnabar": "#a6534a"
  };
  for (const [name, value] of Object.entries(tokens)) {
    assert.match(authorizeCss, new RegExp(`--${name}:\\s*${value}`));
  }

  assert.match(authorizeCss, /"Songti SC",\s*STSong,\s*SimSun/);
  assert.match(authorizeCss, /"Kaiti SC",\s*STKaiti,\s*KaiTi/);
  assert.match(authorizeCss, /\.auth-page--login \.brand-title\s*\{[^}]*font-size:\s*clamp\(52px,\s*6vw,\s*76px\)/s);
  assert.match(authorizeCss, /\.auth-page--login \.auth-brand\s*\{[\s\S]*radial-gradient\(ellipse/);
  assert.match(authorizeCss, /\.auth-page--login \.button\s*\{[^}]*min-height:\s*44px/s);
  assert.match(authorizeCss, /@keyframes auth-rain-fall/);
  assert.match(authorizeCss, /@keyframes auth-lamp-breathe/);
  assert.match(
    authorizeCss,
    /@media \(prefers-reduced-motion:\s*reduce\)[\s\S]*?\.auth-page--login \.auth-layout::before[\s\S]*?animation:\s*none/
  );
});

test("正式登录页不显示调试入口或内部存储字段", () => {
  assert.doesNotMatch(
    loginHtml,
    /(?:debug=1|accountStorageKey|sessionStorageKey|storageScope|流程日志|命令详情)/
  );
});
