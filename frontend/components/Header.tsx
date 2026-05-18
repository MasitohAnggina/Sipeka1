"use client";

import { Bell } from "lucide-react";

interface HeaderProps {
  title: string;
  subtitle?: string;
  notifCount?: number;
}

export default function Header({ title, subtitle, notifCount = 0 }: HeaderProps) {
  return (
    <header
      style={{
        backgroundColor: "#2e7d32",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "20px 28px",
        flexShrink: 0,
        fontFamily: "'Inter', sans-serif",
      }}
    >
      <div>
        <h1 style={{ fontSize: "18px", fontWeight: 700, color: "#fff", margin: 0, lineHeight: 1.3 }}>
          {title}
        </h1>
        {subtitle && (
          <p style={{ fontSize: "13px", color: "#c6e6cb", margin: "3px 0 0" }}>
            {subtitle}
          </p>
        )}
      </div>

      <button
        style={{
          position: "relative",
          width: "36px",
          height: "36px",
          borderRadius: "50%",
          border: "none",
          backgroundColor: "rgba(255,255,255,0.15)",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transition: "background .15s",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.25)")}
        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.15)")}
      >
        <Bell style={{ width: "17px", height: "17px", color: "#fff" }} />
        {notifCount > 0 && (
          <span
            style={{
              position: "absolute",
              top: "7px",
              right: "7px",
              width: "8px",
              height: "8px",
              borderRadius: "50%",
              backgroundColor: "#facc15",
              border: "1.5px solid #2e7d32",
              display: "block",
            }}
          />
        )}
      </button>
    </header>
  );
}