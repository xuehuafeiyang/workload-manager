import React from "react";
import ReactDOM from "react-dom/client";
import "./App.css";
import App from "./App";

// 将错误直接渲染到页面，方便在打包版本中诊断白板问题
function renderError(message: string) {
  const root = document.getElementById("root");
  if (root) {
    root.innerHTML = `
      <div style="padding:20px;font-family:monospace;background:#fee;color:#c00;border:2px solid #c00;margin:20px;border-radius:4px;">
        <h2>启动错误</h2>
        <pre style="white-space:pre-wrap;word-break:break-all;">${message}</pre>
      </div>
    `;
  }
}

window.addEventListener("error", (e) => {
  renderError(`全局错误:\n${e.message}\n${e.filename}:${e.lineno}\n${e.error?.stack ?? ""}`);
});

window.addEventListener("unhandledrejection", (e) => {
  renderError(`未处理的 Promise 错误:\n${String(e.reason)}\n${e.reason?.stack ?? ""}`);
});

try {
  ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  );
} catch (e) {
  renderError(`React 渲染错误:\n${String(e)}\n${(e as Error)?.stack ?? ""}`);
}
