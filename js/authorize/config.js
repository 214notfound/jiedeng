// 本文件集中定义账户模块版本、存储键和页面地址，便于后续接入主菜单。
(function initializeAuthorizeConfig(global) {
  "use strict";

  const scriptUrl = document.currentScript && document.currentScript.src;
  const projectRootUrl = new URL("../../", scriptUrl || document.baseURI);

  global.WhiteLamp = global.WhiteLamp || {};
  global.WhiteLamp.authConfig = Object.freeze({
    moduleVersion: "1.0.0",
    schemaVersion: 1,
    accountStorageKey: "white-lamp:auth:accounts:v1",
    sessionStorageKey: "white-lamp:auth:session:v1",
    successUrl: new URL("test/authorize/demo.html", projectRootUrl).href,
    loginUrl: new URL("pages/authorize/login.html", projectRootUrl).href,
    registerUrl: new URL("pages/authorize/register.html", projectRootUrl).href,
  });
})(window);
