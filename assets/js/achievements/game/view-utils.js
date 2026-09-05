// 成就模块 DOM 工具：不访问探索页面或业务状态。
export function element(tag, className, text = "") {
  const node = document.createElement(tag);
  node.className = className;
  node.textContent = text;
  return node;
}

export function region(parent) {
  if (!parent?.append) throw new TypeError("缺少成就挂载容器。");
  const root = element("div", "achievement-module");
  parent.append(root);
  return root;
}

export function createFeedback(root, showFeedback) {
  if (typeof showFeedback !== "function") throw new TypeError("缺少反馈回调。");
  const fallback = element("p", "feedback feedback--error");
  fallback.hidden = true;
  fallback.setAttribute("role", "alert");
  root.append(fallback);
  return (message, kind = "error") => {
    try {
      showFeedback(message, kind);
      fallback.hidden = true;
    } catch (error) {
      fallback.hidden = false;
      fallback.textContent = message;
      console.error("[achievement-view] 全局提示不可用。", error);
    }
  };
}
