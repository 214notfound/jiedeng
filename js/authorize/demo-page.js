// 本文件驱动账户模块测试页，仅展示公开身份字段并提供退出操作。
(function initializeAuthorizeDemoPage(global) {
  "use strict";

  async function startDemoPage() {
    const config = global.WhiteLamp && global.WhiteLamp.authConfig;
    const auth = global.WhiteLamp && global.WhiteLamp.auth;
    const pageUi =
      global.WhiteLampAuthorizeInternal && global.WhiteLampAuthorizeInternal.pageUi;
    const status = document.getElementById("page-status");
    const profile = document.getElementById("public-profile");
    const logoutButton = document.getElementById("logout-button");
    const clearSessionButton = document.getElementById("clear-session-button");

    if (!config || !auth || !pageUi || !status || !profile || !logoutButton) {
      console.error("[white-lamp:authorize] 测试页初始化失败", {
        config: Boolean(config),
        auth: Boolean(auth),
        pageUi: Boolean(pageUi),
        status: Boolean(status),
        profile: Boolean(profile),
        logoutButton: Boolean(logoutButton),
      });
      if (status) {
        status.hidden = false;
        status.textContent = "错误：测试页组件加载不完整，请查看控制台。";
      }
      return;
    }

    pageUi.logStartup("authorize-demo");

    async function clearSessionAndReturn() {
      if (!global.confirm("确定退出当前会话吗？账户和游戏存档会继续保留。")) {
        return;
      }
      const result = await auth.logout();
      if (!result.ok) {
        pageUi.setStatus(status, "error", result.message);
        return;
      }
      global.location.replace(config.loginUrl);
    }

    logoutButton.addEventListener("click", clearSessionAndReturn);
    if (clearSessionButton) {
      clearSessionButton.addEventListener("click", clearSessionAndReturn);
    }

    const result = await auth.getSession();
    if (!result.ok) {
      profile.hidden = true;
      logoutButton.hidden = true;
      pageUi.setStatus(status, "error", result.message);
      if (clearSessionButton && result.code === "SESSION_CORRUPTED") {
        clearSessionButton.hidden = false;
      }
      return;
    }

    if (!result.data) {
      profile.hidden = true;
      logoutButton.hidden = true;
      pageUi.setStatus(status, "warning", "当前没有有效会话，请返回登录页。");
      return;
    }

    const user = result.data;
    document.getElementById("profile-username").textContent = user.username;
    document.getElementById("profile-type").textContent =
      user.userType === "guest" ? "游客" : "本地账户";
    document.getElementById("profile-id").textContent = user.userId;
    document.getElementById("profile-scope").textContent = user.storageScope;
    document.getElementById("profile-json").textContent = JSON.stringify(user, null, 2);
    profile.hidden = false;
    pageUi.setStatus(status, "success", "公开用户接口读取成功。刷新页面后会话仍会保留。");
  }

  document.addEventListener("DOMContentLoaded", () => {
    startDemoPage().catch((error) => {
      console.error(
        "[white-lamp:authorize] 测试页发生未处理的初始化错误",
        error,
      );
      const status = document.getElementById("page-status");
      if (status) {
        status.hidden = false;
        status.textContent = "错误：测试页初始化失败，请查看控制台中的详细原因。";
      }
    });
  });
})(window);
