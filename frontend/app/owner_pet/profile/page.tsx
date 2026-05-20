"use client";

import { useState, useEffect, useRef, ChangeEvent } from "react";
import Image from "next/image";
import Sidebar from "@/components/Sidebar_owner_pet";
import Header from "@/components/Header";
import { useRouter } from "next/navigation";
import { ToastContainer, useToast } from "@/components/Toast";

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
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={16}
      height={16}
      viewBox="0 0 24 24"
      fill="none"
      stroke="#888"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ) : (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={16}
      height={16}
      viewBox="0 0 24 24"
      fill="none"
      stroke="#888"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94" />
      <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  );
}

// ── InputField ────────────────────────────────────────────────────────────────

interface InputFieldProps {
  label: string;
  name: string;
  value: string;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  type?: string;
  placeholder?: string;
}

function InputField({
  label,
  name,
  value,
  onChange,
  type = "text",
  placeholder = "",
}: InputFieldProps) {
  const [showPwd, setShowPwd] = useState(false);
  const isPassword = type === "password";
  const inputType = isPassword ? (showPwd ? "text" : "password") : type;

  return (
    <div>
      <label style={labelStyle}>{label}</label>
      <div style={{ position: "relative" }}>
        <input
          type={inputType}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          style={{ ...inputStyle, paddingRight: isPassword ? 38 : 12 }}
          onFocus={(e) => (e.currentTarget.style.borderColor = G)}
          onBlur={(e) => (e.currentTarget.style.borderColor = "#e0e0e0")}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPwd((v) => !v)}
            tabIndex={-1}
            title={showPwd ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
            style={{
              position: "absolute",
              right: 10,
              top: "50%",
              transform: "translateY(-50%)",
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: 0,
              display: "flex",
              alignItems: "center",
            }}
          >
            <EyeIcon open={showPwd} />
          </button>
        )}
      </div>
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
  const [uploadingFoto, setUploadingFoto] = useState(false);

  const [formData, setFormData] = useState<FormData>({
    nama: "",
    email: "",
    no_hp: "",
    kata_sandi: "",
    provinsi: "",
    kota: "",
    kecamatan: "",
    kode_pos: "",
    alamat_lengkap: "",
  });

  // ── Toast ──────────────────────────────────────────────────────────────────
  const { toasts, toast, removeToast } = useToast();

  const token = getAuthToken();

  // ── Fetch profile ──────────────────────────────────────────────────────────
  const fetchProfile = async (signal?: AbortSignal) => {
    try {
      const r = await fetch(`${API_URL}/api/owner_pet/profile`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
        signal,
      });

      if (!r.ok) {
        const text = await r.text();
        console.error("[fetchProfile] error:", text);
        throw new Error(`Server error ${r.status}`);
      }

      const res = await r.json();
      if (res.success) {
        const d: ProfileData = res.data;
        setProfile(d);
        setFormData({
          nama:           d.nama           ?? "",
          email:          d.email          ?? "",
          no_hp:          d.no_hp          ?? "",
          kata_sandi:     "",
          provinsi:       d.provinsi       ?? "",
          kota:           d.kota           ?? "",
          kecamatan:      d.kecamatan      ?? "",
          kode_pos:       d.kode_pos       ?? "",
          alamat_lengkap: d.alamat_lengkap ?? "",
        });
      }
    } catch {
      if (!signal?.aborted) {
        toast.error("Gagal memuat profil", "Periksa koneksi internet Anda dan coba lagi.");
      }
    }
  };

  useEffect(() => {
    if (!token) {
      router.push("/auth/login_dokter");
      return;
    }
    const controller = new AbortController();
    (async () => {
      setLoading(true);
      await fetchProfile(controller.signal);
      setLoading(false);
    })();
    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, router]);

  // ── Handlers ──────────────────────────────────────────────────────────────

  function handleChange(e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  // Simpan profil: akun + alamat dalam SATU request
  async function handleSubmit() {
    // ── Validasi frontend ─────────────────────────────────────────────────
    if (!formData.nama.trim()) {
      toast.error("Nama tidak boleh kosong", "Isi nama lengkap Anda terlebih dahulu.");
      return;
    }

    // Email harus punya format: xxx@xxx.tld (minimal 2 karakter TLD)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    if (!emailRegex.test(formData.email)) {
      toast.error("Format email tidak valid", "Contoh yang benar: nama@gmail.com");
      return;
    }

    if (formData.kata_sandi && formData.kata_sandi.length < 8) {
      toast.error("Kata sandi terlalu pendek", "Kata sandi minimal 8 karakter.");
      return;
    }

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

      const res = await fetch(`${API_URL}/api/owner_pet/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      // Baca sebagai text agar tidak crash kalau server return HTML
      const raw = await res.text();

      if (!res.ok) {
        console.error(`[Profile] HTTP ${res.status}:`, raw);
        let errMsg = `Server error ${res.status}.`;
        try {
          const parsed = JSON.parse(raw);
          errMsg = parsed.message ?? errMsg;
          // Handle Laravel validation errors
          if (parsed.errors) {
            const firstField = Object.values(parsed.errors)[0];
            if (Array.isArray(firstField) && firstField.length > 0) {
              errMsg = firstField[0] as string;
            }
          }
        } catch {
          // raw bukan JSON, pakai errMsg default
        }
        throw new Error(errMsg);
      }

      let data: { success: boolean; message?: string };
      try {
        data = JSON.parse(raw);
      } catch {
        console.error("[Profile] Response bukan JSON:", raw);
        throw new Error("Respons server tidak valid.");
      }

      if (!data.success) throw new Error(data.message ?? "Gagal menyimpan profil.");

      // ✅ Toast sukses
      toast.success(
        "Profil berhasil disimpan!",
        "Data akun dan alamat Anda telah diperbarui."
      );

      // Reset password field & refresh data
      setFormData((f) => ({ ...f, kata_sandi: "" }));
      fetchProfile();
    } catch (err: unknown) {
      // ❌ Toast error
      toast.error(
        "Gagal menyimpan profil",
        err instanceof Error ? err.message : "Tidak dapat terhubung ke server."
      );
    } finally {
      setSaving(false);
    }
  }

  // Upload foto profil
  async function handleFotoChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowed = ["image/jpeg", "image/png", "image/jpg", "image/webp"];
    if (!allowed.includes(file.type)) {
      toast.error("Format file tidak didukung", "Gunakan format JPEG, PNG, atau WEBP.");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error("File terlalu besar", "Ukuran maksimal foto profil adalah 2 MB.");
      return;
    }

    setUploadingFoto(true);

    try {
      const fd = new FormData();
      fd.append("foto", file);

      const res = await fetch(`${API_URL}/api/owner_pet/profile/foto`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });

      if (!res.ok) {
        const text = await res.text();
        console.error("[Foto] error:", text);
        throw new Error(`Server error ${res.status}`);
      }

      const data = await res.json();
      if (data.success) {
        // ✅ Toast sukses upload foto
        toast.info(
          "Foto profil diperbarui!",
          "Foto baru Anda sudah aktif dan tersimpan."
        );
        fetchProfile();
      } else {
        throw new Error(data.message ?? "Gagal upload foto.");
      }
    } catch (err: unknown) {
      toast.error(
        "Gagal upload foto",
        err instanceof Error ? err.message : "Terjadi kesalahan saat mengunggah foto."
      );
    } finally {
      setUploadingFoto(false);
      e.target.value = "";
    }
  }

  // ── Loading state ──────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          height: "100vh",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "'Poppins', sans-serif",
          background: "#f9f9f9",
        }}
      >
        <p style={{ color: "#888" }}>Memuat profil...</p>
      </div>
    );
  }

  const avatarSrc =
    profile?.foto_profile ??
    `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(
      formData.nama || "user"
    )}`;

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div
      style={{
        display: "flex",
        height: "100vh",
        overflow: "hidden",
        fontFamily: "'Poppins', sans-serif",
        background: "#f9f9f9",
      }}
    >
      <Sidebar activePage="profile" />

      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "auto" }}>
        <Header
          title="Profile Saya"
          subtitle="Kelola Informasi Profile Anda Sebagai Pemilik Hewan Peliharaan"
        />

        <main style={{ flex: 1, padding: "22px 28px" }}>

          {/* ── Avatar Card ─────────────────────────────────────────────────── */}
          <div style={{ ...cardStyle, display: "flex", alignItems: "center", gap: 20 }}>
            <div style={{ position: "relative", flexShrink: 0 }}>
              <Image
                src={avatarSrc}
                alt="Avatar"
                width={80}
                height={80}
                unoptimized
                style={{
                  borderRadius: "50%",
                  objectFit: "cover",
                  background: "#e8f5e9",
                  border: `2.5px solid ${G}`,
                  opacity: uploadingFoto ? 0.5 : 1,
                  transition: "opacity .2s",
                }}
              />

              {/* Spinner saat upload */}
              {uploadingFoto && (
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <div
                    style={{
                      width: 22,
                      height: 22,
                      border: `3px solid ${G}`,
                      borderTopColor: "transparent",
                      borderRadius: "50%",
                      animation: "spin .7s linear infinite",
                    }}
                  />
                </div>
              )}

              <input
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/png,image/jpg,image/webp"
                style={{ display: "none" }}
                onChange={handleFotoChange}
              />

              {/* Tombol kamera */}
              <button
                onClick={() => fileRef.current?.click()}
                disabled={uploadingFoto}
                title="Ganti foto profil"
                style={{
                  position: "absolute",
                  bottom: 0,
                  right: 0,
                  background: "#fff",
                  border: "1.5px solid #e0e0e0",
                  borderRadius: "50%",
                  width: 26,
                  height: 26,
                  cursor: uploadingFoto ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 1px 4px rgba(0,0,0,.1)",
                }}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width={13}
                  height={13}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#555"
                  strokeWidth={2}
                >
                  <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
                  <circle cx="12" cy="13" r="4" />
                </svg>
              </button>
            </div>

            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 800, fontSize: 17, color: "#1a1a1a" }}>
                {formData.nama || "-"}
              </div>
              <div style={{ fontSize: 12, color: "#aaa", marginTop: 4 }}>
                Pemilik Hewan
                {formData.kota &&
                  ` · 📍 ${formData.kota}${formData.provinsi ? ", " + formData.provinsi : ""}`}
              </div>
              {uploadingFoto && (
                <div style={{ marginTop: 6, fontSize: 11, color: "#888" }}>
                  Mengupload foto...
                </div>
              )}
            </div>
          </div>

          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

          {/* ── Informasi Akun ───────────────────────────────────────────────── */}
          <div style={cardStyle}>
            <h2 style={sectionTitleStyle}>👤 Informasi Akun</h2>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <InputField
                label="Nama Lengkap"
                name="nama"
                value={formData.nama}
                onChange={handleChange}
              />
              <InputField
                label="Email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
              />
              <InputField
                label="No. Telepon"
                name="no_hp"
                value={formData.no_hp}
                onChange={handleChange}
              />
              <InputField
                label="Kata Sandi Baru"
                name="kata_sandi"
                type="password"
                value={formData.kata_sandi}
                onChange={handleChange}
                placeholder="Kosongkan jika tidak ingin ubah"
              />
            </div>
          </div>

          {/* ── Alamat ──────────────────────────────────────────────────────── */}
          <div style={cardStyle}>
            <h2 style={sectionTitleStyle}>📍 Alamat</h2>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <InputField
                label="Provinsi"
                name="provinsi"
                value={formData.provinsi}
                onChange={handleChange}
              />
              <InputField
                label="Kota/Kabupaten"
                name="kota"
                value={formData.kota}
                onChange={handleChange}
              />
              <InputField
                label="Kecamatan"
                name="kecamatan"
                value={formData.kecamatan}
                onChange={handleChange}
              />
              <InputField
                label="Kode Pos"
                name="kode_pos"
                value={formData.kode_pos}
                onChange={handleChange}
              />
              <div style={{ gridColumn: "1 / -1" }}>
                <label style={labelStyle}>Alamat Lengkap</label>
                <textarea
                  name="alamat_lengkap"
                  value={formData.alamat_lengkap}
                  onChange={handleChange}
                  rows={3}
                  style={{ ...inputStyle, resize: "vertical", lineHeight: 1.6 }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = G)}
                  onBlur={(e) => (e.currentTarget.style.borderColor = "#e0e0e0")}
                />
              </div>
            </div>
          </div>

          {/* ── Tombol Aksi ─────────────────────────────────────────────────── */}
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              gap: 10,
              paddingBottom: 24,
            }}
          >
            <button
              onClick={() => window.location.reload()}
              style={{
                padding: "10px 22px",
                borderRadius: 9,
                border: `1.5px solid ${G}`,
                background: "#fff",
                color: G,
                fontSize: 13,
                fontWeight: 700,
                cursor: "pointer",
                fontFamily: "inherit",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "#e8f5e9")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "#fff")}
            >
              Batalkan
            </button>

            <button
              onClick={handleSubmit}
              disabled={saving}
              style={{
                padding: "10px 26px",
                borderRadius: 9,
                border: "none",
                background: saving ? "#a5d6a7" : G,
                color: "#fff",
                fontSize: 13,
                fontWeight: 700,
                cursor: saving ? "not-allowed" : "pointer",
                fontFamily: "inherit",
                display: "flex",
                alignItems: "center",
                gap: 7,
                transition: "background .2s",
              }}
              onMouseEnter={(e) => {
                if (!saving) e.currentTarget.style.background = "#1b5e20";
              }}
              onMouseLeave={(e) => {
                if (!saving) e.currentTarget.style.background = G;
              }}
            >
              {saving ? <>Menyimpan...</> : <>💾 Simpan Perubahan</>}
            </button>
          </div>

        </main>
      </div>

      {/* ── Toast Notifications ─────────────────────────────────────────────── */}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
}