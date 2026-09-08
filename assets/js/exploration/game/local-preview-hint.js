// 本地文件打开提示：无需模块加载即可指出启动方式，不创建身份或游戏状态。
(function showLocalPreviewHint() {
  if (window.location.protocol !== "file:") return;
  const feedback = document.getElementById("feedback")
    || document.getElementById("achievement-feedback");
  if (!feedback) return;
  feedback.hidden = false;
  feedback.textContent = "当前直接打开了本地文件。请在 VS Code 使用 Live Server 打开整个仓库，再在页面地址末尾添加 ?demo=1 体验独立演示。";
})();
