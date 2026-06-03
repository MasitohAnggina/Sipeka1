"use client";

import { useEffect, useState, useRef, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar_dokter";
import Header from "@/components/Header";

// ── Icons ─────────────────────────────────────────────────────────────────────

function Icon({ name, size = 16, color = "currentColor" }: { name: string; size?: number; color?: string }) {
  const s = { width: size, height: size, display: "inline-block", verticalAlign: "middle", flexShrink: 0 } as React.CSSProperties;
  const icons: Record<string, React.ReactNode> = {
    clipboard:   (<svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={s}><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1"/><line x1="9" y1="12" x2="15" y2="12"/><line x1="9" y1="16" x2="13" y2="16"/></svg>),
    plus:        (<svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={s}><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>),
    trash:       (<svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={s}><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>),
    x:           (<svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={s}><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>),
    save:        (<svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={s}><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>),
    paw:         (<svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={s}><circle cx="11" cy="4" r="2"/><circle cx="18" cy="8" r="2"/><circle cx="4" cy="8" r="2"/><circle cx="6.5" cy="15.5" r="2"/><path d="M17 15.5c0 2.5-2 5-5.5 5.5-3.5.5-5.5-2-5.5-5.5"/></svg>),
    stethoscope: (<svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={s}><path d="M4.8 2.3A.3.3 0 1 0 5 2H4a2 2 0 0 0-2 2v5a6 6 0 0 0 6 6 6 6 0 0 0 6-6V4a2 2 0 0 0-2-2h-1a.2.2 0 1 0 .3.3"/><path d="M8 15v1a6 6 0 0 0 6 6h0a6 6 0 0 0 6-6v-4"/><circle cx="20" cy="10" r="2"/></svg>),
    search:      (<svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={s}><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>),
    chevDown:    (<svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={s}><polyline points="6 9 12 15 18 9"/></svg>),
    arrowLeft:   (<svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={s}><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>),
    user:        (<svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={s}><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>),
    eye:         (<svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={s}><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>),
    check:       (<svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={s}><polyline points="20 6 9 17 4 12"/></svg>),
    calendar:    (<svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={s}><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>),
    clock:       (<svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={s}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>),
    note:        (<svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={s}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="9" y1="13" x2="15" y2="13"/><line x1="9" y1="17" x2="13" y2="17"/></svg>),
  };
  return <>{icons[name] ?? null}</>;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const G           = "#2e7d32";
const API         = "http://127.0.0.1:8000/api";
const STORAGE_URL = "http://127.0.0.1:8000/storage/";

// ── Types ─────────────────────────────────────────────────────────────────────

interface HewanRow {
  id_hewan:      number;
  id_booking:    number | null;   // ← tambah field ini agar tidak perlu cast
  nama_hewan:    string;
  jenis:         string;
  ras:           string;
  umur:          number | null;
  foto:          string | null;
  nama_pemilik:  string;
  rekam_medis:   RekamMedisItem[];
  sudah_dicatat: boolean;         // ← flag dari backend
}

interface RekamMedisItem {
  id_rekam_medis:   number;
  tanggal:          string;
  diagnosa:         string;
  diagnosa_lengkap: string;
  catatan_dokter:   string;
  nama_dokter:      string;
}

type ViewMode = "table" | "form" | "detail";

// ── Shared Styles ─────────────────────────────────────────────────────────────

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "10px 12px", borderRadius: 8,
  border: "1.5px solid #e0e0e0", fontSize: 14,
  fontFamily: "inherit", outline: "none",
  background: "#fff", color: "#333", boxSizing: "border-box",
};

const readonlyInputStyle: React.CSSProperties = {
  ...inputStyle, background: "#fafafa", color: "#666", cursor: "default",
};

const labelStyle: React.CSSProperties = {
  fontWeight: 600, fontSize: 13, display: "block", marginBottom: 6, color: "#555",
};

const cardStyle: React.CSSProperties = {
  background: "#fff", borderRadius: 14, border: "1.5px solid #e0e0e0",
  padding: "18px 20px", boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
};

const sectionTitleStyle: React.CSSProperties = {
  fontWeight: 700, fontSize: 14, color: G,
  paddingBottom: 10, borderBottom: "1.5px solid #e8f5e9",
  marginBottom: 14, display: "flex", alignItems: "center", gap: 6,
};

const DIAGNOSA_OPTIONS = [
  "Gastroenteritis", "Infeksi Saluran Kemih", "Infeksi Kulit",
  "Dermatitis", "Otitis", "Conjunctivitis", "Fraktur", "Anemia",
  "Kurang Nutrisi", "Parasit Internal", "Parasit Eksternal", "Flu / ISPA",
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function normalizeFotoUrl(foto: string | null): string | null {
  if (!foto) return null;
  if (foto.startsWith("http://") || foto.startsWith("https://")) return foto;
  return STORAGE_URL + foto.replace(/^\//, "");
}

const speciesEmoji: Record<string, string> = {
  Kucing: "🐱", Anjing: "🐕", Kelinci: "🐇", Burung: "🐦", Hamster: "🐹",
};

// ── Sub-components ────────────────────────────────────────────────────────────

function FotoHewan({ foto, nama, jenis, size = 40 }: {
  foto: string | null; nama: string; jenis: string; size?: number;
}) {
  const [imgError, setImgError] = useState(false);
  const fotoUrl = normalizeFotoUrl(foto);
  const emoji   = speciesEmoji[jenis] ?? "🐾";

  if (fotoUrl && !imgError) {
    return (
      <img
        src={fotoUrl}
        alt={nama}
        style={{ width: size, height: size, objectFit: "cover", borderRadius: 10, display: "block", flexShrink: 0 }}
        onError={() => setImgError(true)}
      />
    );
  }
  return (
    <div style={{ width: size, height: size, borderRadius: 10, background: "#e8f5e9", display: "flex", alignItems: "center", justifyContent: "center", fontSize: size * 0.48, flexShrink: 0 }}>
      {emoji}
    </div>
  );
}

function Badge({ children, blue, orange }: { children: React.ReactNode; blue?: boolean; orange?: boolean }) {
  const bg     = blue ? "#e3f2fd" : orange ? "#fff8e1" : "#e8f5e9";
  const color  = blue ? "#1565c0" : orange ? "#e65100" : G;
  const border = blue ? "#90caf9" : orange ? "#ffcc80" : "#a5d6a7";
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "3px 9px", borderRadius: 20, fontSize: 11, fontWeight: 600, background: bg, color, border: `1.5px solid ${border}` }}>
      {children}
    </span>
  );
}

function HoverBtn({ onClick, children, variant = "green" }: {
  onClick?: () => void; children: React.ReactNode; variant?: "green" | "blue" | "outline" | "danger";
}) {
  const [hov, setHov] = useState(false);
  const styles: Record<string, React.CSSProperties> = {
    green:   { border: `1.5px solid ${G}`,    background: hov ? G          : "#fff", color: hov ? "#fff"    : G       },
    blue:    { border: "1.5px solid #e0e0e0",  background: hov ? "#e3f2fd"  : "#fff", color: hov ? "#1565c0" : "#555"  },
    outline: { border: `1.5px solid ${G}`,    background: hov ? "#e8f5e9"  : "#fff", color: G                         },
    danger:  { border: "1.5px solid #e53935", background: hov ? "#ffebee"  : "#fff", color: "#e53935"                  },
  };
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "7px 12px", borderRadius: 8, fontWeight: 700, fontSize: 12, cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap", transition: "all .15s", ...styles[variant] }}
    >
      {children}
    </button>
  );
}

function HewanInfoBar({ namaHewan, jenisHewan, rasHewan, namaPemilik, foto, label }: {
  namaHewan: string; jenisHewan: string; rasHewan: string;
  namaPemilik: string; foto: string | null; label: string;
}) {
  return (
    <div style={{ background: "#fff", borderRadius: 14, border: "1.5px solid #e0e0e0", padding: "16px 20px", margin: "18px 0", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <FotoHewan foto={foto} nama={namaHewan} jenis={jenisHewan} size={48} />
        <div>
          <div style={{ fontWeight: 700, fontSize: 15 }}>{namaHewan}</div>
          <div style={{ fontSize: 12, color: "#666", marginTop: 2 }}>{jenisHewan} · {rasHewan}</div>
          <div style={{ display: "flex", gap: 6, marginTop: 5, flexWrap: "wrap" }}>
            <Badge blue><Icon name="user" size={10} color="#1565c0" /> {namaPemilik}</Badge>
          </div>
        </div>
      </div>
      <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 14px", borderRadius: 20, background: "#e8f5e9", color: G, border: "1.5px solid #a5d6a7", fontSize: 13, fontWeight: 700 }}>
        <Icon name="clipboard" size={13} color={G} /> {label}
      </div>
    </div>
  );
}

// ── TABLE VIEW ────────────────────────────────────────────────────────────────

function TableView({ hewanList, loading, onCatat, onDetail }: {
  hewanList: HewanRow[];
  loading:   boolean;
  onCatat:   (h: HewanRow) => void;
  onDetail:  (h: HewanRow, rm: RekamMedisItem) => void;
}) {
  const [search, setSearch] = useState("");

  const filtered = hewanList.filter(h =>
    h.nama_pemilik.toLowerCase().includes(search.toLowerCase()) ||
    h.nama_hewan.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ padding: "24px 28px" }}>
      <div style={{ marginBottom: 20 }}>
        <div style={{ position: "relative", maxWidth: 400 }}>
          <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}>
            <Icon name="search" size={15} color="#aaa" />
          </span>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Cari nama pemilik atau hewan..."
            style={{ ...inputStyle, paddingLeft: 38 }}
            suppressHydrationWarning
          />
        </div>
      </div>

      <div style={{ background: "#fff", border: "1.5px solid #e0e0e0", borderRadius: 14, overflow: "hidden", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: "center", color: "#888" }}>Memuat data...</div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: G }}>
                  {["Hewan", "Jenis / Ras", "Pemilik", "Rekam Medis", "Aksi"].map(h => (
                    <th key={h} style={{ padding: "12px 16px", fontSize: 13, fontWeight: 700, color: "#fff", textAlign: "left", whiteSpace: "nowrap", fontFamily: "inherit" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ padding: "48px", textAlign: "center", color: "#999", fontSize: 14 }}>
                      <div style={{ fontSize: 32, marginBottom: 8 }}>🔍</div>
                      {search ? `Tidak ditemukan hasil untuk "${search}"` : "Belum ada data hewan"}
                    </td>
                  </tr>
                ) : filtered.map(h => {
                  const latest = h.rekam_medis[0] ?? null;
                  const total  = h.rekam_medis.length;
                  return (
                    <tr
                      key={h.id_hewan}
                      style={{ borderBottom: "1px solid #f0f0f0" }}
                      onMouseEnter={e => (e.currentTarget.style.background = "#f9f9f9")}
                      onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                    >
                      {/* Hewan */}
                      <td style={{ padding: "12px 16px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <FotoHewan foto={h.foto} nama={h.nama_hewan} jenis={h.jenis} size={40} />
                          <div style={{ fontWeight: 700, fontSize: 14 }}>{h.nama_hewan}</div>
                        </div>
                      </td>

                      {/* Jenis / Ras */}
                      <td style={{ padding: "12px 16px", fontSize: 13, color: "#555" }}>
                        <div>{h.jenis}</div>
                        <div style={{ fontSize: 12, color: "#aaa" }}>{h.ras}</div>
                      </td>

                      {/* Pemilik */}
                      <td style={{ padding: "12px 16px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                          <div style={{ width: 28, height: 28, borderRadius: "50%", background: "#e8f5e9", border: "1.5px solid #a5d6a7", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                            <Icon name="user" size={13} color={G} />
                          </div>
                          <span style={{ fontSize: 13, fontWeight: 600 }}>{h.nama_pemilik}</span>
                        </div>
                      </td>

                      {/* Rekam Medis */}
                      <td style={{ padding: "12px 16px" }}>
                        {total > 0 ? (
                          <div>
                            <Badge>{total} Rekam Medis</Badge>
                            <div style={{ fontSize: 11, color: "#888", marginTop: 4 }}>Terakhir: {latest!.tanggal}</div>
                          </div>
                        ) : (
                          <span style={{ fontSize: 12, color: "#bbb", fontStyle: "italic" }}>Belum ada</span>
                        )}
                      </td>

                      {/* Aksi */}
                      <td style={{ padding: "12px 16px" }}>
                        <div style={{ display: "flex", gap: 8 }}>
                          {h.sudah_dicatat ? (
                            <div style={{
                              display: "inline-flex", alignItems: "center", gap: 5,
                              padding: "7px 12px", borderRadius: 8,
                              border: "1.5px solid #e0e0e0",
                              background: "#f5f5f5", color: "#bbb",
                              fontSize: 12, whiteSpace: "nowrap",
                              cursor: "not-allowed",
                            }}>
                              <Icon name="check" size={12} color="#bbb" /> Tercatat
                            </div>
                          ) : (
                            <HoverBtn onClick={() => onCatat(h)} variant="green">
                              <Icon name="clipboard" size={12} color="currentColor" /> Catat
                            </HoverBtn>
                          )}
                          {latest && (
                            <HoverBtn onClick={() => onDetail(h, latest)} variant="blue">
                              <Icon name="eye" size={12} color="currentColor" /> Detail
                            </HoverBtn>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// ── FORM VIEW ─────────────────────────────────────────────────────────────────

function FormView({ hewan, idBooking, onBack, onSaved }: {
  hewan:     HewanRow | null;
  idBooking: string | null;
  onBack:    () => void;
  onSaved:   () => void;
}) {
  const [tanggal,          setTanggal]         = useState(new Date().toISOString().split("T")[0]);
  const [waktu,            setWaktu]           = useState(new Date().toTimeString().slice(0, 5));
  const [diagnosa,         setDiagnosa]        = useState("");
  const [diagnosaLengkap,  setDiagnosaLengkap] = useState("");
  const [catatanDokter,    setCatatanDokter]   = useState("");
  const [showDiagnosaDD,   setShowDiagnosaDD]  = useState(false);
  const [tindakan,         setTindakan]        = useState("");
  const [saving,           setSaving]          = useState(false);
  const [error,            setError]           = useState("");
  const [showCancelModal,  setShowCancelModal] = useState(false);

  const token       = typeof window !== "undefined" ? sessionStorage.getItem("token") : null;
  const diagnosaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (diagnosaRef.current && !diagnosaRef.current.contains(e.target as Node)) {
        setShowDiagnosaDD(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const hasChanges = diagnosa || diagnosaLengkap || catatanDokter || tindakan;

  const handleBatal = () => {
    if (hasChanges) {
      setShowCancelModal(true);
    } else {
      onBack();
    }
  };

  const handleSave = async () => {
    if (!diagnosa)  { setError("Diagnosa wajib diisi!"); return; }
    if (!idBooking) { setError("ID Booking tidak ditemukan!"); return; }

    setSaving(true);
    setError("");
    try {
      const res = await fetch(`${API}/dokter/rekam-medis`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          id_booking:       idBooking,
          diagnosa,
          diagnosa_lengkap: diagnosaLengkap,
          catatan_dokter:   catatanDokter,
          tindakan,
          tanggal,
        }),
      });
      const data = await res.json();
      if (data.success) {
        onSaved();
      } else {
        setError(data.message ?? "Gagal menyimpan rekam medis");
      }
    } catch {
      setError("Terjadi kesalahan, coba lagi");
    } finally {
      setSaving(false);
    }
  };

  const namaHewan   = hewan?.nama_hewan   ?? "-";
  const jenisHewan  = hewan?.jenis        ?? "-";
  const rasHewan    = hewan?.ras          ?? "-";
  const namaPemilik = hewan?.nama_pemilik ?? "-";

  return (
    <div style={{ padding: "0 28px 28px" }}>
      <HewanInfoBar
        namaHewan={namaHewan} jenisHewan={jenisHewan}
        rasHewan={rasHewan} namaPemilik={namaPemilik}
        foto={hewan?.foto ?? null}
        label="Catat Rekam Medis"
      />

      {error && (
        <div style={{ background: "#ffebee", border: "1px solid #ffcdd2", borderRadius: 8, padding: "10px 14px", marginBottom: 16, fontSize: 13, color: "#c62828" }}>
          {error}
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
        {/* LEFT */}
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div style={cardStyle}>
            <div style={sectionTitleStyle}><Icon name="clipboard" size={15} color={G} /> Informasi Pemeriksaan</div>
            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>Nama Hewan / Pasien</label>
              <input style={readonlyInputStyle} value={`${namaHewan} (${jenisHewan} - ${rasHewan})`} readOnly />
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>Nama Pemilik</label>
              <input style={readonlyInputStyle} value={namaPemilik} readOnly />
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>Tanggal Pemeriksaan</label>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <input type="date" value={tanggal} onChange={e => setTanggal(e.target.value)} style={inputStyle} />
                <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                  <input type="time" value={waktu} onChange={e => setWaktu(e.target.value)} style={{ ...inputStyle, paddingRight: 42 }} />
                  <span style={{ position: "absolute", right: 10, fontSize: 11, color: "#666", pointerEvents: "none" }}>WIB</span>
                </div>
              </div>
            </div>
          </div>

          <div style={cardStyle}>
            <div style={sectionTitleStyle}><Icon name="stethoscope" size={15} color={G} /> Tindakan Medis</div>
            <label style={labelStyle}>Penanganan &amp; Obat</label>
            <textarea
              value={tindakan}
              onChange={e => setTindakan(e.target.value)}
              placeholder="Tuliskan tindakan medis dan resep obat yang diberikan..."
              rows={6}
              style={{ ...inputStyle, resize: "vertical", minHeight: 120, lineHeight: 1.6 }}
            />
          </div>
        </div>

        {/* RIGHT */}
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div style={cardStyle}>
            <div style={sectionTitleStyle}><Icon name="search" size={15} color={G} /> Diagnosa</div>
            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>Diagnosa Utama <span style={{ color: "#e53935" }}>*</span></label>
              <div ref={diagnosaRef} style={{ position: "relative" }}>
                <button
                  onClick={() => setShowDiagnosaDD(v => !v)}
                  style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 12px", borderRadius: 8, border: `1.5px solid ${showDiagnosaDD ? G : "#e0e0e0"}`, background: showDiagnosaDD ? "#e8f5e9" : "#fff", color: diagnosa ? "#333" : "#aaa", fontSize: 14, fontWeight: diagnosa ? 600 : 400, cursor: "pointer", fontFamily: "inherit", transition: "all .15s" }}
                >
                  <span>{diagnosa || "-- Pilih Diagnosa --"}</span>
                  <span style={{ transform: showDiagnosaDD ? "rotate(180deg)" : "rotate(0deg)", transition: "transform .2s", flexShrink: 0 }}>
                    <Icon name="chevDown" size={14} color="#888" />
                  </span>
                </button>
                {showDiagnosaDD && (
                  <div style={{ position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, background: "#fff", border: "1.5px solid #e0e0e0", borderRadius: 10, boxShadow: "0 6px 20px rgba(0,0,0,0.10)", zIndex: 100, overflow: "hidden", maxHeight: 260, overflowY: "auto" }}>
                    <div
                      onClick={() => { setDiagnosa(""); setShowDiagnosaDD(false); }}
                      style={{ padding: "10px 14px", fontSize: 13, cursor: "pointer", color: "#aaa", borderBottom: "1px solid #f0f0f0" }}
                    >
                      -- Pilih Diagnosa --
                    </div>
                    {DIAGNOSA_OPTIONS.map(d => (
                      <div
                        key={d}
                        onClick={() => { setDiagnosa(d); setShowDiagnosaDD(false); }}
                        style={{ padding: "10px 14px", fontSize: 14, cursor: "pointer", borderTop: "1px solid #f5f5f5", background: diagnosa === d ? G : "transparent", color: diagnosa === d ? "#fff" : "#333", fontWeight: diagnosa === d ? 700 : 500, transition: "background .12s" }}
                        onMouseEnter={e => { if (diagnosa !== d) (e.currentTarget as HTMLDivElement).style.background = "#f0faf0"; }}
                        onMouseLeave={e => { if (diagnosa !== d) (e.currentTarget as HTMLDivElement).style.background = "transparent"; }}
                      >
                        {d}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div>
              <label style={labelStyle}>Deskripsi Diagnosa</label>
              <textarea
                value={diagnosaLengkap}
                onChange={e => setDiagnosaLengkap(e.target.value)}
                placeholder="Deskripsikan diagnosa secara lengkap..."
                rows={4}
                style={{ ...inputStyle, resize: "vertical", minHeight: 90, lineHeight: 1.6 }}
              />
            </div>
          </div>

          <div style={cardStyle}>
            <div style={sectionTitleStyle}><Icon name="note" size={15} color={G} /> Catatan Dokter</div>
            <textarea
              value={catatanDokter}
              onChange={e => setCatatanDokter(e.target.value)}
              placeholder="Tambahkan catatan tambahan dari dokter..."
              rows={5}
              style={{ ...inputStyle, resize: "vertical", minHeight: 100, lineHeight: 1.6 }}
            />
          </div>

          {/* Action Buttons */}
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
            <button
              onClick={handleBatal}
              disabled={saving}
              style={{
                padding: "11px 24px", borderRadius: 8,
                border: "1.5px solid #e0e0e0",
                background: "#fff", color: "#666",
                fontWeight: 700, fontSize: 14,
                cursor: saving ? "not-allowed" : "pointer",
                display: "flex", alignItems: "center", gap: 6,
                fontFamily: "inherit", transition: "all .15s",
                opacity: saving ? 0.5 : 1,
              }}
              onMouseEnter={e => { if (!saving) { (e.currentTarget as HTMLButtonElement).style.background = "#f5f5f5"; (e.currentTarget as HTMLButtonElement).style.borderColor = "#ccc"; } }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "#fff"; (e.currentTarget as HTMLButtonElement).style.borderColor = "#e0e0e0"; }}
            >
              <Icon name="x" size={15} color="currentColor" /> Batal
            </button>

            <button
              onClick={handleSave}
              disabled={saving}
              style={{
                padding: "11px 28px", borderRadius: 8, border: "none",
                background: saving ? "#a5d6a7" : G,
                color: "#fff", fontWeight: 700, fontSize: 14,
                cursor: saving ? "not-allowed" : "pointer",
                display: "flex", alignItems: "center", gap: 6,
                fontFamily: "inherit", transition: "background .15s",
              }}
            >
              <Icon name="save" size={15} color="#fff" /> {saving ? "Menyimpan..." : "Simpan Rekam Medis"}
            </button>
          </div>
        </div>
      </div>

      {/* Modal Konfirmasi Batal */}
      {showCancelModal && (
        <div
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 999 }}
          onClick={() => setShowCancelModal(false)}
        >
          <div
            style={{ background: "#fff", borderRadius: 16, padding: "28px 32px", maxWidth: 420, width: "90%", boxShadow: "0 10px 40px rgba(0,0,0,0.18)", border: "1.5px solid #e0e0e0" }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
              <div style={{ width: 42, height: 42, borderRadius: "50%", background: "#fff8e1", border: "1.5px solid #ffcc80", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="#e65100" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 20, height: 20 }}>
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                  <line x1="12" y1="9" x2="12" y2="13"/>
                  <line x1="12" y1="17" x2="12.01" y2="17"/>
                </svg>
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 15, color: "#1a1a1a" }}>Batalkan Pengisian?</div>
                <div style={{ fontSize: 12, color: "#888", marginTop: 2 }}>Data yang sudah diisi akan hilang</div>
              </div>
            </div>

            <p style={{ fontSize: 13, color: "#555", lineHeight: 1.6, margin: "0 0 24px" }}>
              Anda sudah mengisi sebagian data rekam medis. Jika dibatalkan, semua perubahan akan hilang dan tidak dapat dikembalikan.
            </p>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
              <button
                onClick={() => setShowCancelModal(false)}
                style={{ padding: "9px 20px", borderRadius: 8, border: "1.5px solid #e0e0e0", background: "#fff", color: "#555", fontWeight: 600, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}
                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = "#f5f5f5"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "#fff"; }}
              >
                Lanjutkan Mengisi
              </button>
              <button
                onClick={onBack}
                style={{ padding: "9px 20px", borderRadius: 8, border: "1.5px solid #e53935", background: "#e53935", color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}
                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = "#c62828"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "#e53935"; }}
              >
                Ya, Batalkan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── DETAIL VIEW ───────────────────────────────────────────────────────────────

function DetailView({ hewan, record, onBack }: {
  hewan:  HewanRow;
  record: RekamMedisItem;
  onBack: () => void;
}) {
  const tanggalFmt = new Date(record.tanggal + "T00:00:00").toLocaleDateString("id-ID", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });

  function InfoRow({ icon, label, value }: { icon: string; label: string; value: string }) {
    return (
      <div style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "10px 0", borderBottom: "1px solid #f0f0f0" }}>
        <div style={{ width: 32, height: 32, borderRadius: 8, background: "#e8f5e9", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <Icon name={icon} size={15} color={G} />
        </div>
        <div>
          <div style={{ fontSize: 11, color: "#888", fontWeight: 600, marginBottom: 2 }}>{label}</div>
          <div style={{ fontSize: 14, fontWeight: 600, color: "#1a1a1a" }}>{value || "—"}</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: "0 28px 28px" }}>
      <HewanInfoBar
        namaHewan={hewan.nama_hewan} jenisHewan={hewan.jenis}
        rasHewan={hewan.ras} namaPemilik={hewan.nama_pemilik}
        foto={hewan.foto}
        label="Detail Rekam Medis"
      />

      <div style={{ display: "flex", alignItems: "center", gap: 10, background: "#e8f5e9", border: "1.5px solid #a5d6a7", borderRadius: 10, padding: "12px 16px", marginBottom: 18 }}>
        <div style={{ width: 32, height: 32, borderRadius: "50%", background: G, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <Icon name="check" size={16} color="#fff" />
        </div>
        <div>
          <div style={{ fontWeight: 700, fontSize: 13, color: G }}>Rekam Medis Tersimpan</div>
          <div style={{ fontSize: 12, color: "#555", marginTop: 1 }}>Dicatat pada {record.tanggal} oleh {record.nama_dokter}</div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div style={cardStyle}>
            <div style={sectionTitleStyle}><Icon name="clipboard" size={15} color={G} /> Informasi Pemeriksaan</div>
            <InfoRow icon="paw"         label="Pasien"           value={`${hewan.nama_hewan} (${hewan.jenis})`} />
            <InfoRow icon="user"        label="Pemilik"          value={hewan.nama_pemilik} />
            <InfoRow icon="calendar"    label="Tanggal"          value={tanggalFmt} />
            <InfoRow icon="stethoscope" label="Dokter Pemeriksa" value={record.nama_dokter} />
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div style={cardStyle}>
            <div style={sectionTitleStyle}><Icon name="search" size={15} color={G} /> Diagnosa</div>
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 11, color: "#888", fontWeight: 600, marginBottom: 8 }}>DIAGNOSA UTAMA</div>
              {record.diagnosa
                ? <span style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "5px 16px", borderRadius: 20, background: G, color: "#fff", fontSize: 13, fontWeight: 700 }}>{record.diagnosa}</span>
                : <span style={{ fontSize: 13, color: "#aaa", fontStyle: "italic" }}>Tidak diisi</span>}
            </div>
            <div>
              <div style={{ fontSize: 11, color: "#888", fontWeight: 600, marginBottom: 8 }}>DESKRIPSI DIAGNOSA</div>
              <div style={{ background: "#f9f9f9", border: "1.5px solid #e0e0e0", borderRadius: 8, padding: "12px 14px", fontSize: 13, color: record.diagnosa_lengkap ? "#333" : "#aaa", lineHeight: 1.6, fontStyle: record.diagnosa_lengkap ? "normal" : "italic" }}>
                {record.diagnosa_lengkap || "Tidak diisi"}
              </div>
            </div>
          </div>

          <div style={cardStyle}>
            <div style={sectionTitleStyle}><Icon name="note" size={15} color={G} /> Catatan Dokter</div>
            <div style={{ background: "#f9f9f9", border: "1.5px solid #e0e0e0", borderRadius: 8, padding: "12px 14px", fontSize: 13, color: record.catatan_dokter ? "#333" : "#aaa", lineHeight: 1.6, fontStyle: record.catatan_dokter ? "normal" : "italic" }}>
              {record.catatan_dokter || "Tidak ada catatan tambahan"}
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <button
              onClick={onBack}
              style={{ padding: "10px 26px", borderRadius: 8, border: `1.5px solid ${G}`, background: "#fff", color: G, fontWeight: 700, fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", gap: 6, fontFamily: "inherit" }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = "#e8f5e9"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "#fff"; }}
            >
              <Icon name="arrowLeft" size={15} color={G} /> Kembali ke Daftar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main Page (inner) ─────────────────────────────────────────────────────────

function RekamMedisInner() {
  const searchParams = useSearchParams();
  const router       = useRouter();

  const idBookingParam   = searchParams.get("id_booking");
  const namaHewanParam   = searchParams.get("nama_hewan");
  const jenisHewanParam  = searchParams.get("jenis_hewan");
  const rasHewanParam    = searchParams.get("ras_hewan");
  const namaPemilikParam = searchParams.get("nama_pemilik");
  const fotoParam        = searchParams.get("foto") ?? null;

  const [view,           setView]           = useState<ViewMode>(idBookingParam ? "form" : "table");
  const [hewanList,      setHewanList]      = useState<HewanRow[]>([]);
  const [activeHewan,    setActiveHewan]    = useState<HewanRow | null>(null);
  const [activeRecord,   setActiveRecord]   = useState<RekamMedisItem | null>(null);
  const [loading,        setLoading]        = useState(true);
  const [activeIdBooking, setActiveIdBooking] = useState<string | null>(idBookingParam);

  const token   = typeof window !== "undefined" ? sessionStorage.getItem("token") : null;
  const headers = { "Authorization": `Bearer ${token ?? ""}`, "Content-Type": "application/json" };

  const fetchHewan = () => {
    fetch(`${API}/dokter/rekam-medis`, { headers })
      .then(res => res.json())
      .then(data => {
        if (data.success) setHewanList(data.data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchHewan();
    if (idBookingParam && namaHewanParam) {
      // ← Perbaikan: sudah_dicatat dan id_booking ditambahkan agar sesuai HewanRow
      setActiveHewan({
        id_hewan:      0,
        id_booking:    idBookingParam ? Number(idBookingParam) : null,
        nama_hewan:    namaHewanParam   ?? "",
        jenis:         jenisHewanParam  ?? "",
        ras:           rasHewanParam    ?? "",
        umur:          null,
        foto:          fotoParam,
        nama_pemilik:  namaPemilikParam ?? "",
        rekam_medis:   [],
        sudah_dicatat: false,
      });
      setActiveIdBooking(idBookingParam);
      setView("form");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const subtitleMap: Record<ViewMode, string> = {
    table:  "Pilih hewan untuk dicatat atau lihat rekam medisnya",
    form:   `Mencatat rekam medis untuk ${activeHewan?.nama_hewan ?? ""}`,
    detail: `Detail rekam medis — ${activeHewan?.nama_hewan ?? ""}`,
  };

  const goBack = () => {
    setView("table");
    setActiveHewan(null);
    setActiveRecord(null);
    setActiveIdBooking(null);
    router.push("/dokter/catat_rekam_medis");
  };

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden" }}>
      <Sidebar activePage="rekam" />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "auto", background: "#f9f9f9" }}>
        <Header title="Rekam Medis" subtitle={subtitleMap[view]} />

        {view === "table" && (
          <TableView
            hewanList={hewanList}
            loading={loading}
            onCatat={h => {
              setActiveHewan(h);
              // ← Perbaikan: gunakan h.id_booking langsung, tidak perlu cast
              setActiveIdBooking(h.id_booking != null ? String(h.id_booking) : null);
              setView("form");
            }}
            onDetail={(h, rm) => { setActiveHewan(h); setActiveRecord(rm); setView("detail"); }}
          />
        )}

        {view === "form" && (
          <FormView
            hewan={activeHewan}
            idBooking={activeIdBooking}
            onBack={goBack}
            onSaved={() => { fetchHewan(); goBack(); }}
          />
        )}

        {view === "detail" && activeHewan && activeRecord && (
          <DetailView hewan={activeHewan} record={activeRecord} onBack={goBack} />
        )}
      </div>
    </div>
  );
}

// ── Main Export ───────────────────────────────────────────────────────────────

export default function RekamMedis() {
  return (
    <Suspense fallback={
      <div style={{ display: "flex", height: "100vh", alignItems: "center", justifyContent: "center" }}>
        <p style={{ color: "#888" }}>Memuat...</p>
      </div>
    }>
      <RekamMedisInner />
    </Suspense>
  );
}