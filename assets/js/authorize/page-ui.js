// 本文件提供认证页面共用的状态提示、字段错误和密码显示控制。
(function initializeAuthorizePageUi(global) {
  "use strict";

  global.WhiteLampAuthorizeInternal = global.WhiteLampAuthorizeInternal || {};

  function setStatus(element, type, message) {
    if (!element) {
      console.error("[white-lamp:authorize] 页面缺少状态提示区域", { type, message });
      return;
    }

    const labels = {
      success: "成功",
      warning: "提示",
      error: "错误",
      info: "状态",
    };
    element.className = `status status--${type}`;
    element.textContent = `${labels[type] || "状态"}：${message}`;
    element.hidden = false;
  }

  function clearStatus(element) {
    if (!element) {
      return;
    }
    element.textContent = "";
    element.hidden = true;
  }

  function clearFieldErrors(form) {
    for (const field of form.elements) {
      if (field && typeof field.removeAttribute === "function") {
        field.removeAttribute("aria-invalid");
      }
    }
    for (const errorElement of form.querySelectorAll("[data-error-for]")) {
      errorElement.textContent = "";
    }
  }

  function setFieldErrors(form, fieldErrors = {}) {
    for (const [fieldName, message] of Object.entries(fieldErrors)) {
      const field = form.elements.namedItem(fieldName);
      const errorElement = form.querySelector(`[data-error-for="${fieldName}"]`);
      if (field && typeof field.setAttribute === "function") {
        field.setAttribute("aria-invalid", "true");
      }
      if (errorElement) {
        errorElement.textContent = message;
      } else {
        console.error("[white-lamp:authorize] 缺少字段错误展示节点", {
          fieldName,
          message,
        });
      }
    }
  }

  // 所有[data-submit-control]标记元素在此被防止重复提交
  function setFormBusy(form, isBusy) {
    form.setAttribute("aria-busy", String(isBusy));
    for (const control of form.querySelectorAll("[data-submit-control]")) {
      control.disabled = isBusy;
    }
  }

  function bindPasswordToggles(root = document) {
    for (const button of root.querySelectorAll("[data-password-toggle]")) {
      const targetId = button.getAttribute("data-password-toggle");
      const input = document.getElementById(targetId);
      if (!input) {
        console.error("[white-lamp:authorize] 密码显示按钮缺少对应输入框", {
          targetId,
        });
        button.disabled = true;
        continue;
      }

      button.addEventListener("click", () => {
        const shouldShow = input.type === "password";
        input.type = shouldShow ? "text" : "password";
        button.textContent = shouldShow ? "隐藏" : "显示";
        button.setAttribute("aria-pressed", String(shouldShow));
        input.focus();
      });
    }
  }

  function logStartup(pageName) {
    const config = global.WhiteLamp && global.WhiteLamp.authConfig;
    console.info("[white-lamp:authorize] 页面启动", {
      moduleVersion: config && config.moduleVersion,
      page: pageName,
      accountStorageKey: config && config.accountStorageKey,
      sessionStorageKey: config && config.sessionStorageKey,
      successUrl: config && config.successUrl,
      pageUrl: global.location.href,
    });
  }

  global.WhiteLampAuthorizeInternal.pageUi = Object.freeze({
    setStatus,
    clearStatus,
    clearFieldErrors,
    setFieldErrors,
    setFormBusy,
    bindPasswordToggles,
    logStartup,
  });
})(window);
