"use client";

import { useState, useEffect, useRef, ChangeEvent } from "react";
import Sidebar from "@/components/Sidebar_dokter";
import Header from "@/components/Header";

interface FormData {
  namaLengkap: string;
  email: string;
  noTelepon: string;
  spesialisasi: string;
  institusiPendidikan: string;
  provinsi: string;
  kotaKabupaten: string;
  kecamatan: string;
  kodePos: string;
  alamatLengkap: string;
}

const G = "#2e7d32";

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
        type={type} name={name} value={value} onChange={onChange} placeholder={placeholder}
        style={inputStyle}
        onFocus={e => e.currentTarget.style.borderColor = G}
        onBlur={e => e.currentTarget.style.borderColor = "#e0e0e0"}
      />
    </div>
  );
}

export default function ProfileDokterPage() {
  const [formData, setFormData] = useState<FormData>({
    namaLengkap:         "",
    email:               "",
    noTelepon:           "",
    spesialisasi:        "",
    institusiPendidikan: "",
    provinsi:            "",
    kotaKabupaten:       "",
    kecamatan:           "",
    kodePos:             "",
    alamatLengkap:       "",
  });

  const [saved, setSaved]                   = useState(false);
  const [loading, setLoading]               = useState(true);
  const [error, setError]                   = useState("");
  const [fotoUrl, setFotoUrl]               = useState<string | null>(null);
  const [fotoUploading, setFotoUploading]   = useState(false);
  const [fotoError, setFotoError]           = useState("");
  const [fotoSuccess, setFotoSuccess]       = useState("");
  const fileInputRef                        = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    fetch("http://127.0.0.1:8000/api/dokter/profile", {
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    })
      .then((res) => res.json())
      .then((data) => {
        setFormData({
          namaLengkap:         data.nama               ?? "",
          email:               data.email              ?? "",
          noTelepon:           data.no_hp              ?? "",
          spesialisasi:        data.spesialisasi        ?? "",
          institusiPendidikan: data.pendidikan_terakhir ?? "",
          provinsi:            data.provinsi           ?? "",
          kotaKabupaten:       data.kota               ?? "",
          kecamatan:           data.kecamatan          ?? "",
          kodePos:             data.kode_pos           ?? "",
          alamatLengkap:       data.alamat_lengkap     ?? "",
        });
        if (data.foto) setFotoUrl(data.foto);
        setLoading(false);
      })
      .catch(() => {
        setError("Gagal memuat profil");
        setLoading(false);
      });
  }, []);

  function handleChange(e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setSaved(false);
  }

  function handleFotoButtonClick() {
    fileInputRef.current?.click();
  }

  async function handleFotoChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowed = ["image/jpeg", "image/png", "image/jpg"];
    if (!allowed.includes(file.type)) {
      setFotoError("Format file harus JPEG atau PNG");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setFotoError("Ukuran file maksimal 2MB");
      return;
    }

    const localUrl = URL.createObjectURL(file);
    setFotoUrl(localUrl);
    setFotoError("");
    setFotoSuccess("");
    setFotoUploading(true);

    try {
      const token = localStorage.getItem("token");
      const formDataUpload = new FormData();
      formDataUpload.append("foto", file);

      const res = await fetch("http://127.0.0.1:8000/api/dokter/foto", {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` },
        body: formDataUpload,
      });

      const data = await res.json();
      if (res.ok) {
        setFotoUrl(data.foto);
        setFotoSuccess("Foto berhasil diperbarui");
        setTimeout(() => setFotoSuccess(""), 3000);
      } else {
        setFotoError(data.message || "Gagal mengupload foto");
        setFotoUrl(null);
      }
    } catch {
      setFotoError("Terjadi kesalahan saat upload foto");
      setFotoUrl(null);
    } finally {
      setFotoUploading(false);
      e.target.value = "";
    }
  }

  async function handleSubmit() {
    const token = localStorage.getItem("token");
    setError("");

    try {
      const res = await fetch("http://127.0.0.1:8000/api/dokter/profile", {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nama:                formData.namaLengkap,
          email:               formData.email,
          no_hp:               formData.noTelepon,
          spesialisasi:        formData.spesialisasi,
          pendidikan_terakhir: formData.institusiPendidikan,
          provinsi:            formData.provinsi,
          kota:                formData.kotaKabupaten,
          kecamatan:           formData.kecamatan,
          kode_pos:            formData.kodePos,
          alamat_lengkap:      formData.alamatLengkap,
        }),
      });

      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      } else {
        const data = await res.json();
        setError(data.message || "Gagal menyimpan profil");
      }
    } catch {
      setError("Terjadi kesalahan, coba lagi");
    }
  }

  if (loading) {
    return (
      <div style={{ display: "flex", height: "100vh", alignItems: "center", justifyContent: "center" }}>
        <p style={{ color: "#888" }}>Memuat profil...</p>
      </div>
    );
  }

  const avatarSrc = fotoUrl ?? `https://api.dicebear.com/7.x/adventurer/svg?seed=${formData.namaLengkap}`;

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden", fontFamily: "'Poppins', sans-serif", background: "#f9f9f9" }}>
      <Sidebar activePage="profile" />

      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "auto" }}>
        <Header title="Profil Saya" subtitle="Kelola informasi profil dan data profesional Anda" />

        <main style={{ flex: 1, padding: "22px 28px" }}>

          {error && (
            <div style={{ background: "#ffebee", border: "1px solid #ffcdd2", borderRadius: 8, padding: "10px 14px", marginBottom: 16, fontSize: 13, color: "#c62828" }}>
              {error}
            </div>
          )}

          {/* ── Avatar Card ── */}
          <div style={{ ...cardStyle, display: "flex", alignItems: "center", gap: 20 }}>
            <div style={{ position: "relative", flexShrink: 0 }}>
              <img
                src={avatarSrc}
                alt="Avatar"
                style={{
                  width: 80, height: 80, borderRadius: "50%", objectFit: "cover",
                  background: "#e8f5e9", border: `2.5px solid ${G}`,
                  opacity: fotoUploading ? 0.5 : 1, transition: "opacity .2s",
                }}
              />
              {fotoUploading && (
                <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <div style={{ width: 22, height: 22, border: `3px solid ${G}`, borderTopColor: "transparent", borderRadius: "50%", animation: "spin .7s linear infinite" }} />
                </div>
              )}
              <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/jpg" style={{ display: "none" }} onChange={handleFotoChange} />
              <button onClick={handleFotoButtonClick} disabled={fotoUploading} title="Ganti foto profil"
                style={{ position: "absolute", bottom: 0, right: 0, background: "#fff", border: "1.5px solid #e0e0e0", borderRadius: "50%", width: 26, height: 26, cursor: fotoUploading ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 1px 4px rgba(0,0,0,.1)" }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth={2}>
                  <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
                  <circle cx="12" cy="13" r="4" />
                </svg>
              </button>
            </div>

            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 800, fontSize: 17, color: "#1a1a1a" }}>{formData.namaLengkap || "-"}</div>
              <div style={{ fontSize: 13, color: "#888", marginTop: 3 }}>Dokter Hewan · {formData.spesialisasi || "-"}</div>
              <div style={{ fontSize: 12, color: "#aaa", marginTop: 4 }}>📍 {formData.kotaKabupaten || "-"}, {formData.provinsi || "-"}</div>
              {fotoError   && <div style={{ marginTop: 6, fontSize: 11, color: "#c62828" }}>⚠ {fotoError}</div>}
              {fotoSuccess && <div style={{ marginTop: 6, fontSize: 11, color: G }}>✓ {fotoSuccess}</div>}
              {fotoUploading && <div style={{ marginTop: 6, fontSize: 11, color: "#888" }}>Mengupload foto...</div>}
            </div>
          </div>

          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

          {/* ── Informasi Akun ── */}
          <div style={cardStyle}>
            <h2 style={sectionTitleStyle}>👤 Informasi Akun</h2>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <InputField label="Nama Lengkap"        name="namaLengkap"         value={formData.namaLengkap}         onChange={handleChange} />
              <InputField label="Email"               name="email"               value={formData.email}               onChange={handleChange} type="email" />
              <InputField label="No. Telepon"         name="noTelepon"           value={formData.noTelepon}           onChange={handleChange} />
              <InputField label="Spesialisasi"        name="spesialisasi"        value={formData.spesialisasi}        onChange={handleChange} placeholder="cth. Hewan Kecil & Eksotis" />
              <div style={{ gridColumn: "1 / -1" }}>
                <InputField label="Institusi Pendidikan" name="institusiPendidikan" value={formData.institusiPendidikan} onChange={handleChange} placeholder="cth. Universitas Airlangga" />
              </div>
            </div>
          </div>

          {/* ── Alamat ── */}
          <div style={cardStyle}>
            <h2 style={sectionTitleStyle}>📍 Alamat</h2>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <InputField label="Provinsi"       name="provinsi"      value={formData.provinsi}      onChange={handleChange} />
              <InputField label="Kota/Kabupaten" name="kotaKabupaten" value={formData.kotaKabupaten} onChange={handleChange} />
              <InputField label="Kecamatan"      name="kecamatan"     value={formData.kecamatan}     onChange={handleChange} />
              <InputField label="Kode Pos"       name="kodePos"       value={formData.kodePos}       onChange={handleChange} />
              <div style={{ gridColumn: "1 / -1" }}>
                <label style={labelStyle}>Alamat Lengkap</label>
                <textarea
                  name="alamatLengkap" value={formData.alamatLengkap} onChange={handleChange} rows={3}
                  style={{ ...inputStyle, resize: "vertical", lineHeight: 1.6 }}
                  onFocus={e => e.currentTarget.style.borderColor = G}
                  onBlur={e => e.currentTarget.style.borderColor = "#e0e0e0"}
                />
              </div>
            </div>
          </div>

          {/* ── Tombol ── */}
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, paddingBottom: 24 }}>
            <button
              onClick={() => window.location.reload()}
              style={{ padding: "10px 22px", borderRadius: 9, border: `1.5px solid ${G}`, background: "#fff", color: G, fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}
              onMouseEnter={e => e.currentTarget.style.background = "#e8f5e9"}
              onMouseLeave={e => e.currentTarget.style.background = "#fff"}
            >
              Batalkan
            </button>
            <button onClick={handleSubmit}
              style={{ padding: "10px 26px", borderRadius: 9, border: "none", background: saved ? "#4caf50" : G, color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", gap: 7, transition: "background .2s" }}
              onMouseEnter={e => { if (!saved) e.currentTarget.style.background = "#1b5e20"; }}
              onMouseLeave={e => { if (!saved) e.currentTarget.style.background = saved ? "#4caf50" : G; }}
            >
              {saved ? <>✓ Tersimpan!</> : <>💾 Simpan Perubahan</>}
            </button>
          </div>

        </main>
      </div>
    </div>
  );
}