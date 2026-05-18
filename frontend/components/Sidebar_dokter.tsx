"use client";

import Link from "next/link";
import Image from "next/image";
import {
  LucideIcon,
  LayoutDashboard,
  CalendarCheck,
  Stethoscope,
  FileText,
  ClipboardList,
  UserCircle,
  LogOut,
} from "lucide-react";

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
  { label: "Dashboard",           href: "/dokter/dashboard",                  icon: LayoutDashboard, key: "dashboard" },
  { label: "Booking",             href: "/dokter/data_booking",               icon: CalendarCheck,   key: "booking" },
  { label: "Jadwal Dokter",       href: "/dokter/jadwal_pemeriksaan",         icon: CalendarCheck,   key: "jadwal" },
  { label: "Layanan dan Obat",    href: "/dokter/memilih_layanan_dan_obat",   icon: Stethoscope,     key: "pemeriksaan" },
  { label: "Rekam Medis",         href: "/dokter/catat_rekam_medis",          icon: FileText,        key: "rekam" },
  { label: "Riwayat Medis Hewan", href: "/dokter/riwayat_medis_hewan",        icon: ClipboardList,   key: "riwayat" },
  { label: "Profile",             href: "/dokter/profile",                           icon: UserCircle,      key: "profile" },
];

const G = "#2e7d32";

export default function Sidebar({ activePage }: SidebarProps) {
  return (
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
      <div
        style={{
          display: "flex",
          alignItems: "center",
          padding: "18px 16px",
          borderBottom: "1.5px solid #e0e0e0",
          flexShrink: 0,
        }}
      >
        <Image
          src="/images/logo.png"
          alt="Sipeka"
          width={130}
          height={38}
          style={{ width: "auto", height: "auto" }}
          priority
        />
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
      <nav
        style={{
          padding: "10px 10px",
          display: "flex",
          flexDirection: "column",
          gap: "2px",
          flex: 1,
          overflowY: "auto",
        }}
      >
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activePage === item.key;

          return (
            <Link
              key={item.key}
              href={item.href}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                padding: "9px 12px",
                borderRadius: "10px",
                fontSize: "13px",
                fontWeight: 600,
                textDecoration: "none",
                backgroundColor: isActive ? G : "transparent",
                color: isActive ? "#fff" : "#888",
                transition: "all .13s",
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.backgroundColor = "#f0faf2";
                  e.currentTarget.style.color = G;
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.backgroundColor = "transparent";
                  e.currentTarget.style.color = "#888";
                }
              }}
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
          style={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            gap: "10px",
            padding: "9px 12px",
            borderRadius: "10px",
            border: "none",
            background: "none",
            cursor: "pointer",
            fontSize: "13px",
            fontWeight: 600,
            color: "#888",
            fontFamily: "inherit",
            transition: "all .13s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "#fff5f5";
            e.currentTarget.style.color = "#dc2626";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "transparent";
            e.currentTarget.style.color = "#888";
          }}
        >
          <LogOut style={{ width: "17px", height: "17px" }} />
          Logout
        </button>
      </div>
    </aside>
  );
}