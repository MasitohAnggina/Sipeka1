"use client";

import { useState, useEffect } from "react";
import Sidebar from "@/components/Sidebar_admin";
import Header from "@/components/Header";

const API_URL = "http://127.0.0.1:8000/api";
const G = "#2E7D32";

// ── Types ──────────────────────────────────────────────────────────────────
interface Obat {
  id_obat:   number;
  nama_obat: string;
  kategori:  string | null;
  satuan:    string | null;
  harga:     number;
  stok:      number;
  min_stok:  number;
  deskripsi: string | null;
}

interface FormObat {
  nama_obat: string;
  kategori:  string;
  satuan:    string;
  harga:     number;
  stok:      number;
  min_stok:  number;
  deskripsi: string;
}

const defaultForm: FormObat = {
  nama_obat: "",
  kategori:  "Antibiotik",
  satuan:    "tablet",
  harga:     0,
  stok:      0,
  min_stok:  10,
  deskripsi: "",
};

const ITEMS_PER_PAGE = 8;

function fmt(n: number) { return "Rp " + n.toLocaleString("id-ID"); }

function stokStatus(o: Obat) {
  if (o.stok === 0)         return "Habis";
  if (o.stok < o.min_stok) return "Kritis";
  return "Aman";
}

function stokColor(s: string): { color: string; bg: string } {
  if (s === "Habis")  return { color: "#c62828", bg: "#ffebee" };
  if (s === "Kritis") return { color: "#e65100", bg: "#fff8e1" };
  return { color: "#2E7D32", bg: "#e8f5e9" };
}

// ── Shared Styles ──────────────────────────────────────────────────────────
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

const labelSt: React.CSSProperties = {
  display: "block", fontSize: "13px", fontWeight: 600,
  color: "#555", marginBottom: "5px",
};

const inputSt: React.CSSProperties = {
  width: "100%", padding: "8px 12px",
  border: "1px solid #d1d5db", borderRadius: "8px",
  fontSize: "13px", color: "#1a1a1a",
  fontFamily: "inherit", outline: "none",
  background: "#fff", boxSizing: "border-box",
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

// ── Modal ──────────────────────────────────────────────────────────────────
function ObatModal({ onClose, onSave, existing, loading, error }: {
  onClose:  () => void;
  onSave:   (f: FormObat) => void;
  existing: Obat | null;
  loading:  boolean;
  error:    string;
}) {
  const [f, setF] = useState<FormObat>(
    existing ? {
      nama_obat: existing.nama_obat,
      kategori:  existing.kategori  ?? "Antibiotik",
      satuan:    existing.satuan    ?? "tablet",
      harga:     existing.harga,
      stok:      existing.stok,
      min_stok:  existing.min_stok,
      deskripsi: existing.deskripsi ?? "",
    } : defaultForm
  );

  const s = (k: keyof FormObat, v: string | number) =>
    setF(p => ({ ...p, [k]: v }));

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,.4)",
      zIndex: 200, display: "flex", alignItems: "center",
      justifyContent: "center", padding: "1rem",
    }}>
      <div style={{
        background: "#fff", borderRadius: "12px", width: "100%",
        maxWidth: "480px", boxShadow: "0 8px 32px rgba(0,0,0,.18)",
        fontFamily: "inherit", maxHeight: "90vh",
        display: "flex", flexDirection: "column",
      }}>
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "16px 20px", borderBottom: "1px solid #f0f0f0",
        }}>
          <span style={{ fontWeight: 700, fontSize: "15px", color: "#1a1a1a" }}>
            {existing ? "Edit Obat" : "Tambah Obat"}
          </span>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: "18px", cursor: "pointer", color: "#888" }}>✕</button>
        </div>

        {error && (
          <div style={{ background: "#ffebee", borderBottom: "1px solid #ffcdd2", padding: "8px 20px", fontSize: "12px", color: "#c62828" }}>
            {error}
          </div>
        )}

        <div style={{ padding: "20px", overflow: "auto", flex: 1, display: "flex", flexDirection: "column", gap: "14px" }}>
          <div>
            <label style={labelSt}>Nama Obat <span style={{ color: "#ef4444" }}>*</span></label>
            <input style={inputSt} value={f.nama_obat} onChange={e => s("nama_obat", e.target.value)} placeholder="Nama obat..." />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <div>
              <label style={labelSt}>Kategori</label>
              <select style={inputSt} value={f.kategori} onChange={e => s("kategori", e.target.value)}>
                {["Antibiotik","Suplemen","Infus","Antiparasit","Vitamin","Antihistamin","Analgesik","Lainnya"].map(k => <option key={k}>{k}</option>)}
              </select>
            </div>
            <div>
              <label style={labelSt}>Satuan</label>
              <input style={inputSt} value={f.satuan} onChange={e => s("satuan", e.target.value)} placeholder="tablet / sachet..." />
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <div>
              <label style={labelSt}>Harga / Satuan (Rp) <span style={{ color: "#ef4444" }}>*</span></label>
              <input style={inputSt} type="number" value={f.harga} onChange={e => s("harga", +e.target.value)} />
            </div>
            <div>
              <label style={labelSt}>Stok</label>
              <input style={inputSt} type="number" value={f.stok} onChange={e => s("stok", +e.target.value)} />
            </div>
          </div>
          <div>
            <label style={labelSt}>Min. Stok (Kritis)</label>
            <input style={inputSt} type="number" value={f.min_stok} onChange={e => s("min_stok", +e.target.value)} />
          </div>
          <div>
            <label style={labelSt}>Deskripsi</label>
            <textarea style={{ ...inputSt, resize: "vertical" } as React.CSSProperties} value={f.deskripsi} onChange={e => s("deskripsi", e.target.value)} rows={2} placeholder="Deskripsi singkat..." />
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", padding: "14px 20px", borderTop: "1px solid #f0f0f0" }}>
          <button onClick={onClose} disabled={loading} style={{ padding: "7px 18px", borderRadius: "8px", border: "1px solid #d1d5db", background: "#fff", color: "#555", fontSize: "13px", fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
            Batal
          </button>
          <button disabled={loading} onClick={() => { if (f.nama_obat) onSave(f); }}
            style={{ padding: "7px 18px", borderRadius: "8px", border: "none", background: loading ? "#81c784" : G, color: "#fff", fontSize: "13px", fontWeight: 600, cursor: loading ? "not-allowed" : "pointer", fontFamily: "inherit" }}>
            {loading ? "Menyimpan..." : "Simpan"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────
export default function StokObatPage() {
  const [obatList,     setObatList]     = useState<Obat[]>([]);
  const [showModal,    setShowModal]    = useState(false);
  const [editTarget,   setEditTarget]   = useState<Obat | null>(null);
  const [search,       setSearch]       = useState("");
  const [filterKat,    setFilterKat]    = useState("Semua");
  const [filterStatus, setFilterStatus] = useState("Semua");
  const [page,         setPage]         = useState(1);
  const [loading,      setLoading]      = useState(true);
  const [submitLoad,   setSubmitLoad]   = useState(false);
  const [error,        setError]        = useState("");
  const [modalError,   setModalError]   = useState("");

  const token = typeof window !== "undefined" ? sessionStorage.getItem("token") : "";

  async function fetchObat() {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      if (search) params.append("nama", search);
      if (filterKat !== "Semua") params.append("kategori", filterKat);
      const res = await fetch(`${API_URL}/obat?${params.toString()}`, {
        headers: { "Authorization": `Bearer ${token}` },
      });
      if (!res.ok) throw new Error();
      const data: Obat[] = await res.json();
      setObatList(data);
    } catch {
      setError("Gagal memuat data obat. Periksa koneksi ke server.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchObat(); }, [search, filterKat]);
  useEffect(() => { setPage(1); }, [search, filterKat, filterStatus]);

  async function handleTambah(f: FormObat) {
    setSubmitLoad(true); setModalError("");
    try {
      const res = await fetch(`${API_URL}/obat`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify(f),
      });
      const data = await res.json();
      if (!res.ok) { setModalError(data.message || "Gagal menambah obat"); return; }
      await fetchObat();
      setShowModal(false);
    } catch { setModalError("Terjadi kesalahan, coba lagi"); }
    finally { setSubmitLoad(false); }
  }

  async function handleEdit(f: FormObat) {
    if (!editTarget) return;
    setSubmitLoad(true); setModalError("");
    try {
      const res = await fetch(`${API_URL}/obat/${editTarget.id_obat}`, {
        method: "PUT",
        headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify(f),
      });
      const data = await res.json();
      if (!res.ok) { setModalError(data.message || "Gagal mengupdate obat"); return; }
      await fetchObat();
      setShowModal(false);
    } catch { setModalError("Terjadi kesalahan, coba lagi"); }
    finally { setSubmitLoad(false); }
  }

  async function handleHapus(id: number) {
    if (!confirm("Yakin ingin menghapus obat ini?")) return;
    try {
      const res = await fetch(`${API_URL}/obat/${id}`, {
        method: "DELETE", headers: { "Authorization": `Bearer ${token}` },
      });
      if (!res.ok) throw new Error();
      setObatList(prev => prev.filter(o => o.id_obat !== id));
    } catch { alert("Gagal menghapus obat"); }
  }

  const openAdd  = () => { setEditTarget(null); setModalError(""); setShowModal(true); };
  const openEdit = (o: Obat) => { setEditTarget(o); setModalError(""); setShowModal(true); };

  const filtered = obatList.filter(o =>
    filterStatus === "Semua" || stokStatus(o) === filterStatus
  );

  const kategoriList = Array.from(new Set(obatList.map(o => o.kategori ?? ""))).sort();
  const totalPages   = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const paginated    = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  const stats = [
    { label: "Total Jenis Obat", value: obatList.length,                                                   key: "Semua",  bg: "#fff",     valColor: "#1a1a1a", labelColor: "#888"    },
    { label: "Obat Habis",       value: obatList.filter(o => o.stok === 0).length,                         key: "Habis",  bg: "#ffebee",  valColor: "#b71c1c", labelColor: "#c62828" },
    { label: "Stok Kritis",      value: obatList.filter(o => o.stok > 0 && o.stok < o.min_stok).length,   key: "Kritis", bg: "#fff8e1",  valColor: "#bf360c", labelColor: "#e65100" },
    { label: "Stok Aman",        value: obatList.filter(o => o.stok >= o.min_stok).length,                 key: "Aman",   bg: "#e8f5e9",  valColor: "#1b5e20", labelColor: "#2e7d32" },
  ];

  return (
    <div style={{ display: "flex", height: "100vh", backgroundColor: "#f5f7f5", fontFamily: "'Inter', sans-serif" }}>
      <Sidebar activePage="obat" />

      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <Header title="Stok Obat" subtitle="Kelola daftar dan ketersediaan stok obat klinik" />

        <main style={{ flex: 1, overflowY: "auto", background: "#f5f7f5", padding: 24 }}>

          {error && (
            <div style={{ background: "#ffebee", border: "1px solid #ffcdd2", borderRadius: 8, padding: "10px 14px", marginBottom: 16, fontSize: 13, color: "#c62828" }}>
              {error}
            </div>
          )}

          {/* Summary Cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 20 }}>
            {stats.map(stat => (
              <div key={stat.key}
                onClick={() => { setFilterStatus(stat.key); setPage(1); }}
                style={{
                  background: stat.bg, border: `1.5px solid ${filterStatus === stat.key ? G : "#e8e8e8"}`,
                  borderRadius: 10, padding: "16px 20px", cursor: "pointer",
                  outline: filterStatus === stat.key ? `2px solid ${G}` : "none",
                  outlineOffset: -1,
                  transition: "border 0.15s",
                }}
              >
                <p style={{ fontSize: 12, color: stat.labelColor, margin: 0, fontWeight: 500 }}>{stat.label}</p>
                <p style={{ fontSize: 26, fontWeight: 700, color: stat.valColor, margin: "4px 0 0" }}>{stat.value}</p>
              </div>
            ))}
          </div>

          {/* Filter */}
          <div style={card}>
            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr auto", gap: 14, alignItems: "flex-end" }}>
              <div>
                <label style={filterLabel}>Nama Obat</label>
                <input style={inputStyle} placeholder="Cari nama obat..." value={search} onChange={e => setSearch(e.target.value)} />
              </div>
              <div>
                <label style={filterLabel}>Kategori</label>
                <select style={inputStyle} value={filterKat} onChange={e => setFilterKat(e.target.value)}>
                  <option value="Semua">Semua Kategori</option>
                  {kategoriList.map(k => <option key={k} value={k}>{k}</option>)}
                </select>
              </div>
              <div>
                <label style={filterLabel}>Status Stok</label>
                <select style={inputStyle} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
                  <option value="Semua">Semua Status</option>
                  <option value="Aman">Aman</option>
                  <option value="Kritis">Kritis</option>
                  <option value="Habis">Habis</option>
                </select>
              </div>
              <div>
                <button onClick={openAdd}
                  style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 8, border: "none", background: G, color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", height: 36, whiteSpace: "nowrap" }}>
                  + Tambah Obat
                </button>
              </div>
            </div>
          </div>

          {/* Table */}
          <div style={{ ...card, padding: 0, overflow: "hidden" }}>
            {loading ? (
              <div style={{ padding: 40, textAlign: "center", color: "#888" }}>Memuat data obat...</div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ background: G }}>
                      {["Nama Obat", "Kategori", "Satuan", "Harga", "Stok", "Min. Stok", "Status", "Aksi"].map(h => (
                        <th key={h} style={{ padding: "11px 14px", fontSize: 12, fontWeight: 600, color: "#fff", textAlign: "left", whiteSpace: "nowrap" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {paginated.length === 0 ? (
                      <tr>
                        <td colSpan={8} style={{ padding: "2rem", textAlign: "center", color: "#999", fontSize: 13 }}>
                          <div style={{ fontSize: 32, marginBottom: 8 }}>💊</div>
                          Tidak ada data yang sesuai filter
                        </td>
                      </tr>
                    ) : paginated.map((item, idx) => {
                      const st  = stokStatus(item);
                      const stC = stokColor(st);
                      return (
                        <tr key={item.id_obat}
                          style={{ background: idx % 2 === 0 ? "#fff" : "#fafafa" }}
                          onMouseEnter={e => (e.currentTarget.style.background = "#f0faf2")}
                          onMouseLeave={e => (e.currentTarget.style.background = idx % 2 === 0 ? "#fff" : "#fafafa")}
                        >
                          <td style={td}>
                            <div style={{ fontWeight: 500 }}>{item.nama_obat}</div>
                            {item.deskripsi && (
                              <div style={{ fontSize: 11, color: "#aaa", marginTop: 2 }}>
                                {item.deskripsi.length > 50 ? item.deskripsi.slice(0, 50) + "…" : item.deskripsi}
                              </div>
                            )}
                          </td>
                          <td style={td}>{item.kategori ?? "-"}</td>
                          <td style={td}>{item.satuan ?? "-"}</td>
                          <td style={{ ...td, fontWeight: 600 }}>{fmt(item.harga)}</td>
                          <td style={{ ...td, fontWeight: 700, color: item.stok === 0 ? "#c62828" : item.stok < item.min_stok ? "#e65100" : "#1a1a1a" }}>
                            {item.stok}
                          </td>
                          <td style={{ ...td, color: "#888" }}>{item.min_stok}</td>
                          <td style={td}>
                            <span style={{ display: "inline-block", padding: "3px 12px", borderRadius: 20, fontSize: 11, fontWeight: 600, background: stC.bg, color: stC.color, whiteSpace: "nowrap" }}>
                              {st}
                            </span>
                          </td>
                          <td style={td}>
                            <div style={{ display: "flex", gap: 6 }}>
                              <button onClick={() => openEdit(item)} style={{ padding: "4px 10px", borderRadius: 7, border: `1px solid #c8e6c9`, background: "#fff", fontSize: 12, fontWeight: 600, color: G, cursor: "pointer", fontFamily: "inherit" }}>Edit</button>
                              <button onClick={() => handleHapus(item.id_obat)} style={{ padding: "4px 10px", borderRadius: 7, border: "1px solid #ffcdd2", background: "#fff", fontSize: 12, fontWeight: 600, color: "#c62828", cursor: "pointer", fontFamily: "inherit" }}>Hapus</button>
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
              <button style={pageBtn(false)} disabled={page === 1} onClick={() => setPage(p => p - 1)}>
                ← Sebelumnya
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                <button key={p} style={pageBtn(p === page)} onClick={() => setPage(p)}>{p}</button>
              ))}
              <button style={pageBtn(false)} disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>
                Berikutnya →
              </button>
            </div>
          </div>

        </main>
      </div>

      {showModal && (
        <ObatModal
          onClose={() => setShowModal(false)}
          onSave={editTarget ? handleEdit : handleTambah}
          existing={editTarget}
          loading={submitLoad}
          error={modalError}
        />
      )}
    </div>
  );
}