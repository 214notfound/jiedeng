// 本文件负责账户与会话的本地读写、结构校验和存储异常分类。
(function initializeAuthorizeStorage(global) {
  "use strict";

  const config = global.WhiteLamp && global.WhiteLamp.authConfig;
  global.WhiteLampAuthorizeInternal = global.WhiteLampAuthorizeInternal || {};

  function createStorageError(code, message, cause) {
    const error = new Error(message, cause ? { cause } : undefined);
    error.name = "AuthorizeStorageError";
    error.code = code;
    return error;
  }

  function requireConfig() {
    if (!config) {
      throw createStorageError(
        "UNEXPECTED_ERROR",
        "账户模块配置未加载，无法访问本地数据。",
      );
    }
  }

  function assertStorageAvailable(storage, label) {
    const probeKey = `${config.accountStorageKey}:probe`;

    try {
      storage.setItem(probeKey, "1");
      storage.removeItem(probeKey);
    } catch (error) {
      throw createStorageError(
        "STORAGE_UNAVAILABLE",
        `${label}不可用。`,
        error,
      );
    }
  }

  function parseJson(rawValue, dataLabel) {
    try {
      return JSON.parse(rawValue);
    } catch (error) {
      throw createStorageError(
        "STORAGE_CORRUPTED",
        `${dataLabel}不是有效的 JSON。`,
        error,
      );
    }
  }

  function isAccountRecord(account) {
    return Boolean(
      account &&
        typeof account === "object" &&
        typeof account.id === "string" &&
        account.id.length > 0 &&
        typeof account.username === "string" &&
        /^[a-z0-9]{3,20}$/.test(account.usernameKey) &&
        account.password &&
        account.password.algorithm === "SHA-256" &&
        typeof account.password.salt === "string" &&
        account.password.salt.length > 0 &&
        typeof account.password.hash === "string" &&
        account.password.hash.length > 0 &&
        typeof account.createdAt === "string" &&
        account.createdAt.length > 0
    );
  }

  function validateAccountStore(value) {
    return Boolean(
      value &&
        typeof value === "object" &&
        value.schemaVersion === config.schemaVersion &&
        Array.isArray(value.accounts) &&
        value.accounts.every(isAccountRecord),
    );
  }

  function validateSession(value) {
    if (
      !value ||
      typeof value !== "object" ||
      value.schemaVersion !== config.schemaVersion ||
      typeof value.userId !== "string" ||
      typeof value.username !== "string" ||
      typeof value.storageScope !== "string" ||
      typeof value.startedAt !== "string"
    ) {
      return false;
    }

    if (value.userType === "guest") {
      return (
        value.userId === "guest" &&
        value.username === "游客" &&
        value.storageScope === "guest"
      );
    }

    return (
      value.userType === "account" &&
      value.storageScope === `account:${value.userId}`
    );
  }

  function readAccounts() {
    requireConfig();
    assertStorageAvailable(global.localStorage, "localStorage");

    let rawValue;
    try {
      rawValue = global.localStorage.getItem(config.accountStorageKey);
    } catch (error) {
      throw createStorageError(
        "STORAGE_UNAVAILABLE",
        "无法读取本地账户数据。",
        error,
      );
    }

    if (rawValue === null) {
      return { schemaVersion: config.schemaVersion, accounts: [] };
    }

    const parsed = parseJson(rawValue, "本地账户数据");
    if (!validateAccountStore(parsed)) {
      throw createStorageError(
        "STORAGE_CORRUPTED",
        "本地账户数据结构或版本不正确。",
      );
    }

    return parsed;
  }

  function writeAccounts(accountStore) {
    requireConfig();
    if (!validateAccountStore(accountStore)) {
      throw createStorageError(
        "STORAGE_CORRUPTED",
        "拒绝写入结构不正确的账户数据。",
      );
    }

    assertStorageAvailable(global.localStorage, "localStorage");
    try {
      global.localStorage.setItem(
        config.accountStorageKey,
        JSON.stringify(accountStore),
      );
    } catch (error) {
      throw createStorageError(
        "STORAGE_UNAVAILABLE",
        "无法保存本地账户数据。",
        error,
      );
    }
  }

  function readSession() {
    requireConfig();
    assertStorageAvailable(global.sessionStorage, "sessionStorage");

    let rawValue;
    try {
      rawValue = global.sessionStorage.getItem(config.sessionStorageKey);
    } catch (error) {
      throw createStorageError(
        "STORAGE_UNAVAILABLE",
        "无法读取当前会话。",
        error,
      );
    }

    if (rawValue === null) {
      return null;
    }

    let parsed;
    try {
      parsed = JSON.parse(rawValue);
    } catch (error) {
      throw createStorageError(
        "SESSION_CORRUPTED",
        "当前会话不是有效的 JSON。",
        error,
      );
    }

    if (!validateSession(parsed)) {
      throw createStorageError(
        "SESSION_CORRUPTED",
        "当前会话结构或版本不正确。",
      );
    }

    return parsed;
  }

  function writeSession(session) {
    requireConfig();
    if (!validateSession(session)) {
      throw createStorageError(
        "SESSION_CORRUPTED",
        "拒绝写入结构不正确的会话。",
      );
    }

    assertStorageAvailable(global.sessionStorage, "sessionStorage");
    try {
      global.sessionStorage.setItem(
        config.sessionStorageKey,
        JSON.stringify(session),
      );
    } catch (error) {
      throw createStorageError(
        "STORAGE_UNAVAILABLE",
        "无法保存当前会话。",
        error,
      );
    }
  }

  function clearSession() {
    requireConfig();
    assertStorageAvailable(global.sessionStorage, "sessionStorage");
    try {
      global.sessionStorage.removeItem(config.sessionStorageKey);
    } catch (error) {
      throw createStorageError(
        "STORAGE_UNAVAILABLE",
        "无法清除当前会话。",
        error,
      );
    }
  }

  function isLocalStorageAvailable() {
    try {
      requireConfig();
      assertStorageAvailable(global.localStorage, "localStorage");
      return true;
    } catch (error) {
      console.error("[white-lamp:authorize] localStorage 可用性检查失败", error);
      return false;
    }
  }

  global.WhiteLampAuthorizeInternal.storage = Object.freeze({
    readAccounts,
    writeAccounts,
    readSession,
    writeSession,
    clearSession,
    isLocalStorageAvailable,
  });
})(window);
