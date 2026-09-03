// 本文件连接登录页表单、游客入口、异常会话恢复和成功跳转。
(function initializeLoginPage(global) {
  "use strict";

  async function startLoginPage() {
    const config = global.WhiteLamp && global.WhiteLamp.authConfig;
    const auth = global.WhiteLamp && global.WhiteLamp.auth;
    const pageUi =
      global.WhiteLampAuthorizeInternal && global.WhiteLampAuthorizeInternal.pageUi;
    const form = document.getElementById("login-form");
    const status = document.getElementById("page-status");
    const guestButton = document.getElementById("guest-button");
    const clearSessionButton = document.getElementById("clear-session-button");

    if (!config || !auth || !pageUi || !form || !status || !guestButton) {
      console.error("[white-lamp:authorize] 登录页初始化失败", {
        config: Boolean(config),
        auth: Boolean(auth),
        pageUi: Boolean(pageUi),
        form: Boolean(form),
        status: Boolean(status),
        guestButton: Boolean(guestButton),
      });
      if (status) {
        status.hidden = false;
        status.textContent = "错误：登录页组件加载不完整，请刷新后重试。";
      }
      return;
    }

    pageUi.logStartup("login");
    pageUi.bindPasswordToggles();

    const query = new URLSearchParams(global.location.search);
    const registeredUsername = query.get("username") || "";
    if (query.get("registered") === "1") {
      if (/^[A-Za-z0-9]{3,20}$/.test(registeredUsername)) {
        form.elements.username.value = registeredUsername;
      }
      pageUi.setStatus(status, "success", "注册完成，请使用刚才的密码登录。 ");
    }

    async function recoverCorruptedSession() {
      if (!global.confirm("确定清除当前异常会话吗？本地账户和游戏存档不会被删除。")) {
        return;
      }

      const result = await auth.logout();
      if (!result.ok) {
        pageUi.setStatus(status, "error", result.message);
        return;
      }
      clearSessionButton.hidden = true;
      pageUi.setStatus(status, "success", "异常会话已清除，请重新登录或选择游客进入。");
    }

    if (clearSessionButton) {
      clearSessionButton.addEventListener("click", recoverCorruptedSession);
    }

    const sessionResult = await auth.getSession();
    if (sessionResult.ok && sessionResult.data) {
      pageUi.setStatus(status, "info", "检测到有效会话，正在进入账户测试页。");
      global.setTimeout(() => global.location.replace(config.successUrl), 250);
      return;
    }
    if (!sessionResult.ok) {
      pageUi.setStatus(status, "error", sessionResult.message);
      if (clearSessionButton && sessionResult.code === "SESSION_CORRUPTED") {
        clearSessionButton.hidden = false;
      }
    }

    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      pageUi.clearStatus(status);
      pageUi.clearFieldErrors(form);
      pageUi.setFormBusy(form, true);

      const result = await auth.login({
        username: form.elements.username.value,
        password: form.elements.password.value,
      });

      pageUi.setFormBusy(form, false);
      if (!result.ok) {
        pageUi.setFieldErrors(form, result.fieldErrors);
        pageUi.setStatus(status, "error", result.message);
        return;
      }

      pageUi.setStatus(status, "success", "登录成功，正在进入账户测试页。");
      global.setTimeout(() => global.location.assign(config.successUrl), 250);
    });

    guestButton.addEventListener("click", async () => {
      if (
        !global.confirm(
          "游客进度只保存在当前浏览器中，清理浏览器数据后无法恢复。确定以游客身份进入吗？",
        )
      ) {
        return;
      }

      guestButton.disabled = true;
      pageUi.clearStatus(status);
      const result = await auth.enterGuest();
      guestButton.disabled = false;

      if (!result.ok) {
        pageUi.setStatus(status, "error", result.message);
        if (clearSessionButton && result.code === "SESSION_CORRUPTED") {
          clearSessionButton.hidden = false;
        }
        return;
      }

      if (result.warnings && result.warnings.length > 0) {
        const warningText = result.warnings.map((warning) => warning.message).join("\n");
        const continueWithoutPersistence = global.confirm(
          `${warningText}\n\n仍要继续进入吗？`,
        );
        if (!continueWithoutPersistence) {
          const logoutResult = await auth.logout();
          if (!logoutResult.ok) {
            pageUi.setStatus(status, "error", logoutResult.message);
            return;
          }
          pageUi.setStatus(status, "warning", "已取消游客进入。");
          return;
        }
      }

      pageUi.setStatus(status, "success", "游客会话已建立，正在进入账户测试页。");
      global.setTimeout(() => global.location.assign(config.successUrl), 250);
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    startLoginPage().catch((error) => {
      console.error(
        "[white-lamp:authorize] 登录页发生未处理的初始化错误",
        error,
      );
      const status = document.getElementById("page-status");
      if (status) {
        status.hidden = false;
        status.textContent = "错误：登录页初始化失败，请查看控制台中的详细原因。";
      }
    });
  });
})(window);
