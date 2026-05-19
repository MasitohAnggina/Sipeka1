"use client";

import { useEffect, useState } from "react";
import Sidebar from "@/components/Sidebar_admin";
import Header from "@/components/Header";
import { ChevronLeft, ChevronRight, Clock } from "lucide-react";

type StatusJadwal = "Aktif" | "Libur";

interface JadwalDokter {
  id: number;
  tanggal: string;
  jamMulai: string;
  jamSelesai: string;
  status: StatusJadwal;
  hari?: string;
  durasi?: number | null;
  nama_dokter?: string;
}

const G = "#2e7d32";
const ITEMS_PER_PAGE_OPTIONS = [5, 10, 15];
const API = "http://127.0.0.1:8000/api";

const statusConfig: Record<StatusJadwal, { bg: string; color: string; border: string }> = {
  Aktif: { bg: "#e8f5e9", color: G,        border: "#a5d6a7" },
  Libur: { bg: "#fff8e1", color: "#e65100", border: "#ffcc80" },
};

function formatTanggal(dateStr: string) {
  if (!dateStr) return { short: "—", full: "—", hari: "—" };
  const d = new Date(dateStr + "T00:00:00");
  return {
    short: d.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" }),
    full:  d.toLocaleDateString("id-ID", { day: "numeric", month: "long",  year: "numeric" }),
    hari:  d.toLocaleDateString("id-ID", { weekday: "long" }),
  };
}

function isToday(dateStr: string) {
  return dateStr === new Date().toISOString().split("T")[0];
}

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "10px 12px", borderRadius: 8,
  border: "1.5px solid #e0e0e0", fontSize: 14, fontFamily: "inherit",
  outline: "none", boxSizing: "border-box", background: "#fff", color: "#333",
};

function SummaryCard({ emoji, label, value, sub, accent }: { emoji: string; label: string; value: number; sub: string; accent: string }) {
  return (
    <div style={{ background: "#fff", border: "1.5px solid #e0e0e0", borderRadius: 14, padding: "20px", display: "flex", alignItems: "center", gap: 16, boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
      <div style={{ width: 48, height: 48, borderRadius: "50%", background: accent, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.4rem", flexShrink: 0 }}>{emoji}</div>
      <div>
        <div style={{ fontSize: 12, color: "#888", fontWeight: 600, marginBottom: 2 }}>{label}</div>
        <div style={{ fontSize: 24, fontWeight: 700, color: "#1a1a1a", lineHeight: 1.1 }}>{value}</div>
        <div style={{ fontSize: 12, color: "#aaa", marginTop: 2 }}>{sub}</div>
      </div>
    </div>
  );
}

export default function KelolaJadwalAdmin() {
  const [jadwal,       setJadwal]       = useState<JadwalDokter[]>([]);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [currentPage,  setCurrentPage]  = useState(1);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState("");
  const [search,       setSearch]       = useState("");

  const token = typeof window !== "undefined" ? sessionStorage.getItem("token") : null;
  const headers = { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" };

  useEffect(() => {
    fetch(`${API}/admin/jadwal`, { headers })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setJadwal(data.data.map((j: any) => ({
            id:          j.id,
            tanggal:     j.tanggal,
            jamMulai:    j.jam_mulai   ?? "",
            jamSelesai:  j.jam_selesai ?? "",
            status:      j.status,
            hari:        j.hari,
            durasi:      j.durasi,
            nama_dokter: j.nama_dokter,
          })));
        }
        setLoading(false);
      })
      .catch(() => { setError("Gagal memuat jadwal"); setLoading(false); });
  }, []);

  // Filter by search
  const filtered = jadwal.filter(j =>
    j.nama_dokter?.toLowerCase().includes(search.toLowerCase()) ||
    j.tanggal.includes(search)
  );

  const sorted     = [...filtered].sort((a, b) => a.tanggal.localeCompare(b.tanggal));
  const totalPages = Math.max(1, Math.ceil(sorted.length / itemsPerPage));
  const paginated  = sorted.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const pageBtn = (label: React.ReactNode, onClick: () => void, disabled: boolean, active = false) => (
    <button onClick={onClick} disabled={disabled}
      style={{ minWidth: 36, height: 36, padding: "0 10px", borderRadius: 8, border: active ? "none" : "1.5px solid #e0e0e0", background: active ? G : "#fff", color: active ? "#fff" : "#555", fontWeight: active ? 700 : 600, fontSize: 13, cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.4 : 1, fontFamily: "inherit", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 4 }}
    >{label}</button>
  );

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden" }}>
      <Sidebar activePage="jadwal" />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "auto", background: "#f9f9f9" }}>
        <Header title="Kelola Jadwal Dokter" subtitle="Lihat jadwal pemeriksaan semua dokter" notifCount={3} />
        <div style={{ padding: "24px 28px" }}>

          {error && (
            <div style={{ background: "#ffebee", border: "1px solid #ffcdd2", borderRadius: 8, padding: "10px 14px", marginBottom: 16, fontSize: 13, color: "#c62828" }}>
              {error}
            </div>
          )}

          {/* Summary Cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 24 }}>
            <SummaryCard emoji="📅" label="Total Jadwal" value={jadwal.length}                                   sub="Jadwal terdaftar" accent="#e8f5e9" />
            <SummaryCard emoji="✅" label="Hari Aktif"   value={jadwal.filter(j => j.status === "Aktif").length} sub="Siap praktik"     accent="#e8f5e9" />
            <SummaryCard emoji="🏖️" label="Hari Libur"  value={jadwal.filter(j => j.status === "Libur").length} sub="Tidak praktik"    accent="#fff8e1" />
          </div>

          {/* Search */}
          <div style={{ marginBottom: 16 }}>
            <input
              type="text"
              placeholder="Cari nama dokter atau tanggal..."
              value={search}
              onChange={e => { setSearch(e.target.value); setCurrentPage(1); }}
              style={{ ...inputStyle, width: 300, padding: "9px 14px" }}
            />
          </div>

          {/* Table */}
          <div style={{ background: "#fff", border: "1.5px solid #e0e0e0", borderRadius: 14, overflow: "hidden", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
            {loading ? (
              <div style={{ padding: 40, textAlign: "center", color: "#888" }}>Memuat jadwal...</div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ background: G }}>
                      {["Dokter", "Tanggal", "Hari", "Jam Mulai", "Jam Selesai", "Durasi", "Status"].map(h => (
                        <th key={h} style={{ padding: "12px 20px", fontSize: 13, fontWeight: 700, color: "#fff", textAlign: "left", whiteSpace: "nowrap", fontFamily: "inherit" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {paginated.length === 0 ? (
                      <tr><td colSpan={7} style={{ padding: 32, textAlign: "center", color: "#aaa", fontSize: 14 }}>Belum ada jadwal tersedia.</td></tr>
                    ) : paginated.map(j => {
                      const tgl   = formatTanggal(j.tanggal);
                      const today = isToday(j.tanggal);
                      const st    = statusConfig[j.status];

                      let durasi = "—";
                      if (j.durasi) {
                        durasi = `${Math.floor(j.durasi / 60)} jam${j.durasi % 60 ? ` ${j.durasi % 60} mnt` : ""}`;
                      }

                      return (
                        <tr key={j.id}
                          style={{ background: today ? "#f1f8f2" : "transparent", borderBottom: "1px solid #f0f0f0" }}
                          onMouseEnter={e => { if (!today) (e.currentTarget as HTMLTableRowElement).style.background = "#f9f9f9"; }}
                          onMouseLeave={e => { (e.currentTarget as HTMLTableRowElement).style.background = today ? "#f1f8f2" : "transparent"; }}
                        >
                          {/* Nama Dokter */}
                          <td style={{ padding: "12px 20px" }}>
                            <div style={{ fontWeight: 600, fontSize: 13, color: "#1a1a1a" }}>{j.nama_dokter ?? "-"}</div>
                          </td>

                          {/* Tanggal */}
                          <td style={{ padding: "12px 20px" }}>
                            <div style={{ fontWeight: 700, fontSize: 13 }}>
                              {tgl.short}
                              {today && <span style={{ display: "inline-block", marginLeft: 6, fontSize: 10, fontWeight: 700, background: G, color: "#fff", borderRadius: 10, padding: "1px 7px", verticalAlign: "middle" }}>Hari ini</span>}
                            </div>
                          </td>

                          {/* Hari */}
                          <td style={{ padding: "12px 20px", fontSize: 14, color: "#555" }}>{j.hari ?? tgl.hari}</td>

                          {/* Jam Mulai */}
                          <td style={{ padding: "12px 20px" }}>
                            {j.status === "Aktif" && j.jamMulai
                              ? <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 14, fontWeight: 600 }}><Clock size={13} color={G} /> {j.jamMulai}</span>
                              : <span style={{ color: "#ccc", fontSize: 14 }}>—</span>}
                          </td>

                          {/* Jam Selesai */}
                          <td style={{ padding: "12px 20px" }}>
                            {j.status === "Aktif" && j.jamSelesai
                              ? <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 14, fontWeight: 600 }}><Clock size={13} color="#888" /> {j.jamSelesai}</span>
                              : <span style={{ color: "#ccc", fontSize: 14 }}>—</span>}
                          </td>

                          {/* Durasi */}
                          <td style={{ padding: "12px 20px", fontSize: 13, color: "#777" }}>{durasi}</td>

                          {/* Status */}
                          <td style={{ padding: "12px 20px" }}>
                            <span style={{ padding: "5px 12px", borderRadius: 20, border: `1.5px solid ${st.border}`, background: st.bg, color: st.color, fontSize: 12, fontWeight: 700 }}>
                              {j.status}
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
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 20px", borderTop: "1.5px solid #e0e0e0", flexWrap: "wrap", gap: 8 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#888" }}>
                <span>Tampilkan</span>
                <select value={itemsPerPage} onChange={e => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                  style={{ padding: "6px 10px", borderRadius: 8, border: "1.5px solid #e0e0e0", fontSize: 13, fontFamily: "inherit", outline: "none", background: "#fff", cursor: "pointer" }}
                >
                  {ITEMS_PER_PAGE_OPTIONS.map(n => <option key={n} value={n}>{n}</option>)}
                </select>
                <span>baris per halaman</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                {pageBtn(<><ChevronLeft size={13} /> Sebelumnya</>, () => setCurrentPage(p => p - 1), currentPage === 1)}
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                  <button key={p} onClick={() => setCurrentPage(p)}
                    style={{ minWidth: 36, height: 36, padding: "0 10px", borderRadius: 8, border: p === currentPage ? "none" : "1.5px solid #e0e0e0", background: p === currentPage ? G : "#fff", color: p === currentPage ? "#fff" : "#555", fontWeight: p === currentPage ? 700 : 600, fontSize: 13, cursor: "pointer", fontFamily: "inherit", display: "inline-flex", alignItems: "center", justifyContent: "center" }}
                  >{p}</button>
                ))}
                {pageBtn(<>Berikutnya <ChevronRight size={13} /></>, () => setCurrentPage(p => p + 1), currentPage === totalPages)}
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}