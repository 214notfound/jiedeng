// 本文件实现注册、登录、游客会话和退出，并仅暴露安全的公开用户信息。
(function initializeAuthorizeService(global) {
  "use strict";

  global.WhiteLamp = global.WhiteLamp || {};
  const config = global.WhiteLamp.authConfig;
  const internal = global.WhiteLampAuthorizeInternal || {};
  const storage = internal.storage;
  const passwordCrypto = internal.crypto;

  function success(data, warnings) {
    const result = { ok: true };
    if (data !== undefined) {
      result.data = data;
    }
    if (warnings && warnings.length > 0) {
      result.warnings = warnings;
    }
    return result;
  }

  function failure(code, message, fieldErrors) {
    const result = { ok: false, code, message };
    if (fieldErrors && Object.keys(fieldErrors).length > 0) {
      result.fieldErrors = fieldErrors;
    }
    return result;
  }

  function publicUserFromAccount(account) {
    return Object.freeze({
      userId: account.id,
      username: account.username,
      userType: "account",
      storageScope: `account:${account.id}`,
    });
  }

  function guestUser() {
    return Object.freeze({
      userId: "guest",
      username: "游客",
      userType: "guest",
      storageScope: "guest",
    });
  }

  function sessionFromUser(user) {
    return {
      schemaVersion: config.schemaVersion,
      userId: user.userId,
      username: user.username,
      userType: user.userType,
      storageScope: user.storageScope,
      startedAt: new Date().toISOString(),
    };
  }

  function validateRegistration(input) {
    const fieldErrors = {};
    const username = typeof input.username === "string" ? input.username.trim() : "";
    const password = typeof input.password === "string" ? input.password : "";
    const confirmPassword =
      typeof input.confirmPassword === "string" ? input.confirmPassword : "";

    if (!/^[A-Za-z0-9]{3,20}$/.test(username)) {
      fieldErrors.username = "用户名必须为 3-20 个英文字母或数字。";
    }
    if (password.length < 6 || password.length > 64) {
      fieldErrors.password = "密码长度必须为 6-64 个字符。";
    }
    if (confirmPassword !== password) {
      fieldErrors.confirmPassword = "两次输入的密码不一致。";
    }
    if (input.acceptedStorage !== true) {
      fieldErrors.acceptedStorage = "请先同意将演示账户保存在当前浏览器。";
    }

    return { username, password, fieldErrors };
  }

  function validateLogin(input) {
    const fieldErrors = {};
    const username = typeof input.username === "string" ? input.username.trim() : "";
    const password = typeof input.password === "string" ? input.password : "";

    if (!username) {
      fieldErrors.username = "请输入用户名。";
    }
    if (!password) {
      fieldErrors.password = "请输入密码。";
    }

    return { username, password, fieldErrors };
  }

  function resultFromError(operation, error) {
    console.error(`[white-lamp:authorize] ${operation}失败`, error);

    const messages = {
      STORAGE_UNAVAILABLE:
        "浏览器存储不可用，无法完成账户操作。你仍可尝试游客模式。",
      STORAGE_CORRUPTED:
        "本地账户数据损坏，系统未覆盖原数据。你可以改用游客模式。",
      SESSION_CORRUPTED:
        "当前会话数据损坏。请确认后清除异常会话并重新进入。",
      CRYPTO_UNAVAILABLE:
        "当前浏览器无法安全生成密码摘要，请使用最新版 Chrome、Edge 或游客模式。",
      UNEXPECTED_ERROR: "认证模块发生未预期错误，请查看控制台中的详细原因。",
    };
    const code = messages[error && error.code] ? error.code : "UNEXPECTED_ERROR";
    return failure(code, messages[code]);
  }

  function dependenciesReady() {
    return Boolean(config && storage && passwordCrypto);
  }

  async function register(input = {}) {
    if (!dependenciesReady()) {
      return resultFromError(
        "注册",
        Object.assign(new Error("账户模块依赖未加载"), { code: "UNEXPECTED_ERROR" }),
      );
    }

    const validated = validateRegistration(input);
    if (Object.keys(validated.fieldErrors).length > 0) {
      return failure(
        "VALIDATION_FAILED",
        "请修正表单中的问题后重新提交。",
        validated.fieldErrors,
      );
    }

    try {
      let accountStore = storage.readAccounts();
      const usernameKey = validated.username.toLowerCase();
      if (accountStore.accounts.some((account) => account.usernameKey === usernameKey)) {
        return failure("USERNAME_TAKEN", "该用户名已存在。", {
          username: "该用户名已存在，请更换后重试。",
        });
      }

      const passwordRecord = await passwordCrypto.createPasswordRecord(
        validated.password,
      );

      // 摘要计算是异步的，写入前重新读取一次，减少多标签页同时注册造成的覆盖。
      accountStore = storage.readAccounts();
      if (accountStore.accounts.some((account) => account.usernameKey === usernameKey)) {
        return failure("USERNAME_TAKEN", "该用户名已存在。", {
          username: "该用户名已存在，请更换后重试。",
        });
      }

      const account = {
        id: passwordCrypto.createUserId(),
        username: validated.username,
        usernameKey,
        password: passwordRecord,
        createdAt: new Date().toISOString(),
      };
      storage.writeAccounts({
        schemaVersion: config.schemaVersion,
        accounts: [...accountStore.accounts, account],
      });

      return success(Object.freeze({ username: account.username }));
    } catch (error) {
      return resultFromError("注册", error);
    }
  }

  async function login(input = {}) {
    if (!dependenciesReady()) {
      return resultFromError(
        "登录",
        Object.assign(new Error("账户模块依赖未加载"), { code: "UNEXPECTED_ERROR" }),
      );
    }

    const validated = validateLogin(input);
    if (Object.keys(validated.fieldErrors).length > 0) {
      return failure(
        "VALIDATION_FAILED",
        "请填写用户名和密码。",
        validated.fieldErrors,
      );
    }
    if (
      !/^[A-Za-z0-9]{3,20}$/.test(validated.username) ||
      validated.password.length < 6 ||
      validated.password.length > 64
    ) {
      return failure("INVALID_CREDENTIALS", "用户名或演示密码不正确。");
    }

    try {
      const accountStore = storage.readAccounts();
      const usernameKey = validated.username.toLowerCase();
      const account = accountStore.accounts.find(
        (candidate) => candidate.usernameKey === usernameKey,
      );
      if (!account) {
        return failure("INVALID_CREDENTIALS", "用户名或演示密码不正确。");
      }

      const passwordMatches = await passwordCrypto.verifyPassword(
        validated.password,
        account.password,
      );
      if (!passwordMatches) {
        return failure("INVALID_CREDENTIALS", "用户名或演示密码不正确。");
      }

      const user = publicUserFromAccount(account);
      storage.writeSession(sessionFromUser(user));
      return success(user);
    } catch (error) {
      return resultFromError("登录", error);
    }
  }

  async function enterGuest() {
    if (!dependenciesReady()) {
      return resultFromError(
        "游客进入",
        Object.assign(new Error("账户模块依赖未加载"), { code: "UNEXPECTED_ERROR" }),
      );
    }

    try {
      const user = guestUser();
      storage.writeSession(sessionFromUser(user));
      const warnings = storage.isLocalStorageAvailable()
        ? []
        : [
            {
              code: "PERSISTENCE_UNAVAILABLE",
              message: "localStorage 当前不可用，游客游戏进度可能无法在刷新后保留。",
            },
          ];
      return success(user, warnings);
    } catch (error) {
      return resultFromError("游客进入", error);
    }
  }

  async function getSession() {
    if (!dependenciesReady()) {
      return resultFromError(
        "读取会话",
        Object.assign(new Error("账户模块依赖未加载"), { code: "UNEXPECTED_ERROR" }),
      );
    }

    try {
      const session = storage.readSession();
      if (session === null) {
        return success(null);
      }
      if (session.userType === "guest") {
        return success(guestUser());
      }

      const accountStore = storage.readAccounts();
      const account = accountStore.accounts.find(
        (candidate) => candidate.id === session.userId,
      );
      if (
        !account ||
        account.username !== session.username ||
        session.storageScope !== `account:${account.id}`
      ) {
        const error = new Error("会话引用的账户不存在或与账户数据不一致。");
        error.code = "SESSION_CORRUPTED";
        throw error;
      }

      return success(publicUserFromAccount(account));
    } catch (error) {
      return resultFromError("读取会话", error);
    }
  }

  async function logout() {
    if (!dependenciesReady()) {
      return resultFromError(
        "退出登录",
        Object.assign(new Error("账户模块依赖未加载"), { code: "UNEXPECTED_ERROR" }),
      );
    }

    try {
      storage.clearSession();
      return success();
    } catch (error) {
      return resultFromError("退出登录", error);
    }
  }

  global.WhiteLamp.auth = Object.freeze({
    register,
    login,
    enterGuest,
    getSession,
    logout,
  });
})(window);
