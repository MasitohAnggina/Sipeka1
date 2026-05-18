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

interface FormAkun {
  nama: string;
  email: string;
  no_hp: string;
  kata_sandi: string;
}

interface FormAlamat {
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
    ? (localStorage.getItem("auth_token") ?? "") : "";
}

// ── InputField ────────────────────────────────────────────────────────────────

function InputField({ label, name, value, onChange, type = "text", placeholder = "" }: {
  label: string; name: string; value: string;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  type?: string; placeholder?: string;
}) {
  return (
    <div>
      <label style={{ display: "block", fontSize: 12, color: "#888", marginBottom: 6 }}>{label}</label>
      <input
        type={type} name={name} value={value} onChange={onChange}
        placeholder={placeholder}
        style={{
          width: "100%", border: "1px solid #d1d5db", borderRadius: 12,
          padding: "10px 16px", fontSize: 14, color: "#333", outline: "none",
          boxSizing: "border-box", fontFamily: "inherit",
        }}
        onFocus={e => (e.currentTarget.style.borderColor = G)}
        onBlur={e => (e.currentTarget.style.borderColor = "#d1d5db")}
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
  const [savingAkun,    setSavingAkun]    = useState(false);
  const [savingAlamat,  setSavingAlamat]  = useState(false);
  const [uploadingFoto, setUploadingFoto] = useState(false);
  const [error,         setError]         = useState<string | null>(null);
  const [successMsg,    setSuccessMsg]    = useState<string | null>(null);

  const [formAkun, setFormAkun] = useState<FormAkun>({
    nama: "", email: "", no_hp: "", kata_sandi: "",
  });

  const [formAlamat, setFormAlamat] = useState<FormAlamat>({
    provinsi: "", kota: "", kecamatan: "", kode_pos: "", alamat_lengkap: "",
  });

  const token = getAuthToken();

  // ✅ FIX Ln 138: Async IIFE langsung di dalam useEffect
  // Menghilangkan "setState synchronously within an effect"
  // dan exhaustive-deps untuk fetchProfile, router, token
  useEffect(() => {
    if (!token) { router.push("/login"); return; }

    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const r = await fetch(`${API_URL}/api/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!r.ok) throw new Error();
        const res = await r.json();
        if (!cancelled && res.success) {
          const d: ProfileData = res.data;
          setProfile(d);
          setFormAkun({
            nama:       d.nama ?? "",
            email:      d.email ?? "",
            no_hp:      d.no_hp ?? "",
            kata_sandi: "",
          });
          if (d.alamat) {
            setFormAlamat({
              provinsi:       d.alamat.provinsi ?? "",
              kota:           d.alamat.kota ?? "",
              kecamatan:      d.alamat.kecamatan ?? "",
              kode_pos:       d.alamat.kode_pos ?? "",
              alamat_lengkap: d.alamat.alamat_lengkap ?? "",
            });
          }
        }
      } catch {
        if (!cancelled) setError("Gagal memuat profil.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [token, router]);

  // ── fetchProfile untuk dipanggil manual setelah save/upload ──────────────
  const fetchProfile = async () => {
    try {
      const r = await fetch(`${API_URL}/api/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!r.ok) throw new Error();
      const res = await r.json();
      if (res.success) {
        const d: ProfileData = res.data;
        setProfile(d);
        setFormAkun(f => ({
          ...f,
          nama:  d.nama ?? "",
          email: d.email ?? "",
          no_hp: d.no_hp ?? "",
        }));
        if (d.alamat) {
          setFormAlamat({
            provinsi:       d.alamat.provinsi ?? "",
            kota:           d.alamat.kota ?? "",
            kecamatan:      d.alamat.kecamatan ?? "",
            kode_pos:       d.alamat.kode_pos ?? "",
            alamat_lengkap: d.alamat.alamat_lengkap ?? "",
          });
        }
      }
    } catch {
      setError("Gagal memuat profil.");
    }
  };

  const showSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  // ── Simpan informasi akun ─────────────────────────────────────────────────
  const handleSaveAkun = async () => {
    setSavingAkun(true);
    setError(null);
    try {
      const body: Record<string, string> = {};
      if (formAkun.nama)       body.nama       = formAkun.nama;
      if (formAkun.email)      body.email      = formAkun.email;
      if (formAkun.no_hp)      body.no_hp      = formAkun.no_hp;
      if (formAkun.kata_sandi) body.kata_sandi = formAkun.kata_sandi;

      const res  = await fetch(`${API_URL}/api/profile`, {
        method:  "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body:    JSON.stringify(body),
      });
      const data = await res.json();
      if (data.success) {
        showSuccess("Informasi akun berhasil diperbarui.");
        setFormAkun(f => ({ ...f, kata_sandi: "" }));
        fetchProfile();
      } else {
        setError(data.message ?? "Gagal menyimpan informasi akun.");
      }
    } catch {
      setError("Tidak dapat terhubung ke server.");
    } finally {
      setSavingAkun(false);
    }
  };

  // ── Simpan alamat ─────────────────────────────────────────────────────────
  const handleSaveAlamat = async () => {
    setSavingAlamat(true);
    setError(null);
    try {
      const res  = await fetch(`${API_URL}/api/profile/alamat`, {
        method:  "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body:    JSON.stringify(formAlamat),
      });
      const data = await res.json();
      if (data.success) {
        showSuccess("Alamat berhasil diperbarui.");
        fetchProfile();
      } else {
        setError(data.message ?? "Gagal menyimpan alamat.");
      }
    } catch {
      setError("Tidak dapat terhubung ke server.");
    } finally {
      setSavingAlamat(false);
    }
  };

  // ── Upload foto profil ─────────────────────────────────────────────────────
  const handleFotoChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingFoto(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("foto", file);
      const res  = await fetch(`${API_URL}/api/profile/foto`, {
        method:  "POST",
        headers: { Authorization: `Bearer ${token}` },
        body:    formData,
      });
      const data = await res.json();
      if (data.success) {
        showSuccess("Foto profil berhasil diperbarui.");
        fetchProfile();
      } else {
        setError(data.message ?? "Gagal upload foto.");
      }
    } catch {
      setError("Tidak dapat terhubung ke server.");
    } finally {
      setUploadingFoto(false);
    }
  };

  // ── Loading ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div style={{ display: "flex", height: "100vh", background: "#f5f5f5", fontFamily: "Segoe UI, sans-serif" }}>
        <Sidebar activePage="profile" />
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ textAlign: "center", color: "#888" }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>⏳</div>
            <div>Memuat profil...</div>
          </div>
        </div>
      </div>
    );
  }

  // ✅ FIX Ln 275: Tentukan src avatar sekali, lalu pakai di <Image>
  const avatarSrc = profile?.foto_profile
    ?? `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(profile?.nama ?? "user")}`;

  return (
    <div style={{ display: "flex", height: "100vh", backgroundColor: "#f5f5f5", fontFamily: "Segoe UI, sans-serif" }}>
      <Sidebar activePage="profile" />

      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflowY: "auto" }}>
        <Header
          title="Profile Saya"
          subtitle="Kelola Informasi Profile Anda Sebagai Pemilik Hewan Peliharaan"
        />

        <main style={{ flex: 1, padding: "24px", overflowY: "auto" }}>

          {/* Notifikasi */}
          {error && (
            <div style={{ padding: "10px 14px", background: "#fce4ec", borderRadius: 8, color: "#c62828", fontSize: 13, marginBottom: 16 }}>
              ⚠️ {error}
            </div>
          )}
          {successMsg && (
            <div style={{ padding: "10px 14px", background: "#e8f5e9", borderRadius: 8, color: G, fontSize: 13, marginBottom: 16 }}>
              ✅ {successMsg}
            </div>
          )}

          {/* ── Avatar Card ── */}
          <div style={{
            backgroundColor: "#ffffff", borderRadius: 16, padding: "24px",
            marginBottom: 20, boxShadow: "0 1px 4px rgba(0,0,0,0.07)",
            display: "flex", flexDirection: "row", alignItems: "center",
          }}>
            {/* ✅ FIX Ln 275: Ganti <img> → <Image> dengan width/height eksplisit */}
            <div style={{ position: "relative", width: 80, height: 80, flexShrink: 0 }}>
              <Image
                src={avatarSrc}
                alt="Avatar"
                width={80}
                height={80}
                unoptimized
                style={{ borderRadius: "50%", objectFit: "cover", backgroundColor: "#e5e7eb" }}
              />
              <button
                onClick={() => fileRef.current?.click()}
                disabled={uploadingFoto}
                style={{
                  position: "absolute", bottom: 0, right: 0,
                  backgroundColor: uploadingFoto ? "#e0e0e0" : "#fff",
                  border: "1px solid #d1d5db", borderRadius: "50%",
                  padding: 4, cursor: uploadingFoto ? "not-allowed" : "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth={2}>
                  <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
                  <circle cx="12" cy="13" r="4" />
                </svg>
              </button>
              <input ref={fileRef} type="file" accept="image/jpg,image/jpeg,image/png,image/webp"
                style={{ display: "none" }} onChange={handleFotoChange} />
            </div>
            <div style={{ marginLeft: 20 }}>
              <p style={{ fontSize: 18, fontWeight: 700, color: "#1a1a1a", margin: 0 }}>{profile?.nama}</p>
              <p style={{ fontSize: 14, color: "#888", margin: "4px 0 0" }}>Pemilik Hewan</p>
              {uploadingFoto && <p style={{ fontSize: 12, color: G, margin: "4px 0 0" }}>Mengupload foto...</p>}
            </div>
          </div>

          {/* ── Informasi Akun ── */}
          <div style={{ backgroundColor: "#ffffff", borderRadius: 16, padding: "24px", marginBottom: 20, boxShadow: "0 1px 4px rgba(0,0,0,0.07)" }}>
            <h2 style={{ fontSize: 15, fontWeight: 700, color: "#1a1a1a", marginBottom: 20, marginTop: 0 }}>
              Informasi Akun
            </h2>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
              <InputField label="Nama Lengkap" name="nama" value={formAkun.nama}
                onChange={e => setFormAkun(f => ({ ...f, nama: e.target.value }))} />
              <InputField label="Email" name="email" type="email" value={formAkun.email}
                onChange={e => setFormAkun(f => ({ ...f, email: e.target.value }))} />
              <InputField label="No. Telepon" name="no_hp" value={formAkun.no_hp}
                onChange={e => setFormAkun(f => ({ ...f, no_hp: e.target.value }))} />
              <InputField label="Kata Sandi Baru" name="kata_sandi" type="password"
                value={formAkun.kata_sandi}
                onChange={e => setFormAkun(f => ({ ...f, kata_sandi: e.target.value }))}
                placeholder="Kosongkan jika tidak ingin ubah" />
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button
                onClick={handleSaveAkun} disabled={savingAkun}
                style={{
                  backgroundColor: savingAkun ? "rgba(116,249,109,0.2)" : "rgba(116,249,109,0.4)",
                  color: "#1a5c1a", boxShadow: "0 2px 8px rgba(116,249,109,0.3)",
                  fontSize: 14, fontWeight: 600, padding: "10px 32px",
                  borderRadius: 999, border: "none",
                  cursor: savingAkun ? "not-allowed" : "pointer",
                }}
              >
                {savingAkun ? "Menyimpan..." : "Simpan Informasi Akun"}
              </button>
            </div>
          </div>

          {/* ── Alamat ── */}
          <div style={{ backgroundColor: "#ffffff", borderRadius: 16, padding: "24px", marginBottom: 20, boxShadow: "0 1px 4px rgba(0,0,0,0.07)" }}>
            <h2 style={{ fontSize: 15, fontWeight: 700, color: "#1a1a1a", marginBottom: 20, marginTop: 0 }}>
              Alamat
            </h2>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
              <InputField label="Provinsi" name="provinsi" value={formAlamat.provinsi}
                onChange={e => setFormAlamat(f => ({ ...f, provinsi: e.target.value }))} />
              <InputField label="Kota/Kabupaten" name="kota" value={formAlamat.kota}
                onChange={e => setFormAlamat(f => ({ ...f, kota: e.target.value }))} />
              <InputField label="Kecamatan" name="kecamatan" value={formAlamat.kecamatan}
                onChange={e => setFormAlamat(f => ({ ...f, kecamatan: e.target.value }))} />
              <InputField label="Kode Pos" name="kode_pos" value={formAlamat.kode_pos}
                onChange={e => setFormAlamat(f => ({ ...f, kode_pos: e.target.value }))} />
              <div style={{ gridColumn: "1 / -1" }}>
                <label style={{ display: "block", fontSize: 12, color: "#888", marginBottom: 6 }}>Alamat Lengkap</label>
                <textarea
                  name="alamat_lengkap" value={formAlamat.alamat_lengkap} rows={3}
                  onChange={e => setFormAlamat(f => ({ ...f, alamat_lengkap: e.target.value }))}
                  style={{
                    width: "100%", border: "1px solid #d1d5db", borderRadius: 12,
                    padding: "10px 16px", fontSize: 14, color: "#333", outline: "none",
                    boxSizing: "border-box", resize: "none", fontFamily: "inherit",
                  }}
                />
              </div>
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button
                onClick={handleSaveAlamat} disabled={savingAlamat}
                style={{
                  backgroundColor: savingAlamat ? "rgba(116,249,109,0.2)" : "rgba(116,249,109,0.4)",
                  color: "#1a5c1a", boxShadow: "0 2px 8px rgba(116,249,109,0.3)",
                  fontSize: 14, fontWeight: 600, padding: "10px 32px",
                  borderRadius: 999, border: "none",
                  cursor: savingAlamat ? "not-allowed" : "pointer",
                }}
              >
                {savingAlamat ? "Menyimpan..." : "Simpan Alamat"}
              </button>
            </div>
          </div>

        </main>
      </div>
    </div>
  );
}