"use client";

import Image from "next/image";
import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { saveToken } from "@/lib/auth";

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail]               = useState("");
  const [password, setPassword]         = useState("");
  const [error, setError]               = useState("");
  const [loading, setLoading]           = useState(false);
  const searchParams = useSearchParams();

  const handleLogin = async () => {
    setError("");
    setLoading(true);
    try {
      const res = await fetch("http://127.0.0.1:8000/api/login", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Login gagal");
        return;
      }

      saveToken(data.token);
      document.cookie = `role=${data.user.role}; path=/; max-age=28800; SameSite=Lax`;
      sessionStorage.setItem("user", JSON.stringify(data.user));

      const redirectTo = searchParams.get("redirect");
      if (redirectTo) {
        window.location.href = redirectTo;
        return;
      }

      if (data.user.role === "dokter")      window.location.href = "/dokter/dashboard";
      else if (data.user.role === "admin")  window.location.href = "/admin/dashboard";
      else if (data.user.role === "user")   window.location.href = "/owner_pet/dashboard";
      else                                  window.location.href = "/";
    } catch {
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
          position: relative; height: 100vh;
          display: flex; align-items: center; justify-content: center;
        }
        .bg { position: absolute; inset: 0; z-index: 0; }
        .overlay {
          position: absolute; inset: 0;
          backdrop-filter: blur(12px);
          background: rgba(255,255,255,0.35); z-index: 1;
        }
        .card {
          position: relative; z-index: 2; width: 340px;
          background: rgba(255,255,255,0.92); border-radius: 14px;
          padding: 26px 24px; box-shadow: 0 12px 35px rgba(0,0,0,0.15);
        }
        .logo     { text-align: center; font-size: 18px; font-weight: 600; margin-bottom: 6px; }
        .subtitle { text-align: center; font-size: 12px; color: #777; margin-bottom: 18px; }
        .input-group { margin-bottom: 12px; }
        .label { font-size: 11px; color: #666; margin-bottom: 4px; display: block; }
        .input-wrap { position: relative; display: flex; align-items: center; }
        .input-wrap .icon-left {
          position: absolute; left: 10px;
          display: flex; align-items: center;
          pointer-events: none; color: #aaa;
        }
        .input-wrap .icon-right {
          position: absolute; right: 10px;
          display: flex; align-items: center;
          background: none; border: none; cursor: pointer; padding: 0; color: #aaa;
        }
        .input-wrap .icon-right:hover { color: #2E7D32; }
        .input {
          width: 100%; padding: 10px 36px;
          border-radius: 7px; border: 1px solid #ddd; font-size: 12.5px;
        }
        .input:focus { border-color: #2E7D32; outline: none; }
        .row {
          display: flex; justify-content: space-between;
          font-size: 11px; margin-bottom: 5px; align-items: center;
        }
        .row a { color: #2E7D32; text-decoration: none; }
        .btn {
          width: 100%; padding: 10px; border-radius: 7px; border: none;
          background: #2E7D32; color: white; font-size: 13px; font-weight: 600;
          margin-top: 10px; cursor: pointer;
          display: flex; align-items: center; justify-content: center; gap: 7px;
        }
        .btn:hover    { background: #1b5e20; }
        .btn:disabled { background: #a5d6a7; cursor: not-allowed; }
        .error { color: red; font-size: 11px; margin-top: 6px; text-align: center; }
        .bottom { text-align: center; font-size: 11.5px; margin-top: 14px; }
        .bottom a { color: #2E7D32; text-decoration: none; font-weight: 600; }
      `}</style>

      <div className="wrapper">
        <div className="bg">
          <Image src="/images/home1.png" alt="bg" fill style={{ objectFit: "cover" }} />
        </div>
        <div className="overlay" />

        <div className="card">
          <div className="logo">SIPEKA</div>
          <div className="subtitle">Sign in</div>

          {/* Email */}
          <div className="input-group">
            <label className="label">Email</label>
            <div className="input-wrap">
              <span className="icon-left">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="4" width="20" height="16" rx="2"/>
                  <polyline points="2,4 12,13 22,4"/>
                </svg>
              </span>
              <input
                type="email"
                className="input"
                placeholder="fulan@gmail.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") handleLogin(); }}
              />
            </div>
          </div>

          {/* Password */}
          <div className="input-group">
            <div className="row">
              <label className="label" style={{ marginBottom: 0 }}>Password</label>
              <Link href="/auth/forgot-password">Forgot password?</Link>
            </div>
            <div className="input-wrap" style={{ marginTop: 4 }}>
              <span className="icon-left">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2"/>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
              </span>
              <input
                type={showPassword ? "text" : "password"}
                className="input"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") handleLogin(); }}
              />
              <button className="icon-right" onClick={() => setShowPassword(s => !s)} type="button" tabIndex={-1}>
                {showPassword ? (
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/>
                    <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/>
                    <path d="M14.12 14.12a3 3 0 11-4.24-4.24"/>
                    <line x1="1" y1="1" x2="23" y2="23"/>
                  </svg>
                ) : (
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                    <circle cx="12" cy="12" r="3"/>
                  </svg>
                )}
              </button>
            </div>
          </div>

          {error && <p className="error">{error}</p>}

          <button className="btn" onClick={handleLogin} disabled={loading}>
            {loading ? (
              <>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" style={{ animation: "spin .7s linear infinite" }}>
                  <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
                </svg>
                Memproses...
              </>
            ) : (
              <>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/>
                  <polyline points="10 17 15 12 10 7"/>
                  <line x1="15" y1="12" x2="3" y2="12"/>
                </svg>
                Login
              </>
            )}
          </button>

          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

          <div className="bottom">
            Belum punya akun? <Link href="/auth/regis">Daftar</Link>
          </div>
        </div>
      </div>
    </>
  );
}