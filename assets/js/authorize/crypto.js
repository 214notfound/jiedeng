// 本文件使用浏览器 Web Crypto 为演示密码生成随机盐和 SHA-256 摘要。
(function initializeAuthorizeCrypto(global) {
  "use strict";

  global.WhiteLampAuthorizeInternal = global.WhiteLampAuthorizeInternal || {};

  function createCryptoError(code, message, cause) {
    const error = new Error(message, cause ? { cause } : undefined);
    error.name = "AuthorizeCryptoError";
    error.code = code;
    return error;
  }

  function requireCrypto() {
    if (
      !global.crypto ||
      !global.crypto.subtle ||
      typeof global.crypto.getRandomValues !== "function"
    ) {
      throw createCryptoError(
        "CRYPTO_UNAVAILABLE",
        "当前环境不支持 Web Crypto。",
      );
    }
  }

  function bytesToBase64(bytes) {
    let binary = "";
    for (const byte of bytes) {
      binary += String.fromCharCode(byte);
    }
    return global.btoa(binary);
  }

  function base64ToBytes(value, expectedLength) {
    let binary;
    try {
      binary = global.atob(value);
    } catch (error) {
      throw createCryptoError(
        "STORAGE_CORRUPTED",
        "密码摘要包含无效的 Base64 数据。",
        error,
      );
    }

    const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
    if (bytes.length !== expectedLength) {
      throw createCryptoError(
        "STORAGE_CORRUPTED",
        "密码摘要长度不正确。",
      );
    }
    return bytes;
  }

  async function digestPassword(password, saltBytes) {
    const passwordBytes = new TextEncoder().encode(password);
    const digestInput = new Uint8Array(saltBytes.length + passwordBytes.length);
    digestInput.set(saltBytes, 0);
    digestInput.set(passwordBytes, saltBytes.length);

    try {
      const digest = await global.crypto.subtle.digest("SHA-256", digestInput);
      return new Uint8Array(digest);
    } catch (error) {
      throw createCryptoError(
        "CRYPTO_UNAVAILABLE",
        "浏览器无法计算密码摘要。",
        error,
      );
    }
  }

  async function createPasswordRecord(password) {
    requireCrypto();
    const saltBytes = global.crypto.getRandomValues(new Uint8Array(16));
    const hashBytes = await digestPassword(password, saltBytes);

    return Object.freeze({
      algorithm: "SHA-256",
      salt: bytesToBase64(saltBytes),
      hash: bytesToBase64(hashBytes),
    });
  }

  async function verifyPassword(password, passwordRecord) {
    requireCrypto();
    if (!passwordRecord || passwordRecord.algorithm !== "SHA-256") {
      throw createCryptoError(
        "STORAGE_CORRUPTED",
        "密码摘要算法不受支持。",
      );
    }

    const saltBytes = base64ToBytes(passwordRecord.salt, 16);
    const storedHashBytes = base64ToBytes(passwordRecord.hash, 32);
    const inputHashBytes = await digestPassword(password, saltBytes);

    let difference = 0;
    for (let index = 0; index < storedHashBytes.length; index += 1) {
      difference |= storedHashBytes[index] ^ inputHashBytes[index];
    }
    return difference === 0;
  }

  function createUserId() {
    requireCrypto();
    if (typeof global.crypto.randomUUID === "function") {
      return global.crypto.randomUUID();
    }

    const bytes = global.crypto.getRandomValues(new Uint8Array(16));
    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;
    const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0"));
    return `${hex.slice(0, 4).join("")}-${hex.slice(4, 6).join("")}-${hex
      .slice(6, 8)
      .join("")}-${hex.slice(8, 10).join("")}-${hex.slice(10).join("")}`;
  }

  global.WhiteLampAuthorizeInternal.crypto = Object.freeze({
    createPasswordRecord,
    verifyPassword,
    createUserId,
  });
})(window);
