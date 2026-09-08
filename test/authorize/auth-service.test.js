// 本文件在 Node 内存环境中验证账户公开接口、数据隔离和异常处理，不写入真实浏览器存储。
"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { webcrypto } = require("node:crypto");
const { TextEncoder } = require("node:util");

const projectRoot = path.resolve(__dirname, "../..");
const scripts = [
  "assets/js/authorize/config.js",
  "assets/js/authorize/storage.js",
  "assets/js/authorize/crypto.js",
  "assets/js/authorize/auth-service.js",
];

class MemoryStorage {
  constructor() {
    this.values = new Map();
    this.available = true;
  }

  getItem(key) {
    this.assertAvailable();
    return this.values.has(String(key)) ? this.values.get(String(key)) : null;
  }

  setItem(key, value) {
    this.assertAvailable();
    this.values.set(String(key), String(value));
  }

  removeItem(key) {
    this.assertAvailable();
    this.values.delete(String(key));
  }

  assertAvailable() {
    if (!this.available) {
      throw new Error("模拟的浏览器存储不可用");
    }
  }
}

function createHarness() {
  const errorLogs = [];
  const context = {
    URL,
    TextEncoder,
    crypto: webcrypto,
    localStorage: new MemoryStorage(),
    sessionStorage: new MemoryStorage(),
    document: {
      currentScript: {
        src: "http://127.0.0.1:8000/assets/js/authorize/config.js",
      },
      baseURI: "http://127.0.0.1:8000/",
    },
    location: {
      href: "http://127.0.0.1:8000/pages/authorize/login.html",
    },
    btoa(value) {
      return Buffer.from(value, "binary").toString("base64");
    },
    atob(value) {
      return Buffer.from(value, "base64").toString("binary");
    },
    console: {
      info() {},
      error(...args) {
        errorLogs.push(args);
      },
    },
  };
  context.window = context;
  vm.createContext(context);

  for (const relativePath of scripts) {
    const absolutePath = path.join(projectRoot, relativePath);
    const source = fs.readFileSync(absolutePath, "utf8");
    vm.runInContext(source, context, { filename: relativePath });
  }

  return {
    context,
    auth: context.WhiteLamp.auth,
    config: context.WhiteLamp.authConfig,
    errorLogs,
  };
}

const tests = [];

function test(name, run) {
  tests.push({ name, run });
}

test("注册校验会返回逐字段错误", async () => {
  const { auth } = createHarness();
  const result = await auth.register({
    username: "a!",
    password: "123",
    confirmPassword: "456",
    acceptedStorage: false,
  });

  assert.equal(result.ok, false);
  assert.equal(result.code, "VALIDATION_FAILED");
  assert.deepEqual(Object.keys(result.fieldErrors).sort(), [
    "acceptedStorage",
    "confirmPassword",
    "password",
    "username",
  ]);
});

test("合法注册只保存带盐摘要，不建立会话", async () => {
  const { auth, config, context } = createHarness();
  const password = "DemoPass123";
  const result = await auth.register({
    username: "Player01",
    password,
    confirmPassword: password,
    acceptedStorage: true,
  });

  assert.equal(result.ok, true);
  assert.equal(result.data.username, "Player01");
  const rawAccounts = context.localStorage.getItem(config.accountStorageKey);
  assert.equal(rawAccounts.includes(password), false);
  const accountStore = JSON.parse(rawAccounts);
  assert.equal(accountStore.accounts.length, 1);
  assert.equal(accountStore.accounts[0].usernameKey, "player01");
  assert.equal(accountStore.accounts[0].password.algorithm, "SHA-256");
  assert.notEqual(accountStore.accounts[0].password.salt, "");
  assert.notEqual(accountStore.accounts[0].password.hash, "");
  assert.equal(context.sessionStorage.getItem(config.sessionStorageKey), null);
});

test("用户名忽略大小写查重，错误登录不泄露原因", async () => {
  const { auth } = createHarness();
  const input = {
    username: "Player01",
    password: "DemoPass123",
    confirmPassword: "DemoPass123",
    acceptedStorage: true,
  };
  assert.equal((await auth.register(input)).ok, true);

  const duplicate = await auth.register({ ...input, username: "player01" });
  assert.equal(duplicate.ok, false);
  assert.equal(duplicate.code, "USERNAME_TAKEN");

  const wrongPassword = await auth.login({
    username: "PLAYER01",
    password: "WrongPass1",
  });
  assert.equal(wrongPassword.ok, false);
  assert.equal(wrongPassword.code, "INVALID_CREDENTIALS");
  assert.equal(wrongPassword.message, "用户名或演示密码不正确。");
});

test("登录、读取会话和退出只暴露公开用户字段", async () => {
  const { auth, config, context } = createHarness();
  const password = "DemoPass123";
  await auth.register({
    username: "Player01",
    password,
    confirmPassword: password,
    acceptedStorage: true,
  });

  const login = await auth.login({ username: "player01", password });
  assert.equal(login.ok, true);
  assert.deepEqual(Object.keys(login.data).sort(), [
    "storageScope",
    "userId",
    "userType",
    "username",
  ]);
  assert.equal(login.data.userType, "account");
  assert.equal(login.data.username, "Player01");
  assert.equal(login.data.storageScope, `account:${login.data.userId}`);

  const session = await auth.getSession();
  assert.equal(session.ok, true);
  assert.equal(session.data.userId, login.data.userId);

  assert.equal((await auth.logout()).ok, true);
  assert.equal((await auth.getSession()).data, null);
  assert.notEqual(context.localStorage.getItem(config.accountStorageKey), null);
});

test("不同账户与游客拥有互不相同的存储域", async () => {
  const { auth } = createHarness();
  for (const username of ["Player01", "Player02"]) {
    const registered = await auth.register({
      username,
      password: "DemoPass123",
      confirmPassword: "DemoPass123",
      acceptedStorage: true,
    });
    assert.equal(registered.ok, true);
  }

  const first = await auth.login({ username: "Player01", password: "DemoPass123" });
  await auth.logout();
  const second = await auth.login({ username: "Player02", password: "DemoPass123" });
  await auth.logout();
  const guest = await auth.enterGuest();

  assert.notEqual(first.data.userId, second.data.userId);
  assert.notEqual(first.data.storageScope, second.data.storageScope);
  assert.equal(guest.data.userId, "guest");
  assert.equal(guest.data.storageScope, "guest");
});

test("损坏账户和会话数据会报错且不会被静默删除", async () => {
  const { auth, config, context, errorLogs } = createHarness();
  context.localStorage.setItem(config.accountStorageKey, "{broken-account-json");
  const accountResult = await auth.login({
    username: "Player01",
    password: "DemoPass123",
  });
  assert.equal(accountResult.code, "STORAGE_CORRUPTED");
  assert.equal(
    context.localStorage.getItem(config.accountStorageKey),
    "{broken-account-json",
  );

  context.sessionStorage.setItem(config.sessionStorageKey, "{broken-session-json");
  const sessionResult = await auth.getSession();
  assert.equal(sessionResult.code, "SESSION_CORRUPTED");
  assert.equal(
    context.sessionStorage.getItem(config.sessionStorageKey),
    "{broken-session-json",
  );
  assert.equal(errorLogs.length >= 2, true);

  assert.equal((await auth.logout()).ok, true);
  assert.equal(context.sessionStorage.getItem(config.sessionStorageKey), null);
});

test("账户存储不可用时游客仍可进入并收到持久化警告", async () => {
  const { auth, context, errorLogs } = createHarness();
  context.localStorage.available = false;

  const login = await auth.login({ username: "Player01", password: "DemoPass123" });
  assert.equal(login.code, "STORAGE_UNAVAILABLE");

  const guest = await auth.enterGuest();
  assert.equal(guest.ok, true);
  assert.equal(guest.data.storageScope, "guest");
  assert.equal(guest.warnings[0].code, "PERSISTENCE_UNAVAILABLE");
  assert.equal(errorLogs.length >= 2, true);
});

test("Web Crypto 不可用时注册会明确失败", async () => {
  const { auth, context } = createHarness();
  context.crypto = null;
  const result = await auth.register({
    username: "Player01",
    password: "DemoPass123",
    confirmPassword: "DemoPass123",
    acceptedStorage: true,
  });

  assert.equal(result.ok, false);
  assert.equal(result.code, "CRYPTO_UNAVAILABLE");
});

async function main() {
  let passed = 0;
  for (const currentTest of tests) {
    try {
      await currentTest.run();
      passed += 1;
      console.log(`[PASS] ${currentTest.name}`);
    } catch (error) {
      console.error(`[FAIL] ${currentTest.name}`);
      console.error(error);
      process.exitCode = 1;
    }
  }

  console.log(`\n${passed}/${tests.length} tests passed`);
}

main().catch((error) => {
  console.error("[FAIL] 测试执行器发生未处理错误");
  console.error(error);
  process.exitCode = 1;
});
