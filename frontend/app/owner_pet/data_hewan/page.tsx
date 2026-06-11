"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Sidebar from "@/components/Sidebar_owner_pet";
import Header from "@/components/Header";
import { useRouter } from "next/navigation";
import { Camera, X, PawPrint, Clock, AlertCircle } from "lucide-react";
import { ToastContainer, useToast } from "@/components/Toast";

// ── Types ─────────────────────────────────────────────────────────────────────

interface Pet {
  id_hewan: number;
  name: string;
  breed: string;
  age: string;
  weight: string;
  type: string;
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
const HEWAN_URL = `${API_URL}/api/owner_pet/data_hewan`;

const emptyForm: FormData = {
  nama_hewan: "", jenis: "", ras: "", umur: "", berat: "", foto_base64: "",
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function getAuthToken(): string {
  return typeof window !== "undefined"
    ? (sessionStorage.getItem("token") ?? "")
    : "";
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// ── usePressedState hook ──────────────────────────────────────────────────────

function usePressedState() {
  const [pressed, setPressed] = useState(false);
  const pressProps = {
    onMouseDown: () => setPressed(true),
    onMouseUp:   () => setPressed(false),
    onMouseLeave:() => setPressed(false),
    onTouchStart:() => setPressed(true),
    onTouchEnd:  () => setPressed(false),
  };
  return { pressed, pressProps };
}

// ── Form Modal ────────────────────────────────────────────────────────────────

function PetForm({
  initial,
  onSave,
  onCancel,
  saving,
}: {
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

  const cancelPress      = usePressedState();
  const savePress        = usePressedState();
  const removePhotoPress = usePressedState();

  const set =
    (k: keyof FormData) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleFile = async (file: File | null | undefined) => {
    if (!file || !file.type.startsWith("image/")) return;
    const b64 = await fileToBase64(file);
    setPreviewPhoto(b64);
    setForm((f) => ({ ...f, foto_base64: b64 }));
  };

  const valid = form.nama_hewan && form.jenis && form.umur && form.berat;

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "10px 12px",
    borderRadius: 8,
    border: "1.5px solid #e0e0e0",
    fontSize: 14,
    fontFamily: "inherit",
    outline: "none",
    boxSizing: "border-box",
  };
  const labelStyle: React.CSSProperties = {
    fontWeight: 600,
    fontSize: 14,
    display: "block",
    marginBottom: 6,
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.35)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 999,
      }}
    >
      <div
        style={{
          background: "#fff",
          borderRadius: 16,
          padding: "28px 32px",
          width: 480,
          maxHeight: "90vh",
          overflowY: "auto",
          boxShadow: "0 8px 32px rgba(0,0,0,0.18)",
        }}
      >
        <h2 style={{ fontWeight: 700, fontSize: 18, marginBottom: 20 }}>
          {initial ? "Edit Data Hewan" : "Tambah Hewan Baru"}
        </h2>

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {/* ── Upload Foto ── */}
          <div>
            <label style={labelStyle}>
              Foto Hewan{" "}
              <span style={{ fontWeight: 400, color: "#999", fontSize: 12 }}>
                (opsional)
              </span>
            </label>
            <div
              onClick={() => fileRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragging(false);
                handleFile(e.dataTransfer.files[0]);
              }}
              style={{
                position: "relative",
                width: "100%",
                height: 160,
                borderRadius: 12,
                border: `2px dashed ${dragging ? G : previewPhoto ? G : "#d0d0d0"}`,
                background: dragging ? "#f0faf2" : previewPhoto ? "#000" : "#fafafa",
                cursor: "pointer",
                overflow: "hidden",
                transition: "border-color 0.2s",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
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
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      background: "rgba(0,0,0,0.25)",
                    }}
                  />
                  <div
                    style={{
                      position: "relative",
                      zIndex: 1,
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    <Camera size={22} color="#fff" />
                    <span
                      style={{
                        fontSize: 12,
                        color: "#fff",
                        fontWeight: 600,
                        textShadow: "0 1px 3px rgba(0,0,0,0.6)",
                      }}
                    >
                      Klik untuk ganti foto
                    </span>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setPreviewPhoto("");
                      setForm((f) => ({ ...f, foto_base64: "" }));
                    }}
                    {...removePhotoPress.pressProps}
                    style={{
                      position: "absolute",
                      top: 8,
                      right: 8,
                      zIndex: 2,
                      background: removePhotoPress.pressed
                        ? "rgba(0,0,0,0.85)"
                        : "rgba(0,0,0,0.6)",
                      border: "none",
                      borderRadius: "50%",
                      width: 28,
                      height: 28,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: "pointer",
                      transform: removePhotoPress.pressed ? "scale(0.9)" : "scale(1)",
                      transition: "background 0.1s, transform 0.1s",
                    }}
                  >
                    <X size={13} color="#fff" />
                  </button>
                </>
              ) : (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 8,
                    color: "#aaa",
                  }}
                >
                  <Camera size={32} color="#a5d6a7" />
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#666" }}>
                    Klik atau seret foto ke sini
                  </div>
                  <div style={{ fontSize: 11, color: "#bbb" }}>PNG, JPG, JPEG</div>
                </div>
              )}
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              style={{ display: "none" }}
              onChange={(e) => handleFile(e.target.files?.[0])}
            />
          </div>

          <div>
            <label style={labelStyle}>Nama Hewan</label>
            <input
              style={inputStyle}
              value={form.nama_hewan}
              onChange={set("nama_hewan")}
              placeholder="Nama hewan"
            />
          </div>
          <div>
            <label style={labelStyle}>Jenis Hewan</label>
            <select style={inputStyle} value={form.jenis} onChange={set("jenis")}>
              <option value="">-- Pilih Jenis --</option>
              {JENIS_OPTIONS.map((j) => (
                <option key={j} value={j}>{j}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Ras</label>
            <input
              style={inputStyle}
              value={form.ras}
              onChange={set("ras")}
              placeholder="Ras hewan (opsional)"
            />
          </div>
          <div>
            <label style={labelStyle}>Usia (Tahun)</label>
            <input
              style={inputStyle}
              type="number"
              min={0}
              value={form.umur}
              onChange={set("umur")}
              placeholder="Usia"
            />
          </div>
          <div>
            <label style={labelStyle}>Berat (Kg)</label>
            <input
              style={inputStyle}
              type="number"
              min={0}
              step="0.1"
              value={form.berat}
              onChange={set("berat")}
              placeholder="Berat"
            />
          </div>
        </div>

        <div
          style={{
            display: "flex",
            gap: 12,
            justifyContent: "flex-end",
            marginTop: 24,
          }}
        >
          <button
            onClick={onCancel}
            disabled={saving}
            {...cancelPress.pressProps}
            style={{
              padding: "10px 26px",
              borderRadius: 8,
              border: `1.5px solid ${G}`,
              background: cancelPress.pressed ? G : "#fff",
              color: cancelPress.pressed ? "#fff" : G,
              fontWeight: 700,
              fontSize: 14,
              cursor: "pointer",
              fontFamily: "inherit",
              transition: "background 0.15s, color 0.15s",
            }}
          >
            Batal
          </button>

          <button
            onClick={() => valid && onSave(form)}
            disabled={!valid || saving}
            {...savePress.pressProps}
            style={{
              padding: "10px 26px",
              borderRadius: 8,
              border: "none",
              background: !valid || saving
                ? "#a5d6a7"
                : savePress.pressed
                ? "#1b5e20"
                : G,
              color: "#fff",
              fontWeight: 700,
              fontSize: 14,
              cursor: valid && !saving ? "pointer" : "not-allowed",
              fontFamily: "inherit",
              transition: "background 0.15s",
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

function PetCard({
  pet,
  onEdit,
  onBooking,
  onDelete,
}: {
  pet: Pet;
  onEdit(): void;
  onBooking(): void;
  onDelete(): void;
}) {
  const [confirm, setConfirm] = useState(false);

  const editPress       = usePressedState();
  const bookingPress    = usePressedState();
  const hapusPress      = usePressedState();
  const batalPress      = usePressedState();
  const hapusFinalPress = usePressedState();

  return (
    <div
      style={{
        borderRadius: 14,
        overflow: "hidden",
        border: "1.5px solid #e0e0e0",
        background: "#fff",
        boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Foto */}
      <div
        style={{
          position: "relative",
          width: "100%",
          height: 140,
          background: pet.photo ? "#f7f7f7" : G,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
          flexShrink: 0,
        }}
      >
        {pet.photo ? (
          <Image
            src={pet.photo}
            alt={pet.name}
            fill
            unoptimized
            style={{ objectFit: "contain" }}
          />
        ) : (
          // ✅ Ganti emoji dengan icon lucide
          <PawPrint size={52} color="#fff" />
        )}
      </div>

      {/* Nama & Jenis */}
      <div style={{ background: G, textAlign: "center", padding: "8px 10px" }}>
        <div style={{ fontWeight: 700, fontSize: 14, color: "#fff" }}>{pet.name}</div>
        <div style={{ fontSize: 11, color: "#c8e6c9", marginTop: 2 }}>
          {pet.type} · {pet.breed}
        </div>
      </div>

      {/* Usia & Berat */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 1,
          background: "#f0f0f0",
          borderTop: "1px solid #e0e0e0",
        }}
      >
        {[["Usia", pet.age], ["Berat", pet.weight]].map(([label, val]) => (
          <div
            key={label}
            style={{ background: "#fafafa", padding: "8px 10px", textAlign: "center" }}
          >
            <div style={{ fontSize: 10, color: "#888" }}>{label}</div>
            <div style={{ fontWeight: 700, fontSize: 13 }}>{val}</div>
          </div>
        ))}
      </div>

      {/* Tombol Edit & Booking */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, padding: "10px 10px 6px" }}>
        <button
          onClick={onEdit}
          {...editPress.pressProps}
          style={{
            padding: "7px 0",
            borderRadius: 8,
            border: `1.5px solid ${G}`,
            background: editPress.pressed ? G : "#fff",
            color: editPress.pressed ? "#fff" : G,
            fontWeight: 700,
            fontSize: 12,
            cursor: "pointer",
            fontFamily: "inherit",
            transition: "background 0.15s, color 0.15s",
          }}
        >
          Edit
        </button>

        <button
          onClick={onBooking}
          {...bookingPress.pressProps}
          style={{
            padding: "7px 0",
            borderRadius: 8,
            border: "none",
            background: bookingPress.pressed ? "#1b5e20" : G,
            color: "#fff",
            fontWeight: 700,
            fontSize: 12,
            cursor: "pointer",
            fontFamily: "inherit",
            transition: "background 0.15s",
          }}
        >
          Booking
        </button>
      </div>

      {/* Tombol Hapus */}
      <div style={{ padding: "0 10px 10px" }}>
        {!confirm ? (
          <button
            onClick={() => setConfirm(true)}
            {...hapusPress.pressProps}
            style={{
              width: "100%",
              padding: "6px 0",
              borderRadius: 8,
              border: "1.5px solid #e53935",
              background: hapusPress.pressed ? "#e53935" : "#fff",
              color: hapusPress.pressed ? "#fff" : "#e53935",
              fontWeight: 600,
              fontSize: 12,
              cursor: "pointer",
              fontFamily: "inherit",
              transition: "background 0.15s, color 0.15s",
            }}
          >
            Hapus
          </button>
        ) : (
          <div style={{ display: "flex", gap: 5 }}>
            <button
              onClick={() => setConfirm(false)}
              {...batalPress.pressProps}
              style={{
                flex: 1,
                padding: "6px 0",
                borderRadius: 8,
                border: "1.5px solid #e0e0e0",
                background: batalPress.pressed ? "#e0e0e0" : "#fff",
                color: "#555",
                fontWeight: 600,
                fontSize: 12,
                cursor: "pointer",
                fontFamily: "inherit",
                transition: "background 0.15s",
              }}
            >
              Batal
            </button>

            <button
              onClick={onDelete}
              {...hapusFinalPress.pressProps}
              style={{
                flex: 1,
                padding: "6px 0",
                borderRadius: 8,
                border: "none",
                background: hapusFinalPress.pressed ? "#b71c1c" : "#e53935",
                color: "#fff",
                fontWeight: 700,
                fontSize: 12,
                cursor: "pointer",
                fontFamily: "inherit",
                transition: "background 0.15s",
              }}
            >
              Hapus!
            </button>
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
  const [showForm, setShowForm] = useState(false);
  const [editPet,  setEditPet]  = useState<Pet | null>(null);

  const { toasts, toast, removeToast } = useToast();
  const token = getAuthToken();

  const tambahPress = usePressedState();

  const fetchPets = async (signal?: AbortSignal) => {
    setLoading(true);
    try {
      const r = await fetch(HEWAN_URL, {
        headers: { Authorization: `Bearer ${token}` },
        signal,
      });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const res = await r.json();
      if (res.success) setPets(res.data);
    } catch (err) {
      if (!(err instanceof DOMException && err.name === "AbortError")) {
        toast.error("Gagal memuat data", "Tidak dapat mengambil data hewan dari server.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!token) { router.push("/auth/login"); return; }
    const controller = new AbortController();
    fetchPets(controller.signal);
    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, router]);

  const openAdd   = () => { setEditPet(null); setShowForm(true); };
  const openEdit  = (pet: Pet) => { setEditPet(pet); setShowForm(true); };
  const closeForm = () => { setShowForm(false); setEditPet(null); };

  const handleSave = async (form: FormData) => {
    setSaving(true);
    try {
      const isEdit = !!editPet;
      const body: Record<string, string> = {
        nama_hewan: form.nama_hewan,
        jenis:      form.jenis,
        ras:        form.ras,
        umur:       form.umur,
        berat:      form.berat,
      };
      if (form.foto_base64) body.foto_base64 = form.foto_base64;

      const url    = isEdit ? `${HEWAN_URL}/${editPet!.id_hewan}` : HEWAN_URL;
      const method = isEdit ? "PUT" : "POST";

      const r = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization:  `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });
      const data = await r.json();

      if (data.success) {
        closeForm();
        await fetchPets();
        if (isEdit) {
          toast.success("Data hewan diperbarui!", `${form.nama_hewan} berhasil disimpan.`);
        } else {
          toast.success("Hewan berhasil ditambahkan!", `${form.nama_hewan} sudah masuk ke daftar hewan Anda.`);
        }
      } else {
        toast.error("Gagal menyimpan data", data.message ?? "Terjadi kesalahan saat menyimpan.");
      }
    } catch {
      toast.error("Gagal terhubung ke server", "Periksa koneksi internet Anda.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (pet: Pet) => {
    try {
      const r    = await fetch(`${HEWAN_URL}/${pet.id_hewan}`, {
        method:  "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await r.json();

      if (data.success) {
        setPets((p) => p.filter((x) => x.id_hewan !== pet.id_hewan));
        toast.info("Hewan dihapus", `${pet.nama_hewan} telah dihapus dari daftar Anda.`);
      } else {
        toast.error("Gagal menghapus", data.message ?? "Terjadi kesalahan saat menghapus data.");
      }
    } catch {
      toast.error("Gagal terhubung ke server", "Periksa koneksi internet Anda.");
    }
  };

  const handleBooking = (idHewan: number) => {
    sessionStorage.setItem("sipeka_booking_pet", String(idHewan));
    router.push("/owner_pet/booking_layanan");
  };

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden", fontFamily: "'Poppins', sans-serif" }}>
      <Sidebar activePage="hewan" />

      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          overflow: "auto",
          background: "#f9f9f9",
        }}
      >
        <Header title="Data Hewan" subtitle="Kelola data hewan peliharaan Anda" />

        <div style={{ padding: "24px 28px" }}>

          {/* ── Tombol Tambah Hewan ── */}
          <button
            onClick={openAdd}
            {...tambahPress.pressProps}
            style={{
              padding: "10px 20px",
              borderRadius: 8,
              border: `2px solid ${G}`,
              background: tambahPress.pressed ? G : "#fff",
              color: tambahPress.pressed ? "#fff" : G,
              fontWeight: 700,
              fontSize: 14,
              cursor: "pointer",
              marginBottom: 24,
              fontFamily: "inherit",
              transition: "background 0.15s, color 0.15s",
            }}
          >
            + Tambah Hewan
          </button>

          {loading ? (
            <div style={{ textAlign: "center", padding: "60px 0", color: "#888" }}>
              {/* ✅ Ganti emoji ⏳ dengan icon lucide */}
              <Clock size={32} color="#aaa" style={{ marginBottom: 8 }} />
              <div style={{ fontSize: 14 }}>Memuat data hewan...</div>
            </div>
          ) : pets.length === 0 ? (
            <div style={{ textAlign: "center", padding: "60px 0", color: "#999" }}>
              {/* ✅ Ganti emoji 🐾 dengan icon lucide */}
              <PawPrint size={48} color="#c8e6c9" style={{ marginBottom: 12 }} />
              <div style={{ fontSize: 16, fontWeight: 600 }}>Belum ada hewan</div>
              <div style={{ fontSize: 13, marginTop: 4 }}>
                Klik + Tambah Hewan untuk menambahkan hewan peliharaan
              </div>
            </div>
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(5, 1fr)",
                gap: 16,
              }}
            >
              {pets.map((pet) => (
                <PetCard
                  key={pet.id_hewan}
                  pet={pet}
                  onEdit={() => openEdit(pet)}
                  onBooking={() => handleBooking(pet.id_hewan)}
                  onDelete={() => handleDelete(pet)}
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

      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
}