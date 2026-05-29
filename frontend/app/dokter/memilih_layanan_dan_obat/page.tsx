"use client";

import React from "react";
import { getToken } from "@/lib/auth";
import { useState, useMemo, useEffect } from "react";
import Sidebar from "@/components/Sidebar_dokter";
import Header from "@/components/Header";
import {
  User, Stethoscope, Pill, Receipt, FileText,
  Plus, Trash2, Search, PawPrint,
  ChevronRight, ArrowLeft, CheckCircle2,
  Clock, Calendar, AlertCircle, Loader2, Eye,
  Syringe, Scissors, Hotel, Cat, Dog, Rabbit,
  Bird, Microscope, BedDouble, Bandage, Activity,
  FlaskConical, Tablets, Heart, Droplets, Bug,
  Zap, Eye as EyeIcon, Phone, Mail, Weight, Timer,
} from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api";

/* ─── Types ─────────────────────────────────────────────────────────────── */
interface Obat {
  id: number; nama: string; kategori: string; satuan: string;
  harga: number; stok: number; minStok: number; deskripsi: string;
}
interface Layanan {
  id: number; nama: string; kategori: string; subKategori?: string;
  durasi?: string; harga: number; deskripsi: string;
  tersedia: boolean; catatan?: string;
}
interface CartItem    { obat: Obat; qty: number; }
interface CartLayanan { layanan: Layanan; qty: number; }

interface HewanData {
  id_hewan: number; id_booking: number;
  nama: string; jenis: string; ras: string;
  berat: string; usia: string; foto: string | null;
  id_resep?: number | null;
  has_resep?: boolean;
}
interface PemilikData {
  id: number; nama: string; noHP: string; email: string; hewan: HewanData[];
}
interface ResepTersimpan {
  id: number; idResep: number;
  tanggal: string; waktu: string;
  pemilik: PemilikData; hewan: HewanData;
  cartLayanan: CartLayanan[]; cart: CartItem[];
  catatan: string; grandTotal: number;
}

interface ApiLayanan {
  id: number; nama: string; kategori: string; sub_kategori?: string;
  durasi?: string; harga: number; deskripsi: string;
  tersedia: boolean; catatan?: string;
}
interface ApiObat {
  id: number; nama: string; kategori: string; satuan: string;
  harga: number; stok: number; min_stok: number; deskripsi: string;
}
interface ApiHewan {
  id_hewan: number; id_booking: number;
  nama_hewan: string; jenis: string; ras: string;
  berat: string; usia: string; foto: string | null;
  id_resep?: number | null;
  has_resep?: boolean;
}
interface ApiPemilik {
  id: number; nama: string; no_hp: string; email: string; hewan: ApiHewan[];
}

/* ─── Icon helpers ───────────────────────────────────────────────────────── */
/** Icon untuk tiap layanan berdasarkan nama / kategori */
function LayananIcon({ nama, kategori, size = 15 }: { nama: string; kategori: string; size?: number }) {
  const s = { width: size, height: size, flexShrink: 0 as const };
  if (nama.includes("Emergency"))           return <AlertCircle style={s} />;
  if (nama.includes("Bedah Mayor"))         return <Activity style={s} />;
  if (nama.includes("Bedah Minor"))         return <Scissors style={s} />;
  if (nama.includes("Laboratorium"))        return <Microscope style={s} />;
  if (nama.includes("Rawat Inap"))          return <BedDouble style={s} />;
  if (nama.includes("Perawatan Luka"))      return <Bandage style={s} />;
  if (nama.includes("Vaksin"))              return <Syringe style={s} />;
  if (nama.includes("Grooming"))            return <Scissors style={s} />;
  if (nama.includes("Pet Hotel"))           return <Hotel style={s} />;
  if (kategori === "Vaksinasi")             return <Syringe style={s} />;
  if (kategori === "Grooming")              return <Scissors style={s} />;
  if (kategori === "Pet Hotel")             return <Hotel style={s} />;
  return <Stethoscope style={s} />;
}

/** Icon untuk tiap kategori obat */
function ObatIcon({ kategori, size = 15 }: { kategori: string; size?: number }) {
  const s = { width: size, height: size, flexShrink: 0 as const };
  if (kategori === "Antibiotik")        return <FlaskConical style={s} />;
  if (kategori === "Suplemen")          return <Heart style={s} />;
  if (kategori === "Vitamin")           return <Tablets style={s} />;
  if (kategori === "Infus")             return <Droplets style={s} />;
  if (kategori === "Gastrointestinal")  return <Activity style={s} />;
  if (kategori === "Antiparasit")       return <Bug style={s} />;
  if (kategori === "Antihistamin")      return <Zap style={s} />;
  if (kategori === "Oftalmologi")       return <EyeIcon style={s} />;
  return <Pill style={s} />;
}

/** Icon untuk jenis hewan */
function HewanIcon({ jenis, size = 20 }: { jenis: string; size?: number }) {
  const s = { width: size, height: size };
  if (jenis === "Kucing")  return <Cat style={s} />;
  if (jenis === "Anjing")  return <Dog style={s} />;
  if (jenis === "Kelinci") return <Rabbit style={s} />;
  if (jenis === "Burung")  return <Bird style={s} />;
  return <PawPrint style={s} />;
}

/* ─── Constants ──────────────────────────────────────────────────────────── */
const G   = "#2e7d32";
const fmt = (n: number) => "Rp " + n.toLocaleString("id-ID");

const KAT_LAYANAN: Record<string, { color: string; bg: string }> = {
  "Medis":     { color: "#1565c0", bg: "#e3f2fd" },
  "Vaksinasi": { color: "#00695c", bg: "#e0f2f1" },
  "Grooming":  { color: "#6a1b9a", bg: "#f3e5f5" },
  "Pet Hotel": { color: "#e65100", bg: "#fff3e0" },
};
const KAT_OBAT: Record<string, { color: string; bg: string }> = {
  "Antibiotik":       { color: "#c62828", bg: "#ffebee" },
  "Suplemen":         { color: G,         bg: "#e8f5e9" },
  "Vitamin":          { color: "#e65100", bg: "#fff3e0" },
  "Infus":            { color: "#1565c0", bg: "#e3f2fd" },
  "Gastrointestinal": { color: "#d97706", bg: "#fef3c7" },
  "Antiparasit":      { color: "#6a1b9a", bg: "#f3e5f5" },
  "Antihistamin":     { color: "#00695c", bg: "#e0f2f1" },
  "Oftalmologi":      { color: "#0369a1", bg: "#e0f2fe" },
};
const STOK_STYLE: Record<string, { bg: string; color: string }> = {
  Aman:   { bg: "#e8f5e9", color: G },
  Kritis: { bg: "#fff3e0", color: "#e65100" },
  Habis:  { bg: "#ffebee", color: "#c62828" },
};
const ITEMS_PER_PAGE = 8;

function stokStatus(o: Obat) {
  if (o.stok === 0)        return "Habis";
  if (o.stok < o.minStok) return "Kritis";
  return "Aman";
}

/* ─── Shared styles ─────────────────────────────────────────────────────── */
const cardBase: React.CSSProperties = {
  background: "#fff", borderRadius: 10, border: "1px solid #e8e8e8", marginBottom: 16,
};
const thS: React.CSSProperties = {
  padding: "11px 14px", fontSize: 12, fontWeight: 600, color: "#fff",
  textAlign: "left", background: G, whiteSpace: "nowrap",
};
const tdS: React.CSSProperties = {
  padding: "11px 14px", fontSize: 13, color: "#333",
  borderBottom: "1px solid #f0f0f0", verticalAlign: "middle",
};
const filterLabel: React.CSSProperties = {
  display: "block", fontSize: 12, fontWeight: 500, color: "#666", marginBottom: 6,
};
const inputStyle: React.CSSProperties = {
  width: "100%", padding: "8px 10px", border: "1px solid #e0e0e0",
  borderRadius: 8, fontSize: 13, fontFamily: "inherit", outline: "none",
  background: "#fff", color: "#333", boxSizing: "border-box",
};
const pageBtn = (active: boolean): React.CSSProperties => ({
  minWidth: 32, height: 32, padding: "0 10px", borderRadius: 6,
  border: `1px solid ${active ? G : "#e0e0e0"}`,
  background: active ? G : "#fff", color: active ? "#fff" : "#666",
  fontSize: 13, fontWeight: 500, cursor: "pointer", fontFamily: "inherit",
  display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 4,
});

/* ─── Shared components ─────────────────────────────────────────────────── */
function LoadingSpinner({ label = "Memuat data..." }: { label?: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, padding: "3rem", color: "#888", fontSize: 13 }}>
      <Loader2 style={{ width: 18, height: 18, color: G, animation: "spin 1s linear infinite" }} />
      {label}
      <style>{`@keyframes spin { from { transform:rotate(0deg); } to { transform:rotate(360deg); } }`}</style>
    </div>
  );
}

function ErrorBanner({ message, onRetry }: { message: string; onRetry(): void }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", background: "#ffebee", border: "1px solid #ef9a9a", borderRadius: 8, marginBottom: 16 }}>
      <AlertCircle style={{ width: 16, height: 16, color: "#c62828", flexShrink: 0 }} />
      <span style={{ fontSize: 13, color: "#c62828", flex: 1 }}>{message}</span>
      <button onClick={onRetry} style={{ padding: "5px 14px", borderRadius: 6, border: "1px solid #c62828", background: "#fff", color: "#c62828", fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>
        Coba Lagi
      </button>
    </div>
  );
}

function SectionHeader({ icon, title, badge, right }: {
  icon: React.ReactNode; title: string; badge?: React.ReactNode; right?: React.ReactNode;
}) {
  return (
    <div style={{ padding: "12px 16px", borderBottom: "1px solid #f0f0f0", display: "flex", alignItems: "center", gap: 8 }}>
      {icon}
      <span style={{ fontWeight: 600, fontSize: 14, color: "#1a1a1a" }}>{title}</span>
      {badge}
      {right && <div style={{ marginLeft: "auto" }}>{right}</div>}
    </div>
  );
}

function QtyControl({ qty, onInc, onDec }: { qty: number; onInc(): void; onDec(): void }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <button onClick={onDec} style={{ width: 26, height: 26, borderRadius: 6, border: `1px solid ${G}`, background: "#fff", color: G, fontSize: 15, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>−</button>
      <span style={{ fontSize: 13, minWidth: 20, textAlign: "center" }}>{qty}</span>
      <button onClick={onInc} style={{ width: 26, height: 26, borderRadius: 6, border: "none", background: G, color: "#fff", fontSize: 15, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>+</button>
    </div>
  );
}

function AddBtn({ onClick, disabled }: { onClick(): void; disabled?: boolean }) {
  return (
    <button onClick={onClick} disabled={disabled}
      style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "5px 12px", borderRadius: 7, border: "none", background: disabled ? "#e0e0e0" : G, color: disabled ? "#aaa" : "#fff", fontSize: 12, cursor: disabled ? "not-allowed" : "pointer", fontFamily: "inherit" }}>
      <Plus style={{ width: 12, height: 12 }} /> Tambah
    </button>
  );
}

function FotoHewan({ foto, jenis, size = 32 }: { foto: string | null; jenis: string; size?: number }) {
  if (foto) {
    return (
      <img src={foto} alt="hewan"
        style={{ width: size, height: size, borderRadius: "50%", objectFit: "cover", border: "1px solid #e0e0e0", flexShrink: 0 }} />
    );
  }
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%", background: "#e8f5e9",
      display: "flex", alignItems: "center", justifyContent: "center",
      flexShrink: 0, border: "1px solid #c8e6c9",
    }}>
      <HewanIcon jenis={jenis} size={Math.round(size * 0.55)} />
    </div>
  );
}

/* ─── Custom hooks ──────────────────────────────────────────────────────── */
function usePemilik() {
  const [pemilikList, setPemilikList] = useState<PemilikData[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState<string | null>(null);
  const [retryCount,  setRetryCount]  = useState(0);

  useEffect(() => {
    setLoading(true); setError(null);
    fetch(`${API_BASE}/dokter/pemilik`, {
      headers: { Authorization: `Bearer ${getToken()}`, "Content-Type": "application/json" },
    })
      .then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}: Gagal mengambil data pemilik`); return r.json(); })
      .then((json: { success: boolean; data: ApiPemilik[] }) => {
        if (!json.success) throw new Error("API mengembalikan success: false untuk pemilik");
        setPemilikList(json.data.map(p => ({
          id: p.id, nama: p.nama, noHP: p.no_hp, email: p.email,
          hewan: (p.hewan ?? []).map(h => ({
            id_hewan:   h.id_hewan,
            id_booking: h.id_booking,
            nama:       h.nama_hewan,
            jenis:      h.jenis,
            ras:        h.ras,
            berat:      h.berat,
            usia:       h.usia,
            foto:       h.foto ?? null,
            id_resep:   h.id_resep  ?? null,
            has_resep:  h.has_resep ?? false,
          })),
        })));
      })
      .catch(e => setError(e.message ?? "Gagal memuat data pemilik"))
      .finally(() => setLoading(false));
  }, [retryCount]);

  return { pemilikList, loading, error, retry: () => setRetryCount(c => c + 1) };
}

function useLayananObat() {
  const [layanan,    setLayanan]    = useState<Layanan[]>([]);
  const [obat,       setObat]       = useState<Obat[]>([]);
  const [loadingL,   setLoadingL]   = useState(true);
  const [loadingO,   setLoadingO]   = useState(true);
  const [errorL,     setErrorL]     = useState<string | null>(null);
  const [errorO,     setErrorO]     = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const headers = { Authorization: `Bearer ${getToken()}`, "Content-Type": "application/json" };

  useEffect(() => {
    setLoadingL(true); setErrorL(null);
    fetch(`${API_BASE}/dokter/layanan`, { headers })
      .then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}: Gagal mengambil data layanan`); return r.json(); })
      .then((json: { success: boolean; data: ApiLayanan[] }) => {
        if (!json.success) throw new Error("API mengembalikan success: false untuk layanan");
        setLayanan(json.data.map(l => ({
          id: l.id, nama: l.nama, kategori: l.kategori,
          subKategori: l.sub_kategori ?? undefined, durasi: l.durasi ?? undefined,
          harga: l.harga, deskripsi: l.deskripsi,
          tersedia: l.tersedia, catatan: l.catatan ?? undefined,
        })));
      })
      .catch(e => setErrorL(e.message ?? "Gagal memuat data layanan"))
      .finally(() => setLoadingL(false));
  }, [retryCount]);

  useEffect(() => {
    setLoadingO(true); setErrorO(null);
    fetch(`${API_BASE}/dokter/obat`, { headers })
      .then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}: Gagal mengambil data obat`); return r.json(); })
      .then((json: { success: boolean; data: ApiObat[] }) => {
        if (!json.success) throw new Error("API mengembalikan success: false untuk obat");
        setObat(json.data.map(o => ({
          id: o.id, nama: o.nama, kategori: o.kategori, satuan: o.satuan,
          harga: o.harga, stok: o.stok, minStok: o.min_stok, deskripsi: o.deskripsi,
        })));
      })
      .catch(e => setErrorO(e.message ?? "Gagal memuat data obat"))
      .finally(() => setLoadingO(false));
  }, [retryCount]);

  return { layanan, obat, loadingL, loadingO, errorL, errorO, retry: () => setRetryCount(c => c + 1) };
}

/* ══════════════════════════════════════════════════════════════════════════
   STEP 1 — Pilih Pasien
══════════════════════════════════════════════════════════════════════════ */
function StepPasien({
  onNext,
  onLihatDetail,
}: {
  onNext(d: { pemilik: PemilikData; hewan: HewanData }): void;
  onLihatDetail(idResep: number): void;
}) {
  const { pemilikList, loading, error, retry } = usePemilik();
  const [search,      setSearch]      = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedRow, setSelectedRow] = useState<{ pemilik: PemilikData; hewan: HewanData } | null>(null);
  const [showPanel,   setShowPanel]   = useState(false);

  const rows = useMemo(() => {
    const all: { pemilik: PemilikData; hewan: HewanData }[] = [];
    pemilikList.forEach(p => p.hewan.forEach(h => all.push({ pemilik: p, hewan: h })));
    return all;
  }, [pemilikList]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    if (!q) return rows;
    return rows.filter(r =>
      r.pemilik.nama.toLowerCase().includes(q) ||
      r.pemilik.noHP.replace(/-/g, "").includes(q.replace(/-/g, "")) ||
      r.hewan.nama.toLowerCase().includes(q) ||
      r.hewan.jenis.toLowerCase().includes(q) ||
      r.hewan.ras.toLowerCase().includes(q)
    );
  }, [search, rows]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const paginated  = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  return (
    <div>
      {/* Search bar */}
      <div style={{ ...cardBase, padding: 16 }}>
        <label style={filterLabel}>Cari Pemilik / Hewan</label>
        <div style={{ position: "relative" }}>
          <Search style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", width: 13, height: 13, color: "#aaa" }} />
          <input value={search}
            onChange={e => { setSearch(e.target.value); setCurrentPage(1); setSelectedRow(null); setShowPanel(false); }}
            placeholder="Cari nama pemilik, no HP, nama hewan, atau jenis..."
            style={{ ...inputStyle, paddingLeft: 32 }}
          />
        </div>
      </div>

      {error && <ErrorBanner message={error} onRetry={retry} />}

      {/* Table */}
      <div style={{ ...cardBase, padding: 0, overflow: "hidden" }}>
        <SectionHeader
          icon={<User style={{ width: 14, height: 14, color: G }} />}
          title="Daftar Pemilik & Hewan"
          badge={loading
            ? <span style={{ fontSize: 11, color: G, display: "inline-flex", alignItems: "center", gap: 4 }}>
                <Loader2 style={{ width: 11, height: 11, animation: "spin 1s linear infinite" }} /> Memuat...
              </span>
            : <span style={{ fontSize: 11, color: "#aaa", background: "#f4f4f4", borderRadius: 20, padding: "2px 8px" }}>{filtered.length} data</span>
          }
        />
        <style>{`@keyframes spin { from { transform:rotate(0deg); } to { transform:rotate(360deg); } }`}</style>

        {loading ? <LoadingSpinner label="Memuat data pemilik & hewan..." /> : (
          <>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>{["Pemilik", "Kontak", "Hewan", "Jenis & Ras", "Berat", "Usia", ""].map(h => <th key={h} style={thS}>{h}</th>)}</tr>
                </thead>
                <tbody>
                  {paginated.length === 0 ? (
                    <tr><td colSpan={7} style={{ padding: "2rem", textAlign: "center", color: "#999", fontSize: 13 }}>
                      {rows.length === 0 ? "Belum ada data pemilik & hewan" : "Tidak ada data yang sesuai pencarian"}
                    </td></tr>
                  ) : paginated.map((r, idx) => {
                    const isSel          = selectedRow?.pemilik.id === r.pemilik.id && selectedRow?.hewan.id_hewan === r.hewan.id_hewan;
                    const sudahAdaResep  = r.hewan.has_resep === true;
                    const idResep        = r.hewan.id_resep ?? null;
                    const rowBg = isSel ? "#f0faf2" : sudahAdaResep ? "#fffde7" : idx % 2 === 0 ? "#fff" : "#fafafa";

                    return (
                      <tr key={`${r.pemilik.id}-${r.hewan.id_hewan}`} style={{ background: rowBg }}
                        onMouseEnter={e => { if (!isSel) e.currentTarget.style.background = "#f5fdf6"; }}
                        onMouseLeave={e => { e.currentTarget.style.background = rowBg; }}
                      >
                        <td style={tdS}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#e8f5e9", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                              <User style={{ width: 15, height: 15, color: G }} />
                            </div>
                            <span style={{ fontSize: 13, color: "#1a1a1a" }}>{r.pemilik.nama}</span>
                          </div>
                        </td>
                        <td style={tdS}>
                          <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#555" }}>
                            <Phone style={{ width: 11, height: 11, color: "#aaa", flexShrink: 0 }} />
                            {r.pemilik.noHP}
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: "#aaa", marginTop: 2 }}>
                            <Mail style={{ width: 11, height: 11, flexShrink: 0 }} />
                            {r.pemilik.email}
                          </div>
                        </td>
                        <td style={tdS}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <FotoHewan foto={r.hewan.foto} jenis={r.hewan.jenis} size={32} />
                            <span style={{ fontSize: 13 }}>{r.hewan.nama}</span>
                          </div>
                        </td>
                        <td style={tdS}>
                          <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13 }}>
                            <HewanIcon jenis={r.hewan.jenis} size={14} />
                            {r.hewan.jenis}
                          </div>
                          <div style={{ fontSize: 11, color: "#aaa", marginTop: 2, paddingLeft: 20 }}>{r.hewan.ras}</div>
                        </td>
                        <td style={{ ...tdS, color: "#555" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 13 }}>
                            <Weight style={{ width: 12, height: 12, color: "#aaa" }} />
                            {r.hewan.berat}
                          </div>
                        </td>
                        <td style={{ ...tdS, color: "#555" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 13 }}>
                            <Timer style={{ width: 12, height: 12, color: "#aaa" }} />
                            {r.hewan.usia}
                          </div>
                        </td>
                        <td style={{ ...tdS, textAlign: "center" }}>
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                            {isSel ? (
                              <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 12, color: G, fontWeight: 500 }}>
                                <CheckCircle2 style={{ width: 14, height: 14 }} /> Dipilih
                              </span>
                            ) : sudahAdaResep ? (
                              <span style={{ fontSize: 11, color: "#aaa", background: "#f4f4f4", borderRadius: 20, padding: "2px 8px", whiteSpace: "nowrap" }}>
                                Resep tersedia
                              </span>
                            ) : (
                              <button
                                onClick={() => { setSelectedRow(r); setShowPanel(true); }}
                                style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "5px 12px", borderRadius: 7, border: `1px solid ${G}`, background: "#fff", color: G, fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}
                                onMouseEnter={e => { e.currentTarget.style.background = G; e.currentTarget.style.color = "#fff"; }}
                                onMouseLeave={e => { e.currentTarget.style.background = "#fff"; e.currentTarget.style.color = G; }}
                              >Pilih</button>
                            )}

                            {sudahAdaResep && idResep && (
                              <button
                                onClick={() => onLihatDetail(idResep)}
                                title="Lihat detail resep"
                                style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "5px 10px", borderRadius: 7, border: "1px solid #f9a825", background: "#fffde7", color: "#f57f17", fontSize: 12, cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap" }}
                                onMouseEnter={e => { e.currentTarget.style.background = "#f9a825"; e.currentTarget.style.color = "#fff"; }}
                                onMouseLeave={e => { e.currentTarget.style.background = "#fffde7"; e.currentTarget.style.color = "#f57f17"; }}
                              >
                                <Eye style={{ width: 12, height: 12 }} /> Detail
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "14px 16px", borderTop: "1px solid #f0f0f0" }}>
              <button style={pageBtn(false)} disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}>← Sebelumnya</button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                <button key={p} style={pageBtn(p === currentPage)} onClick={() => setCurrentPage(p)}>{p}</button>
              ))}
              <button style={pageBtn(false)} disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)}>Berikutnya →</button>
            </div>
          </>
        )}
      </div>

      {/* Selected patient panel */}
      {showPanel && selectedRow && (
        <div style={{ ...cardBase, padding: 0, overflow: "hidden" }}>
          <SectionHeader icon={<PawPrint style={{ width: 14, height: 14, color: G }} />} title="Pasien Terpilih" />
          <div style={{ padding: 16 }}>
            <div style={{ background: "#f0faf2", border: "1px solid #a5d6a7", borderRadius: 8, padding: "12px 16px", display: "flex", alignItems: "center", gap: 14, marginBottom: 14 }}>
              <FotoHewan foto={selectedRow.hewan.foto} jenis={selectedRow.hewan.jenis} size={44} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, color: "#1a1a1a" }}>
                  <span style={{ fontWeight: 600 }}>{selectedRow.hewan.nama}</span>
                  <span style={{ color: "#888", fontSize: 12, marginLeft: 8 }}>{selectedRow.hewan.ras} · {selectedRow.hewan.berat} · {selectedRow.hewan.usia}</span>
                </div>
                <div style={{ fontSize: 12, color: "#555", marginTop: 3 }}>
                  Pemilik: {selectedRow.pemilik.nama} · {selectedRow.pemilik.noHP}
                </div>
              </div>
              <button onClick={() => { setSelectedRow(null); setShowPanel(false); }}
                style={{ border: "none", background: "none", cursor: "pointer", color: "#aaa", fontSize: 18, lineHeight: 1 }}>×</button>
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button onClick={() => onNext({ pemilik: selectedRow.pemilik, hewan: selectedRow.hewan })}
                style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "9px 22px", borderRadius: 8, border: "none", background: G, color: "#fff", fontSize: 13, fontWeight: 500, cursor: "pointer", fontFamily: "inherit" }}
                onMouseEnter={e => e.currentTarget.style.background = "#1b5e20"}
                onMouseLeave={e => e.currentTarget.style.background = G}
              >
                Pilih Layanan & Obat <ChevronRight style={{ width: 14, height: 14 }} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   STEP 2 — Pilih Tindakan
══════════════════════════════════════════════════════════════════════════ */
function StepTindakan({ pemilik, hewan, onBack, onKonfirmasi }: {
  pemilik: PemilikData; hewan: HewanData;
  onBack(): void;
  onKonfirmasi(r: Omit<ResepTersimpan, "id">): void;
}) {
  const { layanan, obat, loadingL, loadingO, errorL, errorO, retry } = useLayananObat();
  const [cartLayanan,   setCartLayanan]   = useState<CartLayanan[]>([]);
  const [cart,          setCart]          = useState<CartItem[]>([]);
  const [catatan,       setCatatan]       = useState("");
  const [searchLayanan, setSearchLayanan] = useState("");
  const [searchObat,    setSearchObat]    = useState("");
  const [tab,           setTab]           = useState<"layanan" | "obat">("layanan");
  const [showConfirm,   setShowConfirm]   = useState(false);
  const [saving,        setSaving]        = useState(false);
  const [saveError,     setSaveError]     = useState<string | null>(null);

  const fLayanan = useMemo(() => layanan.filter(l =>
    l.nama.toLowerCase().includes(searchLayanan.toLowerCase()) ||
    l.kategori.toLowerCase().includes(searchLayanan.toLowerCase())
  ), [layanan, searchLayanan]);

  const fObat = useMemo(() => obat.filter(o =>
    o.nama.toLowerCase().includes(searchObat.toLowerCase()) ||
    o.kategori.toLowerCase().includes(searchObat.toLowerCase())
  ), [obat, searchObat]);

  const layByKat  = useMemo(() => { const m: Record<string, Layanan[]> = {}; fLayanan.forEach(l => { (m[l.kategori] ??= []).push(l); }); return m; }, [fLayanan]);
  const obatByKat = useMemo(() => { const m: Record<string, Obat[]> = {};   fObat.forEach(o => { (m[o.kategori] ??= []).push(o); });   return m; }, [fObat]);

  const addL = (l: Layanan) => setCartLayanan(p => { const e = p.find(c => c.layanan.id === l.id); return e ? p.map(c => c.layanan.id === l.id ? { ...c, qty: c.qty + 1 } : c) : [...p, { layanan: l, qty: 1 }]; });
  const decL = (id: number) => setCartLayanan(p => p.map(c => c.layanan.id === id ? { ...c, qty: c.qty - 1 } : c).filter(c => c.qty > 0));
  const delL = (id: number) => setCartLayanan(p => p.filter(c => c.layanan.id !== id));
  const addO = (o: Obat)    => setCart(p => { const e = p.find(c => c.obat.id === o.id); return e ? p.map(c => c.obat.id === o.id ? { ...c, qty: c.qty + 1 } : c) : [...p, { obat: o, qty: 1 }]; });
  const decO = (id: number) => setCart(p => p.map(c => c.obat.id === id ? { ...c, qty: c.qty - 1 } : c).filter(c => c.qty > 0));
  const delO = (id: number) => setCart(p => p.filter(c => c.obat.id !== id));

  const totalL   = cartLayanan.reduce((s, c) => s + c.layanan.harga * c.qty, 0);
  const totalO   = cart.reduce((s, c) => s + c.obat.harga * c.qty, 0);
  const grand    = totalL + totalO;
  const hasItems = cartLayanan.length > 0 || cart.length > 0;

  async function doKonfirmasi() {
    setSaving(true); setSaveError(null);
    const items = [
      ...cartLayanan.map(c => ({
        tipe: "layanan", id_referensi: c.layanan.id,
        nama_item: c.layanan.nama, harga_satuan: c.layanan.harga,
        qty: c.qty, subtotal: c.layanan.harga * c.qty,
      })),
      ...cart.map(c => ({
        tipe: "obat", id_referensi: c.obat.id,
        nama_item: c.obat.nama, harga_satuan: c.obat.harga,
        qty: c.qty, subtotal: c.obat.harga * c.qty,
      })),
    ];
    try {
      const res = await fetch(`${API_BASE}/dokter/resep`, {
        method: "POST",
        headers: { Authorization: `Bearer ${getToken()}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          id_booking: hewan.id_booking, id_hewan: hewan.id_hewan,
          id_user: pemilik.id, catatan, grand_total: grand, items,
        }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(
        typeof json.message === "object" ? JSON.stringify(json.message) : json.message
      );
      const now = new Date();
      onKonfirmasi({
        idResep:  json.id_resep,
        tanggal:  now.toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" }),
        waktu:    now.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) + " WIB",
        pemilik, hewan, cartLayanan, cart, catatan, grandTotal: grand,
      });
      setShowConfirm(false);
    } catch (err: unknown) {
      setSaveError(err instanceof Error ? err.message : "Gagal menyimpan resep");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <button onClick={onBack} style={{ display: "inline-flex", alignItems: "center", gap: 6, border: "none", background: "none", cursor: "pointer", color: "#888", fontSize: 13, marginBottom: 14, padding: 0, fontFamily: "inherit" }}>
        <ArrowLeft style={{ width: 14, height: 14 }} /> Kembali
      </button>

      {/* Patient info bar */}
      <div style={{ ...cardBase, padding: "12px 16px", display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <FotoHewan foto={hewan.foto} jenis={hewan.jenis} size={44} />
        <div style={{ flex: 1 }}>
          <span style={{ fontSize: 14, color: "#1a1a1a" }}>
            <span style={{ fontWeight: 600 }}>{hewan.nama}</span>
            <span style={{ color: "#888", fontSize: 12, marginLeft: 8 }}>{hewan.ras} · {hewan.berat} · {hewan.usia}</span>
          </span>
          <div style={{ fontSize: 12, color: "#555", marginTop: 2 }}>Pemilik: {pemilik.nama} · {pemilik.noHP}</div>
        </div>
      </div>

      {(errorL || errorO) && (
        <ErrorBanner message={[errorL, errorO].filter(Boolean).join(" | ")} onRetry={retry} />
      )}

      {/* Tab switcher */}
      <div style={{ display: "flex", background: "#fff", borderRadius: 8, padding: 4, border: "1px solid #e8e8e8", marginBottom: 16, width: "fit-content" }}>
        {([
          { key: "layanan" as const, icon: <Stethoscope style={{ width: 13, height: 13 }} />, label: "Layanan Klinik", count: cartLayanan.length },
          { key: "obat"    as const, icon: <Pill style={{ width: 13, height: 13 }} />,        label: "Obat & Vitamin",  count: cart.length },
        ]).map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            style={{ padding: "7px 20px", borderRadius: 6, border: "none", cursor: "pointer", fontSize: 13, fontFamily: "inherit", background: tab === t.key ? G : "transparent", color: tab === t.key ? "#fff" : "#888", display: "flex", alignItems: "center", gap: 6 }}>
            {t.icon}
            {t.label}
            {t.count > 0 && <span style={{ background: tab === t.key ? "rgba(255,255,255,.3)" : G, color: "#fff", borderRadius: 20, padding: "1px 6px", fontSize: 11 }}>{t.count}</span>}
          </button>
        ))}
      </div>

      {/* ── Layanan table ── */}
      {tab === "layanan" && (
        <div style={{ ...cardBase, padding: 0, overflow: "hidden" }}>
          <SectionHeader
            icon={<Stethoscope style={{ width: 14, height: 14, color: G }} />}
            title="Layanan Klinik"
            badge={loadingL
              ? <span style={{ fontSize: 11, color: G, display: "inline-flex", alignItems: "center", gap: 4 }}>
                  <Loader2 style={{ width: 11, height: 11, animation: "spin 1s linear infinite" }} /> Memuat...
                </span>
              : <span style={{ fontSize: 11, color: "#aaa", background: "#f4f4f4", borderRadius: 20, padding: "2px 8px" }}>{layanan.length} item</span>
            }
            right={
              <div style={{ position: "relative" }}>
                <Search style={{ position: "absolute", left: 9, top: "50%", transform: "translateY(-50%)", width: 12, height: 12, color: "#aaa" }} />
                <input value={searchLayanan} onChange={e => setSearchLayanan(e.target.value)} placeholder="Cari layanan..."
                  style={{ ...inputStyle, paddingLeft: 28, width: 200, fontSize: 12 }} />
              </div>
            }
          />
          <div style={{ overflowX: "auto" }}>
            {loadingL ? <LoadingSpinner label="Memuat data layanan..." /> : (
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead><tr>
                  <th style={thS}>Layanan</th>
                  <th style={thS}>Kategori</th>
                  <th style={thS}>Durasi</th>
                  <th style={{ ...thS, textAlign: "right" }}>Harga</th>
                  <th style={{ ...thS, textAlign: "center", width: 120 }}>Aksi</th>
                </tr></thead>
                <tbody>
                  {fLayanan.length === 0
                    ? <tr><td colSpan={5} style={{ padding: "2rem", textAlign: "center", color: "#aaa", fontSize: 13 }}>Layanan tidak ditemukan</td></tr>
                    : Object.entries(layByKat).map(([kat, items]) => {
                        const cfg = KAT_LAYANAN[kat] ?? { color: G, bg: "#e8f5e9" };
                        return items.map((l, i) => {
                          const ci = cartLayanan.find(c => c.layanan.id === l.id);
                          return (
                            <React.Fragment key={l.id}>
                              {i === 0 && (
                                <tr><td colSpan={5} style={{ padding: "6px 14px 4px", background: cfg.bg }}>
                                  <span style={{ fontSize: 11, color: cfg.color, textTransform: "uppercase", letterSpacing: ".05em" }}>{kat}</span>
                                </td></tr>
                              )}
                              <tr style={{ background: i % 2 === 0 ? "#fff" : "#fafafa", opacity: l.tersedia ? 1 : 0.5 }}>
                                <td style={tdS}>
                                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                    <div style={{ width: 30, height: 30, borderRadius: 8, background: cfg.bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, color: cfg.color }}>
                                      <LayananIcon nama={l.nama} kategori={l.kategori} size={15} />
                                    </div>
                                    <div>
                                      <div style={{ fontSize: 13 }}>{l.nama}</div>
                                      <div style={{ fontSize: 11, color: "#888", marginTop: 1 }}>{l.deskripsi}</div>
                                      {l.catatan && <span style={{ fontSize: 11, color: cfg.color, background: cfg.bg, borderRadius: 4, padding: "1px 6px", display: "inline-block", marginTop: 2 }}>{l.catatan}</span>}
                                    </div>
                                  </div>
                                </td>
                                <td style={tdS}><span style={{ fontSize: 11, color: cfg.color, background: cfg.bg, borderRadius: 20, padding: "2px 9px" }}>{l.subKategori ?? kat}</span></td>
                                <td style={{ ...tdS, fontSize: 12, color: "#888", whiteSpace: "nowrap" }}>
                                  {l.durasi
                                    ? <div style={{ display: "flex", alignItems: "center", gap: 4 }}><Clock style={{ width: 11, height: 11, color: "#bbb" }} />{l.durasi}</div>
                                    : "–"}
                                </td>
                                <td style={{ ...tdS, textAlign: "right", color: l.harga === 0 ? "#aaa" : G, whiteSpace: "nowrap" }}>{l.harga === 0 ? "Dikonfirmasi" : fmt(l.harga)}</td>
                                <td style={{ ...tdS, textAlign: "center" }}>
                                  {!l.tersedia
                                    ? <span style={{ fontSize: 11, color: "#bbb" }}>Tidak Tersedia</span>
                                    : ci
                                      ? <QtyControl qty={ci.qty} onInc={() => addL(l)} onDec={() => decL(l.id)} />
                                      : <AddBtn onClick={() => addL(l)} />}
                                </td>
                              </tr>
                            </React.Fragment>
                          );
                        });
                      })
                  }
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* ── Obat table ── */}
      {tab === "obat" && (
        <div style={{ ...cardBase, padding: 0, overflow: "hidden" }}>
          <SectionHeader
            icon={<Pill style={{ width: 14, height: 14, color: G }} />}
            title="Obat & Vitamin"
            badge={loadingO
              ? <span style={{ fontSize: 11, color: G, display: "inline-flex", alignItems: "center", gap: 4 }}>
                  <Loader2 style={{ width: 11, height: 11, animation: "spin 1s linear infinite" }} /> Memuat...
                </span>
              : <span style={{ fontSize: 11, color: "#aaa", background: "#f4f4f4", borderRadius: 20, padding: "2px 8px" }}>{obat.length} item</span>
            }
            right={
              <div style={{ position: "relative" }}>
                <Search style={{ position: "absolute", left: 9, top: "50%", transform: "translateY(-50%)", width: 12, height: 12, color: "#aaa" }} />
                <input value={searchObat} onChange={e => setSearchObat(e.target.value)} placeholder="Cari obat..."
                  style={{ ...inputStyle, paddingLeft: 28, width: 200, fontSize: 12 }} />
              </div>
            }
          />
          <div style={{ overflowX: "auto" }}>
            {loadingO ? <LoadingSpinner label="Memuat data obat..." /> : (
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead><tr>
                  <th style={thS}>Nama Obat</th>
                  <th style={thS}>Satuan</th>
                  <th style={{ ...thS, textAlign: "center" }}>Stok</th>
                  <th style={{ ...thS, textAlign: "right" }}>Harga</th>
                  <th style={{ ...thS, textAlign: "center", width: 120 }}>Aksi</th>
                </tr></thead>
                <tbody>
                  {fObat.length === 0
                    ? <tr><td colSpan={5} style={{ padding: "2rem", textAlign: "center", color: "#aaa", fontSize: 13 }}>Obat tidak ditemukan</td></tr>
                    : Object.entries(obatByKat).map(([kat, items]) => {
                        const cfg = KAT_OBAT[kat] ?? { color: "#37474f", bg: "#eceff1" };
                        return items.map((o, i) => {
                          const ci = cart.find(c => c.obat.id === o.id);
                          const st = stokStatus(o);
                          const ss = STOK_STYLE[st];
                          return (
                            <React.Fragment key={o.id}>
                              {i === 0 && (
                                <tr><td colSpan={5} style={{ padding: "6px 14px 4px", background: cfg.bg }}>
                                  <span style={{ fontSize: 11, color: cfg.color, textTransform: "uppercase", letterSpacing: ".05em" }}>{kat}</span>
                                </td></tr>
                              )}
                              <tr style={{ background: i % 2 === 0 ? "#fff" : "#fafafa", opacity: st === "Habis" ? 0.5 : 1 }}>
                                <td style={tdS}>
                                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                    <div style={{ width: 30, height: 30, borderRadius: 8, background: cfg.bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, color: cfg.color }}>
                                      <ObatIcon kategori={o.kategori} size={15} />
                                    </div>
                                    <div>
                                      <div style={{ fontSize: 13 }}>{o.nama}</div>
                                      <div style={{ fontSize: 11, color: "#888", marginTop: 1 }}>{o.deskripsi}</div>
                                    </div>
                                  </div>
                                </td>
                                <td style={{ ...tdS, fontSize: 12, color: "#888" }}>{o.satuan}</td>
                                <td style={{ ...tdS, textAlign: "center" }}>
                                  <span style={{ fontSize: 11, background: ss.bg, color: ss.color, borderRadius: 20, padding: "2px 9px" }}>{st} ({o.stok})</span>
                                </td>
                                <td style={{ ...tdS, textAlign: "right", color: G, whiteSpace: "nowrap" }}>{fmt(o.harga)}</td>
                                <td style={{ ...tdS, textAlign: "center" }}>
                                  {st === "Habis"
                                    ? <span style={{ fontSize: 11, color: "#bbb" }}>Stok Habis</span>
                                    : ci
                                      ? <QtyControl qty={ci.qty} onInc={() => addO(o)} onDec={() => decO(o.id)} />
                                      : <AddBtn onClick={() => addO(o)} />}
                                </td>
                              </tr>
                            </React.Fragment>
                          );
                        });
                      })
                  }
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* ── Order summary ── */}
      {hasItems && (
        <div style={{ ...cardBase, padding: 0, overflow: "hidden" }}>
          <SectionHeader
            icon={<Receipt style={{ width: 14, height: 14, color: G }} />}
            title="Ringkasan Pesanan"
            badge={<span style={{ fontSize: 11, color: G, background: "#e8f5e9", borderRadius: 20, padding: "2px 8px" }}>{cartLayanan.length + cart.length} item</span>}
          />
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead><tr>
                <th style={thS}>Item</th>
                <th style={{ ...thS, textAlign: "center" }}>Qty</th>
                <th style={thS}>Harga Satuan</th>
                <th style={{ ...thS, textAlign: "right" }}>Subtotal</th>
                <th style={{ ...thS, width: 40 }}></th>
              </tr></thead>
              <tbody>
                {cartLayanan.length > 0 && (
                  <tr><td colSpan={5} style={{ padding: "6px 14px 4px", background: "#e3f2fd" }}>
                    <span style={{ fontSize: 11, color: "#1565c0", textTransform: "uppercase", letterSpacing: ".05em" }}>Layanan Klinik</span>
                  </td></tr>
                )}
                {cartLayanan.map((c, i) => {
                  const cfg = KAT_LAYANAN[c.layanan.kategori] ?? { color: G, bg: "#e8f5e9" };
                  return (
                    <tr key={c.layanan.id} style={{ background: i % 2 === 0 ? "#fff" : "#fafafa" }}>
                      <td style={tdS}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <div style={{ width: 26, height: 26, borderRadius: 6, background: cfg.bg, display: "flex", alignItems: "center", justifyContent: "center", color: cfg.color, flexShrink: 0 }}>
                            <LayananIcon nama={c.layanan.nama} kategori={c.layanan.kategori} size={13} />
                          </div>
                          <span>{c.layanan.nama}</span>
                          <span style={{ marginLeft: 4, fontSize: 11, color: cfg.color, background: cfg.bg, borderRadius: 20, padding: "1px 7px" }}>{c.layanan.kategori}</span>
                        </div>
                      </td>
                      <td style={{ ...tdS, textAlign: "center" }}>×{c.qty}</td>
                      <td style={{ ...tdS, color: "#888" }}>{c.layanan.harga === 0 ? "Dikonfirmasi" : fmt(c.layanan.harga)}</td>
                      <td style={{ ...tdS, textAlign: "right", color: G }}>{c.layanan.harga === 0 ? "–" : fmt(c.layanan.harga * c.qty)}</td>
                      <td style={{ ...tdS, textAlign: "center" }}>
                        <button onClick={() => delL(c.layanan.id)} style={{ border: "none", background: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <Trash2 style={{ width: 13, height: 13, color: "#e53935" }} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {cart.length > 0 && (
                  <tr><td colSpan={5} style={{ padding: "6px 14px 4px", background: "#fce4ec" }}>
                    <span style={{ fontSize: 11, color: "#c62828", textTransform: "uppercase", letterSpacing: ".05em" }}>Obat & Vitamin</span>
                  </td></tr>
                )}
                {cart.map((c, i) => {
                  const cfg = KAT_OBAT[c.obat.kategori] ?? { color: "#37474f", bg: "#eceff1" };
                  return (
                    <tr key={c.obat.id} style={{ background: i % 2 === 0 ? "#fff" : "#fafafa" }}>
                      <td style={tdS}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <div style={{ width: 26, height: 26, borderRadius: 6, background: cfg.bg, display: "flex", alignItems: "center", justifyContent: "center", color: cfg.color, flexShrink: 0 }}>
                            <ObatIcon kategori={c.obat.kategori} size={13} />
                          </div>
                          <span>{c.obat.nama}</span>
                        </div>
                      </td>
                      <td style={{ ...tdS, textAlign: "center" }}>×{c.qty}</td>
                      <td style={{ ...tdS, color: "#888" }}>{fmt(c.obat.harga)}</td>
                      <td style={{ ...tdS, textAlign: "right", color: G }}>{fmt(c.obat.harga * c.qty)}</td>
                      <td style={{ ...tdS, textAlign: "center" }}>
                        <button onClick={() => delO(c.obat.id)} style={{ border: "none", background: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <Trash2 style={{ width: 13, height: 13, color: "#e53935" }} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
                <tr style={{ borderTop: `2px solid ${G}` }}>
                  <td colSpan={3} style={{ padding: "12px 14px", textAlign: "right", fontSize: 13 }}>Grand Total</td>
                  <td style={{ padding: "12px 14px", color: G, textAlign: "right", fontSize: 15, fontWeight: 700 }}>{fmt(grand)}</td>
                  <td />
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Notes */}
      <div style={{ ...cardBase, padding: 0, overflow: "hidden" }}>
        <SectionHeader icon={<FileText style={{ width: 14, height: 14, color: G }} />} title="Catatan & Aturan Pakai" />
        <div style={{ padding: 16 }}>
          <textarea value={catatan} onChange={e => setCatatan(e.target.value)} rows={3}
            placeholder="Kontrol ulang jika tidak ada perbaikan dalam 3 hari"
            style={{ ...inputStyle, resize: "vertical", lineHeight: 1.6 }} />
        </div>
      </div>

      {/* Footer actions */}
      <div style={{ display: "flex", justifyContent: "space-between", paddingBottom: 32 }}>
        <button onClick={onBack}
          style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "9px 20px", borderRadius: 8, border: `1px solid ${G}`, background: "#fff", color: G, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>
          <ArrowLeft style={{ width: 13, height: 13 }} /> Kembali
        </button>
        <button onClick={() => setShowConfirm(true)} disabled={!hasItems}
          style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "9px 22px", borderRadius: 8, border: "none", background: hasItems ? G : "#e0e0e0", color: hasItems ? "#fff" : "#aaa", fontSize: 13, fontWeight: 500, cursor: hasItems ? "pointer" : "not-allowed", fontFamily: "inherit" }}
          onMouseEnter={e => { if (hasItems) e.currentTarget.style.background = "#1b5e20"; }}
          onMouseLeave={e => { if (hasItems) e.currentTarget.style.background = G; }}
        >
          Konfirmasi Resep <ChevronRight style={{ width: 13, height: 13 }} />
        </button>
      </div>

      {/* Confirm modal */}
      {showConfirm && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.4)", zIndex: 500, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ background: "#fff", borderRadius: 12, padding: "24px 28px", maxWidth: 400, width: "90%", boxShadow: "0 16px 48px rgba(0,0,0,.2)", fontFamily: "inherit" }}>
            <div style={{ fontSize: 13, color: "#1a1a1a", marginBottom: 16, lineHeight: 1.7 }}>
              Simpan resep untuk <span style={{ fontWeight: 600 }}>{hewan.nama}</span> milik <span style={{ fontWeight: 600 }}>{pemilik.nama}</span>?
              {hasItems && <> Total: <span style={{ color: G, fontWeight: 600 }}>{fmt(grand)}</span>.</>}
            </div>
            {saveError && (
              <div style={{ display: "flex", alignItems: "flex-start", gap: 8, padding: "10px 12px", background: "#ffebee", border: "1px solid #ef9a9a", borderRadius: 8, marginBottom: 14 }}>
                <AlertCircle style={{ width: 14, height: 14, color: "#c62828", flexShrink: 0, marginTop: 1 }} />
                <span style={{ fontSize: 12, color: "#c62828", lineHeight: 1.5 }}>{saveError}</span>
              </div>
            )}
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button onClick={() => { setShowConfirm(false); setSaveError(null); }} disabled={saving}
                style={{ padding: "7px 18px", borderRadius: 8, border: "1px solid #e0e0e0", background: "#fff", color: "#555", fontSize: 13, cursor: saving ? "not-allowed" : "pointer", fontFamily: "inherit", opacity: saving ? 0.5 : 1 }}>
                Batal
              </button>
              <button onClick={doKonfirmasi} disabled={saving}
                style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "7px 18px", borderRadius: 8, border: "none", background: saving ? "#a5d6a7" : G, color: "#fff", fontSize: 13, cursor: saving ? "not-allowed" : "pointer", fontFamily: "inherit" }}>
                {saving && <Loader2 style={{ width: 13, height: 13, animation: "spin 1s linear infinite" }} />}
                {saving ? "Menyimpan..." : "Simpan Resep"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   Detail Resep Tersimpan
══════════════════════════════════════════════════════════════════════════ */
function DetailTersimpan({ idResep, onBaru }: { idResep: number; onBaru(): void }) {
  const [data,       setData]       = useState<ResepTersimpan | null>(null);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    if (!idResep) return;
    setLoading(true); setError(null);
    fetch(`${API_BASE}/dokter/resep/${idResep}`, {
      headers: { Authorization: `Bearer ${getToken()}`, "Content-Type": "application/json" },
    })
      .then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
      .then(json => {
        if (!json.success) throw new Error(json.message);
        const d = json.data;

        const cartLayanan: CartLayanan[] = (d.details ?? [])
          .filter((x: any) => x.tipe === "layanan")
          .map((x: any) => ({
            layanan: {
              id: x.id_referensi, nama: x.nama_item, kategori: "",
              harga: x.harga_satuan, deskripsi: "", tersedia: true,
            },
            qty: x.qty,
          }));

        const cart: CartItem[] = (d.details ?? [])
          .filter((x: any) => x.tipe === "obat")
          .map((x: any) => ({
            obat: {
              id: x.id_referensi, nama: x.nama_item, kategori: "",
              satuan: "", harga: x.harga_satuan, stok: 0, minStok: 0, deskripsi: "",
            },
            qty: x.qty,
          }));

        const now = new Date();
        setData({
          id:         idResep,
          idResep:    d.id_resep,
          tanggal:    now.toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" }),
          waktu:      now.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) + " WIB",
          cartLayanan, cart,
          catatan:    d.catatan    ?? "",
          grandTotal: d.grand_total,
          hewan: d.hewan ? {
            id_hewan:   d.hewan.id_hewan,
            id_booking: d.hewan.id_booking,
            nama:       d.hewan.nama_hewan,
            jenis:      d.hewan.jenis,
            ras:        d.hewan.ras,
            berat:      d.hewan.berat,
            usia:       d.hewan.usia,
            foto:       d.hewan.foto ?? null,
          } : { id_hewan: 0, id_booking: 0, nama: "-", jenis: "-", ras: "-", berat: "-", usia: "-", foto: null },
          pemilik: d.pemilik ? {
            id: d.pemilik.id, nama: d.pemilik.nama,
            noHP: d.pemilik.no_hp, email: d.pemilik.email, hewan: [],
          } : { id: 0, nama: "-", noHP: "-", email: "-", hewan: [] },
        });
      })
      .catch(e => setError(e.message ?? "Gagal memuat detail resep"))
      .finally(() => setLoading(false));
  }, [idResep, retryCount]);

  if (loading) return <LoadingSpinner label="Memuat detail resep..." />;
  if (error)   return <ErrorBanner message={error} onRetry={() => setRetryCount(c => c + 1)} />;
  if (!data)   return null;

  const totalL = data.cartLayanan.reduce((s, c) => s + c.layanan.harga * c.qty, 0);
  const totalO = data.cart.reduce((s, c) => s + c.obat.harga * c.qty, 0);

  return (
    <div>
      {/* Success banner */}
      <div style={{
        background: `linear-gradient(135deg, ${G} 0%, #1b5e20 100%)`,
        borderRadius: 12, padding: "20px 24px", marginBottom: 20,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        flexWrap: "wrap", gap: 16, boxShadow: "0 4px 16px rgba(46,125,50,0.25)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ width: 52, height: 52, background: "rgba(255,255,255,0.15)", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <CheckCircle2 style={{ width: 28, height: 28, color: "#fff" }} />
          </div>
          <div>
            <div style={{ fontSize: 17, color: "#fff", fontWeight: 700, marginBottom: 4 }}>Resep Berhasil Disimpan</div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.75)", display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                <Calendar style={{ width: 11, height: 11 }} />{data.tanggal}
              </span>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                <Clock style={{ width: 11, height: 11 }} />{data.waktu}
              </span>
            </div>
          </div>
        </div>
        <button onClick={onBaru}
          style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "9px 18px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.4)", background: "rgba(255,255,255,0.12)", color: "#fff", fontSize: 13, fontWeight: 500, cursor: "pointer", fontFamily: "inherit" }}
          onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.22)"}
          onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,0.12)"}
        >
          <Plus style={{ width: 13, height: 13 }} /> Resep Baru
        </button>
      </div>

      {/* Pemilik + Hewan info grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
        <div style={{ ...cardBase, marginBottom: 0, padding: 0, overflow: "hidden" }}>
          <SectionHeader icon={<User style={{ width: 14, height: 14, color: G }} />} title="Info Pemilik" />
          <div style={{ padding: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14, paddingBottom: 14, borderBottom: "1px solid #f0f0f0" }}>
              <div style={{ width: 40, height: 40, borderRadius: "50%", background: "#e8f5e9", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <User style={{ width: 18, height: 18, color: G }} />
              </div>
              <div style={{ fontSize: 14, fontWeight: 600, color: "#1a1a1a" }}>{data.pemilik.nama}</div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <div style={{ display: "flex", gap: 10, fontSize: 13, alignItems: "flex-start" }}>
                <Phone style={{ width: 13, height: 13, color: "#aaa", flexShrink: 0, marginTop: 1 }} />
                <span style={{ color: "#888", minWidth: 50, flexShrink: 0 }}>No. HP</span>
                <span style={{ color: "#333" }}>{data.pemilik.noHP}</span>
              </div>
              <div style={{ display: "flex", gap: 10, fontSize: 13, alignItems: "flex-start" }}>
                <Mail style={{ width: 13, height: 13, color: "#aaa", flexShrink: 0, marginTop: 1 }} />
                <span style={{ color: "#888", minWidth: 50, flexShrink: 0 }}>Email</span>
                <span style={{ color: "#333", wordBreak: "break-word" }}>{data.pemilik.email}</span>
              </div>
            </div>
          </div>
        </div>

        <div style={{ ...cardBase, marginBottom: 0, padding: 0, overflow: "hidden" }}>
          <SectionHeader icon={<PawPrint style={{ width: 14, height: 14, color: G }} />} title="Info Hewan" />
          <div style={{ padding: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14, paddingBottom: 14, borderBottom: "1px solid #f0f0f0" }}>
              <FotoHewan foto={data.hewan.foto} jenis={data.hewan.jenis} size={40} />
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: "#1a1a1a" }}>{data.hewan.nama}</div>
                <div style={{ fontSize: 12, color: "#888", marginTop: 2 }}>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                    <HewanIcon jenis={data.hewan.jenis} size={12} />
                    {data.hewan.jenis} · {data.hewan.ras}
                  </span>
                </div>
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              {([
                [<Weight key="w" style={{ width: 13, height: 13 }} />, "Berat", data.hewan.berat],
                [<Timer  key="t" style={{ width: 13, height: 13 }} />, "Usia",  data.hewan.usia],
              ] as [React.ReactNode, string, string][]).map(([icon, lbl, val]) => (
                <div key={lbl} style={{ background: "#f8f9f8", borderRadius: 8, padding: "8px 12px" }}>
                  <div style={{ fontSize: 11, color: "#aaa", marginBottom: 4, display: "flex", alignItems: "center", gap: 4 }}>
                    {icon}{lbl}
                  </div>
                  <div style={{ fontSize: 13, color: "#1a1a1a", fontWeight: 500 }}>{val}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Layanan detail */}
      {data.cartLayanan.length > 0 && (
        <div style={{ ...cardBase, padding: 0, overflow: "hidden" }}>
          <SectionHeader icon={<Stethoscope style={{ width: 14, height: 14, color: G }} />} title="Layanan Klinik"
            badge={<span style={{ fontSize: 11, color: "#1565c0", background: "#e3f2fd", borderRadius: 20, padding: "2px 8px" }}>{data.cartLayanan.length} layanan</span>} />
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead><tr>
                <th style={thS}>Layanan</th>
                <th style={thS}>Kategori</th>
                <th style={{ ...thS, textAlign: "center" }}>Qty</th>
                <th style={{ ...thS, textAlign: "right" }}>Harga Satuan</th>
                <th style={{ ...thS, textAlign: "right" }}>Subtotal</th>
              </tr></thead>
              <tbody>
                {data.cartLayanan.map((c, i) => {
                  const cfg = KAT_LAYANAN[c.layanan.kategori] ?? { color: G, bg: "#e8f5e9" };
                  return (
                    <tr key={c.layanan.id} style={{ background: i % 2 === 0 ? "#fff" : "#fafafa" }}>
                      <td style={tdS}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <div style={{ width: 28, height: 28, borderRadius: 7, background: cfg.bg, display: "flex", alignItems: "center", justifyContent: "center", color: cfg.color, flexShrink: 0 }}>
                            <LayananIcon nama={c.layanan.nama} kategori={c.layanan.kategori} size={13} />
                          </div>
                          {c.layanan.nama}
                        </div>
                      </td>
                      <td style={tdS}><span style={{ fontSize: 11, color: cfg.color, background: cfg.bg, borderRadius: 20, padding: "2px 9px" }}>{c.layanan.kategori || "Layanan"}</span></td>
                      <td style={{ ...tdS, textAlign: "center" }}>×{c.qty}</td>
                      <td style={{ ...tdS, textAlign: "right", color: "#888" }}>{c.layanan.harga === 0 ? "Dikonfirmasi" : fmt(c.layanan.harga)}</td>
                      <td style={{ ...tdS, textAlign: "right", color: G, fontWeight: 500 }}>{c.layanan.harga === 0 ? "–" : fmt(c.layanan.harga * c.qty)}</td>
                    </tr>
                  );
                })}
                <tr style={{ borderTop: `2px solid ${G}`, background: "#f0faf2" }}>
                  <td colSpan={4} style={{ padding: "10px 14px", textAlign: "right", fontSize: 13, color: "#555" }}>Subtotal Layanan</td>
                  <td style={{ padding: "10px 14px", textAlign: "right", color: G, fontWeight: 700, fontSize: 14 }}>{fmt(totalL)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Obat detail */}
      {data.cart.length > 0 && (
        <div style={{ ...cardBase, padding: 0, overflow: "hidden" }}>
          <SectionHeader icon={<Pill style={{ width: 14, height: 14, color: G }} />} title="Obat & Vitamin"
            badge={<span style={{ fontSize: 11, color: "#c62828", background: "#ffebee", borderRadius: 20, padding: "2px 8px" }}>{data.cart.length} obat</span>} />
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead><tr>
                <th style={thS}>Nama Obat</th>
                <th style={thS}>Satuan</th>
                <th style={{ ...thS, textAlign: "center" }}>Qty</th>
                <th style={{ ...thS, textAlign: "right" }}>Harga Satuan</th>
                <th style={{ ...thS, textAlign: "right" }}>Subtotal</th>
              </tr></thead>
              <tbody>
                {data.cart.map((c, i) => {
                  const cfg = KAT_OBAT[c.obat.kategori] ?? { color: "#37474f", bg: "#eceff1" };
                  return (
                    <tr key={c.obat.id} style={{ background: i % 2 === 0 ? "#fff" : "#fafafa" }}>
                      <td style={tdS}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <div style={{ width: 28, height: 28, borderRadius: 7, background: cfg.bg, display: "flex", alignItems: "center", justifyContent: "center", color: cfg.color, flexShrink: 0 }}>
                            <ObatIcon kategori={c.obat.kategori} size={13} />
                          </div>
                          {c.obat.nama}
                        </div>
                      </td>
                      <td style={{ ...tdS, fontSize: 12, color: "#888" }}>{c.obat.satuan || "-"}</td>
                      <td style={{ ...tdS, textAlign: "center" }}>×{c.qty}</td>
                      <td style={{ ...tdS, textAlign: "right", color: "#888" }}>{fmt(c.obat.harga)}</td>
                      <td style={{ ...tdS, textAlign: "right", color: G, fontWeight: 500 }}>{fmt(c.obat.harga * c.qty)}</td>
                    </tr>
                  );
                })}
                <tr style={{ borderTop: `2px solid ${G}`, background: "#f0faf2" }}>
                  <td colSpan={4} style={{ padding: "10px 14px", textAlign: "right", fontSize: 13, color: "#555" }}>Subtotal Obat</td>
                  <td style={{ padding: "10px 14px", textAlign: "right", color: G, fontWeight: 700, fontSize: 14 }}>{fmt(totalO)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Catatan + Total */}
      <div style={{ display: "grid", gridTemplateColumns: data.catatan ? "1fr 1fr" : "1fr", gap: 16, marginBottom: 32 }}>
        {data.catatan && (
          <div style={{ ...cardBase, marginBottom: 0, padding: 0, overflow: "hidden" }}>
            <SectionHeader icon={<FileText style={{ width: 14, height: 14, color: G }} />} title="Catatan Dokter" />
            <div style={{ padding: "14px 16px", fontSize: 13, color: "#333", lineHeight: 1.8, whiteSpace: "pre-line" }}>{data.catatan}</div>
          </div>
        )}
        <div style={{ ...cardBase, marginBottom: 0, padding: 0, overflow: "hidden" }}>
          <SectionHeader icon={<Receipt style={{ width: 14, height: 14, color: G }} />} title="Rincian Total Biaya" />
          <div style={{ padding: 16 }}>
            {data.cartLayanan.length > 0 && (
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 12px", background: "#f0faf2", borderRadius: 8, marginBottom: 8 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: "#e3f2fd", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Stethoscope style={{ width: 15, height: 15, color: "#1565c0" }} />
                  </div>
                  <div>
                    <div style={{ fontSize: 13, color: "#333" }}>Biaya Layanan</div>
                    <div style={{ fontSize: 11, color: "#aaa" }}>{data.cartLayanan.length} item</div>
                  </div>
                </div>
                <span style={{ fontSize: 13, color: G, fontWeight: 600 }}>{fmt(totalL)}</span>
              </div>
            )}
            {data.cart.length > 0 && (
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 12px", background: "#fff8f8", borderRadius: 8, marginBottom: 8 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: "#ffebee", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Pill style={{ width: 15, height: 15, color: "#c62828" }} />
                  </div>
                  <div>
                    <div style={{ fontSize: 13, color: "#333" }}>Biaya Obat</div>
                    <div style={{ fontSize: 11, color: "#aaa" }}>{data.cart.length} obat</div>
                  </div>
                </div>
                <span style={{ fontSize: 13, color: "#c62828", fontWeight: 600 }}>{fmt(totalO)}</span>
              </div>
            )}
            <div style={{ marginTop: 10, padding: "14px 16px", background: `linear-gradient(135deg, ${G}, #1b5e20)`, borderRadius: 10, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 13, color: "rgba(255,255,255,0.85)", fontWeight: 500 }}>Grand Total</span>
              <span style={{ fontSize: 18, color: "#fff", fontWeight: 700 }}>{fmt(data.grandTotal)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Step indicator ────────────────────────────────────────────────────── */
function StepBar({ step }: { step: 1 | 2 }) {
  return (
    <div style={{ display: "flex", alignItems: "center", marginBottom: 20 }}>
      {[{ n: 1, label: "Data Pasien" }, { n: 2, label: "Layanan & Resep" }].map((s, i) => {
        const done = s.n < step, active = s.n === step;
        return (
          <div key={s.n} style={{ display: "flex", alignItems: "center", flex: i < 1 ? 1 : "none" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 26, height: 26, borderRadius: "50%", background: done || active ? G : "#e0e0e0", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, flexShrink: 0 }}>
                {done ? <CheckCircle2 style={{ width: 14, height: 14 }} /> : s.n}
              </div>
              <span style={{ fontSize: 12, color: active ? G : done ? "#555" : "#bbb", whiteSpace: "nowrap" }}>{s.label}</span>
            </div>
            {i < 1 && <div style={{ flex: 1, height: 2, background: done ? G : "#e0e0e0", margin: "0 10px", minWidth: 40 }} />}
          </div>
        );
      })}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   Main page
══════════════════════════════════════════════════════════════════════════ */
export default function PemeriksaanPage() {
  type PatientData = { pemilik: PemilikData; hewan: HewanData };

  const [step,          setStep]          = useState<1 | 2>(1);
  const [patient,       setPatient]       = useState<PatientData | null>(null);
  const [activeResepId, setActiveResepId] = useState<number | null>(null);

  function handleKonfirmasi(entry: Omit<ResepTersimpan, "id">) {
    setActiveResepId(entry.idResep);
    setStep(1);
    setPatient(null);
  }

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden", fontFamily: "'Inter', sans-serif" }}>
      <Sidebar activePage="pemeriksaan" />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "auto", background: "#f5f7f5" }}>
        <Header title="Pemeriksaan" subtitle="Pilih pasien, tentukan layanan dan obat, lalu simpan resep" />
        <div style={{ padding: "22px 24px" }}>
          {activeResepId ? (
            <DetailTersimpan
              idResep={activeResepId}
              onBaru={() => setActiveResepId(null)}
            />
          ) : (
            <>
              <StepBar step={step} />
              {step === 1 && (
                <StepPasien
                  onNext={d => { setPatient(d); setStep(2); }}
                  onLihatDetail={id => setActiveResepId(id)}
                />
              )}
              {step === 2 && patient && (
                <StepTindakan
                  {...patient}
                  onBack={() => setStep(1)}
                  onKonfirmasi={handleKonfirmasi}
                />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}