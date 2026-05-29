"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { Users, CalendarCheck, FolderOpen, CheckCircle, Clock, XCircle } from "lucide-react";
import Sidebar from "@/components/Sidebar_dokter";
import Header from "@/components/Header";

// ── Types ──────────────────────────────────────────────────────────────────────

interface StatJadwal {
  total: number;
  selesai: number;
  menunggu: number;
  dibatalkan: number;
}

interface StatBooking {
  total: number;
  selesai: number;
  menunggu: number;
  dibatalkan: number;
}

interface StatCards {
  jadwal_hari_ini: StatJadwal;
  booking_hari_ini: StatBooking;
  rekam_medis_bulan_ini: number;
}

interface PasienTerbaru {
  id_booking: number;
  nama_hewan: string;
  jenis: string;
  ras: string | null;
  foto: string | null;
  nama_pemilik: string;
  layanan: string;
  status: "menunggu" | "dikonfirmasi" | "berlangsung" | "selesai" | "dibatalkan";
  diagnosa: string | null;
  waktu: string;
}

interface RingkasanKunjungan {
  bulan_ini: number;
  tahun_ini: number;
}

interface DashboardData {
  nama_dokter: string;
  stat_cards: StatCards;
  pasien_terbaru: PasienTerbaru[];
  ringkasan_kunjungan: RingkasanKunjungan;
}

// ── Constants ──────────────────────────────────────────────────────────────────

const G       = "#2e7d32";
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
const API     = "/api/dokter/dashboard";
const POLL_MS = 30_000;

// ── Auth Helper ────────────────────────────────────────────────────────────────

function getAuthToken(): string {
  return typeof window !== "undefined"
    ? (sessionStorage.getItem("token") ?? "")
    : "";
}

// ── API Helper ─────────────────────────────────────────────────────────────────

async function apiFetch<T>(
  url: string
): Promise<{ success: boolean; data?: T; message?: string; status?: number }> {
  const token = getAuthToken();
  if (!token) return { success: false, message: "Token tidak ditemukan.", status: 401 };
  try {
    const res  = await fetch(`${API_URL}${url}`, {
      headers: { Accept: "application/json", Authorization: `Bearer ${token}` },
    });
    const json = await res.json();
    if (!res.ok) return { success: false, message: json.message ?? "Terjadi kesalahan.", status: res.status };
    return { ...json, status: res.status };
  } catch {
    return { success: false, message: "Koneksi ke server gagal." };
  }
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function hewanEmoji(jenis: string) {
  const j = (jenis ?? "").toLowerCase();
  if (j.includes("kucing") || j.includes("cat"))     return "🐱";
  if (j.includes("anjing") || j.includes("dog"))     return "🐕";
  if (j.includes("kelinci") || j.includes("rabbit")) return "🐇";
  if (j.includes("burung") || j.includes("bird"))    return "🐦";
  if (j.includes("hamster"))                          return "🐹";
  return "🐾";
}

const layananStyle: Record<string, { bg: string; color: string }> = {
  "Pemeriksaan Kesehatan": { bg: "#e8f5e9", color: G },
  "Grooming":              { bg: "#fce4ec", color: "#ad1457" },
  "Vaksinasi":             { bg: "#e3f2fd", color: "#1565c0" },
  "Rawat Inap":            { bg: "#fff3e0", color: "#e65100" },
};

function getLayananStyle(layanan: string) {
  return layananStyle[layanan] ?? { bg: "#f5f5f5", color: "#555" };
}

function getStatusStyle(status: string): { color: string; dot: string; label: string } {
  switch (status) {
    case "selesai":      return { color: G,         dot: G,         label: "Selesai"      };
    case "menunggu":     return { color: "#b45309", dot: "#f59e0b", label: "Menunggu"     };
    case "dikonfirmasi": return { color: "#1565c0", dot: "#1e88e5", label: "Dikonfirmasi" };
    case "berlangsung":  return { color: "#6a1b9a", dot: "#9c27b0", label: "Berlangsung"  };
    case "dibatalkan":   return { color: "#c62828", dot: "#e53935", label: "Dibatalkan"   };
    default:             return { color: "#888",    dot: "#bbb",    label: status         };
  }
}

function todayLabel() {
  return new Date().toLocaleDateString("id-ID", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });
}

// ── Skeleton ───────────────────────────────────────────────────────────────────

function Skeleton({ w, h, r = 6 }: { w: number | string; h: number; r?: number }) {
  return (
    <div style={{
      width: w, height: h, borderRadius: r,
      background: "linear-gradient(90deg,#f0f0f0 25%,#e6e6e6 50%,#f0f0f0 75%)",
      backgroundSize: "200% 100%", animation: "shimmer 1.5s infinite",
    }} />
  );
}

// ── Stat Card ──────────────────────────────────────────────────────────────────

function StatCard({
  icon,
  label,
  value,
  sub,
  iconBg,
  iconColor,
  accent,
  loading,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub: string;
  iconBg: string;
  iconColor: string;
  accent: string;
  loading: boolean;
}) {
  const [hov, setHov] = useState(false);
  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: "#fff",
        borderRadius: 14,
        border: "1.5px solid #e0e0e0",
        overflow: "hidden",
        boxShadow: hov ? "0 8px 24px rgba(0,0,0,0.10)" : "0 2px 8px rgba(0,0,0,0.06)",
        transform: hov ? "translateY(-3px)" : "none",
        transition: "all .2s ease",
        padding: "20px",
        display: "flex",
        alignItems: "flex-start",
        gap: 16,
        cursor: "default",
      }}
    >
      {/* Icon box */}
      <div style={{
        width: 50, height: 50, borderRadius: 12, background: iconBg,
        display: "flex", alignItems: "center", justifyContent: "center",
        flexShrink: 0, color: iconColor,
      }}>
        {icon}
      </div>

      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 12, color: "#888", fontWeight: 500, marginBottom: 6 }}>
          {label}
        </div>
        {loading ? (
          <>
            <Skeleton w={56} h={28} r={8} />
            <div style={{ marginTop: 6 }}><Skeleton w={120} h={12} /></div>
          </>
        ) : (
          <>
            <div style={{ fontSize: 28, fontWeight: 700, color: accent, lineHeight: 1 }}>
              {value}
            </div>
            <div style={{ fontSize: 12, color: "#aaa", marginTop: 5 }}>{sub}</div>
          </>
        )}
      </div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const router = useRouter();

  const [data,    setData]    = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);
  const [today,   setToday]   = useState("");

  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    setToday(todayLabel());
    return () => { mountedRef.current = false; };
  }, []);

  // ── Fetch ────────────────────────────────────────────────────────────────────

  const fetchDashboard = useCallback(
    async (isPolling = false) => {
      const token = getAuthToken();
      if (!token) { router.push("/auth/login"); return; }

      if (!isPolling) { setLoading(true); setError(null); }

      const res = await apiFetch<DashboardData>(API);
      if (!mountedRef.current) return;

      if (res.status === 401) {
        sessionStorage.removeItem("token");
        router.push("/auth/login");
        return;
      }

      if (res.success && res.data) {
        setData(res.data);
      } else if (!isPolling) {
        setError(res.message ?? "Gagal memuat data dashboard.");
      }

      if (!isPolling && mountedRef.current) setLoading(false);
    },
    [router]
  );

  // ── Mount ────────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!getAuthToken()) { router.push("/auth/login"); return; }
    fetchDashboard(false);
    const interval = setInterval(() => fetchDashboard(true), POLL_MS);
    return () => clearInterval(interval);
  }, [fetchDashboard, router]);

  // ── Derived values ───────────────────────────────────────────────────────────

  const booking = data?.stat_cards.booking_hari_ini;
  const rmCount = data?.stat_cards.rekam_medis_bulan_ini ?? 0;

  const subtitleText = loading || !data
    ? `Selamat datang · ${today}`
    : `Selamat datang, ${data.nama_dokter} · ${today}`;

  // Stat cards — "Jadwal Hari Ini" → "Total Pasien / Hewan", pakai lucide icons
  const statCards = [
    {
      icon:      <Users size={22} />,
      label:     "Total Pasien / Hewan Bulan Ini",
      value:     loading ? "—" : String(booking?.total ?? 0),
      sub:       loading ? "" : `${booking?.selesai ?? 0} selesai · ${booking?.menunggu ?? 0} menunggu`,
      iconBg:    "#e8f5e9",
      iconColor: G,
      accent:    G,
    },
    {
      icon:      <CalendarCheck size={22} />,
      label:     "Booking Bulan Ini",
      value:     loading ? "—" : String(booking?.total ?? 0),
      sub:       loading ? "" : `${booking?.selesai ?? 0} selesai · ${booking?.menunggu ?? 0} menunggu`,
      iconBg:    "#f3e8ff",
      iconColor: "#6a1b9a",
      accent:    "#6a1b9a",
    },
    {
      icon:      <FolderOpen size={22} />,
      label:     "Rekam Medis Bulan Ini",
      value:     loading ? "—" : String(rmCount),
      sub:       "Sudah dicatat",
      iconBg:    "#e3f2fd",
      iconColor: "#1565c0",
      accent:    "#1565c0",
    },
  ];

  // ── Shared styles ────────────────────────────────────────────────────────────

  const cardStyle: React.CSSProperties = {
    background: "#fff", borderRadius: 14, border: "1.5px solid #e0e0e0",
    overflow: "hidden", boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
  };

  const cardHeaderStyle: React.CSSProperties = {
    display: "flex", alignItems: "center", justifyContent: "space-between",
    padding: "16px 20px", borderBottom: "1.5px solid #e0e0e0",
  };

  // ── Error State ──────────────────────────────────────────────────────────────

  if (error) {
    return (
      <div style={{ display: "flex", height: "100vh", overflow: "hidden" }}>
        <Sidebar activePage="dashboard" />
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "auto", background: "#f9f9f9" }}>
          <Header title="Dashboard" subtitle={`Selamat datang · ${today}`} />
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 12 }}>
            <div style={{ fontSize: 40 }}>⚠️</div>
            <div style={{ fontSize: 15, color: "#c62828", fontWeight: 600 }}>{error}</div>
            <button
              onClick={() => fetchDashboard(false)}
              style={{
                marginTop: 8, padding: "10px 24px", borderRadius: 8,
                border: `1.5px solid ${G}`, background: "#fff", color: G,
                fontWeight: 700, fontSize: 14, cursor: "pointer", fontFamily: "inherit",
              }}
            >
              Coba Lagi
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden" }}>
      <Sidebar activePage="dashboard" />

      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "auto", background: "#f9f9f9" }}>
        <Header title="Dashboard" subtitle={subtitleText} />

        <style>{`
          @keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
          @keyframes fadeUp  { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: none; } }
        `}</style>

        <div style={{ padding: "24px 28px" }}>
          <div style={{ maxWidth: 1100, margin: "0 auto" }}>

            {/* ── Stat Cards ── */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16, marginBottom: 24 }}>
              {statCards.map((s, i) => (
                <div key={s.label} style={{ animation: `fadeUp .35s ease both`, animationDelay: `${i * 60}ms` }}>
                  <StatCard {...s} loading={loading} />
                </div>
              ))}
            </div>

            {/* ── Main Grid ── */}
            <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: 16, alignItems: "start" }}>

              {/* ── Pasien Terbaru ── */}
              <div style={cardStyle}>
                <div style={cardHeaderStyle}>
                  <span style={{ fontWeight: 700, fontSize: 15, color: "#1a1a1a" }}>Pasien Terbaru</span>
                  <span style={{ fontSize: 12, color: "#aaa" }}>
                    {!loading && `${data?.pasien_terbaru.length ?? 0} ditampilkan`}
                  </span>
                </div>
                <div style={{ padding: "8px 20px" }}>
                  {loading ? (
                    Array.from({ length: 4 }).map((_, i) => (
                      <div key={i} style={{ display: "flex", alignItems: "center", gap: 14, padding: "13px 0", borderBottom: i < 3 ? "1px solid #f0f0f0" : "none" }}>
                        <Skeleton w={46} h={46} r={12} />
                        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
                          <Skeleton w={120} h={13} />
                          <Skeleton w={180} h={11} />
                        </div>
                        <Skeleton w={90} h={24} r={99} />
                      </div>
                    ))
                  ) : (data?.pasien_terbaru ?? []).length === 0 ? (
                    <div style={{ padding: "36px 0", textAlign: "center", color: "#bbb", fontSize: 14 }}>
                      <div style={{ fontSize: 30, marginBottom: 8 }}>📭</div>
                      Belum ada pasien hari ini.
                    </div>
                  ) : (
                    (data?.pasien_terbaru ?? []).map((p, i) => {
                      const badge  = getLayananStyle(p.layanan);
                      const status = getStatusStyle(p.status);
                      const list   = data?.pasien_terbaru ?? [];
                      return (
                        <div
                          key={p.id_booking}
                          style={{
                            display: "flex", alignItems: "center", gap: 14,
                            padding: "12px 0",
                            borderBottom: i < list.length - 1 ? "1px solid #f0f0f0" : "none",
                            animation: `fadeUp .3s ease both`, animationDelay: `${i * 50}ms`,
                          }}
                        >
                          {/* Avatar */}
                          <div style={{
                            width: 46, height: 46, borderRadius: 12,
                            background: p.foto ? "transparent" : "#f0faf0",
                            border: "1.5px solid #e0e0e0",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            fontSize: 22, flexShrink: 0, overflow: "hidden",
                          }}>
                            {p.foto
                              ? <img src={p.foto} alt={p.nama_hewan} style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: 10 }} />
                              : hewanEmoji(p.jenis)
                            }
                          </div>

                          {/* Info */}
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontWeight: 700, fontSize: 14, color: "#1a1a1a" }}>{p.nama_pemilik}</div>
                            <div style={{ fontSize: 12, color: "#888", marginTop: 2 }}>
                              {p.nama_hewan} · {p.jenis}{p.ras ? ` · ${p.ras}` : ""}
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4 }}>
                              <div style={{ fontSize: 11, color: "#bbb" }}>{p.waktu}</div>
                              <span style={{ width: 5, height: 5, borderRadius: "50%", background: status.dot, display: "inline-block" }} />
                              <span style={{ fontSize: 11, color: status.color, fontWeight: 600 }}>{status.label}</span>
                            </div>
                          </div>

                          {/* Badge layanan */}
                          <span style={{
                            padding: "4px 12px", borderRadius: 999, fontSize: 11, fontWeight: 700,
                            background: badge.bg, color: badge.color, whiteSpace: "nowrap", flexShrink: 0,
                          }}>
                            {p.layanan ?? "—"}
                          </span>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* ── Kolom kanan ── */}
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

                {/* ── Ringkasan Kunjungan ── */}
                <div style={cardStyle}>
                  <div style={cardHeaderStyle}>
                    <span style={{ fontWeight: 700, fontSize: 15, color: "#1a1a1a" }}>Ringkasan Kunjungan</span>
                  </div>
                  <div style={{ padding: "16px 20px", display: "flex", flexDirection: "column", gap: 12 }}>
                    {loading ? (
                      <>
                        <div style={{ borderRadius: 12, padding: "16px 18px", background: "#f0faf0", border: "1.5px solid #c8e6c9" }}>
                          <Skeleton w={100} h={12} />
                          <div style={{ marginTop: 10 }}><Skeleton w={60} h={28} r={8} /></div>
                        </div>
                        <div style={{ borderRadius: 12, padding: "16px 18px", background: "#e3f2fd", border: "1.5px solid #bbdefb" }}>
                          <Skeleton w={100} h={12} />
                          <div style={{ marginTop: 10 }}><Skeleton w={60} h={28} r={8} /></div>
                        </div>
                      </>
                    ) : (
                      [
                        {
                          label: "Total Bulan Ini",
                          value: data?.ringkasan_kunjungan.bulan_ini ?? 0,
                          sub:   new Date().toLocaleDateString("id-ID", { month: "long", year: "numeric" }),
                          bg: "#f0faf0", border: "#c8e6c9", valColor: G, subColor: "#5d8a5e",
                        },
                        {
                          label: "Total Tahun Ini",
                          value: data?.ringkasan_kunjungan.tahun_ini ?? 0,
                          sub:   `Jan – Des ${new Date().getFullYear()}`,
                          bg: "#e3f2fd", border: "#bbdefb", valColor: "#1565c0", subColor: "#5c7a9e",
                        },
                      ].map((item, i) => (
                        <div
                          key={item.label}
                          style={{
                            borderRadius: 12, padding: "16px 18px",
                            background: item.bg, border: `1.5px solid ${item.border}`,
                            animation: `fadeUp .35s ease both`, animationDelay: `${i * 80}ms`,
                          }}
                        >
                          <div style={{ fontSize: 12, color: "#888", fontWeight: 500, marginBottom: 6 }}>{item.label}</div>
                          <div style={{ fontSize: 32, fontWeight: 700, color: item.valColor, lineHeight: 1 }}>{item.value}</div>
                          <div style={{ fontSize: 12, color: item.subColor, marginTop: 4 }}>{item.sub}</div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* ── Breakdown Booking Bulan Ini ── */}
                {!loading && booking && (
                  <div style={cardStyle}>
                    <div style={cardHeaderStyle}>
                      <span style={{ fontWeight: 700, fontSize: 15, color: "#1a1a1a" }}>Booking Bulan Ini</span>
                    </div>
                    <div style={{ padding: "14px 20px", display: "flex", flexDirection: "column", gap: 10 }}>
                     {[
  { label: "Selesai",    value: booking.selesai,    color: G,         Icon: CheckCircle },
  { label: "Menunggu",   value: booking.menunggu,   color: "#f59e0b", Icon: Clock       },
  { label: "Dibatalkan", value: booking.dibatalkan, color: "#e53935", Icon: XCircle     },
].map(({ label, value, color, Icon }) => (
  <div key={label} style={{
    display: "flex", alignItems: "center", justifyContent: "space-between",
    padding: "10px 14px", borderRadius: 10, background: "#f9f9f9",
  }}>
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <Icon size={15} color={color} />
      <span style={{ fontSize: 13, fontWeight: 600, color }}>{label}</span>
    </div>
    <span style={{ fontSize: 18, fontWeight: 700, color: "#1a1a1a" }}>{value}</span>
  </div>
))}
                      <div style={{ textAlign: "center", paddingTop: 4, fontSize: 12, color: "#bbb" }}>
                        Total: <strong style={{ color: "#555" }}>{booking.total}</strong> booking
                      </div>
                    </div>
                  </div>
                )}

              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}