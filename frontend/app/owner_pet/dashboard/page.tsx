
"use client";
import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar_owner_pet";
import Header from "@/components/Header";
import { ToastContainer, useToast } from "@/components/Toast";
import {
  PawPrint, Calendar, Clock, Hash, ListOrdered,
  AlertTriangle, CheckCircle, XCircle, PartyPopper,
  MapPin, Activity, Stethoscope, BarChart2
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

function SmallBtn({ onClick, variant = "outline", children }: {
  onClick(): void; variant?: "solid" | "outline"; children: React.ReactNode;
}) {
  const { pressed, handlers } = usePress();
  const base: React.CSSProperties = {
    padding: "7px 0", borderRadius: 8, fontWeight: 700, fontSize: 12,
    cursor: "pointer", fontFamily: "inherit", width: "100%",
    transition: "background .15s, color .15s, border-color .15s, transform .1s",
    transform: pressed ? "scale(0.96)" : "scale(1)",
  };
  return (
    <button onClick={onClick} style={variant === "solid"
      ? { ...base, border: "none", background: pressed ? "#1b5e20" : G, color: "#fff" }
      : { ...base, border: `1.5px solid ${pressed ? "#1b5e20" : G}`, background: pressed ? "#e8f5e9" : "#fff", color: pressed ? "#1b5e20" : G }
    } {...handlers}>{children}</button>
  );
}

// ── Types ─────────────────────────────────────────────────────────────────────

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

// ── Constants ─────────────────────────────────────────────────────────────────

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
const G       = "#2e7d32";
const POLL_MS = 15_000;

const STATUS_CFG: Record<string, { label: string; bg: string; border: string }> = {
  menunggu:     { label: "Menunggu Konfirmasi", bg: "#e3f2fd", border: "#90caf9" },
  dikonfirmasi: { label: "Dikonfirmasi",         bg: "#e3f2fd", border: "#90caf9" },
  diproses:     { label: "Sedang Diproses",      bg: "#e8f5e9", border: "#a5d6a7" },
  dibatalkan:   { label: "Dibatalkan",           bg: "#fce4ec", border: "#f48fb1" },
  selesai:      { label: "Selesai",              bg: "#e8f5e9", border: "#c8e6c9" },
};

const STATUS_TOAST: Record<string, { title: string; msg: string; type: "success" | "info" | "error" }> = {
  dikonfirmasi: { title: "Booking dikonfirmasi!", msg: "Jadwal kunjungan Anda telah dikonfirmasi oleh klinik.", type: "success" },
  diproses:     { title: "Hewan sedang diproses", msg: "Hewan Anda sedang mendapat penanganan dari dokter.", type: "info" },
  dibatalkan:   { title: "Booking dibatalkan",    msg: "Booking Anda telah dibatalkan.", type: "error" },
  selesai:      { title: "Layanan selesai!",       msg: "Terima kasih, hewan Anda telah selesai ditangani.", type: "success" },
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtDate(d: string) {
  if (!d) return "–";
  return new Date(d).toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric" });
}

function todayStr() {
  return new Date().toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
}

function getAuthToken(): string {
  return typeof window !== "undefined" ? (sessionStorage.getItem("token") ?? "") : "";
}

function hariSejak(dateStr?: string): number {
  if (!dateStr) return 0;
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / 86_400_000);
}

// ── Sub-components ────────────────────────────────────────────────────────────

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

function StatCard({ label, value, sub, subColor }: { label: string; value: string; sub?: string; subColor?: string }) {
  return (
    <div style={{ background: "#fff", borderRadius: 10, padding: "12px 14px", border: "1px solid #f0f0f0" }}>
      <div style={{ fontSize: 11, color: "#888", marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 700, color: "#1a1a1a", lineHeight: 1.1 }} dangerouslySetInnerHTML={{ __html: value }} />
      {sub && <div style={{ fontSize: 11, color: subColor ?? "#888", marginTop: 2 }}>{sub}</div>}
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

// ── Status Stepper ────────────────────────────────────────────────────────────

const STEPS = [
  { key: "menunggu",     label: "Menunggu" },
  { key: "dikonfirmasi", label: "Dikonfirmasi" },
  { key: "diproses",     label: "Diproses" },
  { key: "selesai",      label: "Selesai" },
];

function StatusStepper({ status }: { status: string }) {
  if (status === "dibatalkan") {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", background: "#fce4ec", borderRadius: 8, marginTop: 10 }}>
        <XCircle size={16} color="#c62828" />
        <span style={{ fontSize: 12, fontWeight: 600, color: "#c62828" }}>Booking ini telah dibatalkan</span>
      </div>
    );
  }
  const activeIdx = STEPS.findIndex(s => s.key === status);
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

// ── Single Booking Card ───────────────────────────────────────────────────────

function BookingCard({ booking }: { booking: BookingItem }) {
  const cfg        = STATUS_CFG[booking.status] ?? STATUS_CFG["menunggu"];
  const isSelesai  = booking.status === "selesai";
  const isBatal    = booking.status === "dibatalkan";
  const sudahAkhir = isSelesai || isBatal;
  const hari       = hariSejak(booking.updated_at);
  const hariLabel  = hari === 0 ? "Hari ini" : `${hari} hari lalu`;
  const sisaHari   = 1 - hari;

  return (
    <div style={{ borderRadius: 12, border: `1.5px solid ${cfg.border}`, background: cfg.bg, padding: "12px 14px", transition: "all .4s ease" }}>
      {sudahAkhir && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "6px 10px", borderRadius: 8, marginBottom: 8, background: isSelesai ? "#e8f5e9" : "#fce4ec", border: `1px solid ${isSelesai ? "#c8e6c9" : "#f48fb1"}` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            {isSelesai
              ? <CheckCircle size={14} color={G} />
              : <XCircle size={14} color="#c62828" />}
            <span style={{ fontSize: 12, fontWeight: 700, color: isSelesai ? G : "#c62828" }}>
              {isSelesai ? "Layanan Selesai" : "Dibatalkan"}
            </span>
            <span style={{ fontSize: 11, color: "#888" }}>· {hariLabel}</span>
          </div>
          {sisaHari > 0 && (
            <span style={{ fontSize: 10, color: "#999", background: "#fff", padding: "2px 8px", borderRadius: 20, border: "1px solid #e0e0e0" }}>
              Hilang dalam {sisaHari} hari
            </span>
          )}
        </div>
      )}

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 2 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: "#1a1a1a" }}>{booking.hewan_nama}</div>
        <span style={{
          fontSize: 11, fontWeight: 600, padding: "2px 9px", borderRadius: 20,
          background: isSelesai ? "#e8f5e9" : isBatal ? "#fce4ec" : "#e3f2fd",
          color: isSelesai ? G : isBatal ? "#c62828" : "#1565c0",
        }}>
          {cfg.label}
        </span>
      </div>

      <div style={{ fontSize: 12, color: "#666", marginBottom: 8 }}>{booking.layanan_nama}</div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
        {[
          { icon: <Calendar size={12} color="#888" />, label: "Tanggal",     val: fmtDate(booking.tanggal_booking) },
          { icon: <Clock size={12} color="#888" />,    label: "Jam",         val: `${booking.jam} WIB` },
          { icon: <Hash size={12} color="#888" />,     label: "No. Booking", val: `#${booking.no_booking}` },
          { icon: <ListOrdered size={12} color="#888" />, label: "Antrian",  val: String(booking.no_antrian).padStart(3, "0") },
        ].map(({ icon, label, val }) => (
          <div key={label} style={{ background: "rgba(255,255,255,0.65)", borderRadius: 8, padding: "6px 10px" }}>
            <div style={{ fontSize: 10, color: "#888", marginBottom: 1, display: "flex", alignItems: "center", gap: 4 }}>
              {icon} {label}
            </div>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#1a1a1a" }}>{val}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Booking Info Panel ────────────────────────────────────────────────────────

function BookingInfoPanel({ bookings, onBuat }: { bookings: BookingItem[]; onBuat(): void }) {
  if (!bookings || bookings.length === 0) {
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

  const tglLabel = bookings[0]?.tanggal_booking
    ? new Date(bookings[0].tanggal_booking).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })
    : "";

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
        <span style={{ fontSize: 12, color: "#666", display: "flex", alignItems: "center", gap: 5 }}>
          <Calendar size={13} color="#888" /> Jadwal: <strong>{tglLabel}</strong>
        </span>
        <span style={{ fontSize: 11, fontWeight: 600, background: "#e3f2fd", color: "#1565c0", padding: "2px 10px", borderRadius: 20 }}>
          {bookings.length} hewan
        </span>
      </div>

      <div style={{
        display: "flex", flexDirection: "column", gap: 10, marginBottom: 12,
        maxHeight: 460, overflowY: bookings.length > 2 ? "auto" : "visible",
        paddingRight: bookings.length > 2 ? 2 : 0,
      }}>
        {bookings.map(b => <BookingCard key={b.id_booking} booking={b} />)}
      </div>

      <Btn onClick={onBuat} variant="solid" fullWidth>+ Buat Booking Baru</Btn>
    </div>
  );
}

// ── Main Dashboard ────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const router = useRouter();
  const [data,    setData]    = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);

  const { toasts, toast, removeToast } = useToast();
  const prevStatusRef = useRef<string | null>(null);
  const prevBookingId = useRef<number | null>(null);
  const token = getAuthToken();

  const fetchDashboard = useCallback(async (isPolling = false) => {
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
          const t = STATUS_TOAST[baru.status];
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, router]);

  useEffect(() => {
    if (!token) { router.push("/auth/login"); return; }
    fetchDashboard(false);
    const interval = setInterval(() => fetchDashboard(true), POLL_MS);
    return () => clearInterval(interval);
  }, [fetchDashboard, token, router]);

  const handleBooking = (petId?: number) => {
    if (petId) sessionStorage.setItem("sipeka_booking_pet", String(petId));
    router.push("/owner_pet/booking_layanan");
  };

  const displayRiwayat = useMemo(() => data?.riwayat_terakhir?.slice(0, 10) ?? [], [data]);

  if (loading) {
    return (
      <div style={{ display: "flex", height: "100vh", overflow: "hidden" }}>
        <Sidebar activePage="dashboard" />
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "auto", background: "#f9f9f9" }}>
          <Header title="Dashboard" subtitle="Selamat datang di SIPEKA" />
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

  const { user, hewan, total_kunjungan, bookings_hari_ini } = data;
  const bookings = bookings_hari_ini ?? [];

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden", fontFamily: "'Poppins', sans-serif" }}>
      <Sidebar activePage="dashboard" />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "auto", background: "#f9f9f9" }}>
        <Header title="Dashboard" subtitle="Selamat datang di SIPEKA" />
        <style>{`@keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}@keyframes pulse{0%,100%{opacity:1}50%{opacity:.3}}`}</style>

        <div style={{ padding: "20px 28px 32px" }}>

          {/* Greeting */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: "#1a1a1a" }}>Halo, {user.nama}!</div>
            <div style={{ fontSize: 13, color: "#888", marginTop: 2 }}>{todayStr()}</div>
          </div>

          {/* Stat Cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 24 }}>
            <StatCard
              label="Hewan Saya"
              value={`${hewan.length} <span style="font-size:13px;font-weight:400;color:#888;">ekor</span>`}
              sub={hewan.length > 0 ? hewan.map(p => p.name).join(", ") : "Belum ada hewan"}
            />
            <StatCard
              label="Booking Terjadwal"
              value={`${bookings.length} <span style="font-size:13px;font-weight:400;color:#888;">hewan</span>`}
              sub={bookings.length > 0
                ? bookings.map(b => b.hewan_nama).join(", ")
                : "Belum ada booking"}
              subColor={bookings.length > 0 ? "#1565c0" : "#aaa"}
            />
            <StatCard
              label="Total Kunjungan"
              value={`${total_kunjungan} <span style="font-size:13px;font-weight:400;color:#888;">kali</span>`}
              sub="Riwayat layanan selesai"
            />
          </div>

          {/* Hewan Saya */}
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

          {/* Informasi Booking + Riwayat Terakhir */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>

            {/* Informasi Booking */}
            <div style={{ background: "#fff", borderRadius: 12, padding: "16px 18px", border: "1px solid #f0f0f0" }}>
              <h2 style={{ fontSize: 15, fontWeight: 700, color: G, margin: "0 0 14px" }}>Informasi Booking</h2>
              <BookingInfoPanel bookings={bookings} onBuat={() => handleBooking()} />
            </div>

            {/* Riwayat Terakhir */}
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

      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
}
