"use client";

import { useState, useEffect, useRef } from "react";
import { Eye, ChevronDown, X } from "lucide-react";
import Sidebar from "@/components/Sidebar_dokter";
import Header from "@/components/Header";

// ── Types ─────────────────────────────────────────────────────────────────────

type BookingStatus = "Selesai" | "Diproses" | "Menunggu" | "Dibatalkan";

interface LayananItem {
  id_layanan:         number;
  nama_layanan:       string;
  kategori:           string;
  harga_saat_booking: number;
}

interface Booking {
  id:              number;
  no_booking:      string;
  no_antrian:      number;
  tanggal_booking: string;
  jam:             string;
  status:          BookingStatus;
  catatan:         string | null;
  nama_pemilik:    string;
  no_hp:           string;
  nama_hewan:      string;
  jenis_hewan:     string;
  ras_hewan:       string;
  foto_hewan:      string | null;
  tanggal_jadwal:  string;
  jam_mulai:       string;
  jam_selesai:     string;
  layanans:        LayananItem[];
}

// ── Constants ─────────────────────────────────────────────────────────────────

const G              = "#2e7d32";
const API            = "http://127.0.0.1:8000/api";
const STORAGE_URL    = "http://127.0.0.1:8000/storage/";
const ITEMS_PER_PAGE = 7;
const ALL_STATUSES: BookingStatus[] = ["Menunggu", "Diproses", "Selesai", "Dibatalkan"];

const statusStyle: Record<BookingStatus, { bg: string; color: string; border: string }> = {
  Selesai:    { bg: "#e8f5e9", color: "#2e7d32", border: "#2e7d3230" },
  Diproses:   { bg: "#e3f2fd", color: "#1565c0", border: "#1565c030" },
  Menunggu:   { bg: "#fff8e1", color: "#e65100", border: "#e6510030" },
  Dibatalkan: { bg: "#ffebee", color: "#c62828", border: "#c6282830" },
};

const fallbackStyle  = { bg: "#f5f5f5", color: "#555", border: "#55555530" };
const getStatusStyle = (v: string) => statusStyle[v as BookingStatus] ?? fallbackStyle;

function normalizeStatus(raw: string): BookingStatus {
  const map: Record<string, BookingStatus> = {
    menunggu: "Menunggu", diproses: "Diproses",
    selesai: "Selesai",   dibatalkan: "Dibatalkan",
  };
  return map[raw?.toLowerCase()] ?? (raw as BookingStatus) ?? "Menunggu";
}

// ✅ Normalisasi URL foto — handle path relatif dari Laravel storage
function normalizeFotoUrl(foto: string | null): string | null {
  if (!foto) return null;
  if (foto.startsWith("http://") || foto.startsWith("https://")) return foto;
  return STORAGE_URL + foto.replace(/^\//, "");
}

const speciesEmoji: Record<string, string> = {
  Kucing: "🐱", Anjing: "🐕", Kelinci: "🐇", Burung: "🐦", Hamster: "🐹",
};

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "10px 12px", borderRadius: 8,
  border: "1.5px solid #e0e0e0", fontSize: 14, fontFamily: "inherit",
  outline: "none", boxSizing: "border-box", background: "#fff", color: "#333",
};

const labelStyle: React.CSSProperties = { fontSize: 14, display: "block", marginBottom: 6 };

// ── Foto Hewan ────────────────────────────────────────────────────────────────

// ✅ Komponen dengan onError fallback ke emoji kalau gambar gagal load
function FotoHewan({ foto, nama, jenis, size = 38 }: {
  foto: string | null; nama: string; jenis: string; size?: number;
}) {
  const [imgError, setImgError] = useState(false);
  const fotoUrl = normalizeFotoUrl(foto);
  const emoji   = speciesEmoji[jenis] ?? "🐾";
  const radius  = size > 44 ? 12 : 10;

  if (fotoUrl && !imgError) {
    return (
      <img
        src={fotoUrl}
        alt={nama}
        style={{ width: size, height: size, objectFit: "cover", borderRadius: radius, display: "block" }}
        onError={() => setImgError(true)}
      />
    );
  }

  return (
    <div style={{
      width: size, height: size, borderRadius: radius,
      background: "#e8f5e9", display: "flex",
      alignItems: "center", justifyContent: "center",
      fontSize: size * 0.48,
    }}>
      {emoji}
    </div>
  );
}

// ── Status Badge ──────────────────────────────────────────────────────────────

function StatusBadge({ value }: { value: string }) {
  const st = getStatusStyle(value);
  return (
    <span style={{
      display: "inline-block", padding: "4px 12px", borderRadius: 20,
      fontSize: 12, background: st.bg, color: st.color,
      border: `1.5px solid ${st.border}`, whiteSpace: "nowrap",
    }}>
      {value ?? "-"}
    </span>
  );
}

// ── Status Dropdown ───────────────────────────────────────────────────────────

function StatusDropdown({ value, onChange }: {
  value: BookingStatus; onChange: (s: BookingStatus) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const st  = getStatusStyle(value);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} style={{ position: "relative", display: "inline-block" }}>
      <button onClick={() => setOpen(o => !o)} style={{
        display: "inline-flex", alignItems: "center", gap: 6,
        padding: "5px 12px", borderRadius: 20, background: st.bg,
        color: st.color, border: `1.5px solid ${st.border}`,
        fontSize: 12, cursor: "pointer", fontFamily: "inherit",
      }}>
        {value} <ChevronDown size={11} style={{ opacity: 0.7 }} />
      </button>
      {open && (
        <div style={{
          position: "absolute", top: "calc(100% + 6px)", left: 0, zIndex: 100,
          background: "#fff", border: "1.5px solid #e0e0e0", borderRadius: 10,
          boxShadow: "0 4px 16px rgba(0,0,0,0.10)", overflow: "hidden", minWidth: 152,
        }}>
          {ALL_STATUSES.map(s => {
            const ss = getStatusStyle(s);
            return (
              <button key={s} onClick={() => { onChange(s); setOpen(false); }} style={{
                display: "flex", alignItems: "center", width: "100%",
                padding: "9px 14px", background: s === value ? "#f5f5f5" : "transparent",
                border: "none", cursor: "pointer", fontSize: 13,
                color: ss.color, fontFamily: "inherit", textAlign: "left",
              }}>
                {s}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Detail Modal ──────────────────────────────────────────────────────────────

function DetailModal({ booking, onClose, onStatusChange }: {
  booking: Booking; onClose: () => void;
  onStatusChange: (id: number, status: BookingStatus) => void;
}) {
  const [saving,      setSaving]      = useState(false);
  const [localStatus, setLocalStatus] = useState<BookingStatus>(booking.status);

  const handleSave = async () => {
    setSaving(true);
    await onStatusChange(booking.id, localStatus);
    setSaving(false);
    onClose();
  };

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.35)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 999 }}>
      <div onClick={e => e.stopPropagation()} style={{ background: "#fff", borderRadius: 16, padding: "28px 32px", width: 500, boxShadow: "0 8px 32px rgba(0,0,0,0.18)", fontFamily: "inherit", maxHeight: "90vh", overflowY: "auto" }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <div>
            <h2 style={{ fontSize: 18, margin: 0, fontWeight: "normal" }}>Detail Booking</h2>
            <p style={{ margin: "4px 0 0", fontSize: 12, color: "#888" }}>Informasi lengkap reservasi layanan</p>
          </div>
          <button onClick={onClose} style={{ border: "none", background: "none", cursor: "pointer", color: "#999", display: "flex", alignItems: "center" }}>
            <X size={18} />
          </button>
        </div>

        {/* No Booking + No Antrian */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ padding: "12px 16px", borderRadius: 10, background: "#f0faf2", border: "1.5px solid #c8e6c9", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <span style={{ fontSize: 11, color: "#888", display: "block", marginBottom: 2 }}>No. Booking</span>
              <span style={{ fontSize: 14, color: G, fontWeight: 600 }}>{booking.no_booking}</span>
            </div>
            {/* ✅ No. Antrian di modal */}
            <div style={{ textAlign: "center", background: G, borderRadius: 10, padding: "8px 20px" }}>
              <span style={{ fontSize: 10, color: "#c8e6c9", display: "block" }}>No. Antrian</span>
              <span style={{ fontSize: 26, color: "#fff", fontWeight: 800, lineHeight: 1.1 }}>
                {String(booking.no_antrian ?? 0).padStart(3, "0")}
              </span>
            </div>
          </div>
        </div>

        {/* Pet Info */}
        <div style={{ display: "flex", alignItems: "center", gap: 14, background: "#f9f9f9", border: "1.5px solid #e0e0e0", borderRadius: 12, padding: "14px 16px", marginBottom: 16 }}>
          <FotoHewan foto={booking.foto_hewan} nama={booking.nama_hewan} jenis={booking.jenis_hewan} size={52} />
          <div>
            <div style={{ fontSize: 15, fontWeight: 600 }}>{booking.nama_hewan}</div>
            <div style={{ fontSize: 13, color: "#888", marginTop: 2 }}>{booking.ras_hewan} · {booking.jenis_hewan}</div>
          </div>
        </div>

        {/* Detail Rows */}
        <div style={{ display: "flex", flexDirection: "column" }}>
          {[
            { label: "Pemilik",         value: booking.nama_pemilik },
            { label: "No. HP",          value: booking.no_hp },
            { label: "Tanggal Booking", value: booking.tanggal_booking },
            { label: "Jam",             value: booking.jam },
            { label: "Jadwal Dokter",   value: `${booking.tanggal_jadwal} (${booking.jam_mulai} - ${booking.jam_selesai})` },
            { label: "Catatan",         value: booking.catatan || "-" },
          ].map(({ label, value }) => (
            <div key={label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid #f0f0f0" }}>
              <span style={{ fontSize: 13, color: "#888" }}>{label}</span>
              <span style={{ fontSize: 13, color: "#333", maxWidth: 280, textAlign: "right" }}>{value}</span>
            </div>
          ))}

          {/* Layanan */}
          <div style={{ padding: "10px 0", borderBottom: "1px solid #f0f0f0" }}>
            <span style={{ fontSize: 13, color: "#888", display: "block", marginBottom: 8 }}>Layanan</span>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {booking.layanans?.length > 0
                ? booking.layanans.map(l => (
                  <div key={l.id_layanan} style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                    <span style={{ color: "#333" }}>{l.nama_layanan}</span>
                    <span style={{ color: G, fontWeight: 600 }}>Rp {Number(l.harga_saat_booking).toLocaleString("id-ID")}</span>
                  </div>
                ))
                : <span style={{ fontSize: 13, color: "#aaa" }}>-</span>}
            </div>
          </div>

          {/* Status */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0" }}>
            <span style={{ fontSize: 13, color: "#888" }}>Status</span>
            <StatusDropdown value={localStatus} onChange={setLocalStatus} />
          </div>
        </div>

        {/* Footer */}
        <div style={{ display: "flex", gap: 12, justifyContent: "flex-end", marginTop: 20 }}>
          <button onClick={onClose} style={{ padding: "10px 26px", borderRadius: 8, border: `1.5px solid ${G}`, background: "#fff", color: G, fontSize: 14, cursor: "pointer", fontFamily: "inherit" }}>
            Batal
          </button>
          <button onClick={handleSave} disabled={saving} style={{ padding: "10px 26px", borderRadius: 8, border: "none", background: saving ? "#a5d6a7" : G, color: "#fff", fontSize: 14, cursor: saving ? "not-allowed" : "pointer", fontFamily: "inherit" }}>
            {saving ? "Menyimpan..." : "Simpan"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Summary Card ──────────────────────────────────────────────────────────────

function SummaryCard({ icon, label, value, sub, iconBg }: {
  icon: React.ReactNode; label: string; value: number; sub: string; iconBg: string;
}) {
  return (
    <div style={{ background: "#fff", border: "1.5px solid #e0e0e0", borderRadius: 14, padding: "20px", display: "flex", alignItems: "center", gap: 16, boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
      <div style={{ width: 48, height: 48, borderRadius: "50%", background: iconBg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{icon}</div>
      <div>
        <div style={{ fontSize: 12, color: "#888", marginBottom: 2 }}>{label}</div>
        <div style={{ fontSize: 24, color: "#1a1a1a", lineHeight: 1.1 }}>{value}</div>
        <div style={{ fontSize: 12, color: "#aaa", marginTop: 2 }}>{sub}</div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function DataBookingPage() {
  const [bookings,      setBookings]      = useState<Booking[]>([]);
  const [loading,       setLoading]       = useState(true);
  const [error,         setError]         = useState("");
  const [filterPemilik, setFilterPemilik] = useState("");
  const [filterTanggal, setFilterTanggal] = useState("");
  const [filterStatus,  setFilterStatus]  = useState("");
  const [currentPage,   setCurrentPage]   = useState(1);
  const [detailBooking, setDetailBooking] = useState<Booking | null>(null);

  const token   = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const headers = { "Authorization": `Bearer ${token ?? ""}`, "Content-Type": "application/json" };

  useEffect(() => {
    fetch(`${API}/dokter/booking`, { headers })
      .then(res => res.json())
      .then(data => {
        if (data.success && Array.isArray(data.data)) {
          setBookings(data.data.map((b: any) => ({ ...b, status: normalizeStatus(b.status) })));
        } else {
          setError(data.message ?? "Gagal memuat data booking");
        }
        setLoading(false);
      })
      .catch(() => { setError("Gagal memuat data booking."); setLoading(false); });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleStatusChange = async (id: number, status: BookingStatus) => {
    try {
      const res  = await fetch(`${API}/dokter/booking/${id}/status`, {
        method: "PATCH", headers, body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (data.success) {
        setBookings(prev => prev.map(b => b.id === id ? { ...b, status } : b));
        setDetailBooking(prev => prev?.id === id ? { ...prev, status } : prev);
      } else {
        setError(data.message ?? "Gagal update status");
      }
    } catch { setError("Gagal update status booking"); }
  };

  const filtered = bookings.filter(b =>
    (filterPemilik === "" || b.nama_pemilik.toLowerCase().includes(filterPemilik.toLowerCase())) &&
    (filterTanggal === "" || b.tanggal_booking.includes(filterTanggal)) &&
    (filterStatus  === "" || b.status === filterStatus)
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const paginated  = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  useEffect(() => { setCurrentPage(1); }, [filterPemilik, filterTanggal, filterStatus]);

  const totalBooking = bookings.length;
  const menunggu     = bookings.filter(b => b.status === "Menunggu").length;
  const dijadwalkan  = bookings.filter(b => b.status === "Diproses").length;

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden" }}>
      <Sidebar activePage="booking" />

      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "auto", background: "#f9f9f9" }}>
        <Header title="Data Booking" subtitle="Semua permintaan booking layanan klinik" />

        <div style={{ padding: "24px 28px" }}>

          {error && (
            <div style={{ background: "#ffebee", border: "1px solid #ffcdd2", borderRadius: 8, padding: "10px 14px", marginBottom: 16, fontSize: 13, color: "#c62828" }}>
              {error}
            </div>
          )}

          {/* Summary Cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 24 }}>
            <SummaryCard iconBg="#e8f5e9" label="Total Booking" value={totalBooking} sub="Reservasi layanan"
              icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={G} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>} />
            <SummaryCard iconBg="#fff8e1" label="Menunggu" value={menunggu} sub="Belum dikonfirmasi"
              icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#e65100" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>} />
            <SummaryCard iconBg="#e3f2fd" label="Diproses" value={dijadwalkan} sub="Sedang ditangani"
              icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1565c0" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>} />
          </div>

          {/* Filter */}
          <div style={{ background: "#fff", border: "1.5px solid #e0e0e0", borderRadius: 14, padding: "20px", marginBottom: 20, boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
              <div>
                <label style={labelStyle}>Nama Pemilik</label>
                <input style={inputStyle} placeholder="Cari nama pemilik..." value={filterPemilik} onChange={e => setFilterPemilik(e.target.value)} />
              </div>
              <div>
                <label style={labelStyle}>Tanggal Booking</label>
                <input style={inputStyle} placeholder="contoh: 2026-05-01" value={filterTanggal} onChange={e => setFilterTanggal(e.target.value)} />
              </div>
              <div>
                <label style={labelStyle}>Status Booking</label>
                <select style={inputStyle} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
                  <option value="">Semua Status</option>
                  {ALL_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* Table */}
          <div style={{ background: "#fff", border: "1.5px solid #e0e0e0", borderRadius: 14, overflow: "hidden", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
            {loading ? (
              <div style={{ padding: 40, textAlign: "center", color: "#888" }}>Memuat data booking...</div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ background: G }}>
                      {/* ✅ Kolom No. Antrian ditambahkan */}
                      {["No. Antrian", "No. Booking", "Hewan", "Pemilik", "Tanggal", "Jam", "Layanan", "Status", "Aksi"].map(h => (
                        <th key={h} style={{ padding: "12px 16px", fontSize: 13, fontWeight: "normal", color: "#fff", textAlign: "left", whiteSpace: "nowrap", fontFamily: "inherit" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {paginated.length === 0 ? (
                      <tr>
                        <td colSpan={9} style={{ padding: "48px", textAlign: "center", color: "#999", fontSize: 14 }}>
                          <div style={{ fontSize: 32, marginBottom: 8 }}>📋</div>
                          Tidak ada data booking
                        </td>
                      </tr>
                    ) : paginated.map(b => (
                      <tr key={b.id}
                        style={{ borderBottom: "1px solid #f0f0f0" }}
                        onMouseEnter={e => (e.currentTarget.style.background = "#f9f9f9")}
                        onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                      >
                        {/* ✅ No. Antrian */}
                        <td style={{ padding: "10px 16px" }}>
                          <div style={{
                            width: 40, height: 40, borderRadius: 8,
                            background: G, color: "#fff",
                            display: "flex", alignItems: "center",
                            justifyContent: "center", fontSize: 13, fontWeight: 700,
                          }}>
                            {String(b.no_antrian ?? 0).padStart(3, "0")}
                          </div>
                        </td>

                        {/* No Booking */}
                        <td style={{ padding: "10px 16px" }}>
                          <span style={{ fontSize: 12, color: G, background: "#f0faf2", padding: "3px 8px", borderRadius: 6, border: "1px solid #c8e6c9", whiteSpace: "nowrap" }}>
                            {b.no_booking}
                          </span>
                        </td>

                        {/* ✅ Hewan — pakai FotoHewan dengan fallback */}
                        <td style={{ padding: "10px 16px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <div style={{ width: 38, height: 38, borderRadius: 10, overflow: "hidden", flexShrink: 0 }}>
                              <FotoHewan foto={b.foto_hewan} nama={b.nama_hewan} jenis={b.jenis_hewan} size={38} />
                            </div>
                            <div>
                              <div style={{ fontSize: 13 }}>{b.nama_hewan}</div>
                              <div style={{ fontSize: 12, color: "#888", marginTop: 1 }}>{b.ras_hewan}</div>
                            </div>
                          </div>
                        </td>

                        <td style={{ padding: "10px 16px", fontSize: 14 }}>{b.nama_pemilik}</td>
                        <td style={{ padding: "10px 16px", fontSize: 13 }}>{b.tanggal_booking}</td>
                        <td style={{ padding: "10px 16px", fontSize: 14 }}>{b.jam}</td>

                        <td style={{ padding: "10px 16px", fontSize: 13, maxWidth: 180 }}>
                          {b.layanans?.length > 0 ? b.layanans.map(l => l.nama_layanan).join(", ") : "-"}
                        </td>

                        <td style={{ padding: "10px 16px" }}>
                          <StatusBadge value={b.status} />
                        </td>

                        <td style={{ padding: "10px 16px" }}>
                          <button
                            onClick={() => setDetailBooking(b)}
                            style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "8px 14px", borderRadius: 8, border: `1.5px solid ${G}`, background: "#fff", color: G, fontSize: 13, cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap" }}
                            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = G; (e.currentTarget as HTMLButtonElement).style.color = "#fff"; }}
                            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "#fff"; (e.currentTarget as HTMLButtonElement).style.color = G; }}
                          >
                            <Eye size={13} /> Detail
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "16px", borderTop: "1.5px solid #e0e0e0" }}>
              <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}
                style={{ padding: "8px 16px", borderRadius: 8, border: "1.5px solid #e0e0e0", background: "#fff", color: "#555", fontSize: 13, cursor: currentPage === 1 ? "not-allowed" : "pointer", opacity: currentPage === 1 ? 0.4 : 1, fontFamily: "inherit" }}>
                ← Sebelumnya
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                <button key={p} onClick={() => setCurrentPage(p)}
                  style={{ width: 36, height: 36, borderRadius: 8, border: p === currentPage ? "none" : "1.5px solid #e0e0e0", background: p === currentPage ? G : "#fff", color: p === currentPage ? "#fff" : "#555", fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>
                  {p}
                </button>
              ))}
              <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)}
                style={{ padding: "8px 16px", borderRadius: 8, border: "1.5px solid #e0e0e0", background: "#fff", color: "#555", fontSize: 13, cursor: currentPage === totalPages ? "not-allowed" : "pointer", opacity: currentPage === totalPages ? 0.4 : 1, fontFamily: "inherit" }}>
                Berikutnya →
              </button>
            </div>
          </div>

        </div>
      </div>

      {detailBooking && (
        <DetailModal
          booking={detailBooking}
          onClose={() => setDetailBooking(null)}
          onStatusChange={handleStatusChange}
        />
      )}
    </div>
  );
}