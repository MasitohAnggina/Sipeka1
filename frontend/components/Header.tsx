"use client";

import { Bell, X, Calendar, Clock, Hash, ListOrdered, ChevronRight } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useNotifContext } from "@/context/NotifContext";
import type { BookingNotif } from "@/hooks/useBookingNotif";

interface HeaderProps {
  title: string;
  subtitle?: string;
}

const G = "#2e7d32";

function fmtTanggal(d: string) {
  if (!d) return "–";
  return new Date(d).toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

// ── Modal Detail Booking ──────────────────────────────────────────────────────
function DetailModal({
  notif,
  onClose,
}: {
  notif: BookingNotif;
  onClose(): void;
}) {
  const isUrgent  = notif.type === "H12";
  const headerBg  = isUrgent ? "#b71c1c" : G;
  const accentBg  = isUrgent ? "#fce4ec" : "#e8f5e9";
  const accentTxt = isUrgent ? "#b71c1c" : G;
  const icon      = isUrgent ? "🔔" : "📅";

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.4)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1200,
        padding: 16,
      }}
    >
      <div
        style={{
          background: "#fff",
          borderRadius: 16,
          width: 420,
          maxWidth: "100%",
          overflow: "hidden",
          fontFamily: "'Poppins', sans-serif",
        }}
      >
        {/* Header modal */}
        <div
          style={{
            background: headerBg,
            padding: "18px 20px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 22 }}>{icon}</span>
            <div>
              <div style={{ fontWeight: 700, fontSize: 15, color: "#fff" }}>
                {notif.title}
              </div>
              <div
                style={{
                  fontSize: 12,
                  color: "rgba(255,255,255,0.75)",
                  marginTop: 1,
                }}
              >
                {notif.timeLabel}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "rgba(255,255,255,0.15)",
              border: "none",
              borderRadius: "50%",
              width: 30,
              height: 30,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
            }}
          >
            <X size={14} color="#fff" />
          </button>
        </div>

        {/* Banner urgency */}
        <div
          style={{
            background: accentBg,
            padding: "10px 20px",
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <span style={{ fontSize: 13, fontWeight: 700, color: accentTxt }}>
            {isUrgent
              ? "⚠️ Segera persiapkan kedatangan Anda ke klinik!"
              : "📋 Jangan lupa hadir tepat waktu besok."}
          </span>
        </div>

        {/* Detail */}
        <div style={{ padding: "20px" }}>
          {/* Hewan & Layanan */}
          <div
            style={{
              background: "#f9f9f9",
              borderRadius: 10,
              padding: "12px 14px",
              marginBottom: 14,
            }}
          >
            <div style={{ fontSize: 11, color: "#888", marginBottom: 4 }}>
              Hewan &amp; Layanan
            </div>
            <div style={{ fontWeight: 700, fontSize: 15, color: "#1a1a1a" }}>
              {notif.detail.hewan_nama}
            </div>
            <div style={{ fontSize: 13, color: "#555", marginTop: 2 }}>
              {notif.detail.layanan_nama}
            </div>
          </div>

          {/* Grid info */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 10,
              marginBottom: 16,
            }}
          >
            {[
              {
                icon: <Calendar size={14} color={G} />,
                label: "Tanggal",
                value: fmtTanggal(notif.detail.tanggal_booking),
              },
              {
                icon: <Clock size={14} color={G} />,
                label: "Jam",
                value: `${notif.detail.jam} WIB`,
              },
              {
                icon: <Hash size={14} color={G} />,
                label: "No. Booking",
                value: `#${notif.detail.no_booking}`,
              },
              {
                icon: <ListOrdered size={14} color={G} />,
                label: "No. Antrian",
                value: String(notif.detail.no_antrian).padStart(3, "0"),
              },
            ].map(({ icon, label, value }) => (
              <div
                key={label}
                style={{
                  background: "#fff",
                  border: "1px solid #eeeeee",
                  borderRadius: 8,
                  padding: "9px 12px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 5,
                    marginBottom: 3,
                  }}
                >
                  {icon}
                  <span style={{ fontSize: 11, color: "#888" }}>{label}</span>
                </div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#1a1a1a" }}>
                  {value}
                </div>
              </div>
            ))}
          </div>

          {/* Status */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "9px 12px",
              background: "#e8f5e9",
              borderRadius: 8,
            }}
          >
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: G,
                flexShrink: 0,
                display: "inline-block",
              }}
            />
            <span style={{ fontSize: 12, color: G, fontWeight: 600 }}>
              Status:{" "}
              <span style={{ textTransform: "capitalize" }}>
                {notif.detail.status}
              </span>
            </span>
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            padding: "0 20px 18px",
            display: "flex",
            justifyContent: "flex-end",
          }}
        >
          <button
            onClick={onClose}
            style={{
              padding: "9px 24px",
              borderRadius: 8,
              border: "none",
              background: G,
              color: "#fff",
              fontWeight: 700,
              fontSize: 13,
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Dropdown Notifikasi ───────────────────────────────────────────────────────
function NotifDropdown({
  notifs,
  onSelect,
  onClose,
}: {
  notifs: BookingNotif[];
  onSelect(n: BookingNotif): void;
  onClose(): void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  return (
    <div
      ref={ref}
      style={{
        position: "absolute",
        top: "calc(100% + 10px)",
        right: 0,
        width: 340,
        background: "#fff",
        borderRadius: 12,
        boxShadow: "0 8px 32px rgba(0,0,0,0.15)",
        border: "1px solid #e8e8e8",
        zIndex: 1100,
        overflow: "hidden",
        fontFamily: "'Poppins', sans-serif",
      }}
    >
      {/* Header dropdown */}
      <div
        style={{
          padding: "12px 16px",
          borderBottom: "1px solid #f0f0f0",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Bell size={15} color={G} />
          <span style={{ fontWeight: 700, fontSize: 14, color: "#1a1a1a" }}>
            Notifikasi Booking
          </span>
          {notifs.length > 0 && (
            <span
              style={{
                background: "#e53935",
                color: "#fff",
                borderRadius: 20,
                fontSize: 10,
                fontWeight: 700,
                padding: "1px 7px",
              }}
            >
              {notifs.length}
            </span>
          )}
        </div>
        <button
          onClick={onClose}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            padding: 4,
          }}
        >
          <X size={14} color="#999" />
        </button>
      </div>

      {/* List notifikasi */}
      {notifs.length === 0 ? (
        <div
          style={{
            padding: "32px 0",
            textAlign: "center",
            color: "#aaa",
            fontSize: 13,
          }}
        >
          <div style={{ fontSize: 28, marginBottom: 6 }}>🔔</div>
          Tidak ada notifikasi saat ini
        </div>
      ) : (
        notifs.map((n) => {
          const isUrgent  = n.type === "H12";
          const bg        = isUrgent ? "#fff5f5" : "#f0faf2";
          const borderClr = isUrgent ? "#ffcdd2" : "#c8e6c9";
          const typeLabel = isUrgent ? "12 jam lagi" : "Besok";
          const dot       = isUrgent ? "🔴" : "🟡";

          return (
            <div
              key={n.id}
              onClick={() => onSelect(n)}
              style={{
                padding: "13px 16px",
                background: bg,
                borderLeft: `3px solid ${borderClr}`,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 12,
                borderBottom: "1px solid #f0f0f0",
                transition: "background .12s",
              }}
              onMouseEnter={(e) =>
                ((e.currentTarget as HTMLDivElement).style.background =
                  isUrgent ? "#ffebee" : "#e8f5e9")
              }
              onMouseLeave={(e) =>
                ((e.currentTarget as HTMLDivElement).style.background = bg)
              }
            >
              <span style={{ fontSize: 20, flexShrink: 0 }}>{dot}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontWeight: 700,
                    fontSize: 13,
                    color: "#1a1a1a",
                    marginBottom: 2,
                  }}
                >
                  {n.title}
                </div>
                <div
                  style={{
                    fontSize: 12,
                    color: "#555",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {n.subtitle}
                </div>
                <div style={{ fontSize: 11, color: "#888", marginTop: 3 }}>
                  🕐 {n.timeLabel}
                </div>
              </div>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "flex-end",
                  gap: 4,
                  flexShrink: 0,
                }}
              >
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    padding: "2px 8px",
                    borderRadius: 20,
                    background: isUrgent ? "#ffcdd2" : "#c8e6c9",
                    color: isUrgent ? "#b71c1c" : G,
                  }}
                >
                  {typeLabel}
                </span>
                <ChevronRight size={14} color="#bbb" />
              </div>
            </div>
          );
        })
      )}

      {/* Footer info */}
      <div
        style={{
          padding: "9px 16px",
          background: "#fafafa",
          borderTop: "1px solid #f0f0f0",
          fontSize: 11,
          color: "#aaa",
          textAlign: "center",
        }}
      >
        Notifikasi muncul H-1 hari &amp; H-12 jam sebelum booking
      </div>
    </div>
  );
}

// ── Header Utama ──────────────────────────────────────────────────────────────
export default function Header({ title, subtitle }: HeaderProps) {
  const { notifs } = useNotifContext(); // ← ambil dari context
  const [open, setOpen]               = useState(false);
  const [activeNotif, setActiveNotif] = useState<BookingNotif | null>(null);

  const handleSelect = (n: BookingNotif) => {
    setOpen(false);
    setActiveNotif(n);
  };

  return (
    <>
      <header
        style={{
          backgroundColor: G,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "20px 28px",
          flexShrink: 0,
          fontFamily: "'Inter', sans-serif",
          position: "relative",
          zIndex: 100,
        }}
      >
        <div>
          <h1
            style={{
              fontSize: "18px",
              fontWeight: 700,
              color: "#fff",
              margin: 0,
              lineHeight: 1.3,
            }}
          >
            {title}
          </h1>
          {subtitle && (
            <p style={{ fontSize: "13px", color: "#c6e6cb", margin: "3px 0 0" }}>
              {subtitle}
            </p>
          )}
        </div>

        {/* Bell + Dropdown wrapper */}
        <div style={{ position: "relative" }}>
          <button
            onClick={() => setOpen((v) => !v)}
            style={{
              position: "relative",
              width: "38px",
              height: "38px",
              borderRadius: "50%",
              border: open ? "2px solid rgba(255,255,255,0.6)" : "none",
              backgroundColor: open
                ? "rgba(255,255,255,0.25)"
                : "rgba(255,255,255,0.15)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "background .15s",
            }}
            onMouseEnter={(e) => {
              if (!open)
                e.currentTarget.style.backgroundColor =
                  "rgba(255,255,255,0.25)";
            }}
            onMouseLeave={(e) => {
              if (!open)
                e.currentTarget.style.backgroundColor =
                  "rgba(255,255,255,0.15)";
            }}
          >
            <Bell style={{ width: "17px", height: "17px", color: "#fff" }} />

            {/* Badge merah */}
            {notifs.length > 0 && (
              <span
                style={{
                  position: "absolute",
                  top: "4px",
                  right: "4px",
                  minWidth: "16px",
                  height: "16px",
                  padding: "0 4px",
                  borderRadius: "9px",
                  background: "#e53935",
                  color: "#fff",
                  fontSize: "9px",
                  fontWeight: 700,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  border: `1.5px solid ${G}`,
                  boxSizing: "border-box",
                  lineHeight: 1,
                }}
              >
                {notifs.length}
              </span>
            )}
          </button>

          {/* Dropdown */}
          {open && (
            <NotifDropdown
              notifs={notifs}
              onSelect={handleSelect}
              onClose={() => setOpen(false)}
            />
          )}
        </div>
      </header>

      {/* Modal detail */}
      {activeNotif && (
        <DetailModal
          notif={activeNotif}
          onClose={() => setActiveNotif(null)}
        />
      )}
    </>
  );
}