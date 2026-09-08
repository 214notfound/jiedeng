// 本文件连接注册页表单、字段反馈和注册成功后的登录页跳转。
(function initializeRegisterPage(global) {
  "use strict";

  async function startRegisterPage() {
    const config = global.WhiteLamp && global.WhiteLamp.authConfig;
    const auth = global.WhiteLamp && global.WhiteLamp.auth;
    const pageUi =
      global.WhiteLampAuthorizeInternal && global.WhiteLampAuthorizeInternal.pageUi;
    const form = document.getElementById("register-form");
    const status = document.getElementById("page-status");

    if (!config || !auth || !pageUi || !form || !status) {
      console.error("[white-lamp:authorize] 注册页初始化失败", {
        config: Boolean(config),
        auth: Boolean(auth),
        pageUi: Boolean(pageUi),
        form: Boolean(form),
        status: Boolean(status),
      });
      if (status) {
        status.hidden = false;
        status.textContent = "错误：注册页组件加载不完整，请刷新后重试。";
      }
      return;
    }

    pageUi.logStartup("register");
    pageUi.bindPasswordToggles();

    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      pageUi.clearStatus(status);
      pageUi.clearFieldErrors(form);
      pageUi.setFormBusy(form, true);

      const result = await auth.register({
        username: form.elements.username.value,
        password: form.elements.password.value,
        confirmPassword: form.elements.confirmPassword.value,
        acceptedStorage: form.elements.acceptedStorage.checked,
      });

      pageUi.setFormBusy(form, false);
      if (!result.ok) {
        pageUi.setFieldErrors(form, result.fieldErrors);
        pageUi.setStatus(status, "error", result.message);
        return;
      }

      pageUi.setStatus(status, "success", "账户已保存在当前浏览器，正在返回登录页。");
      const loginUrl = new URL(config.loginUrl);
      loginUrl.searchParams.set("registered", "1");
      loginUrl.searchParams.set("username", result.data.username);
      global.setTimeout(() => global.location.assign(loginUrl.href), 450);
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    startRegisterPage().catch((error) => {
      console.error(
        "[white-lamp:authorize] 注册页发生未处理的初始化错误",
        error,
      );
      const status = document.getElementById("page-status");
      if (status) {
        status.hidden = false;
        status.textContent = "错误：注册页初始化失败，请查看控制台中的详细原因。";
      }
    });
  });
})(window);
