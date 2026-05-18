"use client";

import { useEffect, useState } from "react";
import Sidebar from "@/components/Sidebar_dokter";
import Header from "@/components/Header";
import { Plus, Pencil, ChevronLeft, ChevronRight, Clock } from "lucide-react";

type StatusJadwal = "Aktif" | "Libur";

interface JadwalDokter {
  id: number;
  tanggal: string;
  jamMulai: string;
  jamSelesai: string;
  status: StatusJadwal;
  hari?: string;
  durasi?: number | null;
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

const labelStyle: React.CSSProperties = {
  fontWeight: 600, fontSize: 14, display: "block", marginBottom: 6,
};

function JadwalModal({ open, onClose, onSave, existing }: {
  open: boolean;
  onClose: () => void;
  onSave: (data: Omit<JadwalDokter, "id">) => void;
  existing?: JadwalDokter | null;
}) {
  const todayStr = new Date().toISOString().split("T")[0];
  const [tanggal,    setTanggal]    = useState(existing?.tanggal    ?? todayStr);
  const [jamMulai,   setJamMulai]   = useState(existing?.jamMulai   ?? "09:00");
  const [jamSelesai, setJamSelesai] = useState(existing?.jamSelesai ?? "17:00");
  const [status,     setStatus]     = useState<StatusJadwal>(existing?.status ?? "Aktif");

  useEffect(() => {
    if (existing) {
      setTanggal(existing.tanggal);
      setJamMulai(existing.jamMulai   || "09:00");
      setJamSelesai(existing.jamSelesai || "17:00");
      setStatus(existing.status);
    } else {
      setTanggal(todayStr);
      setJamMulai("09:00");
      setJamSelesai("17:00");
      setStatus("Aktif");
    }
  }, [existing, open]);

  if (!open) return null;

  const tgl = formatTanggal(tanggal);

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.35)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 999 }}>
      <div onClick={e => e.stopPropagation()} style={{ background: "#fff", borderRadius: 16, padding: "28px 32px", width: 460, maxWidth: "calc(100vw - 32px)", boxShadow: "0 8px 32px rgba(0,0,0,0.18)", fontFamily: "inherit" }}>
        <h2 style={{ fontWeight: 700, fontSize: 18, marginBottom: 20 }}>
          {existing ? "Edit Jadwal" : "Tambah Jadwal Baru"}
        </h2>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <label style={labelStyle}>Tanggal</label>
            <input type="date" value={tanggal} min={todayStr} onChange={e => setTanggal(e.target.value)} style={inputStyle} />
            {tanggal && <div style={{ fontSize: 12, color: G, marginTop: 5, fontWeight: 600 }}>{tgl.hari}, {tgl.full}</div>}
          </div>
          <div>
            <label style={labelStyle}>Status</label>
            <select value={status} onChange={e => setStatus(e.target.value as StatusJadwal)} style={inputStyle}>
              <option value="Aktif">Aktif</option>
              <option value="Libur">Libur</option>
            </select>
          </div>
          {status === "Aktif" && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <label style={labelStyle}>Jam Mulai</label>
                <input type="time" value={jamMulai} onChange={e => setJamMulai(e.target.value)} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Jam Selesai</label>
                <input type="time" value={jamSelesai} onChange={e => setJamSelesai(e.target.value)} style={inputStyle} />
              </div>
            </div>
          )}
        </div>
        <div style={{ display: "flex", gap: 12, justifyContent: "flex-end", marginTop: 24 }}>
          <button onClick={onClose} style={{ padding: "10px 26px", borderRadius: 8, border: `1.5px solid ${G}`, background: "#fff", color: G, fontWeight: 700, fontSize: 14, cursor: "pointer", fontFamily: "inherit" }}>Batal</button>
          <button
            onClick={() => { onSave({ tanggal, jamMulai: status === "Aktif" ? jamMulai : "", jamSelesai: status === "Aktif" ? jamSelesai : "", status }); onClose(); }}
            disabled={!tanggal}
            style={{ padding: "10px 26px", borderRadius: 8, border: "none", background: tanggal ? G : "#a5d6a7", color: "#fff", fontWeight: 700, fontSize: 14, cursor: tanggal ? "pointer" : "not-allowed", fontFamily: "inherit" }}
          >Simpan</button>
        </div>
      </div>
    </div>
  );
}

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

export default function KelolaJadwalDokter() {
  const [jadwal,       setJadwal]       = useState<JadwalDokter[]>([]);
  const [modalOpen,    setModalOpen]    = useState(false);
  const [editTarget,   setEditTarget]   = useState<JadwalDokter | null>(null);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [currentPage,  setCurrentPage]  = useState(1);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState("");

  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const headers = { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" };

  // Fetch jadwal dari API
  useEffect(() => {
    fetch(`${API}/dokter/jadwal`, { headers })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setJadwal(data.data.map((j: any) => ({
            id:        j.id,
            tanggal:   j.tanggal,
            jamMulai:  j.jam_mulai   ?? "",
            jamSelesai:j.jam_selesai ?? "",
            status:    j.status,
            hari:      j.hari,
            durasi:    j.durasi,
          })));
        }
        setLoading(false);
      })
      .catch(() => { setError("Gagal memuat jadwal"); setLoading(false); });
  }, []);

  const openAdd  = () => { setEditTarget(null); setModalOpen(true); };
  const openEdit = (j: JadwalDokter) => { setEditTarget(j); setModalOpen(true); };

  const handleSave = async (data: Omit<JadwalDokter, "id">) => {
    const isEdit = !!editTarget;
    const url    = isEdit ? `${API}/dokter/jadwal/${editTarget!.id}` : `${API}/dokter/jadwal`;
    const method = isEdit ? "PUT" : "POST";

    try {
      const res = await fetch(url, {
        method,
        headers,
        body: JSON.stringify({
          tanggal:     data.tanggal,
          jam_mulai:   data.jamMulai   || null,
          jam_selesai: data.jamSelesai || null,
          status:      data.status,
        }),
      });
      const result = await res.json();
      if (result.success) {
        const j = result.data;
        const formatted: JadwalDokter = {
          id:         j.id,
          tanggal:    j.tanggal,
          jamMulai:   j.jam_mulai   ?? "",
          jamSelesai: j.jam_selesai ?? "",
          status:     j.status,
          hari:       j.hari,
          durasi:     j.durasi,
        };
        if (isEdit) {
          setJadwal(prev => prev.map(jj => jj.id === editTarget!.id ? formatted : jj));
        } else {
          setJadwal(prev => [...prev, formatted]);
        }
      } else {
        setError(result.message || "Gagal menyimpan jadwal");
      }
    } catch {
      setError("Terjadi kesalahan");
    }
  };

  const updateStatus = async (id: number, status: StatusJadwal) => {
    try {
      const res = await fetch(`${API}/dokter/jadwal/${id}/status`, {
        method: "PATCH",
        headers,
        body: JSON.stringify({ status }),
      });
      const result = await res.json();
      if (result.success) {
        const j = result.data;
        setJadwal(prev => prev.map(jj => jj.id === id ? {
          ...jj,
          status:     j.status,
          jamMulai:   j.jam_mulai   ?? "",
          jamSelesai: j.jam_selesai ?? "",
          durasi:     j.durasi,
        } : jj));
      }
    } catch {
      setError("Gagal update status");
    }
  };

  const sorted     = [...jadwal].sort((a, b) => a.tanggal.localeCompare(b.tanggal));
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
        <Header title="Kelola Jadwal Dokter" subtitle="Atur ketersediaan jadwal pemeriksaan di klinik" notifCount={3} />
        <div style={{ padding: "24px 28px" }}>

          {error && (
            <div style={{ background: "#ffebee", border: "1px solid #ffcdd2", borderRadius: 8, padding: "10px 14px", marginBottom: 16, fontSize: 13, color: "#c62828" }}>
              {error}
            </div>
          )}

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 24 }}>
            <SummaryCard emoji="📅" label="Total Jadwal" value={jadwal.length}                                   sub="Jadwal terdaftar" accent="#e8f5e9" />
            <SummaryCard emoji="✅" label="Hari Aktif"   value={jadwal.filter(j => j.status === "Aktif").length} sub="Siap praktik"     accent="#e8f5e9" />
            <SummaryCard emoji="🏖️" label="Hari Libur"  value={jadwal.filter(j => j.status === "Libur").length} sub="Tidak praktik"    accent="#fff8e1" />
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 16 }}>
            <button onClick={openAdd} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "10px 20px", borderRadius: 8, border: `2px solid ${G}`, background: G, color: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer", fontFamily: "inherit" }}>
              <Plus size={15} /> Tambah Jadwal
            </button>
          </div>

          <div style={{ background: "#fff", border: "1.5px solid #e0e0e0", borderRadius: 14, overflow: "hidden", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
            {loading ? (
              <div style={{ padding: 40, textAlign: "center", color: "#888" }}>Memuat jadwal...</div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ background: G }}>
                      {["Tanggal", "Hari", "Jam Mulai", "Jam Selesai", "Durasi", "Status", "Aksi"].map(h => (
                        <th key={h} style={{ padding: "12px 20px", fontSize: 13, fontWeight: 700, color: "#fff", textAlign: "left", whiteSpace: "nowrap", fontFamily: "inherit" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {paginated.length === 0 ? (
                      <tr><td colSpan={7} style={{ padding: 32, textAlign: "center", color: "#aaa", fontSize: 14 }}>Belum ada jadwal. Klik "Tambah Jadwal" untuk menambahkan.</td></tr>
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
                          <td style={{ padding: "12px 20px" }}>
                            <div style={{ fontWeight: 700, fontSize: 13 }}>
                              {tgl.short}
                              {today && <span style={{ display: "inline-block", marginLeft: 6, fontSize: 10, fontWeight: 700, background: G, color: "#fff", borderRadius: 10, padding: "1px 7px", verticalAlign: "middle" }}>Hari ini</span>}
                            </div>
                          </td>
                          <td style={{ padding: "12px 20px", fontSize: 14, color: "#555" }}>{j.hari ?? tgl.hari}</td>
                          <td style={{ padding: "12px 20px" }}>
                            {j.status === "Aktif" && j.jamMulai
                              ? <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 14, fontWeight: 600 }}><Clock size={13} color={G} /> {j.jamMulai}</span>
                              : <span style={{ color: "#ccc", fontSize: 14 }}>—</span>}
                          </td>
                          <td style={{ padding: "12px 20px" }}>
                            {j.status === "Aktif" && j.jamSelesai
                              ? <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 14, fontWeight: 600 }}><Clock size={13} color="#888" /> {j.jamSelesai}</span>
                              : <span style={{ color: "#ccc", fontSize: 14 }}>—</span>}
                          </td>
                          <td style={{ padding: "12px 20px", fontSize: 13, color: "#777" }}>{durasi}</td>
                          <td style={{ padding: "12px 20px" }}>
                            <select value={j.status} onChange={e => updateStatus(j.id, e.target.value as StatusJadwal)}
                              style={{ padding: "5px 28px 5px 10px", borderRadius: 20, border: `1.5px solid ${st.border}`, background: st.bg, color: st.color, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", outline: "none", appearance: "none", WebkitAppearance: "none" }}
                            >
                              <option value="Aktif">Aktif</option>
                              <option value="Libur">Libur</option>
                            </select>
                          </td>
                          <td style={{ padding: "12px 20px" }}>
                            <button onClick={() => openEdit(j)}
                              style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "8px 14px", borderRadius: 8, border: `1.5px solid ${G}`, background: "#fff", color: G, fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}
                              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = G; (e.currentTarget as HTMLButtonElement).style.color = "#fff"; }}
                              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "#fff"; (e.currentTarget as HTMLButtonElement).style.color = G; }}
                            >
                              <Pencil size={12} /> Edit
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

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
      <JadwalModal open={modalOpen} onClose={() => setModalOpen(false)} onSave={handleSave} existing={editTarget} />
    </div>
  );
}