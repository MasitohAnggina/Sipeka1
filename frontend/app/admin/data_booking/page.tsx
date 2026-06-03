"use client";

import { useState, useEffect, useRef } from "react";
import { Eye, ChevronDown, X, RotateCcw, Bell } from "lucide-react";
import Sidebar from "@/components/Sidebar_admin";
import Header from "@/components/Header";

// ── Types ─────────────────────────────────────────────────────────────────────

type BookingStatus = "menunggu" | "dikonfirmasi" | "berlangsung" | "selesai" | "dibatalkan";

interface LayananItem {
  id_layanan:         number;
  nama_layanan:       string;
  kategori:           string;
  harga_saat_booking: number;
}

interface Booking {
  id:               number;
  no_booking:       string;
  no_antrian:       number;
  tanggal_booking:  string;
  tanggal_dibuat:   string;
  jam:              string;
  status:           BookingStatus;
  catatan:          string | null;
  can_edit_status:  boolean;
  nama_pemilik:     string;
  no_hp:            string;
  nama_hewan:       string;
  jenis_hewan:      string;
  ras_hewan:        string;
  foto_hewan:       string | null;
  tanggal_jadwal:   string;
  jam_mulai:        string;
  jam_selesai:      string;
  nama_dokter:      string;
  layanans:         LayananItem[];
}

interface Summary {
  total:        number;
  menunggu:     number;
  dikonfirmasi: number;
  berlangsung:  number;
  selesai:      number;
  dibatalkan:   number;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const G              = "#2e7d32";
const API            = "http://127.0.0.1:8000/api";
const STORAGE_URL    = "http://127.0.0.1:8000/storage/";
const ITEMS_PER_PAGE = 7;

const ADMIN_STATUSES: BookingStatus[] = ["menunggu", "dikonfirmasi", "dibatalkan"];
const ALL_STATUSES:   BookingStatus[] = ["menunggu", "dikonfirmasi", "berlangsung", "selesai", "dibatalkan"];

const STATUS_LABEL: Record<BookingStatus, string> = {
  menunggu:     "Menunggu",
  dikonfirmasi: "Dikonfirmasi",
  berlangsung:  "Berlangsung",
  selesai:      "Selesai",
  dibatalkan:   "Dibatalkan",
};

const statusStyle: Record<BookingStatus, { bg: string; color: string; border: string }> = {
  menunggu:     { bg: "#fff8e1", color: "#e65100", border: "#e6510030" },
  dikonfirmasi: { bg: "#e3f2fd", color: "#1565c0", border: "#1565c030" },
  berlangsung:  { bg: "#f3e5f5", color: "#6a1b9a", border: "#6a1b9a30" },
  selesai:      { bg: "#e8f5e9", color: "#2e7d32", border: "#2e7d3230" },
  dibatalkan:   { bg: "#ffebee", color: "#c62828", border: "#c6282830" },
};

const speciesEmoji: Record<string, string> = {
  Kucing: "🐱", Anjing: "🐕", Kelinci: "🐇", Burung: "🐦", Hamster: "🐹",
};

const LAYANAN_OPTIONS = ["Vaksinasi", "Sterilisasi", "Grooming", "Operasi", "Pemeriksaan", "Konsultasi"];

// ── Shared Styles ─────────────────────────────────────────────────────────────

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "10px 12px", borderRadius: 8,
  border: "1.5px solid #e0e0e0", fontSize: 14, fontFamily: "inherit",
  outline: "none", boxSizing: "border-box", background: "#fff", color: "#333",
};

const labelStyle: React.CSSProperties = { fontSize: 14, display: "block", marginBottom: 6 };

// ── Helpers ───────────────────────────────────────────────────────────────────

function normalizeFotoUrl(foto: string | null): string | null {
  if (!foto) return null;
  if (foto.startsWith("http://") || foto.startsWith("https://")) return foto;
  return STORAGE_URL + foto.replace(/^\//, "");
}

function isPetHotelBooking(layanans: LayananItem[]): boolean {
  return layanans.some(l =>
    l.nama_layanan.toLowerCase().includes("hotel") ||
    l.kategori.toLowerCase().includes("hotel") ||
    l.kategori.toLowerCase().includes("rawat inap")
  );
}

// ── Foto Hewan ────────────────────────────────────────────────────────────────

function FotoHewan({ foto, nama, jenis, size = 38 }: {
  foto: string | null; nama: string; jenis: string; size?: number;
}) {
  const [imgError, setImgError] = useState(false);
  const fotoUrl = normalizeFotoUrl(foto);
  const emoji   = speciesEmoji[jenis] ?? "🐾";
  const radius  = size > 44 ? 12 : 10;

  if (fotoUrl && !imgError) {
    return (
      <img src={fotoUrl} alt={nama}
        style={{ width: size, height: size, objectFit: "cover", borderRadius: radius, display: "block" }}
        onError={() => setImgError(true)}
      />
    );
  }
  return (
    <div style={{ width: size, height: size, borderRadius: radius, background: "#e8f5e9", display: "flex", alignItems: "center", justifyContent: "center", fontSize: size * 0.48 }}>
      {emoji}
    </div>
  );
}

// ── Status Badge ──────────────────────────────────────────────────────────────

function StatusBadge({ value }: { value: BookingStatus }) {
  const st = statusStyle[value];
  return (
    <span style={{ display: "inline-block", padding: "4px 12px", borderRadius: 20, fontSize: 12, background: st.bg, color: st.color, border: `1.5px solid ${st.border}`, whiteSpace: "nowrap" }}>
      {STATUS_LABEL[value]}
    </span>
  );
}

// ── Status Dropdown ───────────────────────────────────────────────────────────

function StatusDropdown({ value, onChange, disabled }: {
  value:    BookingStatus;
  onChange: (s: BookingStatus) => void;
  disabled: boolean;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const st  = statusStyle[value];

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  if (disabled) {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <StatusBadge value={value} />
        <span style={{ fontSize: 11, color: "#aaa" }}>dikelola dokter</span>
      </div>
    );
  }

  return (
    <div ref={ref} style={{ position: "relative", display: "inline-block" }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "5px 12px", borderRadius: 20, background: st.bg, color: st.color, border: `1.5px solid ${st.border}`, fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}
      >
        {STATUS_LABEL[value]}
        <ChevronDown size={11} style={{ opacity: 0.7 }} />
      </button>

      {open && (
        <div style={{ position: "absolute", top: "calc(100% + 6px)", left: 0, zIndex: 100, background: "#fff", border: "1.5px solid #e0e0e0", borderRadius: 10, boxShadow: "0 4px 16px rgba(0,0,0,0.10)", overflow: "hidden", minWidth: 160 }}>
          {ADMIN_STATUSES.map(s => {
            const ss     = statusStyle[s];
            const active = s === value;
            return (
              <button key={s} onClick={() => { onChange(s); setOpen(false); }}
                style={{ display: "flex", alignItems: "center", width: "100%", padding: "9px 14px", background: active ? "#f5f5f5" : "transparent", border: "none", cursor: "pointer", fontSize: 13, color: ss.color, fontFamily: "inherit", textAlign: "left" }}
              >
                {STATUS_LABEL[s]}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Detail Modal ──────────────────────────────────────────────────────────────

function DetailModal({ booking, token, onClose, onStatusChange, saving }: {
  booking:        Booking;
  token:          string;
  onClose:        () => void;
  onStatusChange: (id: number, status: BookingStatus) => void;
  saving:         boolean;
}) {
  const [localStatus,  setLocalStatus]  = useState<BookingStatus>(booking.status);

  // ── State notifikasi terpisah per tipe ────────────────────────────────────
  const [notifSending, setNotifSending] = useState<"" | "wa" | "email">("");
  const [waMsg,        setWaMsg]        = useState("");
  const [waError,      setWaError]      = useState(false);
  const [emailMsg,     setEmailMsg]     = useState("");
  const [emailError,   setEmailError]   = useState(false);

  const isDirty        = localStatus !== booking.status;
  const bisaKirimNotif = isPetHotelBooking(booking.layanans) && booking.status === "selesai";

  const headers = {
    "Authorization": `Bearer ${token}`,
    "Content-Type":  "application/json",
  };

  // ── Handler kirim notif ───────────────────────────────────────────────────
  const handleKirimNotif = async (tipe: "wa" | "email") => {
    setNotifSending(tipe);
    if (tipe === "wa")    { setWaMsg("");    setWaError(false); }
    if (tipe === "email") { setEmailMsg(""); setEmailError(false); }

    try {
      const res  = await fetch(`${API}/admin/booking/${booking.id}/notif-hotel/${tipe}`, {
        method: "POST",
        headers,
      });
      const data = await res.json();

      if (tipe === "wa") {
        setWaMsg(data.message ?? "");
        setWaError(!data.success);
      } else {
        setEmailMsg(data.message ?? "");
        setEmailError(!data.success);
      }
    } catch {
      if (tipe === "wa") { setWaMsg("Gagal terhubung ke server."); setWaError(true); }
      else               { setEmailMsg("Gagal terhubung ke server."); setEmailError(true); }
    } finally {
      setNotifSending("");
    }
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

        {/* No Booking & Antrian */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ padding: "12px 16px", borderRadius: 10, background: "#f0faf2", border: "1.5px solid #c8e6c9", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <span style={{ fontSize: 11, color: "#888", display: "block", marginBottom: 2 }}>No. Booking</span>
              <span style={{ fontSize: 14, color: G, fontWeight: 600 }}>{booking.no_booking}</span>
            </div>
            <div style={{ textAlign: "center", background: G, borderRadius: 10, padding: "8px 20px" }}>
              <span style={{ fontSize: 10, color: "#c8e6c9", display: "block" }}>No. Antrian</span>
              <span style={{ fontSize: 26, color: "#fff", fontWeight: 800, lineHeight: 1.1 }}>
                {String(booking.no_antrian ?? 0).padStart(3, "0")}
              </span>
            </div>
          </div>
        </div>

        {/* Hewan Info */}
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
            { label: "Tanggal Dibuat",  value: booking.tanggal_dibuat },
            { label: "Jam",             value: booking.jam },
            { label: "Dokter",          value: booking.nama_dokter },
            { label: "Jadwal",          value: `${booking.tanggal_jadwal} (${booking.jam_mulai} - ${booking.jam_selesai})` },
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

          {/* Status Row */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0", borderBottom: bisaKirimNotif ? "1px solid #f0f0f0" : "none" }}>
            <span style={{ fontSize: 13, color: "#888" }}>Status</span>
            <StatusDropdown
              value={localStatus}
              onChange={setLocalStatus}
              disabled={!booking.can_edit_status}
            />
          </div>

          {/* ── Notifikasi Pet Hotel ───────────────────────────────────────── */}
          {bisaKirimNotif && (
            <div style={{ paddingTop: 16 }}>

              {/* Label seksi */}
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 14 }}>
                <Bell size={13} color="#2e7d32" />
                <span style={{ fontSize: 13, color: "#2e7d32", fontWeight: 600 }}>Notifikasi Penjemputan</span>
                <span style={{ fontSize: 11, color: "#aaa", marginLeft: 4 }}>· Pet Hotel</span>
              </div>

              {/* Tombol WhatsApp */}
              <div style={{ marginBottom: 10 }}>
                {waMsg && (
                  <div style={{
                    background: waError ? "#fff3e0" : "#f0faf2",
                    border: `1px solid ${waError ? "#ffe0b2" : "#c8e6c9"}`,
                    borderRadius: 7, padding: "8px 12px", marginBottom: 8, fontSize: 12,
                    color: waError ? "#e65100" : "#2e7d32",
                  }}>
                    {waMsg}
                  </div>
                )}
                <button
                  disabled={notifSending === "wa"}
                  onClick={() => handleKirimNotif("wa")}
                  style={{
                    width: "100%", padding: "11px", borderRadius: 8,
                    border: "1.5px solid #25d366",
                    background: notifSending === "wa" ? "#f5f5f5" : "#e8fdf0",
                    color: notifSending === "wa" ? "#aaa" : "#128c3e",
                    fontSize: 13, cursor: notifSending === "wa" ? "not-allowed" : "pointer",
                    fontFamily: "inherit",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                  }}
                >
                  📱 {notifSending === "wa" ? "Mengirim WhatsApp..." : "Kirim via WhatsApp"}
                </button>
              </div>

              {/* Tombol Email */}
              <div>
                {emailMsg && (
                  <div style={{
                    background: emailError ? "#fff3e0" : "#f0faf2",
                    border: `1px solid ${emailError ? "#ffe0b2" : "#c8e6c9"}`,
                    borderRadius: 7, padding: "8px 12px", marginBottom: 8, fontSize: 12,
                    color: emailError ? "#e65100" : "#2e7d32",
                  }}>
                    {emailMsg}
                  </div>
                )}
                <button
                  disabled={notifSending === "email"}
                  onClick={() => handleKirimNotif("email")}
                  style={{
                    width: "100%", padding: "11px", borderRadius: 8,
                    border: "1.5px solid #1565c0",
                    background: notifSending === "email" ? "#f5f5f5" : "#e3f2fd",
                    color: notifSending === "email" ? "#aaa" : "#1565c0",
                    fontSize: 13, cursor: notifSending === "email" ? "not-allowed" : "pointer",
                    fontFamily: "inherit",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                  }}
                >
                  📧 {notifSending === "email" ? "Mengirim Email..." : "Kirim via Email"}
                </button>
              </div>

              <p style={{ fontSize: 11, color: "#aaa", textAlign: "center", margin: "8px 0 0" }}>
                Notifikasi dikirim ke pemilik hewan
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 20 }}>
          <button onClick={onClose}
            style={{ padding: "10px 20px", borderRadius: 8, border: "1.5px solid #e0e0e0", background: "#fff", color: "#666", fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>
            Batal
          </button>
          {booking.can_edit_status && (
            <button
              disabled={!isDirty || saving}
              onClick={() => onStatusChange(booking.id, localStatus)}
              style={{ padding: "10px 24px", borderRadius: 8, border: "none", background: isDirty && !saving ? G : "#ccc", color: "#fff", fontSize: 13, cursor: isDirty && !saving ? "pointer" : "not-allowed", fontFamily: "inherit" }}
            >
              {saving ? "Menyimpan..." : "Simpan"}
            </button>
          )}
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
  const [summary,       setSummary]       = useState<Summary | null>(null);
  const [loading,       setLoading]       = useState(true);
  const [error,         setError]         = useState("");
  const [saving,        setSaving]        = useState(false);

  const [filterPemilik, setFilterPemilik] = useState("");
  const [filterTanggal, setFilterTanggal] = useState("");
  const [filterLayanan, setFilterLayanan] = useState("");
  const [filterStatus,  setFilterStatus]  = useState("");

  const [currentPage,   setCurrentPage]   = useState(1);
  const [detailBooking, setDetailBooking] = useState<Booking | null>(null);

  const token   = typeof window !== "undefined" ? (sessionStorage.getItem("token") ?? "") : "";
  const headers = { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" };

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      try {
        const [resSummary, resBooking] = await Promise.all([
          fetch(`${API}/admin/booking/summary`, { headers }),
          fetch(`${API}/admin/booking`,         { headers }),
        ]);
        const dataSummary = await resSummary.json();
        const dataBooking = await resBooking.json();
        if (dataSummary.success) setSummary(dataSummary.data);
        if (dataBooking.success && Array.isArray(dataBooking.data)) {
          const sorted = [...dataBooking.data].sort((a, b) => {
            const dateDiff = new Date(b.tanggal_booking).getTime() - new Date(a.tanggal_booking).getTime();
            return dateDiff !== 0 ? dateDiff : b.id - a.id;
          });
          setBookings(sorted);
        } else {
          setError(dataBooking.message ?? "Gagal memuat data booking");
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

  const handleStatusChange = async (id: number, status: BookingStatus) => {
    setSaving(true);
    try {
      const res  = await fetch(`${API}/admin/booking/${id}/status`, {
        method: "PATCH", headers,
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (data.success) {
        setBookings(prev => prev.map(b => b.id === id ? { ...b, status, can_edit_status: data.data.can_edit_status } : b));
        setSummary(prev => {
          if (!prev) return prev;
          const old = detailBooking?.status;
          if (!old || old === status) return prev;
          return { ...prev, [old]: Math.max(0, prev[old] - 1), [status]: prev[status] + 1 };
        });
        setDetailBooking(null);
      } else {
        setError(data.message ?? "Gagal mengubah status");
      }
    } catch {
      setError("Gagal mengubah status.");
    } finally {
      setSaving(false);
    }
  };

  const filtered = bookings.filter(b =>
    (filterPemilik === "" || b.nama_pemilik.toLowerCase().includes(filterPemilik.toLowerCase())) &&
    (filterTanggal === "" || b.tanggal_booking.includes(filterTanggal)) &&
    (filterLayanan === "" || b.layanans.some(l => l.nama_layanan === filterLayanan)) &&
    (filterStatus  === "" || b.status === filterStatus)
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const paginated  = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  useEffect(() => { setCurrentPage(1); }, [filterPemilik, filterTanggal, filterLayanan, filterStatus]);

  const isFilterChanged = filterPemilik !== "" || filterTanggal !== "" || filterLayanan !== "" || filterStatus !== "";

  const handleResetFilter = () => {
    setFilterPemilik(""); setFilterTanggal(""); setFilterLayanan(""); setFilterStatus("");
  };

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden" }}>
      <Sidebar activePage="booking" />

      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "auto", background: "#f9f9f9" }}>
        <Header title="Data Booking" subtitle="Semua permintaan booking layanan klinik" />

        <div style={{ padding: "24px 28px" }}>

          {error && (
            <div style={{ background: "#ffebee", border: "1px solid #ffcdd2", borderRadius: 8, padding: "10px 14px", marginBottom: 16, fontSize: 13, color: "#c62828" }}>
              {error}
              <button onClick={() => setError("")} style={{ marginLeft: 12, background: "none", border: "none", color: "#c62828", cursor: "pointer", fontSize: 13 }}>✕</button>
            </div>
          )}

          {/* Summary Cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 24 }}>
            <SummaryCard
              iconBg="#e8f5e9" label="Total Booking" value={summary?.total ?? 0} sub="Semua reservasi"
              icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={G} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>}
            />
            <SummaryCard
              iconBg="#fff8e1" label="Menunggu Konfirmasi" value={summary?.menunggu ?? 0} sub="Perlu ditindaklanjuti"
              icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#e65100" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>}
            />
            <SummaryCard
              iconBg="#e3f2fd" label="Dikonfirmasi" value={summary?.dikonfirmasi ?? 0} sub="Owner boleh datang"
              icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1565c0" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>}
            />
          </div>

          {/* Filter */}
          <div style={{ background: "#fff", border: "1.5px solid #e0e0e0", borderRadius: 14, padding: "20px", marginBottom: 20, boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
              <span style={{ fontSize: 13, color: "#888" }}>Filter</span>
              {isFilterChanged && (
                <button onClick={handleResetFilter}
                  style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "5px 10px", borderRadius: 7, border: "1.5px solid #e0e0e0", background: "#fff", color: "#888", fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>
                  <RotateCcw size={11} /> Reset filter
                </button>
              )}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14 }}>
              <div>
                <label style={labelStyle}>Nama Pemilik</label>
                <input style={inputStyle} placeholder="Cari nama pemilik..." value={filterPemilik} onChange={e => setFilterPemilik(e.target.value)} />
              </div>
              <div>
                <label style={labelStyle}>Tanggal Booking</label>
                <input style={inputStyle} type="date" value={filterTanggal} onChange={e => setFilterTanggal(e.target.value)} />
              </div>
              <div>
                <label style={labelStyle}>Layanan</label>
                <select style={inputStyle} value={filterLayanan} onChange={e => setFilterLayanan(e.target.value)}>
                  <option value="">Semua Layanan</option>
                  {LAYANAN_OPTIONS.map(l => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Status</label>
                <select style={inputStyle} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
                  <option value="">Semua Status</option>
                  {ALL_STATUSES.map(s => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
                </select>
              </div>
            </div>
          </div>

          <div style={{ marginBottom: 12, fontSize: 13, color: "#888" }}>
            {loading ? "Memuat data..." : `Menampilkan ${filtered.length} booking${isFilterChanged ? " (difilter)" : ""}`}
          </div>

          {/* Table */}
          <div style={{ background: "#fff", border: "1.5px solid #e0e0e0", borderRadius: 14, overflow: "hidden", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
            {loading ? (
              <div style={{ padding: 48, textAlign: "center", color: "#888" }}>Memuat data booking...</div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ background: G }}>
                      {["No. Antrian", "No. Booking", "Hewan", "Pemilik", "Tanggal Booking", "Jam", "Layanan", "Dokter", "Status", "Aksi"].map(h => (
                        <th key={h} style={{ padding: "12px 16px", fontSize: 13, fontWeight: "normal", color: "#fff", textAlign: "left", whiteSpace: "nowrap", fontFamily: "inherit" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {paginated.length === 0 ? (
                      <tr>
                        <td colSpan={10} style={{ padding: "48px", textAlign: "center", color: "#999", fontSize: 14 }}>
                          <div style={{ fontSize: 32, marginBottom: 8 }}>📋</div>
                          Tidak ada data yang sesuai filter
                        </td>
                      </tr>
                    ) : paginated.map(b => (
                      <tr key={b.id}
                        style={{ borderBottom: "1px solid #f0f0f0" }}
                        onMouseEnter={e => (e.currentTarget.style.background = "#f9f9f9")}
                        onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                      >
                        <td style={{ padding: "10px 16px" }}>
                          <div style={{ width: 40, height: 40, borderRadius: 8, background: G, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700 }}>
                            {String(b.no_antrian ?? 0).padStart(3, "0")}
                          </div>
                        </td>
                        <td style={{ padding: "10px 16px" }}>
                          <span style={{ fontSize: 12, color: G, background: "#f0faf2", padding: "3px 8px", borderRadius: 6, border: "1px solid #c8e6c9", whiteSpace: "nowrap" }}>
                            {b.no_booking}
                          </span>
                        </td>
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
                        <td style={{ padding: "10px 16px", fontSize: 13 }}>{b.nama_pemilik}</td>
                        <td style={{ padding: "10px 16px" }}>
                          <div style={{ fontSize: 13 }}>{b.tanggal_booking}</div>
                          <div style={{ fontSize: 12, color: "#aaa", marginTop: 1 }}>Dibuat: {b.tanggal_dibuat}</div>
                        </td>
                        <td style={{ padding: "10px 16px", fontSize: 13 }}>{b.jam}</td>
                        <td style={{ padding: "10px 16px", fontSize: 13, maxWidth: 150 }}>
                          {b.layanans?.length > 0 ? b.layanans.map(l => l.nama_layanan).join(", ") : "-"}
                        </td>
                        <td style={{ padding: "10px 16px", fontSize: 13, color: "#555" }}>{b.nama_dokter}</td>
                        <td style={{ padding: "10px 16px" }}>
                          <StatusBadge value={b.status} />
                        </td>
                        <td style={{ padding: "10px 16px" }}>
                          <button onClick={() => setDetailBooking(b)}
                            style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "7px 12px", borderRadius: 8, border: `1.5px solid ${G}`, background: "#fff", color: G, fontSize: 12, cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap" }}
                            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = G; (e.currentTarget as HTMLButtonElement).style.color = "#fff"; }}
                            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "#fff"; (e.currentTarget as HTMLButtonElement).style.color = G; }}
                          >
                            <Eye size={12} /> Detail
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {totalPages > 1 && (
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
            )}
          </div>

        </div>
      </div>

      {detailBooking && (
        <DetailModal
          booking={detailBooking}
          token={token}
          onClose={() => setDetailBooking(null)}
          onStatusChange={handleStatusChange}
          saving={saving}
        />
      )}
    </div>
  );
}