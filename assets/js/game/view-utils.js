// 模块 DOM 工具：统一元素创建与反馈异常处理，不访问公共页面结构。
export function element(tag, className, text = "") {
  const node = document.createElement(tag);
  node.className = className;
  node.textContent = text;
  return node;
}
export function button(text, action, className = "button button--secondary") {
  const node = element("button", className, text);
  node.type = "button";
  node.addEventListener("click", action);
  return node;
}
export function region(parent) {
  if (!parent?.append) throw new TypeError("缺少模块挂载容器。");
  const root = element("div", "exploration-module");
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
    }
    catch (error) {
      fallback.hidden = false;
      fallback.textContent = message;
      console.error("[exploration-view] 全局提示不可用。", error);
    }
  };
}
