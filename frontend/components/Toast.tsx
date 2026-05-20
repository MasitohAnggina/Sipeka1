"use client";

import { useEffect, useState, useCallback } from "react";

// ── Types ─────────────────────────────────────────────────────────────────────

type ToastType = "success" | "error" | "info";

interface Toast {
  id: number;
  type: ToastType;
  title: string;
  message: string;
}

interface ToastContainerProps {
  toasts: Toast[];
  onRemove: (id: number) => void;
}

// ── Config ────────────────────────────────────────────────────────────────────

const TOAST_DURATION = 4000; // ms

const CONFIG: Record<ToastType, { bar: string; iconBg: string; iconColor: string; emoji: string }> = {
  success: { bar: "#2e7d32", iconBg: "#e8f5e9", iconColor: "#2e7d32", emoji: "✓" },
  error:   { bar: "#c62828", iconBg: "#ffebee", iconColor: "#c62828", emoji: "✗" },
  info:    { bar: "#1565c0", iconBg: "#e3f2fd", iconColor: "#1565c0", emoji: "ℹ" },
};

// ── Single Toast Item ─────────────────────────────────────────────────────────

function ToastItem({ toast, onRemove }: { toast: Toast; onRemove: () => void }) {
  const [visible, setVisible] = useState(false);
  const c = CONFIG[toast.type];

  useEffect(() => {
    // mount → show
    const t1 = setTimeout(() => setVisible(true), 10);
    // start hide animation a bit before removal
    const t2 = setTimeout(() => setVisible(false), TOAST_DURATION - 300);
    // remove from state
    const t3 = setTimeout(onRemove, TOAST_DURATION);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [onRemove]);

  function dismiss() {
    setVisible(false);
    setTimeout(onRemove, 320);
  }

  return (
    <div
      role="alert"
      aria-live="polite"
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: 12,
        background: "#fff",
        borderRadius: 14,
        border: "1px solid #e8e8e8",
        boxShadow: "0 10px 36px rgba(0,0,0,.13), 0 2px 8px rgba(0,0,0,.06)",
        padding: "14px 16px",
        minWidth: 290,
        maxWidth: 380,
        position: "relative",
        overflow: "hidden",
        opacity: visible ? 1 : 0,
        transform: visible ? "translateX(0) scale(1)" : "translateX(64px) scale(0.94)",
        transition: "opacity .3s cubic-bezier(.4,0,.2,1), transform .3s cubic-bezier(.4,0,.2,1)",
        fontFamily: "'Poppins', sans-serif",
      }}
    >
      {/* Icon circle */}
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: "50%",
          background: c.iconBg,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          fontSize: 16,
          color: c.iconColor,
          fontWeight: 700,
        }}
      >
        {c.emoji}
      </div>

      {/* Text */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 13,
            fontWeight: 700,
            color: "#1a1a1a",
            marginBottom: 3,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {toast.title}
        </div>
        {toast.message && (
          <div
            style={{
              fontSize: 12,
              color: "#888",
              lineHeight: 1.45,
              wordBreak: "break-word",
            }}
          >
            {toast.message}
          </div>
        )}
      </div>

      {/* Close button */}
      <button
        onClick={dismiss}
        title="Tutup"
        style={{
          background: "none",
          border: "none",
          cursor: "pointer",
          color: "#ccc",
          fontSize: 20,
          padding: 0,
          lineHeight: 1,
          flexShrink: 0,
          alignSelf: "flex-start",
          marginTop: -1,
          transition: "color .15s",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.color = "#777")}
        onMouseLeave={(e) => (e.currentTarget.style.color = "#ccc")}
      >
        ×
      </button>

      {/* Progress bar */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          height: 3,
          width: "100%",
          background: c.bar,
          borderRadius: "0 0 14px 14px",
          transformOrigin: "left",
          animation: `toastBar ${TOAST_DURATION}ms linear forwards`,
        }}
      />
    </div>
  );
}

// ── Toast Container ───────────────────────────────────────────────────────────

export function ToastContainer({ toasts, onRemove }: ToastContainerProps) {
  return (
    <>
      <style>{`
        @keyframes toastBar {
          from { transform: scaleX(1); }
          to   { transform: scaleX(0); }
        }
      `}</style>
      <div
        style={{
          position: "fixed",
          bottom: 28,
          right: 28,
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-end",
          gap: 10,
          zIndex: 9999,
          pointerEvents: "none",
        }}
      >
        {toasts.map((t) => (
          <div key={t.id} style={{ pointerEvents: "auto" }}>
            <ToastItem toast={t} onRemove={() => onRemove(t.id)} />
          </div>
        ))}
      </div>
    </>
  );
}

// ── useToast Hook ─────────────────────────────────────────────────────────────

let _nextId = 0;

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback((type: ToastType, title: string, message = "") => {
    const id = ++_nextId;
    setToasts((prev) => [...prev, { id, type, title, message }]);
  }, []);

  const toast = {
    success: (title: string, message?: string) => addToast("success", title, message),
    error:   (title: string, message?: string) => addToast("error",   title, message),
    info:    (title: string, message?: string) => addToast("info",    title, message),
  };

  return { toasts, toast, removeToast };
}