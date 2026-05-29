"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { CalendarDays, CalendarCheck, Users, Banknote, CheckCircle, Clock, XCircle } from "lucide-react";
import Sidebar from "@/components/Sidebar_admin";
import Header from "@/components/Header";

// ── Types ──────────────────────────────────────────────────────────────────────

interface StatCards {
  jadwal_hari_ini: { total: number };
  booking_hari_ini: {
    total: number;
    selesai: number;
    menunggu: number;
    dibatalkan: number;
  };
  total_hewan: number;
  pendapatan_bulan_ini: number | null;
}

interface PasienTerbaru {
  id_booking: number;
  nama_hewan: string;
  jenis: string;
  ras: string | null;
  foto: string | null;
  nama_pemilik: string;
  nama_dokter: string;
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
  stat_cards: StatCards;
  pasien_terbaru: PasienTerbaru[];
  ringkasan_kunjungan: RingkasanKunjungan;
}

// ── Constants ──────────────────────────────────────────────────────────────────

const G       = "#2e7d32";
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
const API     = "/api/admin/dashboard";
const POLL_MS = 30_000;

// ── Auth Helper ────────────────────────────────────────────────────────────────

function getAuthToken(): string {
  return typeof window !== "undefined"
    ? (sessionStorage.getItem("token") ?? localStorage.getItem("token") ?? "")
    : "";
}

// ── API Helper ─────────────────────────────────────────────────────────────────

async function apiFetch<T>(
  url: string
): Promise<{ success: boolean; data?: T; message?: string; status?: number }> {
  const token = getAuthToken();
  if (!token) return { success: false, message: "Token tidak ditemukan.", status: 401 };

  try {
    const res = await fetch(`${API_URL}${url}`, {
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    const contentType = res.headers.get("content-type") ?? "";
    if (!contentType.includes("application/json")) {
      return {
        success: false,
        message: `Server mengembalikan non-JSON (HTTP ${res.status}). Periksa URL API atau autentikasi.`,
        status: res.status,
      };
    }

    const json = await res.json();
    if (!res.ok) return { success: false, message: json.message ?? `HTTP Error ${res.status}`, status: res.status };
    return { ...json, status: res.status };
  } catch (err) {
    return { success: false, message: err instanceof Error ? err.message : "Koneksi ke server gagal." };
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

function getStatusStyle(status: string): { bg: string; color: string; dot: string; label: string } {
  switch (status) {
    case "selesai":      return { bg: "#e8f5e9", color: G,         dot: G,         label: "Selesai"       };
    case "menunggu":     return { bg: "#fff8e1", color: "#b45309", dot: "#f59e0b", label: "Menunggu"      };
    case "dikonfirmasi": return { bg: "#e3f2fd", color: "#1565c0", dot: "#1e88e5", label: "Dikonfirmasi"  };
    case "berlangsung":  return { bg: "#f3e8ff", color: "#6a1b9a", dot: "#9c27b0", label: "Berlangsung"   };
    case "dibatalkan":   return { bg: "#fce4ec", color: "#c62828", dot: "#e53935", label: "Dibatalkan"    };
    default:             return { bg: "#f5f5f5", color: "#888",    dot: "#bbb",    label: status          };
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
  icon, label, value, sub, iconBg, iconColor, accent, loading,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub: string | null;
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
        background: "#fff", borderRadius: 14, border: "1.5px solid #e0e0e0",
        overflow: "hidden",
        boxShadow: hov ? "0 8px 24px rgba(0,0,0,0.10)" : "0 2px 8px rgba(0,0,0,0.06)",
        transform: hov ? "translateY(-3px)" : "none",
        transition: "all .2s ease",
        padding: "16px", display: "flex", alignItems: "flex-start", gap: 12, cursor: "default",
      }}
    >
      <div style={{
        width: 42, height: 42, borderRadius: 10, background: iconBg,
        display: "flex", alignItems: "center", justifyContent: "center",
        flexShrink: 0, color: iconColor,
      }}>
        {icon}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 11, color: "#888", fontWeight: 500, marginBottom: 4, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{label}</div>
        {loading ? (
          <>
            <Skeleton w={48} h={24} r={8} />
            <div style={{ marginTop: 5 }}><Skeleton w={100} h={11} /></div>
          </>
        ) : (
          <>
            <div style={{ fontSize: 24, fontWeight: 700, color: accent, lineHeight: 1 }}>{value}</div>
            {sub && <div style={{ fontSize: 11, color: "#aaa", marginTop: 4 }}>{sub}</div>}
          </>
        )}
      </div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────

export default function DashboardAdminPage() {
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

  const fetchDashboard = useCallback(async (isPolling = false) => {
    const token = getAuthToken();
    if (!token) { router.push("/auth/login"); return; }

    if (!isPolling) { setLoading(true); setError(null); }

    const res = await apiFetch<DashboardData>(API);
    if (!mountedRef.current) return;

    if (res.status === 401) {
      sessionStorage.removeItem("token");
      localStorage.removeItem("token");
      router.push("/auth/login");
      return;
    }

    if (res.success && res.data) {
      setData(res.data);
      if (!isPolling) setError(null);
    } else if (!isPolling) {
      setError(res.message ?? "Gagal memuat data dashboard.");
    }

    if (!isPolling && mountedRef.current) setLoading(false);
  }, [router]);

  // ── Mount ────────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!getAuthToken()) { router.push("/auth/login"); return; }
    fetchDashboard(false);
    const interval = setInterval(() => fetchDashboard(true), POLL_MS);
    return () => clearInterval(interval);
  }, [fetchDashboard, router]);

  // ── Derived values ───────────────────────────────────────────────────────────

  const jadwal  = data?.stat_cards.jadwal_hari_ini;
  const booking = data?.stat_cards.booking_hari_ini;

  // Stat cards — pakai lucide icons, Total Pasien/Hewan berdasarkan booking Bulan Ini
  const statCards = [
    {
      icon:      <CalendarDays size={18} />,
      label:     "Jadwal Hari Ini",
      value:     loading ? "—" : String(jadwal?.total ?? 0),
      sub:       loading ? null : `${jadwal?.total ?? 0} jadwal terdaftar`,
      iconBg:    "#e8f5e9",
      iconColor: G,
      accent:    G,
    },
    {
      icon:      <CalendarCheck size={18} />,
      label:     "Booking Bulan Ini",
      value:     loading ? "—" : String(booking?.total ?? 0),
      sub:       loading ? null : `${booking?.selesai ?? 0} selesai · ${booking?.menunggu ?? 0} menunggu`,
      iconBg:    "#f3e8ff",
      iconColor: "#6a1b9a",
      accent:    "#6a1b9a",
    },
    {
      icon:      <Users size={18} />,
      label:     "Total Pasien / Hewan Bulan Ini",
      value:     loading ? "—" : String(booking?.total ?? 0),
      sub:       loading ? null : `${booking?.selesai ?? 0} selesai · ${booking?.menunggu ?? 0} menunggu`,
      iconBg:    "#e3f2fd",
      iconColor: "#1565c0",
      accent:    "#1565c0",
    },
    {
      icon:      <Banknote size={18} />,
      label:     "Pendapatan Bulan Ini",
      value:     loading ? "—"
        : data?.stat_cards.pendapatan_bulan_ini != null
          ? `Rp ${data.stat_cards.pendapatan_bulan_ini.toLocaleString("id-ID")}`
          : "—",
      sub:       !loading && data?.stat_cards.pendapatan_bulan_ini == null ? "Segera hadir" : null,
      iconBg:    "#fff8e1",
      iconColor: "#e65100",
      accent:    "#e65100",
    },
  ];

  // ── Shared styles ────────────────────────────────────────────────────────────

  const cardStyle: React.CSSProperties = {
    background: "#fff", borderRadius: 14,
    border: "1.5px solid #e0e0e0", overflow: "hidden",
    boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
  };

  const cardHeaderStyle: React.CSSProperties = {
    display: "flex", alignItems: "center", justifyContent: "space-between",
    padding: "16px 20px", borderBottom: "1.5px solid #e0e0e0",
  };

  // ── Error State ──────────────────────────────────────────────────────────────

  if (error && !data) {
    return (
      <div style={{ display: "flex", height: "100vh", overflow: "hidden" }}>
        <Sidebar activePage="dashboard" />
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "auto", background: "#f9f9f9" }}>
          <Header title="Dashboard" subtitle={`Selamat datang, Admin · ${today}`} />
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 12 }}>
            <div style={{ fontSize: 40 }}>⚠️</div>
            <div style={{ fontSize: 15, color: "#c62828", fontWeight: 600, maxWidth: 420, textAlign: "center" }}>{error}</div>
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
    <div style={{ display: "flex", height: "100vh", overflow: "hidden", fontFamily: "'Inter', sans-serif" }}>
      <style>{`
        @keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
        @keyframes fadeUp  { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: none; } }
      `}</style>

      <Sidebar activePage="dashboard" />

      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "auto", background: "#f9f9f9" }}>
        <Header title="Dashboard" subtitle={`Selamat datang, Admin · ${today}`} />

        <div style={{ padding: "24px 28px" }}>
          <div style={{ maxWidth: 1200, margin: "0 auto" }}>

            {/* ── Error inline (polling gagal tapi ada data lama) ── */}
            {error && data && (
              <div style={{
                background: "#fff8e1", border: "1.5px solid #ffe082",
                borderRadius: 10, padding: "10px 16px", color: "#795548",
                fontSize: 12, fontWeight: 500, marginBottom: 16,
                display: "flex", alignItems: "center", gap: 8,
              }}>
                ⚠️ Gagal memperbarui data terbaru. Menampilkan data sebelumnya.
              </div>
            )}

            {/* ── Stat Cards ── */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16, marginBottom: 24 }}>
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
                    Array.from({ length: 5 }).map((_, i) => (
                      <div key={i} style={{ display: "flex", alignItems: "center", gap: 14, padding: "13px 0", borderBottom: i < 4 ? "1px solid #f0f0f0" : "none" }}>
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
                            <div style={{ fontSize: 12, color: "#555", marginTop: 2 }}>
                              {p.nama_hewan}{p.ras ? ` · ${p.ras}` : ""}{p.jenis ? ` · ${p.jenis}` : ""}
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 3 }}>
                              <span style={{ fontSize: 11, color: "#bbb" }}>{p.waktu}</span>
                              {p.layanan && p.layanan !== "-" && (
                                <>
                                  <span style={{ fontSize: 11, color: "#ddd" }}>·</span>
                                  <span style={{ fontSize: 11, color: "#888" }}>{p.layanan}</span>
                                </>
                              )}
                              <span style={{ fontSize: 11, color: "#ddd" }}>·</span>
                              <span style={{ fontSize: 11, color: "#888" }}>dr. {p.nama_dokter}</span>
                            </div>
                          </div>

                          {/* Status badge */}
                          <span style={{
                            padding: "4px 12px", borderRadius: 999,
                            fontSize: 11, fontWeight: 700,
                            background: status.bg, color: status.color,
                            whiteSpace: "nowrap", flexShrink: 0,
                          }}>
                            {status.label}
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
                        <Skeleton w="100%" h={88} r={12} />
                        <Skeleton w="100%" h={88} r={12} />
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
                        <div key={item.label} style={{
                          borderRadius: 12, padding: "16px 18px",
                          background: item.bg, border: `1.5px solid ${item.border}`,
                          animation: `fadeUp .35s ease both`, animationDelay: `${i * 80}ms`,
                        }}>
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