"use client";

import Image from "next/image";
import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

export default function ResetPasswordPage() {
  const searchParams = useSearchParams();
  const router        = useRouter();

  const email = searchParams.get("email") || "";
  const token = searchParams.get("token") || "";

  const [showPassword, setShowPassword]   = useState(false);
  const [password, setPassword]           = useState("");
  const [confirm, setConfirm]              = useState("");
  const [message, setMessage]              = useState("");
  const [isError, setIsError]              = useState(false);
  const [loading, setLoading]              = useState(false);
  const [success, setSuccess]              = useState(false);

  const handleSubmit = async () => {
    setMessage("");
    setIsError(false);

    if (password !== confirm) {
      setIsError(true);
      setMessage("Konfirmasi password tidak cocok");
      return;
    }

    if (password.length < 6) {
      setIsError(true);
      setMessage("Password minimal 6 karakter");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("http://127.0.0.1:8000/api/reset-password", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          email,
          token,
          password,
          password_confirmation: confirm,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setIsError(true);
        setMessage(data.message || "Terjadi kesalahan");
        return;
      }

      setSuccess(true);
      setMessage(data.message);
      setTimeout(() => router.push("/auth/login_dokter"), 1800);
    } catch {
      setIsError(true);
      setMessage("Terjadi kesalahan, coba lagi");
    } finally {
      setLoading(false);
    }
  };

  if (!email || !token) {
    return (
      <>
        <style>{`
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body { font-family: 'Inter', sans-serif; }
          .wrapper { height: 100vh; display: flex; align-items: center; justify-content: center; }
          .card { width: 340px; background: #fff; border-radius: 14px; padding: 26px 24px; box-shadow: 0 12px 35px rgba(0,0,0,0.15); text-align: center; }
          .logo { font-size: 18px; font-weight: 600; margin-bottom: 10px; }
          .desc { font-size: 12px; color: #777; margin-bottom: 16px; }
          a { color: #2E7D32; text-decoration: none; font-weight: 600; font-size: 12px; }
        `}</style>
        <div className="wrapper">
          <div className="card">
            <div className="logo">SIPEKA</div>
            <p className="desc">Link reset password tidak valid atau sudah kedaluwarsa.</p>
            <Link href="/auth/forgot-password">Minta link baru</Link>
          </div>
        </div>
      </>
    );
  }

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
          width: 340px;
          background: rgba(255,255,255,0.92);
          border-radius: 14px;
          padding: 26px 24px;
          box-shadow: 0 12px 35px rgba(0,0,0,0.15);
        }

        .logo     { text-align: center; font-size: 18px; font-weight: 600; margin-bottom: 6px; }
        .subtitle { text-align: center; font-size: 12px; color: #777; margin-bottom: 4px; }
        .email-tag { text-align: center; font-size: 11.5px; color: #2E7D32; font-weight: 600; margin-bottom: 16px; }

        .input-group { margin-bottom: 12px; }

        .label {
          font-size: 11px;
          color: #666;
          margin-bottom: 4px;
          display: block;
        }

        .input-wrap {
          position: relative;
          display: flex;
          align-items: center;
        }

        .input-wrap .icon-left {
          position: absolute;
          left: 10px;
          display: flex;
          align-items: center;
          pointer-events: none;
          color: #aaa;
        }

        .input-wrap .icon-right {
          position: absolute;
          right: 10px;
          display: flex;
          align-items: center;
          background: none;
          border: none;
          cursor: pointer;
          padding: 0;
          color: #aaa;
        }

        .input-wrap .icon-right:hover { color: #2E7D32; }

        .input {
          width: 100%;
          padding: 10px 36px;
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
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 7px;
        }

        .btn:hover    { background: #1b5e20; }
        .btn:disabled { background: #a5d6a7; cursor: not-allowed; }

        .message {
          font-size: 11.5px;
          margin-top: 10px;
          text-align: center;
          line-height: 1.5;
        }

        .message.error   { color: #c62828; }
        .message.success { color: #2E7D32; }

        .bottom { text-align: center; font-size: 11.5px; margin-top: 14px; }
        .bottom a { color: #2E7D32; text-decoration: none; font-weight: 600; }

        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>

      <div className="wrapper">
        <div className="bg">
          <Image src="/images/home1.png" alt="bg" fill style={{ objectFit: "cover" }} />
        </div>
        <div className="overlay" />

        <div className="card">
          <div className="logo">SIPEKA</div>
          <div className="subtitle">Reset Password</div>
          <div className="email-tag">{email}</div>

          {/* ── Password baru ── */}
          <div className="input-group">
            <label className="label">Password Baru</label>
            <div className="input-wrap">
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
                onKeyDown={e => { if (e.key === "Enter") handleSubmit(); }}
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

          {/* ── Konfirmasi password ── */}
          <div className="input-group">
            <label className="label">Konfirmasi Password</label>
            <div className="input-wrap">
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
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") handleSubmit(); }}
              />
            </div>
          </div>

          {message && (
            <p className={`message ${isError ? "error" : "success"}`}>{message}</p>
          )}

          <button className="btn" onClick={handleSubmit} disabled={loading || success}>
            {loading ? (
              <>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" style={{ animation: "spin .7s linear infinite" }}>
                  <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
                </svg>
                Memproses...
              </>
            ) : success ? (
              "Berhasil! Mengalihkan..."
            ) : (
              "Reset Password"
            )}
          </button>

          <div className="bottom">
            <Link href="/auth/login_dokter">Kembali ke Login</Link>
          </div>
        </div>
      </div>
    </>
  );
}