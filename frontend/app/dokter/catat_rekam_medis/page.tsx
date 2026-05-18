"use client";

import { useEffect, useState } from "react";
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
    pill:        (<svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={s}><path d="M10.5 20.5 3.5 13.5a5 5 0 0 1 7.07-7.07l7 7a5 5 0 0 1-7.07 7.07z"/><line x1="8.5" y1="11.5" x2="13.5" y2="16.5"/></svg>),
    note:        (<svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={s}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="9" y1="13" x2="15" y2="13"/><line x1="9" y1="17" x2="13" y2="17"/></svg>),
  };
  return <>{icons[name] ?? null}</>;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const G = "#2e7d32";

// ── Types ─────────────────────────────────────────────────────────────────────

interface HewanRow {
  id: string; emoji: string; nama: string; spesies: string;
  umur: string; berat: string; pemilik: string; lastVisit: string;
}

interface Tindakan { id: number; penanganan: string; durasi: string; }

interface RekamMedisRecord {
  id: string; hewan: HewanRow; tanggal: string; waktu: string; dokter: string;
  diagnosa: string; diagnosaLengkap: string; catatanDokter: string;
  simpanPenyakit: boolean; simpanAlergi: boolean;
  tindakanList: Tindakan[]; createdAt: string;
}

type ViewMode = "table" | "form" | "detail";

// ── Data ──────────────────────────────────────────────────────────────────────

const HEWAN_LIST: HewanRow[] = [
  { id: "meng-meng", emoji: "🐱", nama: "Meng-Meng", spesies: "Kucing Persia",    umur: "2 Tahun", berat: "3 Kg",  pemilik: "Anggina",      lastVisit: "10 Apr 2026" },
  { id: "doggy",     emoji: "🐶", nama: "Doggy",     spesies: "Golden Retriever", umur: "3 Tahun", berat: "28 Kg", pemilik: "Budi Santoso",  lastVisit: "5 Apr 2026"  },
  { id: "kitty",     emoji: "🐱", nama: "Kitty",     spesies: "Maine Coon",        umur: "1 Tahun", berat: "5 Kg",  pemilik: "Citra Dewi",    lastVisit: "1 Apr 2026"  },
  { id: "rocky",     emoji: "🐶", nama: "Rocky",     spesies: "Shiba Inu",         umur: "2 Tahun", berat: "10 Kg", pemilik: "Deni Kurnia",   lastVisit: "28 Mar 2026" },
  { id: "coco",      emoji: "🐇", nama: "Coco",      spesies: "Kelinci Lop",       umur: "1 Tahun", berat: "2 Kg",  pemilik: "Eka Putri",     lastVisit: "20 Mar 2026" },
  { id: "lulu",      emoji: "🐱", nama: "Lulu",      spesies: "Kucing Anggora",    umur: "3 Tahun", berat: "4 Kg",  pemilik: "Reza Fauzi",    lastVisit: "15 Mar 2026" },
];

const SEED_RECORDS: RekamMedisRecord[] = [
  {
    id: "rm-001", hewan: HEWAN_LIST[0], tanggal: "2026-04-10", waktu: "09:00",
    dokter: "drh. Ali Haqqi", diagnosa: "Gastroenteritis",
    diagnosaLengkap: "Hewan mengalami gangguan pencernaan akut disertai mual dan diare ringan.",
    catatanDokter: "Berikan obat anti-mual dan jaga pola makan selama 5 hari.",
    simpanPenyakit: true, simpanAlergi: false,
    tindakanList: [{ id: 1, penanganan: "Metronidazole 2x sehari + probiotik", durasi: "5 Hari" }],
    createdAt: "10 Apr 2026, 09:00",
  },
  {
    id: "rm-002", hewan: HEWAN_LIST[1], tanggal: "2026-04-05", waktu: "11:00",
    dokter: "drh. Siti Aisyah", diagnosa: "Otitis",
    diagnosaLengkap: "Infeksi telinga bagian luar akibat bakteri. Telinga kemerahan dan berbau.",
    catatanDokter: "Bersihkan telinga setiap hari dengan larutan pembersih khusus.",
    simpanPenyakit: true, simpanAlergi: false,
    tindakanList: [{ id: 1, penanganan: "Tetes telinga antibiotik 2x sehari", durasi: "7 Hari" }],
    createdAt: "5 Apr 2026, 11:00",
  },
];

const DIAGNOSA_OPTIONS = [
  "Gastroenteritis", "Infeksi Saluran Kemih", "Infeksi Kulit",
  "Dermatitis", "Otitis", "Conjunctivitis", "Fraktur", "Anemia",
  "Kurang Nutrisi", "Parasit Internal", "Parasit Eksternal", "Flu / ISPA",
];

const DURASI_OPTIONS = ["1 Hari", "3 Hari", "5 Hari", "7 Hari", "10 Hari", "14 Hari", "1 Bulan"];
const DOKTER_OPTIONS = ["drh. Ali Haqqi", "drh. Siti Aisyah", "drh. Yusuf B."];

// ── Shared Styles ─────────────────────────────────────────────────────────────

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "10px 12px", borderRadius: 8,
  border: "1.5px solid #e0e0e0", fontSize: 14,
  fontFamily: "inherit", outline: "none",
  background: "#fff", color: "#333", boxSizing: "border-box",
};

const readonlyInputStyle: React.CSSProperties = { ...inputStyle, background: "#fafafa", color: "#666", cursor: "default" };
const labelStyle: React.CSSProperties = { fontWeight: 600, fontSize: 13, display: "block", marginBottom: 6, color: "#555" };
const cardStyle: React.CSSProperties = { background: "#fff", borderRadius: 14, border: "1.5px solid #e0e0e0", padding: "18px 20px", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" };
const sectionTitleStyle: React.CSSProperties = { fontWeight: 700, fontSize: 14, color: G, paddingBottom: 10, borderBottom: "1.5px solid #e8f5e9", marginBottom: 14, display: "flex", alignItems: "center", gap: 6 };

// ── Helpers ───────────────────────────────────────────────────────────────────

function Badge({ children, blue, orange }: { children: React.ReactNode; blue?: boolean; orange?: boolean }) {
  const bg = blue ? "#e3f2fd" : orange ? "#fff8e1" : "#e8f5e9";
  const color = blue ? "#1565c0" : orange ? "#e65100" : G;
  const border = blue ? "#90caf9" : orange ? "#ffcc80" : "#a5d6a7";
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "3px 9px", borderRadius: 20, fontSize: 11, fontWeight: 600, background: bg, color, border: `1.5px solid ${border}` }}>
      {children}
    </span>
  );
}

function HoverBtn({ onClick, children, variant = "green" }: {
  onClick?: () => void; children: React.ReactNode; variant?: "green" | "blue" | "outline";
}) {
  const [hov, setHov] = useState(false);
  const styles: Record<string, React.CSSProperties> = {
    green:   { border: `1.5px solid ${G}`,     background: hov ? G           : "#fff",     color: hov ? "#fff"    : G       },
    blue:    { border: "1.5px solid #e0e0e0",   background: hov ? "#e3f2fd"   : "#fff",     color: hov ? "#1565c0" : "#555"  },
    outline: { border: `1.5px solid ${G}`,      background: hov ? "#e8f5e9"   : "#fff",     color: G                         },
  };
  return (
    <button onClick={onClick} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "7px 12px", borderRadius: 8, fontWeight: 700, fontSize: 12, cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap", transition: "all .15s", ...styles[variant] }}
    >
      {children}
    </button>
  );
}

function HewanInfoBar({ hewan, onBack, label }: { hewan: HewanRow; onBack: () => void; label: string }) {
  return (
    <div style={{ background: "#fff", borderRadius: 14, border: "1.5px solid #e0e0e0", padding: "16px 20px", margin: "18px 0", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <HoverBtn onClick={onBack} variant="outline">
          <Icon name="arrowLeft" size={14} color="currentColor" /> Kembali
        </HoverBtn>
        <div style={{ width: 1, height: 36, background: "#e0e0e0" }} />
        <div style={{ width: 48, height: 48, borderRadius: 12, background: G, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.5rem", flexShrink: 0 }}>
          {hewan.emoji}
        </div>
        <div>
          <div style={{ fontWeight: 700, fontSize: 15 }}>{hewan.nama}</div>
          <div style={{ fontSize: 12, color: "#666", marginTop: 2 }}>{hewan.spesies}</div>
          <div style={{ display: "flex", gap: 6, marginTop: 5, flexWrap: "wrap" }}>
            <Badge><Icon name="paw" size={10} color={G} /> {hewan.umur} · {hewan.berat}</Badge>
            <Badge blue><Icon name="user" size={10} color="#1565c0" /> {hewan.pemilik}</Badge>
          </div>
        </div>
      </div>
      <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 14px", borderRadius: 20, background: "#e8f5e9", color: G, border: `1.5px solid #a5d6a7`, fontSize: 13, fontWeight: 700 }}>
        <Icon name="clipboard" size={13} color={G} /> {label}
      </div>
    </div>
  );
}

// ── TABLE VIEW ────────────────────────────────────────────────────────────────

function TableView({ records, onCatat, onDetail }: {
  records: RekamMedisRecord[];
  onCatat: (h: HewanRow) => void;
  onDetail: (r: RekamMedisRecord) => void;
}) {
  const [search, setSearch] = useState("");

  const rows = HEWAN_LIST
    .filter(h => h.pemilik.toLowerCase().includes(search.toLowerCase()) || h.nama.toLowerCase().includes(search.toLowerCase()))
    .map(h => {
      const hewanRecs = records.filter(r => r.hewan.id === h.id).sort((a, b) => b.id.localeCompare(a.id));
      return { hewan: h, latest: hewanRecs[0] ?? null, total: hewanRecs.length };
    });

  return (
    <div style={{ padding: "24px 28px" }}>
      {/* Search */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ position: "relative", maxWidth: 400 }}>
          <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}>
            <Icon name="search" size={15} color="#aaa" />
          </span>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari nama pemilik atau hewan..."
            style={{ ...inputStyle, paddingLeft: 38 }} />
        </div>
      </div>

      {/* Table */}
      <div style={{ background: "#fff", border: "1.5px solid #e0e0e0", borderRadius: 14, overflow: "hidden", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: G }}>
                {["Hewan", "Spesies", "Umur / Berat", "Pemilik", "Rekam Medis", "Aksi"].map(h => (
                  <th key={h} style={{ padding: "12px 16px", fontSize: 13, fontWeight: 700, color: "#fff", textAlign: "left", whiteSpace: "nowrap", fontFamily: "inherit" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr><td colSpan={6} style={{ padding: "48px", textAlign: "center", color: "#999", fontSize: 14 }}>
                  <div style={{ fontSize: 32, marginBottom: 8 }}>🔍</div>Tidak ditemukan hasil untuk "{search}"
                </td></tr>
              ) : rows.map(({ hewan: h, latest, total }) => (
                <tr key={h.id} style={{ borderBottom: "1px solid #f0f0f0" }}
                  onMouseEnter={e => (e.currentTarget.style.background = "#f9f9f9")}
                  onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                >
                  {/* Hewan */}
                  <td style={{ padding: "12px 16px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ width: 40, height: 40, borderRadius: 10, background: G, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.3rem", flexShrink: 0 }}>{h.emoji}</div>
                      <div style={{ fontWeight: 700, fontSize: 14 }}>{h.nama}</div>
                    </div>
                  </td>
                  <td style={{ padding: "12px 16px", fontSize: 13, color: "#555" }}>{h.spesies}</td>
                  <td style={{ padding: "12px 16px" }}>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{h.umur}</div>
                    <div style={{ fontSize: 12, color: "#888" }}>{h.berat}</div>
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                      <div style={{ width: 28, height: 28, borderRadius: "50%", background: "#e8f5e9", border: `1.5px solid #a5d6a7`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <Icon name="user" size={13} color={G} />
                      </div>
                      <span style={{ fontSize: 13, fontWeight: 600 }}>{h.pemilik}</span>
                    </div>
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    {total > 0 ? (
                      <div>
                        <Badge>{total} Rekam Medis</Badge>
                        <div style={{ fontSize: 11, color: "#888", marginTop: 4 }}>Terakhir: {latest!.createdAt}</div>
                      </div>
                    ) : (
                      <span style={{ fontSize: 12, color: "#bbb", fontStyle: "italic" }}>Belum ada</span>
                    )}
                  </td>
                  {/* Aksi */}
                  <td style={{ padding: "12px 16px" }}>
                    <div style={{ display: "flex", gap: 8 }}>
                      <HoverBtn onClick={() => onCatat(h)} variant="green">
                        <Icon name="clipboard" size={12} color="currentColor" /> Catat
                      </HoverBtn>
                      {latest && (
                        <HoverBtn onClick={() => onDetail(latest)} variant="blue">
                          <Icon name="eye" size={12} color="currentColor" /> Detail
                        </HoverBtn>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ── FORM VIEW ─────────────────────────────────────────────────────────────────

function FormView({ hewan, onBack, onSave }: { hewan: HewanRow; onBack: () => void; onSave: (r: RekamMedisRecord) => void }) {
  const [tanggal,         setTanggal]         = useState(new Date().toISOString().split("T")[0]);
  const [waktu,           setWaktu]           = useState("09:00");
  const [dokter,          setDokter]          = useState("drh. Ali Haqqi");
  const [diagnosa,        setDiagnosa]        = useState("");
  const [diagnosaLengkap, setDiagnosaLengkap] = useState("");
  const [catatanDokter,   setCatatanDokter]   = useState("");
  const [showDiagnosaDD,  setShowDiagnosaDD]  = useState(false);
  const [simpanPenyakit,  setSimpanPenyakit]  = useState(true);
  const [simpanAlergi,    setSimpanAlergi]    = useState(false);
  const [tindakanList,    setTindakanList]    = useState<Tindakan[]>([{ id: 1, penanganan: "", durasi: "3 Hari" }]);

  useEffect(() => {
    const handler = () => setShowDiagnosaDD(false);
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, []);

  const addTindakan    = () => setTindakanList(p => [...p, { id: Date.now(), penanganan: "", durasi: "3 Hari" }]);
  const removeTindakan = (id: number) => setTindakanList(p => p.filter(t => t.id !== id));
  const updateTindakan = (id: number, f: keyof Tindakan, v: string) => setTindakanList(p => p.map(t => t.id === id ? { ...t, [f]: v } : t));

  const handleSave = () => {
    const tanggalFmt = new Date(tanggal + "T00:00:00").toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
    onSave({ id: "rm-" + Date.now(), hewan, tanggal, waktu, dokter, diagnosa, diagnosaLengkap, catatanDokter, simpanPenyakit, simpanAlergi, tindakanList, createdAt: `${tanggalFmt}, ${waktu}` });
  };

  return (
    <div style={{ padding: "0 28px 28px" }}>
      <HewanInfoBar hewan={hewan} onBack={onBack} label="Catat Rekam Medis" />

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
        {/* LEFT */}
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div style={cardStyle}>
            <div style={sectionTitleStyle}><Icon name="clipboard" size={15} color={G} /> Informasi Pemeriksaan</div>
            <div style={{ marginBottom: 14 }}><label style={labelStyle}>Nama Hewan / Pasien</label><input style={readonlyInputStyle} value={`${hewan.nama} (${hewan.spesies})`} readOnly /></div>
            <div style={{ marginBottom: 14 }}><label style={labelStyle}>Nama Pemilik</label><input style={readonlyInputStyle} value={hewan.pemilik} readOnly /></div>
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
            <div><label style={labelStyle}>Dokter Pemeriksa</label>
              <select value={dokter} onChange={e => setDokter(e.target.value)} style={inputStyle}>
                {DOKTER_OPTIONS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
          </div>

          <div style={cardStyle}>
            <div style={sectionTitleStyle}><Icon name="stethoscope" size={15} color={G} /> Tindakan Medis</div>
            {tindakanList.map((t, idx) => (
              <div key={t.id} style={{ background: "#f9f9f9", border: "1.5px solid #e0e0e0", borderRadius: 10, padding: "12px 14px", marginBottom: idx < tindakanList.length - 1 ? 10 : 0 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: G }}>Tindakan {idx + 1}</span>
                  {tindakanList.length > 1 && (
                    <button onClick={() => removeTindakan(t.id)} style={{ background: "none", border: "none", cursor: "pointer", padding: "3px 6px", borderRadius: 6, display: "flex", alignItems: "center", color: "#e53935" }}>
                      <Icon name="trash" size={14} color="currentColor" />
                    </button>
                  )}
                </div>
                <div style={{ marginBottom: 10 }}><label style={labelStyle}>Penanganan &amp; Obat</label>
                  <input value={t.penanganan} onChange={e => updateTindakan(t.id, "penanganan", e.target.value)} placeholder="Tuliskan tindakan medis dan resep obat..." style={inputStyle} />
                </div>
                <div><label style={labelStyle}>Durasi Pengobatan</label>
                  <select value={t.durasi} onChange={e => updateTindakan(t.id, "durasi", e.target.value)} style={inputStyle}>
                    {DURASI_OPTIONS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
              </div>
            ))}
            <button onClick={addTindakan} style={{ marginTop: 12, display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 8, border: `1.5px dashed ${G}`, background: "#fff", color: G, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
              <Icon name="plus" size={14} color={G} /> Tambah Tindakan
            </button>
          </div>
        </div>

        {/* RIGHT */}
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div style={cardStyle}>
            <div style={sectionTitleStyle}><Icon name="search" size={15} color={G} /> Diagnosa</div>
            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>Diagnosa Utama</label>
              <div style={{ position: "relative" }} onClick={e => e.stopPropagation()}>
                <button onClick={() => setShowDiagnosaDD(v => !v)} style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 12px", borderRadius: 8, border: `1.5px solid ${showDiagnosaDD ? G : "#e0e0e0"}`, background: showDiagnosaDD ? "#e8f5e9" : "#fff", color: diagnosa ? "#333" : "#aaa", fontSize: 14, fontWeight: diagnosa ? 600 : 400, cursor: "pointer", fontFamily: "inherit", transition: "all .15s" }}>
                  <span>{diagnosa || "-- Pilih Diagnosa --"}</span>
                  <span style={{ transform: showDiagnosaDD ? "rotate(180deg)" : "rotate(0deg)", transition: "transform .2s", flexShrink: 0 }}><Icon name="chevDown" size={14} color="#888" /></span>
                </button>
                {showDiagnosaDD && (
                  <div style={{ position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, background: "#fff", border: "1.5px solid #e0e0e0", borderRadius: 10, boxShadow: "0 6px 20px rgba(0,0,0,0.10)", zIndex: 100, overflow: "hidden", maxHeight: 260, overflowY: "auto" }}>
                    <div onClick={() => { setDiagnosa(""); setShowDiagnosaDD(false); }} style={{ padding: "10px 14px", fontSize: 13, cursor: "pointer", color: "#aaa", borderBottom: "1px solid #f0f0f0" }}>-- Pilih Diagnosa --</div>
                    {DIAGNOSA_OPTIONS.map(d => (
                      <div key={d} onClick={() => { setDiagnosa(d); setShowDiagnosaDD(false); }}
                        style={{ padding: "10px 14px", fontSize: 14, cursor: "pointer", borderTop: "1px solid #f5f5f5", background: diagnosa === d ? G : "transparent", color: diagnosa === d ? "#fff" : "#333", fontWeight: diagnosa === d ? 700 : 500, transition: "background .12s" }}
                        onMouseEnter={e => { if (diagnosa !== d) (e.currentTarget as HTMLDivElement).style.background = "#f0faf0"; }}
                        onMouseLeave={e => { if (diagnosa !== d) (e.currentTarget as HTMLDivElement).style.background = "transparent"; }}
                      >{d}</div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div><label style={labelStyle}>Deskripsi Diagnosa</label>
              <textarea value={diagnosaLengkap} onChange={e => setDiagnosaLengkap(e.target.value)} placeholder="Deskripsikan diagnosa secara lengkap..." rows={4} style={{ ...inputStyle, resize: "vertical", minHeight: 90, lineHeight: 1.6 }} />
            </div>
          </div>

          <div style={cardStyle}>
            <div style={sectionTitleStyle}><Icon name="clipboard" size={15} color={G} /> Catatan Dokter</div>
            <textarea value={catatanDokter} onChange={e => setCatatanDokter(e.target.value)} placeholder="Tambahkan catatan tambahan dari dokter..." rows={5} style={{ ...inputStyle, resize: "vertical", minHeight: 100, lineHeight: 1.6, marginBottom: 14 }} />
            <div style={{ borderTop: "1.5px solid #e0e0e0", paddingTop: 12, display: "flex", flexDirection: "column", gap: 10 }}>
              {[{ label: "Simpan sebagai riwayat penyakit", val: simpanPenyakit, set: setSimpanPenyakit }, { label: "Simpan sebagai riwayat alergi", val: simpanAlergi, set: setSimpanAlergi }].map(({ label, val, set }) => (
                <label key={label} style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", userSelect: "none", fontSize: 14, fontWeight: 500 }}>
                  <input type="checkbox" checked={val} onChange={e => set(e.target.checked)} style={{ accentColor: G, width: 16, height: 16, cursor: "pointer" }} />
                  {label}
                </label>
              ))}
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <button onClick={onBack} style={{ padding: "10px 26px", borderRadius: 8, border: `1.5px solid ${G}`, background: "#fff", color: G, fontWeight: 700, fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", gap: 6, fontFamily: "inherit" }}>
              <Icon name="x" size={15} color={G} /> Batal
            </button>
            <button onClick={handleSave} style={{ padding: "10px 26px", borderRadius: 8, border: "none", background: G, color: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", gap: 6, fontFamily: "inherit" }}>
              <Icon name="save" size={15} color="#fff" /> Simpan Rekam Medis
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── DETAIL VIEW ───────────────────────────────────────────────────────────────

function DetailView({ record, onBack }: { record: RekamMedisRecord; onBack: () => void }) {
  const tanggalFmt = new Date(record.tanggal + "T00:00:00").toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

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
      <HewanInfoBar hewan={record.hewan} onBack={onBack} label="Detail Rekam Medis" />

      <div style={{ display: "flex", alignItems: "center", gap: 10, background: "#e8f5e9", border: "1.5px solid #a5d6a7", borderRadius: 10, padding: "12px 16px", marginBottom: 18 }}>
        <div style={{ width: 32, height: 32, borderRadius: "50%", background: G, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <Icon name="check" size={16} color="#fff" />
        </div>
        <div>
          <div style={{ fontWeight: 700, fontSize: 13, color: G }}>Rekam Medis Tersimpan</div>
          <div style={{ fontSize: 12, color: "#555", marginTop: 1 }}>Dicatat pada {record.createdAt} oleh {record.dokter}</div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div style={cardStyle}>
            <div style={sectionTitleStyle}><Icon name="clipboard" size={15} color={G} /> Informasi Pemeriksaan</div>
            <InfoRow icon="paw"         label="Pasien"           value={`${record.hewan.nama} (${record.hewan.spesies})`} />
            <InfoRow icon="user"        label="Pemilik"          value={record.hewan.pemilik} />
            <InfoRow icon="calendar"    label="Tanggal"          value={tanggalFmt} />
            <InfoRow icon="clock"       label="Waktu"            value={`${record.waktu} WIB`} />
            <InfoRow icon="stethoscope" label="Dokter Pemeriksa" value={record.dokter} />
          </div>

          <div style={cardStyle}>
            <div style={sectionTitleStyle}><Icon name="stethoscope" size={15} color={G} /> Tindakan Medis</div>
            {record.tindakanList.length === 0 ? (
              <div style={{ fontSize: 13, color: "#aaa", fontStyle: "italic" }}>Tidak ada tindakan dicatat.</div>
            ) : record.tindakanList.map((t, idx) => (
              <div key={t.id} style={{ background: "#f9f9f9", border: "1.5px solid #e0e0e0", borderRadius: 10, padding: "12px 14px", marginBottom: idx < record.tindakanList.length - 1 ? 10 : 0 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: G }}>Tindakan {idx + 1}</span>
                  <Badge orange><Icon name="clock" size={10} color="#e65100" /> {t.durasi}</Badge>
                </div>
                <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
                  <Icon name="pill" size={14} color="#555" />
                  <span style={{ fontSize: 13, color: "#333", lineHeight: 1.5 }}>{t.penanganan || <em style={{ color: "#bbb" }}>Tidak diisi</em>}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div style={cardStyle}>
            <div style={sectionTitleStyle}><Icon name="search" size={15} color={G} /> Diagnosa</div>
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 11, color: "#888", fontWeight: 600, marginBottom: 8 }}>DIAGNOSA UTAMA</div>
              {record.diagnosa
                ? <span style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "5px 16px", borderRadius: 20, background: G, color: "#fff", fontSize: 13, fontWeight: 700 }}>{record.diagnosa}</span>
                : <span style={{ fontSize: 13, color: "#aaa", fontStyle: "italic" }}>Tidak diisi</span>
              }
            </div>
            <div>
              <div style={{ fontSize: 11, color: "#888", fontWeight: 600, marginBottom: 8 }}>DESKRIPSI DIAGNOSA</div>
              <div style={{ background: "#f9f9f9", border: "1.5px solid #e0e0e0", borderRadius: 8, padding: "12px 14px", fontSize: 13, color: record.diagnosaLengkap ? "#333" : "#aaa", lineHeight: 1.6, fontStyle: record.diagnosaLengkap ? "normal" : "italic" }}>
                {record.diagnosaLengkap || "Tidak diisi"}
              </div>
            </div>
          </div>

          <div style={cardStyle}>
            <div style={sectionTitleStyle}><Icon name="note" size={15} color={G} /> Catatan Dokter</div>
            <div style={{ background: "#f9f9f9", border: "1.5px solid #e0e0e0", borderRadius: 8, padding: "12px 14px", fontSize: 13, color: record.catatanDokter ? "#333" : "#aaa", lineHeight: 1.6, fontStyle: record.catatanDokter ? "normal" : "italic", marginBottom: 14 }}>
              {record.catatanDokter || "Tidak ada catatan tambahan"}
            </div>
            <div style={{ borderTop: "1.5px solid #e0e0e0", paddingTop: 12, display: "flex", flexDirection: "column", gap: 8 }}>
              {[{ label: "Disimpan sebagai riwayat penyakit", val: record.simpanPenyakit }, { label: "Disimpan sebagai riwayat alergi", val: record.simpanAlergi }].map(({ label, val }) => (
                <div key={label} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ width: 18, height: 18, borderRadius: 4, background: val ? G : "#f0f0f0", border: `1.5px solid ${val ? G : "#e0e0e0"}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    {val && <Icon name="check" size={11} color="#fff" />}
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 500, color: val ? "#333" : "#aaa" }}>{label}</span>
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <button onClick={onBack} style={{ padding: "10px 26px", borderRadius: 8, border: `1.5px solid ${G}`, background: "#fff", color: G, fontWeight: 700, fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", gap: 6, fontFamily: "inherit" }}>
              <Icon name="arrowLeft" size={15} color={G} /> Kembali ke Daftar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function RekamMedis() {
  const [view,          setView]         = useState<ViewMode>("table");
  const [activeHewan,   setActiveHewan]  = useState<HewanRow | null>(null);
  const [activeRecord,  setActiveRecord] = useState<RekamMedisRecord | null>(null);
  const [records,       setRecords]      = useState<RekamMedisRecord[]>(SEED_RECORDS);

  const subtitleMap: Record<ViewMode, string> = {
    table:  "Pilih hewan untuk dicatat atau lihat rekam medisnya",
    form:   `Mencatat rekam medis untuk ${activeHewan?.nama ?? ""}`,
    detail: `Detail rekam medis — ${activeRecord?.hewan.nama ?? ""}`,
  };

  const goBack = () => { setView("table"); setActiveHewan(null); setActiveRecord(null); };

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden" }}>
      <Sidebar activePage="rekam" />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "auto", background: "#f9f9f9" }}>
        <Header title="Rekam Medis" subtitle={subtitleMap[view]} />

        {view === "table" && (
          <TableView records={records}
            onCatat={h => { setActiveHewan(h); setView("form"); }}
            onDetail={r => { setActiveRecord(r); setView("detail"); }}
          />
        )}
        {view === "form" && activeHewan && (
          <FormView hewan={activeHewan} onBack={goBack}
            onSave={r => { setRecords(p => [r, ...p]); setActiveRecord(r); setView("detail"); }}
          />
        )}
        {view === "detail" && activeRecord && (
          <DetailView record={activeRecord} onBack={goBack} />
        )}
      </div>
    </div>
  );
}