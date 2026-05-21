"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  LucideIcon,
  LayoutDashboard,
  CalendarCheck,
  Stethoscope,
  FileText,
  ClipboardList,
  UserCircle,
  LogOut,
  X,
  CheckCircle2,
} from "lucide-react";
import { clearToken } from "@/lib/auth";

interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  key: string;
}

interface SidebarProps {
  activePage: string;
}

const navItems: NavItem[] = [
  { label: "Dashboard",           href: "/dokter/dashboard",                icon: LayoutDashboard, key: "dashboard"   },
  { label: "Booking",             href: "/dokter/data_booking",             icon: CalendarCheck,   key: "booking"     },
  { label: "Jadwal Dokter",       href: "/dokter/jadwal_pemeriksaan",       icon: CalendarCheck,   key: "jadwal"      },
  { label: "Layanan dan Obat",    href: "/dokter/memilih_layanan_dan_obat", icon: Stethoscope,     key: "pemeriksaan" },
  { label: "Rekam Medis",         href: "/dokter/catat_rekam_medis",        icon: FileText,        key: "rekam"       },
  { label: "Riwayat Medis Hewan", href: "/dokter/riwayat_medis_hewan",      icon: ClipboardList,   key: "riwayat"     },
  { label: "Profile",             href: "/dokter/profile",                  icon: UserCircle,      key: "profile"     },
];

const G = "#2e7d32";

/* ─── Toast ─────────────────────────────────────────────────────────── */
function Toast({ visible }: { visible: boolean }) {
  return (
    <div
      style={{
        position: "fixed",
        top: "24px",
        right: "24px",
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        gap: "10px",
        backgroundColor: "#1a1a1a",
        color: "#fff",
        padding: "12px 18px",
        borderRadius: "12px",
        fontSize: "13px",
        fontWeight: 600,
        fontFamily: "'Inter', sans-serif",
        boxShadow: "0 8px 30px rgba(0,0,0,0.25)",
        border: "1px solid #2e7d32",
        pointerEvents: "none",
        transform: visible ? "translateY(0)" : "translateY(-16px)",
        opacity: visible ? 1 : 0,
        transition: "transform 0.3s cubic-bezier(.34,1.56,.64,1), opacity 0.25s ease",
      }}
    >
      <CheckCircle2 size={16} color="#4ade80" style={{ flexShrink: 0 }} />
      Berhasil keluar dari aplikasi
    </div>
  );
}

/* ─── Confirm Modal ──────────────────────────────────────────────────── */
function LogoutModal({
  open,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  if (!open) return null;

  return (
    <div
      onClick={onCancel}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9000,
        backgroundColor: "rgba(0,0,0,0.35)",
        backdropFilter: "blur(3px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        animation: "fadeIn .15s ease",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          position: "relative",
          backgroundColor: "#fff",
          borderRadius: "18px",
          padding: "28px 28px 24px",
          width: "320px",
          boxShadow: "0 20px 60px rgba(0,0,0,0.18)",
          fontFamily: "'Inter', sans-serif",
          animation: "popIn .2s cubic-bezier(.34,1.56,.64,1)",
        }}
      >
        <div
          style={{
            width: "48px", height: "48px", borderRadius: "50%",
            backgroundColor: "#fff5f5", border: "1.5px solid #fecaca",
            display: "flex", alignItems: "center", justifyContent: "center",
            marginBottom: "16px",
          }}
        >
          <LogOut size={20} color="#dc2626" />
        </div>

        <button
          onClick={onCancel}
          style={{
            position: "absolute", top: "14px", right: "14px",
            background: "none", border: "none", cursor: "pointer",
            color: "#aaa", display: "flex", padding: "4px", borderRadius: "6px",
          }}
        >
          <X size={16} />
        </button>

        <h3 style={{ margin: "0 0 6px", fontSize: "16px", fontWeight: 700, color: "#111" }}>
          Keluar dari Aplikasi?
        </h3>
        <p style={{ margin: "0 0 22px", fontSize: "13px", color: "#888", lineHeight: 1.55 }}>
          Sesi kamu akan diakhiri dan kamu perlu login kembali untuk mengakses aplikasi.
        </p>

        <div style={{ display: "flex", gap: "10px" }}>
          <button
            onClick={onCancel}
            style={{
              flex: 1, padding: "10px", borderRadius: "10px",
              border: "1.5px solid #e0e0e0", background: "#fff",
              fontSize: "13px", fontWeight: 600, color: "#555",
              cursor: "pointer", fontFamily: "inherit",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#f5f5f5")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "#fff")}
          >
            Batal
          </button>
          <button
            onClick={onConfirm}
            style={{
              flex: 1, padding: "10px", borderRadius: "10px",
              border: "none", background: "#dc2626",
              fontSize: "13px", fontWeight: 600, color: "#fff",
              cursor: "pointer", fontFamily: "inherit",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#b91c1c")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "#dc2626")}
          >
            Ya, Keluar
          </button>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes popIn  { from { transform: scale(.88); opacity: 0 } to { transform: scale(1); opacity: 1 } }
      `}</style>
    </div>
  );
}

/* ─── Sidebar Dokter ─────────────────────────────────────────────────── */
export default function Sidebar({ activePage }: SidebarProps) {
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);
  const [showToast, setShowToast] = useState(false);

  const handleLogoutConfirm = () => {
    setShowModal(false);
    clearToken();
    setShowToast(true);
    setTimeout(() => {
      router.push("/auth/login_dokter");
    }, 1800);
  };

  return (
    <>
      <Toast visible={showToast} />
      <LogoutModal
        open={showModal}
        onConfirm={handleLogoutConfirm}
        onCancel={() => setShowModal(false)}
      />

      <aside
        style={{
          width: "210px",
          backgroundColor: "#fff",
          borderRight: "1.5px solid #e0e0e0",
          display: "flex",
          flexDirection: "column",
          height: "100vh",
          position: "sticky",
          top: 0,
          flexShrink: 0,
          fontFamily: "'Inter', sans-serif",
        }}
      >
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", padding: "18px 16px", borderBottom: "1.5px solid #e0e0e0", flexShrink: 0 }}>
          <Image src="/images/logo.png" alt="Sipeka" width={130} height={38} style={{ width: "auto", height: "auto" }} priority />
        </div>

        {/* Role badge */}
        <div style={{ padding: "10px 14px", borderBottom: "1.5px solid #e0e0e0" }}>
          <span style={{
            fontSize: "11px", fontWeight: 700,
            background: "#e3f2fd", color: "#1565c0",
            border: "1px solid #90caf9",
            borderRadius: 20, padding: "3px 10px",
            letterSpacing: ".03em",
          }}>
            🩺 Dokter
          </span>
        </div>

        {/* Nav */}
        <nav style={{ padding: "10px 10px", display: "flex", flexDirection: "column", gap: "2px", flex: 1, overflowY: "auto" }}>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activePage === item.key;
            return (
              <Link
                key={item.key}
                href={item.href}
                style={{
                  display: "flex", alignItems: "center", gap: "10px",
                  padding: "9px 12px", borderRadius: "10px",
                  fontSize: "13px", fontWeight: 600, textDecoration: "none",
                  backgroundColor: isActive ? G : "transparent",
                  color: isActive ? "#fff" : "#888",
                  transition: "all .13s",
                }}
                onMouseEnter={(e) => { if (!isActive) { e.currentTarget.style.backgroundColor = "#f0faf2"; e.currentTarget.style.color = G; } }}
                onMouseLeave={(e) => { if (!isActive) { e.currentTarget.style.backgroundColor = "transparent"; e.currentTarget.style.color = "#888"; } }}
              >
                <Icon style={{ width: "17px", height: "17px", flexShrink: 0 }} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Logout */}
        <div style={{ padding: "10px", borderTop: "1.5px solid #e0e0e0", flexShrink: 0 }}>
          <button
            onClick={() => setShowModal(true)}
            style={{
              width: "100%", display: "flex", alignItems: "center", gap: "10px",
              padding: "9px 12px", borderRadius: "10px", border: "none",
              background: "none", cursor: "pointer", fontSize: "13px",
              fontWeight: 600, color: "#888", fontFamily: "inherit", transition: "all .13s",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "#fff5f5"; e.currentTarget.style.color = "#dc2626"; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; e.currentTarget.style.color = "#888"; }}
          >
            <LogOut style={{ width: "17px", height: "17px" }} />
            Logout
          </button>
        </div>
      </aside>
    </>
  );
}