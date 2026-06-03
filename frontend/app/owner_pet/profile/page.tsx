
"use client";

import { useState, useEffect, useRef, ChangeEvent } from "react";
import Image from "next/image";
import Sidebar from "@/components/Sidebar_owner_pet";
import Header from "@/components/Header";
import { useRouter } from "next/navigation";
import { ToastContainer, useToast } from "@/components/Toast";
import { User, MapPin, Save, Camera, Trash2 } from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

interface ProfileData {
  id_user: number;
  nama: string;
  email: string;
  no_hp: string | null;
  role: string;
  foto_profile: string | null;
  provinsi?: string;
  kota?: string;
  kecamatan?: string;
  kode_pos?: string;
  alamat_lengkap?: string;
}

interface FormData {
  nama: string;
  email: string;
  no_hp: string;
  kata_sandi: string;
  provinsi: string;
  kota: string;
  kecamatan: string;
  kode_pos: string;
  alamat_lengkap: string;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
const G = "#2e7d32";

// ── Helpers ───────────────────────────────────────────────────────────────────

function getAuthToken(): string {
  return typeof window !== "undefined"
    ? (sessionStorage.getItem("token") ?? "")
    : "";
}

// ── Styles ────────────────────────────────────────────────────────────────────

const cardStyle: React.CSSProperties = {
  background: "#fff",
  borderRadius: 12,
  border: "1px solid #f0f0f0",
  padding: "20px 24px",
  marginBottom: 18,
};

const sectionTitleStyle: React.CSSProperties = {
  fontSize: 14,
  fontWeight: 700,
  color: G,
  marginBottom: 16,
  marginTop: 0,
  paddingBottom: 10,
  borderBottom: "1.5px solid #e8f5e9",
  display: "flex",
  alignItems: "center",
  gap: 8,
};

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: 12,
  fontWeight: 600,
  color: "#666",
  marginBottom: 5,
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  border: "1.5px solid #e0e0e0",
  borderRadius: 8,
  padding: "9px 12px",
  fontSize: 13,
  color: "#1a1a1a",
  outline: "none",
  boxSizing: "border-box",
  fontFamily: "inherit",
  background: "#fff",
  transition: "border-color .15s",
};

// ── Eye Icon ──────────────────────────────────────────────────────────────────

function EyeIcon({ open }: { open: boolean }) {
  return open ? (
    <svg xmlns="http://www.w3.org/2000/svg" width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ) : (
    <svg xmlns="http://www.w3.org/2000/svg" width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  );
}

// ── InputField ────────────────────────────────────────────────────────────────

function InputField({
  label, name, type = "text", value, onChange, placeholder, readOnly,
}: {
  label: string; name: string; type?: string; value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string; readOnly?: boolean;
}) {
  const [show,    setShow]    = useState(false);
  const [focused, setFocused] = useState(false);
  const isPassword = type === "password";

  return (
    <div>
      <label style={labelStyle}>{label}</label>
      <div style={{ position: "relative" }}>
        <input
          name={name}
          type={isPassword ? (show ? "text" : "password") : type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          readOnly={readOnly}
          style={{
            ...inputStyle,
            borderColor: focused ? G : "#e0e0e0",
            paddingRight: isPassword ? 36 : undefined,
            background: readOnly ? "#f9f9f9" : "#fff",
          }}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShow(s => !s)}
            style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex", alignItems: "center" }}
          >
            <EyeIcon open={show} />
          </button>
        )}
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function ProfilePage() {
  const router  = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const token   = getAuthToken();

  const { toasts, toast, removeToast } = useToast();

  const [profile,       setProfile]       = useState<ProfileData | null>(null);
  const [loading,       setLoading]       = useState(true);
  const [saving,        setSaving]        = useState(false);
  const [uploadingFoto, setUploadingFoto] = useState(false);
  const [deletingFoto,  setDeletingFoto]  = useState(false);

  const [formData, setFormData] = useState<FormData>({
    nama: "", email: "", no_hp: "", kata_sandi: "",
    provinsi: "", kota: "", kecamatan: "", kode_pos: "", alamat_lengkap: "",
  });

  // ── Fetch profile ──────────────────────────────────────────────────────────
  async function fetchProfile() {
    try {
      const res  = await fetch(`${API_URL}/api/owner_pet/profile`, {
        headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
      });
      const data = await res.json();
      if (data.success) {
        const p = data.data as ProfileData;
        setProfile(p);
        setFormData({
          nama:           p.nama           ?? "",
          email:          p.email          ?? "",
          no_hp:          p.no_hp          ?? "",
          kata_sandi:     "",
          provinsi:       p.provinsi       ?? "",
          kota:           p.kota           ?? "",
          kecamatan:      p.kecamatan      ?? "",
          kode_pos:       p.kode_pos       ?? "",
          alamat_lengkap: p.alamat_lengkap ?? "",
        });
      }
    } catch {
      toast.error("Gagal memuat profil", "Tidak dapat terhubung ke server.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!token) { router.push("/auth/login"); return; }
    fetchProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // ── Submit form ────────────────────────────────────────────────────────────
  async function handleSubmit() {
    setSaving(true);
    try {
      const body: Record<string, string> = {
        nama:           formData.nama,
        email:          formData.email,
        no_hp:          formData.no_hp,
        provinsi:       formData.provinsi,
        kota:           formData.kota,
        kecamatan:      formData.kecamatan,
        kode_pos:       formData.kode_pos,
        alamat_lengkap: formData.alamat_lengkap,
      };
      if (formData.kata_sandi) body.kata_sandi = formData.kata_sandi;

      const res  = await fetch(`${API_URL}/api/owner_pet/profile`, {
        method:  "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}`, Accept: "application/json" },
        body:    JSON.stringify(body),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Profil diperbarui!", "Perubahan Anda telah disimpan.");
        setFormData(prev => ({ ...prev, kata_sandi: "" }));
        fetchProfile();
      } else {
        toast.error("Gagal menyimpan", data.message ?? "Terjadi kesalahan.");
      }
    } catch {
      toast.error("Gagal terhubung ke server", "Periksa koneksi internet Anda.");
    } finally {
      setSaving(false);
    }
  }

  // ── Upload foto ────────────────────────────────────────────────────────────
  async function handleFotoChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingFoto(true);
    try {
      const fd = new FormData();
      fd.append("foto", file);

      const res  = await fetch(`${API_URL}/api/owner_pet/profile/foto`, {
        method:  "POST",
        headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
        body:    fd,
      });

      if (!res.ok) {
        const text = await res.text();
        console.error("[UploadFoto] error:", text);
        throw new Error(`Server error ${res.status}`);
      }

      const data = await res.json();
      if (data.success) {
        toast.success("Foto profil diperbarui!", "Foto baru Anda sudah tersimpan.");
        fetchProfile();
      } else {
        throw new Error(data.message ?? "Gagal upload foto.");
      }
    } catch (err: unknown) {
      toast.error("Gagal upload foto", err instanceof Error ? err.message : "Terjadi kesalahan saat mengunggah foto.");
    } finally {
      setUploadingFoto(false);
      e.target.value = "";
    }
  }

  // ── Hapus foto profil ──────────────────────────────────────────────────────
  async function handleFotoDelete() {
    if (!profile?.foto_profile) return;
    if (!window.confirm("Hapus foto profil? Foto akan diganti dengan avatar default.")) return;

    setDeletingFoto(true);
    try {
      const res = await fetch(`${API_URL}/api/owner_pet/profile/foto`, {
        method:  "DELETE",
        headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
      });

      if (!res.ok) {
        const text = await res.text();
        console.error("[HapusFoto] error:", text);
        throw new Error(`Server error ${res.status}`);
      }

      const data = await res.json();
      if (data.success) {
        toast.info("Foto profil dihapus", "Avatar default sekarang digunakan.");
        fetchProfile();
      } else {
        throw new Error(data.message ?? "Gagal menghapus foto.");
      }
    } catch (err: unknown) {
      toast.error("Gagal menghapus foto", err instanceof Error ? err.message : "Terjadi kesalahan saat menghapus foto.");
    } finally {
      setDeletingFoto(false);
    }
  }

  if (loading) {
    return (
      <div style={{ display: "flex", height: "100vh", alignItems: "center", justifyContent: "center", fontFamily: "'Poppins', sans-serif", background: "#f9f9f9" }}>
        <p style={{ color: "#888" }}>Memuat profil...</p>
      </div>
    );
  }

  const avatarSrc = profile?.foto_profile ?? `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(formData.nama || "user")}`;
  const isBusy = uploadingFoto || deletingFoto;

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden", fontFamily: "'Poppins', sans-serif", background: "#f9f9f9" }}>
      <Sidebar activePage="profile" />

      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "auto" }}>
        <Header title="Profile Saya" subtitle="Kelola Informasi Profile Anda Sebagai Pemilik Hewan Peliharaan" />

        <main style={{ flex: 1, padding: "22px 28px" }}>

          {/* ── Avatar Card ─────────────────────────────────────────────────── */}
          <div style={{ ...cardStyle, display: "flex", alignItems: "center", gap: 20 }}>

            <div style={{ position: "relative", flexShrink: 0, width: 80, height: 80 }}>
              <div style={{ width: 80, height: 80, borderRadius: "50%", overflow: "hidden", border: `2.5px solid ${G}`, background: "#e8f5e9", opacity: isBusy ? 0.5 : 1, transition: "opacity .2s", boxSizing: "border-box" }}>
                <Image src={avatarSrc} alt="Avatar" width={80} height={80} unoptimized style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
              </div>

              {isBusy && (
                <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", pointerEvents: "none" }}>
                  <div style={{ width: 22, height: 22, border: `3px solid ${G}`, borderTopColor: "transparent", borderRadius: "50%", animation: "spin .7s linear infinite" }} />
                </div>
              )}

              <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/jpg,image/webp" style={{ display: "none" }} onChange={handleFotoChange} />

              {/* Tombol kamera */}
              <button
                onClick={() => fileRef.current?.click()}
                disabled={isBusy}
                title="Ganti foto profil"
                style={{ position: "absolute", bottom: 0, right: profile?.foto_profile ? 22 : -2, background: "#fff", border: "1.5px solid #e0e0e0", borderRadius: "50%", width: 26, height: 26, cursor: isBusy ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 1px 4px rgba(0,0,0,.1)", padding: 0 }}
              >
                <Camera size={13} color="#555" />
              </button>

              {/* Tombol hapus foto */}
              {profile?.foto_profile && (
                <button
                  onClick={handleFotoDelete}
                  disabled={isBusy}
                  title="Hapus foto profil"
                  style={{ position: "absolute", bottom: 0, right: -4, background: "#fff", border: "1.5px solid #ffcdd2", borderRadius: "50%", width: 26, height: 26, cursor: isBusy ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 1px 4px rgba(0,0,0,.1)", padding: 0 }}
                >
                  <Trash2 size={12} color="#e53935" />
                </button>
              )}
            </div>

            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 800, fontSize: 17, color: "#1a1a1a" }}>{formData.nama || "-"}</div>
              <div style={{ fontSize: 12, color: "#aaa", marginTop: 4, display: "flex", alignItems: "center", gap: 4 }}>
                Pemilik Hewan
                {formData.kota && (
                  <>
                    <span>·</span>
                    <MapPin size={12} color="#aaa" />
                    {formData.kota}{formData.provinsi ? `, ${formData.provinsi}` : ""}
                  </>
                )}
              </div>
              {uploadingFoto && <div style={{ marginTop: 6, fontSize: 11, color: "#888" }}>Mengupload foto...</div>}
              {deletingFoto  && <div style={{ marginTop: 6, fontSize: 11, color: "#e53935" }}>Menghapus foto...</div>}
            </div>
          </div>

          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

          {/* ── Informasi Akun ───────────────────────────────────────────────── */}
          <div style={cardStyle}>
            <h2 style={sectionTitleStyle}><User size={15} color={G} /> Informasi Akun</h2>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <InputField label="Nama Lengkap"    name="nama"       value={formData.nama}       onChange={handleChange} />
              <InputField label="Email"           name="email"      type="email" value={formData.email} onChange={handleChange} />
              <InputField label="No. Telepon"     name="no_hp"      value={formData.no_hp}      onChange={handleChange} />
              <InputField label="Kata Sandi Baru" name="kata_sandi" type="password" value={formData.kata_sandi} onChange={handleChange} placeholder="Kosongkan jika tidak ingin ubah" />
            </div>
          </div>

          {/* ── Alamat ──────────────────────────────────────────────────────── */}
          <div style={cardStyle}>
            <h2 style={sectionTitleStyle}><MapPin size={15} color={G} /> Alamat</h2>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <InputField label="Provinsi"        name="provinsi"  value={formData.provinsi}  onChange={handleChange} />
              <InputField label="Kota/Kabupaten"  name="kota"      value={formData.kota}      onChange={handleChange} />
              <InputField label="Kecamatan"       name="kecamatan" value={formData.kecamatan} onChange={handleChange} />
              <InputField label="Kode Pos"        name="kode_pos"  value={formData.kode_pos}  onChange={handleChange} />
              <div style={{ gridColumn: "1 / -1" }}>
                <label style={labelStyle}>Alamat Lengkap</label>
                <textarea name="alamat_lengkap" value={formData.alamat_lengkap} onChange={handleChange} rows={3}
                  style={{ ...inputStyle, resize: "vertical", lineHeight: 1.6 }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = G)}
                  onBlur={(e) => (e.currentTarget.style.borderColor = "#e0e0e0")}
                />
              </div>
            </div>
          </div>

          {/* ── Tombol Aksi ─────────────────────────────────────────────────── */}
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, paddingBottom: 24 }}>
            <button
              onClick={() => window.location.reload()}
              style={{ padding: "10px 22px", borderRadius: 9, border: `1.5px solid ${G}`, background: "#fff", color: G, fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "#e8f5e9")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "#fff")}
            >
              Batalkan
            </button>

            <button
              onClick={handleSubmit}
              disabled={saving}
              style={{ padding: "10px 26px", borderRadius: 9, border: "none", background: saving ? "#a5d6a7" : G, color: "#fff", fontSize: 13, fontWeight: 700, cursor: saving ? "not-allowed" : "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", gap: 7, transition: "background .2s" }}
              onMouseEnter={(e) => { if (!saving) e.currentTarget.style.background = "#1b5e20"; }}
              onMouseLeave={(e) => { if (!saving) e.currentTarget.style.background = G; }}
            >
              {saving ? <>Menyimpan...</> : <><Save size={14} /> Simpan Perubahan</>}
            </button>
          </div>

        </main>
      </div>

      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
}
