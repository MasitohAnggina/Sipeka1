"use client";

import { useEffect, useState } from "react";
import Sidebar from "@/components/Sidebar_admin";
import Header from "@/components/Header";
import {
  ChevronLeft, ChevronRight, Clock, CalendarDays,
  CheckCircle, Ban, Plus, Pencil, Trash2, X,
} from "lucide-react";

type StatusJadwal = "Aktif" | "Libur";

interface JadwalDokter {
  id:          number;
  tanggal:     string;
  jamMulai:    string;
  jamSelesai:  string;
  status:      StatusJadwal;
  hari?:       string;
  durasi?:     number | null;
  nama_dokter?: string;
  id_dokter?:  number;
}

interface DokterOption {
  id_dokter:   number;
  nama_dokter: string;
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
  width: "100%", padding: "8px 10px", border: "1px solid #e0e0e0",
  borderRadius: 8, fontSize: 13, fontFamily: "inherit",
  outline: "none", boxSizing: "border-box", background: "#fff", color: "#333",
};

const filterLabel: React.CSSProperties = {
  display: "block", fontSize: 12, fontWeight: 500, color: "#666", marginBottom: 6,
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

// ── Form Modal ────────────────────────────────────────────────────────────────

function JadwalModal({
  mode,
  initial,
  dokterList,
  onClose,
  onSave,
  saving,
  errorMsg,
}: {
  mode:      "tambah" | "edit";
  initial?:  JadwalDokter;
  dokterList: DokterOption[];
  onClose:   () => void;
  onSave:    (data: any) => void;
  saving:    boolean;
  errorMsg:  string;
}) {
  const [idDokter,   setIdDokter]   = useState(initial?.id_dokter ?? 0);
  const [tanggal,    setTanggal]    = useState(initial?.tanggal   ?? "");
  const [jamMulai,   setJamMulai]   = useState(initial?.jamMulai  ?? "");
  const [jamSelesai, setJamSelesai] = useState(initial?.jamSelesai ?? "");
  const [status,     setStatus]     = useState<StatusJadwal>(initial?.status ?? "Aktif");

  const handleSubmit = () => {
    onSave({ id_dokter: idDokter, tanggal, jam_mulai: jamMulai || null, jam_selesai: jamSelesai || null, status });
  };

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.35)", zIndex: 999, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div onClick={e => e.stopPropagation()} style={{ background: "#fff", borderRadius: 16, padding: "28px", width: 440, boxShadow: "0 8px 32px rgba(0,0,0,0.18)", fontFamily: "'Inter', sans-serif" }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#111" }}>
            {mode === "tambah" ? "Tambah Jadwal" : "Edit Jadwal"}
          </h3>
          <button onClick={onClose} style={{ border: "none", background: "none", cursor: "pointer", color: "#aaa" }}>
            <X size={18} />
          </button>
        </div>

        {errorMsg && (
          <div style={{ background: "#ffebee", border: "1px solid #ffcdd2", borderRadius: 8, padding: "8px 12px", marginBottom: 14, fontSize: 13, color: "#c62828" }}>
            {errorMsg}
          </div>
        )}

        {/* Form */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <label style={filterLabel}>Dokter</label>
            <select style={inputStyle} value={idDokter} onChange={e => setIdDokter(Number(e.target.value))}>
              <option value={0}>-- Pilih Dokter --</option>
              {dokterList.map(d => (
                <option key={d.id_dokter} value={d.id_dokter}>{d.nama_dokter}</option>
              ))}
            </select>
          </div>

          <div>
            <label style={filterLabel}>Tanggal</label>
            <input style={inputStyle} type="date" value={tanggal} onChange={e => setTanggal(e.target.value)} min={new Date().toISOString().split("T")[0]} />
          </div>

          <div>
            <label style={filterLabel}>Status</label>
            <select style={inputStyle} value={status} onChange={e => setStatus(e.target.value as StatusJadwal)}>
              <option value="Aktif">Aktif</option>
              <option value="Libur">Libur</option>
            </select>
          </div>

          {status === "Aktif" && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <label style={filterLabel}>Jam Mulai</label>
                <input style={inputStyle} type="time" value={jamMulai} onChange={e => setJamMulai(e.target.value)} />
              </div>
              <div>
                <label style={filterLabel}>Jam Selesai</label>
                <input style={inputStyle} type="time" value={jamSelesai} onChange={e => setJamSelesai(e.target.value)} />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 22 }}>
          <button onClick={onClose} style={{ padding: "9px 18px", borderRadius: 8, border: "1.5px solid #e0e0e0", background: "#fff", color: "#666", fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>
            Batal
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            style={{ padding: "9px 22px", borderRadius: 8, border: "none", background: saving ? "#ccc" : G, color: "#fff", fontSize: 13, fontWeight: 600, cursor: saving ? "not-allowed" : "pointer", fontFamily: "inherit" }}
          >
            {saving ? "Menyimpan..." : "Simpan"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Confirm Delete Modal ──────────────────────────────────────────────────────

function DeleteModal({ nama, onConfirm, onCancel, deleting }: {
  nama: string; onConfirm: () => void; onCancel: () => void; deleting: boolean;
}) {
  return (
    <div onClick={onCancel} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.35)", zIndex: 999, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div onClick={e => e.stopPropagation()} style={{ background: "#fff", borderRadius: 16, padding: "28px", width: 360, boxShadow: "0 8px 32px rgba(0,0,0,0.18)", fontFamily: "'Inter', sans-serif" }}>
        <div style={{ width: 48, height: 48, borderRadius: "50%", background: "#fff5f5", border: "1.5px solid #fecaca", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
          <Trash2 size={20} color="#dc2626" />
        </div>
        <h3 style={{ margin: "0 0 6px", fontSize: 16, fontWeight: 700, color: "#111" }}>Hapus Jadwal?</h3>
        <p style={{ margin: "0 0 22px", fontSize: 13, color: "#888", lineHeight: 1.55 }}>
          Jadwal dokter <strong>{nama}</strong> akan dihapus permanen dan tidak bisa dikembalikan.
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

export default function KelolaJadwalAdmin() {
  const [jadwal,       setJadwal]       = useState<JadwalDokter[]>([]);
  const [dokterList,   setDokterList]   = useState<DokterOption[]>([]);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [currentPage,  setCurrentPage]  = useState(1);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState("");
  const [search,       setSearch]       = useState("");

  const [modalMode,    setModalMode]    = useState<"tambah" | "edit" | null>(null);
  const [editTarget,   setEditTarget]   = useState<JadwalDokter | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<JadwalDokter | null>(null);
  const [saving,       setSaving]       = useState(false);
  const [deleting,     setDeleting]     = useState(false);
  const [formError,    setFormError]    = useState("");

  const token   = typeof window !== "undefined" ? sessionStorage.getItem("token") : null;
  const headers = { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" };

  const mapJadwal = (j: any): JadwalDokter => ({
    id:          j.id,
    tanggal:     j.tanggal,
    jamMulai:    j.jam_mulai   ?? "",
    jamSelesai:  j.jam_selesai ?? "",
    status:      j.status,
    hari:        j.hari,
    durasi:      j.durasi,
    nama_dokter: j.nama_dokter,
    id_dokter:   j.id_dokter,
  });

  useEffect(() => {
    Promise.all([
      fetch(`${API}/admin/jadwal`,      { headers }).then(r => r.json()),
      fetch(`${API}/admin/dokter-list`, { headers }).then(r => r.json()),
    ]).then(([dataJadwal, dataDokter]) => {
      if (dataJadwal.success) setJadwal(dataJadwal.data.map(mapJadwal));
      if (dataDokter.success) setDokterList(dataDokter.data);
      setLoading(false);
    }).catch(() => { setError("Gagal memuat data"); setLoading(false); });
  }, []);

  const handleSave = async (formData: any) => {
    if (!formData.id_dokter) { setFormError("Pilih dokter terlebih dahulu."); return; }
    if (!formData.tanggal)   { setFormError("Tanggal wajib diisi."); return; }
    if (formData.status === "Aktif" && (!formData.jam_mulai || !formData.jam_selesai)) {
      setFormError("Jam mulai dan jam selesai wajib diisi jika status Aktif."); return;
    }

    setSaving(true);
    setFormError("");

    const isEdit = modalMode === "edit" && editTarget;
    const url    = isEdit ? `${API}/admin/jadwal/${editTarget.id}` : `${API}/admin/jadwal`;
    const method = isEdit ? "PUT" : "POST";

    try {
      const res  = await fetch(url, { method, headers, body: JSON.stringify(formData) });
      const data = await res.json();

      if (data.success) {
        if (isEdit) {
          setJadwal(prev => prev.map(j => j.id === editTarget.id ? mapJadwal(data.data) : j));
        } else {
          setJadwal(prev => [mapJadwal(data.data), ...prev]);
        }
        setModalMode(null);
        setEditTarget(null);
      } else {
        setFormError(data.message ?? "Gagal menyimpan jadwal.");
      }
    } catch {
      setFormError("Gagal terhubung ke server.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res  = await fetch(`${API}/admin/jadwal/${deleteTarget.id}`, { method: "DELETE", headers });
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

  const filtered = jadwal.filter(j =>
    j.nama_dokter?.toLowerCase().includes(search.toLowerCase()) ||
    j.tanggal.includes(search)
  );

  const sorted     = [...filtered].sort((a, b) => b.tanggal.localeCompare(a.tanggal));
  const totalPages = Math.max(1, Math.ceil(sorted.length / itemsPerPage));
  const paginated  = sorted.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  useEffect(() => { setCurrentPage(1); }, [search, itemsPerPage]);

  const stats = [
    { label: "Total Jadwal", value: jadwal.length,                                   sub: "Jadwal terdaftar", bg: "#fff",    labelColor: "#888",    valColor: "#1a1a1a", icon: <CalendarDays size={20} color={G} />,         iconBg: "#e8f5e9" },
    { label: "Hari Aktif",   value: jadwal.filter(j => j.status === "Aktif").length, sub: "Siap praktik",    bg: "#e8f5e9", labelColor: G,          valColor: "#1b5e20", icon: <CheckCircle  size={20} color={G} />,         iconBg: "#c8e6c9" },
    { label: "Hari Libur",   value: jadwal.filter(j => j.status === "Libur").length, sub: "Tidak praktik",   bg: "#fff8e1", labelColor: "#e65100",  valColor: "#bf360c", icon: <Ban          size={20} color="#e65100" />,   iconBg: "#ffe0b2" },
  ];

  return (
    <div style={{ display: "flex", height: "100vh", fontFamily: "'Inter', sans-serif" }}>
      <Sidebar activePage="jadwal" />

      {/* Modals */}
      {(modalMode === "tambah" || modalMode === "edit") && (
        <JadwalModal
          mode={modalMode}
          initial={editTarget ?? undefined}
          dokterList={dokterList}
          onClose={() => { setModalMode(null); setEditTarget(null); setFormError(""); }}
          onSave={handleSave}
          saving={saving}
          errorMsg={formError}
        />
      )}
      {deleteTarget && (
        <DeleteModal
          nama={deleteTarget.nama_dokter ?? "-"}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
          deleting={deleting}
        />
      )}

      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <Header title="Kelola Jadwal Dokter" subtitle="Lihat dan kelola jadwal pemeriksaan semua dokter" />

        <main style={{ flex: 1, overflowY: "auto", background: "#f5f7f5", padding: 24 }}>

          {error && (
            <div style={{ background: "#ffebee", border: "1px solid #ffcdd2", borderRadius: 8, padding: "10px 14px", marginBottom: 16, fontSize: 13, color: "#c62828" }}>
              {error}
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

          {/* Filter + Tombol Tambah */}
          <div style={card}>
            <div style={{ display: "flex", alignItems: "flex-end", gap: 12 }}>
              <div style={{ flex: 1 }}>
                <label style={filterLabel}>Nama Dokter / Tanggal</label>
                <input
                  style={inputStyle}
                  placeholder="Cari nama dokter atau tanggal..."
                  value={search}
                  onChange={e => { setSearch(e.target.value); setCurrentPage(1); }}
                />
              </div>
              <button
                onClick={() => { setModalMode("tambah"); setEditTarget(null); setFormError(""); }}
                style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 8, border: "none", background: G, color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap", height: 36 }}
              >
                <Plus size={15} /> Tambah Jadwal
              </button>
            </div>
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
                      {["Dokter", "Tanggal", "Hari", "Jam Mulai", "Jam Selesai", "Durasi", "Status", "Aksi"].map(h => (
                        <th key={h} style={{ padding: "11px 14px", fontSize: 12, fontWeight: 600, color: "#fff", textAlign: "left", whiteSpace: "nowrap" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {paginated.length === 0 ? (
                      <tr>
                        <td colSpan={8} style={{ padding: "2rem", textAlign: "center", color: "#999", fontSize: 13 }}>
                          Belum ada jadwal tersedia.
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
                          <td style={td}><span style={{ fontSize: 13 }}>{j.nama_dokter ?? "-"}</span></td>
                          <td style={td}>
                            <span style={{ fontSize: 13 }}>
                              {tgl.short}
                              {today && <span style={{ display: "inline-block", marginLeft: 6, fontSize: 10, background: G, color: "#fff", borderRadius: 10, padding: "1px 7px", verticalAlign: "middle" }}>Hari ini</span>}
                            </span>
                          </td>
                          <td style={{ ...td, color: "#555" }}>{j.hari ?? tgl.hari}</td>
                          <td style={td}>
                            {j.status === "Aktif" && j.jamMulai
                              ? <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}><Clock size={13} color={G} />{j.jamMulai}</span>
                              : <span style={{ color: "#ccc" }}>—</span>}
                          </td>
                          <td style={td}>
                            {j.status === "Aktif" && j.jamSelesai
                              ? <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}><Clock size={13} color="#888" />{j.jamSelesai}</span>
                              : <span style={{ color: "#ccc" }}>—</span>}
                          </td>
                          <td style={{ ...td, color: "#777" }}>{durasi}</td>
                          <td style={td}>
                            <span style={{ display: "inline-block", padding: "3px 12px", borderRadius: 20, fontSize: 11, fontWeight: 600, background: st.bg, color: st.color, border: `1px solid ${st.border}`, whiteSpace: "nowrap" }}>
                              {j.status}
                            </span>
                          </td>
                          <td style={td}>
                            <div style={{ display: "flex", gap: 6 }}>
                              <button
                                onClick={() => { setEditTarget(j); setModalMode("edit"); setFormError(""); }}
                                style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "5px 10px", borderRadius: 7, border: `1.5px solid ${G}`, background: "#fff", color: G, fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}
                                onMouseEnter={e => { e.currentTarget.style.background = G; e.currentTarget.style.color = "#fff"; }}
                                onMouseLeave={e => { e.currentTarget.style.background = "#fff"; e.currentTarget.style.color = G; }}
                              >
                                <Pencil size={12} /> Edit
                              </button>
                              <button
                                onClick={() => setDeleteTarget(j)}
                                style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "5px 10px", borderRadius: 7, border: "1.5px solid #dc2626", background: "#fff", color: "#dc2626", fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}
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
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px", borderTop: "1px solid #f0f0f0", flexWrap: "wrap", gap: 8 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#888" }}>
                <span>Tampilkan</span>
                <select value={itemsPerPage} onChange={e => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }} style={{ padding: "5px 10px", borderRadius: 8, border: "1px solid #e0e0e0", fontSize: 13, fontFamily: "inherit", outline: "none", background: "#fff", cursor: "pointer" }}>
                  {ITEMS_PER_PAGE_OPTIONS.map(n => <option key={n} value={n}>{n}</option>)}
                </select>
                <span>baris per halaman</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
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
          </div>

        </main>
      </div>
    </div>
  );
}