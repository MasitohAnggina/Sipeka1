"use client";

import { useState, useEffect } from "react";
import { Plus, Pencil, Trash2, X } from "lucide-react";
import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar_admin";

const API_URL = "http://127.0.0.1:8000/api";

type LayananStatus   = "Aktif" | "Nonaktif";
type LayananKategori = "Medis" | "Bedah" | "Grooming" | "Rawat Inap";

// ── Sesuai response dari backend ──────────────────────────────────────────────
interface LayananAPI {
  id_layanan:   number;
  nama_layanan: string;
  kategori:     LayananKategori;
  sub_kategori: string | null;
  durasi:       number | null;
  harga:        string;
  kapasitas:    number | null;
  deskripsi:    string | null;
  status:       LayananStatus;
}

interface FormData {
  nama_layanan: string;
  kategori:     LayananKategori;
  harga:        string;
  durasi:       string;
  kapasitas:    string;
  deskripsi:    string;
  aktif:        boolean;
}

const defaultForm: FormData = {
  nama_layanan: "",
  kategori:     "Medis",
  harga:        "",
  durasi:       "",
  kapasitas:    "",
  deskripsi:    "",
  aktif:        true,
};

const statusStyle: Record<LayananStatus, { bg: string; color: string }> = {
  Aktif:    { bg: "#e8f5e9", color: "#2E7D32" },
  Nonaktif: { bg: "#ffebee", color: "#c62828" },
};

const kategoriStyle: Record<LayananKategori, { bg: string; color: string }> = {
  Medis:        { bg: "#e3f2fd", color: "#1565c0" },
  Bedah:        { bg: "#fce4ec", color: "#c62828" },
  Grooming:     { bg: "#f3e5f5", color: "#6a1b9a" },
  "Rawat Inap": { bg: "#e0f2f1", color: "#00695c" },
};

function formatHarga(harga: string | number) {
  return `Rp ${Number(harga).toLocaleString("id-ID")}`;
}

export default function DataLayananKlinikPage() {
  const [allLayanan,     setAllLayanan]     = useState<LayananAPI[]>([]);
  const [filterNama,     setFilterNama]     = useState("");
  const [filterStatus,   setFilterStatus]   = useState("");
  const [filterKategori, setFilterKategori] = useState("");
  const [loading,        setLoading]        = useState(true);
  const [error,          setError]          = useState("");
  const [submitLoading,  setSubmitLoading]  = useState(false);

  /* ── Modal state ── */
  const [showModal,  setShowModal]  = useState(false);
  const [editTarget, setEditTarget] = useState<LayananAPI | null>(null);
  const [form,       setForm]       = useState<FormData>(defaultForm);

  const token = typeof window !== "undefined" ? localStorage.getItem("token") : "";

  // ── Fetch semua layanan dari backend ────────────────────────────────────────
  async function fetchLayanan() {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      if (filterNama)     params.append("nama",     filterNama);
      if (filterStatus)   params.append("status",   filterStatus);
      if (filterKategori) params.append("kategori", filterKategori);

      const res = await fetch(`${API_URL}/layanan?${params.toString()}`, {
        headers: { "Authorization": `Bearer ${token}` },
      });

      if (!res.ok) throw new Error("Gagal memuat data layanan");
      const result = await res.json();
setAllLayanan(result.data); // ⭐ ambil ARRAY nya
    } catch {
      setError("Gagal memuat data layanan. Periksa koneksi ke server.");
    } finally {
      setLoading(false);
    }
  }

  // Fetch ulang kalau filter berubah
  useEffect(() => {
    fetchLayanan();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterNama, filterStatus, filterKategori]);

  // ── Buka modal tambah ───────────────────────────────────────────────────────
  const openTambah = () => {
    setEditTarget(null);
    setForm(defaultForm);
    setShowModal(true);
  };

  // ── Buka modal edit ─────────────────────────────────────────────────────────
  const openEdit = (l: LayananAPI) => {
    setEditTarget(l);
    setForm({
      nama_layanan: l.nama_layanan,
      kategori:     l.kategori,
      harga:        String(l.harga),
      durasi:       l.durasi    ? String(l.durasi)    : "",
      kapasitas:    l.kapasitas ? String(l.kapasitas) : "",
      deskripsi:    l.deskripsi ?? "",
      aktif:        l.status === "Aktif",
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setError("");
  };

  // ── Simpan (tambah / edit) ──────────────────────────────────────────────────
  async function handleSimpan() {
    if (!form.nama_layanan.trim()) { setError("Nama layanan wajib diisi"); return; }
    if (!form.harga)               { setError("Harga wajib diisi");         return; }

    setSubmitLoading(true);
    setError("");

    const body = {
      nama_layanan: form.nama_layanan,
      kategori:     form.kategori,
      harga:        Number(form.harga),
      durasi:       form.durasi    ? Number(form.durasi)    : null,
      kapasitas:    form.kapasitas ? Number(form.kapasitas) : null,
      deskripsi:    form.deskripsi || null,
      status:       form.aktif ? "Aktif" : "Nonaktif",
    };

    try {
      const url    = editTarget
        ? `${API_URL}/layanan/${editTarget.id_layanan}`
        : `${API_URL}/layanan`;
      const method = editTarget ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Authorization":  `Bearer ${token}`,
          "Content-Type":   "application/json",
        },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.message || "Gagal menyimpan layanan");
        return;
      }

      // Refresh data dari server
      await fetchLayanan();
      closeModal();
    } catch {
      setError("Terjadi kesalahan, coba lagi");
    } finally {
      setSubmitLoading(false);
    }
  }

  // ── Hapus layanan ───────────────────────────────────────────────────────────
  async function handleHapus(id: number) {
    if (!confirm("Yakin ingin menghapus layanan ini?")) return;

    try {
      const res = await fetch(`${API_URL}/layanan/${id}`, {
        method:  "DELETE",
        headers: { "Authorization": `Bearer ${token}` },
      });

      if (!res.ok) throw new Error();
      setAllLayanan((prev) => prev.filter((l) => l.id_layanan !== id));
    } catch {
      alert("Gagal menghapus layanan");
    }
  }

  const totalAktif    = allLayanan.filter((l) => l.status === "Aktif").length;
  const totalNonaktif = allLayanan.filter((l) => l.status === "Nonaktif").length;

  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "8px 10px", border: "1px solid #e0e0e0",
    borderRadius: "8px", fontSize: "13px", fontFamily: "inherit",
    color: "#333", background: "#fff", outline: "none", boxSizing: "border-box",
  };

  const modalInputStyle: React.CSSProperties = {
    ...inputStyle, border: "1px solid #d0d0d0", padding: "9px 12px", fontSize: "14px",
  };

  return (
    <div style={{ display: "flex", height: "100vh", fontFamily: "'Inter', sans-serif" }}>
      <Sidebar activePage="layanan" />

      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <Header
          title="Data Layanan Klinik"
          subtitle="Kelola daftar layanan yang tersedia di klinik"
          notifCount={3}
        />

        <main style={{ flex: 1, overflowY: "auto", background: "#f5f7f5", padding: "24px" }}>

          {/* ── Error global ── */}
          {error && !showModal && (
            <div style={{ background: "#ffebee", border: "1px solid #ffcdd2", borderRadius: 8, padding: "10px 14px", marginBottom: 16, fontSize: 13, color: "#c62828" }}>
              {error}
            </div>
          )}

          {/* ── SUMMARY CARDS ── */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "16px", marginBottom: "20px" }}>
            <div style={summaryCard}>
              <div style={{ ...summaryIconWrap, background: "#e8f5e9" }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2E7D32" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
                </svg>
              </div>
              <div>
                <p style={summaryLabel}>Layanan Aktif</p>
                <p style={summaryValue}>{totalAktif}</p>
                <p style={summarySub}>Tersedia untuk booking</p>
              </div>
            </div>
            <div style={summaryCard}>
              <div style={{ ...summaryIconWrap, background: "#ffebee" }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#c62828" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/>
                </svg>
              </div>
              <div>
                <p style={summaryLabel}>Nonaktif</p>
                <p style={summaryValue}>{totalNonaktif}</p>
                <p style={summarySub}>Tidak tersedia saat ini</p>
              </div>
            </div>
          </div>

          {/* ── TOOLBAR ── */}
          <div style={{ ...card, display: "flex", alignItems: "flex-end", gap: "14px", flexWrap: "wrap" }}>
            <div style={{ flex: 1, minWidth: "160px" }}>
              <label style={filterLabel}>Nama Layanan</label>
              <input style={inputStyle} placeholder="Cari nama layanan..." value={filterNama} onChange={(e) => setFilterNama(e.target.value)} />
            </div>
            <div style={{ minWidth: "160px" }}>
              <label style={filterLabel}>Kategori</label>
              <select style={inputStyle} value={filterKategori} onChange={(e) => setFilterKategori(e.target.value)}>
                <option value="">Semua Kategori</option>
                {(["Medis", "Bedah", "Grooming", "Rawat Inap"] as LayananKategori[]).map((k) => (
                  <option key={k} value={k}>{k}</option>
                ))}
              </select>
            </div>
            <div style={{ minWidth: "160px" }}>
              <label style={filterLabel}>Status</label>
              <select style={inputStyle} value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                <option value="">Semua Status</option>
                {(["Aktif", "Nonaktif"] as LayananStatus[]).map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div style={{ marginLeft: "auto" }}>
              <button
                onClick={openTambah}
                style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "9px 16px", borderRadius: "8px", border: "none", background: "#2E7D32", color: "#fff", fontSize: "13px", fontWeight: 600, cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap" }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "#1b5e20")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "#2E7D32")}
              >
                <Plus size={15} /> Tambah Layanan
              </button>
            </div>
          </div>

          {/* ── TABLE ── */}
          <div style={{ ...card, padding: 0, overflow: "hidden" }}>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "#2E7D32" }}>
                    {["Layanan", "Harga", "Durasi", "Kapasitas", "Status", "Aksi"].map((h) => (
                      <th key={h} style={{ padding: "11px 16px", fontSize: "12px", fontWeight: 600, color: "#fff", textAlign: "left", whiteSpace: "nowrap" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={6} style={{ padding: "2rem", textAlign: "center", color: "#999", fontSize: "13px" }}>Memuat data...</td></tr>
                  ) : allLayanan.length === 0 ? (
                    <tr><td colSpan={6} style={{ padding: "2rem", textAlign: "center", color: "#999", fontSize: "13px" }}>Tidak ada layanan yang sesuai filter</td></tr>
                  ) : (
                    allLayanan.map((l, idx) => {
                      const st = statusStyle[l.status];
                      const kt = kategoriStyle[l.kategori];
                      return (
                        <tr key={l.id_layanan}
                          style={{ background: idx % 2 === 0 ? "#fff" : "#fafafa" }}
                          onMouseEnter={(e) => (e.currentTarget.style.background = "#f0faf2")}
                          onMouseLeave={(e) => (e.currentTarget.style.background = idx % 2 === 0 ? "#fff" : "#fafafa")}
                        >
                          <td style={td}>
                            <p style={{ margin: 0, fontWeight: 600, fontSize: "13px", color: "#1a1a1a" }}>{l.nama_layanan}</p>
                            <span style={{ display: "inline-block", marginTop: "3px", padding: "1px 8px", borderRadius: "20px", fontSize: "10px", fontWeight: 500, background: kt.bg, color: kt.color }}>{l.kategori}</span>
                          </td>
                          <td style={{ ...td, fontWeight: 500, color: "#2E7D32" }}>{formatHarga(l.harga)}</td>
                          <td style={td}>{l.durasi ? `${l.durasi} mnt` : "-"}</td>
                          <td style={td}>{l.kapasitas ? `${l.kapasitas}/hr` : "-"}</td>
                          <td style={td}>
                            <span style={{ display: "inline-block", padding: "3px 12px", borderRadius: "20px", fontSize: "11px", fontWeight: 600, background: st.bg, color: st.color, whiteSpace: "nowrap" }}>{l.status}</span>
                          </td>
                          <td style={td}>
                            <div style={{ display: "flex", gap: "6px" }}>
                              <ActionBtn color="#1565c0" bg="#e3f2fd" hoverBg="#1565c0" icon={<Pencil size={12} />} label="Edit"  onClick={() => openEdit(l)} />
                              <ActionBtn color="#c62828" bg="#ffebee" hoverBg="#c62828" icon={<Trash2 size={12} />} label="Hapus" onClick={() => handleHapus(l.id_layanan)} />
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
            <div style={{ padding: "12px 16px", borderTop: "1px solid #f0f0f0", fontSize: "12px", color: "#999" }}>
              Menampilkan {allLayanan.length} layanan
            </div>
          </div>
        </main>
      </div>

      {/* ── MODAL ── */}
      {showModal && (
        <div
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.35)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }}
          onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}
        >
          <div style={{ background: "#fff", borderRadius: "14px", width: "100%", maxWidth: "420px", boxShadow: "0 20px 60px rgba(0,0,0,0.2)", overflow: "hidden", fontFamily: "inherit" }}>
            {/* Modal header */}
            <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "16px 20px", borderBottom: "1px solid #f0f0f0" }}>
              <div style={{ width: "28px", height: "28px", borderRadius: "6px", background: "#e8f5e9", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Plus size={15} color="#2E7D32" />
              </div>
              <h2 style={{ margin: 0, fontSize: "15px", fontWeight: 700, color: "#1a1a1a" }}>
                {editTarget ? "Edit Layanan" : "Tambah Layanan"}
              </h2>
              <button
                onClick={closeModal}
                style={{ marginLeft: "auto", background: "none", border: "none", cursor: "pointer", color: "#999", padding: "4px", display: "flex", alignItems: "center" }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "#333")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "#999")}
              >
                <X size={18} />
              </button>
            </div>

            {/* Error di dalam modal */}
            {error && (
              <div style={{ background: "#ffebee", borderBottom: "1px solid #ffcdd2", padding: "8px 20px", fontSize: "12px", color: "#c62828" }}>
                {error}
              </div>
            )}

            {/* Modal body */}
            <div style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "14px" }}>
              <div>
                <label style={modalLabel}>Nama Layanan <span style={{ color: "#c62828" }}>*</span></label>
                <input style={modalInputStyle} placeholder="Pemeriksaan Umum" value={form.nama_layanan} onChange={(e) => setForm((f) => ({ ...f, nama_layanan: e.target.value }))} />
              </div>
              <div>
                <label style={modalLabel}>Kategori</label>
                <select style={modalInputStyle} value={form.kategori} onChange={(e) => setForm((f) => ({ ...f, kategori: e.target.value as LayananKategori }))}>
                  {(["Medis", "Bedah", "Grooming", "Rawat Inap"] as LayananKategori[]).map((k) => (
                    <option key={k} value={k}>{k}</option>
                  ))}
                </select>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={modalLabel}>Harga (Rp) <span style={{ color: "#c62828" }}>*</span></label>
                  <input style={modalInputStyle} placeholder="150000" type="number" value={form.harga} onChange={(e) => setForm((f) => ({ ...f, harga: e.target.value }))} />
                </div>
                <div>
                  <label style={modalLabel}>Durasi (Menit)</label>
                  <input style={modalInputStyle} placeholder="30" type="number" value={form.durasi} onChange={(e) => setForm((f) => ({ ...f, durasi: e.target.value }))} />
                </div>
              </div>
              <div>
                <label style={modalLabel}>Kapasitas Harian</label>
                <input style={modalInputStyle} placeholder="20" type="number" value={form.kapasitas} onChange={(e) => setForm((f) => ({ ...f, kapasitas: e.target.value }))} />
              </div>
              <div>
                <label style={modalLabel}>Deskripsi</label>
                <textarea
                  style={{ ...modalInputStyle, resize: "vertical", minHeight: "80px" } as React.CSSProperties}
                  placeholder="Deskripsi singkat layanan..."
                  value={form.deskripsi}
                  onChange={(e) => setForm((f) => ({ ...f, deskripsi: e.target.value }))}
                />
              </div>
              {/* Toggle Aktif */}
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <button
                  onClick={() => setForm((f) => ({ ...f, aktif: !f.aktif }))}
                  style={{ width: "44px", height: "24px", borderRadius: "12px", border: "none", background: form.aktif ? "#2E7D32" : "#ccc", cursor: "pointer", position: "relative", transition: "background 0.2s", flexShrink: 0 }}
                >
                  <span style={{ position: "absolute", top: "3px", left: form.aktif ? "23px" : "3px", width: "18px", height: "18px", borderRadius: "50%", background: "#fff", transition: "left 0.2s", boxShadow: "0 1px 3px rgba(0,0,0,0.2)" }} />
                </button>
                <span style={{ fontSize: "13px", color: "#444", fontWeight: 500 }}>Layanan Aktif</span>
              </div>
            </div>

            {/* Modal footer */}
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", padding: "14px 20px", borderTop: "1px solid #f0f0f0" }}>
              <button
                onClick={closeModal}
                disabled={submitLoading}
                style={{ display: "inline-flex", alignItems: "center", gap: "5px", padding: "8px 16px", borderRadius: "8px", border: "1px solid #e0e0e0", background: "#fff", color: "#555", fontSize: "13px", fontWeight: 500, cursor: "pointer", fontFamily: "inherit" }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "#f5f5f5")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "#fff")}
              >
                <X size={13} /> Batal
              </button>
              <button
                onClick={handleSimpan}
                disabled={submitLoading}
                style={{ display: "inline-flex", alignItems: "center", gap: "5px", padding: "8px 18px", borderRadius: "8px", border: "none", background: submitLoading ? "#81c784" : "#2E7D32", color: "#fff", fontSize: "13px", fontWeight: 600, cursor: submitLoading ? "not-allowed" : "pointer", fontFamily: "inherit" }}
                onMouseEnter={(e) => { if (!submitLoading) e.currentTarget.style.background = "#1b5e20"; }}
                onMouseLeave={(e) => { if (!submitLoading) e.currentTarget.style.background = "#2E7D32"; }}
              >
                <Plus size={13} /> {submitLoading ? "Menyimpan..." : "Simpan"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── ActionBtn helper ── */
function ActionBtn({ color, bg, hoverBg, icon, label, onClick }: {
  color: string; bg: string; hoverBg: string; icon: React.ReactNode; label: string; onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{ display: "inline-flex", alignItems: "center", gap: "4px", padding: "5px 10px", borderRadius: "6px", border: `1px solid ${bg}`, background: bg, color, fontSize: "11px", fontWeight: 500, cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap", transition: "background 0.15s, color 0.15s" }}
      onMouseEnter={(e) => { e.currentTarget.style.background = hoverBg; e.currentTarget.style.color = "#fff"; }}
      onMouseLeave={(e) => { e.currentTarget.style.background = bg; e.currentTarget.style.color = color; }}
    >
      {icon}{label}
    </button>
  );
}

/* ── Style helpers ── */
const summaryCard: React.CSSProperties    = { background: "#fff", border: "1px solid #e8e8e8", borderRadius: "10px", padding: "16px", display: "flex", alignItems: "center", gap: "14px" };
const summaryIconWrap: React.CSSProperties = { width: "44px", height: "44px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 };
const summaryLabel: React.CSSProperties   = { fontSize: "11px", color: "#888", margin: 0, fontWeight: 500 };
const summaryValue: React.CSSProperties   = { fontSize: "22px", fontWeight: 700, color: "#1a1a1a", margin: "2px 0 0" };
const summarySub: React.CSSProperties     = { fontSize: "11px", color: "#aaa", margin: 0 };
const card: React.CSSProperties           = { background: "#fff", border: "1px solid #e8e8e8", borderRadius: "10px", padding: "16px", marginBottom: "16px" };
const filterLabel: React.CSSProperties   = { display: "block", fontSize: "12px", fontWeight: 500, color: "#666", marginBottom: "6px" };
const modalLabel: React.CSSProperties    = { display: "block", fontSize: "12px", fontWeight: 600, color: "#555", marginBottom: "6px" };
const td: React.CSSProperties            = { padding: "12px 16px", fontSize: "13px", color: "#333", borderBottom: "1px solid #f0f0f0", verticalAlign: "middle" };