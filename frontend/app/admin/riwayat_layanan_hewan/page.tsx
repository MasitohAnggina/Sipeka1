"use client";

import { useState, useEffect } from "react";
import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar_admin";

// ── Types ─────────────────────────────────────────────────────────────────────

interface LayananItem {
  nama_layanan:       string;
  harga_saat_booking: number;
}

interface RiwayatRecord {
  id_riwayat:     number;
  tanggal:        string;
  no_booking:     string;
  status_booking: string;
  nama_pemilik:   string;
  no_hp:          string;
  nama_hewan:     string;
  jenis_hewan:    string;
  foto_hewan:     string | null;
  nama_dokter:    string;
  grand_total:    number;
  layanans:       LayananItem[];
  diagnosa:       string | null;
}

interface Summary {
  total:            number;
  selesai:          number;
  dibatalkan:       number;
  total_pendapatan: number;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const G            = "#2E7D32";
const API          = "http://127.0.0.1:8000/api";
const STORAGE_URL  = "http://127.0.0.1:8000/storage/";
const ITEMS_PER_PAGE = 7;

const statusStyle: Record<string, { bg: string; color: string }> = {
  selesai:      { bg: "#e8f5e9", color: "#2E7D32" },
  dibatalkan:   { bg: "#ffebee", color: "#c62828" },
  berlangsung:  { bg: "#f3e5f5", color: "#6a1b9a" },
  dikonfirmasi: { bg: "#e3f2fd", color: "#1565c0" },
  menunggu:     { bg: "#fff8e1", color: "#e65100" },
};

const STATUS_LABEL: Record<string, string> = {
  selesai:      "Selesai",
  dibatalkan:   "Dibatalkan",
  berlangsung:  "Berlangsung",
  dikonfirmasi: "Dikonfirmasi",
  menunggu:     "Menunggu",
};

const speciesEmoji: Record<string, string> = {
  Kucing: "🐱", Anjing: "🐕", Kelinci: "🐇", Burung: "🐦", Hamster: "🐹",
};

const formatRupiah = (num: number) => "Rp " + Number(num).toLocaleString("id-ID");

// ── Helpers ───────────────────────────────────────────────────────────────────

function normalizeFotoUrl(foto: string | null): string | null {
  if (!foto) return null;
  if (foto.startsWith("http://") || foto.startsWith("https://")) return foto;
  return STORAGE_URL + foto.replace(/^\//, "");
}

function FotoHewan({ foto, nama, jenis, size = 36 }: {
  foto: string | null; nama: string; jenis: string; size?: number;
}) {
  const [imgError, setImgError] = useState(false);
  const fotoUrl = normalizeFotoUrl(foto);
  const emoji   = speciesEmoji[jenis] ?? "🐾";

  if (fotoUrl && !imgError) {
    return (
      <img src={fotoUrl} alt={nama}
        style={{ width: size, height: size, objectFit: "cover", borderRadius: 8, display: "block" }}
        onError={() => setImgError(true)}
      />
    );
  }
  return (
    <div style={{ width: size, height: size, borderRadius: 8, background: "#e8f5e9", display: "flex", alignItems: "center", justifyContent: "center", fontSize: size * 0.5 }}>
      {emoji}
    </div>
  );
}

// ── Shared Styles ─────────────────────────────────────────────────────────────

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "8px 10px", border: "1px solid #e0e0e0",
  borderRadius: 8, fontSize: 13, fontFamily: "inherit",
  color: "#333", background: "#fff", outline: "none", boxSizing: "border-box",
};

const card: React.CSSProperties = {
  background: "#fff", border: "1px solid #e8e8e8",
  borderRadius: 10, padding: 16, marginBottom: 16,
};

const filterLabel: React.CSSProperties = {
  display: "block", fontSize: 12, fontWeight: 500, color: "#666", marginBottom: 6,
};

const td: React.CSSProperties = {
  padding: "11px 14px", fontSize: 13, color: "#333",
  borderBottom: "1px solid #f0f0f0", verticalAlign: "middle",
};

const pageBtn = (active: boolean): React.CSSProperties => ({
  minWidth: 32, height: 32, padding: "0 10px", borderRadius: 6,
  border: `1px solid ${active ? G : "#e0e0e0"}`,
  background: active ? G : "#fff",
  color: active ? "#fff" : "#666",
  fontSize: 13, fontWeight: 500, cursor: "pointer",
  fontFamily: "inherit", display: "inline-flex",
  alignItems: "center", justifyContent: "center",
});

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function RiwayatLayananPage() {
  const [riwayat,       setRiwayat]       = useState<RiwayatRecord[]>([]);
  const [summary,       setSummary]       = useState<Summary | null>(null);
  const [loading,       setLoading]       = useState(true);
  const [error,         setError]         = useState("");
  const [filterNama,    setFilterNama]    = useState("");
  const [filterTanggal, setFilterTanggal] = useState("");
  const [filterLayanan, setFilterLayanan] = useState("");
  const [currentPage,   setCurrentPage]   = useState(1);

  const token   = typeof window !== "undefined" ? sessionStorage.getItem("token") : null;
  const headers = { "Authorization": `Bearer ${token ?? ""}`, "Content-Type": "application/json" };

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      try {
        const [resSummary, resRiwayat] = await Promise.all([
          fetch(`${API}/admin/riwayat/summary`, { headers }),
          fetch(`${API}/admin/riwayat`,         { headers }),
        ]);
        const dataSummary = await resSummary.json();
        const dataRiwayat = await resRiwayat.json();

        if (dataSummary.success) setSummary(dataSummary.data);
        if (dataRiwayat.success && Array.isArray(dataRiwayat.data)) {
  setRiwayat(
    [...dataRiwayat.data].sort((a, b) => {
      const dateDiff = new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime();
      return dateDiff !== 0 ? dateDiff : b.id_riwayat - a.id_riwayat;
    })
  );
} else {
  setError(dataRiwayat.message ?? "Gagal memuat riwayat layanan");
}
      } catch {
        setError("Gagal terhubung ke server.");
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = riwayat.filter(r =>
    (filterNama    === "" || r.nama_hewan.toLowerCase().includes(filterNama.toLowerCase()) || r.nama_pemilik.toLowerCase().includes(filterNama.toLowerCase())) &&
    (filterTanggal === "" || r.tanggal.includes(filterTanggal)) &&
    (filterLayanan === "" || r.layanans.some(l => l.nama_layanan === filterLayanan))
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const paginated  = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  useEffect(() => { setCurrentPage(1); }, [filterNama, filterTanggal, filterLayanan]);

  const layananOptions = [...new Set(riwayat.flatMap(r => r.layanans.map(l => l.nama_layanan)))].sort();

  return (
    <div style={{ display: "flex", height: "100vh", fontFamily: "'Inter', sans-serif" }}>
      <Sidebar activePage="riwayat" />

      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <Header title="Riwayat Layanan" subtitle="Histori lengkap semua layanan yang telah dilakukan"  />

        <main style={{ flex: 1, overflowY: "auto", background: "#f5f7f5", padding: 24 }}>

          {error && (
            <div style={{ background: "#ffebee", border: "1px solid #ffcdd2", borderRadius: 8, padding: "10px 14px", marginBottom: 16, fontSize: 13, color: "#c62828" }}>
              {error}
            </div>
          )}

          {/* Summary Cards */}
<div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 16, marginBottom: 20 }}>
  <div style={{ background: "#fff", border: "1px solid #e8e8e8", borderRadius: 10, padding: "16px 20px" }}>
    <p style={{ fontSize: 12, color: "#888", margin: 0, fontWeight: 500 }}>Total Riwayat</p>
    <p style={{ fontSize: 26, fontWeight: 700, color: "#1a1a1a", margin: "4px 0 0" }}>{summary?.total ?? 0}</p>
  </div>
  <div style={{ background: "#fff8e1", border: "1px solid #e8e8e8", borderRadius: 10, padding: "16px 20px" }}>
    <p style={{ fontSize: 12, color: "#e65100", margin: 0, fontWeight: 500 }}>Total Pendapatan</p>
    <p style={{ fontSize: 20, fontWeight: 700, color: "#bf360c", margin: "4px 0 0" }}>{formatRupiah(summary?.total_pendapatan ?? 0)}</p>
  </div>
</div>

          {/* Filter */}
          <div style={card}>
            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: 14 }}>
              <div>
                <label style={filterLabel}>Nama Hewan / Pemilik</label>
                <input style={inputStyle} placeholder="Cari nama hewan atau pemilik..." value={filterNama} onChange={e => setFilterNama(e.target.value)} />
              </div>
              <div>
                <label style={filterLabel}>Tanggal</label>
                <input style={inputStyle} type="date" value={filterTanggal} onChange={e => setFilterTanggal(e.target.value)} />
              </div>
              <div>
                <label style={filterLabel}>Layanan</label>
                <select style={inputStyle} value={filterLayanan} onChange={e => setFilterLayanan(e.target.value)}>
                  <option value="">Semua Layanan</option>
                  {layananOptions.map(l => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* Table */}
          <div style={{ ...card, padding: 0, overflow: "hidden" }}>
            {loading ? (
              <div style={{ padding: 40, textAlign: "center", color: "#888" }}>Memuat riwayat layanan...</div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ background: G }}>
                      {["Tanggal", "Hewan", "Pemilik", "Layanan", "Dokter", "Diagnosa", "Total Biaya", "Status"].map(h => (
                        <th key={h} style={{ padding: "11px 14px", fontSize: 12, fontWeight: 600, color: "#fff", textAlign: "left", whiteSpace: "nowrap" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {paginated.length === 0 ? (
                      <tr>
                        <td colSpan={8} style={{ padding: "2rem", textAlign: "center", color: "#999", fontSize: 13 }}>
                          <div style={{ fontSize: 32, marginBottom: 8 }}>📋</div>
                          Tidak ada data yang sesuai filter
                        </td>
                      </tr>
                    ) : paginated.map((r, idx) => {
                      const st = statusStyle[r.status_booking] ?? { bg: "#f5f5f5", color: "#555" };
                      return (
                        <tr key={r.id_riwayat}
                          style={{ background: idx % 2 === 0 ? "#fff" : "#fafafa" }}
                          onMouseEnter={e => (e.currentTarget.style.background = "#f0faf2")}
                          onMouseLeave={e => (e.currentTarget.style.background = idx % 2 === 0 ? "#fff" : "#fafafa")}
                        >
                          <td style={td}>{r.tanggal}</td>

                          <td style={td}>
                            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                              <FotoHewan foto={r.foto_hewan} nama={r.nama_hewan} jenis={r.jenis_hewan} size={36} />
                              <div>
                                <div style={{ fontWeight: 500 }}>{r.nama_hewan}</div>
                                <div style={{ fontSize: 11, color: "#aaa" }}>{r.jenis_hewan}</div>
                              </div>
                            </div>
                          </td>

                          <td style={td}>{r.nama_pemilik}</td>

                          <td style={{ ...td, maxWidth: 160 }}>
                            {r.layanans.length > 0
                              ? r.layanans.map(l => l.nama_layanan).join(", ")
                              : "-"}
                          </td>

                          <td style={td}>{r.nama_dokter}</td>

                          <td style={{ ...td, maxWidth: 140 }}>
                            {r.diagnosa
                              ? <span style={{ fontSize: 12, background: "#e8f5e9", color: G, padding: "2px 8px", borderRadius: 10, border: `1px solid #a5d6a7` }}>{r.diagnosa}</span>
                              : <span style={{ fontSize: 12, color: "#bbb", fontStyle: "italic" }}>-</span>}
                          </td>

                          <td style={{ ...td, fontWeight: 600, color: G }}>
                            {r.grand_total > 0 ? formatRupiah(r.grand_total) : "-"}
                          </td>

                          <td style={td}>
                            <span style={{ display: "inline-block", padding: "3px 12px", borderRadius: 20, fontSize: 11, fontWeight: 600, background: st.bg, color: st.color, whiteSpace: "nowrap" }}>
                              {STATUS_LABEL[r.status_booking] ?? r.status_booking}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "14px 16px", borderTop: "1px solid #f0f0f0" }}>
              <button style={pageBtn(false)} disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}>
                ← Sebelumnya
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                <button key={p} style={pageBtn(p === currentPage)} onClick={() => setCurrentPage(p)}>{p}</button>
              ))}
              <button style={pageBtn(false)} disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)}>
                Berikutnya →
              </button>
            </div>
          </div>

        </main>
      </div>
    </div>
  );
}