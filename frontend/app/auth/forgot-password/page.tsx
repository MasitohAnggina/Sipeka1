"use client";

import Image from "next/image";
import { useState } from "react";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [email, setEmail]     = useState("");
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sent, setSent]       = useState(false);

  const handleSubmit = async () => {
    setMessage("");
    setIsError(false);
    setLoading(true);
    try {
      const res = await fetch("http://127.0.0.1:8000/api/forgot-password", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        setIsError(true);
        setMessage(data.message || "Terjadi kesalahan");
        return;
      }

      setSent(true);
      setMessage(data.message);
    } catch {
      setIsError(true);
      setMessage("Terjadi kesalahan, coba lagi");
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
          width: 340px;
          background: rgba(255,255,255,0.92);
          border-radius: 14px;
          padding: 26px 24px;
          box-shadow: 0 12px 35px rgba(0,0,0,0.15);
        }

        .logo     { text-align: center; font-size: 18px; font-weight: 600; margin-bottom: 6px; }
        .subtitle { text-align: center; font-size: 12px; color: #777; margin-bottom: 18px; }
        .desc     { font-size: 11.5px; color: #777; margin-bottom: 16px; line-height: 1.5; text-align: center; }

        .input-group { margin-bottom: 14px; }

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

        .input {
          width: 100%;
          padding: 10px 12px 10px 36px;
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
          margin-top: 6px;
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
          margin-top: 12px;
          text-align: center;
          line-height: 1.5;
        }

        .message.error   { color: #c62828; }
        .message.success { color: #2E7D32; }

        .bottom { text-align: center; font-size: 11.5px; margin-top: 16px; }
        .bottom a { color: #2E7D32; text-decoration: none; font-weight: 600; }
      `}</style>

      <div className="wrapper">
        <div className="bg">
          <Image src="/images/home1.png" alt="bg" fill style={{ objectFit: "cover" }} />
        </div>
        <div className="overlay" />

        <div className="card">
          <div className="logo">SIPEKA</div>
          <div className="subtitle">Lupa Password</div>

          {!sent ? (
            <>
              <p className="desc">
                Masukkan email akun kamu. Kami akan kirim link untuk reset password.
              </p>

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
                    onKeyDown={e => { if (e.key === "Enter") handleSubmit(); }}
                  />
                </div>
              </div>

              <button className="btn" onClick={handleSubmit} disabled={loading || !email}>
                {loading ? (
                  <>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" style={{ animation: "spin .7s linear infinite" }}>
                      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
                    </svg>
                    Mengirim...
                  </>
                ) : (
                  "Kirim Link Reset"
                )}
              </button>

              <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </>
          ) : (
            <div style={{ textAlign: "center" }}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#2E7D32" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ margin: "0 auto 10px" }}>
                <path d="M22 4L12 14.01l-3-3"/>
                <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
              </svg>
            </div>
          )}

          {message && (
            <p className={`message ${isError ? "error" : "success"}`}>{message}</p>
          )}

          <div className="bottom">
            <Link href="/auth/login_dokter">Kembali ke Login</Link>
          </div>
        </div>
      </div>
    </>
  );
}