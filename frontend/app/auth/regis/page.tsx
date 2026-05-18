"use client";

import Image from "next/image";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [nama, setNama] = useState("");
  const [noHp, setNoHp] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleRegister = async () => {
    setError("");
    setLoading(true);
    try {
      const res = await fetch("http://127.0.0.1:8000/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nama,
          email,
          password,
          no_hp: noHp,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Registrasi gagal");
        return;
      }

      router.push("/auth/login_dokter");
    } catch (err) {
      setError("Terjadi kesalahan, coba lagi");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'Inter', sans-serif; }

        .wrapper {
          position: relative;
          height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .bg { position: absolute; inset: 0; z-index: 0; }

        .overlay {
          position: absolute;
          inset: 0;
          backdrop-filter: blur(12px);
          background: rgba(255,255,255,0.35);
          z-index: 1;
        }

        .card {
          position: relative;
          z-index: 2;
          width: 360px;
          background: rgba(255,255,255,0.92);
          border-radius: 14px;
          padding: 26px 24px;
          box-shadow: 0 12px 35px rgba(0,0,0,0.15);
        }

        .logo { text-align: center; font-size: 18px; font-weight: 600; margin-bottom: 6px; }
        .subtitle { text-align: center; font-size: 12px; color: #777; margin-bottom: 18px; }

        .input-group { margin-bottom: 12px; }

        .label {
          font-size: 11px;
          color: #666;
          margin-bottom: 4px;
          display: block;
        }

        .input {
          width: 100%;
          padding: 10px;
          border-radius: 7px;
          border: 1px solid #ddd;
          font-size: 12.5px;
        }

        .input:focus { border-color: #2E7D32; outline: none; }

        .btn {
          width: 100%;
          padding: 10px;
          border-radius: 7px;
          border: none;
          background: #2E7D32;
          color: white;
          font-size: 13px;
          font-weight: 600;
          margin-top: 10px;
          cursor: pointer;
        }

        .btn:hover { background: #1b5e20; }
        .btn:disabled { background: #a5d6a7; cursor: not-allowed; }

        .error { color: red; font-size: 11px; margin-top: 6px; text-align: center; }

        .bottom {
          text-align: center;
          font-size: 11.5px;
          margin-top: 14px;
        }

        .bottom a { color: #2E7D32; text-decoration: none; font-weight: 600; }
      `}</style>

      <div className="wrapper">
        <div className="bg">
          <Image src="/images/home1.png" alt="bg" fill style={{ objectFit: "cover" }} />
        </div>
        <div className="overlay" />

        <div className="card">
          <div className="logo">SIPEKA</div>
          <div className="subtitle">Create Account</div>

          <div className="input-group">
            <label className="label">Nama Pemilik</label>
            <input
              type="text"
              className="input"
              placeholder="Nama lengkap"
              value={nama}
              onChange={(e) => setNama(e.target.value)}
            />
          </div>

          <div className="input-group">
            <label className="label">No. HP</label>
            <input
              type="tel"
              className="input"
              placeholder="08xxxxxxxxxx"
              value={noHp}
              onChange={(e) => setNoHp(e.target.value)}
            />
          </div>

          <div className="input-group">
            <label className="label">Email</label>
            <input
              type="email"
              className="input"
              placeholder="fulan@gmail.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="input-group">
            <label className="label">Password</label>
            <input
              type={showPassword ? "text" : "password"}
              className="input"
              placeholder="********"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {error && <p className="error">{error}</p>}

          <button className="btn" onClick={handleRegister} disabled={loading}>
            {loading ? "Memproses..." : "Register"}
          </button>

          <div className="bottom">
            Sudah punya akun? <Link href="/auth/login_dokter">Login</Link>
          </div>
        </div>
      </div>
    </>
  );
}