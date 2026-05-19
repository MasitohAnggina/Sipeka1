"use client";

import { useState, useEffect, useRef, ChangeEvent } from "react";
import Image from "next/image";
import Sidebar from "@/components/Sidebar_owner_pet";
import Header from "@/components/Header";
import { useRouter } from "next/navigation";

// ── Types ─────────────────────────────────────────────────────────────────────

interface ProfileData {
  id_user: number;
  nama: string;
  email: string;
  no_hp: string | null;
  role: string;
  foto_profile: string | null;
  alamat: {
    id_alamat: number;
    provinsi: string;
    kota: string;
    kecamatan: string;
    kode_pos: string;
    alamat_lengkap: string;
  } | null;
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
    ? (localStorage.getItem("token") ?? "")
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

// ── InputField ────────────────────────────────────────────────────────────────

interface InputFieldProps {
  label: string;
  name: string;
  value: string;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  type?: string;
  placeholder?: string;
}

function InputField({ label, name, value, onChange, type = "text", placeholder = "" }: InputFieldProps) {
  return (
    <div>
      <label style={labelStyle}>{label}</label>
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        style={inputStyle}
        onFocus={e => (e.currentTarget.style.borderColor = G)}
        onBlur={e => (e.currentTarget.style.borderColor = "#e0e0e0")}
      />
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function ProfilePage() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);

  const [profile,       setProfile]       = useState<ProfileData | null>(null);
  const [loading,       setLoading]       = useState(true);
  const [saving,        setSaving]        = useState(false);
  const [saved,         setSaved]         = useState(false);
  const [uploadingFoto, setUploadingFoto] = useState(false);
  const [error,         setError]         = useState("");
  const [fotoError,     setFotoError]     = useState("");
  const [fotoSuccess,   setFotoSuccess]   = useState("");

  const [formData, setFormData] = useState<FormData>({
    nama:           "",
    email:          "",
    no_hp:          "",
    kata_sandi:     "",
    provinsi:       "",
    kota:           "",
    kecamatan:      "",
    kode_pos:       "",
    alamat_lengkap: "",
  });

  const token = getAuthToken();

  // ── Fetch profile ────────────────────────────────────────────────────────
  const fetchProfile = async (signal?: AbortSignal) => {
    try {
      const r = await fetch(`${API_URL}/api/owner_pet/profile`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
        signal,
      });
      if (!r.ok) throw new Error();
      const res = await r.json();
      if (res.success) {
        const d: ProfileData = res.data;
        setProfile(d);
        setFormData({
          nama:           d.nama            ?? "",
          email:          d.email           ?? "",
          no_hp:          d.no_hp           ?? "",
          kata_sandi:     "",
          provinsi:       d.alamat?.provinsi        ?? "",
          kota:           d.alamat?.kota            ?? "",
          kecamatan:      d.alamat?.kecamatan       ?? "",
          kode_pos:       d.alamat?.kode_pos        ?? "",
          alamat_lengkap: d.alamat?.alamat_lengkap  ?? "",
        });
      }
    } catch {
      if (!signal?.aborted) setError("Gagal memuat profil.");
    }
  };

  useEffect(() => {
    if (!token) { router.push("/auth/login_dokter"); return; }

    const controller = new AbortController();
    (async () => {
      setLoading(true);
      await fetchProfile(controller.signal);
      setLoading(false);
    })();

    return () => controller.abort();
  }, [token, router]);

  // ── Handlers ─────────────────────────────────────────────────────────────

  function handleChange(e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setSaved(false);
  }

  // Simpan semua (akun + alamat) dalam satu klik
  async function handleSubmit() {
    setSaving(true);
    setError("");
    try {
      // 1. Simpan informasi akun
      const bodyAkun: Record<string, string> = {
        nama:  formData.nama,
        email: formData.email,
        no_hp: formData.no_hp,
      };
      if (formData.kata_sandi) bodyAkun.kata_sandi = formData.kata_sandi;

      const resAkun = await fetch(`${API_URL}/api/owner_pet/profile`, {
        method:  "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body:    JSON.stringify(bodyAkun),
      });
      const dataAkun = await resAkun.json();
      if (!dataAkun.success) throw new Error(dataAkun.message ?? "Gagal menyimpan informasi akun.");

      // 2. Simpan alamat
      const resAlamat = await fetch(`${API_URL}/api/owner_pet/profile/alamat`, {
        method:  "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body:    JSON.stringify({
          provinsi:       formData.provinsi,
          kota:           formData.kota,
          kecamatan:      formData.kecamatan,
          kode_pos:       formData.kode_pos,
          alamat_lengkap: formData.alamat_lengkap,
        }),
      });
      const dataAlamat = await resAlamat.json();
      if (!dataAlamat.success) throw new Error(dataAlamat.message ?? "Gagal menyimpan alamat.");

      setSaved(true);
      setFormData(f => ({ ...f, kata_sandi: "" }));
      setTimeout(() => setSaved(false), 3000);
      fetchProfile();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Tidak dapat terhubung ke server.");
    } finally {
      setSaving(false);
    }
  }

  // Upload foto
  async function handleFotoChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowed = ["image/jpeg", "image/png", "image/jpg", "image/webp"];
    if (!allowed.includes(file.type)) {
      setFotoError("Format file harus JPEG, PNG, atau WEBP");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setFotoError("Ukuran file maksimal 2MB");
      return;
    }

    setFotoError("");
    setFotoSuccess("");
    setUploadingFoto(true);

    try {
      const formDataUpload = new FormData();
      formDataUpload.append("foto", file);

      const res  = await fetch(`${API_URL}/api/owner_pet/profile/foto`, {
        method:  "POST",
        headers: { Authorization: `Bearer ${token}` },
        body:    formDataUpload,
      });
      const data = await res.json();
      if (data.success) {
        setFotoSuccess("Foto berhasil diperbarui");
        setTimeout(() => setFotoSuccess(""), 3000);
        fetchProfile();
      } else {
        setFotoError(data.message ?? "Gagal upload foto.");
      }
    } catch {
      setFotoError("Terjadi kesalahan saat upload foto.");
    } finally {
      setUploadingFoto(false);
      e.target.value = "";
    }
  }

  // ── Loading ───────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div style={{ display: "flex", height: "100vh", alignItems: "center", justifyContent: "center", fontFamily: "'Poppins', sans-serif", background: "#f9f9f9" }}>
        <p style={{ color: "#888" }}>Memuat profil...</p>
      </div>
    );
  }

  const avatarSrc = profile?.foto_profile
    ?? `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(formData.nama || "user")}`;

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden", fontFamily: "'Poppins', sans-serif", background: "#f9f9f9" }}>
      <Sidebar activePage="profile" />

      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "auto" }}>
        <Header
          title="Profile Saya"
          subtitle="Kelola Informasi Profile Anda Sebagai Pemilik Hewan Peliharaan"
        />

        <main style={{ flex: 1, padding: "22px 28px" }}>

          {/* Error */}
          {error && (
            <div style={{ background: "#ffebee", border: "1px solid #ffcdd2", borderRadius: 8, padding: "10px 14px", marginBottom: 16, fontSize: 13, color: "#c62828" }}>
              ⚠️ {error}
            </div>
          )}

          {/* ── Avatar Card ── */}
          <div style={{ ...cardStyle, display: "flex", alignItems: "center", gap: 20 }}>
            <div style={{ position: "relative", flexShrink: 0 }}>
              <Image
                src={avatarSrc}
                alt="Avatar"
                width={80}
                height={80}
                unoptimized
                style={{
                  borderRadius: "50%", objectFit: "cover",
                  background: "#e8f5e9", border: `2.5px solid ${G}`,
                  opacity: uploadingFoto ? 0.5 : 1, transition: "opacity .2s",
                }}
              />
              {uploadingFoto && (
                <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <div style={{ width: 22, height: 22, border: `3px solid ${G}`, borderTopColor: "transparent", borderRadius: "50%", animation: "spin .7s linear infinite" }} />
                </div>
              )}
              <input
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/png,image/jpg,image/webp"
                style={{ display: "none" }}
                onChange={handleFotoChange}
              />
              <button
                onClick={() => fileRef.current?.click()}
                disabled={uploadingFoto}
                title="Ganti foto profil"
                style={{
                  position: "absolute", bottom: 0, right: 0,
                  background: "#fff", border: "1.5px solid #e0e0e0",
                  borderRadius: "50%", width: 26, height: 26,
                  cursor: uploadingFoto ? "not-allowed" : "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  boxShadow: "0 1px 4px rgba(0,0,0,.1)",
                }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth={2}>
                  <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
                  <circle cx="12" cy="13" r="4" />
                </svg>
              </button>
            </div>

            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 800, fontSize: 17, color: "#1a1a1a" }}>{formData.nama || "-"}</div>
              <div style={{ fontSize: 12, color: "#aaa", marginTop: 4 }}>
                Pemilik Hewan
                {formData.kota && ` · 📍 ${formData.kota}${formData.provinsi ? ", " + formData.provinsi : ""}`}
              </div>
              {fotoError   && <div style={{ marginTop: 6, fontSize: 11, color: "#c62828" }}>⚠ {fotoError}</div>}
              {fotoSuccess && <div style={{ marginTop: 6, fontSize: 11, color: G }}>✓ {fotoSuccess}</div>}
              {uploadingFoto && <div style={{ marginTop: 6, fontSize: 11, color: "#888" }}>Mengupload foto...</div>}
            </div>
          </div>

          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

          {/* ── Informasi Akun ── */}
          <div style={cardStyle}>
            <h2 style={sectionTitleStyle}>👤 Informasi Akun</h2>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <InputField
                label="Nama Lengkap" name="nama" value={formData.nama}
                onChange={handleChange}
              />
              <InputField
                label="Email" name="email" type="email" value={formData.email}
                onChange={handleChange}
              />
              <InputField
                label="No. Telepon" name="no_hp" value={formData.no_hp}
                onChange={handleChange}
              />
              <InputField
                label="Kata Sandi Baru" name="kata_sandi" type="password"
                value={formData.kata_sandi}
                onChange={handleChange}
                placeholder="Kosongkan jika tidak ingin ubah"
              />
            </div>
          </div>

          {/* ── Alamat ── */}
          <div style={cardStyle}>
            <h2 style={sectionTitleStyle}>📍 Alamat</h2>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <InputField label="Provinsi"       name="provinsi"  value={formData.provinsi}  onChange={handleChange} />
              <InputField label="Kota/Kabupaten" name="kota"      value={formData.kota}      onChange={handleChange} />
              <InputField label="Kecamatan"      name="kecamatan" value={formData.kecamatan} onChange={handleChange} />
              <InputField label="Kode Pos"       name="kode_pos"  value={formData.kode_pos}  onChange={handleChange} />
              <div style={{ gridColumn: "1 / -1" }}>
                <label style={labelStyle}>Alamat Lengkap</label>
                <textarea
                  name="alamat_lengkap"
                  value={formData.alamat_lengkap}
                  onChange={handleChange}
                  rows={3}
                  style={{ ...inputStyle, resize: "vertical", lineHeight: 1.6 }}
                  onFocus={e => (e.currentTarget.style.borderColor = G)}
                  onBlur={e => (e.currentTarget.style.borderColor = "#e0e0e0")}
                />
              </div>
            </div>
          </div>

          {/* ── Tombol ── */}
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, paddingBottom: 24 }}>
            <button
              onClick={() => window.location.reload()}
              style={{
                padding: "10px 22px", borderRadius: 9, border: `1.5px solid ${G}`,
                background: "#fff", color: G, fontSize: 13, fontWeight: 700,
                cursor: "pointer", fontFamily: "inherit",
              }}
              onMouseEnter={e => (e.currentTarget.style.background = "#e8f5e9")}
              onMouseLeave={e => (e.currentTarget.style.background = "#fff")}
            >
              Batalkan
            </button>
            <button
              onClick={handleSubmit}
              disabled={saving}
              style={{
                padding: "10px 26px", borderRadius: 9, border: "none",
                background: saved ? "#4caf50" : saving ? "#a5d6a7" : G,
                color: "#fff", fontSize: 13, fontWeight: 700,
                cursor: saving ? "not-allowed" : "pointer",
                fontFamily: "inherit", display: "flex", alignItems: "center",
                gap: 7, transition: "background .2s",
              }}
              onMouseEnter={e => { if (!saved && !saving) e.currentTarget.style.background = "#1b5e20"; }}
              onMouseLeave={e => { if (!saved && !saving) e.currentTarget.style.background = G; }}
            >
              {saved ? <>✓ Tersimpan!</> : saving ? <>Menyimpan...</> : <>💾 Simpan Perubahan</>}
            </button>
          </div>

        </main>
      </div>
    </div>
  );
}