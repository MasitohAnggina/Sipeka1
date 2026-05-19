"use client";

import { useState, useEffect, ChangeEvent, useRef } from "react";
import Sidebar from "@/components/Sidebar_admin";
import Header from "@/components/Header";

interface FormData {
  namaLengkap: string;
  email: string;
  noTelepon: string;
  provinsi: string;
  kotaKabupaten: string;
  kecamatan: string;
  kodePos: string;
  alamatLengkap: string;
}

const G = "#2e7d32";
const G_LIGHT = "#e8f5e9";
const G_HOVER = "#1b5e20";

const cardStyle: React.CSSProperties = {
  background: "#fff", borderRadius: 14, border: "1px solid #efefef",
  padding: "22px 26px", marginBottom: 18, boxShadow: "0 1px 4px rgba(0,0,0,.04)",
};

const sectionTitleStyle: React.CSSProperties = {
  fontSize: 13, fontWeight: 700, color: G, marginBottom: 16, marginTop: 0,
  paddingBottom: 10, borderBottom: `1.5px solid ${G_LIGHT}`,
  textTransform: "uppercase", letterSpacing: ".04em",
};

const labelStyle: React.CSSProperties = {
  display: "block", fontSize: 11, fontWeight: 700, color: "#888",
  marginBottom: 5, textTransform: "uppercase", letterSpacing: ".04em",
};

const inputStyle: React.CSSProperties = {
  width: "100%", border: "1.5px solid #e8e8e8", borderRadius: 9,
  padding: "10px 13px", fontSize: 13, color: "#1a1a1a", outline: "none",
  boxSizing: "border-box", fontFamily: "inherit", background: "#fafafa",
  transition: "border-color .15s, background .15s",
};

interface InputFieldProps {
  label: string; name: string; value: string;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  type?: string; placeholder?: string; readOnly?: boolean;
}

function InputField({ label, name, value, onChange, type = "text", placeholder = "", readOnly = false }: InputFieldProps) {
  return (
    <div>
      <label style={labelStyle}>{label}</label>
      <input
        type={type} name={name} value={value} onChange={onChange}
        placeholder={placeholder} readOnly={readOnly}
        style={{ ...inputStyle, background: readOnly ? "#f3f3f3" : "#fafafa", color: readOnly ? "#aaa" : "#1a1a1a", cursor: readOnly ? "not-allowed" : "text" }}
        onFocus={e => { if (!readOnly) { e.currentTarget.style.borderColor = G; e.currentTarget.style.background = "#fff"; } }}
        onBlur={e => { e.currentTarget.style.borderColor = "#e8e8e8"; e.currentTarget.style.background = readOnly ? "#f3f3f3" : "#fafafa"; }}
      />
    </div>
  );
}

export default function ProfileAdminPage() {
  const [formData, setFormData] = useState<FormData>({
    namaLengkap: "", email: "", noTelepon: "",
    provinsi: "", kotaKabupaten: "", kecamatan: "", kodePos: "", alamatLengkap: "",
  });

  const [avatarSrc,    setAvatarSrc]    = useState<string>("");
  const [saveStatus,   setSaveStatus]   = useState<"idle" | "saving" | "saved">("idle");
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState("");
  const [fotoUploading, setFotoUploading] = useState(false);
  const [fotoError,    setFotoError]    = useState("");
  const [fotoSuccess,  setFotoSuccess]  = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const token = typeof window !== "undefined" ? sessionStorage.getItem("token") : null;
  const authHeaders = { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" };

  useEffect(() => {
    fetch("http://127.0.0.1:8000/api/admin/profile", {
      headers: authHeaders,
    })
      .then(res => res.json())
      .then(data => {
        setFormData({
          namaLengkap:   data.nama           ?? "",
          email:         data.email          ?? "",
          noTelepon:     data.no_hp          ?? "",
          provinsi:      data.provinsi       ?? "",
          kotaKabupaten: data.kota           ?? "",
          kecamatan:     data.kecamatan      ?? "",
          kodePos:       data.kode_pos       ?? "",
          alamatLengkap: data.alamat_lengkap ?? "",
        });
        setAvatarSrc(data.foto ?? `https://api.dicebear.com/7.x/adventurer/svg?seed=${data.nama}`);
        setLoading(false);
      })
      .catch(() => { setError("Gagal memuat profil"); setLoading(false); });
  }, []);

  function handleChange(e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setSaveStatus("idle");
  }

  async function handleAvatarChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowed = ["image/jpeg", "image/png", "image/jpg"];
    if (!allowed.includes(file.type)) { setFotoError("Format file harus JPEG atau PNG"); return; }
    if (file.size > 2 * 1024 * 1024)  { setFotoError("Ukuran file maksimal 2MB"); return; }

    setAvatarSrc(URL.createObjectURL(file));
    setFotoError(""); setFotoSuccess(""); setFotoUploading(true);

    try {
      const formDataUpload = new FormData();
      formDataUpload.append("foto", file);

      const res = await fetch("http://127.0.0.1:8000/api/admin/foto", {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` },
        body: formDataUpload,
      });

      const data = await res.json();
      if (res.ok) {
        setAvatarSrc(data.foto);
        setFotoSuccess("Foto berhasil diperbarui");
        setTimeout(() => setFotoSuccess(""), 3000);
      } else {
        setFotoError(data.message || "Gagal mengupload foto");
      }
    } catch {
      setFotoError("Terjadi kesalahan saat upload foto");
    } finally {
      setFotoUploading(false);
      e.target.value = "";
    }
  }

  async function handleSubmit() {
    setSaveStatus("saving");
    setError("");

    try {
      const res = await fetch("http://127.0.0.1:8000/api/admin/profile", {
        method: "PUT",
        headers: authHeaders,
        body: JSON.stringify({
          nama:            formData.namaLengkap,
          email:           formData.email,
          no_hp:           formData.noTelepon,
          provinsi:        formData.provinsi,
          kota:            formData.kotaKabupaten,
          kecamatan:       formData.kecamatan,
          kode_pos:        formData.kodePos,
          alamat_lengkap:  formData.alamatLengkap,
        }),
      });

      if (res.ok) {
        setSaveStatus("saved");
        setTimeout(() => setSaveStatus("idle"), 3000);
      } else {
        const data = await res.json();
        setError(data.message || "Gagal menyimpan profil");
        setSaveStatus("idle");
      }
    } catch {
      setError("Terjadi kesalahan, coba lagi");
      setSaveStatus("idle");
    }
  }

  if (loading) {
    return (
      <div style={{ display: "flex", height: "100vh", alignItems: "center", justifyContent: "center" }}>
        <p style={{ color: "#888" }}>Memuat profil...</p>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden", fontFamily: "'Poppins', sans-serif", background: "#f7f8fa" }}>
      <Sidebar activePage="profile" />

      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "auto" }}>
        <Header title="Profil Admin" subtitle="Kelola informasi dan data akun administrator" />

        <main style={{ flex: 1, padding: "22px 28px" }}>

          {error && (
            <div style={{ background: "#ffebee", border: "1px solid #ffcdd2", borderRadius: 8, padding: "10px 14px", marginBottom: 16, fontSize: 13, color: "#c62828" }}>
              {error}
            </div>
          )}

          {/* ── Avatar Card ── */}
          <div style={{ ...cardStyle, display: "flex", alignItems: "center", gap: 22 }}>
            <div style={{ position: "relative", flexShrink: 0 }}>
              <img
                src={avatarSrc || `https://api.dicebear.com/7.x/adventurer/svg?seed=${formData.namaLengkap}`}
                alt="Foto Profil Admin"
                style={{ width: 84, height: 84, borderRadius: "50%", objectFit: "cover", background: G_LIGHT, border: `3px solid ${G}`, opacity: fotoUploading ? 0.5 : 1, transition: "opacity .2s" }}
              />
              {fotoUploading && (
                <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <div style={{ width: 22, height: 22, border: `3px solid ${G}`, borderTopColor: "transparent", borderRadius: "50%", animation: "spin .7s linear infinite" }} />
                </div>
              )}
              <button onClick={() => fileInputRef.current?.click()} disabled={fotoUploading} title="Ganti foto profil"
                style={{ position: "absolute", bottom: 0, right: 0, background: "#fff", border: "1.5px solid #ddd", borderRadius: "50%", width: 28, height: 28, cursor: fotoUploading ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 2px 6px rgba(0,0,0,.12)" }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth={2}>
                  <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
                  <circle cx="12" cy="13" r="4" />
                </svg>
              </button>
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleAvatarChange} style={{ display: "none" }} />
            </div>

            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 800, fontSize: 18, color: "#1a1a1a" }}>{formData.namaLengkap || "-"}</div>
              <div style={{ fontSize: 13, color: "#777", marginTop: 3 }}>Administrator</div>
              <div style={{ fontSize: 12, color: "#aaa", marginTop: 4 }}>📍 {formData.kotaKabupaten || "-"}, {formData.provinsi || "-"}</div>
              {fotoError   && <div style={{ marginTop: 6, fontSize: 11, color: "#c62828" }}>⚠ {fotoError}</div>}
              {fotoSuccess && <div style={{ marginTop: 6, fontSize: 11, color: G }}>✓ {fotoSuccess}</div>}
            </div>

            <div style={{ background: G_LIGHT, color: G, fontSize: 11, fontWeight: 700, padding: "5px 13px", borderRadius: 20, border: "1px solid #c8e6c9", letterSpacing: ".04em", textTransform: "uppercase", flexShrink: 0 }}>
              🛡 Admin
            </div>
          </div>

          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

          {/* ── Informasi Akun ── */}
          <div style={cardStyle}>
            <h2 style={sectionTitleStyle}>👤 Informasi Akun</h2>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <InputField label="Nama Lengkap" name="namaLengkap" value={formData.namaLengkap} onChange={handleChange} placeholder="Nama lengkap admin" />
              <InputField label="Email"        name="email"        value={formData.email}        onChange={handleChange} type="email" placeholder="email@sipeka.com" />
              <div style={{ gridColumn: "1 / -1" }}>
                <InputField label="No. Telepon" name="noTelepon" value={formData.noTelepon} onChange={handleChange} placeholder="08xx-xxxx-xxxx" />
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
              <InputField label="Kode Pos"       name="kodePos"       value={formData.kodePos}       onChange={handleChange} placeholder="xxxxx" />
              <div style={{ gridColumn: "1 / -1" }}>
                <label style={labelStyle}>Alamat Lengkap</label>
                <textarea name="alamatLengkap" value={formData.alamatLengkap} onChange={handleChange} rows={3} placeholder="Masukkan alamat lengkap..."
                  style={{ ...inputStyle, resize: "vertical", lineHeight: 1.7 }}
                  onFocus={e => { e.currentTarget.style.borderColor = G; e.currentTarget.style.background = "#fff"; }}
                  onBlur={e  => { e.currentTarget.style.borderColor = "#e8e8e8"; e.currentTarget.style.background = "#fafafa"; }}
                />
              </div>
            </div>
          </div>

          {/* ── Tombol Aksi ── */}
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, paddingBottom: 28 }}>
            <button onClick={() => window.location.reload()}
              style={{ padding: "10px 22px", borderRadius: 9, border: "1.5px solid #ddd", background: "#fff", color: "#666", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", transition: "background .15s" }}
              onMouseEnter={e => e.currentTarget.style.background = "#f5f5f5"}
              onMouseLeave={e => e.currentTarget.style.background = "#fff"}
            >Batalkan</button>

            <button onClick={handleSubmit} disabled={saveStatus === "saving"}
              style={{ padding: "10px 26px", borderRadius: 9, border: "none", background: saveStatus === "saved" ? "#4caf50" : G, color: "#fff", fontSize: 13, fontWeight: 700, cursor: saveStatus === "saving" ? "wait" : "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", gap: 7, transition: "background .2s, opacity .2s", opacity: saveStatus === "saving" ? 0.7 : 1, minWidth: 160, justifyContent: "center" }}
              onMouseEnter={e => { if (saveStatus === "idle") e.currentTarget.style.background = G_HOVER; }}
              onMouseLeave={e => { if (saveStatus === "idle") e.currentTarget.style.background = G; }}
            >
              {saveStatus === "saving" && <>⏳ Menyimpan...</>}
              {saveStatus === "saved"  && <>✓ Tersimpan!</>}
              {saveStatus === "idle"   && <>💾 Simpan Perubahan</>}
            </button>
          </div>

        </main>
      </div>
    </div>
  );
}