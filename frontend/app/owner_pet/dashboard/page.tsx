"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar_owner_pet";
import Header from "@/components/Header";
import { ToastContainer, useToast } from "@/components/Toast";

// ── Types ─────────────────────────────────────────────────────────────────────

interface Pet {
  id: string;
  id_hewan: number;
  name: string;
  breed: string;
  age: string;
  weight: string;
  type: string;
  emoji: string;
  photo?: string;
}

interface BookingAktif {
  id_booking: number;
  no_booking: string;
  no_antrian: number;
  tanggal_booking: string;
  jam: string;
  status: string;
  hewan_nama: string;
  layanan_nama: string;
}

interface RiwayatItem {
  id_riwayat: number;
  tanggal: string;
  bulan: string;
  hewan_nama: string;
  layanan_utama: string;
  layanan_detail: string;
  status: string;
}

interface DashboardData {
  user: { nama: string; foto_profile: string | null };
  hewan: Pet[];
  booking_aktif: BookingAktif | null;
  total_kunjungan: number;
  riwayat_terakhir: RiwayatItem[];
}

// ── Constants ─────────────────────────────────────────────────────────────────

const API_URL    = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
const G          = "#2e7d32";
// Polling setiap 15 detik untuk cek perubahan status booking
const POLL_MS    = 15_000;

// Konfigurasi tampilan per status
const STATUS_CFG: Record<string, {
  label: string;
  badge: "green" | "blue" | "amber" | "red";
  icon: string;
  bg: string;
  border: string;
  dot: string;
}> = {
  menunggu: {
    label: "Menunggu Konfirmasi",
    badge: "amber",
    icon: "⏳",
    bg: "#fffde7",
    border: "#ffe082",
    dot: "#f59e0b",
  },
  dikonfirmasi: {
    label: "Dikonfirmasi",
    badge: "blue",
    icon: "✅",
    bg: "#e3f2fd",
    border: "#90caf9",
    dot: "#1565c0",
  },
  diproses: {
    label: "Sedang Diproses",
    badge: "blue",
    icon: "🔄",
    bg: "#e8f5e9",
    border: "#a5d6a7",
    dot: "#2e7d32",
  },
  dibatalkan: {
    label: "Dibatalkan",
    badge: "red",
    icon: "❌",
    bg: "#fce4ec",
    border: "#f48fb1",
    dot: "#c62828",
  },
  selesai: {
    label: "Selesai",
    badge: "green",
    icon: "🎉",
    bg: "#e8f5e9",
    border: "#c8e6c9",
    dot: "#2e7d32",
  },
};

// Toast message ketika status berubah
const STATUS_TOAST: Record<string, { title: string; msg: string; type: "success" | "info" | "error" }> = {
  dikonfirmasi: {
    title: "Booking dikonfirmasi!",
    msg:   "Jadwal kunjungan Anda telah dikonfirmasi oleh klinik.",
    type:  "success",
  },
  diproses: {
    title: "Hewan sedang diproses",
    msg:   "Hewan Anda sedang mendapat penanganan dari dokter.",
    type:  "info",
  },
  dibatalkan: {
    title: "Booking dibatalkan",
    msg:   "Booking Anda telah dibatalkan. Silakan hubungi klinik.",
    type:  "error",
  },
  selesai: {
    title: "Layanan selesai! 🎉",
    msg:   "Terima kasih, hewan Anda telah selesai ditangani.",
    type:  "success",
  },
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtDate(d: string) {
  if (!d) return "–";
  return new Date(d).toLocaleDateString("id-ID", {
    day: "2-digit", month: "short", year: "numeric",
  });
}

function todayStr() {
  return new Date().toLocaleDateString("id-ID", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });
}

function getAuthToken(): string {
  return typeof window !== "undefined"
    ? (sessionStorage.getItem("token") ?? "")
    : "";
}

// ── Sub-components ────────────────────────────────────────────────────────────

function Badge({
  children,
  variant = "green",
}: {
  children: React.ReactNode;
  variant?: "green" | "blue" | "amber" | "red";
}) {
  const map: Record<string, React.CSSProperties> = {
    green: { background: "#e8f5e9", color: "#2e7d32" },
    blue:  { background: "#e3f2fd", color: "#1565c0" },
    amber: { background: "#fff8e1", color: "#a16207" },
    red:   { background: "#fce4ec", color: "#c62828" },
  };
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: "2px 9px",
        borderRadius: 20,
        fontSize: 11,
        fontWeight: 600,
        ...map[variant],
      }}
    >
      {children}
    </span>
  );
}

function StatCard({
  label,
  value,
  sub,
  subColor,
}: {
  label: string;
  value: string;
  sub?: string;
  subColor?: string;
}) {
  return (
    <div
      style={{
        background: "#ffffff",
        borderRadius: 10,
        padding: "12px 14px",
        border: "1px solid #f0f0f0",
      }}
    >
      <div style={{ fontSize: 11, color: "#888", marginBottom: 4 }}>{label}</div>
      <div
        style={{
          fontSize: 22,
          fontWeight: 700,
          color: "#1a1a1a",
          lineHeight: 1.1,
        }}
        dangerouslySetInnerHTML={{ __html: value }}
      />
      {sub && (
        <div style={{ fontSize: 11, color: subColor ?? "#888", marginTop: 2 }}>
          {sub}
        </div>
      )}
    </div>
  );
}

function PetCard({
  pet,
  onDetail,
  onBooking,
}: {
  pet: Pet;
  onDetail(): void;
  onBooking(): void;
}) {
  return (
    <div
      style={{
        borderRadius: 12,
        overflow: "hidden",
        border: "1.5px solid #e0e0e0",
        background: "#fff",
      }}
    >
      <div
        style={{
          background: G,
          padding: "14px",
          display: "flex",
          alignItems: "center",
          gap: 10,
        }}
      >
        <div
          style={{
            width: 52,
            height: 52,
            borderRadius: 10,
            background: "rgba(255,255,255,0.15)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            overflow: "hidden",
            flexShrink: 0,
          }}
        >
          {pet.photo ? (
            <img
              src={pet.photo}
              alt={pet.name}
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          ) : (
            <span style={{ fontSize: 28 }}>{pet.emoji}</span>
          )}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: "#fff" }}>
            {pet.name}
          </div>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.75)" }}>
            {pet.type} · {pet.breed}
          </div>
          <span
            style={{
              display: "inline-block",
              marginTop: 4,
              fontSize: 10,
              fontWeight: 600,
              background: "rgba(255,255,255,0.2)",
              color: "#fff",
              padding: "1px 8px",
              borderRadius: 10,
            }}
          >
            Sehat
          </span>
        </div>
      </div>
      <div style={{ padding: "12px 14px" }}>
        {[
          ["Usia",  pet.age],
          ["Berat", pet.weight],
          ["Jenis", pet.type],
        ].map(([label, val], i, arr) => (
          <div
            key={label}
            style={{
              display: "flex",
              justifyContent: "space-between",
              fontSize: 12,
              padding: "5px 0",
              borderBottom: i < arr.length - 1 ? "1px solid #f0f0f0" : "none",
            }}
          >
            <span style={{ color: "#888" }}>{label}</span>
            <span style={{ fontWeight: 600, color: "#1a1a1a" }}>{val}</span>
          </div>
        ))}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 8,
            marginTop: 10,
          }}
        >
          <button
            onClick={onDetail}
            style={{
              padding: "7px 0",
              borderRadius: 8,
              border: `1.5px solid ${G}`,
              background: "#fff",
              color: G,
              fontWeight: 700,
              fontSize: 12,
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            Detail
          </button>
          <button
            onClick={onBooking}
            style={{
              padding: "7px 0",
              borderRadius: 8,
              border: "none",
              background: G,
              color: "#fff",
              fontWeight: 700,
              fontSize: 12,
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            Booking
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Skeleton Loader ───────────────────────────────────────────────────────────

function Skeleton({
  w = "100%",
  h = 16,
  radius = 6,
}: {
  w?: string | number;
  h?: number;
  radius?: number;
}) {
  return (
    <div
      style={{
        width: w,
        height: h,
        borderRadius: radius,
        background:
          "linear-gradient(90deg,#f0f0f0 25%,#e0e0e0 50%,#f0f0f0 75%)",
        backgroundSize: "200% 100%",
        animation: "shimmer 1.5s infinite",
      }}
    />
  );
}

// ── Booking Info Card ─────────────────────────────────────────────────────────

function BookingInfoCard({
  booking,
  onBuat,
}: {
  booking: BookingAktif | null;
  onBuat(): void;
}) {
  if (!booking) {
    return (
      <div>
        <div
          style={{
            padding: "20px",
            textAlign: "center",
            color: "#aaa",
            background: "#fafafa",
            borderRadius: 10,
            marginBottom: 10,
          }}
        >
          <div style={{ fontSize: 28, marginBottom: 6 }}>📅</div>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 3 }}>
            Belum ada booking aktif
          </div>
          <div style={{ fontSize: 12 }}>Buat booking untuk hewan kesayanganmu</div>
        </div>
        <button
          onClick={onBuat}
          style={{
            width: "100%",
            padding: "9px 0",
            borderRadius: 8,
            border: "none",
            background: G,
            color: "#fff",
            fontWeight: 700,
            fontSize: 13,
            cursor: "pointer",
            fontFamily: "inherit",
          }}
        >
          + Buat Booking Baru
        </button>
      </div>
    );
  }

  const cfg = STATUS_CFG[booking.status] ?? STATUS_CFG["menunggu"];

  return (
    <div>
      {/* Card status */}
      <div
        style={{
          borderRadius: 12,
          border: `1.5px solid ${cfg.border}`,
          background: cfg.bg,
          padding: "14px 16px",
          marginBottom: 12,
          transition: "all .4s ease",
        }}
      >
        {/* Header baris: ikon status + label + dot animasi */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 10,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 18 }}>{cfg.icon}</span>
            <Badge variant={cfg.badge}>{cfg.label}</Badge>
          </div>
          {/* Indikator live polling */}
          <div
            title="Status diperbarui otomatis"
            style={{ display: "flex", alignItems: "center", gap: 4 }}
          >
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: cfg.dot,
                display: "inline-block",
                animation: "pulse 1.8s infinite",
              }}
            />
            <span style={{ fontSize: 10, color: "#aaa" }}>Live</span>
          </div>
        </div>

        {/* Detail booking */}
        <div
          style={{
            fontSize: 15,
            fontWeight: 700,
            color: "#1a1a1a",
            marginBottom: 2,
          }}
        >
          {booking.hewan_nama}
        </div>
        <div style={{ fontSize: 12, color: "#666", marginBottom: 8 }}>
          {booking.layanan_nama ?? "–"}
        </div>

        {/* Grid info */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 6,
          }}
        >
          {[
            ["📅 Tanggal", fmtDate(booking.tanggal_booking)],
            ["🕐 Jam",     `${booking.jam} WIB`],
            ["🔖 No. Booking", `#${booking.no_booking}`],
            ["🔢 Antrian", String(booking.no_antrian).padStart(3, "0")],
          ].map(([label, val]) => (
            <div
              key={label}
              style={{
                background: "rgba(255,255,255,0.65)",
                borderRadius: 8,
                padding: "7px 10px",
              }}
            >
              <div style={{ fontSize: 10, color: "#888", marginBottom: 1 }}>
                {label}
              </div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#1a1a1a" }}>
                {val}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Stepper status */}
      <StatusStepper status={booking.status} />

      <button
        onClick={onBuat}
        style={{
          width: "100%",
          padding: "9px 0",
          borderRadius: 8,
          border: "none",
          background: G,
          color: "#fff",
          fontWeight: 700,
          fontSize: 13,
          cursor: "pointer",
          fontFamily: "inherit",
          marginTop: 12,
        }}
      >
        + Buat Booking Baru
      </button>
    </div>
  );
}

// ── Status Stepper ────────────────────────────────────────────────────────────

const STEPS = [
  { key: "menunggu",    label: "Menunggu" },
  { key: "dikonfirmasi",label: "Dikonfirmasi" },
  { key: "diproses",    label: "Diproses" },
  { key: "selesai",     label: "Selesai" },
];

function StatusStepper({ status }: { status: string }) {
  // Untuk "dibatalkan" tampilkan baris khusus
  if (status === "dibatalkan") {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "8px 12px",
          background: "#fce4ec",
          borderRadius: 8,
          marginBottom: 4,
        }}
      >
        <span style={{ fontSize: 16 }}>❌</span>
        <span style={{ fontSize: 12, fontWeight: 600, color: "#c62828" }}>
          Booking ini telah dibatalkan
        </span>
      </div>
    );
  }

  const activeIdx = STEPS.findIndex((s) => s.key === status);

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        marginBottom: 4,
        padding: "6px 0",
      }}
    >
      {STEPS.map((step, i) => {
        const done    = i < activeIdx;
        const current = i === activeIdx;
        return (
          <div
            key={step.key}
            style={{ display: "flex", alignItems: "center", flex: i < STEPS.length - 1 ? 1 : undefined }}
          >
            {/* Lingkaran */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 3,
              }}
            >
              <div
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: "50%",
                  background: done || current ? G : "#e0e0e0",
                  border: current ? `3px solid #a5d6a7` : "none",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "background .4s",
                  boxSizing: "border-box",
                }}
              >
                {done && (
                  <span style={{ fontSize: 11, color: "#fff", fontWeight: 700 }}>✓</span>
                )}
                {current && (
                  <span
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      background: "#fff",
                      display: "block",
                    }}
                  />
                )}
              </div>
              <span
                style={{
                  fontSize: 9,
                  fontWeight: current ? 700 : 400,
                  color: done || current ? G : "#bbb",
                  whiteSpace: "nowrap",
                  transition: "color .4s",
                }}
              >
                {step.label}
              </span>
            </div>

            {/* Garis penghubung */}
            {i < STEPS.length - 1 && (
              <div
                style={{
                  flex: 1,
                  height: 3,
                  background: done ? G : "#e0e0e0",
                  marginBottom: 14,
                  transition: "background .4s",
                }}
              />
            )}
          </div>
        );
      })}
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

  // Simpan status booking sebelumnya untuk deteksi perubahan
  const prevStatusRef = useRef<string | null>(null);
  const prevBookingId = useRef<number | null>(null);

  const token = getAuthToken();

  // ── Fetch dashboard ──────────────────────────────────────────────────────
  const fetchDashboard = useCallback(
    async (isPolling = false) => {
      try {
        const r = await fetch(`${API_URL}/api/owner_pet/dashboard`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        const res = await r.json();
        if (!res.success) throw new Error("Response tidak sukses");

        const incoming = res.data as DashboardData;

        // ── Deteksi perubahan status booking ──────────────────────────────
        if (isPolling && incoming.booking_aktif) {
          const baru    = incoming.booking_aktif;
          const samaPet = prevBookingId.current === baru.id_booking;
          const berubah = samaPet && prevStatusRef.current !== null
                          && prevStatusRef.current !== baru.status;

          if (berubah) {
            const t = STATUS_TOAST[baru.status];
            if (t) toast[t.type](t.title, t.msg);
          }

          prevStatusRef.current = baru.status;
          prevBookingId.current = baru.id_booking;
        } else if (!isPolling && incoming.booking_aktif) {
          // Inisialisasi referensi saat pertama kali load
          prevStatusRef.current = incoming.booking_aktif.status;
          prevBookingId.current = incoming.booking_aktif.id_booking;
        }

        setData(incoming);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "";
        if (!isPolling) {
          if (msg.includes("401")) {
            setError("Sesi habis, silakan login ulang.");
            router.push("/auth/login");
          } else {
            setError("Tidak dapat terhubung ke server.");
          }
        }
        // Saat polling gagal, diam saja — jangan ganggu UI
      } finally {
        if (!isPolling) setLoading(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [token, router]
  );

  // ── Mount: fetch awal + mulai polling ───────────────────────────────────
  useEffect(() => {
    if (!token) { router.push("/auth/login"); return; }

    fetchDashboard(false);

    const interval = setInterval(() => fetchDashboard(true), POLL_MS);
    return () => clearInterval(interval);
  }, [fetchDashboard, token, router]);

  const handleBooking = (petId?: number) => {
    if (petId) sessionStorage.setItem("sipeka_booking_pet", String(petId));
    router.push("/layanan/booking");
  };

  const handleDetail = (idHewan: number) => {
    router.push(`/hewan?id=${idHewan}`);
  };

  // ── Loading State ──────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div style={{ display: "flex", height: "100vh", overflow: "hidden" }}>
        <Sidebar activePage="dashboard" />
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            overflow: "auto",
            background: "#f9f9f9",
          }}
        >
          <Header title="Dashboard" subtitle="Selamat datang di SIPEKA" />
          <div
            style={{
              padding: "20px 28px 32px",
              display: "flex",
              flexDirection: "column",
              gap: 16,
            }}
          >
            <style>{`
              @keyframes shimmer {
                0%   { background-position: 200% 0; }
                100% { background-position: -200% 0; }
              }
              @keyframes pulse {
                0%, 100% { opacity: 1; transform: scale(1); }
                50%       { opacity: 0.4; transform: scale(0.85); }
              }
            `}</style>
            <div
              style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12 }}
            >
              {[1, 2, 3].map((i) => <Skeleton key={i} h={80} radius={10} />)}
            </div>
            <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
              {[1, 2].map((i) => <Skeleton key={i} w={220} h={260} radius={12} />)}
            </div>
            <div
              style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}
            >
              <Skeleton h={200} radius={12} />
              <Skeleton h={200} radius={12} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Error State ────────────────────────────────────────────────────────────
  if (error || !data) {
    return (
      <div style={{ display: "flex", height: "100vh", overflow: "hidden" }}>
        <Sidebar activePage="dashboard" />
        <div
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "#f9f9f9",
          }}
        >
          <div style={{ textAlign: "center", color: "#888" }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>⚠️</div>
            <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 6 }}>
              {error ?? "Terjadi kesalahan"}
            </div>
            <button
              onClick={() => window.location.reload()}
              style={{
                marginTop: 8,
                padding: "8px 20px",
                borderRadius: 8,
                border: "none",
                background: G,
                color: "#fff",
                fontWeight: 700,
                fontSize: 13,
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              Coba Lagi
            </button>
          </div>
        </div>
      </div>
    );
  }

  const { user, hewan, booking_aktif, total_kunjungan, riwayat_terakhir } = data;

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div
      style={{
        display: "flex",
        height: "100vh",
        overflow: "hidden",
        fontFamily: "'Poppins', sans-serif",
      }}
    >
      <Sidebar activePage="dashboard" />

      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          overflow: "auto",
          background: "#f9f9f9",
        }}
      >
        <Header title="Dashboard" subtitle="Selamat datang di SIPEKA" />

        <style>{`
          @keyframes pulse {
            0%, 100% { opacity: 1; transform: scale(1); }
            50%       { opacity: 0.4; transform: scale(0.85); }
          }
          @keyframes shimmer {
            0%   { background-position: 200% 0; }
            100% { background-position: -200% 0; }
          }
        `}</style>

        <div style={{ padding: "20px 28px 32px" }}>

          {/* ── Greeting ── */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 20,
              flexWrap: "wrap",
              gap: 10,
            }}
          >
            <div>
              <div style={{ fontSize: 18, fontWeight: 700, color: "#1a1a1a" }}>
                Halo, {user.nama}! 👋
              </div>
              <div style={{ fontSize: 13, color: "#888", marginTop: 2 }}>
                {todayStr()}
              </div>
            </div>
            <button
              onClick={() => handleBooking()}
              style={{
                padding: "10px 20px",
                borderRadius: 8,
                border: "none",
                background: G,
                color: "#fff",
                fontWeight: 700,
                fontSize: 13,
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              + Booking Baru
            </button>
          </div>

          {/* ── Quick Stats ── */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: 12,
              marginBottom: 24,
            }}
          >
            <StatCard
              label="Hewan Saya"
              value={`${hewan.length} <span style="font-size:13px;font-weight:400;color:#888;">ekor</span>`}
              sub={
                hewan.length > 0
                  ? hewan.map((p) => p.name).join(", ")
                  : "Belum ada hewan"
              }
            />
            <StatCard
              label="Booking Aktif"
              value={
                booking_aktif
                  ? `1 <span style="font-size:13px;font-weight:400;color:#888;">jadwal</span>`
                  : `0 <span style="font-size:13px;font-weight:400;color:#888;">jadwal</span>`
              }
              sub={
                booking_aktif
                  ? `${fmtDate(booking_aktif.tanggal_booking)} · ${booking_aktif.jam}`
                  : "Belum ada booking"
              }
              subColor={booking_aktif ? "#1565c0" : "#aaa"}
            />
            <StatCard
              label="Total Kunjungan"
              value={`${total_kunjungan} <span style="font-size:13px;font-weight:400;color:#888;">kali</span>`}
              sub="Riwayat layanan selesai"
            />
          </div>

          {/* ── Hewan Saya ── */}
          <div style={{ marginBottom: 24 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 12,
              }}
            >
              <h2 style={{ fontSize: 15, fontWeight: 700, color: G }}>Hewan Saya</h2>
              <button
                onClick={() => router.push("/hewan")}
                style={{
                  fontSize: 12,
                  padding: "5px 14px",
                  borderRadius: 8,
                  border: `1.5px solid ${G}`,
                  background: "#fff",
                  color: G,
                  fontWeight: 600,
                  cursor: "pointer",
                  fontFamily: "inherit",
                }}
              >
                Kelola Hewan
              </button>
            </div>

            {hewan.length === 0 ? (
              <div
                style={{ textAlign: "center", padding: "40px 0", color: "#aaa" }}
              >
                <div style={{ fontSize: 40, marginBottom: 10 }}>🐾</div>
                <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>
                  Belum ada hewan
                </div>
                <div style={{ fontSize: 13 }}>
                  Tambahkan hewan di menu Data Hewan
                </div>
              </div>
            ) : (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 16 }}>
                {hewan.map((pet) => (
                  <div key={pet.id_hewan} style={{ width: 220 }}>
                    <PetCard
                      pet={pet}
                      onDetail={() => handleDetail(pet.id_hewan)}
                      onBooking={() => handleBooking(pet.id_hewan)}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ── Informasi Booking & Riwayat ── */}
          <div
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}
          >
            {/* ── Informasi Booking ── */}
            <div
              style={{
                background: "#fff",
                borderRadius: 12,
                padding: "16px 18px",
                border: "1px solid #f0f0f0",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: 14,
                }}
              >
                <h2 style={{ fontSize: 15, fontWeight: 700, color: G }}>
                  Informasi Booking
                </h2>
                {booking_aktif && (
                  <span style={{ fontSize: 11, color: "#aaa" }}>
                    Diperbarui otomatis
                  </span>
                )}
              </div>
              <BookingInfoCard
                booking={booking_aktif}
                onBuat={() => handleBooking()}
              />
            </div>

            {/* ── Riwayat Terakhir ── */}
            <div
              style={{
                background: "#fff",
                borderRadius: 12,
                padding: "16px 18px",
                border: "1px solid #f0f0f0",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: 12,
                }}
              >
                <h2 style={{ fontSize: 15, fontWeight: 700, color: G }}>
                  Riwayat Terakhir
                </h2>
                <button
                  onClick={() => router.push("/layanan/riwayat")}
                  style={{
                    fontSize: 12,
                    padding: "4px 12px",
                    borderRadius: 8,
                    border: `1.5px solid ${G}`,
                    background: "#fff",
                    color: G,
                    fontWeight: 600,
                    cursor: "pointer",
                    fontFamily: "inherit",
                  }}
                >
                  Lihat Semua
                </button>
              </div>

              {riwayat_terakhir.length === 0 ? (
                <div
                  style={{
                    textAlign: "center",
                    padding: "30px 0",
                    color: "#aaa",
                    fontSize: 13,
                  }}
                >
                  Belum ada riwayat layanan
                </div>
              ) : (
                <div>
                  {riwayat_terakhir.map((item, i) => (
                    <div
                      key={item.id_riwayat}
                      style={{
                        display: "flex",
                        alignItems: "flex-start",
                        gap: 10,
                        padding: "9px 0",
                        borderBottom:
                          i < riwayat_terakhir.length - 1
                            ? "1px solid #f0f0f0"
                            : "none",
                      }}
                    >
                      <div
                        style={{
                          minWidth: 36,
                          textAlign: "center",
                          background: "#f5f5f5",
                          borderRadius: 8,
                          padding: "4px 6px",
                          flexShrink: 0,
                        }}
                      >
                        <div
                          style={{
                            fontSize: 15,
                            fontWeight: 700,
                            color: "#1a1a1a",
                          }}
                        >
                          {item.tanggal}
                        </div>
                        <div style={{ fontSize: 10, color: "#888" }}>
                          {item.bulan?.slice(0, 3)}
                        </div>
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            fontSize: 13,
                            fontWeight: 600,
                            color: "#1a1a1a",
                          }}
                        >
                          {item.layanan_utama} — {item.hewan_nama}
                        </div>
                        <div
                          style={{ fontSize: 11, color: "#888", marginTop: 1 }}
                        >
                          {item.layanan_detail}
                        </div>
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

      {/* ── Toast Notifications ── */}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
}