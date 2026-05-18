"use client";

import { useState, useEffect, useRef } from "react";
import { Eye, ChevronDown, X } from "lucide-react";
import Sidebar from "@/components/Sidebar_dokter";
import Header from "@/components/Header";

// ── Types ─────────────────────────────────────────────────────────────────────

type BookingStatus = "Selesai" | "Berlangsung" | "Dijadwalkan" | "Dibatalkan";

interface Booking {
  id: number;
  nomorBooking: string;
  tanggalBooking: string;
  tanggalDibuat: string;
  jam: string;
  hewan: string;
  fotoHewan?: string;
  jenisHewan: string;
  pemilik: string;
  jenis: string;
  layanan: string;
  status: BookingStatus;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const G = "#2e7d32";

const initialBookings: Booking[] = [
  { id: 1,  nomorBooking: "BK-2604-001", tanggalBooking: "1 Apr 2026",  tanggalDibuat: "28 Mar 2026", jam: "09:00", hewan: "Mochi",    jenisHewan: "Kucing",  pemilik: "Sari Dewi",      jenis: "Kucing Persia",    layanan: "Sterilisasi",  status: "Selesai" },
  { id: 2,  nomorBooking: "BK-2604-002", tanggalBooking: "1 Apr 2026",  tanggalDibuat: "28 Mar 2026", jam: "10:00", hewan: "Brownie",  jenisHewan: "Anjing",  pemilik: "Hendra K.",      jenis: "Anjing Beagle",    layanan: "Vaksinasi",    status: "Berlangsung" },
  { id: 3,  nomorBooking: "BK-2604-003", tanggalBooking: "1 Apr 2026",  tanggalDibuat: "29 Mar 2026", jam: "11:00", hewan: "Snowy",    jenisHewan: "Kelinci", pemilik: "Tika Rahma",     jenis: "Kelinci Rex",      layanan: "Pemeriksaan",  status: "Dijadwalkan" },
  { id: 4,  nomorBooking: "BK-2604-004", tanggalBooking: "1 Apr 2026",  tanggalDibuat: "29 Mar 2026", jam: "13:00", hewan: "Charlie",  jenisHewan: "Anjing",  pemilik: "Budi Santoso",   jenis: "Anjing Shih Tzu",  layanan: "Grooming",     status: "Dibatalkan" },
  { id: 5,  nomorBooking: "BK-2604-005", tanggalBooking: "2 Apr 2026",  tanggalDibuat: "30 Mar 2026", jam: "09:30", hewan: "Luna",     jenisHewan: "Kucing",  pemilik: "Rina Putri",     jenis: "Kucing Anggora",   layanan: "Operasi",      status: "Dijadwalkan" },
  { id: 6,  nomorBooking: "BK-2604-006", tanggalBooking: "2 Apr 2026",  tanggalDibuat: "30 Mar 2026", jam: "10:30", hewan: "Kacang",   jenisHewan: "Hamster", pemilik: "Dodi Firmansyah", jenis: "Hamster Teddy",   layanan: "Konsultasi",   status: "Dijadwalkan" },
  { id: 7,  nomorBooking: "BK-2604-007", tanggalBooking: "2 Apr 2026",  tanggalDibuat: "31 Mar 2026", jam: "14:00", hewan: "Max",      jenisHewan: "Anjing",  pemilik: "Yuli Astuti",    jenis: "Anjing Dalmatian", layanan: "Pemeriksaan",  status: "Dijadwalkan" },
  { id: 8,  nomorBooking: "BK-2604-008", tanggalBooking: "2 Apr 2026",  tanggalDibuat: "31 Mar 2026", jam: "15:00", hewan: "Pipit",    jenisHewan: "Burung",  pemilik: "Fajar Nugroho",  jenis: "Lovebird",         layanan: "Vaksinasi",    status: "Dijadwalkan" },
  { id: 9,  nomorBooking: "BK-2604-009", tanggalBooking: "3 Apr 2026",  tanggalDibuat: "1 Apr 2026",  jam: "08:00", hewan: "Oreo",     jenisHewan: "Kucing",  pemilik: "Nita Sari",      jenis: "Kucing Domestik",  layanan: "Sterilisasi",  status: "Selesai" },
  { id: 10, nomorBooking: "BK-2604-010", tanggalBooking: "3 Apr 2026",  tanggalDibuat: "1 Apr 2026",  jam: "10:00", hewan: "Gembul",   jenisHewan: "Kelinci", pemilik: "Wahyu Prasetyo", jenis: "Kelinci Lop",       layanan: "Grooming",     status: "Berlangsung" },
  { id: 11, nomorBooking: "BK-2604-011", tanggalBooking: "4 Apr 2026",  tanggalDibuat: "2 Apr 2026",  jam: "13:30", hewan: "Rocky",    jenisHewan: "Anjing",  pemilik: "Indah Lestari",  jenis: "Anjing Poodle",    layanan: "Sterilisasi",  status: "Dibatalkan" },
  { id: 12, nomorBooking: "BK-2604-012", tanggalBooking: "5 Apr 2026",  tanggalDibuat: "3 Apr 2026",  jam: "11:00", hewan: "Putri",    jenisHewan: "Kucing",  pemilik: "Arief Wibowo",   jenis: "Kucing Maine Coon", layanan: "Konsultasi",  status: "Dijadwalkan" },
];

const ITEMS_PER_PAGE = 7;
const ALL_STATUSES: BookingStatus[] = ["Dijadwalkan", "Berlangsung", "Selesai", "Dibatalkan"];

const statusStyle: Record<BookingStatus, { bg: string; color: string; border: string }> = {
  Selesai:     { bg: "#e8f5e9", color: "#2e7d32", border: "#2e7d3230" },
  Berlangsung: { bg: "#e3f2fd", color: "#1565c0", border: "#1565c030" },
  Dijadwalkan: { bg: "#fff8e1", color: "#e65100", border: "#e6510030" },
  Dibatalkan:  { bg: "#ffebee", color: "#c62828", border: "#c6282830" },
};

const speciesEmoji: Record<string, string> = {
  Kucing: "🐱", Anjing: "🐕", Kelinci: "🐇", Burung: "🐦", Hamster: "🐹",
};

// ── Shared Styles ─────────────────────────────────────────────────────────────

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  borderRadius: 8,
  border: "1.5px solid #e0e0e0",
  fontSize: 14,
  fontFamily: "inherit",
  outline: "none",
  boxSizing: "border-box",
  background: "#fff",
  color: "#333",
};

const labelStyle: React.CSSProperties = {
  fontSize: 14,
  display: "block",
  marginBottom: 6,
};

// ── Status Badge ──────────────────────────────────────────────────────────────

function StatusBadge({ value }: { value: BookingStatus }) {
  const st = statusStyle[value];
  return (
    <span style={{
      display: "inline-block",
      padding: "4px 12px",
      borderRadius: 20,
      fontSize: 12,
      background: st.bg,
      color: st.color,
      border: `1.5px solid ${st.border}`,
      whiteSpace: "nowrap",
    }}>
      {value}
    </span>
  );
}

// ── Status Dropdown ───────────────────────────────────────────────────────────

function StatusDropdown({ value, onChange }: {
  value: BookingStatus;
  onChange: (s: BookingStatus) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const st = statusStyle[value];

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} style={{ position: "relative", display: "inline-block" }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          display: "inline-flex", alignItems: "center", gap: 6,
          padding: "5px 12px", borderRadius: 20,
          background: st.bg, color: st.color,
          border: `1.5px solid ${st.border}`,
          fontSize: 12,
          cursor: "pointer", fontFamily: "inherit",
        }}
      >
        {value}
        <ChevronDown size={11} style={{ opacity: 0.7 }} />
      </button>

      {open && (
        <div style={{
          position: "absolute", top: "calc(100% + 6px)", left: 0, zIndex: 100,
          background: "#fff",
          border: "1.5px solid #e0e0e0",
          borderRadius: 10,
          boxShadow: "0 4px 16px rgba(0,0,0,0.10)",
          overflow: "hidden", minWidth: 152,
        }}>
          {ALL_STATUSES.map(s => {
            const ss = statusStyle[s];
            const active = s === value;
            return (
              <button
                key={s}
                onClick={() => { onChange(s); setOpen(false); }}
                style={{
                  display: "flex", alignItems: "center",
                  width: "100%", padding: "9px 14px",
                  background: active ? "#f5f5f5" : "transparent",
                  border: "none", cursor: "pointer",
                  fontSize: 13,
                  color: ss.color, fontFamily: "inherit", textAlign: "left",
                }}
              >
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
  booking: Booking;
  onClose: () => void;
  onStatusChange: (id: number, status: BookingStatus) => void;
}) {
  const emoji = speciesEmoji[booking.jenisHewan] ?? "🐾";

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0,
        background: "rgba(0,0,0,0.35)",
        display: "flex", alignItems: "center", justifyContent: "center",
        zIndex: 999,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: "#fff",
          borderRadius: 16,
          padding: "28px 32px",
          width: 480,
          boxShadow: "0 8px 32px rgba(0,0,0,0.18)",
          fontFamily: "inherit",
        }}
      >
        {/* Modal Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <div>
            <h2 style={{ fontSize: 18, margin: 0, fontWeight: "normal" }}>Detail Booking</h2>
            <p style={{ margin: "4px 0 0", fontSize: 12, color: "#888" }}>Informasi lengkap reservasi layanan</p>
          </div>
          <button
            onClick={onClose}
            style={{ border: "none", background: "none", cursor: "pointer", color: "#999", display: "flex", alignItems: "center" }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Nomor Booking Badge */}
        <div style={{ marginBottom: 16 }}>
          <div style={{
            padding: "10px 14px", borderRadius: 10,
            background: "#f0faf2", border: "1.5px solid #c8e6c9",
            display: "flex", flexDirection: "column", gap: 2,
          }}>
            <span style={{ fontSize: 11, color: "#888" }}>No. Booking</span>
            <span style={{ fontSize: 14, color: G }}>{booking.nomorBooking}</span>
          </div>
        </div>

        {/* Pet Info */}
        <div style={{
          display: "flex", alignItems: "center", gap: 14,
          background: "#f9f9f9",
          border: "1.5px solid #e0e0e0",
          borderRadius: 12,
          padding: "14px 16px",
          marginBottom: 16,
        }}>
          <div style={{
            width: 48, height: 48, borderRadius: 12,
            background: G,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "1.6rem", flexShrink: 0, overflow: "hidden",
          }}>
            {booking.fotoHewan
              ? <img src={booking.fotoHewan} alt={booking.hewan} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              : emoji
            }
          </div>
          <div>
            <div style={{ fontSize: 15 }}>{booking.hewan}</div>
            <div style={{ fontSize: 13, color: "#888", marginTop: 2 }}>{booking.jenis}</div>
          </div>
        </div>

        {/* Detail Rows */}
        <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
          {[
            { label: "Pemilik",         value: booking.pemilik },
            { label: "Tanggal Booking", value: booking.tanggalBooking },
            { label: "Tanggal Dibuat",  value: booking.tanggalDibuat },
            { label: "Jam",             value: booking.jam },
            { label: "Layanan",         value: booking.layanan },
          ].map(({ label, value }) => (
            <div
              key={label}
              style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                padding: "10px 0",
                borderBottom: "1px solid #f0f0f0",
              }}
            >
              <span style={{ fontSize: 14, color: "#888" }}>{label}</span>
              <span style={{ fontSize: 14, color: "#333" }}>{value}</span>
            </div>
          ))}

          {/* Status Row */}
          <div style={{
            display: "flex", justifyContent: "space-between", alignItems: "center",
            padding: "12px 0",
          }}>
            <span style={{ fontSize: 14, color: "#888" }}>Status</span>
            <StatusDropdown
              value={booking.status}
              onChange={s => onStatusChange(booking.id, s)}
            />
          </div>
        </div>

        {/* Footer Buttons */}
        <div style={{ display: "flex", gap: 12, justifyContent: "flex-end", marginTop: 20 }}>
          <button
            onClick={onClose}
            style={{
              padding: "10px 26px", borderRadius: 8,
              border: `1.5px solid ${G}`,
              background: "#fff", color: G,
              fontSize: 14,
              cursor: "pointer", fontFamily: "inherit",
            }}
          >
            Batal
          </button>
          <button
            onClick={onClose}
            style={{
              padding: "10px 26px", borderRadius: 8,
              border: "none", background: G,
              color: "#fff",
              fontSize: 14,
              cursor: "pointer", fontFamily: "inherit",
            }}
          >
            Simpan
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Summary Card ──────────────────────────────────────────────────────────────

function SummaryCard({ icon, label, value, sub, iconBg }: {
  icon: React.ReactNode;
  label: string;
  value: number;
  sub: string;
  iconBg: string;
}) {
  return (
    <div style={{
      background: "#fff",
      border: "1.5px solid #e0e0e0",
      borderRadius: 14,
      padding: "20px",
      display: "flex",
      alignItems: "center",
      gap: 16,
      boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
    }}>
      <div style={{
        width: 48, height: 48, borderRadius: "50%",
        background: iconBg,
        display: "flex", alignItems: "center", justifyContent: "center",
        flexShrink: 0,
      }}>
        {icon}
      </div>
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
  const [bookings,      setBookings]      = useState<Booking[]>(initialBookings);
  const [filterPemilik, setFilterPemilik] = useState("");
  const [filterTanggal, setFilterTanggal] = useState("");
  const [filterLayanan, setFilterLayanan] = useState("");
  const [filterStatus,  setFilterStatus]  = useState("");
  const [currentPage,   setCurrentPage]   = useState(1);
  const [detailBooking, setDetailBooking] = useState<Booking | null>(null);

  const filtered = bookings.filter(b =>
    (filterPemilik === "" || b.pemilik.toLowerCase().includes(filterPemilik.toLowerCase())) &&
    (filterTanggal === "" || b.tanggalBooking.includes(filterTanggal)) &&
    (filterLayanan === "" || b.layanan === filterLayanan) &&
    (filterStatus  === "" || b.status  === filterStatus)
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const paginated  = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  useEffect(() => { setCurrentPage(1); }, [filterPemilik, filterTanggal, filterLayanan, filterStatus]);

  const handleStatusChange = (id: number, status: BookingStatus) => {
    setBookings(prev => prev.map(b => b.id === id ? { ...b, status } : b));
    setDetailBooking(prev => prev?.id === id ? { ...prev, status } : prev);
  };

  const totalBooking = bookings.length;
  const mingguIni    = bookings.filter(b => b.status !== "Dibatalkan").length;
  const dijadwalkan  = bookings.filter(b => b.status === "Dijadwalkan").length;

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden" }}>
      <Sidebar activePage="booking" />

      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "auto", background: "#f9f9f9" }}>
        <Header title="Data Booking" subtitle="Semua permintaan booking layanan klinik" />

        <div style={{ padding: "24px 28px" }}>

          {/* ── Summary Cards ── */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 24 }}>
            <SummaryCard
              iconBg="#e8f5e9"
              icon={
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={G} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="4" width="18" height="18" rx="2"/>
                  <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                </svg>
              }
              label="Total Booking"
              value={totalBooking}
              sub="Reservasi layanan"
            />
            <SummaryCard
              iconBg="#fff8e1"
              icon={
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#e65100" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                </svg>
              }
              label="Minggu Ini"
              value={mingguIni}
              sub="Reservasi terjadwal"
            />
            <SummaryCard
              iconBg="#fff3e0"
              icon={
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#e65100" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                  <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
                </svg>
              }
              label="Dijadwalkan"
              value={dijadwalkan}
              sub="Booking dijadwalkan"
            />
          </div>

          {/* ── Filter Card ── */}
          <div style={{
            background: "#fff",
            border: "1.5px solid #e0e0e0",
            borderRadius: 14,
            padding: "20px",
            marginBottom: 20,
            boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
          }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14 }}>
              {[
                { label: "Nama Pemilik",    placeholder: "Cari nama pemilik...", value: filterPemilik, onChange: setFilterPemilik },
                { label: "Tanggal Booking", placeholder: "contoh: Apr 2026",     value: filterTanggal, onChange: setFilterTanggal },
              ].map(f => (
                <div key={f.label}>
                  <label style={labelStyle}>{f.label}</label>
                  <input
                    style={inputStyle}
                    placeholder={f.placeholder}
                    value={f.value}
                    onChange={e => f.onChange(e.target.value)}
                  />
                </div>
              ))}

              <div>
                <label style={labelStyle}>Layanan</label>
                <select style={inputStyle} value={filterLayanan} onChange={e => setFilterLayanan(e.target.value)}>
                  <option value="">Semua Layanan</option>
                  {["Vaksinasi","Sterilisasi","Grooming","Operasi","Pemeriksaan","Konsultasi"].map(l => (
                    <option key={l} value={l}>{l}</option>
                  ))}
                </select>
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

          {/* ── Table Card ── */}
          <div style={{
            background: "#fff",
            border: "1.5px solid #e0e0e0",
            borderRadius: 14,
            overflow: "hidden",
            boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
          }}>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: G }}>
                    {["No. Booking", "Hewan", "Pemilik", "Tanggal Booking", "Jam", "Layanan", "Status", "Aksi"].map(h => (
                      <th key={h} style={{
                        padding: "12px 16px",
                        fontSize: 13,
                        fontWeight: "normal",
                        color: "#fff",
                        textAlign: "left",
                        whiteSpace: "nowrap",
                        fontFamily: "inherit",
                      }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {paginated.length === 0 ? (
                    <tr>
                      <td colSpan={8} style={{ padding: "48px", textAlign: "center", color: "#999", fontSize: 14 }}>
                        <div style={{ fontSize: 32, marginBottom: 8 }}>📋</div>
                        Tidak ada data yang sesuai filter
                      </td>
                    </tr>
                  ) : paginated.map(b => {
                    const emoji = speciesEmoji[b.jenisHewan] ?? "🐾";
                    return (
                      <tr
                        key={b.id}
                        style={{ borderBottom: "1px solid #f0f0f0" }}
                        onMouseEnter={e => (e.currentTarget.style.background = "#f9f9f9")}
                        onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                      >
                        {/* No. Booking */}
                        <td style={{ padding: "10px 16px" }}>
                          <span style={{
                            fontSize: 12, color: G,
                            background: "#f0faf2", padding: "3px 8px",
                            borderRadius: 6, border: "1px solid #c8e6c9",
                            whiteSpace: "nowrap",
                          }}>
                            {b.nomorBooking}
                          </span>
                        </td>

                        {/* Hewan */}
                        <td style={{ padding: "10px 16px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <div style={{
                              width: 38, height: 38, borderRadius: 10,
                              background: G,
                              display: "flex", alignItems: "center", justifyContent: "center",
                              fontSize: "1.1rem", flexShrink: 0, overflow: "hidden",
                            }}>
                              {b.fotoHewan ? <img src={b.fotoHewan} alt={b.hewan} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : emoji}
                            </div>
                            <div>
                              <div style={{ fontSize: 13 }}>{b.hewan}</div>
                              <div style={{ fontSize: 12, color: "#888", marginTop: 1 }}>{b.jenis}</div>
                            </div>
                          </div>
                        </td>

                        {/* Pemilik */}
                        <td style={{ padding: "10px 16px", fontSize: 14 }}>{b.pemilik}</td>

                        {/* Tanggal */}
                        <td style={{ padding: "10px 16px" }}>
                          <div style={{ fontSize: 13 }}>{b.tanggalBooking}</div>
                          <div style={{ fontSize: 12, color: "#aaa", marginTop: 1 }}>Dibuat: {b.tanggalDibuat}</div>
                        </td>

                        {/* Jam */}
                        <td style={{ padding: "10px 16px", fontSize: 14 }}>{b.jam}</td>

                        {/* Layanan */}
                        <td style={{ padding: "10px 16px", fontSize: 14 }}>{b.layanan}</td>

                        {/* Status */}
                        <td style={{ padding: "10px 16px" }}>
                          <StatusBadge value={b.status} />
                        </td>

                        {/* Aksi */}
                        <td style={{ padding: "10px 16px" }}>
                          <button
                            onClick={() => setDetailBooking(b)}
                            style={{
                              display: "inline-flex", alignItems: "center", gap: 5,
                              padding: "8px 14px", borderRadius: 8,
                              border: `1.5px solid ${G}`,
                              background: "#fff", color: G,
                              fontSize: 13,
                              cursor: "pointer", fontFamily: "inherit",
                              whiteSpace: "nowrap",
                            }}
                            onMouseEnter={e => {
                              (e.currentTarget as HTMLButtonElement).style.background = G;
                              (e.currentTarget as HTMLButtonElement).style.color = "#fff";
                            }}
                            onMouseLeave={e => {
                              (e.currentTarget as HTMLButtonElement).style.background = "#fff";
                              (e.currentTarget as HTMLButtonElement).style.color = G;
                            }}
                          >
                            <Eye size={13} /> Lihat Detail
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* ── Pagination ── */}
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
              padding: "16px",
              borderTop: "1.5px solid #e0e0e0",
            }}>
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(p => p - 1)}
                style={{
                  padding: "8px 16px", borderRadius: 8,
                  border: "1.5px solid #e0e0e0",
                  background: "#fff", color: "#555",
                  fontSize: 13,
                  cursor: currentPage === 1 ? "not-allowed" : "pointer",
                  opacity: currentPage === 1 ? 0.4 : 1,
                  fontFamily: "inherit",
                }}
              >
                ← Sebelumnya
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                <button
                  key={p}
                  onClick={() => setCurrentPage(p)}
                  style={{
                    width: 36, height: 36, borderRadius: 8,
                    border: p === currentPage ? "none" : "1.5px solid #e0e0e0",
                    background: p === currentPage ? G : "#fff",
                    color: p === currentPage ? "#fff" : "#555",
                    fontSize: 13,
                    cursor: "pointer", fontFamily: "inherit",
                  }}
                >
                  {p}
                </button>
              ))}

              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(p => p + 1)}
                style={{
                  padding: "8px 16px", borderRadius: 8,
                  border: "1.5px solid #e0e0e0",
                  background: "#fff", color: "#555",
                  fontSize: 13,
                  cursor: currentPage === totalPages ? "not-allowed" : "pointer",
                  opacity: currentPage === totalPages ? 0.4 : 1,
                  fontFamily: "inherit",
                }}
              >
                Berikutnya →
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* ── Detail Modal ── */}
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