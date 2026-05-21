"use client";

import { useState, useEffect, useRef } from "react";
import {
  Check, ChevronRight, ChevronLeft, Info, Download, X, ImagePlus,
  Calendar, Clock, Stethoscope, Syringe, Scissors, Home, PawPrint,
  AlertCircle, AlertTriangle, Loader, Camera, Dog, Cat, Rabbit, Bird,
  CheckCircle, Hash, UserRound,
} from "lucide-react";
import Sidebar from "@/components/Sidebar_owner_pet";
import Header from "@/components/Header";
import { useBookingPDF, type BookingPDFData } from "./useBookingPDF";

// ── Types ─────────────────────────────────────────────────────────────────────

type Pet = {
  id: string;
  id_hewan?: number;
  name: string;
  type: string;
  breed: string;
  age: string;
  weight: string;
  emoji: string;
  photo?: string;
};

type Layanan = {
  id: string;
  id_layanan: number;
  name: string;
  icon: string;
  kategori: string;
  harga: number;
  deskripsi?: string;
};

type JadwalTersedia = {
  id_jadwal: number;
  tanggal: string;
  hari: string;
  jam_mulai: string;
  jam_selesai: string;
  nama_dokter?: string;
};

type ConditionPhoto = {
  id: string;
  dataUrl: string;
  label: "before" | "after";
};

// ── Constants ─────────────────────────────────────────────────────────────────

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
const STORAGE_URL = `${API_URL}/storage/`;

const KATEGORI_PREFERRED_ORDER = ["Medis", "Vaksin", "Vaksinasi", "Grooming", "Rawat Inap", "Hotel", "Bedah"];

const JAM_SLOTS = ["08:00","09:00","10:00","11:00","12:00","13:00","14:00","15:00","16:00","17:00"];
const STEPS = ["Pilih Hewan", "Pilih Layanan", "Foto Kondisi", "Jadwal", "Persetujuan", "Konfirmasi"];
const CONSENTS = [
  "Saya menyetujui bahwa tindakan medis yang diperlukan dapat dilakukan oleh dokter/paramedis yang bertugas.",
  "Saya memahami bahwa hasil pemeriksaan akan dicatat dalam rekam medis hewan peliharaan saya.",
  "Saya bertanggung jawab atas keakuratan informasi yang saya berikan terkait kondisi hewan peliharaan saya.",
  "Saya menyetujui penggunaan data hewan untuk keperluan layanan di klinik.",
];

const G = "#2e7d32";
const TOTAL_STEPS = STEPS.length;

// ── Helpers ───────────────────────────────────────────────────────────────────

function getAuthToken(): string | null {
  if (typeof window === "undefined") return null;
  return sessionStorage.getItem("token") ?? localStorage.getItem("token");
}

function normalizeFotoUrl(foto: string | null | undefined): string | undefined {
  if (!foto) return undefined;
  if (foto.startsWith("http://") || foto.startsWith("https://")) return foto;
  return STORAGE_URL + foto.replace(/^\//, "");
}

function getKategoriColor(kategori: string): { bg: string; text: string } {
  const k = kategori.toLowerCase();
  if (k.includes("medis") || k.includes("periksa"))                     return { bg: "#e3f2fd", text: "#1565c0" };
  if (k.includes("vaksin"))                                              return { bg: "#fce4ec", text: "#c62828" };
  if (k.includes("groom"))                                               return { bg: "#f3e5f5", text: "#6a1b9a" };
  if (k.includes("inap") || k.includes("hotel") || k.includes("titip")) return { bg: "#e0f2f1", text: "#00695c" };
  if (k.includes("bedah") || k.includes("operasi"))                     return { bg: "#fff3e0", text: "#e65100" };
  return { bg: "#f5f5f5", text: "#555" };
}

function getKategoriList(services: Layanan[]): string[] {
  const unique = [...new Set(services.map(s => s.kategori))];
  return unique.sort((a, b) => {
    const ia = KATEGORI_PREFERRED_ORDER.findIndex(k => k.toLowerCase() === a.toLowerCase());
    const ib = KATEGORI_PREFERRED_ORDER.findIndex(k => k.toLowerCase() === b.toLowerCase());
    return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
  });
}

const fmtDate = (d: string) =>
  d
    ? new Date(d).toLocaleDateString("id-ID", { year: "numeric", month: "2-digit", day: "2-digit" }).replace(/\//g, "-")
    : "–";

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

const cardStyle = (active: boolean): React.CSSProperties => ({
  borderRadius: 10,
  padding: "13px 15px",
  cursor: "pointer",
  transition: "background .15s, border-color .15s",
  border: `2px solid ${active ? G : "#e0e0e0"}`,
  background: active ? "#f1f8f1" : "#fff",
});

// ── Icon Components ───────────────────────────────────────────────────────────

/** Lucide icon sesuai jenis hewan */
function AnimalIcon({ type, size = 22, color = G }: { type: string; size?: number; color?: string }) {
  const t = type?.toLowerCase();
  if (t === "anjing")  return <Dog    size={size} color={color} />;
  if (t === "kucing")  return <Cat    size={size} color={color} />;
  if (t === "kelinci") return <Rabbit size={size} color={color} />;
  if (t === "burung")  return <Bird   size={size} color={color} />;
  return <PawPrint size={size} color={color} />;
}

/** Lucide icon sesuai kategori layanan */
function KategoriIcon({ kategori, size = 18, color }: { kategori: string; size?: number; color?: string }) {
  const k = kategori.toLowerCase();
  const c = color ?? G;
  if (k.includes("medis") || k.includes("periksa"))                     return <Stethoscope size={size} color={c} />;
  if (k.includes("vaksin"))                                              return <Syringe     size={size} color={c} />;
  if (k.includes("groom"))                                               return <Scissors    size={size} color={c} />;
  if (k.includes("inap") || k.includes("hotel") || k.includes("titip")) return <Home        size={size} color={c} />;
  if (k.includes("bedah") || k.includes("operasi"))                     return <Syringe     size={size} color={c} />;
  return <PawPrint size={size} color={c} />;
}

// ── PetAvatar ─────────────────────────────────────────────────────────────────

function PetAvatar({ pet, size = 42 }: { pet: Pet; size?: number }) {
  const [imgError, setImgError] = useState(false);

  if (pet.photo && !imgError) {
    return (
      <div style={{
        width: size, height: size, borderRadius: 8, background: "#f5f5f5",
        border: "1.5px solid #e0e0e0", display: "flex", alignItems: "center",
        justifyContent: "center", overflow: "hidden", flexShrink: 0,
      }}>
        <img
          src={pet.photo}
          alt={pet.name}
          style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }}
          onError={() => setImgError(true)}
        />
      </div>
    );
  }

  return (
    <div style={{
      width: size, height: size, borderRadius: 8,
      background: "#e8f5e9", display: "flex", alignItems: "center",
      justifyContent: "center", flexShrink: 0,
    }}>
      <AnimalIcon type={pet.type} size={Math.round(size * 0.52)} />
    </div>
  );
}

// ── StepBar ───────────────────────────────────────────────────────────────────

function StepBar({ current }: { current: number }) {
  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "18px 24px 12px",
      background: "#fff",
      borderBottom: "1px solid #f0f0f0",
    }}>
      {STEPS.map((label, i) => {
        const n = i + 1;
        const done   = n < current;
        const active = n === current;
        return (
          <div key={n} style={{ display: "flex", alignItems: "center" }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, minWidth: 80 }}>
              <div style={{
                width: 38, height: 38, borderRadius: "50%", display: "flex", alignItems: "center",
                justifyContent: "center", fontWeight: 700, fontSize: 14, flexShrink: 0,
                background: done ? "#4caf50" : active ? G : "#c8e6c9", color: "#fff",
              }}>
                {done ? <Check size={16} /> : n}
              </div>
              <span style={{
                fontSize: 11,
                whiteSpace: "nowrap",
                fontWeight: active ? 700 : 400,
                color: active ? G : done ? "#4caf50" : "#9e9e9e",
              }}>
                {label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div style={{
                width: 48, height: 2,
                marginBottom: 18,
                flexShrink: 0,
                background: done ? "#4caf50" : "#c8e6c9",
              }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── NavBtns ───────────────────────────────────────────────────────────────────

function NavBtns({ step, onBack, onNext, onConfirm, disabled, loading }: {
  step: number; onBack(): void; onNext(): void; onConfirm(): void;
  disabled: boolean; loading?: boolean;
}) {
  const base: React.CSSProperties = {
    padding: "10px 22px", borderRadius: 8, fontWeight: 600, fontSize: 14,
    cursor: "pointer", display: "flex", alignItems: "center", gap: 6,
  };
  return (
    <div style={{ display: "flex", justifyContent: "space-between", marginTop: 26 }}>
      <button onClick={onBack} style={{ ...base, border: `1.5px solid ${G}`, background: "#fff", color: G }}>
        <ChevronLeft size={15} /> Kembali
      </button>
      {step < TOTAL_STEPS ? (
        <button onClick={onNext} disabled={!!disabled} suppressHydrationWarning style={{
          ...base, border: "none",
          background: disabled ? "#a5d6a7" : G, color: "#fff",
          cursor: disabled ? "not-allowed" : "pointer",
        }}>
          Selanjutnya <ChevronRight size={15} />
        </button>
      ) : (
        <button onClick={onConfirm} disabled={!!loading} suppressHydrationWarning style={{
          ...base, border: "none", background: loading ? "#a5d6a7" : G, color: "#fff",
          cursor: loading ? "not-allowed" : "pointer",
        }}>
          {loading
            ? <><Loader size={14} style={{ animation: "spin 1s linear infinite" }} /> Memproses...</>
            : <>Konfirmasi Booking <ChevronRight size={14} /></>
          }
        </button>
      )}
      <style>{`@keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }`}</style>
    </div>
  );
}

// ── Step 1: Pilih Hewan ───────────────────────────────────────────────────────

function Step1({ pets, sel, toggle }: { pets: Pet[]; sel: string[]; toggle(id: string): void }) {
  if (pets.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: "40px 0", color: "#888" }}>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 12 }}>
          <PawPrint size={40} color="#c8e6c9" />
        </div>
        <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 6 }}>Belum ada data hewan</div>
        <div style={{ fontSize: 13 }}>Tambahkan hewan di menu <strong>Data Hewan</strong> terlebih dahulu.</div>
      </div>
    );
  }
  return (
    <div>
      <h2 style={{ color: G, fontSize: 17, fontWeight: 700, marginBottom: 4 }}>Pilih Hewan Peliharaan</h2>
      <p style={{ fontSize: 13, color: "#666", marginBottom: 18 }}>
        Klik kartu untuk memilih/membatalkan. Bisa pilih lebih dari 1 hewan.
      </p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 16 }}>
        {pets.map(p => {
          const on = sel.includes(p.id);
          return (
            <div key={p.id} onClick={() => toggle(p.id)} style={{ ...cardStyle(on), width: 168, textAlign: "center", position: "relative" }}>
              {on && (
                <div style={{ position: "absolute", top: 8, right: 8, background: G, borderRadius: "50%", width: 22, height: 22, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Check size={12} color="#fff" strokeWidth={3} />
                </div>
              )}
              <div style={{ width: 80, height: 80, margin: "6px auto 8px", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
                <PetAvatar pet={p} size={80} />
              </div>
              <div style={{ fontWeight: 700 }}>{p.name}</div>
              <div style={{ fontSize: 12, color: "#666" }}>{p.type} · {p.breed}</div>
              <div style={{ fontSize: 12, color: "#888", marginTop: 3 }}>{p.age} · {p.weight}</div>
            </div>
          );
        })}
      </div>
      {sel.length > 0 && (
        <div style={{ marginTop: 16, padding: "9px 14px", background: "#e8f5e9", borderRadius: 8, fontSize: 13, color: G, fontWeight: 500, display: "flex", alignItems: "center", gap: 7 }}>
          <PawPrint size={14} color={G} />
          {sel.length} hewan dipilih: {sel.map(id => pets.find(p => p.id === id)?.name).join(", ")}
        </div>
      )}
    </div>
  );
}

// ── Step 2: Pilih Layanan ─────────────────────────────────────────────────────

function Step2({ pets, sel, svc, notes, onToggleSvc, onNote, services }: {
  pets: Pet[];
  sel: string[];
  svc: Record<string, string[]>;
  notes: Record<string, string>;
  onToggleSvc(petId: string, kategori: string): void;
  onNote(petId: string, note: string): void;
  services: Layanan[];
}) {
  const [tab, setTab] = useState(sel[0]);
  const pet = pets.find(p => p.id === tab)!;
  const selected = svc[tab] ?? [];
  const availableKategori = getKategoriList(services);

  return (
    <div>
      <div style={{ padding: "9px 13px", background: "#e3f2fd", borderRadius: 8, fontSize: 13, color: "#1565c0", display: "flex", gap: 8, marginBottom: 14 }}>
        <Info size={15} style={{ flexShrink: 0, marginTop: 1 }} />
        <span>Pilih kategori layanan untuk setiap hewan. Layanan di bawah diambil langsung dari klinik.</span>
      </div>

      {/* Tab hewan */}
      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        {sel.map(id => {
          const p   = pets.find(x => x.id === id)!;
          const cnt = (svc[id] ?? []).length;
          return (
            <button key={id} onClick={() => setTab(id)} style={{
              padding: "5px 14px", borderRadius: 20, border: "none", cursor: "pointer",
              fontWeight: 600, fontSize: 13,
              background: tab === id ? G : "#e8f5e9", color: tab === id ? "#fff" : G,
              display: "flex", alignItems: "center", gap: 6,
            }}>
              <PetAvatar pet={p} size={20} />
              {p.name}
              {cnt > 0 && (
                <span style={{ background: tab === id ? "#fff" : G, color: tab === id ? G : "#fff", borderRadius: "50%", width: 18, height: 18, display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 800 }}>
                  {cnt}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Info hewan aktif */}
      <div style={{ padding: "9px 13px", background: "#f5f5f5", borderRadius: 8, display: "flex", gap: 12, alignItems: "center", marginBottom: 20 }}>
        <PetAvatar pet={pet} size={44} />
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 600 }}>{pet.name}</div>
          <div style={{ fontSize: 12, color: "#666" }}>{pet.type} · {pet.breed} · {pet.age} · {pet.weight}</div>
        </div>
      </div>

      {availableKategori.length === 0 ? (
        <div style={{ padding: "24px", textAlign: "center", color: "#999", fontSize: 13 }}>
          Belum ada layanan aktif dari klinik. Silakan coba lagi nanti.
        </div>
      ) : (
        <div style={{ border: "1.5px solid #e8e8e8", borderRadius: 12, overflow: "hidden", marginBottom: 20 }}>
          {availableKategori.map((kat, idx) => {
            const checked  = selected.includes(kat);
            const katColor = getKategoriColor(kat);
            return (
              <div key={kat} onClick={() => onToggleSvc(tab, kat)} style={{
                display: "flex", alignItems: "center", gap: 14,
                padding: "16px 18px", cursor: "pointer",
                borderTop: idx === 0 ? "none" : "1px solid #f0f0f0",
                background: checked ? "#f1f8f1" : "#fff",
                transition: "background .12s",
              }}>
                <div style={{ width: 20, height: 20, borderRadius: 5, flexShrink: 0, border: checked ? `2px solid ${G}` : "1.5px solid #d0d0d0", background: checked ? G : "#fff", display: "flex", alignItems: "center", justifyContent: "center", transition: "all .12s" }}>
                  {checked && <Check size={11} color="#fff" strokeWidth={3} />}
                </div>
                <span style={{ flexShrink: 0, display: "flex", alignItems: "center" }}>
                  <KategoriIcon kategori={kat} size={20} color={katColor.text} />
                </span>
                <span style={{ flex: 1, fontWeight: 600, fontSize: 14, color: "#1a1a1a" }}>{kat}</span>
                <span style={{ fontSize: 11, fontWeight: 600, padding: "3px 12px", borderRadius: 20, background: katColor.bg, color: katColor.text, flexShrink: 0 }}>{kat}</span>
              </div>
            );
          })}
        </div>
      )}

      {selected.length > 0 && (
        <div style={{ padding: "10px 14px", background: "#e8f5e9", borderRadius: 8, marginBottom: 16, display: "flex", alignItems: "center", gap: 7 }}>
          <CheckCircle size={15} color={G} />
          <span style={{ fontSize: 13, color: G, fontWeight: 600 }}>
            {selected.length} kategori dipilih untuk {pet.name}: {selected.join(", ")}
          </span>
        </div>
      )}

      <div>
        <label style={{ fontWeight: 600, fontSize: 14, display: "block", marginBottom: 5 }}>
          Catatan untuk {pet.name} <span style={{ fontWeight: 400, color: "#999" }}>(opsional)</span>
        </label>
        <textarea
          value={notes[tab] || ""}
          onChange={e => onNote(tab, e.target.value)}
          rows={3}
          placeholder="Contoh: Max susah makan sejak 2 hari lalu..."
          style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1.5px solid #e0e0e0", fontSize: 14, fontFamily: "inherit", resize: "vertical", boxSizing: "border-box" }}
        />
      </div>
    </div>
  );
}

// ── Step 3: Foto Kondisi ──────────────────────────────────────────────────────

interface PhotoSlotProps {
  photo: ConditionPhoto | null;
  label: "before" | "after";
  inputRef: React.RefObject<HTMLInputElement | null>;
  badgeColor: string; badgeText: string; addText: string;
  onRemove(): void;
  onFileChange(file: File | null): void;
}

function PhotoSlot({ photo, inputRef, badgeColor, badgeText, addText, onRemove, onFileChange }: PhotoSlotProps) {
  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
      <input ref={inputRef} type="file" accept="image/*" style={{ display: "none" }}
        onClick={e => { (e.target as HTMLInputElement).value = ""; }}
        onChange={e => onFileChange(e.target.files?.[0] ?? null)} />
      {photo ? (
        <div style={{ position: "relative", width: 120, height: 100, flexShrink: 0 }}>
          <img src={photo.dataUrl} alt="" style={{ width: 120, height: 100, objectFit: "cover", borderRadius: 8, border: "1.5px solid #e0e0e0", display: "block" }} />
          <div style={{ position: "absolute", top: 5, left: 5, background: badgeColor, color: "#fff", fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 20 }}>{badgeText}</div>
          <button onClick={onRemove} style={{ position: "absolute", top: 5, right: 5, background: "rgba(0,0,0,0.5)", border: "none", borderRadius: "50%", width: 22, height: 22, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
            <X size={11} color="#fff" />
          </button>
          <button onClick={() => inputRef.current?.click()} style={{ position: "absolute", bottom: 5, right: 5, background: "rgba(0,0,0,0.45)", border: "none", borderRadius: 6, padding: "3px 7px", color: "#fff", fontSize: 10, fontWeight: 600, cursor: "pointer" }}>Ganti</button>
        </div>
      ) : (
        <div onClick={() => inputRef.current?.click()} style={{ width: 120, height: 100, borderRadius: 8, border: "2px dashed #c8e6c9", background: "#f0faf2", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#888", gap: 4, flexShrink: 0 }}>
          <ImagePlus size={22} color="#a5d6a7" />
          <span style={{ fontSize: 11, textAlign: "center", padding: "0 6px" }}>{addText}</span>
        </div>
      )}
    </div>
  );
}

function Step3FotoKondisi({ pets, sel, condPhotos, setCondPhotos }: {
  pets: Pet[]; sel: string[];
  condPhotos: Record<string, ConditionPhoto[]>;
  setCondPhotos: React.Dispatch<React.SetStateAction<Record<string, ConditionPhoto[]>>>;
}) {
  const [tab, setTab] = useState(sel[0]);
  const beforeRef = useRef<HTMLInputElement | null>(null);
  const afterRef  = useRef<HTMLInputElement | null>(null);
  const pet    = pets.find(p => p.id === tab)!;
  const photos = condPhotos[tab] ?? [];

  const handleFile = async (file: File | null, label: "before" | "after") => {
    if (!file || !file.type.startsWith("image/")) return;
    const dataUrl = await fileToBase64(file);
    setCondPhotos(prev => ({
      ...prev,
      [tab]: [...(prev[tab] ?? []).filter(p => p.label !== label), { id: Date.now() + "", dataUrl, label }],
    }));
  };

  const removePhoto = (label: "before" | "after") =>
    setCondPhotos(prev => ({ ...prev, [tab]: (prev[tab] ?? []).filter(p => p.label !== label) }));

  const beforePhoto = photos.find(p => p.label === "before") ?? null;
  const afterPhoto  = photos.find(p => p.label === "after")  ?? null;

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <h2 style={{ color: G, fontSize: 17, fontWeight: 700, marginBottom: 4 }}>Foto Kondisi Hewan</h2>
        <div style={{ padding: "9px 13px", background: "#fff9c4", borderRadius: 8, fontSize: 13, color: "#795548", display: "flex", gap: 8 }}>
          <Info size={15} style={{ flexShrink: 0, marginTop: 1 }} />
          <span><strong>Opsional.</strong> Upload foto kondisi hewan — sebelum sakit (normal/sehat) dan saat sakit (kondisi terkini).</span>
        </div>
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        {sel.map(id => {
          const p   = pets.find(x => x.id === id)!;
          const cnt = (condPhotos[id] ?? []).length;
          return (
            <button key={id} onClick={() => setTab(id)} style={{ padding: "6px 14px", borderRadius: 20, border: "none", cursor: "pointer", fontWeight: 600, fontSize: 13, background: tab === id ? G : "#e8f5e9", color: tab === id ? "#fff" : G, display: "flex", alignItems: "center", gap: 6 }}>
              <PetAvatar pet={p} size={20} />
              {p.name}
              {cnt > 0 && <span style={{ background: tab === id ? "#fff" : G, color: tab === id ? G : "#fff", borderRadius: "50%", width: 18, height: 18, display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 800 }}>{cnt}</span>}
            </button>
          );
        })}
      </div>

      <div style={{ padding: "9px 13px", background: "#f5f5f5", borderRadius: 8, display: "flex", gap: 12, alignItems: "center", marginBottom: 20 }}>
        <PetAvatar pet={pet} size={44} />
        <div>
          <div style={{ fontWeight: 600 }}>{pet.name}</div>
          <div style={{ fontSize: 12, color: "#666" }}>{pet.type} · {pet.breed}</div>
        </div>
      </div>

      <div style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
          <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#43a047" }} />
          <span style={{ fontWeight: 700, fontSize: 14, color: "#1b5e20" }}>Sebelum Sakit</span>
          <span style={{ fontSize: 12, color: "#888" }}>— kondisi normal / sehat</span>
        </div>
        <PhotoSlot photo={beforePhoto} label="before" inputRef={beforeRef} badgeColor="#43a047" badgeText="SEHAT" addText="Upload Foto Sebelum Sakit" onRemove={() => removePhoto("before")} onFileChange={f => handleFile(f, "before")} />
      </div>

      <div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
          <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#ef5350" }} />
          <span style={{ fontWeight: 700, fontSize: 14, color: "#c62828" }}>Saat Sakit</span>
          <span style={{ fontSize: 12, color: "#888" }}>— kondisi terkini yang perlu ditangani</span>
        </div>
        <PhotoSlot photo={afterPhoto} label="after" inputRef={afterRef} badgeColor="#ef5350" badgeText="SAKIT" addText="Upload Foto Saat Sakit" onRemove={() => removePhoto("after")} onFileChange={f => handleFile(f, "after")} />
      </div>
    </div>
  );
}

// ── Step 4: Jadwal ────────────────────────────────────────────────────────────

function Step4Jadwal({ pets, sel, svc, services, jadwalList, selectedJadwal, setSelectedJadwal, selectedJam, setSelectedJam }: {
  pets: Pet[];
  sel: string[];
  svc: Record<string, string[]>;
  services: Layanan[];
  jadwalList: JadwalTersedia[];
  selectedJadwal: JadwalTersedia | null;
  setSelectedJadwal(j: JadwalTersedia | null): void;
  selectedJam: string;
  setSelectedJam(t: string): void;
}) {
  const availableJam = selectedJadwal
    ? JAM_SLOTS.filter(t => {
        if (!selectedJadwal.jam_mulai || !selectedJadwal.jam_selesai) return false;
        return t >= selectedJadwal.jam_mulai && t <= selectedJadwal.jam_selesai;
      })
    : [];

  return (
    <div>
      <h2 style={{ color: G, fontSize: 17, fontWeight: 700, marginBottom: 16 }}>Pilih Jadwal Kunjungan</h2>

      <div style={{ marginBottom: 24 }}>
        <label style={{ fontWeight: 700, fontSize: 14, display: "flex", alignItems: "center", gap: 6, marginBottom: 10, color: "#333" }}>
          <Calendar size={16} color={G} /> Pilih Tanggal Tersedia
        </label>

        {jadwalList.length === 0 ? (
          <div style={{ padding: "20px", background: "#fff9c4", borderRadius: 10, display: "flex", flexDirection: "column", alignItems: "center", color: "#795548", fontSize: 13, gap: 6 }}>
            <Calendar size={28} color="#f9a825" />
            Belum ada jadwal dokter yang tersedia. Silakan hubungi klinik.
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 10 }}>
            {jadwalList.map(j => {
              const active = selectedJadwal?.id_jadwal === j.id_jadwal;
              return (
                <div key={j.id_jadwal} onClick={() => { setSelectedJadwal(j); setSelectedJam(""); }} style={{ padding: "12px 14px", borderRadius: 10, cursor: "pointer", transition: "all .15s", border: active ? `2px solid ${G}` : "1.5px solid #e0e0e0", background: active ? "#f1f8f1" : "#fff", position: "relative" }}>
                  {active && (
                    <div style={{ position: "absolute", top: 8, right: 8, background: G, borderRadius: "50%", width: 18, height: 18, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Check size={10} color="#fff" strokeWidth={3} />
                    </div>
                  )}
                  <div style={{ fontSize: 11, color: "#888", marginBottom: 2 }}>{j.hari}</div>
                  <div style={{ fontWeight: 700, fontSize: 15, color: active ? G : "#1a1a1a" }}>{fmtDate(j.tanggal)}</div>
                  {j.nama_dokter && (
                    <div style={{ fontSize: 11, color: "#666", marginTop: 3, display: "flex", alignItems: "center", gap: 4 }}>
                      <UserRound size={11} color="#666" /> {j.nama_dokter}
                    </div>
                  )}
                  {j.jam_mulai && j.jam_selesai && (
                    <div style={{ fontSize: 11, color: "#888", marginTop: 2, display: "flex", alignItems: "center", gap: 4 }}>
                      <Clock size={11} color="#888" /> {j.jam_mulai} – {j.jam_selesai}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {selectedJadwal && (
        <div style={{ marginBottom: 24 }}>
          <label style={{ fontWeight: 700, fontSize: 14, display: "flex", alignItems: "center", gap: 6, marginBottom: 10, color: "#333" }}>
            <Clock size={16} color={G} /> Pilih Jam Kunjungan
          </label>
          {availableJam.length === 0 ? (
            <div style={{ fontSize: 13, color: "#999" }}>Tidak ada slot jam tersedia untuk jadwal ini.</div>
          ) : (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {availableJam.map(t => (
                <button key={t} onClick={() => setSelectedJam(t)} style={{ padding: "8px 14px", borderRadius: 8, cursor: "pointer", fontSize: 13, border: selectedJam === t ? `2px solid ${G}` : "1.5px solid #e0e0e0", background: selectedJam === t ? "#e8f5e9" : "#fff", color: selectedJam === t ? G : "#333", fontWeight: selectedJam === t ? 700 : 400 }}>
                  {t}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      <h3 style={{ color: G, fontWeight: 700, fontSize: 15, marginBottom: 10 }}>Ringkasan Layanan</h3>
      <div style={{ borderRadius: 10, overflow: "hidden", border: "1.5px solid #e0e0e0" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", background: G, color: "#fff", padding: "11px 16px", fontWeight: 700, fontSize: 13 }}>
          <span>Hewan</span><span>Layanan Dipilih</span>
        </div>
        {sel.map(id => {
          const p        = pets.find(x => x.id === id)!;
          const kategori = svc[id] ?? [];
          return (
            <div key={id} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", padding: "12px 16px", borderTop: "1px solid #f0f0f0", fontSize: 13, alignItems: "center", gap: 8 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <PetAvatar pet={p} size={32} />
                <div>
                  <div style={{ fontWeight: 600 }}>{p.name}</div>
                  <div style={{ color: "#888", fontSize: 12 }}>{p.breed}</div>
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                {kategori.length === 0
                  ? <span style={{ color: "#aaa" }}>–</span>
                  : kategori.map(k => {
                    const katColor = getKategoriColor(k);
                    return (
                      <div key={k} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12 }}>
                        <KategoriIcon kategori={k} size={13} color={katColor.text} />
                        <span style={{ fontWeight: 500 }}>{k}</span>
                        <span style={{ color: "#aaa" }}>
                          ({services.filter(s => s.kategori === k).map(s => s.name).join(", ")})
                        </span>
                      </div>
                    );
                  })
                }
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Step 5: Persetujuan ───────────────────────────────────────────────────────

function Step5Persetujuan({ pets, sel }: { pets: Pet[]; sel: string[] }) {
  const names = sel.map(id => pets.find(p => p.id === id)?.name).join(", ");
  return (
    <div>
      <div style={{ padding: 14, background: "#fff9c4", borderRadius: 10, display: "flex", gap: 12, marginBottom: 20 }}>
        <Info size={16} color="#f57f17" style={{ flexShrink: 0, marginTop: 1 }} />
        <div>
          <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 2 }}>Persetujuan Umum — Berlaku untuk Semua Hewan</div>
          <div style={{ fontSize: 13, color: "#555" }}>Mencakup: {names}</div>
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {CONSENTS.map((c, i) => (
          <div key={i} style={{ padding: "12px 15px", borderRadius: 10, background: "#f1f8f1", border: "1.5px solid #a5d6a7", display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 24, height: 24, borderRadius: "50%", background: G, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Check size={13} color="#fff" strokeWidth={3} />
            </div>
            <span style={{ fontSize: 14, color: "#333" }}>{c}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Step 6: Konfirmasi ────────────────────────────────────────────────────────

function Step6Konfirmasi({ pets, selectedJadwal, selectedJam, sel, svc, condPhotos, services }: {
  pets: Pet[];
  selectedJadwal: JadwalTersedia | null;
  selectedJam: string;
  sel: string[];
  svc: Record<string, string[]>;
  condPhotos: Record<string, ConditionPhoto[]>;
  services: Layanan[];
}) {
  return (
    <div>
      <h2 style={{ color: G, fontSize: 17, fontWeight: 700, marginBottom: 16 }}>Ringkasan Booking</h2>
      <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
        <div style={{ flex: 1, padding: "12px 15px", borderRadius: 10, border: "1.5px solid #e0e0e0", display: "flex", alignItems: "center", gap: 10 }}>
          <Calendar size={22} color={G} />
          <div>
            <div style={{ fontSize: 12, color: "#888" }}>Tanggal</div>
            <div style={{ fontWeight: 700, fontSize: 15 }}>{selectedJadwal ? `${selectedJadwal.hari}, ${fmtDate(selectedJadwal.tanggal)}` : "–"}</div>
            {selectedJadwal?.nama_dokter && (
              <div style={{ fontSize: 11, color: "#666", display: "flex", alignItems: "center", gap: 4 }}>
                <UserRound size={11} color="#666" /> {selectedJadwal.nama_dokter}
              </div>
            )}
          </div>
        </div>
        <div style={{ flex: 1, padding: "12px 15px", borderRadius: 10, border: "1.5px solid #e0e0e0", display: "flex", alignItems: "center", gap: 10 }}>
          <Clock size={22} color={G} />
          <div>
            <div style={{ fontSize: 12, color: "#888" }}>Jam</div>
            <div style={{ fontWeight: 700, fontSize: 15 }}>{selectedJam ? `${selectedJam} WIB` : "–"}</div>
          </div>
        </div>
      </div>

      <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 10 }}>Detail per Hewan ({sel.length} hewan)</div>
      {sel.map(id => {
        const p        = pets.find(x => x.id === id)!;
        const kategori = svc[id] ?? [];
        const cphs     = condPhotos[id] ?? [];
        return (
          <div key={id} style={{ borderRadius: 10, border: "1.5px solid #e0e0e0", overflow: "hidden", marginBottom: 10 }}>
            <div style={{ padding: "11px 15px", display: "flex", alignItems: "center", gap: 10, background: "#fafafa", borderBottom: "1px solid #f0f0f0" }}>
              <PetAvatar pet={p} size={40} />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700 }}>{p.name}</div>
                <div style={{ fontSize: 12, color: "#888" }}>{p.type} · {p.breed}</div>
              </div>
            </div>
            <div style={{ padding: "10px 15px" }}>
              <div style={{ fontSize: 12, color: "#888", marginBottom: 8 }}>Kategori layanan:</div>
              {kategori.length === 0
                ? <span style={{ fontSize: 13, color: "#aaa" }}>–</span>
                : <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {kategori.map(k => {
                    const katColor        = getKategoriColor(k);
                    const layananDalamKat = services.filter(s => s.kategori === k);
                    return (
                      <div key={k} style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "4px 12px", borderRadius: 20, background: katColor.bg, color: katColor.text, fontSize: 12, fontWeight: 600 }}>
                          <KategoriIcon kategori={k} size={13} color={katColor.text} /> {k}
                        </span>
                        {layananDalamKat.map(l => (
                          <span key={l.id} style={{ fontSize: 11, color: "#666", paddingLeft: 8 }}>
                            • {l.name} {l.harga > 0 ? `(Rp ${l.harga.toLocaleString("id-ID")})` : ""}
                          </span>
                        ))}
                      </div>
                    );
                  })}
                </div>
              }
            </div>
            {cphs.length > 0 && (
              <div style={{ padding: "9px 15px", borderTop: "1px solid #f0f0f0" }}>
                <div style={{ fontSize: 12, color: "#888", marginBottom: 6, display: "flex", alignItems: "center", gap: 5 }}>
                  <Camera size={13} color="#888" /> Foto kondisi ({cphs.length})
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                  {cphs.map(ph => (
                    <div key={ph.id} style={{ position: "relative" }}>
                      <img src={ph.dataUrl} alt="" style={{ width: 56, height: 48, objectFit: "cover", borderRadius: 6 }} />
                      <div style={{ position: "absolute", top: 2, left: 2, background: ph.label === "before" ? "#43a047" : "#ef5350", color: "#fff", fontSize: 8, fontWeight: 700, padding: "1px 4px", borderRadius: 10 }}>
                        {ph.label === "before" ? "S" : "K"}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Success Screen ────────────────────────────────────────────────────────────

function Success({ pets, bookings, selectedJadwal, selectedJam, sel, svc, services, onReset, onDownload }: {
  pets: Pet[];
  bookings: Array<{ no_booking: string; no_antrian: number; id_hewan: number }>;
  selectedJadwal: JadwalTersedia | null;
  selectedJam: string;
  sel: string[];
  svc: Record<string, string[]>;
  services: Layanan[];
  onReset(): void;
  onDownload(): void;
}) {
  const firstBooking = bookings[0];
  return (
    <div style={{ textAlign: "center", padding: "34px 0" }}>
      <div style={{ width: 66, height: 66, background: G, borderRadius: 16, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px" }}>
        <Check size={32} color="#fff" strokeWidth={2.5} />
      </div>
      <h2 style={{ color: G, fontSize: 20, fontWeight: 700, marginBottom: 4 }}>Booking Berhasil!</h2>
      <p style={{ fontSize: 15, marginBottom: 12 }}>
        No. Booking: <strong style={{ color: G }}>#{firstBooking?.no_booking}</strong>
        {bookings.length > 1 && <span style={{ fontSize: 12, color: "#888", marginLeft: 6 }}>+{bookings.length - 1} lainnya</span>}
      </p>
      <div style={{ display: "inline-flex", background: "#e8f5e9", border: `2px solid ${G}`, borderRadius: 12, padding: "10px 32px", marginBottom: 22 }}>
        <div style={{ textAlign: "left" }}>
          <div style={{ fontSize: 11, color: "#666", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px", display: "flex", alignItems: "center", gap: 5 }}>
            <Hash size={11} color="#666" /> Nomor Antrian
          </div>
          <div style={{ fontSize: 42, fontWeight: 800, color: G, lineHeight: 1 }}>{String(firstBooking?.no_antrian ?? 0).padStart(3, "0")}</div>
          <div style={{ fontSize: 11, color: "#888" }}>Tunjukkan ke petugas klinik</div>
        </div>
      </div>

      {sel.map(id => {
        const p              = pets.find(x => x.id === id)!;
        const kategori       = svc[id] ?? [];
        const layananDipilih = services.filter(s => kategori.includes(s.kategori));
        return (
          <div key={id} style={{ padding: 14, borderRadius: 12, border: "1.5px solid #e0e0e0", textAlign: "left", marginBottom: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
              <PetAvatar pet={p} size={44} />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700 }}>{p.name}</div>
                <div style={{ fontSize: 12, color: "#888", display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                    <Calendar size={11} color="#888" />
                    {selectedJadwal ? `${selectedJadwal.hari}, ${fmtDate(selectedJadwal.tanggal)}` : "–"}
                  </span>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                    <Clock size={11} color="#888" /> {selectedJam} WIB
                  </span>
                </div>
              </div>
            </div>
            {layananDipilih.map(s => {
              const katColor = getKategoriColor(s.kategori);
              return (
                <div key={s.id} style={{ fontSize: 13, color: "#555", padding: "3px 0 3px 12px", borderLeft: `3px solid ${G}`, marginBottom: 3, display: "flex", alignItems: "center", gap: 6 }}>
                  <KategoriIcon kategori={s.kategori} size={13} color={katColor.text} /> {s.name}
                </div>
              );
            })}
          </div>
        );
      })}

      <div style={{ display: "flex", gap: 12, justifyContent: "center", marginTop: 8 }}>
        <button onClick={onDownload} style={{ padding: "11px 22px", borderRadius: 10, border: `2px solid ${G}`, background: "#fff", color: G, fontWeight: 700, fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}>
          <Download size={15} /> Download Tiket PDF
        </button>
        <button onClick={onReset} style={{ padding: "11px 22px", borderRadius: 10, border: "none", background: G, color: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
          Buat Booking Baru
        </button>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function BookingPage() {
  const [pets,        setPets]        = useState<Pet[]>([]);
  const [services,    setServices]    = useState<Layanan[]>([]);
  const [jadwalList,  setJadwalList]  = useState<JadwalTersedia[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [fetchError,  setFetchError]  = useState<string | null>(null);

  const [step,    setStep]    = useState(1);
  const [done,    setDone]    = useState(false);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  const [apiBookings, setApiBookings] = useState<Array<{ no_booking: string; no_antrian: number; id_hewan: number }>>([]);

  const [sel,        setSel]        = useState<string[]>([]);
  const [svc,        setSvc]        = useState<Record<string, string[]>>({});
  const [notes,      setNotes]      = useState<Record<string, string>>({});
  const [condPhotos, setCondPhotos] = useState<Record<string, ConditionPhoto[]>>({});

  const [selectedJadwal, setSelectedJadwal] = useState<JadwalTersedia | null>(null);
  const [selectedJam,    setSelectedJam]    = useState("");

  const { downloadPDF } = useBookingPDF();

  useEffect(() => {
    const token = getAuthToken();

    const fetchAll = async () => {
      setLoadingData(true);
      setFetchError(null);

      try {
        const hewanRes = await fetch(`${API_URL}/api/owner_pet/data_hewan`, {
          headers: { Authorization: `Bearer ${token ?? ""}` },
        });

        if (!hewanRes.ok) {
          const msg = hewanRes.status === 401
            ? "Sesi login habis. Silakan login ulang."
            : `Gagal memuat data hewan (${hewanRes.status})`;
          setFetchError(msg);
          setLoadingData(false);
          return;
        }

        const hewanData = await hewanRes.json();
        console.log("[DEBUG] Response hewan:", hewanData);

        if (hewanData.success && Array.isArray(hewanData.data)) {
          setPets(
            hewanData.data.map((h: any) => ({
              id:       String(h.id_hewan ?? h.id),
              id_hewan: h.id_hewan ?? h.id,
              name:     h.nama_hewan  ?? h.name  ?? "-",
              type:     h.jenis_hewan ?? h.type  ?? "-",
              breed:    h.ras_hewan   ?? h.breed ?? "-",
              age:      h.umur        ?? h.age   ?? "-",
              weight:   h.berat       ?? h.weight ?? "-",
              emoji:    h.emoji       ?? "",
              photo:    normalizeFotoUrl(h.foto_hewan ?? h.photo),
            }))
          );
        } else {
          console.warn("[DEBUG] Data hewan gagal:", hewanData);
          setFetchError(hewanData.message ?? "Gagal memuat data hewan dari server.");
        }

        const layananRes  = await fetch(`${API_URL}/api/layanan/publik`);
        const layananData = await layananRes.json();
        console.log("[DEBUG] Response layanan:", layananData);

        if (layananData.success && Array.isArray(layananData.data)) {
          setServices(
            layananData.data.map((l: any) => ({
              id:         String(l.id_layanan ?? l.id),
              id_layanan: l.id_layanan ?? l.id,
              name:       l.nama_layanan ?? l.name ?? "-",
              icon:       l.icon ?? "",
              kategori:   l.kategori ?? "-",
              harga:      Number(l.harga ?? 0),
              deskripsi:  l.deskripsi ?? undefined,
            }))
          );
        }

        const jadwalRes  = await fetch(`${API_URL}/api/booking/jadwal-tersedia`, {
          headers: { Authorization: `Bearer ${token ?? ""}` },
        });
        const jadwalData = await jadwalRes.json();
        console.log("[DEBUG] Response jadwal:", jadwalData);

        if (jadwalData.success && Array.isArray(jadwalData.data)) {
          setJadwalList(
            jadwalData.data.map((j: any) => ({
              id_jadwal:   j.id_jadwal,
              tanggal:     j.tanggal,
              hari:        j.hari,
              jam_mulai:   j.jam_mulai,
              jam_selesai: j.jam_selesai,
              nama_dokter: j.nama_dokter ?? undefined,
            }))
          );
        }
      } catch (e) {
        console.error("[DEBUG] Fetch error:", e);
        setFetchError("Tidak dapat terhubung ke server. Periksa koneksi internet Anda.");
      } finally {
        setLoadingData(false);
      }
    };

    fetchAll();
  }, []);

  const togglePet = (id: string) =>
    setSel(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);

  const toggleSvc = (petId: string, kategori: string) => {
    setSvc(prev => {
      const current = prev[petId] ?? [];
      const updated = current.includes(kategori)
        ? current.filter(x => x !== kategori)
        : [...current, kategori];
      return { ...prev, [petId]: updated };
    });
  };

  const disabled = !!(
    (step === 1 && sel.length === 0) ||
    (step === 2 && sel.some(id => (svc[id] ?? []).length === 0)) ||
    (step === 4 && (!selectedJadwal || !selectedJam))
  );

  const confirm = async () => {
    if (!selectedJadwal || !selectedJam) {
      setError("Pilih tanggal dan jam kunjungan terlebih dahulu.");
      return;
    }
    setLoading(true);
    setError(null);
    const token = getAuthToken();
    const payload = {
      tanggal_booking: selectedJadwal.tanggal,
      jam:             selectedJam,
      id_jadwal:       selectedJadwal.id_jadwal,
      items: sel.map(id => {
        const pet              = pets.find(p => p.id === id)!;
        const selectedKategori = svc[id] ?? [];
        const photos           = condPhotos[id] ?? [];
        const id_layanans      = selectedKategori.flatMap(kat =>
          services.filter(s => s.kategori === kat).map(s => s.id_layanan)
        );
        return {
          id_hewan:    pet.id_hewan ?? Number(pet.id),
          id_layanans,
          catatan:     notes[id] ?? "",
          foto_before: photos.find(p => p.label === "before")?.dataUrl,
          foto_after:  photos.find(p => p.label === "after")?.dataUrl,
        };
      }),
    };
    try {
      const res = await fetch(`${API_URL}/api/booking`, {
        method:  "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token ?? ""}` },
        body:    JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) {
        setApiBookings(data.bookings);
        setDone(true);
      } else {
        setError(data.message ?? "Terjadi kesalahan saat membuat booking.");
      }
    } catch {
      setError("Tidak dapat terhubung ke server. Periksa koneksi internet Anda.");
    } finally {
      setLoading(false);
    }
  };

  const download = () => {
    if (apiBookings.length === 0) return;
    const first = apiBookings[0];
    const data: BookingPDFData = {
      bookingNumber: first.no_booking,
      date:          selectedJadwal?.tanggal ?? "",
      time:          selectedJam,
      queueNumber:   first.no_antrian,
      pets: sel.map(id => {
        const p              = pets.find(x => x.id === id)!;
        const kategori       = svc[id] ?? [];
        const layananDipilih = services.filter(s => kategori.includes(s.kategori));
        return {
          name:        p.name,
          breed:       p.breed,
          type:        p.type,
          serviceName: layananDipilih.map(s => s.name).join(", "),
          note:        notes[id] ?? "",
        };
      }),
    };
    downloadPDF(data);
  };

  const reset = () => {
    setStep(1); setDone(false); setSel([]); setSvc({});
    setNotes({}); setCondPhotos({});
    setSelectedJadwal(null); setSelectedJam("");
    setApiBookings([]); setError(null);
  };

  // ── Loading Screen ────────────────────────────────────────────────────────
  if (loadingData) {
    return (
      <div style={{ display: "flex", height: "100vh", overflow: "hidden" }}>
        <Sidebar activePage="booking" />
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", background: "#f9f9f9" }}>
          <div style={{ textAlign: "center", color: "#888", display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
            <Loader size={32} color="#a5d6a7" style={{ animation: "spin 1s linear infinite" }} />
            <div>Memuat data layanan &amp; jadwal...</div>
          </div>
          <style>{`@keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }`}</style>
        </div>
      </div>
    );
  }

  // ── Fetch Error Screen ────────────────────────────────────────────────────
  if (fetchError) {
    return (
      <div style={{ display: "flex", height: "100vh", overflow: "hidden" }}>
        <Sidebar activePage="booking" />
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", background: "#f9f9f9" }}>
          <div style={{ textAlign: "center", padding: 32, maxWidth: 400 }}>
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 12 }}>
              <AlertTriangle size={40} color="#e53935" />
            </div>
            <div style={{ fontWeight: 700, fontSize: 16, color: "#c62828", marginBottom: 8 }}>Gagal Memuat Data</div>
            <div style={{ fontSize: 14, color: "#666", marginBottom: 20 }}>{fetchError}</div>
            <button
              onClick={() => window.location.reload()}
              style={{ padding: "10px 24px", borderRadius: 8, border: "none", background: G, color: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer" }}
            >
              Coba Lagi
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Main Render ───────────────────────────────────────────────────────────
  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden" }}>
      <Sidebar activePage="booking" />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "auto", background: "#f9f9f9" }}>
        <Header title="Booking Layanan" subtitle="Booking Layanan Untuk Hewan Kesayangan Anda" />
        {!done && <StepBar current={step} />}

        <div style={{ padding: "0 28px 28px" }}>
          <div style={{ background: "#fff", borderRadius: 12, padding: "22px 26px", border: "1px solid #f0f0f0" }}>

            {error && (
              <div style={{ padding: "10px 14px", background: "#fce4ec", borderRadius: 8, color: "#c62828", fontSize: 13, marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
                <AlertCircle size={15} color="#c62828" /> {error}
              </div>
            )}

            {done ? (
              <Success
                pets={pets} bookings={apiBookings}
                selectedJadwal={selectedJadwal} selectedJam={selectedJam}
                sel={sel} svc={svc} services={services}
                onReset={reset} onDownload={download}
              />
            ) : (
              <>
                {step === 1 && <Step1 pets={pets} sel={sel} toggle={togglePet} />}
                {step === 2 && (
                  <Step2
                    pets={pets} sel={sel} svc={svc} notes={notes}
                    services={services} onToggleSvc={toggleSvc}
                    onNote={(p, n) => setNotes(v => ({ ...v, [p]: n }))}
                  />
                )}
                {step === 3 && <Step3FotoKondisi pets={pets} sel={sel} condPhotos={condPhotos} setCondPhotos={setCondPhotos} />}
                {step === 4 && (
                  <Step4Jadwal
                    pets={pets} sel={sel} svc={svc} services={services}
                    jadwalList={jadwalList}
                    selectedJadwal={selectedJadwal} setSelectedJadwal={setSelectedJadwal}
                    selectedJam={selectedJam} setSelectedJam={setSelectedJam}
                  />
                )}
                {step === 5 && <Step5Persetujuan pets={pets} sel={sel} />}
                {step === 6 && (
                  <Step6Konfirmasi
                    pets={pets}
                    selectedJadwal={selectedJadwal} selectedJam={selectedJam}
                    sel={sel} svc={svc} condPhotos={condPhotos} services={services}
                  />
                )}

                <NavBtns
                  step={step}
                  onBack={() => setStep(s => Math.max(1, s - 1))}
                  onNext={() => setStep(s => Math.min(TOTAL_STEPS, s + 1))}
                  onConfirm={confirm}
                  disabled={disabled}
                  loading={loading}
                />
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}