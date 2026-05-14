import React from "react";
import ReactDOM from "react-dom/client";
import "./App.css";
import App from "./App";

// 全局错误捕获，防止白板
window.addEventListener("error", (e) => {
  console.error("全局错误:", e.error);
});
window.addEventListener("unhandledrejection", (e) => {
  console.error("未处理的 Promise 错误:", e.reason);
});

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
