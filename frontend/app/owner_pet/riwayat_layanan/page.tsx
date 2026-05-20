"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useSearchParams, useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar_owner_pet";
import Header from "@/components/Header";

// ── Types ─────────────────────────────────────────────────────────────────────

interface Layanan {
  id_layanan: number;
  nama_layanan: string;
  kategori: string;
  harga_saat_booking: number;
}

interface RiwayatItem {
  id_riwayat: number;
  tanggal: string;
  tanggal_dd: string;
  bulan: string;
  hari: string;
  jam: string;
  grand_total: number;
  status_bayar: string;
  catatan: string | null;
  no_booking: string;
  no_antrian: number;
  status_booking: string;
  layanan_utama: string;
  layanan_kategori: string;
  layanans: Layanan[];
  hewan: {
    id_hewan: number;
    nama: string;
    jenis: string;
    ras: string;
    umur: string;
    berat: string;
    foto: string | null;
  } | null;
  rincian?: RincianItem[];
  rekam_medis?: RekamMedis | null;
  pembayaran?: Pembayaran | null;
  total_breakdown?: TotalBreakdown;
  foto_before?: string | null;
  foto_after?: string | null;
}

interface RincianItem {
  id_rincian: number;
  tipe: string;
  jumlah: number;
  harga_satuan: number;
  subtotal: number;
  layanan: { nama_layanan: string; kategori: string } | null;
  obat: { nama_obat: string; satuan: string } | null;
}

interface RekamMedis {
  diagnosa: string;
  diagnosa_lengkap: string;
  catatan_dokter: string;
  dokter: { nama_dokter: string; spesialisasi: string } | null;
}

interface Pembayaran {
  metode: string;
  status: string;
  jumlah_bayar: number;
}

interface TotalBreakdown {
  layanan: number;
  obat: number;
  lab: number;
  grand_total: number;
}

interface StatsData {
  total: number;
  Vaksinasi: number;
  Grooming: number;
  "Perawatan Medis": number;
  Hotel: number;
  Lainnya: number;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const API_URL    = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
const G          = "#2e7d32";
const ITEMS_PAGE = 4;

// ── Helpers ───────────────────────────────────────────────────────────────────

function getAuthToken(): string {
  return typeof window !== "undefined"
    ? (sessionStorage.getItem("auth_token") ?? "") : "";
}

const toRp = (n: number) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n);

// ── Status Badge ──────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const cfg: Record<string, { bg: string; color: string }> = {
    "selesai":             { bg: "#e8f5e9", color: G },
    "Selesai":             { bg: "#e8f5e9", color: G },
    "proses":              { bg: "#fff8e1", color: "#d97706" },
    "Proses":              { bg: "#fff8e1", color: "#d97706" },
    "dibatalkan":          { bg: "#fce4ec", color: "#c62828" },
    "Dibatalkan":          { bg: "#fce4ec", color: "#c62828" },
    "menunggu":            { bg: "#fff8e1", color: "#d97706" },
    "dikonfirmasi":        { bg: "#e3f2fd", color: "#1565c0" },
    "Normal":              { bg: "#e8f5e9", color: G },
    "Abnormal":            { bg: "#fce4ec", color: "#c62828" },
    "Perlu Tindak Lanjut": { bg: "#fff8e1", color: "#d97706" },
    "lunas":               { bg: "#e8f5e9", color: G },
    "menunggu_pembayaran": { bg: "#fff8e1", color: "#d97706" },
  };
  const { bg, color } = cfg[status] ?? { bg: "#f5f5f5", color: "#888" };
  return (
    <span style={{ padding: "3px 10px", borderRadius: 20, fontSize: 12, fontWeight: 600, background: bg, color }}>
      {status.charAt(0).toUpperCase() + status.slice(1).replace(/_/g, " ")}
    </span>
  );
}

// ── Tab Navigation ────────────────────────────────────────────────────────────

function TabNav({ active, onChange }: {
  active: "layanan" | "rincian"; onChange(t: "layanan" | "rincian"): void;
}) {
  return (
    <div style={{ display: "flex", gap: 0, background: "#fff", borderRadius: 12, padding: 4, boxShadow: "0 1px 4px rgba(0,0,0,0.07)", marginBottom: 20, width: "fit-content" }}>
      {(["layanan", "rincian"] as const).map(t => (
        <button key={t} onClick={() => onChange(t)} style={{
          padding: "9px 28px", borderRadius: 9, border: "none", cursor: "pointer",
          fontWeight: 700, fontSize: 14, transition: "all .15s",
          background: active === t ? G : "transparent",
          color: active === t ? "#fff" : "#888",
        }}>
          {t === "layanan" ? "📋 Riwayat Layanan" : "🏥 Rincian Layanan"}
        </button>
      ))}
    </div>
  );
}

// ── Loading Skeleton ──────────────────────────────────────────────────────────

function LoadingRows() {
  return (
    <>
      <style>{`@keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }`}</style>
      {[1, 2, 3].map(i => (
        <div key={i} style={{ padding: "16px 20px", borderBottom: "1px solid #f0f0f0", display: "flex", gap: 20, alignItems: "center" }}>
          {[150, 200, 200, 80].map((w, j) => (
            <div key={j} style={{
              width: w, height: 40, borderRadius: 6,
              background: "linear-gradient(90deg,#f0f0f0 25%,#e0e0e0 50%,#f0f0f0 75%)",
              backgroundSize: "200% 100%", animation: "shimmer 1.5s infinite",
            }} />
          ))}
        </div>
      ))}
    </>
  );
}

// ── Hewan Avatar ──────────────────────────────────────────────────────────────
// ✅ FIX: Komponen helper untuk gambar hewan — hindari <img> berulang

function HewanAvatar({ foto, nama, size = 44 }: { foto: string | null; nama: string; size?: number }) {
  if (!foto) {
    return (
      <div style={{ width: size, height: size, borderRadius: 8, background: "#f0faf2", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0 }}>
        🐾
      </div>
    );
  }
  return (
    <div style={{ position: "relative", width: size, height: size, borderRadius: 8, overflow: "hidden", flexShrink: 0 }}>
      <Image src={foto} alt={nama} fill unoptimized style={{ objectFit: "cover" }} />
    </div>
  );
}

// ── Foto Kondisi ──────────────────────────────────────────────────────────────
// ✅ FIX: Komponen helper untuk foto before/after — hindari <img> berulang

function FotoKondisi({ src, label }: { src: string; label: string }) {
  return (
    <div>
      <div style={{ fontSize: 11, color: "#888", marginBottom: 4 }}>{label}</div>
      <div style={{ position: "relative", width: 100, height: 80, borderRadius: 8, overflow: "hidden", border: "1px solid #e0e0e0" }}>
        <Image src={src} alt={label} fill unoptimized style={{ objectFit: "cover" }} />
      </div>
    </div>
  );
}

// ── Riwayat Layanan Tab ───────────────────────────────────────────────────────

function RiwayatLayananTab() {
  const [riwayat,     setRiwayat]     = useState<RiwayatItem[]>([]);
  const [stats,       setStats]       = useState<StatsData | null>(null);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState<string | null>(null);
  const [filterKat,   setFilterKat]   = useState("Semua");
  const [filterHewan, setFilterHewan] = useState("Semua Hewan");
  const [currentPage, setCurrentPage] = useState(1);

  const token = getAuthToken();

  // ✅ FIX Ln 188: Async IIFE dalam useEffect — hilangkan setState synchronously error
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const [rRes, sRes] = await Promise.all([
          fetch(`${API_URL}/api/riwayat`,       { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
          fetch(`${API_URL}/api/riwayat/stats`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
        ]);
        if (!cancelled) {
          if (rRes.success) setRiwayat(rRes.data);
          if (sRes.success) setStats(sRes.data);
        }
      } catch {
        if (!cancelled) setError("Gagal memuat riwayat layanan.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [token]);

  const filtered = riwayat.filter(r => {
    const matchKat   = filterKat   === "Semua" || r.layanan_kategori === filterKat;
    const matchHewan = filterHewan === "Semua Hewan" || r.hewan?.jenis === filterHewan;
    return matchKat && matchHewan;
  });

  const totalPages = Math.ceil(filtered.length / ITEMS_PAGE);
  const paginated  = filtered.slice((currentPage - 1) * ITEMS_PAGE, currentPage * ITEMS_PAGE);

  const statCards = [
    { icon: "📅", label: "Total Layanan",  value: stats?.total ?? 0,             key: "Semua" },
    { icon: "💉", label: "Vaksinasi",       value: stats?.Vaksinasi ?? 0,          key: "Vaksinasi" },
    { icon: "✂️", label: "Grooming",        value: stats?.Grooming ?? 0,           key: "Grooming" },
    { icon: "🏥", label: "Perawatan Medis", value: stats?.["Perawatan Medis"] ?? 0, key: "Perawatan Medis" },
    { icon: "🏨", label: "Hotel Hewan",     value: stats?.Hotel ?? 0,              key: "Hotel" },
  ];

  const jenisHewanList = ["Semua Hewan", ...Array.from(new Set(riwayat.map(r => r.hewan?.jenis).filter(Boolean) as string[]))];

  return (
    <div>
      {/* Stat Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 14, marginBottom: 20 }}>
        {statCards.map(s => {
          const isActive = filterKat === s.key;
          return (
            <div key={s.key} onClick={() => { setFilterKat(s.key); setCurrentPage(1); }}
              style={{ background: isActive ? "#f0faf2" : "#fff", borderRadius: 12, padding: "14px 18px", boxShadow: "0 1px 4px rgba(0,0,0,0.07)", display: "flex", alignItems: "center", gap: 12, border: isActive ? `1.5px solid ${G}` : "1.5px solid transparent", cursor: "pointer", transition: "all .15s" }}>
              <span style={{ fontSize: 22 }}>{s.icon}</span>
              <div>
                <p style={{ margin: 0, fontSize: 12, color: "#888" }}>{s.label}</p>
                <p style={{ margin: 0, fontSize: 20, fontWeight: 700, color: "#1a1a1a" }}>
                  {s.value} <span style={{ fontSize: 12, fontWeight: 400, color: "#888" }}>Kali</span>
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Filter Bar */}
      <div style={{ background: "#fff", borderRadius: 12, padding: "12px 18px", marginBottom: 16, boxShadow: "0 1px 4px rgba(0,0,0,0.07)", display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: "#444", marginRight: 4 }}>🔍 Filter:</span>
        {[
          { label: "Jenis Layanan", value: filterKat, options: ["Semua","Vaksinasi","Grooming","Perawatan Medis","Hotel"], onChange: (v: string) => { setFilterKat(v); setCurrentPage(1); } },
          { label: "Jenis Hewan",   value: filterHewan, options: jenisHewanList, onChange: (v: string) => { setFilterHewan(v); setCurrentPage(1); } },
        ].map(f => (
          <div key={f.label} style={{ display: "flex", alignItems: "center", gap: 6, background: "#f9f9f9", borderRadius: 8, padding: "2px 4px 2px 10px", border: "1px solid #e0e0e0" }}>
            <span style={{ fontSize: 12, color: "#666", fontWeight: 600, whiteSpace: "nowrap" }}>{f.label}</span>
            <select value={f.value} onChange={e => f.onChange(e.target.value)}
              style={{ padding: "6px 10px", border: "none", background: "transparent", fontSize: 13, color: "#333", cursor: "pointer", outline: "none", fontWeight: 500 }}>
              {f.options.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
        ))}
        <button onClick={() => { setFilterKat("Semua"); setFilterHewan("Semua Hewan"); setCurrentPage(1); }}
          style={{ padding: "7px 16px", borderRadius: 8, border: "none", background: "#fce4ec", color: "#c62828", fontSize: 13, fontWeight: 700, cursor: "pointer", marginLeft: "auto" }}>
          ↺ Reset
        </button>
      </div>

      {/* Table */}
      <div style={{ background: "#fff", borderRadius: 12, boxShadow: "0 1px 4px rgba(0,0,0,0.07)", overflow: "hidden" }}>
        <div style={{ display: "grid", gridTemplateColumns: "150px 1fr 1fr 80px", padding: "12px 20px", background: "#f9f9f9", borderBottom: "1px solid #f0f0f0" }}>
          {["Tanggal & Waktu", "Hewan", "Layanan", "Status"].map(h => (
            <span key={h} style={{ fontSize: 13, fontWeight: 700, color: "#555" }}>{h}</span>
          ))}
        </div>

        {loading ? <LoadingRows /> : error ? (
          <div style={{ padding: 40, textAlign: "center", color: "#e53935", fontSize: 14 }}>⚠️ {error}</div>
        ) : paginated.length === 0 ? (
          <div style={{ padding: 40, textAlign: "center", color: "#aaa", fontSize: 14 }}>Tidak ada data untuk filter ini.</div>
        ) : (
          paginated.map((item, i) => (
            <div key={item.id_riwayat} style={{ display: "grid", gridTemplateColumns: "150px 1fr 1fr 80px", padding: "14px 20px", borderBottom: i < paginated.length - 1 ? "1px solid #f0f0f0" : "none", alignItems: "center" }}>
              <div>
                <p style={{ margin: 0, fontSize: 20, fontWeight: 700, color: "#1a1a1a" }}>{item.tanggal_dd}</p>
                <p style={{ margin: 0, fontSize: 13, color: "#555" }}>{item.bulan}</p>
                <p style={{ margin: 0, fontSize: 12, color: "#888" }}>{item.jam !== "-" ? item.jam + " WIB" : "-"}</p>
              </div>
              {/* ✅ FIX Ln 285: Ganti <img> → <HewanAvatar> */}
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <HewanAvatar foto={item.hewan?.foto ?? null} nama={item.hewan?.nama ?? "hewan"} />
                <div>
                  <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: "#1a1a1a" }}>{item.hewan?.nama ?? "-"}</p>
                  <p style={{ margin: 0, fontSize: 12, color: "#888" }}>{item.hewan?.jenis}</p>
                  <p style={{ margin: 0, fontSize: 12, color: "#888" }}>{item.hewan?.umur} · {item.hewan?.berat}</p>
                </div>
              </div>
              <div>
                <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "#1a1a1a" }}>{item.layanan_utama}</p>
                {item.layanans.length > 1 && (
                  <p style={{ margin: "2px 0 0", fontSize: 11, color: G }}>+{item.layanans.length - 1} layanan lainnya</p>
                )}
                <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: G }}>{toRp(item.grand_total)}</p>
              </div>
              <StatusBadge status={item.status_booking} />
            </div>
          ))
        )}
      </div>

      {totalPages > 1 && (
        <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 6, marginTop: 16 }}>
          <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}
            style={{ padding: "6px 14px", borderRadius: 8, border: "1px solid #d1d5db", background: "#fff", fontSize: 13, cursor: "pointer", color: "#333" }}>
            ‹ Sebelumnya
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
            <button key={page} onClick={() => setCurrentPage(page)}
              style={{ width: 32, height: 32, borderRadius: 8, border: "1px solid #d1d5db", background: currentPage === page ? G : "#fff", color: currentPage === page ? "#fff" : "#333", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
              {page}
            </button>
          ))}
          <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}
            style={{ padding: "6px 14px", borderRadius: 8, border: "1px solid #d1d5db", background: "#fff", fontSize: 13, cursor: "pointer", color: "#333" }}>
            Berikutnya ›
          </button>
        </div>
      )}
    </div>
  );
}

// ── Rincian Layanan Tab ───────────────────────────────────────────────────────

const KATEGORI_CFG = [
  { key: "Semua",           icon: "📋", label: "Total Rincian" },
  { key: "Vaksinasi",       icon: "💉", label: "Vaksinasi" },
  { key: "Grooming",        icon: "✂️", label: "Grooming" },
  { key: "Perawatan Medis", icon: "🏥", label: "Perawatan Medis" },
  { key: "Hotel",           icon: "🏨", label: "Hotel Hewan" },
];

const BADGE_CFG: Record<string, { bg: string; color: string }> = {
  "Vaksinasi":       { bg: "#e3f2fd", color: "#1565c0" },
  "Grooming":        { bg: "#f3e5f5", color: "#6a1b9a" },
  "Perawatan Medis": { bg: "#fce4ec", color: "#c62828" },
  "Hotel":           { bg: "#e8f5e9", color: G },
};

function RincianLayananTab() {
  const [riwayat,       setRiwayat]       = useState<RiwayatItem[]>([]);
  const [detailMap,     setDetailMap]     = useState<Record<number, RiwayatItem>>({});
  const [loadingDetail, setLoadingDetail] = useState<number | null>(null);
  const [loading,       setLoading]       = useState(true);
  const [error,         setError]         = useState<string | null>(null);
  const [filterHewan,   setFilterHewan]   = useState("Semua Hewan");
  const [filterKat,     setFilterKat]     = useState("Semua");
  const [expanded,      setExpanded]      = useState<number | null>(null);

  const token = getAuthToken();

  // ✅ FIX Ln 359: Async IIFE dalam useEffect — hilangkan setState synchronously error
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const r = await fetch(`${API_URL}/api/riwayat`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const res = await r.json();
        if (!cancelled && res.success) setRiwayat(res.data);
      } catch {
        if (!cancelled) setError("Gagal memuat rincian layanan.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [token]);

  const toggleExpand = async (item: RiwayatItem) => {
    if (expanded === item.id_riwayat) { setExpanded(null); return; }
    setExpanded(item.id_riwayat);
    if (detailMap[item.id_riwayat]) return;
    setLoadingDetail(item.id_riwayat);
    try {
      const res  = await fetch(`${API_URL}/api/riwayat/${item.id_riwayat}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setDetailMap(m => ({ ...m, [item.id_riwayat]: data.data }));
      }
    } finally {
      setLoadingDetail(null);
    }
  };

  const filtered = riwayat.filter(r => {
    const matchKat   = filterKat   === "Semua" || r.layanan_kategori === filterKat;
    const matchHewan = filterHewan === "Semua Hewan" || r.hewan?.jenis === filterHewan;
    return matchKat && matchHewan;
  });

  const jenisHewanList = ["Semua Hewan", ...Array.from(new Set(riwayat.map(r => r.hewan?.jenis).filter(Boolean) as string[]))];
  const countKat = (k: string) => k === "Semua" ? riwayat.length : riwayat.filter(r => r.layanan_kategori === k).length;

  return (
    <div>
      {/* Stat Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 14, marginBottom: 20 }}>
        {KATEGORI_CFG.map(k => {
          const isActive = filterKat === k.key;
          return (
            <div key={k.key} onClick={() => { setFilterKat(k.key); setExpanded(null); }}
              style={{ background: isActive ? "#f0faf2" : "#fff", borderRadius: 12, padding: "14px 18px", boxShadow: "0 1px 4px rgba(0,0,0,0.07)", display: "flex", alignItems: "center", gap: 12, border: isActive ? `1.5px solid ${G}` : "1.5px solid transparent", cursor: "pointer", transition: "all .15s" }}>
              <span style={{ fontSize: 22 }}>{k.icon}</span>
              <div>
                <p style={{ margin: 0, fontSize: 12, color: "#888" }}>{k.label}</p>
                <p style={{ margin: 0, fontSize: 20, fontWeight: 700, color: "#1a1a1a" }}>
                  {countKat(k.key)} <span style={{ fontSize: 12, fontWeight: 400, color: "#888" }}>Data</span>
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Filter Bar */}
      <div style={{ background: "#fff", borderRadius: 12, padding: "12px 18px", marginBottom: 16, boxShadow: "0 1px 4px rgba(0,0,0,0.07)", display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: "#444", marginRight: 4 }}>🔍 Filter:</span>
        {[
          { label: "Jenis Layanan", value: filterKat, options: ["Semua","Vaksinasi","Grooming","Perawatan Medis","Hotel"], onChange: (v: string) => { setFilterKat(v); setExpanded(null); } },
          { label: "Jenis Hewan",   value: filterHewan, options: jenisHewanList, onChange: (v: string) => setFilterHewan(v) },
        ].map(f => (
          <div key={f.label} style={{ display: "flex", alignItems: "center", gap: 6, background: "#f9f9f9", borderRadius: 8, padding: "2px 4px 2px 10px", border: "1px solid #e0e0e0" }}>
            <span style={{ fontSize: 12, color: "#666", fontWeight: 600, whiteSpace: "nowrap" }}>{f.label}</span>
            <select value={f.value} onChange={e => f.onChange(e.target.value)}
              style={{ padding: "6px 10px", border: "none", background: "transparent", fontSize: 13, color: "#333", cursor: "pointer", outline: "none", fontWeight: 500 }}>
              {f.options.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
        ))}
        <button onClick={() => { setFilterKat("Semua"); setFilterHewan("Semua Hewan"); setExpanded(null); }}
          style={{ padding: "7px 16px", borderRadius: 8, border: "none", background: "#fce4ec", color: "#c62828", fontSize: 13, fontWeight: 700, cursor: "pointer", marginLeft: "auto" }}>
          ↺ Reset
        </button>
      </div>

      {/* Cards */}
      {loading ? (
        <div style={{ background: "#fff", borderRadius: 12, padding: 40, textAlign: "center", color: "#888" }}>⏳ Memuat data...</div>
      ) : error ? (
        <div style={{ background: "#fff", borderRadius: 12, padding: 40, textAlign: "center", color: "#e53935" }}>⚠️ {error}</div>
      ) : filtered.length === 0 ? (
        <div style={{ background: "#fff", borderRadius: 12, padding: 40, textAlign: "center", color: "#aaa", fontSize: 14 }}>Tidak ada data untuk filter ini.</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {filtered.map(item => {
            const isOpen    = expanded === item.id_riwayat;
            const detail    = detailMap[item.id_riwayat];
            const isLoading = loadingDetail === item.id_riwayat;
            const bc        = BADGE_CFG[item.layanan_kategori] ?? { bg: "#f5f5f5", color: "#888" };

            return (
              <div key={item.id_riwayat} style={{ background: "#fff", borderRadius: 12, boxShadow: "0 1px 4px rgba(0,0,0,0.07)", overflow: "hidden", border: isOpen ? `1.5px solid ${G}` : "1.5px solid transparent", transition: "border .15s" }}>

                {/* Header Row */}
                <div style={{ display: "grid", gridTemplateColumns: "130px 1fr 1fr auto", alignItems: "center", padding: "16px 20px", gap: 12, cursor: "pointer" }}
                  onClick={() => toggleExpand(item)}>
                  <div>
                    <p style={{ margin: 0, fontSize: 11, color: "#888" }}>{item.hari}</p>
                    <p style={{ margin: 0, fontSize: 20, fontWeight: 700, color: "#1a1a1a" }}>{item.tanggal_dd}</p>
                    <p style={{ margin: 0, fontSize: 12, color: "#555" }}>{item.bulan}</p>
                    <p style={{ margin: 0, fontSize: 11, color: "#888" }}>{item.jam !== "-" ? item.jam + " WIB" : "-"}</p>
                  </div>
                  {/* ✅ FIX Ln 469 & 627 & 633: Ganti <img> → <HewanAvatar> dan <FotoKondisi> */}
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <HewanAvatar foto={item.hewan?.foto ?? null} nama={item.hewan?.nama ?? "hewan"} />
                    <div>
                      <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "#1a1a1a" }}>{item.hewan?.nama ?? "-"}</p>
                      <p style={{ margin: 0, fontSize: 12, color: "#888" }}>{item.hewan?.jenis}</p>
                      <p style={{ margin: 0, fontSize: 12, color: "#888" }}>{item.hewan?.umur} · {item.hewan?.berat}</p>
                    </div>
                  </div>
                  <div>
                    <span style={{ padding: "2px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700, background: bc.bg, color: bc.color, display: "inline-block", marginBottom: 4 }}>
                      {item.layanan_kategori}
                    </span>
                    <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "#1a1a1a" }}>{item.layanan_utama}</p>
                    {item.layanans.length > 1 && (
                      <p style={{ margin: "2px 0 0", fontSize: 11, color: G }}>+{item.layanans.length - 1} layanan lainnya</p>
                    )}
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <p style={{ margin: 0, fontSize: 11, color: "#888", marginBottom: 3 }}>Total Biaya</p>
                    <p style={{ margin: 0, fontSize: 15, fontWeight: 800, color: G }}>{toRp(item.grand_total)}</p>
                    <span style={{ fontSize: 18, color: "#888", display: "block", marginTop: 4, transition: "transform .2s", transform: isOpen ? "rotate(180deg)" : "rotate(0deg)" }}>⌄</span>
                  </div>
                </div>

                {/* Expanded Detail */}
                {isOpen && (
                  <div style={{ borderTop: "1px solid #f0f0f0", padding: "18px 20px", background: "#fafafa" }}>
                    {isLoading ? (
                      <div style={{ textAlign: "center", padding: "20px 0", color: "#888", fontSize: 13 }}>⏳ Memuat rincian...</div>
                    ) : detail ? (
                      <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>

                        {/* Catatan Dokter */}
                        {detail.rekam_medis?.catatan_dokter && (
                          <div>
                            <p style={{ margin: "0 0 8px", fontSize: 13, fontWeight: 700, color: G }}>📝 Catatan Dokter</p>
                            <div style={{ background: "#fff", borderRadius: 8, padding: "10px 14px", border: "1px solid #e0e0e0", fontSize: 13, color: "#333", lineHeight: 1.7 }}>
                              <div style={{ marginBottom: 4 }}>
                                <strong>Diagnosa:</strong> {detail.rekam_medis.diagnosa ?? "-"}
                              </div>
                              <div style={{ marginBottom: 4 }}>{detail.rekam_medis.catatan_dokter}</div>
                              {detail.rekam_medis.dokter && (
                                <div style={{ fontSize: 12, color: "#888", marginTop: 6 }}>
                                  — {detail.rekam_medis.dokter.nama_dokter} ({detail.rekam_medis.dokter.spesialisasi})
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Layanan, Obat, Lab */}
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14, alignItems: "start" }}>

                          {/* Layanan */}
                          <div>
                            <p style={{ margin: "0 0 6px", fontSize: 13, fontWeight: 700, color: G }}>🏥 Layanan yang Dilakukan</p>
                            <div style={{ background: "#fff", borderRadius: 8, padding: "12px 14px", border: "1px solid #e0e0e0", display: "flex", flexDirection: "column", gap: 8 }}>
                              {detail.layanans.map(l => (
                                <div key={l.id_layanan} style={{ borderBottom: "1px dashed #f0f0f0", paddingBottom: 8 }}>
                                  <p style={{ margin: 0, fontSize: 13, fontWeight: 700 }}>{l.nama_layanan}</p>
                                  <p style={{ margin: "2px 0 0", fontSize: 12, color: "#888" }}>{l.kategori}</p>
                                  <p style={{ margin: "2px 0 0", fontSize: 13, fontWeight: 700, color: G }}>{toRp(l.harga_saat_booking)}</p>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Obat */}
                          <div>
                            <p style={{ margin: "0 0 6px", fontSize: 13, fontWeight: 700, color: G }}>💊 Obat yang Diresepkan</p>
                            {(() => {
                              const obatItems = detail.rincian?.filter(r => r.tipe === "obat") ?? [];
                              return obatItems.length === 0 ? (
                                <div style={{ background: "#fff", borderRadius: 8, padding: "20px 14px", border: "1px solid #e0e0e0", textAlign: "center", color: "#bbb", fontSize: 13 }}>Tidak ada obat</div>
                              ) : (
                                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                                  {obatItems.map(rc => (
                                    <div key={rc.id_rincian} style={{ background: "#fff", borderRadius: 8, padding: "10px 14px", border: "1px solid #e0e0e0", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                                      <div>
                                        <p style={{ margin: 0, fontSize: 13, fontWeight: 700 }}>{rc.obat?.nama_obat ?? "-"}</p>
                                        <p style={{ margin: 0, fontSize: 12, color: "#888" }}>{rc.jumlah}x · {rc.obat?.satuan}</p>
                                      </div>
                                      <span style={{ fontSize: 13, fontWeight: 700, color: G }}>{toRp(rc.subtotal)}</span>
                                    </div>
                                  ))}
                                  <div style={{ background: "#f0faf2", borderRadius: 8, padding: "8px 14px", display: "flex", justifyContent: "space-between", border: "1px solid #c8e6c9" }}>
                                    <span style={{ fontSize: 12, fontWeight: 700, color: G }}>Subtotal Obat</span>
                                    <span style={{ fontSize: 13, fontWeight: 800, color: G }}>{toRp(detail.total_breakdown?.obat ?? 0)}</span>
                                  </div>
                                </div>
                              );
                            })()}
                          </div>

                          {/* Lab */}
                          <div>
                            <p style={{ margin: "0 0 6px", fontSize: 13, fontWeight: 700, color: G }}>🔬 Hasil Lab / Pemeriksaan</p>
                            {(() => {
                              const labItems = detail.rincian?.filter(r => r.tipe === "lab") ?? [];
                              return labItems.length === 0 ? (
                                <div style={{ background: "#fff", borderRadius: 8, padding: "20px 14px", border: "1px solid #e0e0e0", textAlign: "center", color: "#bbb", fontSize: 13 }}>Tidak ada hasil lab</div>
                              ) : (
                                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                                  {labItems.map(rc => (
                                    <div key={rc.id_rincian} style={{ background: "#fff", borderRadius: 8, padding: "10px 14px", border: "1px solid #e0e0e0" }}>
                                      <p style={{ margin: 0, fontSize: 13, fontWeight: 600 }}>{rc.layanan?.nama_layanan ?? "-"}</p>
                                      <p style={{ margin: 0, fontSize: 12, color: "#888" }}>{rc.layanan?.kategori}</p>
                                      <p style={{ margin: "4px 0 0", fontSize: 13, fontWeight: 700, color: G }}>{toRp(rc.subtotal)}</p>
                                    </div>
                                  ))}
                                  <div style={{ background: "#f0faf2", borderRadius: 8, padding: "8px 14px", display: "flex", justifyContent: "space-between", border: "1px solid #c8e6c9" }}>
                                    <span style={{ fontSize: 12, fontWeight: 700, color: G }}>Subtotal Lab</span>
                                    <span style={{ fontSize: 13, fontWeight: 800, color: G }}>{toRp(detail.total_breakdown?.lab ?? 0)}</span>
                                  </div>
                                </div>
                              );
                            })()}
                          </div>
                        </div>

                        {/* Total */}
                        <div style={{ background: "#fff", borderRadius: 10, border: "1px solid #e0e0e0", overflow: "hidden" }}>
                          <p style={{ margin: 0, padding: "10px 16px", fontSize: 13, fontWeight: 700, color: G, background: "#f0faf2", borderBottom: "1px solid #e0e0e0" }}>
                            💰 Rincian Total Biaya
                          </p>
                          <div style={{ padding: "12px 16px", display: "flex", flexDirection: "column", gap: 8 }}>
                            <div style={{ display: "flex", justifyContent: "space-between" }}>
                              <span style={{ fontSize: 13, color: "#555" }}>Biaya Layanan</span>
                              <span style={{ fontSize: 13, fontWeight: 600 }}>{toRp(detail.total_breakdown?.layanan ?? 0)}</span>
                            </div>
                            {(detail.total_breakdown?.obat ?? 0) > 0 && (
                              <div style={{ display: "flex", justifyContent: "space-between" }}>
                                <span style={{ fontSize: 13, color: "#555" }}>💊 Biaya Obat</span>
                                <span style={{ fontSize: 13, fontWeight: 600 }}>{toRp(detail.total_breakdown!.obat)}</span>
                              </div>
                            )}
                            {(detail.total_breakdown?.lab ?? 0) > 0 && (
                              <div style={{ display: "flex", justifyContent: "space-between" }}>
                                <span style={{ fontSize: 13, color: "#555" }}>🔬 Biaya Lab</span>
                                <span style={{ fontSize: 13, fontWeight: 600 }}>{toRp(detail.total_breakdown!.lab)}</span>
                              </div>
                            )}
                            <div style={{ borderTop: "1px dashed #ccc", marginTop: 4, paddingTop: 10, display: "flex", justifyContent: "space-between" }}>
                              <span style={{ fontSize: 14, fontWeight: 700, color: G }}>Total Keseluruhan</span>
                              <span style={{ fontSize: 16, fontWeight: 800, color: G }}>{toRp(detail.grand_total)}</span>
                            </div>
                          </div>
                        </div>

                        {/* ✅ FIX Ln 627 & 633: Ganti <img> → <FotoKondisi> */}
                        {(detail.foto_before || detail.foto_after) && (
                          <div>
                            <p style={{ margin: "0 0 8px", fontSize: 13, fontWeight: 700, color: G }}>📷 Foto Kondisi</p>
                            <div style={{ display: "flex", gap: 12 }}>
                              {detail.foto_before && <FotoKondisi src={detail.foto_before} label="Sebelum" />}
                              {detail.foto_after  && <FotoKondisi src={detail.foto_after}  label="Sesudah" />}
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div style={{ textAlign: "center", padding: "20px 0", color: "#aaa", fontSize: 13 }}>Detail tidak tersedia.</div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function RiwayatLayananPage() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const [tab, setTab] = useState<"layanan" | "rincian">("layanan");

  // ✅ FIX Ln 665: Async IIFE dalam useEffect — hilangkan setState synchronously error
  useEffect(() => {
    const token = typeof window !== "undefined" ? sessionStorage.getItem("auth_token") : null;
    if (!token) { router.push("/login"); return; }
    const t = searchParams.get("tab");
    if (t === "rincian" || t === "layanan") setTab(t);
  }, [searchParams, router]);

  return (
    <div style={{ display: "flex", height: "100vh", backgroundColor: "#f5f5f5", fontFamily: "Segoe UI, sans-serif" }}>
      <Sidebar activePage="riwayat" />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflowY: "auto" }}>
        <Header
          title="Riwayat Hewan"
          subtitle="Lihat riwayat layanan dan rincian layanan hewan peliharaan Anda"
        />
        <main style={{ flex: 1, padding: "20px 24px" }}>
          <TabNav active={tab} onChange={setTab} />
          {tab === "layanan" ? <RiwayatLayananTab /> : <RincianLayananTab />}
        </main>
      </div>
    </div>
  );
}