"use client";

import { useState, useEffect, useCallback } from "react";
import { PawPrint, RefreshCw, X, Check } from "lucide-react";
import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar_admin";
import { getToken } from "@/lib/auth";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api";

/* ─── Types ──────────────────────────────────────────────────────────── */
interface DetailItem {
  tipe: string;
  nama_item: string;
  harga_satuan: number;
  qty: number;
  subtotal: number;
}

interface Pembayaran {
  id_pembayaran: number;
  id_resep: number;
  jumlah: number;
  metode: string | null;
  status: string;
  no_referensi: string | null;
  catatan_admin: string | null;
  midtrans_payment_type: string | null;
  dikonfirmasi_at: string | null;
  dikonfirmasi_oleh_nama: string | null;
  created_at: string;
  pemilik: { id: number; nama: string; no_hp: string; email: string };
  hewan: { id_hewan: number; nama_hewan: string; jenis: string; ras: string; foto: string | null };
  grand_total: number;
  details: DetailItem[];
}

/* ─── Helpers ────────────────────────────────────────────────────────── */
const fmt = (n: number) => new Intl.NumberFormat("id-ID", {
  style: "currency", currency: "IDR", maximumFractionDigits: 0,
}).format(n);

const fmtTanggal = (iso: string) => new Date(iso).toLocaleDateString("id-ID", {
  day: "2-digit", month: "short", year: "numeric",
});

const fmtJam = (iso: string) => new Date(iso).toLocaleTimeString("id-ID", {
  hour: "2-digit", minute: "2-digit",
}) + " WIB";

/* ─── HewanAvatar ────────────────────────────────────────────────────── */
function HewanAvatar({ foto, nama, size = 40 }: {
  foto: string | null;
  nama: string;
  size?: number;
}) {
  const [imgError, setImgError] = useState(false);

  if (foto && !imgError) {
    return (
      <img
        src={foto}
        alt={nama}
        onError={() => setImgError(true)}
        style={{
          width: size, height: size,
          borderRadius: 8, objectFit: "cover",
          flexShrink: 0, border: "1px solid #e5e7eb",
        }}
      />
    );
  }

  // Fallback: ikon lucide PawPrint
  return (
    <div style={{
      width: size, height: size, borderRadius: 8,
      background: "#f0faf2", display: "flex",
      alignItems: "center", justifyContent: "center",
      flexShrink: 0, border: "1px solid #e5e7eb",
    }}>
      <PawPrint size={size * 0.5} color="#2E7D32" strokeWidth={1.5} />
    </div>
  );
}

/* ─── Status config ──────────────────────────────────────────────────── */
const STATUS_LABEL: Record<string, string> = {
  menunggu_pembayaran: "Belum Bayar",
  pending_cash:        "Menunggu Kasir",
  pending_midtrans:    "Menunggu Midtrans",
  lunas:               "Selesai",
  gagal:               "Gagal",
};

const STATUS_COLOR: Record<string, string> = {
  menunggu_pembayaran: "#d97706",
  pending_cash:        "#1d4ed8",
  pending_midtrans:    "#7c3aed",
  lunas:               "#2E7D32",
  gagal:               "#dc2626",
};

const inputSt: React.CSSProperties = {
  width: "100%", padding: "8px 12px",
  border: "1px solid #d1d5db", borderRadius: "8px",
  fontSize: "13px", color: "#1a1a1a",
  fontFamily: "Segoe UI, sans-serif", outline: "none",
  background: "#fff", boxSizing: "border-box",
};
const labelSt: React.CSSProperties = {
  display: "block", fontSize: "13px", fontWeight: 600,
  color: "#555", marginBottom: "5px",
};

/* ─── Modal Detail ───────────────────────────────────────────────────── */
function DetailModal({
  payment, onClose, onKonfirmasi,
}: {
  payment: Pembayaran;
  onClose(): void;
  onKonfirmasi(id: number, catatan: string, noRef: string): Promise<void>;
}) {
  const [catatan,    setCatatan]    = useState(payment.catatan_admin ?? "");
  const [noRef,      setNoRef]      = useState(payment.no_referensi ?? "");
  const [loading,    setLoading]    = useState(false);
  const [hoverTutup, setHoverTutup] = useState(false);

  const isPendingCash = payment.status === "pending_cash";

  async function handleKonfirmasi() {
    setLoading(true);
    try {
      await onKonfirmasi(payment.id_pembayaran, catatan, noRef);
      onClose();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 999,
        background: "rgba(0,0,0,0.35)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "16px",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%", maxWidth: "520px",
          background: "#fff", borderRadius: "12px",
          padding: "24px", boxShadow: "0 8px 32px rgba(0,0,0,0.18)",
          maxHeight: "90vh", overflowY: "auto",
          fontFamily: "Segoe UI, sans-serif",
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "20px" }}>
          <div>
            <p style={{ margin: 0, fontSize: "15px", fontWeight: 700, color: "#1a1a1a" }}>Detail Transaksi</p>
            <p style={{ margin: 0, fontSize: "12px", color: "#888", marginTop: "2px" }}>
              Invoice #{payment.id_resep}
            </p>
          </div>
          <button onClick={onClose} style={{
            border: "none", background: "#f3f4f6", borderRadius: "50%",
            width: "30px", height: "30px", cursor: "pointer",
            color: "#888", display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <X size={16} />
          </button>
        </div>

        {/* Hewan + Status */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <HewanAvatar foto={payment.hewan.foto} nama={payment.hewan.nama_hewan} size={48} />
            <div>
              <p style={{ margin: 0, fontSize: "14px", fontWeight: 700 }}>{payment.hewan.nama_hewan}</p>
              <p style={{ margin: 0, fontSize: "12px", color: "#888" }}>{payment.hewan.jenis} · {payment.hewan.ras}</p>
            </div>
          </div>
          <span style={{ fontSize: 13, fontWeight: 600, color: STATUS_COLOR[payment.status] }}>
            {STATUS_LABEL[payment.status]}
          </span>
        </div>

        {/* Summary grid */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 16 }}>
          {[
            { label: "Pemilik", value: payment.pemilik.nama,           color: "#1a1a1a" },
            { label: "Total",   value: fmt(payment.grand_total),       color: "#2E7D32" },
            { label: "Tanggal", value: fmtTanggal(payment.created_at), color: "#1a1a1a" },
          ].map((item) => (
            <div key={item.label} style={{
              padding: 12, borderRadius: 8,
              background: "#f9f9f9", border: "1px solid #f0f0f0",
            }}>
              <p style={{ margin: 0, fontSize: 12, color: "#888", marginBottom: 4 }}>{item.label}</p>
              <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: item.color }}>{item.value}</p>
            </div>
          ))}
        </div>

        <div style={{ height: 1, background: "#f0f0f0", margin: "14px 0" }} />

        {/* Detail items */}
        <div style={{ marginBottom: 12 }}>
          <label style={labelSt}>Detail Layanan</label>
          {payment.details.map((d, i) => (
            <div key={i} style={{
              display: "flex", justifyContent: "space-between",
              fontSize: 12, color: "#444", padding: "4px 0",
              borderBottom: "1px dashed #f0f0f0",
            }}>
              <span>{d.nama_item} ×{d.qty}</span>
              <span>{fmt(d.subtotal)}</span>
            </div>
          ))}
        </div>

        <div style={{ height: 1, background: "#f0f0f0", margin: "14px 0" }} />

        {/* ID & Metode */}
        <div style={{ marginBottom: 12 }}>
          <label style={labelSt}>ID Pembayaran</label>
          <div style={{
            display: "flex", justifyContent: "space-between",
            padding: "8px 12px", border: "1px solid #d1d5db",
            borderRadius: 8, background: "#f9f9f9", fontSize: 13,
          }}>
            <span style={{ fontWeight: 700 }}>#{payment.id_pembayaran}</span>
            <span style={{ color: "#888", fontSize: 12 }}>{fmtJam(payment.created_at)}</span>
          </div>
        </div>

        <div style={{ marginBottom: 12 }}>
          <label style={labelSt}>Metode Pembayaran</label>
          <div style={{
            padding: "8px 12px", border: "1px solid #d1d5db",
            borderRadius: 8, background: "#f9f9f9", fontSize: 13,
          }}>
            {payment.metode === "cash" ? "Tunai (Cash)" : payment.midtrans_payment_type ?? payment.metode ?? "-"}
          </div>
        </div>

        {isPendingCash && (
          <>
            <div style={{ marginBottom: 12 }}>
              <label style={labelSt}>No. Referensi <span style={{ fontWeight: 400, color: "#aaa" }}>(Opsional)</span></label>
              <input style={inputSt} value={noRef} onChange={(e) => setNoRef(e.target.value)}
                placeholder="Nomor referensi pembayaran..." />
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={labelSt}>Catatan Verifikasi</label>
              <textarea style={{ ...inputSt, resize: "none" } as React.CSSProperties}
                rows={3} value={catatan} onChange={(e) => setCatatan(e.target.value)}
                placeholder="Catatan pembayaran..." />
            </div>
          </>
        )}

        <div style={{ height: 1, background: "#f0f0f0", margin: "14px 0" }} />

        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={onClose}
            onMouseEnter={() => setHoverTutup(true)}
            onMouseLeave={() => setHoverTutup(false)}
            style={{
              padding: "7px 18px", borderRadius: 8,
              border: `1px solid ${hoverTutup ? "#2E7D32" : "#d1d5db"}`,
              background: hoverTutup ? "#f0faf2" : "#fff",
              color: hoverTutup ? "#2E7D32" : "#555",
              fontSize: 13, fontWeight: 600, cursor: "pointer",
              display: "flex", alignItems: "center", gap: 6,
              transition: "all 0.15s ease",
            }}
          >
            <X size={14} /> Tutup
          </button>

          {isPendingCash && (
            <button onClick={handleKonfirmasi} disabled={loading} style={{
              flex: 1, padding: "7px 18px", borderRadius: 8,
              border: "none", background: loading ? "#aaa" : "#2E7D32",
              color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
            }}>
              {loading
                ? <><RefreshCw size={14} /> Memproses...</>
                : <><Check size={14} /> Konfirmasi Lunas</>
              }
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Main Page ──────────────────────────────────────────────────────── */
export default function VerifikasiPembayaranPage() {
  const [data,     setData]     = useState<Pembayaran[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState<string | null>(null);
  const [selected, setSelected] = useState<Pembayaran | null>(null);
  const [filter,   setFilter]   = useState<string>("semua");
  const [mounted,  setMounted]  = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/admin/pembayaran`, {
        headers: {
          Authorization: `Bearer ${getToken()}`,
          "Accept": "application/json",
        },
      });
      const text = await res.text();
      let json;
      try { json = JSON.parse(text); }
      catch { throw new Error(`Response bukan JSON (status ${res.status})`); }
      if (!json.success) throw new Error(json.message);
      setData(json.data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Gagal memuat data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  async function handleKonfirmasi(id: number, catatan: string, noRef: string) {
    const res = await fetch(`${API_BASE}/admin/pembayaran/${id}/selesai`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${getToken()}`,
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      body: JSON.stringify({ catatan_admin: catatan, no_referensi: noRef }),
    });
    const text = await res.text();
    let json;
    try { json = JSON.parse(text); }
    catch { throw new Error(`Response bukan JSON (status ${res.status})`); }
    if (!json.success) throw new Error(json.message);
    await fetchData();
  }

  const filtered = filter === "semua" ? data : data.filter((p) => p.status === filter);

  const counts = {
    semua:        data.length,
    pending_cash: data.filter((p) => p.status === "pending_cash").length,
    lunas:        data.filter((p) => p.status === "lunas").length,
  };

  const stats = [
    { key: "semua",        Icon: PawPrint, label: "Total Transaksi", count: counts.semua,        color: "#6b7280" },
    { key: "pending_cash", Icon: RefreshCw, label: "Menunggu Kasir", count: counts.pending_cash, color: "#1d4ed8" },
    { key: "lunas",        Icon: Check,     label: "Selesai",        count: counts.lunas,        color: "#2E7D32" },
  ];

  return (
    <div style={{ display: "flex", height: "100vh", backgroundColor: "#f5f5f5", fontFamily: "Segoe UI, sans-serif" }}>
      <Sidebar activePage="pembayaran" />

      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflowY: "auto" }}>
        <Header title="Verifikasi Pembayaran" subtitle="Kelola konfirmasi pembayaran pasien" />

        <main style={{ flex: 1, padding: "24px" }}>

          {/* Stats */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 24 }}>
            {stats.map(({ key, Icon, label, count, color }) => {
              const isActive = filter === key;
              return (
                <div key={key} onClick={() => setFilter(key)} style={{
                  backgroundColor: isActive ? "#f0faf2" : "#fff",
                  borderRadius: 12, padding: "16px 20px",
                  boxShadow: "0 1px 4px rgba(0,0,0,0.07)",
                  display: "flex", alignItems: "center", gap: 12,
                  border: isActive ? "1.5px solid #2E7D32" : "1.5px solid transparent",
                  cursor: "pointer",
                }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: 10,
                    background: isActive ? "#e0f2e9" : "#f3f4f6",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <Icon size={20} color={isActive ? "#2E7D32" : color} strokeWidth={1.8} />
                  </div>
                  <div>
                    <p style={{ margin: 0, fontSize: 13, color: "#888" }}>{label}</p>
                    <p style={{ margin: 0, fontSize: 20, fontWeight: 700, color: "#1a1a1a" }}>
                      {count}
                      <span style={{ fontSize: 13, fontWeight: 400, color: "#888" }}> Transaksi</span>
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Refresh */}
          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 14 }}>
            <button
              onClick={fetchData}
              disabled={!mounted || loading}
              style={{
                padding: "7px 14px", borderRadius: 8,
                border: "1px solid #e0e0e0", background: "#fff",
                color: "#555", fontSize: 12, cursor: "pointer",
                display: "flex", alignItems: "center", gap: 6,
              }}
            >
              <RefreshCw size={13} />
              {!mounted || loading ? "Memuat..." : "Refresh"}
            </button>
          </div>

          {/* Error */}
          {error && (
            <div style={{
              padding: "12px 16px", background: "#fef2f2",
              border: "1px solid #fecaca", borderRadius: 10,
              color: "#dc2626", fontSize: 13, marginBottom: 16,
              display: "flex", alignItems: "center", gap: 8,
            }}>
              <X size={14} />
              {error}
              <button onClick={fetchData} style={{
                marginLeft: 4, color: "#dc2626", background: "none",
                border: "1px solid #dc2626", borderRadius: 6,
                padding: "2px 10px", cursor: "pointer", fontSize: 12,
              }}>Coba Lagi</button>
            </div>
          )}

          {/* Table */}
          <div style={{ backgroundColor: "#fff", borderRadius: 12, boxShadow: "0 1px 4px rgba(0,0,0,0.07)", overflow: "hidden" }}>
            <div style={{ display: "flex", justifyContent: "space-between", padding: "14px 20px", borderBottom: "1px solid #f0f0f0" }}>
              <p style={{ margin: 0, fontSize: 14, fontWeight: 700 }}>Daftar Pembayaran</p>
              <span style={{ fontSize: 13, color: "#888" }}>{filtered.length} data</span>
            </div>

            {/* Header */}
            <div style={{
              display: "grid",
              gridTemplateColumns: "100px 160px 140px 120px 130px 140px 130px 90px",
              padding: "12px 20px", backgroundColor: "#f9f9f9",
              borderBottom: "1px solid #f0f0f0",
            }}>
              {["ID", "Hewan", "Pemilik", "Metode", "Total", "Tanggal", "Status", "Aksi"].map((h) => (
                <span key={h} style={{ fontSize: 13, fontWeight: 600, color: "#555" }}>{h}</span>
              ))}
            </div>

            {loading ? (
              <div style={{ padding: 40, textAlign: "center", color: "#888", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                <RefreshCw size={16} /> Memuat data...
              </div>
            ) : filtered.length === 0 ? (
              <div style={{ padding: 40, textAlign: "center", color: "#aaa" }}>Tidak ada data.</div>
            ) : filtered.map((p, i) => (
              <div key={p.id_pembayaran} style={{
                display: "grid",
                gridTemplateColumns: "100px 160px 140px 120px 130px 140px 130px 90px",
                padding: "14px 20px",
                borderBottom: i < filtered.length - 1 ? "1px solid #f0f0f0" : "none",
                alignItems: "center",
              }}>
                <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "#2E7D32" }}>
                  #{p.id_pembayaran}
                </p>

                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <HewanAvatar foto={p.hewan.foto} nama={p.hewan.nama_hewan} size={36} />
                  <div>
                    <p style={{ margin: 0, fontSize: 13, fontWeight: 600 }}>{p.hewan.nama_hewan}</p>
                    <p style={{ margin: 0, fontSize: 11, color: "#888" }}>{p.hewan.jenis} · {p.hewan.ras}</p>
                  </div>
                </div>

                <p style={{ margin: 0, fontSize: 13 }}>{p.pemilik.nama}</p>
                <p style={{ margin: 0, fontSize: 12, color: "#888" }}>
                  {p.metode === "cash" ? "Tunai" : p.midtrans_payment_type ?? p.metode ?? "-"}
                </p>
                <p style={{ margin: 0, fontSize: 13, fontWeight: 600 }}>{fmt(p.grand_total)}</p>

                <div>
                  <p style={{ margin: 0, fontSize: 13 }}>{fmtTanggal(p.created_at)}</p>
                  <p style={{ margin: 0, fontSize: 11, color: "#888" }}>{fmtJam(p.created_at)}</p>
                </div>

                <span style={{ fontSize: 12, fontWeight: 600, color: STATUS_COLOR[p.status] }}>
                  {STATUS_LABEL[p.status]}
                </span>

                <button onClick={() => setSelected(p)} style={{
                  padding: "5px 14px", borderRadius: 8,
                  border: "1px solid #d1d5db", background: "#fff",
                  color: "#2E7D32", fontSize: 13, fontWeight: 600, cursor: "pointer",
                }}>Detail →</button>
              </div>
            ))}
          </div>
        </main>
      </div>

      {selected && (
        <DetailModal
          payment={selected}
          onClose={() => setSelected(null)}
          onKonfirmasi={handleKonfirmasi}
        />
      )}
    </div>
  );
}