import React from "react";

export default function Toast({ toasts, removeToast }) {
  if (!toasts || toasts.length === 0) return null;

  return (
    <div className="toast-container">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`toast ${toast.type === "error" ? "toast-error" : "toast-success"}`}
          onClick={() => removeToast(toast.id)}
        >
          <span>{toast.type === "error" ? "🚨" : "✨"}</span>
          <div style={{ flex: 1 }}>{toast.message}</div>
        </div>
      ))}
    </div>
  );
}
