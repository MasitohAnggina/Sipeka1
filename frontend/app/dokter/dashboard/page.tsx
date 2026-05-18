"use client";

import { useEffect, useState } from "react";
import Sidebar from "@/components/Sidebar_dokter";
import Header from "@/components/Header";

type DiagnosisType = "Pemeriksaan Kesehatan" | "Grooming" | "Vaksinasi" | "Rawat Inap";

interface Patient {
  name: string;
  species: string;
  breed: string;
  owner: string;
  lastVisit: string;
  diagnosis: DiagnosisType;
  image?: string;
}

const G = "#2e7d32";

const statCards = [
  { icon: "📅", label: "Jadwal Hari Ini",       value: "8",  sub: "3 selesai · 5 menunggu", color: "#e8f5e9", accent: G },
  { icon: "🗂️", label: "Booking Hari Ini",       value: "24", sub: "18 selesai · 3 antr.",   color: "#f3e8ff", accent: "#6a1b9a" },
  { icon: "📁", label: "Rekam Medis Bulan Ini",  value: "12", sub: "Sudah dicatat",           color: "#e3f2fd", accent: "#1565c0" },
];

const diagnosisStyle: Record<DiagnosisType, { bg: string; color: string }> = {
  "Pemeriksaan Kesehatan": { bg: "#e8f5e9", color: G },
  "Grooming":              { bg: "#fce4ec", color: "#ad1457" },
  "Vaksinasi":             { bg: "#e3f2fd", color: "#1565c0" },
  "Rawat Inap":            { bg: "#fff3e0", color: "#e65100" },
};

const recentPatients: Patient[] = [
  { name: "Mochi", species: "Kucing", breed: "Persian",          owner: "Budi S.",  lastVisit: "Hari ini",   diagnosis: "Vaksinasi",             image: "" },
  { name: "Rex",   species: "Anjing", breed: "Golden Retriever", owner: "Ani W.",   lastVisit: "Hari ini",   diagnosis: "Pemeriksaan Kesehatan", image: "" },
  { name: "Coco",  species: "Kelinci",breed: "Lop",              owner: "Dian R.",  lastVisit: "Kemarin",    diagnosis: "Grooming",              image: "" },
  { name: "Buddy", species: "Anjing", breed: "Poodle",           owner: "Maya T.",  lastVisit: "2 hari lalu",diagnosis: "Rawat Inap",            image: "" },
];

const speciesEmoji: Record<string, string> = {
  Kucing: "🐱", Anjing: "🐕", Kelinci: "🐇", Burung: "🐦", Hamster: "🐹",
};

export default function DashboardPage() {
  const [today, setToday] = useState("");

  useEffect(() => {
    setToday(
      new Date().toLocaleDateString("id-ID", {
        weekday: "long", day: "numeric", month: "long", year: "numeric",
      })
    );
  }, []);

  // ── Shared styles (selaraskan dengan HewanPage) ──
  const cardStyle: React.CSSProperties = {
    background: "#fff",
    borderRadius: 14,
    border: "1.5px solid #e0e0e0",
    overflow: "hidden",
    boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
  };

  const cardHeaderStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "16px 20px",
    borderBottom: "1.5px solid #e0e0e0",
  };

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden", fontFamily: "'Inter', sans-serif" }}>
      <Sidebar activePage="dashboard" />

      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "auto", background: "#f9f9f9" }}>
        <Header
          title="Dashboard"
          subtitle={`Selamat datang, Dr. Anggi · ${today}`}
          notifCount={3}
        />

        <div style={{ padding: "24px 28px" }}>
          <div style={{ maxWidth: 1100, margin: "0 auto" }}>

            {/* ── Stat Cards ── */}
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: 16,
              marginBottom: 24,
            }}>
              {statCards.map((s) => (
                <div
                  key={s.label}
                  style={{
                    ...cardStyle,
                    padding: "20px",
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 16,
                    cursor: "default",
                    transition: "transform .2s, box-shadow .2s",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-2px)";
                    e.currentTarget.style.boxShadow = "0 6px 20px rgba(0,0,0,0.1)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.06)";
                  }}
                >
                  <div style={{
                    width: 50, height: 50, borderRadius: 12,
                    background: s.color,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 22, flexShrink: 0,
                  }}>
                    {s.icon}
                  </div>
                  <div>
                    <div style={{ fontSize: 12, color: "#888", fontWeight: 500, marginBottom: 4 }}>{s.label}</div>
                    <div style={{ fontSize: 28, fontWeight: 700, color: s.accent, lineHeight: 1 }}>{s.value}</div>
                    <div style={{ fontSize: 12, color: "#aaa", marginTop: 4 }}>{s.sub}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* ── Main Grid ── */}
            <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: 16, alignItems: "start" }}>

              {/* Pasien Terbaru */}
              <div style={cardStyle}>
                <div style={cardHeaderStyle}>
                  <span style={{ fontWeight: 700, fontSize: 15, color: "#1a1a1a" }}>Pasien Terbaru</span>
                  <a href="#" style={{ fontSize: 13, color: G, textDecoration: "none", fontWeight: 600 }}>
                    Lihat Semua →
                  </a>
                </div>
                <div style={{ padding: "8px 20px" }}>
                  {recentPatients.map((p, i) => {
                    const badge = diagnosisStyle[p.diagnosis];
                    const emoji = speciesEmoji[p.species] ?? "🐾";
                    return (
                      <div
                        key={i}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 14,
                          padding: "12px 0",
                          borderBottom: i < recentPatients.length - 1 ? "1px solid #f0f0f0" : "none",
                        }}
                      >
                        {/* Avatar */}
                        <div style={{
                          width: 46, height: 46, borderRadius: 12,
                          background: "#f0faf0",
                          border: "1.5px solid #e0e0e0",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: 22, flexShrink: 0,
                        }}>
                          {p.image ? <img src={p.image} alt={p.name} style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: 10 }} /> : emoji}
                        </div>

                        {/* Info */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 700, fontSize: 14, color: "#1a1a1a" }}>{p.owner}</div>
                          <div style={{ fontSize: 12, color: "#888", marginTop: 2 }}>{p.name} · {p.species} · {p.breed}</div>
                          <div style={{ fontSize: 12, color: "#aaa", marginTop: 1 }}>{p.lastVisit}</div>
                        </div>

                        {/* Badge */}
                        <span style={{
                          padding: "4px 12px",
                          borderRadius: 999,
                          fontSize: 11,
                          fontWeight: 700,
                          background: badge.bg,
                          color: badge.color,
                          whiteSpace: "nowrap",
                          flexShrink: 0,
                        }}>
                          {p.diagnosis}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Ringkasan Kunjungan */}
              <div style={cardStyle}>
                <div style={cardHeaderStyle}>
                  <span style={{ fontWeight: 700, fontSize: 15, color: "#1a1a1a" }}>Ringkasan Kunjungan</span>
                </div>
                <div style={{ padding: "16px 20px", display: "flex", flexDirection: "column", gap: 12 }}>

                  {/* Summary mini cards */}
                  {[
                    { label: "Total Bulan Ini", value: "88",  sub: "kunjungan",  bg: "#f0faf0", border: "#c8e6c9", valColor: G,        subColor: "#888" },
                    { label: "Total Tahun Ini", value: "993", sub: "Jan – Des",  bg: "#e3f2fd", border: "#bbdefb", valColor: "#1565c0", subColor: "#5c7a9e" },
                  ].map((item) => (
                    <div
                      key={item.label}
                      style={{
                        borderRadius: 12,
                        padding: "16px 18px",
                        background: item.bg,
                        border: `1.5px solid ${item.border}`,
                      }}
                    >
                      <div style={{ fontSize: 12, color: "#888", fontWeight: 500, marginBottom: 6 }}>{item.label}</div>
                      <div style={{ fontSize: 32, fontWeight: 700, color: item.valColor, lineHeight: 1 }}>{item.value}</div>
                      <div style={{ fontSize: 12, color: item.subColor, marginTop: 4 }}>{item.sub}</div>
                    </div>
                  ))}

                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}