"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Sidebar from "@/components/Sidebar_owner_pet";
import Header from "@/components/Header";
import { useRouter } from "next/navigation";
import { Camera, X } from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

interface Pet {
  id_hewan: number;
  name: string;
  breed: string;
  age: string;
  weight: string;
  type: string;
  emoji: string;
  photo?: string;
  nama_hewan: string;
  jenis: string;
  ras: string | null;
  umur: number | null;
  berat: number | null;
}

interface FormData {
  nama_hewan: string;
  jenis: string;
  ras: string;
  umur: string;
  berat: string;
  foto_base64: string;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
const G = "#2e7d32";
const JENIS_OPTIONS = ["Anjing", "Kucing", "Kelinci", "Hamster", "Burung", "Lainnya"];

// ✅ URL base hewan — sesuai prefix route Laravel
const HEWAN_URL = `${API_URL}/api/owner_pet/data_hewan`;

const emptyForm: FormData = {
  nama_hewan: "", jenis: "", ras: "", umur: "", berat: "", foto_base64: "",
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function getAuthToken(): string {
  return typeof window !== "undefined"
    ? (localStorage.getItem("token") ?? "") : "";
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// ── Form Modal ────────────────────────────────────────────────────────────────

function PetForm({ initial, onSave, onCancel, saving }: {
  initial?: Pet | null;
  onSave(data: FormData): void;
  onCancel(): void;
  saving: boolean;
}) {
  const [form, setForm] = useState<FormData>(
    initial
      ? {
          nama_hewan:  initial.nama_hewan,
          jenis:       initial.jenis,
          ras:         initial.ras ?? "",
          umur:        initial.umur != null ? String(initial.umur) : "",
          berat:       initial.berat != null ? String(initial.berat) : "",
          foto_base64: "",
        }
      : emptyForm
  );
  const [previewPhoto, setPreviewPhoto] = useState<string>(initial?.photo ?? "");
  const [dragging, setDragging] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const set = (k: keyof FormData) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm(f => ({ ...f, [k]: e.target.value }));

  const handleFile = async (file: File | null | undefined) => {
    if (!file || !file.type.startsWith("image/")) return;
    const b64 = await fileToBase64(file);
    setPreviewPhoto(b64);
    setForm(f => ({ ...f, foto_base64: b64 }));
  };

  const valid = form.nama_hewan && form.jenis && form.umur && form.berat;

  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "10px 12px", borderRadius: 8,
    border: "1.5px solid #e0e0e0", fontSize: 14, fontFamily: "inherit",
    outline: "none", boxSizing: "border-box",
  };
  const labelStyle: React.CSSProperties = {
    fontWeight: 600, fontSize: 14, display: "block", marginBottom: 6,
  };

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.35)",
      display: "flex", alignItems: "center", justifyContent: "center", zIndex: 999,
    }}>
      <div style={{
        background: "#fff", borderRadius: 16, padding: "28px 32px",
        width: 480, maxHeight: "90vh", overflowY: "auto",
        boxShadow: "0 8px 32px rgba(0,0,0,0.18)",
      }}>
        <h2 style={{ fontWeight: 700, fontSize: 18, marginBottom: 20 }}>
          {initial ? "Edit Data Hewan" : "Tambah Hewan Baru"}
        </h2>

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {/* ── Upload Foto ── */}
          <div>
            <label style={labelStyle}>
              Foto Hewan{" "}
              <span style={{ fontWeight: 400, color: "#999", fontSize: 12 }}>(opsional)</span>
            </label>
            <div
              onClick={() => fileRef.current?.click()}
              onDragOver={e => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={e => { e.preventDefault(); setDragging(false); handleFile(e.dataTransfer.files[0]); }}
              style={{
                position: "relative", width: "100%", height: 160, borderRadius: 12,
                border: `2px dashed ${dragging ? G : previewPhoto ? G : "#d0d0d0"}`,
                background: dragging ? "#f0faf2" : previewPhoto ? "#000" : "#fafafa",
                cursor: "pointer", overflow: "hidden", transition: "border-color 0.2s",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}
            >
              {previewPhoto ? (
                <>
                  <Image
                    src={previewPhoto}
                    alt="preview"
                    fill
                    unoptimized
                    style={{ objectFit: "cover" }}
                  />
                  <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.25)" }} />
                  <div style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                    <Camera size={22} color="#fff" />
                    <span style={{ fontSize: 12, color: "#fff", fontWeight: 600, textShadow: "0 1px 3px rgba(0,0,0,0.6)" }}>
                      Klik untuk ganti foto
                    </span>
                  </div>
                  <button
                    onClick={e => {
                      e.stopPropagation();
                      setPreviewPhoto("");
                      setForm(f => ({ ...f, foto_base64: "" }));
                    }}
                    style={{
                      position: "absolute", top: 8, right: 8, zIndex: 2,
                      background: "rgba(0,0,0,0.6)", border: "none", borderRadius: "50%",
                      width: 28, height: 28, display: "flex", alignItems: "center",
                      justifyContent: "center", cursor: "pointer",
                    }}
                  >
                    <X size={13} color="#fff" />
                  </button>
                </>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, color: "#aaa" }}>
                  <Camera size={32} color="#a5d6a7" />
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#666" }}>Klik atau seret foto ke sini</div>
                  <div style={{ fontSize: 11, color: "#bbb" }}>PNG, JPG, JPEG</div>
                </div>
              )}
            </div>
            <input
              ref={fileRef} type="file" accept="image/*"
              style={{ display: "none" }}
              onChange={e => handleFile(e.target.files?.[0])}
            />
          </div>

          <div>
            <label style={labelStyle}>Nama Hewan</label>
            <input style={inputStyle} value={form.nama_hewan} onChange={set("nama_hewan")} placeholder="Nama hewan" />
          </div>
          <div>
            <label style={labelStyle}>Jenis Hewan</label>
            <select style={inputStyle} value={form.jenis} onChange={set("jenis")}>
              <option value="">-- Pilih Jenis --</option>
              {JENIS_OPTIONS.map(j => <option key={j} value={j}>{j}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Ras</label>
            <input style={inputStyle} value={form.ras} onChange={set("ras")} placeholder="Ras hewan (opsional)" />
          </div>
          <div>
            <label style={labelStyle}>Usia (Tahun)</label>
            <input style={inputStyle} type="number" min={0} value={form.umur} onChange={set("umur")} placeholder="Usia" />
          </div>
          <div>
            <label style={labelStyle}>Berat (Kg)</label>
            <input style={inputStyle} type="number" min={0} step="0.1" value={form.berat} onChange={set("berat")} placeholder="Berat" />
          </div>
        </div>

        <div style={{ display: "flex", gap: 12, justifyContent: "flex-end", marginTop: 24 }}>
          <button onClick={onCancel} disabled={saving} style={{
            padding: "10px 26px", borderRadius: 8, border: `1.5px solid ${G}`,
            background: "#fff", color: G, fontWeight: 700, fontSize: 14, cursor: "pointer",
          }}>Batal</button>
          <button
            onClick={() => valid && onSave(form)}
            disabled={!valid || saving}
            style={{
              padding: "10px 26px", borderRadius: 8, border: "none",
              background: valid && !saving ? G : "#a5d6a7", color: "#fff",
              fontWeight: 700, fontSize: 14,
              cursor: valid && !saving ? "pointer" : "not-allowed",
            }}
          >
            {saving ? "Menyimpan..." : "Simpan"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Pet Card ──────────────────────────────────────────────────────────────────

function PetCard({ pet, onEdit, onBooking, onDelete }: {
  pet: Pet; onEdit(): void; onBooking(): void; onDelete(): void;
}) {
  const [confirm, setConfirm] = useState(false);
  return (
    <div style={{
      borderRadius: 14, overflow: "hidden", border: "1.5px solid #e0e0e0",
      width: 240, background: "#fff", boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
    }}>
      <div style={{
        position: "relative", width: "100%", height: 160,
        background: pet.photo ? "#f7f7f7" : G,
        display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden",
      }}>
        {pet.photo
          ? <Image src={pet.photo} alt={pet.name} fill unoptimized style={{ objectFit: "contain" }} />
          : <div style={{ fontSize: 60 }}>{pet.emoji}</div>
        }
      </div>
      <div style={{ background: G, textAlign: "center", padding: "10px 12px" }}>
        <div style={{ fontWeight: 700, fontSize: 16, color: "#fff" }}>{pet.name}</div>
        <div style={{ fontSize: 12, color: "#c8e6c9", marginTop: 2 }}>{pet.type} · {pet.breed}</div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1, background: "#f0f0f0", borderTop: "1px solid #e0e0e0" }}>
        {[["Usia", pet.age], ["Berat", pet.weight]].map(([label, val]) => (
          <div key={label} style={{ background: "#fafafa", padding: "10px 12px", textAlign: "center" }}>
            <div style={{ fontSize: 11, color: "#888" }}>{label}</div>
            <div style={{ fontWeight: 700, fontSize: 14 }}>{val}</div>
          </div>
        ))}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, padding: "12px" }}>
        <button onClick={onEdit} style={{
          padding: "8px 0", borderRadius: 8, border: `1.5px solid ${G}`,
          background: "#fff", color: G, fontWeight: 700, fontSize: 13, cursor: "pointer",
        }}>Edit</button>
        <button onClick={onBooking} style={{
          padding: "8px 0", borderRadius: 8, border: "none",
          background: G, color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer",
        }}>Booking</button>
      </div>
      <div style={{ padding: "0 12px 12px" }}>
        {!confirm ? (
          <button onClick={() => setConfirm(true)} style={{
            width: "100%", padding: "7px 0", borderRadius: 8,
            border: "1.5px solid #e53935", background: "#fff",
            color: "#e53935", fontWeight: 600, fontSize: 13, cursor: "pointer",
          }}>Hapus</button>
        ) : (
          <div style={{ display: "flex", gap: 6 }}>
            <button onClick={() => setConfirm(false)} style={{
              flex: 1, padding: "7px 0", borderRadius: 8,
              border: "1.5px solid #e0e0e0", background: "#fff",
              color: "#555", fontWeight: 600, fontSize: 13, cursor: "pointer",
            }}>Batal</button>
            <button onClick={onDelete} style={{
              flex: 1, padding: "7px 0", borderRadius: 8, border: "none",
              background: "#e53935", color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer",
            }}>Hapus!</button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function HewanPage() {
  const router = useRouter();
  const [pets,     setPets]     = useState<Pet[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [saving,   setSaving]   = useState(false);
  const [error,    setError]    = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editPet,  setEditPet]  = useState<Pet | null>(null);

  const token = getAuthToken();

  // ── Load data saat mount ───────────────────────────────────────────────────
  useEffect(() => {
    if (!token) { router.push("/auth/login"); return; }

    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        // ✅ FIX: URL sesuai route Laravel → /api/owner_pet/data_hewan
        const r = await fetch(HEWAN_URL, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        const res = await r.json();
        if (!cancelled && res.success) setPets(res.data);
      } catch {
        if (!cancelled) setError("Gagal memuat data hewan.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [token, router]);

  // ── Reload manual setelah save/delete ─────────────────────────────────────
  const fetchPets = async () => {
    setLoading(true);
    setError(null);
    try {
      // ✅ FIX: URL sesuai route Laravel
      const r = await fetch(HEWAN_URL, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const res = await r.json();
      if (res.success) setPets(res.data);
    } catch {
      setError("Gagal memuat data hewan.");
    } finally {
      setLoading(false);
    }
  };

  const openAdd   = () => { setEditPet(null); setShowForm(true); };
  const openEdit  = (pet: Pet) => { setEditPet(pet); setShowForm(true); };
  const closeForm = () => { setShowForm(false); setEditPet(null); };

  // ── Simpan (tambah / edit) ─────────────────────────────────────────────────
  const handleSave = async (form: FormData) => {
    setSaving(true);
    setError(null);
    try {
      const body: Record<string, string> = {
        nama_hewan: form.nama_hewan,
        jenis:      form.jenis,
        ras:        form.ras,
        umur:       form.umur,
        berat:      form.berat,
      };
      if (form.foto_base64) body.foto_base64 = form.foto_base64;

      // ✅ FIX: URL sesuai route Laravel
      const url    = editPet
        ? `${HEWAN_URL}/${editPet.id_hewan}`
        : HEWAN_URL;
      const method = editPet ? "PUT" : "POST";

      const res  = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization:  `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.success) {
        closeForm();
        fetchPets();
      } else {
        setError(data.message ?? "Gagal menyimpan data hewan.");
      }
    } catch {
      setError("Tidak dapat terhubung ke server.");
    } finally {
      setSaving(false);
    }
  };

  // ── Hapus ─────────────────────────────────────────────────────────────────
  const handleDelete = async (idHewan: number) => {
    setError(null);
    try {
      // ✅ FIX: URL sesuai route Laravel
      const res  = await fetch(`${HEWAN_URL}/${idHewan}`, {
        method:  "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setPets(p => p.filter(x => x.id_hewan !== idHewan));
      } else {
        setError(data.message ?? "Gagal menghapus hewan.");
      }
    } catch {
      setError("Tidak dapat terhubung ke server.");
    }
  };

  const handleBooking = (idHewan: number) => {
    localStorage.setItem("sipeka_booking_pet", String(idHewan));
    router.push("/owner_pet/booking_layanan");
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden" }}>
      <Sidebar activePage="hewan" />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "auto", background: "#f9f9f9" }}>
        <Header title="Data Hewan" subtitle="Kelola data hewan peliharaan Anda" />

        <div style={{ padding: "24px 28px" }}>

          {error && (
            <div style={{
              padding: "10px 14px", background: "#fce4ec",
              borderRadius: 8, color: "#c62828", fontSize: 13, marginBottom: 16,
            }}>
              ⚠️ {error}
            </div>
          )}

          <button onClick={openAdd} style={{
            padding: "10px 20px", borderRadius: 8,
            border: `2px solid ${G}`, background: "#fff",
            color: G, fontWeight: 700, fontSize: 14, cursor: "pointer", marginBottom: 24,
          }}>
            + Tambah Hewan
          </button>

          {loading ? (
            <div style={{ textAlign: "center", padding: "60px 0", color: "#888" }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>⏳</div>
              <div style={{ fontSize: 14 }}>Memuat data hewan...</div>
            </div>
          ) : pets.length === 0 ? (
            <div style={{ textAlign: "center", padding: "60px 0", color: "#999" }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>🐾</div>
              <div style={{ fontSize: 16, fontWeight: 600 }}>Belum ada hewan</div>
              <div style={{ fontSize: 13, marginTop: 4 }}>
                Klik + Tambah Hewan untuk menambahkan hewan peliharaan
              </div>
            </div>
          ) : (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 20 }}>
              {pets.map(pet => (
                <PetCard
                  key={pet.id_hewan}
                  pet={pet}
                  onEdit={() => openEdit(pet)}
                  onBooking={() => handleBooking(pet.id_hewan)}
                  onDelete={() => handleDelete(pet.id_hewan)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {showForm && (
        <PetForm
          initial={editPet}
          onSave={handleSave}
          onCancel={closeForm}
          saving={saving}
        />
      )}
    </div>
  );
}