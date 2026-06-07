"use client";

import { useState, useEffect } from "react";
import * as XLSX from "xlsx-js-style";
import Sidebar from "@/components/Sidebar_dokter";
import Header from "@/components/Header";
import { FileText, Search, Info, Download } from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

interface RiwayatItem {
  id_rekam_medis:   number;
  tanggal:          string | null;
  nama_hewan:       string;
  jenis:            string;
  foto:             string | null;
  nama_pemilik:     string;
  diagnosa:         string;
  diagnosa_lengkap: string | null;
  catatan_dokter:   string | null;
  tindakan:         string | null;
  nama_dokter:      string;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const G           = "#2e7d32";
const API         = "http://127.0.0.1:8000/api";
const STORAGE_URL = "http://127.0.0.1:8000/storage/";

// ── Helpers ───────────────────────────────────────────────────────────────────

function normalizeFotoUrl(foto: string | null): string | null {
  if (!foto) return null;
  if (foto.startsWith("http://") || foto.startsWith("https://")) return foto;
  return STORAGE_URL + foto.replace(/^\//, "");
}

const speciesEmoji: Record<string, string> = {
  Kucing: "🐱", Anjing: "🐕", Kelinci: "🐇", Burung: "🐦", Hamster: "🐹",
};

function formatTanggal(dateStr: string | null): string {
  if (!dateStr) return "-";
  return new Date(dateStr + "T00:00:00").toLocaleDateString("id-ID", {
    day: "numeric", month: "short", year: "numeric",
  });
}

// ── Export Excel ──────────────────────────────────────────────────────────────

function exportToExcel(data: RiwayatItem[]) {
  const headers = ["Tanggal", "Nama Hewan", "Jenis", "Nama Pemilik", "Diagnosa", "Diagnosa Lengkap", "Tindakan / Obat", "Catatan Dokter", "Dokter"];

  const rows = data.map((r) => [
    formatTanggal(r.tanggal),
    r.nama_hewan,
    r.jenis,
    r.nama_pemilik,
    r.diagnosa,
    r.diagnosa_lengkap ?? "-",
    r.tindakan ?? "-",
    r.catatan_dokter ?? "-",
    r.nama_dokter,
  ]);

  const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);

  const headerStyle = {
    font:      { bold: true, color: { rgb: "FFFFFF" }, name: "Arial", sz: 11 },
    fill:      { patternType: "solid", fgColor: { rgb: "2E7D32" } },
    alignment: { horizontal: "center", vertical: "center" },
    border: {
      top:    { style: "thin", color: { rgb: "FFFFFF" } },
      bottom: { style: "thin", color: { rgb: "FFFFFF" } },
      left:   { style: "thin", color: { rgb: "FFFFFF" } },
      right:  { style: "thin", color: { rgb: "FFFFFF" } },
    },
  };

  headers.forEach((_, i) => {
    const cellRef = XLSX.utils.encode_cell({ r: 0, c: i });
    if (ws[cellRef]) ws[cellRef].s = headerStyle;
  });

  rows.forEach((_, rowIdx) => {
    const isEven = rowIdx % 2 === 0;
    headers.forEach((_, colIdx) => {
      const cellRef = XLSX.utils.encode_cell({ r: rowIdx + 1, c: colIdx });
      if (ws[cellRef]) {
        ws[cellRef].s = {
          font:      { name: "Arial", sz: 10 },
          fill:      { patternType: "solid", fgColor: { rgb: isEven ? "FFFFFF" : "F1F8E9" } },
          alignment: { vertical: "center", wrapText: true },
          border: {
            top:    { style: "thin", color: { rgb: "E0E0E0" } },
            bottom: { style: "thin", color: { rgb: "E0E0E0" } },
            left:   { style: "thin", color: { rgb: "E0E0E0" } },
            right:  { style: "thin", color: { rgb: "E0E0E0" } },
          },
        };
      }
    });
  });

  ws["!cols"] = [
    { wch: 16 }, // Tanggal
    { wch: 16 }, // Nama Hewan
    { wch: 12 }, // Jenis
    { wch: 20 }, // Nama Pemilik
    { wch: 20 }, // Diagnosa
    { wch: 30 }, // Diagnosa Lengkap
    { wch: 30 }, // Tindakan
    { wch: 30 }, // Catatan Dokter
    { wch: 18 }, // Dokter
  ];

  ws["!rows"] = [{ hpt: 22 }];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Riwayat Medis");

  const now = new Date();
  const timestamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`;
  XLSX.writeFile(wb, `riwayat_medis_${timestamp}.xlsx`, { cellStyles: true });
}

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
  borderBottom: "1px solid #f2f2f2", verticalAlign: "top",
};

// ── Sub-Components ────────────────────────────────────────────────────────────

function FotoHewan({ foto, nama, jenis, size = 34 }: {
  foto: string | null; nama: string; jenis: string; size?: number;
}) {
  const [imgError, setImgError] = useState(false);
  const fotoUrl = normalizeFotoUrl(foto);
  const emoji   = speciesEmoji[jenis] ?? "🐾";

  if (fotoUrl && !imgError) {
    return (
      <img
        src={fotoUrl} alt={nama}
        style={{ width: size, height: size, objectFit: "cover", borderRadius: 8, display: "block", flexShrink: 0 }}
        onError={() => setImgError(true)}
      />
    );
  }
  return (
    <div style={{ width: size, height: size, borderRadius: 8, background: "#e8f5e9", border: "1.5px solid #a5d6a7", display: "flex", alignItems: "center", justifyContent: "center", fontSize: size * 0.5, flexShrink: 0 }}>
      {emoji}
    </div>
  );
}

function HewanCell({ foto, nama, jenis, pemilik }: {
  foto: string | null; nama: string; jenis: string; pemilik: string;
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
      <FotoHewan foto={foto} nama={nama} jenis={jenis} size={36} />
      <div>
        <div style={{ fontWeight: 700, fontSize: 13 }}>{nama}</div>
        <div style={{ fontSize: 11, color: "#999", marginTop: 1 }}>👤 {pemilik}</div>
      </div>
    </div>
  );
}

function TindakanCell({ tindakan }: { tindakan: string | null }) {
  if (!tindakan) return <span style={{ fontSize: 12, color: "#bbb", fontStyle: "italic" }}>—</span>;
  const lines = tindakan.split("\n").map(l => l.trim()).filter(Boolean);
  if (lines.length === 1) {
    return <span style={{ fontSize: 12, color: "#444", lineHeight: 1.5 }}>{lines[0]}</span>;
  }
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
      {lines.map((line, i) => (
        <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 5 }}>
          <span style={{ color: G, fontSize: 11, marginTop: 2, flexShrink: 0 }}>•</span>
          <span style={{ fontSize: 12, color: "#444", lineHeight: 1.4 }}>{line}</span>
        </div>
      ))}
    </div>
  );
}

function SearchBar({ value, onChange }: { value: string; onChange(v: string): void }) {
  return (
    <div style={{ position: "relative", width: 260 }}>
      <Search style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", width: 14, height: 14, color: "#aaa", pointerEvents: "none" }} />
      <input
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder="Cari nama hewan atau pemilik..."
        style={{ width: "100%", padding: "8px 12px 8px 32px", borderRadius: 8, border: "1.5px solid #e0e0e0", fontSize: 13, fontFamily: "inherit", outline: "none", color: "#333", background: "#fff", boxSizing: "border-box", transition: "border .15s" }}
        onFocus={e => e.currentTarget.style.borderColor = G}
        onBlur={e => e.currentTarget.style.borderColor = "#e0e0e0"}
      />
    </div>
  );
}

function SkeletonRow() {
  const pulse: React.CSSProperties = {
    background: "linear-gradient(90deg, #f0f0f0 25%, #e8e8e8 50%, #f0f0f0 75%)",
    backgroundSize: "200% 100%",
    animation: "shimmer 1.4s infinite",
    borderRadius: 6,
    height: 14,
  };
  return (
    <>
      <style>{`@keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }`}</style>
      {[...Array(5)].map((_, i) => (
        <tr key={i} style={{ borderBottom: "1px solid #f2f2f2" }}>
          <td style={tdS}><div style={{ ...pulse, width: 70 }} /></td>
          <td style={tdS}>
            <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
              <div style={{ width: 36, height: 36, borderRadius: 8, background: "#f0f0f0", flexShrink: 0 }} />
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <div style={{ ...pulse, width: 90 }} />
                <div style={{ ...pulse, width: 60 }} />
              </div>
            </div>
          </td>
          <td style={tdS}><div style={{ ...pulse, width: 110 }} /></td>
          <td style={tdS}><div style={{ ...pulse, width: 120 }} /></td>
          <td style={tdS}><div style={{ ...pulse, width: 140 }} /></td>
          <td style={tdS}><div style={{ ...pulse, width: 100 }} /></td>
        </tr>
      ))}
    </>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function RiwayatMedisHewan() {
  const [data,      setData]      = useState<RiwayatItem[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState("");
  const [search,    setSearch]    = useState("");
  const [exporting, setExporting] = useState(false);

  const token = typeof window !== "undefined" ? sessionStorage.getItem("token") : null;

  useEffect(() => {
    fetch(`${API}/dokter/riwayat-medis`, {
      headers: { "Authorization": `Bearer ${token ?? ""}`, "Content-Type": "application/json" },
    })
      .then(res => res.json())
      .then(json => {
        if (json.success) setData(
          [...json.data].sort((a, b) => {
            const dateDiff = new Date(b.tanggal ?? "1970-01-01").getTime() - new Date(a.tanggal ?? "1970-01-01").getTime();
            return dateDiff !== 0 ? dateDiff : b.id_rekam_medis - a.id_rekam_medis;
          })
        );
        else setError(json.message ?? "Gagal memuat data");
      })
      .catch(() => setError("Tidak dapat terhubung ke server"))
      .finally(() => setLoading(false));
  }, []);

  const filtered = data.filter(r =>
    r.nama_hewan.toLowerCase().includes(search.toLowerCase()) ||
    r.nama_pemilik.toLowerCase().includes(search.toLowerCase())
  );

  function handleExport() {
    setExporting(true);
    setTimeout(() => {
      exportToExcel(filtered.length > 0 ? filtered : data);
      setExporting(false);
    }, 100);
  }

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden", fontFamily: "'Poppins', sans-serif" }}>
      <Sidebar activePage="riwayat" />

      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "auto", background: "#f9f9f9" }}>
        <Header title="Riwayat Medis Hewan" subtitle="Riwayat rekam medis yang sudah dicatat" />

        <div style={{ padding: "22px 28px" }}>
          <div style={{ maxWidth: 1100, margin: "0 auto", display: "flex", flexDirection: "column", gap: 16 }}>

            <div style={cardStyle}>
              {/* Header */}
              <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "14px 20px", borderBottom: "1.5px solid #f0f0f0" }}>
                <FileText style={{ width: 15, height: 15, color: G }} />
                <span style={{ fontWeight: 700, fontSize: 14, color: G }}>Rekam Medis</span>
                {!loading && (
                  <span style={{ marginLeft: 4, padding: "2px 9px", borderRadius: 20, background: "#e8f5e9", border: "1.5px solid #a5d6a7", fontSize: 11, fontWeight: 700, color: G }}>
                    {filtered.length}
                  </span>
                )}
              </div>

              {/* Search + Export */}
              <div style={{ padding: "16px 20px 12px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                <SearchBar value={search} onChange={setSearch} />

                <button
                  onClick={handleExport}
                  disabled={exporting || loading || data.length === 0}
                  style={{
                    display: "flex", alignItems: "center", gap: 6,
                    padding: "8px 16px", borderRadius: 8, border: "none",
                    background: exporting ? "#a5d6a7" : G,
                    color: "#fff", fontSize: 13, fontWeight: 600,
                    cursor: exporting || loading || data.length === 0 ? "not-allowed" : "pointer",
                    fontFamily: "inherit", whiteSpace: "nowrap",
                    opacity: loading || data.length === 0 ? 0.6 : 1,
                    transition: "background .2s",
                  }}
                  onMouseEnter={e => { if (!exporting && !loading) e.currentTarget.style.background = "#1b5e20"; }}
                  onMouseLeave={e => { if (!exporting) e.currentTarget.style.background = G; }}
                >
                  {exporting ? (
                    <>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{ animation: "spin .7s linear infinite" }}>
                        <path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" opacity=".3"/>
                        <path d="M21 12a9 9 0 00-9-9"/>
                      </svg>
                      Mengekspor...
                    </>
                  ) : (
                    <>
                      <Download style={{ width: 13, height: 13 }} />
                      Export Excel
                    </>
                  )}
                </button>
              </div>

              {/* Error */}
              {error && (
                <div style={{ margin: "0 20px 16px", padding: "10px 14px", background: "#ffebee", border: "1px solid #ffcdd2", borderRadius: 8, fontSize: 13, color: "#c62828" }}>
                  {error}
                </div>
              )}

              {/* Table */}
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr>
                      {["Tanggal", "Hewan & Pemilik", "Diagnosa", "Tindakan / Obat", "Catatan Dokter", "Dokter"].map(h => (
                        <th key={h} style={thS}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <SkeletonRow />
                    ) : filtered.length === 0 ? (
                      <tr>
                        <td colSpan={6} style={{ ...tdS, textAlign: "center", color: "#aaa", padding: "48px" }}>
                          <div style={{ fontSize: 28, marginBottom: 8 }}>📋</div>
                          {search ? `Tidak ada hasil untuk "${search}"` : "Belum ada rekam medis yang dicatat"}
                        </td>
                      </tr>
                    ) : filtered.map((r, i) => (
                      <tr key={r.id_rekam_medis}
                        style={{ background: i % 2 === 0 ? "#fff" : "#fafafa" }}
                        onMouseEnter={e => (e.currentTarget.style.background = "#f0faf0")}
                        onMouseLeave={e => (e.currentTarget.style.background = i % 2 === 0 ? "#fff" : "#fafafa")}
                      >
                        <td style={{ ...tdS, whiteSpace: "nowrap" }}>
                          <span style={{ fontWeight: 600, fontSize: 13 }}>{formatTanggal(r.tanggal)}</span>
                        </td>
                        <td style={tdS}>
                          <HewanCell foto={r.foto} nama={r.nama_hewan} jenis={r.jenis} pemilik={r.nama_pemilik} />
                        </td>
                        <td style={tdS}>
                          <div style={{ fontWeight: 700, fontSize: 13, color: "#1a1a1a" }}>{r.diagnosa}</div>
                          {r.diagnosa_lengkap && (
                            <div style={{ fontSize: 11, color: "#888", marginTop: 3, lineHeight: 1.4 }}>{r.diagnosa_lengkap}</div>
                          )}
                        </td>
                        <td style={{ ...tdS, maxWidth: 200 }}>
                          <TindakanCell tindakan={r.tindakan} />
                        </td>
                        <td style={{ ...tdS, maxWidth: 180 }}>
                          {r.catatan_dokter
                            ? <span style={{ fontSize: 12, color: "#555", lineHeight: 1.5 }}>{r.catatan_dokter}</span>
                            : <span style={{ fontSize: 12, color: "#bbb", fontStyle: "italic" }}>—</span>}
                        </td>
                        <td style={{ ...tdS, whiteSpace: "nowrap" }}>
                          <span style={{ fontSize: 12, color: "#555" }}>{r.nama_dokter}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Info Bar */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "11px 16px", background: "#e3f2fd", border: "1.5px solid #bbdefb", borderRadius: 12, fontSize: 13, color: "#1565c0" }}>
              <Info style={{ width: 15, height: 15, flexShrink: 0 }} />
              Data berasal dari catatan Rekam Medis yang sudah disimpan oleh dokter.
            </div>

          </div>
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}