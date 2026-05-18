"use client";

import { useState } from "react";
import Sidebar from "@/components/Sidebar_dokter";
import Header from "@/components/Header";
import { FileText, Stethoscope, Download, Info, Search } from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

interface RekamMedisRecord {
  id: string; hewan: string; hewanEmoji: string; pemilik: string;
  tanggal: string; dokter: string; diagnosa: string;
  tindakan: string[];
}

interface ResepRecord {
  id: string; hewan: string; hewanEmoji: string; pemilik: string;
  tanggal: string; keluhan: string;
  layanan: string[]; obat: string[];
  grandTotal: number;
}

type TabType = "rekam" | "resep";

// ── Constants ─────────────────────────────────────────────────────────────────

const G = "#2e7d32";
const fmt = (n: number) => "Rp " + n.toLocaleString("id-ID");

// ── Seed Data ─────────────────────────────────────────────────────────────────

const SEED_REKAM: RekamMedisRecord[] = [
  {
    id: "rm-001", hewan: "Meng-Meng", hewanEmoji: "🐱", pemilik: "Anggina",
    tanggal: "12 Jan 2026", dokter: "drh. Ali Haqqi", diagnosa: "Gastroenteritis",
    tindakan: ["Metronidazole 2x sehari", "Probiotik FortiFlora 1x sehari"],
  },
  {
    id: "rm-002", hewan: "Meng-Meng", hewanEmoji: "🐱", pemilik: "Anggina",
    tanggal: "10 Jan 2026", dokter: "drh. Ali Haqqi", diagnosa: "Infeksi Cacing",
    tindakan: ["Albendazole 1x sehari", "Vitamin tambahan"],
  },
  {
    id: "rm-003", hewan: "Doggy", hewanEmoji: "🐶", pemilik: "Budi",
    tanggal: "5 Mar 2026", dokter: "drh. Siti Aisyah", diagnosa: "Otitis Externa",
    tindakan: ["Tetes telinga antibiotik 2x sehari", "Pembersih telinga khusus"],
  },
  {
    id: "rm-004", hewan: "Kitty", hewanEmoji: "🐱", pemilik: "Citra",
    tanggal: "20 Feb 2026", dokter: "drh. Ali Haqqi", diagnosa: "Upper Respiratory Infection",
    tindakan: ["Antibiotik Doxycycline 1x sehari", "Tobramycin tetes mata 3x sehari", "Istirahat & isolasi"],
  },
  {
    id: "rm-005", hewan: "Kitty", hewanEmoji: "🐱", pemilik: "Citra",
    tanggal: "15 Feb 2026", dokter: "drh. Ali Haqqi", diagnosa: "Alergi Makanan",
    tindakan: ["Antihistamin Cetirizine 1x sehari", "Ganti pakan ke protein sapi"],
  },
  {
    id: "rm-006", hewan: "Rocky", hewanEmoji: "🐶", pemilik: "Deni",
    tanggal: "1 Apr 2026", dokter: "drh. Siti Aisyah", diagnosa: "Hip Dysplasia Ringan",
    tindakan: ["Fisioterapi 2x seminggu", "Suplemen glukosamin 1x sehari", "Kurangi aktivitas lari"],
  },
];

const SEED_RESEP: ResepRecord[] = [
  {
    id: "res-001", hewan: "Meng-Meng", hewanEmoji: "🐱", pemilik: "Anggina",
    tanggal: "12 Jan 2026", keluhan: "Muntah dan diare sejak 2 hari",
    layanan: ["Konsultasi & Pemeriksaan", "Rawat Inap Non-Infeksius"],
    obat: ["Metronidazole 500mg", "Probiotik FortiFlora", "Cairan Infus RL"],
    grandTotal: 395000,
  },
  {
    id: "res-002", hewan: "Doggy", hewanEmoji: "🐶", pemilik: "Budi",
    tanggal: "5 Mar 2026", keluhan: "Telinga gatal dan berbau",
    layanan: ["Konsultasi & Pemeriksaan", "Grooming Anjing Special"],
    obat: ["Doxycycline 25mg", "Tobramycin Tetes Mata 0.3%"],
    grandTotal: 1005000,
  },
  {
    id: "res-003", hewan: "Kitty", hewanEmoji: "🐱", pemilik: "Citra",
    tanggal: "20 Feb 2026", keluhan: "Bersin-bersin dan keluar cairan dari hidung",
    layanan: ["Konsultasi & Pemeriksaan", "Vaksin Kucing 3 Penyakit"],
    obat: ["Doxycycline 25mg", "Tobramycin Tetes Mata 0.3%"],
    grandTotal: 825000,
  },
  {
    id: "res-004", hewan: "Rocky", hewanEmoji: "🐶", pemilik: "Deni",
    tanggal: "1 Apr 2026", keluhan: "Pincang setelah aktivitas berat",
    layanan: ["Konsultasi & Pemeriksaan", "Pet Hotel – Harian"],
    obat: ["Ori-Vit A+D+D3+C", "Antihistamin Cetirizine"],
    grandTotal: 315000,
  },
];

// ── Shared Styles ─────────────────────────────────────────────────────────────

const cardStyle: React.CSSProperties = {
  background: "#fff", borderRadius: 12,
  border: "1px solid #ebebeb", overflow: "hidden",
  boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
};

const thS: React.CSSProperties = {
  padding: "11px 16px", fontSize: 11, fontWeight: 700,
  color: "#fff", textAlign: "left", background: G,
  whiteSpace: "nowrap", textTransform: "uppercase", letterSpacing: ".05em",
};

const tdS: React.CSSProperties = {
  padding: "12px 16px", fontSize: 13, color: "#2a2a2a",
  borderBottom: "1px solid #f2f2f2", verticalAlign: "middle",
};

// ── Shared Components ─────────────────────────────────────────────────────────

function HewanCell({ emoji, nama, pemilik }: { emoji: string; nama: string; pemilik: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
      <div style={{ width: 34, height: 34, borderRadius: 8, background: "#e8f5e9", border: "1.5px solid #a5d6a7", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17, flexShrink: 0 }}>
        {emoji}
      </div>
      <div>
        <div style={{ fontWeight: 700, fontSize: 13 }}>{nama}</div>
        <div style={{ fontSize: 11, color: "#999" }}>👤 {pemilik}</div>
      </div>
    </div>
  );
}

function TindakanCell({ items }: { items: string[] }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      {items.map((item, i) => (
        <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 6 }}>
          <span style={{ color: G, fontSize: 11, marginTop: 1, flexShrink: 0 }}>•</span>
          <span style={{ fontSize: 12, color: "#444", lineHeight: 1.4 }}>{item}</span>
        </div>
      ))}
    </div>
  );
}

function SearchBar({ value, onChange }: { value: string; onChange(v: string): void }) {
  return (
    <div style={{ position: "relative", width: 240 }}>
      <Search style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", width: 14, height: 14, color: "#aaa", pointerEvents: "none" }} />
      <input
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder="Cari nama pemilik..."
        style={{ width: "100%", padding: "8px 12px 8px 32px", borderRadius: 8, border: "1.5px solid #e0e0e0", fontSize: 13, fontFamily: "inherit", outline: "none", color: "#333", background: "#fff", boxSizing: "border-box", transition: "border .15s" }}
        onFocus={e => e.currentTarget.style.borderColor = G}
        onBlur={e => e.currentTarget.style.borderColor = "#e0e0e0"}
      />
    </div>
  );
}

function ExportBtn() {
  const [hov, setHov] = useState(false);
  return (
    <button onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "7px 14px", borderRadius: 8, background: hov ? G : "#fff", border: `1.5px solid ${G}`, color: hov ? "#fff" : G, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", transition: "all .15s" }}>
      <Download style={{ width: 13, height: 13 }} /> Export
    </button>
  );
}

// ── Tab 1: Rekam Medis ────────────────────────────────────────────────────────

function TabRekamMedis() {
  const [search, setSearch] = useState("");
  const rows = SEED_REKAM.filter(r =>
    r.pemilik.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
        <SearchBar value={search} onChange={setSearch} />
        <ExportBtn />
      </div>

      <div style={cardStyle}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              {["Tanggal", "Hewan & Pemilik", "Diagnosa", "Dokter", "Tindakan"].map(h => (
                <th key={h} style={thS}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr><td colSpan={5} style={{ ...tdS, textAlign: "center", color: "#aaa", padding: "40px" }}>Tidak ada data ditemukan</td></tr>
            ) : rows.map((r, i) => (
              <tr key={r.id} style={{ background: i % 2 === 0 ? "#fff" : "#fafafa" }}>
                <td style={{ ...tdS, whiteSpace: "nowrap" }}>
                  <span style={{ fontWeight: 600, fontSize: 13 }}>{r.tanggal}</span>
                </td>
                <td style={tdS}>
                  <HewanCell emoji={r.hewanEmoji} nama={r.hewan} pemilik={r.pemilik} />
                </td>
                <td style={tdS}>
                  <span style={{ fontWeight: 700, color: "#1a1a1a" }}>{r.diagnosa}</span>
                </td>
                <td style={{ ...tdS, fontSize: 12, color: "#555", whiteSpace: "nowrap" }}>{r.dokter}</td>
                <td style={tdS}>
                  <TindakanCell items={r.tindakan} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Tab 2: Layanan & Obat ─────────────────────────────────────────────────────

function TabLayananObat() {
  const [search, setSearch] = useState("");
  const rows = SEED_RESEP.filter(r =>
    r.pemilik.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
        <SearchBar value={search} onChange={setSearch} />
        <ExportBtn />
      </div>

      <div style={cardStyle}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              {["Tanggal", "Hewan & Pemilik", "Keluhan", "Layanan", "Obat", "Total"].map(h => (
                <th key={h} style={thS}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr><td colSpan={6} style={{ ...tdS, textAlign: "center", color: "#aaa", padding: "40px" }}>Tidak ada data ditemukan</td></tr>
            ) : rows.map((r, i) => (
              <tr key={r.id} style={{ background: i % 2 === 0 ? "#fff" : "#fafafa" }}>
                <td style={{ ...tdS, whiteSpace: "nowrap" }}>
                  <span style={{ fontWeight: 600, fontSize: 13 }}>{r.tanggal}</span>
                </td>
                <td style={tdS}>
                  <HewanCell emoji={r.hewanEmoji} nama={r.hewan} pemilik={r.pemilik} />
                </td>
                <td style={{ ...tdS, maxWidth: 160 }}>
                  <span style={{ fontSize: 12, color: "#555" }}>{r.keluhan}</span>
                </td>
                <td style={tdS}>
                  <TindakanCell items={r.layanan} />
                </td>
                <td style={tdS}>
                  <TindakanCell items={r.obat} />
                </td>
                <td style={{ ...tdS, whiteSpace: "nowrap" }}>
                  <span style={{ fontWeight: 800, fontSize: 13, color: G }}>{fmt(r.grandTotal)}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {rows.length > 0 && (
        <div style={{ marginTop: 10, display: "flex", justifyContent: "flex-end" }}>
          <div style={{ padding: "10px 18px", background: "#e8f5e9", borderRadius: 10, border: "1.5px solid #a5d6a7", fontSize: 13, fontWeight: 700, color: G }}>
            Total: {fmt(rows.reduce((s, r) => s + r.grandTotal, 0))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function RiwayatMedisHewan() {
  const [activeTab, setActiveTab] = useState<TabType>("rekam");

  const tabs: { key: TabType; label: string; icon: React.ReactNode }[] = [
    { key: "rekam", label: "Rekam Medis",    icon: <FileText    style={{ width: 14, height: 14 }} /> },
    { key: "resep", label: "Layanan & Obat", icon: <Stethoscope style={{ width: 14, height: 14 }} /> },
  ];

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden", fontFamily: "'Poppins', sans-serif" }}>
      <Sidebar activePage="riwayat" />

      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "auto", background: "#f9f9f9" }}>
        <Header
          title="Riwayat Medis Hewan"
          subtitle="Riwayat rekam medis dan layanan & obat hewan"
          notifCount={3}
        />

        <div style={{ padding: "22px 28px" }}>
          <div style={{ maxWidth: 1100, margin: "0 auto", display: "flex", flexDirection: "column", gap: 16 }}>

            <div style={cardStyle}>
              {/* Tab Nav */}
              <div style={{ display: "flex", borderBottom: "1.5px solid #f0f0f0" }}>
                {tabs.map(t => (
                  <button key={t.key} onClick={() => setActiveTab(t.key)}
                    style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "13px 22px", fontSize: 13, fontWeight: activeTab === t.key ? 700 : 500, color: activeTab === t.key ? G : "#888", border: "none", background: "none", borderBottom: activeTab === t.key ? `2.5px solid ${G}` : "2.5px solid transparent", marginBottom: -1.5, cursor: "pointer", fontFamily: "inherit", transition: "color .15s", whiteSpace: "nowrap" }}>
                    {t.icon} {t.label}
                  </button>
                ))}
              </div>

              {/* Content */}
              <div style={{ padding: "20px" }}>
                {activeTab === "rekam" && <TabRekamMedis />}
                {activeTab === "resep" && <TabLayananObat />}
              </div>
            </div>

            {/* Info Bar */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "11px 16px", background: "#e3f2fd", border: "1.5px solid #bbdefb", borderRadius: 12, fontSize: 13, color: "#1565c0" }}>
              <Info style={{ width: 15, height: 15, flexShrink: 0 }} />
              Data berasal dari catatan Rekam Medis dan Pemeriksaan yang dibuat oleh dokter.
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}