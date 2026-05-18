"use client";

import { useState } from "react";
import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar_admin";

type StatusType = "Menunggu" | "Selesai";

interface Payment {
  id: string;
  pet: string;
  species: string;
  owner: string;
  total: number;
  method: string;
  date: string;
  time: string;
  status: StatusType;
}

function money(n: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency", currency: "IDR", maximumFractionDigits: 0,
  }).format(n);
}

const initialPayments: Payment[] = [
  { id: "TRX2402001", pet: "Meng-Meng", species: "Kucing Persia",  owner: "Anggun Wahyu", total: 120000, method: "Transfer (Bank BCA)",     date: "30 Apr 2024", time: "11:10 WIB", status: "Menunggu" },
  { id: "TRX2402002", pet: "Rex",        species: "Anjing Golden",  owner: "Ani Wijaya",   total: 250000, method: "Transfer (Bank BRI)",     date: "30 Apr 2024", time: "13:45 WIB", status: "Menunggu" },
  { id: "TRX2402003", pet: "Coco",       species: "Kelinci Lop",    owner: "Dian Rahayu",  total: 200000, method: "QRIS",                    date: "29 Apr 2024", time: "09:22 WIB", status: "Selesai"  },
  { id: "TRX2402004", pet: "Buddy",      species: "Anjing Poodle",  owner: "Maya Tanoto",  total: 500000, method: "Transfer (Bank Mandiri)", date: "29 Apr 2024", time: "15:00 WIB", status: "Selesai"  },
  { id: "TRX2402005", pet: "Luna",       species: "Kucing Anggora", owner: "Rian Pratama", total: 150000, method: "Transfer (Bank BCA)",     date: "28 Apr 2024", time: "10:05 WIB", status: "Menunggu" },
];

const statusStyle: Record<StatusType, { color: string }> = {
  Menunggu: { color: "#d97706" },
  Selesai:  { color: "#2E7D32" },
};

const speciesEmoji: Record<string, string> = {
  Kucing: "🐱", Anjing: "🐕", Kelinci: "🐇", Burung: "🐦", Hamster: "🐹",
};
function getEmoji(species: string) {
  const key = Object.keys(speciesEmoji).find((k) => species.includes(k));
  return key ? speciesEmoji[key] : "🐾";
}

const inputSt: React.CSSProperties = {
  width: "100%", padding: "8px 12px",
  border: "1px solid #d1d5db", borderRadius: "8px",
  fontSize: "13px", color: "#1a1a1a",
  fontFamily: "Segoe UI, sans-serif", outline: "none",
  background: "#fff", boxSizing: "border-box" as const,
};
const labelSt: React.CSSProperties = {
  display: "block", fontSize: "13px", fontWeight: 600,
  color: "#555", marginBottom: "5px",
};

// ── Modal ──────────────────────────────────────────────────────────────────
function DetailModal({
  payment, onClose, onSelesai,
}: {
  payment: Payment;
  onClose: () => void;
  onSelesai: (id: string) => void;
}) {
  const isPending = payment.status === "Menunggu";

  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 999,
        background: "rgba(0,0,0,0.35)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "16px",
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: "100%", maxWidth: "520px",
          background: "#fff", borderRadius: "12px",
          padding: "24px", boxShadow: "0 8px 32px rgba(0,0,0,0.18)",
          maxHeight: "90vh", overflowY: "auto",
          fontFamily: "Segoe UI, sans-serif",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal header */}
        <div style={{
          display: "flex", alignItems: "center",
          justifyContent: "space-between", marginBottom: "20px",
        }}>
          <div>
            <p style={{ margin: 0, fontSize: "15px", fontWeight: 700, color: "#1a1a1a" }}>
              Detail Transaksi
            </p>
            <p style={{ margin: 0, fontSize: "12px", color: "#888", marginTop: "2px" }}>
              Kelola detail transaksi yang perlu dikonfirmasi.
            </p>
          </div>
          <button onClick={onClose} style={{
            border: "none", background: "#f3f4f6", borderRadius: "50%",
            width: "30px", height: "30px", fontSize: "16px", cursor: "pointer",
            color: "#888", display: "flex", alignItems: "center", justifyContent: "center",
          }}>×</button>
        </div>

        {/* Pet info + status */}
        <div style={{
          display: "flex", alignItems: "center",
          justifyContent: "space-between", marginBottom: "16px",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{
              width: "48px", height: "48px", borderRadius: "8px",
              background: "#f0faf2", display: "flex",
              alignItems: "center", justifyContent: "center", fontSize: "24px",
            }}>
              {getEmoji(payment.species)}
            </div>
            <div>
              <p style={{ margin: 0, fontSize: "14px", fontWeight: 700, color: "#1a1a1a" }}>
                {payment.pet}
              </p>
              <p style={{ margin: 0, fontSize: "12px", color: "#888" }}>{payment.species}</p>
            </div>
          </div>
          <span style={{
            fontSize: "13px", fontWeight: 600,
            color: statusStyle[payment.status].color,
          }}>
            {payment.status}
          </span>
        </div>

        {/* Summary grid */}
        <div style={{
          display: "grid", gridTemplateColumns: "1fr 1fr 1fr",
          gap: "10px", marginBottom: "16px",
        }}>
          {[
            { label: "Pemilik", value: payment.owner,        color: "#1a1a1a" },
            { label: "Total",   value: money(payment.total), color: "#2E7D32" },
            { label: "Tanggal", value: payment.date,         color: "#1a1a1a" },
          ].map((item) => (
            <div key={item.label} style={{
              padding: "12px", borderRadius: "8px",
              background: "#f9f9f9", border: "1px solid #f0f0f0",
            }}>
              <p style={{ margin: 0, fontSize: "12px", color: "#888", marginBottom: "4px" }}>
                {item.label}
              </p>
              <p style={{ margin: 0, fontSize: "13px", fontWeight: 600, color: item.color }}>
                {item.value}
              </p>
            </div>
          ))}
        </div>

        <div style={{ height: "1px", background: "#f0f0f0", margin: "14px 0" }} />

        {/* ID Transaksi */}
        <div style={{ marginBottom: "12px" }}>
          <label style={labelSt}>ID Transaksi</label>
          <div style={{
            display: "flex", alignItems: "center",
            justifyContent: "space-between",
            padding: "8px 12px", border: "1px solid #d1d5db",
            borderRadius: "8px", background: "#f9f9f9",
            fontSize: "13px", color: "#1a1a1a",
          }}>
            <span style={{ fontWeight: 700 }}>{payment.id}</span>
            <span style={{ color: "#888", fontSize: "12px" }}>{payment.time}</span>
          </div>
        </div>

        {/* Metode Pembayaran */}
        <div style={{ marginBottom: "12px" }}>
          <label style={labelSt}>Metode Pembayaran</label>
          <div style={{
            padding: "8px 12px", border: "1px solid #d1d5db",
            borderRadius: "8px", background: "#f9f9f9",
            fontSize: "13px", color: "#1a1a1a",
          }}>
            {payment.method}
          </div>
        </div>

        {/* No. Referensi */}
        <div style={{ marginBottom: "12px" }}>
          <label style={labelSt}>No. Referensi <span style={{ fontWeight: 400, color: "#aaa" }}>(Opsional)</span></label>
          <input style={inputSt} placeholder="Tambahkan nomor referensi pembayaran..." />
        </div>

        {/* Catatan */}
        <div style={{ marginBottom: "12px" }}>
          <label style={labelSt}>Catatan Verifikasi</label>
          <textarea
            style={{ ...inputSt, resize: "none" } as React.CSSProperties}
            rows={3}
            placeholder="Tambahkan catatan pembayaran..."
          />
        </div>

        <div style={{ height: "1px", background: "#f0f0f0", margin: "14px 0" }} />

        {/* Status ringkasan */}
        <div style={{ marginBottom: "18px" }}>
          <label style={labelSt}>Status Pembayaran</label>
          <div style={{
            display: "flex", alignItems: "center",
            justifyContent: "space-between",
            padding: "8px 12px", border: "1px solid #d1d5db",
            borderRadius: "8px", background: "#f9f9f9",
            fontSize: "13px",
          }}>
            <span style={{ color: statusStyle[payment.status].color, fontWeight: 600 }}>
              {payment.status}
            </span>
            <span style={{ fontWeight: 700, color: "#2E7D32" }}>{money(payment.total)}</span>
          </div>
        </div>

        {/* Action buttons */}
        <div style={{ display: "flex", gap: "8px" }}>
          <button
            onClick={onClose}
            style={{
              padding: "7px 18px", borderRadius: "8px",
              border: "1px solid #d1d5db", background: "#fff",
              color: "#555", fontSize: "13px", fontWeight: 600,
              cursor: "pointer", fontFamily: "Segoe UI, sans-serif",
            }}
          >Tutup</button>

          {isPending && (
            <button
              onClick={() => { onSelesai(payment.id); onClose(); }}
              style={{
                flex: 1, padding: "7px 18px", borderRadius: "8px",
                border: "none", background: "#2E7D32",
                color: "#fff", fontSize: "13px", fontWeight: 600,
                cursor: "pointer", fontFamily: "Segoe UI, sans-serif",
              }}
            >Verifikasi</button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────
export default function VerifikasiPembayaranPage() {
  const [payments, setPayments] = useState<Payment[]>(initialPayments);
  const [selected, setSelected] = useState<Payment | null>(null);
  const [filter, setFilter] = useState<"Semua" | StatusType>("Semua");

  const handleSelesai = (id: string) =>
    setPayments((prev) => prev.map((p) => p.id === id ? { ...p, status: "Selesai" } : p));

  const counts = {
    Semua:    payments.length,
    Menunggu: payments.filter((p) => p.status === "Menunggu").length,
    Selesai:  payments.filter((p) => p.status === "Selesai").length,
  };

  const filtered = filter === "Semua" ? payments : payments.filter((p) => p.status === filter);

  const stats: { key: "Semua" | StatusType; icon: string; label: string }[] = [
    { key: "Semua",    icon: "🧾", label: "Total Transaksi" },
    { key: "Menunggu", icon: "⏳", label: "Menunggu" },
    { key: "Selesai",  icon: "✅", label: "Selesai" },
  ];

  return (
    <div style={{
      display: "flex", height: "100vh",
      backgroundColor: "#f5f5f5", fontFamily: "Segoe UI, sans-serif",
    }}>
      <Sidebar activePage="pembayaran" />

      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflowY: "auto" }}>
        <Header
          title="Verifikasi Pembayaran"
          subtitle="Kelola konfirmasi pembayaran pasien"
        />

        <main style={{ flex: 1, padding: "24px" }}>

          {/* Stats Cards */}
          <div style={{
            display: "grid", gridTemplateColumns: "repeat(3, 1fr)",
            gap: "16px", marginBottom: "24px",
          }}>
            {stats.map((stat) => {
              const isActive = filter === stat.key;
              return (
                <div
                  key={stat.key}
                  onClick={() => setFilter(stat.key)}
                  style={{
                    backgroundColor: isActive ? "#f0faf2" : "#ffffff",
                    borderRadius: "12px",
                    padding: "16px 20px",
                    boxShadow: "0 1px 4px rgba(0,0,0,0.07)",
                    display: "flex", alignItems: "center", gap: "12px",
                    border: isActive ? "1.5px solid #2E7D32" : "1.5px solid transparent",
                    cursor: "pointer", transition: "all 0.15s ease",
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) e.currentTarget.style.border = "1.5px solid #a7d7a9";
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) e.currentTarget.style.border = "1.5px solid transparent";
                  }}
                >
                  <span style={{ fontSize: "22px" }}>{stat.icon}</span>
                  <div>
                    <p style={{ margin: 0, fontSize: "13px", color: "#888" }}>{stat.label}</p>
                    <p style={{ margin: 0, fontSize: "20px", fontWeight: 700, color: "#1a1a1a" }}>
                      {counts[stat.key]}
                      <span style={{ fontSize: "13px", fontWeight: 400, color: "#888" }}> Transaksi</span>
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Table Card */}
          <div style={{
            backgroundColor: "#ffffff", borderRadius: "12px",
            boxShadow: "0 1px 4px rgba(0,0,0,0.07)", overflow: "hidden",
          }}>
            <div style={{
              display: "flex", alignItems: "center",
              justifyContent: "space-between",
              padding: "14px 20px", borderBottom: "1px solid #f0f0f0",
            }}>
              <p style={{ margin: 0, fontSize: "14px", fontWeight: 700, color: "#1a1a1a" }}>
                Daftar Pembayaran{filter !== "Semua" ? ` — ${filter}` : ""}
              </p>
              <span style={{ fontSize: "13px", color: "#888" }}>{filtered.length} data</span>
            </div>

            <div style={{
              display: "grid",
              gridTemplateColumns: "140px 160px 140px 1fr 130px 140px 120px 90px",
              padding: "12px 20px",
              backgroundColor: "#f9f9f9",
              borderBottom: "1px solid #f0f0f0",
            }}>
              {["ID Transaksi","Hewan","Pemilik","Metode","Total","Tanggal","Status","Aksi"].map((h) => (
                <span key={h} style={{ fontSize: "13px", fontWeight: 600, color: "#555" }}>{h}</span>
              ))}
            </div>

            {filtered.length === 0 ? (
              <div style={{ padding: "40px", textAlign: "center", color: "#aaa", fontSize: "14px" }}>
                Tidak ada data untuk filter ini.
              </div>
            ) : filtered.map((p, i) => (
              <div key={p.id} style={{
                display: "grid",
                gridTemplateColumns: "140px 160px 140px 1fr 130px 140px 120px 90px",
                padding: "14px 20px",
                borderBottom: i < filtered.length - 1 ? "1px solid #f0f0f0" : "none",
                alignItems: "center",
              }}>
                <p style={{ margin: 0, fontSize: "13px", fontWeight: 700, color: "#2E7D32" }}>
                  {p.id}
                </p>

                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ fontSize: "20px" }}>{getEmoji(p.species)}</span>
                  <div>
                    <p style={{ margin: 0, fontSize: "14px", fontWeight: 600, color: "#1a1a1a" }}>
                      {p.pet}
                    </p>
                    <p style={{ margin: 0, fontSize: "12px", color: "#888" }}>{p.species}</p>
                  </div>
                </div>

                <p style={{ margin: 0, fontSize: "13px", color: "#1a1a1a" }}>{p.owner}</p>
                <p style={{ margin: 0, fontSize: "12px", color: "#888" }}>{p.method}</p>
                <p style={{ margin: 0, fontSize: "14px", fontWeight: 600, color: "#1a1a1a" }}>
                  {money(p.total)}
                </p>

                <div>
                  <p style={{ margin: 0, fontSize: "13px", color: "#1a1a1a" }}>{p.date}</p>
                  <p style={{ margin: 0, fontSize: "12px", color: "#888" }}>{p.time}</p>
                </div>

                <span style={{
                  fontSize: "13px", fontWeight: 600,
                  color: statusStyle[p.status].color,
                }}>
                  {p.status}
                </span>

                <button
                  onClick={() => setSelected(p)}
                  style={{
                    padding: "5px 14px", borderRadius: "8px",
                    border: "1px solid #d1d5db", background: "#fff",
                    color: "#2E7D32", fontSize: "13px", fontWeight: 600,
                    cursor: "pointer", fontFamily: "Segoe UI, sans-serif",
                  }}
                >Detail →</button>
              </div>
            ))}
          </div>

        </main>
      </div>

      {selected && (
        <DetailModal
          payment={payments.find((p) => p.id === selected.id)!}
          onClose={() => setSelected(null)}
          onSelesai={handleSelesai}
        />
      )}
    </div>
  );
}