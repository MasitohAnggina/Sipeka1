"use client";

import {
  Bell, X, Calendar, Clock, Hash, ListOrdered, ChevronRight,
  AlertTriangle, CheckCircle, XCircle, CalendarClock, Info,
  UserX, Phone,
} from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useNotifContext } from "@/context/NotifContext";
import { useCancelNotifContext, timeAgo } from "@/context/CancelNotifContext";
import type { BookingNotif } from "@/hooks/useBookingNotif";
import type { CancelNotif } from "@/context/CancelNotifContext";

interface HeaderProps {
  title:     string;
  subtitle?: string;
  role?: "admin" | "dokter" | "owner";
}

const G = "#2e7d32";

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 640);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);
  return isMobile;
}

function fmtTanggal(d: string) {
  if (!d) return "–";
  return new Date(d).toLocaleDateString("id-ID", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });
}

function fmtDate(d: string) {
  if (!d) return "–";
  return new Date(d).toLocaleDateString("id-ID", {
    day: "2-digit", month: "long", year: "numeric",
  });
}

function BellButton({
  isOpen, unread, onClick, icon, size,
}: {
  isOpen: boolean; unread: number; onClick: () => void; icon: React.ReactNode; size: number;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        position: "relative", width: `${size}px`, height: `${size}px`,
        borderRadius: "50%", border: isOpen ? "2px solid rgba(255,255,255,0.6)" : "none",
        backgroundColor: isOpen ? "rgba(255,255,255,0.25)" : "rgba(255,255,255,0.15)",
        cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
        transition: "background .15s",
      }}
      onMouseEnter={(e) => { if (!isOpen) e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.25)"; }}
      onMouseLeave={(e) => { if (!isOpen) e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.15)"; }}
    >
      {icon}
      {unread > 0 && (
        <span style={{
          position: "absolute", top: "3px", right: "3px",
          minWidth: "16px", height: "16px", padding: "0 4px",
          borderRadius: "9px", background: "#e53935", color: "#fff",
          fontSize: "9px", fontWeight: 700,
          display: "flex", alignItems: "center", justifyContent: "center",
          border: `1.5px solid ${G}`, boxSizing: "border-box", lineHeight: 1,
        }}>
          {unread > 9 ? "9+" : unread}
        </span>
      )}
    </button>
  );
}

function DetailModal({ notif, onClose }: { notif: BookingNotif; onClose(): void }) {
  const router   = useRouter();
  const isMobile = useIsMobile();
  const isBatal  = notif.type === "BATAL";
  const isUrgent = notif.type === "H12";
  const headerBg  = isBatal || isUrgent ? "#b71c1c" : G;
  const accentBg  = isBatal || isUrgent ? "#fce4ec" : "#e8f5e9";
  const accentTxt = isBatal || isUrgent ? "#b71c1c" : G;
  const ModalIcon = isBatal ? XCircle : isUrgent ? Bell : CalendarClock;

  return (
    <div
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      style={{
        position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)",
        display: "flex", alignItems: isMobile ? "flex-end" : "center",
        justifyContent: "center", zIndex: 1200, padding: isMobile ? 0 : 16,
      }}
    >
      <div style={{
        background: "#fff", borderRadius: isMobile ? "16px 16px 0 0" : 16,
        width: isMobile ? "100%" : 420, maxWidth: "100%", overflow: "hidden",
        fontFamily: "'Poppins', sans-serif", maxHeight: isMobile ? "92dvh" : "90vh", overflowY: "auto",
      }}>
        {isMobile && (
          <div style={{ display: "flex", justifyContent: "center", paddingTop: 10, paddingBottom: 4 }}>
            <div style={{ width: 36, height: 4, borderRadius: 2, background: "#ddd" }} />
          </div>
        )}
        <div style={{ background: headerBg, padding: "16px 20px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <ModalIcon size={20} color="#fff" />
            <div>
              <div style={{ fontWeight: 700, fontSize: isMobile ? 14 : 15, color: "#fff" }}>{notif.title}</div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.75)", marginTop: 1 }}>{notif.timeLabel}</div>
            </div>
          </div>
          <button onClick={onClose} style={{ background: "rgba(255,255,255,0.15)", border: "none", borderRadius: "50%", width: 30, height: 30, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
            <X size={14} color="#fff" />
          </button>
        </div>
        <div style={{ background: accentBg, padding: "10px 20px", display: "flex", alignItems: "center", gap: 8 }}>
          <AlertTriangle size={14} color={accentTxt} style={{ flexShrink: 0 }} />
          <span style={{ fontSize: 12, fontWeight: 700, color: accentTxt }}>
            {isBatal ? "Booking dibatalkan. Segera buat jadwal baru!" : isUrgent ? "Segera persiapkan kedatangan Anda ke klinik!" : "Jangan lupa hadir tepat waktu besok."}
          </span>
        </div>
        <div style={{ padding: isMobile ? "16px" : "20px" }}>
          <div style={{ background: "#f9f9f9", borderRadius: 10, padding: "12px 14px", marginBottom: 14 }}>
            <div style={{ fontSize: 11, color: "#888", marginBottom: 4 }}>Hewan &amp; Layanan</div>
            <div style={{ fontWeight: 700, fontSize: 15, color: "#1a1a1a" }}>{notif.detail.hewan_nama}</div>
            <div style={{ fontSize: 13, color: "#555", marginTop: 2 }}>{notif.detail.layanan_nama}</div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
            {[
              { icon: <Calendar size={13} color={G} />, label: "Tanggal",     value: fmtTanggal(notif.detail.tanggal_booking) },
              { icon: <Clock size={13} color={G} />,    label: "Jam",         value: `${notif.detail.jam} WIB` },
              { icon: <Hash size={13} color={G} />,     label: "No. Booking", value: `#${notif.detail.no_booking}` },
              { icon: <ListOrdered size={13} color={G} />, label: "No. Antrian", value: String(notif.detail.no_antrian).padStart(3, "0") },
            ].map(({ icon, label, value }) => (
              <div key={label} style={{ background: "#fff", border: "1px solid #eee", borderRadius: 8, padding: "9px 12px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 3 }}>{icon}<span style={{ fontSize: 10, color: "#888" }}>{label}</span></div>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#1a1a1a" }}>{value}</div>
              </div>
            ))}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "9px 12px", background: isBatal ? "#fce4ec" : "#e8f5e9", borderRadius: 8, marginBottom: isBatal ? 12 : 0 }}>
            {isBatal ? <XCircle size={14} color="#c62828" /> : <CheckCircle size={14} color={G} />}
            <span style={{ fontSize: 12, color: isBatal ? "#c62828" : G, fontWeight: 600 }}>
              Status: <span style={{ textTransform: "capitalize" }}>{notif.detail.status}</span>
            </span>
          </div>
          {isBatal && (
            <button
              onClick={() => { onClose(); router.push("/owner_pet/booking_layanan"); }}
              style={{ width: "100%", marginTop: 12, padding: "11px 0", borderRadius: 8, border: "none", background: G, color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}
            >
              <CalendarClock size={15} color="#fff" />
              Buat Booking Baru
            </button>
          )}
        </div>
        <div style={{ padding: "0 16px 20px", display: "flex", justifyContent: isBatal ? "center" : "flex-end" }}>
          <button
            onClick={onClose}
            style={{ padding: "9px 24px", borderRadius: 8, border: "none", background: isBatal ? "#eee" : G, color: isBatal ? "#555" : "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "inherit", width: isMobile && !isBatal ? "100%" : undefined }}
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}

function NotifDropdown({ notifs, readIds, onSelect, onClose }: {
  notifs: BookingNotif[]; readIds: Set<string>; onSelect: (n: BookingNotif) => void; onClose: () => void;
}) {
  const ref      = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();

  useEffect(() => {
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) onClose(); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  const dropdownStyle: React.CSSProperties = isMobile
    ? { position: "fixed", bottom: 0, left: 0, right: 0, width: "100%", background: "#fff", borderRadius: "16px 16px 0 0", boxShadow: "0 -4px 24px rgba(0,0,0,0.15)", zIndex: 1100, overflow: "hidden", fontFamily: "'Poppins', sans-serif", maxHeight: "80dvh", display: "flex", flexDirection: "column" }
    : { position: "absolute", top: "calc(100% + 10px)", right: 0, width: 340, background: "#fff", borderRadius: 12, boxShadow: "0 8px 32px rgba(0,0,0,0.15)", border: "1px solid #e8e8e8", zIndex: 1100, overflow: "hidden", fontFamily: "'Poppins', sans-serif" };

  return (
    <>
      {isMobile && <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.3)", zIndex: 1099 }} />}
      <div ref={ref} style={dropdownStyle}>
        {isMobile && (
          <div style={{ display: "flex", justifyContent: "center", paddingTop: 10, paddingBottom: 4, flexShrink: 0 }}>
            <div style={{ width: 36, height: 4, borderRadius: 2, background: "#ddd" }} />
          </div>
        )}
        <div style={{ padding: "12px 16px", borderBottom: "1px solid #f0f0f0", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Bell size={15} color={G} />
            <span style={{ fontWeight: 700, fontSize: 14, color: "#1a1a1a" }}>Notifikasi Booking</span>
            {notifs.length > 0 && (
              <span style={{ background: "#e53935", color: "#fff", borderRadius: 20, fontSize: 10, fontWeight: 700, padding: "1px 7px" }}>{notifs.length}</span>
            )}
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", padding: 4 }}>
            <X size={14} color="#999" />
          </button>
        </div>
        <div style={{ overflowY: "auto", flex: 1 }}>
          {notifs.length === 0 ? (
            <div style={{ padding: "40px 0", textAlign: "center", color: "#aaa", fontSize: 13 }}>
              <Bell size={28} color="#ddd" style={{ display: "block", margin: "0 auto 8px" }} />
              Tidak ada notifikasi saat ini
            </div>
          ) : (
            notifs.map((n) => {
              const isBatal  = n.type === "BATAL";
              const isUrgent = n.type === "H12";
              const isRead   = readIds.has(n.id);
              const bg        = isBatal || isUrgent ? "#fff5f5" : "#f0faf2";
              const borderClr = isBatal || isUrgent ? "#ffcdd2" : "#c8e6c9";
              const typeLabel = isBatal ? "Dibatalkan" : isUrgent ? "12 jam lagi" : "Besok";
              const DotIcon   = isBatal ? XCircle : isUrgent ? AlertTriangle : CalendarClock;
              const dotColor  = isBatal || isUrgent ? "#e53935" : "#f59e0b";
              return (
                <div
                  key={n.id} onClick={() => onSelect(n)}
                  style={{ padding: isMobile ? "14px 16px" : "13px 16px", background: isRead ? "#fafafa" : bg, borderLeft: `3px solid ${isRead ? "#e0e0e0" : borderClr}`, cursor: "pointer", display: "flex", alignItems: "center", gap: 12, borderBottom: "1px solid #f0f0f0", opacity: isRead ? 0.6 : 1, transition: "background .12s" }}
                  onMouseEnter={(e) => ((e.currentTarget as HTMLDivElement).style.background = isBatal || isUrgent ? "#ffebee" : "#e8f5e9")}
                  onMouseLeave={(e) => ((e.currentTarget as HTMLDivElement).style.background = isRead ? "#fafafa" : bg)}
                >
                  <DotIcon size={20} color={dotColor} style={{ flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: isRead ? 400 : 700, fontSize: 13, color: "#1a1a1a", marginBottom: 2 }}>{n.title}</div>
                    <div style={{ fontSize: 12, color: "#555", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{n.subtitle}</div>
                    <div style={{ fontSize: 11, color: "#888", marginTop: 3, display: "flex", alignItems: "center", gap: 4 }}>
                      <Clock size={11} color="#aaa" />{n.timeLabel}
                    </div>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4, flexShrink: 0 }}>
                    <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 20, background: isBatal || isUrgent ? "#ffcdd2" : "#c8e6c9", color: isBatal || isUrgent ? "#b71c1c" : G }}>{typeLabel}</span>
                    <ChevronRight size={14} color="#bbb" />
                  </div>
                </div>
              );
            })
          )}
        </div>
        <div style={{ padding: "10px 16px", background: "#fafafa", borderTop: "1px solid #f0f0f0", fontSize: 11, color: "#aaa", textAlign: "center", display: "flex", alignItems: "center", justifyContent: "center", gap: 5, flexShrink: 0 }}>
          <Info size={11} color="#ccc" />
          Notifikasi muncul H-1 hari &amp; H-12 jam sebelum booking
        </div>
      </div>
    </>
  );
}

function CancelDetailModal({ notif, onClose, onConfirm, confirming }: {
  notif: CancelNotif; onClose: () => void; onConfirm: () => void; confirming: boolean;
}) {
  const isMobile = useIsMobile();
  return (
    <div
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: isMobile ? "flex-end" : "center", justifyContent: "center", zIndex: 1300, padding: isMobile ? 0 : 16, fontFamily: "'Poppins', sans-serif" }}
    >
      <div style={{ background: "#fff", borderRadius: isMobile ? "16px 16px 0 0" : 16, width: isMobile ? "100%" : 440, maxWidth: "100%", overflow: "hidden", maxHeight: isMobile ? "92dvh" : "90vh", overflowY: "auto" }}>
        {isMobile && (
          <div style={{ display: "flex", justifyContent: "center", paddingTop: 10, paddingBottom: 4 }}>
            <div style={{ width: 36, height: 4, borderRadius: 2, background: "#ddd" }} />
          </div>
        )}
        <div style={{ background: "#b71c1c", padding: "16px 20px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <UserX size={20} color="#fff" />
            <div>
              <div style={{ fontWeight: 700, fontSize: isMobile ? 14 : 15, color: "#fff" }}>Pembatalan dari Pemilik</div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.75)", marginTop: 1 }}>{timeAgo(notif.cancelled_at)}</div>
            </div>
          </div>
          <button onClick={onClose} style={{ background: "rgba(255,255,255,0.15)", border: "none", borderRadius: "50%", width: 30, height: 30, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
            <X size={14} color="#fff" />
          </button>
        </div>
        <div style={{ background: "#fce4ec", padding: "10px 20px", display: "flex", alignItems: "center", gap: 8 }}>
          <AlertTriangle size={14} color="#b71c1c" style={{ flexShrink: 0 }} />
          <span style={{ fontSize: 12, fontWeight: 700, color: "#b71c1c" }}>Owner telah membatalkan booking ini. Konfirmasi untuk memperbarui data.</span>
        </div>
        <div style={{ padding: isMobile ? "16px" : "20px" }}>
          <div style={{ background: "#f9f9f9", borderRadius: 10, padding: "12px 14px", marginBottom: 14 }}>
            <div style={{ fontSize: 11, color: "#888", marginBottom: 4 }}>Hewan &amp; Layanan</div>
            <div style={{ fontWeight: 700, fontSize: 15, color: "#1a1a1a" }}>{notif.hewan_nama}</div>
            <div style={{ fontSize: 13, color: "#555", marginTop: 2 }}>{notif.layanan_nama}</div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
            {[
              { icon: <Calendar size={13} color={G} />,    label: "Tanggal",     value: fmtDate(notif.tanggal_booking) },
              { icon: <Clock size={13} color={G} />,       label: "Jam",         value: `${notif.jam} WIB` },
              { icon: <Hash size={13} color={G} />,        label: "No. Booking", value: `#${notif.no_booking}` },
              { icon: <ListOrdered size={13} color={G} />, label: "No. Antrian", value: String(notif.no_antrian).padStart(3, "0") },
            ].map(({ icon, label, value }) => (
              <div key={label} style={{ background: "#fff", border: "1px solid #eee", borderRadius: 8, padding: "9px 12px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 3 }}>{icon}<span style={{ fontSize: 10, color: "#888" }}>{label}</span></div>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#1a1a1a" }}>{value}</div>
              </div>
            ))}
          </div>
          <div style={{ background: "#fff", border: "1px solid #eee", borderRadius: 10, padding: "12px 14px", marginBottom: 14 }}>
            <div style={{ fontSize: 11, color: "#888", marginBottom: 8 }}>Informasi Pemilik</div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 4 }}>
              <span style={{ color: "#666" }}>Nama</span>
              <span style={{ fontWeight: 600, color: "#1a1a1a" }}>{notif.nama_pemilik}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 4 }}>
              <span style={{ color: "#666" }}>No. HP</span>
              <span style={{ fontWeight: 600, color: "#1a1a1a", display: "flex", alignItems: "center", gap: 4 }}>
                <Phone size={11} color="#888" /> {notif.no_hp}
              </span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
              <span style={{ color: "#666" }}>Dokter</span>
              <span style={{ fontWeight: 600, color: "#1a1a1a" }}>{notif.nama_dokter}</span>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "9px 12px", background: "#fce4ec", borderRadius: 8, marginBottom: 4 }}>
            <XCircle size={14} color="#c62828" />
            <span style={{ fontSize: 12, color: "#c62828", fontWeight: 600 }}>Status: Menunggu konfirmasi pembatalan</span>
          </div>
          <div style={{ fontSize: 11, color: "#aaa", textAlign: "center", marginBottom: 16 }}>
            Dibatalkan {timeAgo(notif.cancelled_at)}
          </div>
          <button
            onClick={onConfirm} disabled={confirming}
            style={{ width: "100%", padding: "12px 0", borderRadius: 8, border: "none", background: confirming ? "#ccc" : "#c62828", color: "#fff", fontWeight: 700, fontSize: 14, cursor: confirming ? "not-allowed" : "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, transition: "background .15s" }}
            onMouseEnter={(e) => { if (!confirming) e.currentTarget.style.background = "#b71c1c"; }}
            onMouseLeave={(e) => { if (!confirming) e.currentTarget.style.background = "#c62828"; }}
          >
            <CheckCircle size={16} color="#fff" />
            {confirming ? "Mengkonfirmasi..." : "Konfirmasi Pembatalan"}
          </button>
          <p style={{ fontSize: 11, color: "#aaa", textAlign: "center", margin: "8px 0 0" }}>
            Setelah dikonfirmasi, notifikasi ini akan hilang dari daftar
          </p>
        </div>
        <div style={{ padding: "0 20px 20px", display: "flex", justifyContent: "center" }}>
          <button onClick={onClose} style={{ padding: "9px 32px", borderRadius: 8, border: "1.5px solid #e0e0e0", background: "#fff", color: "#666", fontWeight: 600, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}

function CancelDropdown({ notifs, readIds, onSelect, onClose }: {
  notifs: CancelNotif[]; readIds: Set<string>; onSelect: (n: CancelNotif) => void; onClose: () => void;
}) {
  const ref      = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();

  useEffect(() => {
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) onClose(); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  const dropdownStyle: React.CSSProperties = isMobile
    ? { position: "fixed", bottom: 0, left: 0, right: 0, width: "100%", background: "#fff", borderRadius: "16px 16px 0 0", boxShadow: "0 -4px 24px rgba(0,0,0,0.15)", zIndex: 1100, overflow: "hidden", fontFamily: "'Poppins', sans-serif", maxHeight: "80dvh", display: "flex", flexDirection: "column" }
    : { position: "absolute", top: "calc(100% + 10px)", right: 0, width: 350, background: "#fff", borderRadius: 12, boxShadow: "0 8px 32px rgba(0,0,0,0.15)", border: "1px solid #e8e8e8", zIndex: 1100, overflow: "hidden", fontFamily: "'Poppins', sans-serif" };

  return (
    <>
      {isMobile && <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.3)", zIndex: 1099 }} />}
      <div ref={ref} style={dropdownStyle}>
        {isMobile && (
          <div style={{ display: "flex", justifyContent: "center", paddingTop: 10, paddingBottom: 4, flexShrink: 0 }}>
            <div style={{ width: 36, height: 4, borderRadius: 2, background: "#ddd" }} />
          </div>
        )}
        <div style={{ padding: "12px 16px", borderBottom: "1px solid #f0f0f0", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0, background: "#fff8f8" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <UserX size={15} color="#c62828" />
            <span style={{ fontWeight: 700, fontSize: 14, color: "#1a1a1a" }}>Pembatalan dari Owner</span>
            {notifs.length > 0 && (
              <span style={{ background: "#e53935", color: "#fff", borderRadius: 20, fontSize: 10, fontWeight: 700, padding: "1px 7px" }}>{notifs.length}</span>
            )}
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", padding: 4 }}>
            <X size={14} color="#999" />
          </button>
        </div>
        <div style={{ overflowY: "auto", flex: 1 }}>
          {notifs.length === 0 ? (
            <div style={{ padding: "40px 0", textAlign: "center", color: "#aaa", fontSize: 13 }}>
              <XCircle size={28} color="#ddd" style={{ display: "block", margin: "0 auto 8px" }} />
              Tidak ada pembatalan saat ini
            </div>
          ) : (
            notifs.map((n) => {
              const isRead = readIds.has(n.id);
              return (
                <div
                  key={n.id} onClick={() => onSelect(n)}
                  style={{ padding: isMobile ? "14px 16px" : "13px 16px", background: isRead ? "#fafafa" : "#fff5f5", borderLeft: `3px solid ${isRead ? "#e0e0e0" : "#ef9a9a"}`, cursor: "pointer", display: "flex", alignItems: "center", gap: 12, borderBottom: "1px solid #f0f0f0", opacity: isRead ? 0.6 : 1, transition: "background .12s" }}
                  onMouseEnter={(e) => ((e.currentTarget as HTMLDivElement).style.background = "#ffebee")}
                  onMouseLeave={(e) => ((e.currentTarget as HTMLDivElement).style.background = isRead ? "#fafafa" : "#fff5f5")}
                >
                  <XCircle size={20} color="#e53935" style={{ flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: isRead ? 400 : 700, fontSize: 13, color: "#1a1a1a", marginBottom: 1 }}>{n.hewan_nama}</div>
                    <div style={{ fontSize: 12, color: "#666", marginBottom: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{n.nama_pemilik} · {n.layanan_nama}</div>
                    <div style={{ fontSize: 11, color: "#888", display: "flex", alignItems: "center", gap: 4 }}>
                      <Clock size={11} color="#aaa" />{fmtDate(n.tanggal_booking)}, {n.jam} WIB
                    </div>
                    <div style={{ fontSize: 10, color: "#bbb", marginTop: 2 }}>Dibatalkan {timeAgo(n.cancelled_at)}</div>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4, flexShrink: 0 }}>
                    <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 20, background: "#ffcdd2", color: "#b71c1c" }}>Batal</span>
                    <ChevronRight size={14} color="#bbb" />
                  </div>
                </div>
              );
            })
          )}
        </div>
        <div style={{ padding: "10px 16px", background: "#fafafa", borderTop: "1px solid #f0f0f0", fontSize: 11, color: "#aaa", textAlign: "center", display: "flex", alignItems: "center", justifyContent: "center", gap: 5, flexShrink: 0 }}>
          <Info size={11} color="#ccc" />
          Klik untuk melihat detail dan konfirmasi pembatalan
        </div>
      </div>
    </>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
//  KOMPONEN HEADER UTAMA
// ══════════════════════════════════════════════════════════════════════════════

export default function Header({ title, subtitle, role }: HeaderProps) {
  const { notifs, readIds, markRead, unreadCount } = useNotifContext();
  const { cancelNotifs, cancelReadIds, markCancelRead, confirmCancel, cancelUnreadCount, confirming } = useCancelNotifContext();

  const [openNotif,          setOpenNotif]          = useState(false);
  const [openCancel,         setOpenCancel]         = useState(false);
  const [activeNotif,        setActiveNotif]        = useState<BookingNotif | null>(null);
  const [activeCancelNotif,  setActiveCancelNotif]  = useState<CancelNotif | null>(null);
  const [sidebarCollapsed,   setSidebarCollapsed]   = useState(false);
  const [confirmSuccess,     setConfirmSuccess]     = useState(false);
  const [detectedRole,       setDetectedRole]       = useState<string | null>(null);

  // FIX #1: pakai usePathname() dari next/navigation, bukan window.location.pathname
  // di dalam useEffect([]). Cara lama membuat `pathname` beku (stale) begitu Header
  // di-mount sekali dan tidak ikut berubah saat pindah halaman lewat client-side
  // navigation (Link / router.push) tanpa full reload — akibatnya isAdminPage /
  // isDokterPage bisa salah dan showCancelBell jadi tidak pernah true.
  const pathname = usePathname() ?? "";

  const isMobile = useIsMobile();

  // ── Deteksi role otomatis dari sessionStorage ───────────────────────────────
  // FIX #2: tambahkan pathname sebagai dependency agar role ikut dibaca ulang
  // setiap kali route berubah (mis. setelah login/redirect client-side yang
  // menulis sessionStorage tepat sebelum navigasi ke halaman admin/dokter).
  useEffect(() => {
    const r = sessionStorage.getItem("role");
    setDetectedRole(r);
  }, [pathname]);

  const isAdminPage  = pathname.startsWith("/admin");
  const isDokterPage = pathname.startsWith("/dokter");

  const activeRole     = role ?? (isAdminPage ? "admin" : isDokterPage ? "dokter" : detectedRole);
  const showCancelBell = activeRole === "admin" || activeRole === "dokter";
  const showNotifBell  = activeRole === "owner" || !activeRole;

  const toggleSidebar = () => {
    setSidebarCollapsed((v) => {
      const next = !v;
      document.body.classList.toggle("sidebar-collapsed", next);
      return next;
    });
  };

  const handleSelectNotif = (n: BookingNotif) => {
    markRead(n.id);
    setOpenNotif(false);
    setActiveNotif(n);
  };

  const handleSelectCancel = (n: CancelNotif) => {
    markCancelRead(n.id);
    setOpenCancel(false);
    setActiveCancelNotif(n);
    setConfirmSuccess(false);
  };

  const handleConfirmCancel = async () => {
    if (!activeCancelNotif) return;
    const ok = await confirmCancel(activeCancelNotif.id_booking, activeCancelNotif.id);
    if (ok) {
      setConfirmSuccess(true);
      setTimeout(() => {
        setActiveCancelNotif(null);
        setConfirmSuccess(false);
      }, 1200);
    }
  };

  return (
    <>
      <header style={{
        backgroundColor: G, display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: isMobile ? "14px 16px" : "20px 28px", flexShrink: 0,
        fontFamily: "'Inter', sans-serif", position: "relative", zIndex: 100,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button
            onClick={toggleSidebar}
            aria-label={sidebarCollapsed ? "Tampilkan sidebar" : "Sembunyikan sidebar"}
            style={{ background: "rgba(255,255,255,0)", border: "none", cursor: "pointer", padding: "6px 8px", borderRadius: 8, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 5, flexShrink: 0, transition: "background .15s" }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.2)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0)"; }}
            onMouseDown={(e)  => { e.currentTarget.style.background = "rgba(255,255,255,0.35)"; }}
            onMouseUp={(e)    => { e.currentTarget.style.background = "rgba(255,255,255,0.2)"; }}
          >
            {[0, 1, 2].map((i) => (
              <span key={i} style={{ display: "block", width: 20, height: 2.5, background: "#fff", borderRadius: 2 }} />
            ))}
          </button>
          <div>
            <h1 style={{ fontSize: isMobile ? "15px" : "18px", fontWeight: 700, color: "#fff", margin: 0, lineHeight: 1.3 }}>{title}</h1>
            {subtitle && <p style={{ fontSize: isMobile ? "11px" : "13px", color: "#c6e6cb", margin: "2px 0 0" }}>{subtitle}</p>}
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {showCancelBell && (
            <div style={{ position: "relative" }}>
              <BellButton
                isOpen={openCancel}
                unread={cancelUnreadCount}
                onClick={() => { setOpenCancel((v) => !v); setOpenNotif(false); }}
                size={isMobile ? 34 : 38}
                icon={<AlertTriangle style={{ width: "17px", height: "17px", color: cancelUnreadCount > 0 ? "#ffcc02" : "rgba(255,255,255,0.8)" }} />}
              />
              {openCancel && !isMobile && (
                <CancelDropdown notifs={cancelNotifs} readIds={cancelReadIds} onSelect={handleSelectCancel} onClose={() => setOpenCancel(false)} />
              )}
            </div>
          )}

          {showNotifBell && (
            <div style={{ position: "relative" }}>
              <BellButton
                isOpen={openNotif}
                unread={unreadCount}
                onClick={() => { setOpenNotif((v) => !v); setOpenCancel(false); }}
                size={isMobile ? 34 : 38}
                icon={<Bell style={{ width: "17px", height: "17px", color: "#fff" }} />}
              />
              {openNotif && !isMobile && (
                <NotifDropdown notifs={notifs} readIds={readIds} onSelect={handleSelectNotif} onClose={() => setOpenNotif(false)} />
              )}
            </div>
          )}
        </div>
      </header>

      {openCancel && isMobile && (
        <CancelDropdown notifs={cancelNotifs} readIds={cancelReadIds} onSelect={handleSelectCancel} onClose={() => setOpenCancel(false)} />
      )}
      {openNotif && isMobile && (
        <NotifDropdown notifs={notifs} readIds={readIds} onSelect={handleSelectNotif} onClose={() => setOpenNotif(false)} />
      )}
      {activeNotif && (
        <DetailModal notif={activeNotif} onClose={() => setActiveNotif(null)} />
      )}
      {activeCancelNotif && !confirmSuccess && (
        <CancelDetailModal notif={activeCancelNotif} onClose={() => setActiveCancelNotif(null)} onConfirm={handleConfirmCancel} confirming={confirming} />
      )}
      {confirmSuccess && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1400, fontFamily: "'Poppins', sans-serif" }}>
          <div style={{ background: "#fff", borderRadius: 14, padding: "28px 36px", textAlign: "center", boxShadow: "0 8px 32px rgba(0,0,0,0.15)" }}>
            <CheckCircle size={40} color={G} style={{ marginBottom: 12 }} />
            <div style={{ fontSize: 16, fontWeight: 700, color: "#1a1a1a", marginBottom: 4 }}>Pembatalan Dikonfirmasi</div>
            <div style={{ fontSize: 13, color: "#888" }}>Data booking telah diperbarui</div>
          </div>
        </div>
      )}
    </>
  );
}