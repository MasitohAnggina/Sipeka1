
"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar_owner_pet";
import Header from "@/components/Header";
import { ToastContainer, useToast } from "@/components/Toast";
import {
  PawPrint, Calendar, Clock, Hash, ListOrdered,
  AlertTriangle, CheckCircle, XCircle, Activity,
} from "lucide-react";

function usePress() {
  const [pressed, setPressed] = useState(false);
  return {
    pressed,
    handlers: {
      onMouseDown:  () => setPressed(true),
      onMouseUp:    () => setPressed(false),
      onMouseLeave: () => setPressed(false),
      onTouchStart: () => setPressed(true),
      onTouchEnd:   () => setPressed(false),
    },
  };
}

function Btn({ onClick, variant = "outline", children, fullWidth = false, style: extraStyle }: {
  onClick(): void; variant?: "solid" | "outline"; children: React.ReactNode;
  fullWidth?: boolean; style?: React.CSSProperties;
}) {
  const { pressed, handlers } = usePress();
  const base: React.CSSProperties = {
    borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "inherit",
    transition: "background .15s, color .15s, border-color .15s, transform .1s",
    transform: pressed ? "scale(0.97)" : "scale(1)",
    width: fullWidth ? "100%" : undefined,
    padding: fullWidth ? "9px 0" : "8px 18px",
    display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6,
  };
  return (
    <button onClick={onClick} style={variant === "solid"
      ? { ...base, border: "none", background: pressed ? "#1b5e20" : G, color: "#fff", ...extraStyle }
      : { ...base, border: `1.5px solid ${pressed ? "#1b5e20" : G}`, background: pressed ? "#e8f5e9" : "#fff", color: pressed ? "#1b5e20" : G, ...extraStyle }
    } {...handlers}>{children}</button>
  );
}

function SmallBtn({ onClick, variant = "outline", children, danger = false }: {
  onClick(): void; variant?: "solid" | "outline"; children: React.ReactNode; danger?: boolean;
}) {
  const { pressed, handlers } = usePress();
  const base: React.CSSProperties = {
    padding: "7px 0", borderRadius: 8, fontWeight: 700, fontSize: 12,
    cursor: "pointer", fontFamily: "inherit", width: "100%",
    transition: "background .15s, color .15s, border-color .15s, transform .1s",
    transform: pressed ? "scale(0.96)" : "scale(1)",
    display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 5,
  };
  if (danger) {
    return (
      <button onClick={onClick} style={{
        ...base,
        border: `1.5px solid ${pressed ? "#b71c1c" : "#e53935"}`,
        background: pressed ? "#ffebee" : "#fff",
        color: pressed ? "#b71c1c" : "#e53935",
      }} {...handlers}>{children}</button>
    );
  }
  return (
    <button onClick={onClick} style={variant === "solid"
      ? { ...base, border: "none", background: pressed ? "#1b5e20" : G, color: "#fff" }
      : { ...base, border: `1.5px solid ${pressed ? "#1b5e20" : G}`, background: pressed ? "#e8f5e9" : "#fff", color: pressed ? "#1b5e20" : G }
    } {...handlers}>{children}</button>
  );
}

interface Pet {
  id: string; id_hewan: number; name: string; breed: string;
  age: string; weight: string; type: string; emoji: string; photo?: string;
}
interface BookingItem {
  id_booking: number; no_booking: string; no_antrian: number;
  tanggal_booking: string; jam: string; status: string;
  hewan_nama: string; layanan_nama: string; updated_at?: string;
}
interface RiwayatItem {
  id_riwayat: number; tanggal: string; bulan: string;
  hewan_nama: string; layanan_utama: string; layanan_detail: string; status: string;
}
interface DashboardData {
  user: { nama: string; foto_profile: string | null };
  hewan: Pet[];
  booking_aktif: BookingItem | null;
  bookings_hari_ini: BookingItem[];
  total_kunjungan: number;
  riwayat_terakhir: RiwayatItem[];
}

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
const G       = "#2e7d32";
const POLL_MS = 15_000;

const STATUS_CFG: Record<string, { label: string; bg: string; border: string; color: string }> = {
  menunggu:            { label: "Menunggu Konfirmasi",       bg: "#fffde7", border: "#ffe082", color: "#f57f17" },
  menunggu_pembatalan: { label: "Menunggu Konfirmasi Batal", bg: "#fff3e0", border: "#ffb74d", color: "#e65100" },
  dikonfirmasi:        { label: "Dikonfirmasi",              bg: "#e3f2fd", border: "#90caf9", color: "#1565c0" },
  diproses:            { label: "Sedang Diproses",           bg: "#e3f2fd", border: "#90caf9", color: "#1565c0" },
  dibatalkan:          { label: "Dibatalkan",                bg: "#fce4ec", border: "#f48fb1", color: "#c62828" },
  selesai:             { label: "Selesai",                   bg: "#e8f5e9", border: "#a5d6a7", color: "#2e7d32" },
};

const STATUS_TOAST: Record<string, { title: string; msg: string; type: "success" | "info" | "error" }> = {
  dikonfirmasi: { title: "Booking dikonfirmasi!", msg: "Jadwal kunjungan Anda telah dikonfirmasi oleh klinik.", type: "success" },
  diproses:     { title: "Hewan sedang diproses", msg: "Hewan Anda sedang mendapat penanganan dari dokter.", type: "info" },
  dibatalkan:   { title: "Booking dibatalkan",    msg: "Booking Anda telah dibatalkan.", type: "error" },
  selesai:      { title: "Layanan selesai!",      msg: "Terima kasih, hewan Anda telah selesai ditangani.", type: "success" },
};

function fmtDate(d: string) {
  if (!d) return "–";
  return new Date(d).toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric" });
}
function todayStr() {
  return new Date().toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
}
function jamSejak(dateStr?: string): number {
  if (!dateStr) return 0;
  return (Date.now() - new Date(dateStr).getTime()) / 3_600_000;
}
function isBookingVisible(b: BookingItem): boolean {
  const statusLower = b.status.toLowerCase();
  const sudahAkhir  = statusLower === "selesai" || statusLower === "dibatalkan";
  if (!sudahAkhir) return true;
  return jamSejak(b.updated_at) < 24;
}

function Badge({ children, variant = "green" }: { children: React.ReactNode; variant?: "green" | "blue" | "amber" | "red" }) {
  const map: Record<string, React.CSSProperties> = {
    green: { background: "#e8f5e9", color: "#2e7d32" },
    blue:  { background: "#e3f2fd", color: "#1565c0" },
    amber: { background: "#fff8e1", color: "#a16207" },
    red:   { background: "#fce4ec", color: "#c62828" },
  };
  return (
    <span style={{ display: "inline-flex", alignItems: "center", padding: "2px 9px", borderRadius: 20, fontSize: 11, fontWeight: 600, ...map[variant] }}>
      {children}
    </span>
  );
}

type IconVariant = "green" | "red" | "blue" | "amber";
const ICON_STYLE: Record<IconVariant, { bg: string; color: string }> = {
  green: { bg: "#e8f5e9", color: "#2e7d32" },
  red:   { bg: "#fce4ec", color: "#c62828" },
  blue:  { bg: "#e3f2fd", color: "#1565c0" },
  amber: { bg: "#fff8e1", color: "#a16207" },
};
function IconStatCard({ label, value, sub, subColor, icon, variant = "blue" }: {
  label: string; value: string | number; sub?: string;
  subColor?: string; icon: React.ReactNode; variant?: IconVariant;
}) {
  const { bg, color } = ICON_STYLE[variant];
  return (
    <div style={{ background: "#fff", border: "1px solid #f0f0f0", borderRadius: 12, padding: "16px 18px", display: "flex", alignItems: "center", gap: 14 }}>
      <div style={{ width: 48, height: 48, borderRadius: "50%", background: bg, color, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
        {icon}
      </div>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 13, color: "#888", marginBottom: 2 }}>{label}</div>
        <div style={{ fontSize: 24, fontWeight: 700, color: "#1a1a1a", lineHeight: 1.1 }}>{value}</div>
        {sub && (
          <div style={{ fontSize: 12, color: subColor ?? "#888", marginTop: 3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {sub}
          </div>
        )}
      </div>
    </div>
  );
}

function PetCard({ pet, onDetail, onBooking }: { pet: Pet; onDetail(): void; onBooking(): void }) {
  return (
    <div style={{ borderRadius: 12, overflow: "hidden", border: "1.5px solid #e0e0e0", background: "#fff" }}>
      <div style={{ background: G, padding: "14px", display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ width: 52, height: 52, borderRadius: 10, background: "rgba(255,255,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", flexShrink: 0 }}>
          {pet.photo
            ? <img src={pet.photo} alt={pet.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            : <PawPrint size={28} color="#fff" />}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: "#fff" }}>{pet.name}</div>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.75)" }}>{pet.type} · {pet.breed}</div>
        </div>
      </div>
      <div style={{ padding: "12px 14px" }}>
        {[["Usia", pet.age], ["Berat", pet.weight], ["Jenis", pet.type]].map(([label, val], i, arr) => (
          <div key={label} style={{ display: "flex", justifyContent: "space-between", fontSize: 12, padding: "5px 0", borderBottom: i < arr.length - 1 ? "1px solid #f0f0f0" : "none" }}>
            <span style={{ color: "#888" }}>{label}</span>
            <span style={{ fontWeight: 600, color: "#1a1a1a" }}>{val}</span>
          </div>
        ))}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 10 }}>
          <SmallBtn onClick={onDetail} variant="outline">Detail</SmallBtn>
          <SmallBtn onClick={onBooking} variant="solid">Booking</SmallBtn>
        </div>
      </div>
    </div>
  );
}

function Skeleton({ w = "100%", h = 16, radius = 6 }: { w?: string | number; h?: number; radius?: number }) {
  return <div style={{ width: w, height: h, borderRadius: radius, background: "linear-gradient(90deg,#f0f0f0 25%,#e0e0e0 50%,#f0f0f0 75%)", backgroundSize: "200% 100%", animation: "shimmer 1.5s infinite" }} />;
}

const STEPS = [
  { key: "menunggu",     label: "Menunggu" },
  { key: "dikonfirmasi", label: "Dikonfirmasi" },
  { key: "diproses",     label: "Diproses" },
  { key: "selesai",      label: "Selesai" },
];

function StatusStepper({ status }: { status: string }) {
  const statusLower = status.toLowerCase();
  if (statusLower === "dibatalkan" || statusLower === "menunggu_pembatalan") {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", background: "#fce4ec", borderRadius: 8, marginTop: 10 }}>
        <XCircle size={16} color="#c62828" />
        <span style={{ fontSize: 12, fontWeight: 600, color: "#c62828" }}>
          {statusLower === "menunggu_pembatalan"
            ? "Menunggu konfirmasi pembatalan dari admin"
            : "Booking ini telah dibatalkan"}
        </span>
      </div>
    );
  }
  const activeIdx = STEPS.findIndex(s => s.key === statusLower);
  return (
    <div style={{ display: "flex", alignItems: "center", marginTop: 12, padding: "6px 0" }}>
      {STEPS.map((step, i) => {
        const done = i < activeIdx, current = i === activeIdx;
        return (
          <div key={step.key} style={{ display: "flex", alignItems: "center", flex: i < STEPS.length - 1 ? 1 : undefined }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
              <div style={{ width: 22, height: 22, borderRadius: "50%", background: done || current ? G : "#e0e0e0", border: current ? "3px solid #a5d6a7" : "none", display: "flex", alignItems: "center", justifyContent: "center", transition: "background .4s", boxSizing: "border-box" }}>
                {done    && <span style={{ fontSize: 11, color: "#fff", fontWeight: 700 }}>✓</span>}
                {current && <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#fff", display: "block" }} />}
              </div>
              <span style={{ fontSize: 9, fontWeight: current ? 700 : 400, color: done || current ? G : "#bbb", whiteSpace: "nowrap" }}>{step.label}</span>
            </div>
            {i < STEPS.length - 1 && <div style={{ flex: 1, height: 3, background: done ? G : "#e0e0e0", marginBottom: 14, transition: "background .4s" }} />}
          </div>
        );
      })}
    </div>
  );
}

function BookingCard({
  booking,
  onBatal,
}: {
  booking: BookingItem;
  onBatal?: (id_booking: number, no_booking: string, hewan_nama: string) => void;
}) {
  const statusLower = booking.status.toLowerCase();
  const cfg         = STATUS_CFG[statusLower] ?? STATUS_CFG["menunggu"];
  const isSelesai   = statusLower === "selesai";
  const isBatal     = statusLower === "dibatalkan";
  // Tombol batalkan muncul hanya saat menunggu atau dikonfirmasi
  const bisaBatal   = statusLower === "menunggu" || statusLower === "dikonfirmasi";
  const sudahAkhir  = isSelesai || isBatal;

  const jam      = jamSejak(booking.updated_at);
  const jamLabel = jam < 1 ? "Baru saja" : jam < 24 ? `${Math.floor(jam)} jam lalu` : `${Math.floor(jam / 24)} hari lalu`;
  const sisaJam  = Math.max(0, 24 - jam);

  return (
    <div style={{ borderRadius: 12, border: `1.5px solid ${cfg.border}`, background: cfg.bg, padding: "12px 14px", transition: "all .4s ease" }}>
      {sudahAkhir && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "6px 10px", borderRadius: 8, marginBottom: 8, background: isSelesai ? "#e8f5e9" : "#fce4ec", border: `1px solid ${isSelesai ? "#c8e6c9" : "#f48fb1"}` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            {isSelesai ? <CheckCircle size={14} color={G} /> : <XCircle size={14} color="#c62828" />}
            <span style={{ fontSize: 12, fontWeight: 700, color: isSelesai ? G : "#c62828" }}>
              {isSelesai ? "Layanan Selesai" : "Dibatalkan"}
            </span>
            <span style={{ fontSize: 11, color: "#888" }}>· {jamLabel}</span>
          </div>
          {sisaJam > 0 && (
            <span style={{ fontSize: 10, color: "#999", background: "#fff", padding: "2px 8px", borderRadius: 20, border: "1px solid #e0e0e0" }}>
              Hilang dalam {Math.ceil(sisaJam)} jam
            </span>
          )}
        </div>
      )}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 2 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: "#1a1a1a" }}>{booking.hewan_nama}</div>
        <span style={{ fontSize: 11, fontWeight: 600, padding: "2px 9px", borderRadius: 20, background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}>
          {cfg.label}
        </span>
      </div>
      <div style={{ fontSize: 12, color: "#666", marginBottom: 8 }}>{booking.layanan_nama}</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
        {[
          { icon: <Calendar size={12} color="#888" />,    label: "Tanggal",     val: fmtDate(booking.tanggal_booking) },
          { icon: <Clock size={12} color="#888" />,       label: "Jam",         val: `${booking.jam} WIB` },
          { icon: <Hash size={12} color="#888" />,        label: "No. Booking", val: `#${booking.no_booking}` },
          { icon: <ListOrdered size={12} color="#888" />, label: "Antrian",     val: String(booking.no_antrian).padStart(3, "0") },
        ].map(({ icon, label, val }) => (
          <div key={label} style={{ background: "rgba(255,255,255,0.65)", borderRadius: 8, padding: "6px 10px" }}>
            <div style={{ fontSize: 10, color: "#888", marginBottom: 1, display: "flex", alignItems: "center", gap: 4 }}>
              {icon} {label}
            </div>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#1a1a1a" }}>{val}</div>
          </div>
        ))}
      </div>
      {bisaBatal && onBatal && (
        <button
          onClick={() => onBatal(booking.id_booking, booking.no_booking, booking.hewan_nama)}
          style={{ marginTop: 10, width: "100%", padding: "8px 0", borderRadius: 8, border: "1.5px solid #e53935", background: "#fff", color: "#e53935", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, transition: "background .15s, color .15s" }}
          onMouseEnter={(e) => { e.currentTarget.style.background = "#ffebee"; e.currentTarget.style.color = "#b71c1c"; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "#fff"; e.currentTarget.style.color = "#e53935"; }}
        >
          <XCircle size={13} /> Batalkan Booking
        </button>
      )}
    </div>
  );
}

interface BatalConfirmData {
  id_booking: number;
  no_booking: string;
  hewan_nama: string;
}

function BatalConfirmModal({ data, onCancel, onConfirm, loading }: {
  data: BatalConfirmData; onCancel: () => void; onConfirm: () => void; loading: boolean;
}) {
  return (
    <div
      onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1300, fontFamily: "'Poppins', sans-serif", padding: 16 }}
    >
      <div style={{ background: "#fff", borderRadius: 14, padding: "24px 28px", width: "100%", maxWidth: 360, boxShadow: "0 8px 32px rgba(0,0,0,0.18)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
          <div style={{ width: 44, height: 44, borderRadius: "50%", background: "#fce4ec", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <AlertTriangle size={22} color="#e53935" />
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#1a1a1a" }}>Batalkan Booking?</div>
            <div style={{ fontSize: 12, color: "#888", marginTop: 2 }}>Tindakan ini tidak dapat diurungkan</div>
          </div>
        </div>
        <div style={{ background: "#fafafa", borderRadius: 10, padding: "12px 14px", marginBottom: 16, border: "1px solid #f0f0f0" }}>
          <div style={{ fontSize: 12, color: "#888", marginBottom: 2 }}>Booking yang akan dibatalkan:</div>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#1a1a1a" }}>{data.hewan_nama}</div>
          <div style={{ fontSize: 12, color: "#666", marginTop: 2 }}>No. Booking: #{data.no_booking}</div>
        </div>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 8, padding: "10px 12px", background: "#fff8e1", borderRadius: 8, marginBottom: 20, border: "1px solid #ffe082" }}>
          <AlertTriangle size={13} color="#f57f17" style={{ flexShrink: 0, marginTop: 1 }} />
          <span style={{ fontSize: 12, color: "#8d5524", lineHeight: 1.5 }}>
            Admin klinik akan mendapat notifikasi pembatalan ini dan perlu mengkonfirmasinya.
          </span>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <button
            onClick={onCancel} disabled={loading}
            style={{ padding: "10px 0", borderRadius: 8, border: "1.5px solid #e0e0e0", background: "#fff", color: "#666", fontSize: 13, fontWeight: 600, cursor: loading ? "not-allowed" : "pointer", fontFamily: "inherit" }}
          >
            Tidak, Kembali
          </button>
          <button
            onClick={onConfirm} disabled={loading}
            style={{ padding: "10px 0", borderRadius: 8, border: "none", background: loading ? "#ccc" : "#e53935", color: "#fff", fontSize: 13, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, transition: "background .15s" }}
            onMouseEnter={(e) => { if (!loading) e.currentTarget.style.background = "#b71c1c"; }}
            onMouseLeave={(e) => { if (!loading) e.currentTarget.style.background = "#e53935"; }}
          >
            {loading ? (
              <><span style={{ width: 14, height: 14, border: "2px solid rgba(255,255,255,0.4)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.6s linear infinite", display: "inline-block" }} />Membatalkan...</>
            ) : (
              <><XCircle size={14} /> Ya, Batalkan</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

function BookingInfoPanel({ bookings, onBuat, onBatal }: {
  bookings: BookingItem[];
  onBuat: () => void;
  onBatal: (id_booking: number, no_booking: string, hewan_nama: string) => void;
}) {
  const visibleBookings = (bookings ?? []).filter(isBookingVisible);
  if (visibleBookings.length === 0) {
    return (
      <div>
        <div style={{ padding: "24px", textAlign: "center", color: "#aaa", background: "#fafafa", borderRadius: 10, marginBottom: 10 }}>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 8 }}>
            <Calendar size={32} color="#ccc" />
          </div>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 3 }}>Belum ada booking</div>
          <div style={{ fontSize: 12 }}>Buat booking untuk hewan kesayanganmu</div>
        </div>
        <Btn onClick={onBuat} variant="solid" fullWidth>+ Buat Booking Baru</Btn>
      </div>
    );
  }
  const tanggalTerbaru = visibleBookings
    .map(b => b.tanggal_booking)
    .filter(Boolean)
    .sort((a, b) => new Date(b!).getTime() - new Date(a!).getTime())[0];
  const tglLabel = tanggalTerbaru
    ? new Date(tanggalTerbaru).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })
    : "";
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
        <span style={{ fontSize: 12, color: "#666", display: "flex", alignItems: "center", gap: 5 }}>
          <Calendar size={13} color="#888" /> Jadwal: <strong>{tglLabel}</strong>
        </span>
        <span style={{ fontSize: 11, fontWeight: 600, background: "#e3f2fd", color: "#1565c0", padding: "2px 10px", borderRadius: 20 }}>
          {visibleBookings.length} hewan
        </span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 12, maxHeight: 460, overflowY: visibleBookings.length > 2 ? "auto" : "visible", paddingRight: visibleBookings.length > 2 ? 2 : 0 }}>
        {visibleBookings.map(b => (
          <BookingCard key={b.id_booking} booking={b} onBatal={onBatal} />
        ))}
      </div>
      <Btn onClick={onBuat} variant="solid" fullWidth>+ Buat Booking Baru</Btn>
    </div>
  );
}

// ── MAIN DASHBOARD ────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const router = useRouter();
  const [data,        setData]        = useState<DashboardData | null>(null);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState<string | null>(null);
  const [batalConfirm, setBatalConfirm] = useState<BatalConfirmData | null>(null);
  const [batalLoading, setBatalLoading] = useState(false);

  const { toasts, toast, removeToast } = useToast();
  const prevStatusRef = useRef<string | null>(null);
  const prevBookingId = useRef<number | null>(null);

  // ── FIX: token dibaca di dalam useEffect/callback, bukan di luar komponen
  // Ini memastikan selalu membaca sessionStorage setelah hydration selesai
  const getToken = useCallback(() => {
    return sessionStorage.getItem("token") ?? "";
  }, []);

  const fetchDashboard = useCallback(async (isPolling = false) => {
    const token = getToken();
    if (!token) {
      router.push("/auth/login");
      return;
    }
    try {
      const r = await fetch(`${API_URL}/api/owner_pet/dashboard`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const res = await r.json();
      if (!res.success) throw new Error("Response tidak sukses");
      const incoming = res.data as DashboardData;
      if (isPolling && incoming.booking_aktif) {
        const baru    = incoming.booking_aktif;
        const samaPet = prevBookingId.current === baru.id_booking;
        const berubah = samaPet && prevStatusRef.current !== null && prevStatusRef.current !== baru.status;
        if (berubah) {
          const t = STATUS_TOAST[baru.status.toLowerCase()];
          if (t) toast[t.type](t.title, t.msg);
        }
        prevStatusRef.current = baru.status;
        prevBookingId.current = baru.id_booking;
      } else if (!isPolling && incoming.booking_aktif) {
        prevStatusRef.current = incoming.booking_aktif.status;
        prevBookingId.current = incoming.booking_aktif.id_booking;
      }
      setData(incoming);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "";
      if (!isPolling) {
        if (msg.includes("401")) { setError("Sesi habis, silakan login ulang."); router.push("/auth/login"); }
        else setError("Tidak dapat terhubung ke server.");
      }
    } finally {
      if (!isPolling) setLoading(false);
    }
  }, [getToken, router, toast]);

  useEffect(() => {
    fetchDashboard(false);
    const interval = setInterval(() => fetchDashboard(true), POLL_MS);
    return () => clearInterval(interval);
  }, [fetchDashboard]);

  const handleBatal = useCallback((id_booking: number, no_booking: string, hewan_nama: string) => {
    setBatalConfirm({ id_booking, no_booking, hewan_nama });
  }, []);

  // ── FIX UTAMA: token dibaca langsung dari sessionStorage saat handler dipanggil
  const handleDoConfirmBatal = useCallback(async () => {
    if (!batalConfirm) return;
    setBatalLoading(true);
    try {
      const token = getToken(); // ← baca saat klik, bukan saat render
      if (!token) {
        toast.error("Sesi habis", "Silakan login ulang.");
        router.push("/auth/login");
        return;
      }
      const res  = await fetch(`${API_URL}/api/booking/${batalConfirm.id_booking}/batal`, {
        method:  "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      const json = await res.json();
      if (json.success) {
        setBatalConfirm(null);
        toast.info(
          "Permintaan terkirim",
          "Admin klinik akan segera mengkonfirmasi pembatalan booking Anda."
        );
        fetchDashboard(false);
      } else {
        toast.error("Gagal membatalkan", json.message ?? "Terjadi kesalahan, coba lagi.");
      }
    } catch {
      toast.error("Gagal membatalkan", "Tidak dapat terhubung ke server.");
    } finally {
      setBatalLoading(false);
    }
  }, [batalConfirm, getToken, toast, router, fetchDashboard]);

  const handleBooking = (petId?: number) => {
    if (petId) sessionStorage.setItem("sipeka_booking_pet", String(petId));
    router.push("/owner_pet/booking_layanan");
  };

  const displayRiwayat = useMemo(() =>
    (data?.riwayat_terakhir ?? [])
      .sort((a, b) => b.id_riwayat - a.id_riwayat)
      .slice(0, 10),
    [data]
  );

  const visibleBookings = useMemo(
    () =>
      (data?.bookings_hari_ini ?? [])
        .filter(isBookingVisible)
        .sort((a, b) => {
          const dateA = new Date(a.updated_at ?? a.tanggal_booking ?? 0).getTime();
          const dateB = new Date(b.updated_at ?? b.tanggal_booking ?? 0).getTime();
          return dateB - dateA;
        }),
    [data]
  );

  if (loading) {
    return (
      <div style={{ display: "flex", height: "100vh", overflow: "hidden" }}>
        <Sidebar activePage="dashboard" />
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "auto", background: "#f9f9f9" }}>
          <Header title="Dashboard" subtitle="Selamat datang di SIPEKA" role="owner" />
          <div style={{ padding: "20px 28px 32px", display: "flex", flexDirection: "column", gap: 16 }}>
            <style>{`@keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}`}</style>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12 }}>
              {[1,2,3].map(i => <Skeleton key={i} h={80} radius={10} />)}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <Skeleton h={300} radius={12} /><Skeleton h={300} radius={12} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div style={{ display: "flex", height: "100vh", overflow: "hidden" }}>
        <Sidebar activePage="dashboard" />
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", background: "#f9f9f9" }}>
          <div style={{ textAlign: "center", color: "#888" }}>
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 12 }}>
              <AlertTriangle size={40} color="#e53935" />
            </div>
            <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 6 }}>{error ?? "Terjadi kesalahan"}</div>
            <Btn onClick={() => window.location.reload()} variant="solid" style={{ marginTop: 8 }}>Coba Lagi</Btn>
          </div>
        </div>
      </div>
    );
  }

  const { user, hewan, total_kunjungan } = data;

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden", fontFamily: "'Poppins', sans-serif" }}>
      <Sidebar activePage="dashboard" />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "auto", background: "#f9f9f9" }}>
        <Header title="Dashboard" subtitle="Selamat datang di SIPEKA" role="owner" />
        <style>{`
          @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
          @keyframes pulse   { 0%,100%{opacity:1} 50%{opacity:.3} }
          @keyframes spin    { to{transform:rotate(360deg)} }
        `}</style>
        <div style={{ padding: "20px 28px 32px" }}>
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: "#1a1a1a" }}>Halo, {user.nama}!</div>
            <div style={{ fontSize: 13, color: "#888", marginTop: 2 }}>{todayStr()}</div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 24 }}>
            <IconStatCard
              label="Hewan Saya" value={hewan.length}
              sub={hewan.length > 0 ? hewan.map(p => p.name).join(", ") : "Belum ada hewan"}
              icon={<PawPrint size={22} />} variant="amber"
            />
            <IconStatCard
              label="Booking Terjadwal" value={visibleBookings.length}
              sub={visibleBookings.length > 0 ? visibleBookings.map(b => b.hewan_nama).join(", ") : "Belum ada booking"}
              subColor={visibleBookings.length > 0 ? "#1565c0" : "#aaa"}
              icon={<Calendar size={22} />} variant="blue"
            />
            <IconStatCard
              label="Total Kunjungan" value={total_kunjungan}
              sub="Riwayat layanan selesai"
              icon={<Activity size={22} />} variant="green"
            />
          </div>
          <div style={{ marginBottom: 24 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <h2 style={{ fontSize: 15, fontWeight: 700, color: G, margin: 0 }}>Hewan Saya</h2>
              <Btn onClick={() => router.push("/owner_pet/data_hewan")} variant="outline" style={{ fontSize: 12, padding: "5px 14px" }}>Kelola Hewan</Btn>
            </div>
            {hewan.length === 0 ? (
              <div style={{ textAlign: "center", padding: "40px 0", color: "#aaa" }}>
                <div style={{ display: "flex", justifyContent: "center", marginBottom: 10 }}>
                  <PawPrint size={40} color="#ccc" />
                </div>
                <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>Belum ada hewan</div>
                <div style={{ fontSize: 13 }}>Tambahkan hewan di menu Data Hewan</div>
              </div>
            ) : (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 16 }}>
                {hewan.map(pet => (
                  <div key={pet.id_hewan} style={{ width: 220 }}>
                    <PetCard
                      pet={pet}
                      onDetail={() => router.push(`/owner_pet/data_hewan?id=${pet.id_hewan}`)}
                      onBooking={() => handleBooking(pet.id_hewan)}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div style={{ background: "#fff", borderRadius: 12, padding: "16px 18px", border: "1px solid #f0f0f0" }}>
              <h2 style={{ fontSize: 15, fontWeight: 700, color: G, margin: "0 0 14px" }}>Informasi Booking</h2>
              <BookingInfoPanel
                bookings={visibleBookings}
                onBuat={() => handleBooking()}
                onBatal={handleBatal}
              />
            </div>
            <div style={{ background: "#fff", borderRadius: 12, padding: "16px 18px", border: "1px solid #f0f0f0" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                <h2 style={{ fontSize: 15, fontWeight: 700, color: G, margin: 0 }}>Riwayat Terakhir</h2>
                <Btn onClick={() => router.push("/owner_pet/riwayat_layanan")} variant="outline" style={{ fontSize: 12, padding: "4px 12px" }}>
                  Lihat Semua
                </Btn>
              </div>
              {displayRiwayat.length === 0 ? (
                <div style={{ textAlign: "center", padding: "30px 0", color: "#aaa", fontSize: 13 }}>
                  Belum ada riwayat layanan
                </div>
              ) : (
                <div style={{ maxHeight: 480, overflowY: "auto", paddingRight: 2 }}>
                  {displayRiwayat.map((item, i) => (
                    <div key={item.id_riwayat} style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "9px 0", borderBottom: i < displayRiwayat.length - 1 ? "1px solid #f0f0f0" : "none" }}>
                      <div style={{ minWidth: 36, textAlign: "center", background: "#f5f5f5", borderRadius: 8, padding: "4px 6px", flexShrink: 0 }}>
                        <div style={{ fontSize: 15, fontWeight: 700, color: "#1a1a1a" }}>{item.tanggal}</div>
                        <div style={{ fontSize: 10, color: "#888" }}>{item.bulan?.slice(0, 3)}</div>
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: "#1a1a1a", marginBottom: 2 }}>
                          {item.layanan_utama} — {item.hewan_nama}
                        </div>
                        <div style={{ fontSize: 11, color: "#888", marginBottom: 4 }}>{item.layanan_detail}</div>
                        <Badge variant="green">Selesai</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      {batalConfirm && (
        <BatalConfirmModal
          data={batalConfirm}
          onCancel={() => { if (!batalLoading) setBatalConfirm(null); }}
          onConfirm={handleDoConfirmBatal}
          loading={batalLoading}
        />
      )}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
}