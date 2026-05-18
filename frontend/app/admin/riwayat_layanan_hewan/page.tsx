"use client";

import { useState, useEffect } from "react";
import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar_admin";

type LayananStatus = "Selesai" | "Batal";

interface LayananRecord {
  id: number;
  tanggal: string;
  hewan: string;
  pemilik: string;
  jenisLayanan: string;
  dokter: string;
  biaya: number;
  status: LayananStatus;
}

const allLayanan: LayananRecord[] = [
  { id: 1,  tanggal: "24 Mei 2024", hewan: "Meng-meng", pemilik: "Anggi", jenisLayanan: "Pemeriksaan",           dokter: "Dr. Andi Sinta", biaya: 150000, status: "Selesai" },
  { id: 2,  tanggal: "24 Mei 2024", hewan: "Meng-meng", pemilik: "Anggi", jenisLayanan: "Vaksinasi",             dokter: "Dr. Andi Sinta", biaya: 150000, status: "Selesai" },
  { id: 3,  tanggal: "24 Mei 2024", hewan: "Meng-meng", pemilik: "Anggi", jenisLayanan: "Kontrol Pasca Operasi", dokter: "Dr. Andi Sinta", biaya: 150000, status: "Selesai" },
  { id: 4,  tanggal: "23 Mei 2024", hewan: "Meng-meng", pemilik: "Anggi", jenisLayanan: "Operasi",               dokter: "Dr. Andi Sinta", biaya: 150000, status: "Selesai" },
  { id: 5,  tanggal: "23 Mei 2024", hewan: "Meng-meng", pemilik: "Anggi", jenisLayanan: "Grooming",              dokter: "Dr. Andi Sinta", biaya: 150000, status: "Batal" },
  { id: 6,  tanggal: "22 Mei 2024", hewan: "Meng-meng", pemilik: "Anggi", jenisLayanan: "Pemeriksaan",           dokter: "Dr. Andi Sinta", biaya: 150000, status: "Selesai" },
  { id: 7,  tanggal: "21 Mei 2024", hewan: "Meng-meng", pemilik: "Anggi", jenisLayanan: "Grooming",              dokter: "Dr. Andi Sinta", biaya: 150000, status: "Batal" },
  { id: 8,  tanggal: "21 Mei 2024", hewan: "Meng-meng", pemilik: "Anggi", jenisLayanan: "Vaksinasi",             dokter: "Dr. Andi Sinta", biaya: 150000, status: "Batal" },
  { id: 9,  tanggal: "20 Mei 2024", hewan: "Rex",        pemilik: "Budi",  jenisLayanan: "Sterilisasi",           dokter: "Dr. Andi Sinta", biaya: 200000, status: "Selesai" },
  { id: 10, tanggal: "19 Mei 2024", hewan: "Lulu",       pemilik: "Sari",  jenisLayanan: "Vaksinasi",             dokter: "Dr. Andi Sinta", biaya: 100000, status: "Selesai" },
  { id: 11, tanggal: "18 Mei 2024", hewan: "Coco",       pemilik: "Dian",  jenisLayanan: "Pemeriksaan",           dokter: "Dr. Andi Sinta", biaya: 150000, status: "Selesai" },
  { id: 12, tanggal: "17 Mei 2024", hewan: "Buddy",      pemilik: "Maya",  jenisLayanan: "Grooming",              dokter: "Dr. Andi Sinta", biaya: 120000, status: "Batal" },
  { id: 13, tanggal: "16 Mei 2024", hewan: "Putih",      pemilik: "Eko",   jenisLayanan: "Konsultasi",            dokter: "Dr. Andi Sinta", biaya: 80000,  status: "Selesai" },
  { id: 14, tanggal: "15 Mei 2024", hewan: "Kiki",       pemilik: "Rina",  jenisLayanan: "Operasi",               dokter: "Dr. Andi Sinta", biaya: 500000, status: "Selesai" },
  { id: 15, tanggal: "14 Mei 2024", hewan: "Milo",       pemilik: "Yuda",  jenisLayanan: "Vaksinasi",             dokter: "Dr. Andi Sinta", biaya: 100000, status: "Selesai" },
];

const ITEMS_PER_PAGE = 7;

const statusStyle: Record<LayananStatus, { bg: string; color: string }> = {
  Selesai: { bg: "#e8f5e9", color: "#2E7D32" },
  Batal:   { bg: "#ffebee", color: "#c62828" },
};

const formatRupiah = (num: number) =>
  "Rp " + num.toLocaleString("id-ID");

export default function RiwayatLayananPage() {
  const [filterNama,     setFilterNama]     = useState("");
  const [filterTanggal,  setFilterTanggal]  = useState("");
  const [filterLayanan,  setFilterLayanan]  = useState("");
  const [currentPage,    setCurrentPage]    = useState(1);

  const filtered = allLayanan.filter((r) =>
    (filterNama    === "" || r.hewan.toLowerCase().includes(filterNama.toLowerCase()) || r.pemilik.toLowerCase().includes(filterNama.toLowerCase())) &&
    (filterTanggal === "" || r.tanggal.includes(filterTanggal)) &&
    (filterLayanan === "" || r.jenisLayanan === filterLayanan)
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const paginated  = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  useEffect(() => { setCurrentPage(1); }, [filterNama, filterTanggal, filterLayanan]);

  const totalLayanan        = allLayanan.length;
  const totalVaksinasi      = allLayanan.filter((r) => r.jenisLayanan === "Vaksinasi").length;
  const totalPemeriksaan    = allLayanan.filter((r) => r.jenisLayanan === "Pemeriksaan").length;
  const totalOperasiLainnya = allLayanan.filter(
    (r) => !["Vaksinasi", "Pemeriksaan"].includes(r.jenisLayanan)
  ).length;

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "8px 10px",
    border: "1px solid #e0e0e0",
    borderRadius: "8px",
    fontSize: "13px",
    fontFamily: "inherit",
    color: "#333",
    background: "#fff",
    outline: "none",
    boxSizing: "border-box",
  };

  return (
    <div style={{ display: "flex", height: "100vh", fontFamily: "'Inter', sans-serif" }}>
      {/* ✅ FIX: activePage="riwayat" agar cocok dengan key di Sidebar_admin */}
      <Sidebar activePage="riwayat" />

      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <Header
          title="Riwayat Layanan"
          subtitle="Histori lengkap semua layanan yang telah dilakukan"
          notifCount={3}
        />

        <main
          style={{
            flex: 1,
            overflowY: "auto",
            background: "#f5f7f5",
            padding: "24px",
          }}
        >
          {/* ── SUMMARY CARDS ── */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gap: "16px",
              marginBottom: "20px",
            }}
          >
            <div style={summaryCard}>
              <div>
                <p style={summaryLabel}>Total Layanan</p>
                <p style={summaryValue}>{totalLayanan}</p>
              </div>
            </div>

            <div style={{ ...summaryCard, background: "#fce4ec" }}>
              <div>
                <p style={{ ...summaryLabel, color: "#ad1457" }}>Vaksinasi</p>
                <p style={{ ...summaryValue, color: "#880e4f" }}>{totalVaksinasi}</p>
              </div>
            </div>

            <div style={{ ...summaryCard, background: "#fce4ec" }}>
              <div>
                <p style={{ ...summaryLabel, color: "#ad1457" }}>Pemeriksaan</p>
                <p style={{ ...summaryValue, color: "#880e4f" }}>{totalPemeriksaan}</p>
              </div>
            </div>

            <div style={{ ...summaryCard, background: "#fff9c4" }}>
              <div>
                <p style={{ ...summaryLabel, color: "#f57f17" }}>Operasi &amp; Lainnya</p>
                <p style={{ ...summaryValue, color: "#e65100" }}>{totalOperasiLainnya}</p>
              </div>
            </div>
          </div>

          {/* ── FILTER ── */}
          <div style={card}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "2fr 1fr 1fr auto",
                gap: "14px",
                alignItems: "flex-end",
              }}
            >
              <div>
                <label style={filterLabel}>Nama Hewan/Pemilik</label>
                <input
                  style={inputStyle}
                  placeholder="Cari Nama Hewan/pemilik"
                  value={filterNama}
                  onChange={(e) => setFilterNama(e.target.value)}
                />
              </div>
              <div>
                <label style={filterLabel}>Tanggal</label>
                <input
                  style={inputStyle}
                  placeholder="1 April 2026"
                  value={filterTanggal}
                  onChange={(e) => setFilterTanggal(e.target.value)}
                />
              </div>
              <div>
                <label style={filterLabel}>Layanan</label>
                <select
                  style={inputStyle}
                  value={filterLayanan}
                  onChange={(e) => setFilterLayanan(e.target.value)}
                >
                  <option value="">Semua Layanan</option>
                  {[
                    "Vaksinasi",
                    "Pemeriksaan",
                    "Grooming",
                    "Operasi",
                    "Sterilisasi",
                    "Konsultasi",
                    "Kontrol Pasca Operasi",
                  ].map((l) => (
                    <option key={l} value={l}>{l}</option>
                  ))}
                </select>
              </div>
              <div>
                <button
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "8px 16px",
                    borderRadius: "8px",
                    border: "none",
                    background: "#2E7D32",
                    color: "#fff",
                    fontSize: "13px",
                    fontWeight: 600,
                    cursor: "pointer",
                    fontFamily: "inherit",
                    whiteSpace: "nowrap",
                    height: "36px",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "#1b5e20")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "#2E7D32")}
                  onClick={() => {
                    alert("Fitur Export Excel belum tersedia.");
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                    <polyline points="14 2 14 8 20 8"/>
                    <line x1="8" y1="13" x2="16" y2="13"/>
                    <line x1="8" y1="17" x2="16" y2="17"/>
                    <line x1="10" y1="9" x2="8" y2="9"/>
                  </svg>
                  Export Excel
                </button>
              </div>
            </div>
          </div>

          {/* ── TABLE ── */}
          <div style={{ ...card, padding: 0, overflow: "hidden" }}>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "#2E7D32" }}>
                    {["Tanggal", "Hewan", "Pemilik", "Jenis Layanan", "Dokter", "Biaya", "Status"].map((h) => (
                      <th
                        key={h}
                        style={{
                          padding: "11px 14px",
                          fontSize: "12px",
                          fontWeight: 600,
                          color: "#fff",
                          textAlign: "left",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {paginated.length === 0 ? (
                    <tr>
                      <td colSpan={7} style={{ padding: "2rem", textAlign: "center", color: "#999", fontSize: "13px" }}>
                        Tidak ada data yang sesuai filter
                      </td>
                    </tr>
                  ) : (
                    paginated.map((r, idx) => {
                      const st = statusStyle[r.status];
                      return (
                        <tr
                          key={r.id}
                          style={{ background: idx % 2 === 0 ? "#fff" : "#fafafa" }}
                          onMouseEnter={(e) => (e.currentTarget.style.background = "#f0faf2")}
                          onMouseLeave={(e) => (e.currentTarget.style.background = idx % 2 === 0 ? "#fff" : "#fafafa")}
                        >
                          <td style={td}>{r.tanggal}</td>
                          <td style={{ ...td, fontWeight: 500 }}>{r.hewan}</td>
                          <td style={td}>{r.pemilik}</td>
                          <td style={td}>{r.jenisLayanan}</td>
                          <td style={td}>{r.dokter}</td>
                          <td style={td}>{formatRupiah(r.biaya)}</td>
                          <td style={td}>
                            <span
                              style={{
                                display: "inline-block",
                                padding: "3px 12px",
                                borderRadius: "20px",
                                fontSize: "11px",
                                fontWeight: 600,
                                background: st.bg,
                                color: st.color,
                                whiteSpace: "nowrap",
                              }}
                            >
                              {r.status}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* ── PAGINATION ── */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "6px",
                padding: "14px 16px",
                borderTop: "1px solid #f0f0f0",
              }}
            >
              <button
                style={pageBtn(false)}
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => p - 1)}
              >
                ← Sebelumnya
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  style={pageBtn(p === currentPage)}
                  onClick={() => setCurrentPage(p)}
                >
                  {p}
                </button>
              ))}

              <button
                style={pageBtn(false)}
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => p + 1)}
              >
                Berikutnya →
              </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

/* ── style helpers ── */
const summaryCard: React.CSSProperties = {
  background: "#fff",
  border: "1px solid #e8e8e8",
  borderRadius: "10px",
  padding: "16px 20px",
  display: "flex",
  alignItems: "center",
  gap: "14px",
};

const summaryLabel: React.CSSProperties = {
  fontSize: "12px",
  color: "#888",
  margin: 0,
  fontWeight: 500,
};

const summaryValue: React.CSSProperties = {
  fontSize: "26px",
  fontWeight: 700,
  color: "#1a1a1a",
  margin: "4px 0 0",
};

const card: React.CSSProperties = {
  background: "#fff",
  border: "1px solid #e8e8e8",
  borderRadius: "10px",
  padding: "16px",
  marginBottom: "16px",
};

const filterLabel: React.CSSProperties = {
  display: "block",
  fontSize: "12px",
  fontWeight: 500,
  color: "#666",
  marginBottom: "6px",
};

const td: React.CSSProperties = {
  padding: "11px 14px",
  fontSize: "13px",
  color: "#333",
  borderBottom: "1px solid #f0f0f0",
  verticalAlign: "middle",
};

const pageBtn = (active: boolean): React.CSSProperties => ({
  minWidth: "32px",
  height: "32px",
  padding: "0 10px",
  borderRadius: "6px",
  border: `1px solid ${active ? "#2E7D32" : "#e0e0e0"}`,
  background: active ? "#2E7D32" : "#fff",
  color: active ? "#fff" : "#666",
  fontSize: "13px",
  fontWeight: 500,
  cursor: "pointer",
  fontFamily: "inherit",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
});