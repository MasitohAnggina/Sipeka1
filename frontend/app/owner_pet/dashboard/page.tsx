"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar_owner_pet";
import Header from "@/components/Header";

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

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
const G = "#2e7d32";

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

// ✅ FIX #1: key "token" (bukan "auth_token")
function getAuthToken(): string {
  return typeof window !== "undefined"
    ? (localStorage.getItem("token") ?? "") : "";
}

// ── Sub-components ────────────────────────────────────────────────────────────

function Badge({ children, variant = "green" }: {
  children: React.ReactNode; variant?: "green" | "blue" | "amber" | "red";
}) {
  const map: Record<string, React.CSSProperties> = {
    green: { background: "#e8f5e9", color: "#2e7d32" },
    blue:  { background: "#e3f2fd", color: "#1565c0" },
    amber: { background: "#fff8e1", color: "#a16207" },
    red:   { background: "#fce4ec", color: "#c62828" },
  };
  return (
    <span style={{
      display: "inline-flex", alignItems: "center",
      padding: "2px 9px", borderRadius: 20,
      fontSize: 11, fontWeight: 600,
      ...map[variant],
    }}>
      {children}
    </span>
  );
}

function StatCard({ label, value, sub, subColor }: {
  label: string; value: string; sub?: string; subColor?: string;
}) {
  return (
    <div style={{
      background: "#ffffff", borderRadius: 10, padding: "12px 14px",
      border: "1px solid #f0f0f0",
    }}>
      <div style={{ fontSize: 11, color: "#888", marginBottom: 4 }}>{label}</div>
      <div
        style={{ fontSize: 22, fontWeight: 700, color: "#1a1a1a", lineHeight: 1.1 }}
        dangerouslySetInnerHTML={{ __html: value }}
      />
      {sub && (
        <div style={{ fontSize: 11, color: subColor ?? "#888", marginTop: 2 }}>{sub}</div>
      )}
    </div>
  );
}

function PetCard({ pet, onDetail, onBooking }: {
  pet: Pet; onDetail(): void; onBooking(): void;
}) {
  return (
    <div style={{ borderRadius: 12, overflow: "hidden", border: "1.5px solid #e0e0e0", background: "#fff" }}>
      <div style={{ background: G, padding: "14px", display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{
          width: 52, height: 52, borderRadius: 10,
          background: "rgba(255,255,255,0.15)",
          display: "flex", alignItems: "center", justifyContent: "center",
          overflow: "hidden", flexShrink: 0,
        }}>
          {pet.photo
            ? <img src={pet.photo} alt={pet.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            : <span style={{ fontSize: 28 }}>{pet.emoji}</span>
          }
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: "#fff" }}>{pet.name}</div>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.75)" }}>{pet.type} · {pet.breed}</div>
          <span style={{
            display: "inline-block", marginTop: 4, fontSize: 10, fontWeight: 600,
            background: "rgba(255,255,255,0.2)", color: "#fff",
            padding: "1px 8px", borderRadius: 10,
          }}>Sehat</span>
        </div>
      </div>
      <div style={{ padding: "12px 14px" }}>
        {[
          ["Usia",  pet.age],
          ["Berat", pet.weight],
          ["Jenis", pet.type],
        ].map(([label, val], i, arr) => (
          <div key={label} style={{
            display: "flex", justifyContent: "space-between", fontSize: 12,
            padding: "5px 0",
            borderBottom: i < arr.length - 1 ? "1px solid #f0f0f0" : "none",
          }}>
            <span style={{ color: "#888" }}>{label}</span>
            <span style={{ fontWeight: 600, color: "#1a1a1a" }}>{val}</span>
          </div>
        ))}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 10 }}>
          <button onClick={onDetail} style={{
            padding: "7px 0", borderRadius: 8,
            border: `1.5px solid ${G}`, background: "#fff",
            color: G, fontWeight: 700, fontSize: 12, cursor: "pointer",
          }}>Detail</button>
          <button onClick={onBooking} style={{
            padding: "7px 0", borderRadius: 8, border: "none",
            background: G, color: "#fff", fontWeight: 700, fontSize: 12, cursor: "pointer",
          }}>Booking</button>
        </div>
      </div>
    </div>
  );
}

// ── Skeleton Loader ───────────────────────────────────────────────────────────

function Skeleton({ w = "100%", h = 16, radius = 6 }: { w?: string | number; h?: number; radius?: number }) {
  return (
    <div style={{
      width: w, height: h, borderRadius: radius,
      background: "linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)",
      backgroundSize: "200% 100%",
      animation: "shimmer 1.5s infinite",
    }} />
  );
}

// ── Main Dashboard ────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const router = useRouter();
  const [data,    setData]    = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);

  useEffect(() => {
    const token = getAuthToken();

    // ✅ FIX #2: tambah return agar fetch tidak tetap jalan saat token kosong
    if (!token) {
      router.push("/auth/login");
      return;
    }

    // ✅ FIX #3: URL API yang benar sesuai route Laravel
    fetch(`${API_URL}/api/owner_pet/dashboard`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then(res => {
        if (res.success) setData(res.data);
        else setError("Gagal memuat data dashboard.");
      })
      .catch((err) => {
        // Tampilkan pesan error yang lebih spesifik
        if (err.message?.includes("401")) {
          setError("Sesi habis, silakan login ulang.");
          router.push("/auth/login");
        } else {
          setError("Tidak dapat terhubung ke server.");
        }
      })
      .finally(() => setLoading(false));
  }, [router]);

  const handleBooking = (petId?: number) => {
    if (petId) localStorage.setItem("sipeka_booking_pet", String(petId));
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
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "auto", background: "#f9f9f9" }}>
          <Header title="Dashboard" subtitle="Selamat datang di SIPEKA" />
          <div style={{ padding: "20px 28px 32px", display: "flex", flexDirection: "column", gap: 16 }}>
            <style>{`@keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }`}</style>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12 }}>
              {[1,2,3].map(i => <Skeleton key={i} h={80} radius={10} />)}
            </div>
            <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
              {[1,2].map(i => <Skeleton key={i} w={220} h={260} radius={12} />)}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
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
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", background: "#f9f9f9" }}>
          <div style={{ textAlign: "center", color: "#888" }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>⚠️</div>
            <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 6 }}>{error ?? "Terjadi kesalahan"}</div>
            <button onClick={() => window.location.reload()} style={{
              marginTop: 8, padding: "8px 20px", borderRadius: 8, border: "none",
              background: G, color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer",
            }}>Coba Lagi</button>
          </div>
        </div>
      </div>
    );
  }

  const { user, hewan, booking_aktif, total_kunjungan, riwayat_terakhir } = data;

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden" }}>
      <Sidebar activePage="dashboard" />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "auto", background: "#f9f9f9" }}>
        <Header title="Dashboard" subtitle="Selamat datang di SIPEKA" />

        <div style={{ padding: "20px 28px 32px" }}>

          {/* ── Greeting ── */}
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            marginBottom: 20, flexWrap: "wrap", gap: 10,
          }}>
            <div>
              <div style={{ fontSize: 18, fontWeight: 700, color: "#1a1a1a" }}>
                Halo, {user.nama}! 👋
              </div>
              <div style={{ fontSize: 13, color: "#888", marginTop: 2 }}>{todayStr()}</div>
            </div>
            <button onClick={() => handleBooking()} style={{
              padding: "10px 20px", borderRadius: 8, border: "none",
              background: G, color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer",
            }}>
              + Booking Baru
            </button>
          </div>

          {/* ── Quick Stats ── */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 24 }}>
            <StatCard
              label="Hewan Saya"
              value={`${hewan.length} <span style="font-size:13px;font-weight:400;color:#888;">ekor</span>`}
              sub={hewan.length > 0 ? hewan.map(p => p.name).join(", ") : "Belum ada hewan"}
            />
            <StatCard
              label="Booking Aktif"
              value={booking_aktif
                ? `1 <span style="font-size:13px;font-weight:400;color:#888;">jadwal</span>`
                : `0 <span style="font-size:13px;font-weight:400;color:#888;">jadwal</span>`}
              sub={booking_aktif
                ? `${fmtDate(booking_aktif.tanggal_booking)} · ${booking_aktif.jam}`
                : "Belum ada booking"}
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
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12,
            }}>
              <h2 style={{ fontSize: 15, fontWeight: 700, color: G }}>Hewan Saya</h2>
              <button onClick={() => router.push("/hewan")} style={{
                fontSize: 12, padding: "5px 14px", borderRadius: 8,
                border: `1.5px solid ${G}`, background: "#fff", color: G,
                fontWeight: 600, cursor: "pointer",
              }}>Kelola Hewan</button>
            </div>

            {hewan.length === 0 ? (
              <div style={{ textAlign: "center", padding: "40px 0", color: "#aaa" }}>
                <div style={{ fontSize: 40, marginBottom: 10 }}>🐾</div>
                <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>Belum ada hewan</div>
                <div style={{ fontSize: 13 }}>Tambahkan hewan di menu Data Hewan</div>
              </div>
            ) : (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 16 }}>
                {hewan.map(pet => (
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

          {/* ── Booking & Riwayat ── */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>

            {/* Booking Mendatang */}
            <div style={{ background: "#fff", borderRadius: 12, padding: "16px 18px", border: "1px solid #f0f0f0" }}>
              <h2 style={{ fontSize: 15, fontWeight: 700, color: G, marginBottom: 12 }}>Booking Mendatang</h2>

              {booking_aktif ? (
                <div style={{
                  padding: "12px 14px", borderRadius: 10,
                  border: "1.5px solid #c8e6c9", background: "#f1f8f1", marginBottom: 10,
                }}>
                  <div style={{
                    fontSize: 11, fontWeight: 600, color: G,
                    background: "#e8f5e9", display: "inline-block",
                    padding: "2px 9px", borderRadius: 10, marginBottom: 8,
                  }}>
                    {fmtDate(booking_aktif.tanggal_booking)} · {booking_aktif.jam} WIB
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#1a1a1a", marginBottom: 2 }}>
                    {booking_aktif.hewan_nama}
                  </div>
                  <div style={{ fontSize: 12, color: "#666", marginBottom: 6 }}>
                    {booking_aktif.layanan_nama ?? "–"}
                  </div>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <Badge variant={booking_aktif.status === "dikonfirmasi" ? "blue" : "amber"}>
                      {booking_aktif.status === "dikonfirmasi" ? "Dikonfirmasi" : "Menunggu"}
                    </Badge>
                    <span style={{ fontSize: 11, color: "#888" }}>
                      No. #{booking_aktif.no_booking} · Antrian {String(booking_aktif.no_antrian).padStart(3, "0")}
                    </span>
                  </div>
                </div>
              ) : (
                <div style={{
                  padding: "20px", textAlign: "center", color: "#aaa",
                  background: "#fafafa", borderRadius: 10, marginBottom: 10,
                }}>
                  <div style={{ fontSize: 28, marginBottom: 6 }}>📅</div>
                  <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 3 }}>Belum ada booking</div>
                  <div style={{ fontSize: 12 }}>Buat booking untuk hewan kesayanganmu</div>
                </div>
              )}

              <button onClick={() => handleBooking()} style={{
                width: "100%", padding: "9px 0", borderRadius: 8, border: "none",
                background: G, color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer",
              }}>
                + Buat Booking Baru
              </button>
            </div>

            {/* Riwayat Terakhir */}
            <div style={{ background: "#fff", borderRadius: 12, padding: "16px 18px", border: "1px solid #f0f0f0" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                <h2 style={{ fontSize: 15, fontWeight: 700, color: G }}>Riwayat Terakhir</h2>
                <button onClick={() => router.push("/layanan/riwayat")} style={{
                  fontSize: 12, padding: "4px 12px", borderRadius: 8,
                  border: `1.5px solid ${G}`, background: "#fff", color: G,
                  fontWeight: 600, cursor: "pointer",
                }}>Lihat Semua</button>
              </div>

              {riwayat_terakhir.length === 0 ? (
                <div style={{ textAlign: "center", padding: "30px 0", color: "#aaa", fontSize: 13 }}>
                  Belum ada riwayat layanan
                </div>
              ) : (
                <div>
                  {riwayat_terakhir.map((item, i) => (
                    <div key={item.id_riwayat} style={{
                      display: "flex", alignItems: "flex-start", gap: 10,
                      padding: "9px 0",
                      borderBottom: i < riwayat_terakhir.length - 1 ? "1px solid #f0f0f0" : "none",
                    }}>
                      <div style={{
                        minWidth: 36, textAlign: "center",
                        background: "#f5f5f5", borderRadius: 8, padding: "4px 6px", flexShrink: 0,
                      }}>
                        <div style={{ fontSize: 15, fontWeight: 700, color: "#1a1a1a" }}>{item.tanggal}</div>
                        <div style={{ fontSize: 10, color: "#888" }}>{item.bulan?.slice(0, 3)}</div>
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: "#1a1a1a" }}>
                          {item.layanan_utama} — {item.hewan_nama}
                        </div>
                        <div style={{ fontSize: 11, color: "#888", marginTop: 1 }}>{item.layanan_detail}</div>
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
    </div>
  );
}