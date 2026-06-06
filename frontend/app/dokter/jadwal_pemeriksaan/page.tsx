"use client";

import { useEffect, useState } from "react";
import Sidebar from "@/components/Sidebar_dokter";
import Header from "@/components/Header";
import { Plus, Pencil, Trash2, X, ChevronLeft, ChevronRight, Clock, CalendarDays, CheckCircle, Ban } from "lucide-react";

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
const ITEMS_PER_PAGE = 10;
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
  width: "100%", padding: "8px 10px", border: "1px solid #e0e0e0",
  borderRadius: 8, fontSize: 13, fontFamily: "inherit",
  outline: "none", boxSizing: "border-box", background: "#fff", color: "#333",
};

const card: React.CSSProperties = {
  background: "#fff", border: "1px solid #e8e8e8",
  borderRadius: 10, padding: 16, marginBottom: 16,
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
  alignItems: "center", justifyContent: "center", gap: 4,
});

const modalLabelStyle: React.CSSProperties = {
  display: "block", fontSize: 12, fontWeight: 500, color: "#666", marginBottom: 6,
};

const modalInputStyle: React.CSSProperties = {
  width: "100%", padding: "8px 12px", border: "1px solid #d1d5db",
  borderRadius: 8, fontSize: 13, fontFamily: "inherit",
  outline: "none", background: "#fff", boxSizing: "border-box", color: "#333",
};

// ── Modal Tambah/Edit ─────────────────────────────────────────────────────────

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
      <div onClick={e => e.stopPropagation()} style={{ background: "#fff", borderRadius: 12, width: 460, maxWidth: "calc(100vw - 32px)", boxShadow: "0 8px 32px rgba(0,0,0,0.18)", fontFamily: "inherit" }}>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", borderBottom: "1px solid #f0f0f0" }}>
          <span style={{ fontSize: 15, fontWeight: 600, color: "#1a1a1a" }}>
            {existing ? "Edit Jadwal" : "Tambah Jadwal Baru"}
          </span>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#888", display: "flex" }}>
            <X size={18} />
          </button>
        </div>

        <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <label style={modalLabelStyle}>Tanggal</label>
            <input type="date" value={tanggal} min={todayStr} onChange={e => setTanggal(e.target.value)} style={modalInputStyle} />
            {tanggal && <div style={{ fontSize: 12, color: G, marginTop: 5 }}>{tgl.hari}, {tgl.full}</div>}
          </div>
          <div>
            <label style={modalLabelStyle}>Status</label>
            <select value={status} onChange={e => setStatus(e.target.value as StatusJadwal)} style={modalInputStyle}>
              <option value="Aktif">Aktif</option>
              <option value="Libur">Libur</option>
            </select>
          </div>
          {status === "Aktif" && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <label style={modalLabelStyle}>Jam Mulai</label>
                <input type="time" value={jamMulai} onChange={e => setJamMulai(e.target.value)} style={modalInputStyle} />
              </div>
              <div>
                <label style={modalLabelStyle}>Jam Selesai</label>
                <input type="time" value={jamSelesai} onChange={e => setJamSelesai(e.target.value)} style={modalInputStyle} />
              </div>
            </div>
          )}
        </div>

        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", padding: "14px 20px", borderTop: "1px solid #f0f0f0" }}>
          <button onClick={onClose} style={{ padding: "7px 18px", borderRadius: 8, border: "1px solid #d1d5db", background: "#fff", color: "#555", fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>
            Batal
          </button>
          <button
            onClick={() => { onSave({ tanggal, jamMulai: status === "Aktif" ? jamMulai : "", jamSelesai: status === "Aktif" ? jamSelesai : "", status }); onClose(); }}
            disabled={!tanggal}
            style={{ padding: "7px 18px", borderRadius: 8, border: "none", background: tanggal ? G : "#a5d6a7", color: "#fff", fontSize: 13, fontWeight: 500, cursor: tanggal ? "pointer" : "not-allowed", fontFamily: "inherit" }}
          >
            Simpan
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Modal Konfirmasi Hapus ────────────────────────────────────────────────────

function DeleteModal({ tanggal, onConfirm, onCancel, deleting }: {
  tanggal: string; onConfirm: () => void; onCancel: () => void; deleting: boolean;
}) {
  const tgl = formatTanggal(tanggal);
  return (
    <div onClick={onCancel} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.35)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 999 }}>
      <div onClick={e => e.stopPropagation()} style={{ background: "#fff", borderRadius: 16, padding: "28px", width: 360, boxShadow: "0 8px 32px rgba(0,0,0,0.18)", fontFamily: "'Inter', sans-serif" }}>
        <div style={{ width: 48, height: 48, borderRadius: "50%", background: "#fff5f5", border: "1.5px solid #fecaca", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
          <Trash2 size={20} color="#dc2626" />
        </div>
        <h3 style={{ margin: "0 0 6px", fontSize: 16, fontWeight: 700, color: "#111" }}>Hapus Jadwal?</h3>
        <p style={{ margin: "0 0 22px", fontSize: 13, color: "#888", lineHeight: 1.55 }}>
          Jadwal tanggal <strong>{tgl.hari}, {tgl.full}</strong> akan dihapus permanen dan tidak bisa dikembalikan.
        </p>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={onCancel} style={{ flex: 1, padding: "10px", borderRadius: 10, border: "1.5px solid #e0e0e0", background: "#fff", fontSize: 13, fontWeight: 600, color: "#555", cursor: "pointer", fontFamily: "inherit" }}>
            Batal
          </button>
          <button onClick={onConfirm} disabled={deleting} style={{ flex: 1, padding: "10px", borderRadius: 10, border: "none", background: deleting ? "#ccc" : "#dc2626", fontSize: 13, fontWeight: 600, color: "#fff", cursor: deleting ? "not-allowed" : "pointer", fontFamily: "inherit" }}>
            {deleting ? "Menghapus..." : "Ya, Hapus"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function KelolaJadwalDokter() {
  const [jadwal,       setJadwal]       = useState<JadwalDokter[]>([]);
  const [modalOpen,    setModalOpen]    = useState(false);
  const [editTarget,   setEditTarget]   = useState<JadwalDokter | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<JadwalDokter | null>(null);
  const [deleting,     setDeleting]     = useState(false);
  const [currentPage,  setCurrentPage]  = useState(1);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState("");

  const token   = typeof window !== "undefined" ? sessionStorage.getItem("token") : null;
  const headers = { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" };

  useEffect(() => {
    fetch(`${API}/dokter/jadwal`, { headers })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setJadwal(data.data.map((j: any) => ({
            id:         j.id,
            tanggal:    j.tanggal,
            jamMulai:   j.jam_mulai   ?? "",
            jamSelesai: j.jam_selesai ?? "",
            status:     j.status,
            hari:       j.hari,
            durasi:     j.durasi,
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
      const res    = await fetch(url, { method, headers, body: JSON.stringify({ tanggal: data.tanggal, jam_mulai: data.jamMulai || null, jam_selesai: data.jamSelesai || null, status: data.status }) });
      const result = await res.json();
      if (result.success) {
        const j = result.data;
        const formatted: JadwalDokter = { id: j.id, tanggal: j.tanggal, jamMulai: j.jam_mulai ?? "", jamSelesai: j.jam_selesai ?? "", status: j.status, hari: j.hari, durasi: j.durasi };
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

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res  = await fetch(`${API}/dokter/jadwal/${deleteTarget.id}`, { method: "DELETE", headers });
      const data = await res.json();
      if (data.success) {
        setJadwal(prev => prev.filter(j => j.id !== deleteTarget.id));
        setDeleteTarget(null);
      } else {
        setError(data.message ?? "Gagal menghapus jadwal.");
      }
    } catch {
      setError("Gagal terhubung ke server.");
    } finally {
      setDeleting(false);
    }
  };

  const updateStatus = async (id: number, status: StatusJadwal) => {
    try {
      const res    = await fetch(`${API}/dokter/jadwal/${id}/status`, { method: "PATCH", headers, body: JSON.stringify({ status }) });
      const result = await res.json();
      if (result.success) {
        const j = result.data;
        setJadwal(prev => prev.map(jj => jj.id === id ? { ...jj, status: j.status, jamMulai: j.jam_mulai ?? "", jamSelesai: j.jam_selesai ?? "", durasi: j.durasi } : jj));
      }
    } catch {
      setError("Gagal update status");
    }
  };

  const sorted     = [...jadwal].sort((a, b) => b.tanggal.localeCompare(a.tanggal));
  const totalPages = Math.max(1, Math.ceil(sorted.length / ITEMS_PER_PAGE));
  const paginated  = sorted.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const stats = [
    { label: "Total Jadwal", value: jadwal.length,                                   sub: "Jadwal terdaftar", bg: "#fff",    labelColor: "#888",   valColor: "#1a1a1a", icon: <CalendarDays size={20} color={G} />,       iconBg: "#e8f5e9" },
    { label: "Hari Aktif",   value: jadwal.filter(j => j.status === "Aktif").length, sub: "Siap praktik",    bg: "#e8f5e9", labelColor: G,         valColor: "#1b5e20", icon: <CheckCircle  size={20} color={G} />,       iconBg: "#c8e6c9" },
    { label: "Hari Libur",   value: jadwal.filter(j => j.status === "Libur").length, sub: "Tidak praktik",   bg: "#fff8e1", labelColor: "#e65100", valColor: "#bf360c", icon: <Ban          size={20} color="#e65100" />, iconBg: "#ffe0b2" },
  ];

  return (
    <div style={{ display: "flex", height: "100vh", fontFamily: "'Inter', sans-serif" }}>
      <Sidebar activePage="jadwal" />

      {/* Modals */}
      <JadwalModal open={modalOpen} onClose={() => setModalOpen(false)} onSave={handleSave} existing={editTarget} />
      {deleteTarget && (
        <DeleteModal
          tanggal={deleteTarget.tanggal}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
          deleting={deleting}
        />
      )}

      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <Header title="Kelola Jadwal" subtitle="Atur ketersediaan jadwal pemeriksaan di klinik" />

        <main style={{ flex: 1, overflowY: "auto", background: "#f5f7f5", padding: 24 }}>

          {error && (
            <div style={{ background: "#ffebee", border: "1px solid #ffcdd2", borderRadius: 8, padding: "10px 14px", marginBottom: 16, fontSize: 13, color: "#c62828" }}>
              {error}
              <button onClick={() => setError("")} style={{ marginLeft: 12, background: "none", border: "none", color: "#c62828", cursor: "pointer", fontSize: 13 }}>✕</button>
            </div>
          )}

          {/* Summary Cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 20 }}>
            {stats.map(stat => (
              <div key={stat.label} style={{ background: stat.bg, border: "1px solid #e8e8e8", borderRadius: 10, padding: "16px 20px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: stat.iconBg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    {stat.icon}
                  </div>
                  <div>
                    <p style={{ fontSize: 12, color: stat.labelColor, margin: 0, fontWeight: 500 }}>{stat.label}</p>
                    <p style={{ fontSize: 26, fontWeight: 700, color: stat.valColor, margin: "2px 0 0", lineHeight: 1.1 }}>{stat.value}</p>
                    <p style={{ fontSize: 11, color: "#aaa", margin: "2px 0 0" }}>{stat.sub}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Toolbar */}
          <div style={{ ...card, display: "flex", justifyContent: "flex-end" }}>
            <button onClick={openAdd}
              style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 8, border: "none", background: G, color: "#fff", fontSize: 13, fontWeight: 500, cursor: "pointer", fontFamily: "inherit" }}>
              <Plus size={15} /> Tambah Jadwal
            </button>
          </div>

          {/* Table */}
          <div style={{ ...card, padding: 0, overflow: "hidden" }}>
            {loading ? (
              <div style={{ padding: 40, textAlign: "center", color: "#888", fontSize: 13 }}>Memuat jadwal...</div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ background: G }}>
                      {["Tanggal", "Hari", "Jam Mulai", "Jam Selesai", "Durasi", "Status", "Aksi"].map(h => (
                        <th key={h} style={{ padding: "11px 14px", fontSize: 12, fontWeight: 600, color: "#fff", textAlign: "left", whiteSpace: "nowrap" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {paginated.length === 0 ? (
                      <tr>
                        <td colSpan={7} style={{ padding: "2rem", textAlign: "center", color: "#999", fontSize: 13 }}>
                          Belum ada jadwal. Klik "Tambah Jadwal" untuk menambahkan.
                        </td>
                      </tr>
                    ) : paginated.map((j, idx) => {
                      const tgl   = formatTanggal(j.tanggal);
                      const today = isToday(j.tanggal);
                      const st    = statusConfig[j.status];
                      let durasi  = "—";
                      if (j.durasi) durasi = `${Math.floor(j.durasi / 60)} jam${j.durasi % 60 ? ` ${j.durasi % 60} mnt` : ""}`;

                      return (
                        <tr key={j.id}
                          style={{ background: today ? "#f1f8f2" : idx % 2 === 0 ? "#fff" : "#fafafa" }}
                          onMouseEnter={e => (e.currentTarget.style.background = "#f0faf2")}
                          onMouseLeave={e => (e.currentTarget.style.background = today ? "#f1f8f2" : idx % 2 === 0 ? "#fff" : "#fafafa")}
                        >
                          <td style={td}>
                            <span style={{ fontSize: 13 }}>
                              {tgl.short}
                              {today && <span style={{ display: "inline-block", marginLeft: 6, fontSize: 10, background: G, color: "#fff", borderRadius: 10, padding: "1px 7px", verticalAlign: "middle" }}>Hari ini</span>}
                            </span>
                          </td>
                          <td style={{ ...td, color: "#555" }}>{j.hari ?? tgl.hari}</td>
                          <td style={td}>
                            {j.status === "Aktif" && j.jamMulai
                              ? <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 13 }}><Clock size={13} color={G} />{j.jamMulai}</span>
                              : <span style={{ color: "#ccc" }}>—</span>}
                          </td>
                          <td style={td}>
                            {j.status === "Aktif" && j.jamSelesai
                              ? <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 13 }}><Clock size={13} color="#888" />{j.jamSelesai}</span>
                              : <span style={{ color: "#ccc" }}>—</span>}
                          </td>
                          <td style={{ ...td, color: "#777" }}>{durasi}</td>
                          <td style={td}>
                            <select value={j.status} onChange={e => updateStatus(j.id, e.target.value as StatusJadwal)}
                              style={{ padding: "3px 10px", borderRadius: 20, border: `1px solid ${st.border}`, background: st.bg, color: st.color, fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", outline: "none" }}>
                              <option value="Aktif">Aktif</option>
                              <option value="Libur">Libur</option>
                            </select>
                          </td>
                          <td style={td}>
                            <div style={{ display: "flex", gap: 6 }}>
                              <button onClick={() => openEdit(j)}
                                style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "4px 10px", borderRadius: 7, border: `1.5px solid ${G}`, background: "#fff", color: G, fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}
                                onMouseEnter={e => { e.currentTarget.style.background = G; e.currentTarget.style.color = "#fff"; }}
                                onMouseLeave={e => { e.currentTarget.style.background = "#fff"; e.currentTarget.style.color = G; }}
                              >
                                <Pencil size={12} /> Edit
                              </button>
                              <button onClick={() => setDeleteTarget(j)}
                                style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "4px 10px", borderRadius: 7, border: "1.5px solid #dc2626", background: "#fff", color: "#dc2626", fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}
                                onMouseEnter={e => { e.currentTarget.style.background = "#dc2626"; e.currentTarget.style.color = "#fff"; }}
                                onMouseLeave={e => { e.currentTarget.style.background = "#fff"; e.currentTarget.style.color = "#dc2626"; }}
                              >
                                <Trash2 size={12} /> Hapus
                              </button>
                            </div>
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
                <ChevronLeft size={13} /> Sebelumnya
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                <button key={p} style={pageBtn(p === currentPage)} onClick={() => setCurrentPage(p)}>{p}</button>
              ))}
              <button style={pageBtn(false)} disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)}>
                Berikutnya <ChevronRight size={13} />
              </button>
            </div>
          </div>

        </main>
      </div>
    </div>
  );
}