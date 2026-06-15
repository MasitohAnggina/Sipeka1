"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Sidebar from "@/components/Sidebar_owner_pet";
import Header from "@/components/Header";
import { getToken } from "@/lib/auth";
import {
  CreditCard, ChevronDown, ChevronUp, Receipt,
  CheckCircle2, Clock, AlertCircle, Loader2,
  Stethoscope, Pill, Banknote, Smartphone,
  MapPin, X, PawPrint, Cat, Dog, Rabbit, Bird,
  Calendar, Hash, ArrowRight, ShieldCheck,
  RefreshCw, Info,
} from "lucide-react";

const API_BASE = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000") + "/api";
const G = "#2e7d32";

/* ─── Types ──────────────────────────────────────────────────────────── */
interface DetailItem {
  id_detail: number;
  tipe: "layanan" | "obat";
  nama_item: string;
  harga_satuan: number;
  qty: number;
  subtotal: number;
}

interface Pembayaran {
  id_pembayaran: number;
  status: "menunggu_pembayaran" | "pending_cash" | "pending_midtrans" | "lunas" | "gagal";
  metode: "cash" | "midtrans" | null;
  snap_token?: string | null;
}

interface Invoice {
  id_resep: number;
  id_booking: number;
  tanggal: string;
  catatan: string | null;
  grand_total: number;
  pembayaran: Pembayaran;
  details: DetailItem[];
}

interface HewanInvoice {
  id_hewan: number;
  nama_hewan: string;
  jenis: string;
  ras: string;
  foto: string | null;
  invoices: Invoice[];
}

/* ─── Helpers ────────────────────────────────────────────────────────── */
const fmt = (n: number) => "Rp " + n.toLocaleString("id-ID");

const fmtTanggal = (iso: string) =>
  new Date(iso).toLocaleDateString("id-ID", {
    day: "2-digit", month: "short", year: "numeric",
  });

function HewanIcon({ jenis, size = 18 }: { jenis: string; size?: number }) {
  const s = { width: size, height: size };
  if (jenis === "Kucing")  return <Cat  style={s} />;
  if (jenis === "Anjing")  return <Dog  style={s} />;
  if (jenis === "Kelinci") return <Rabbit style={s} />;
  if (jenis === "Burung")  return <Bird style={s} />;
  return <PawPrint style={s} />;
}

/* ─── Skeleton ───────────────────────────────────────────────────────── */
function SkeletonPembayaran() {
  return (
    <>
      <style>{`
        @keyframes sk-pay {
          0%   { background-position: -600px 0; }
          100% { background-position:  600px 0; }
        }
        .sk-pay {
          background: linear-gradient(90deg, #e8e8e8 25%, #f2f2f2 50%, #e8e8e8 75%);
          background-size: 1200px 100%;
          animation: sk-pay 1.5s ease-in-out infinite;
          border-radius: 6px;
        }
      `}</style>

      {/* Summary cards skeleton */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14, marginBottom: 22 }}>
        {[0, 1, 2].map(i => (
          <div key={i} style={{ background: "#fff", border: "1px solid #e8e8e8", borderRadius: 12, padding: "14px 16px", display: "flex", alignItems: "center", gap: 12 }}>
            <div className="sk-pay" style={{ width: 40, height: 40, borderRadius: 10, flexShrink: 0 }} />
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
              <div className="sk-pay" style={{ height: 10, width: "60%" }} />
              <div className="sk-pay" style={{ height: 20, width: "40%" }} />
              <div className="sk-pay" style={{ height: 9, width: "50%" }} />
            </div>
          </div>
        ))}
      </div>

      {/* Refresh button skeleton */}
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 14 }}>
        <div className="sk-pay" style={{ width: 90, height: 32, borderRadius: 8 }} />
      </div>

      {/* Hewan section skeletons */}
      {[0, 1].map(i => (
        <div key={i} style={{ background: "#fff", borderRadius: 14, border: "1px solid #e8e8e8", marginBottom: 16, overflow: "hidden" }}>
          {/* Hewan header */}
          <div style={{ padding: "14px 18px", display: "flex", alignItems: "center", gap: 12, borderBottom: "1px solid #f0f0f0" }}>
            <div className="sk-pay" style={{ width: 46, height: 46, borderRadius: "50%", flexShrink: 0 }} />
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
              <div className="sk-pay" style={{ height: 14, width: "35%" }} />
              <div className="sk-pay" style={{ height: 10, width: "55%" }} />
            </div>
            <div className="sk-pay" style={{ width: 16, height: 16, borderRadius: 4 }} />
          </div>
          {/* Invoice card skeletons */}
          <div style={{ padding: "12px 16px", display: "flex", flexDirection: "column", gap: 10 }}>
            {[0, 1].map(j => (
              <div key={j} style={{ border: "1px solid #e8e8e8", borderRadius: 12, padding: "13px 16px", display: "flex", alignItems: "center", gap: 10 }}>
                <div className="sk-pay" style={{ width: 34, height: 34, borderRadius: 8, flexShrink: 0 }} />
                <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 5 }}>
                  <div className="sk-pay" style={{ height: 12, width: "45%" }} />
                  <div className="sk-pay" style={{ height: 9, width: "30%" }} />
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div className="sk-pay" style={{ width: 70, height: 18 }} />
                  <div className="sk-pay" style={{ width: 60, height: 30, borderRadius: 8 }} />
                  <div className="sk-pay" style={{ width: 28, height: 28, borderRadius: 7 }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </>
  );
}

/* ─── Status badge ───────────────────────────────────────────────────── */
const STATUS_CFG: Record<
  Pembayaran["status"],
  { label: string; color: string; bg: string; icon: React.ReactNode }
> = {
  menunggu_pembayaran: {
    label: "Belum Dibayar",
    color: "#b45309", bg: "#fef3c7",
    icon: <Clock style={{ width: 11, height: 11 }} />,
  },
  pending_cash: {
    label: "Menunggu Kasir",
    color: "#1d4ed8", bg: "#eff6ff",
    icon: <Banknote style={{ width: 11, height: 11 }} />,
  },
  pending_midtrans: {
    label: "Menunggu Pembayaran",
    color: "#7c3aed", bg: "#f5f3ff",
    icon: <Smartphone style={{ width: 11, height: 11 }} />,
  },
  lunas: {
    label: "Lunas",
    color: G, bg: "#f0faf2",
    icon: <CheckCircle2 style={{ width: 11, height: 11 }} />,
  },
  gagal: {
    label: "Gagal / Expired",
    color: "#dc2626", bg: "#fef2f2",
    icon: <AlertCircle style={{ width: 11, height: 11 }} />,
  },
};

function StatusBadge({ status }: { status: Pembayaran["status"] }) {
  const cfg = STATUS_CFG[status];
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 4,
      fontSize: 11, fontWeight: 600,
      color: cfg.color, background: cfg.bg,
      border: `1px solid ${cfg.color}33`,
      borderRadius: 20, padding: "3px 9px",
    }}>
      {cfg.icon} {cfg.label}
    </span>
  );
}

/* ─── Modal: Pilih Metode Bayar ──────────────────────────────────────── */
function ModalBayar({
  invoice,
  onClose,
  onBayar,
}: {
  invoice: Invoice;
  onClose(): void;
  onBayar(metode: "cash" | "midtrans"): Promise<void>;
}) {
  const [loading, setLoading] = useState(false);
  const [chosen,  setChosen]  = useState<"cash" | "midtrans" | null>(null);
  const [error,   setError]   = useState<string | null>(null);

  async function handlePilih(metode: "cash" | "midtrans") {
    setChosen(metode);
    setLoading(true);
    setError(null);
    try {
      await onBayar(metode);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Terjadi kesalahan");
      setChosen(null);
    } finally {
      setLoading(false);
    }
  }

  const isBisa =
    invoice.pembayaran.status === "menunggu_pembayaran" ||
    invoice.pembayaran.status === "gagal" ||
    invoice.pembayaran.status === "pending_midtrans";

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 1000,
        background: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: 16,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: "#fff", borderRadius: 16,
          width: "100%", maxWidth: 440,
          boxShadow: "0 24px 64px rgba(0,0,0,0.18)",
          fontFamily: "'Inter', sans-serif",
          overflow: "hidden",
        }}
      >
        <div style={{
          padding: "18px 20px", borderBottom: "1px solid #f0f0f0",
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{
              width: 32, height: 32, borderRadius: 8,
              background: "#f0faf2", display: "flex",
              alignItems: "center", justifyContent: "center",
            }}>
              <CreditCard style={{ width: 16, height: 16, color: G }} />
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#111" }}>Pilih Metode Bayar</div>
              <div style={{ fontSize: 11, color: "#888" }}>Invoice #{invoice.id_resep}</div>
            </div>
          </div>
          <button onClick={onClose} style={{
            width: 28, height: 28, borderRadius: "50%",
            border: "none", background: "#f5f5f5",
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer", color: "#888",
          }}>
            <X style={{ width: 14, height: 14 }} />
          </button>
        </div>

        <div style={{ padding: "16px 20px" }}>
          <div style={{
            background: "linear-gradient(135deg, #f0faf2, #e8f5e9)",
            border: "1px solid #c8e6c9", borderRadius: 10,
            padding: "12px 16px",
            display: "flex", alignItems: "center", justifyContent: "space-between",
            marginBottom: 16,
          }}>
            <div>
              <div style={{ fontSize: 11, color: "#666", marginBottom: 2 }}>Total Tagihan</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: G }}>{fmt(invoice.grand_total)}</div>
            </div>
            <Receipt style={{ width: 28, height: 28, color: "#a5d6a7" }} />
          </div>

          {error && (
            <div style={{
              display: "flex", alignItems: "flex-start", gap: 8,
              padding: "10px 12px", background: "#fef2f2",
              border: "1px solid #fecaca", borderRadius: 8, marginBottom: 14,
            }}>
              <AlertCircle style={{ width: 14, height: 14, color: "#dc2626", flexShrink: 0, marginTop: 1 }} />
              <span style={{ fontSize: 12, color: "#dc2626" }}>{error}</span>
            </div>
          )}

          {!isBisa ? (
            <div style={{
              padding: "14px 16px", background: "#f0faf2",
              border: "1px solid #a5d6a7", borderRadius: 10,
              display: "flex", alignItems: "center", gap: 10, fontSize: 13, color: G,
            }}>
              <CheckCircle2 style={{ width: 16, height: 16, flexShrink: 0 }} />
              Invoice ini sudah {invoice.pembayaran.status === "lunas" ? "lunas" : invoice.pembayaran.status}.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <div style={{ fontSize: 12, color: "#888", marginBottom: 2 }}>Pilih cara pembayaran:</div>

              <button
                onClick={() => handlePilih("cash")}
                disabled={loading}
                style={{
                  width: "100%", padding: "14px 16px", borderRadius: 12,
                  border: `1.5px solid ${chosen === "cash" ? G : "#e0e0e0"}`,
                  background: chosen === "cash" ? "#f0faf2" : "#fff",
                  cursor: loading ? "not-allowed" : "pointer",
                  display: "flex", alignItems: "center", gap: 14,
                  textAlign: "left", fontFamily: "inherit",
                  transition: "all 0.15s",
                  opacity: loading && chosen !== "cash" ? 0.5 : 1,
                }}
                onMouseEnter={e => { if (!loading) e.currentTarget.style.borderColor = G; }}
                onMouseLeave={e => { if (chosen !== "cash") e.currentTarget.style.borderColor = "#e0e0e0"; }}
              >
                <div style={{
                  width: 44, height: 44, borderRadius: 10,
                  background: "#f0faf2", border: "1.5px solid #c8e6c9",
                  display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                }}>
                  {loading && chosen === "cash"
                    ? <Loader2 style={{ width: 20, height: 20, color: G, animation: "spin 1s linear infinite" }} />
                    : <Banknote style={{ width: 20, height: 20, color: G }} />
                  }
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "#111", marginBottom: 2 }}>Bayar Tunai (Cash)</div>
                  <div style={{ fontSize: 12, color: "#888", lineHeight: 1.4 }}>Lakukan pembayaran langsung di kasir klinik</div>
                </div>
                <ArrowRight style={{ width: 14, height: 14, color: "#bbb", flexShrink: 0 }} />
              </button>

              <button
                onClick={() => handlePilih("midtrans")}
                disabled={loading}
                style={{
                  width: "100%", padding: "14px 16px", borderRadius: 12,
                  border: `1.5px solid ${chosen === "midtrans" ? "#7c3aed" : "#e0e0e0"}`,
                  background: chosen === "midtrans" ? "#f5f3ff" : "#fff",
                  cursor: loading ? "not-allowed" : "pointer",
                  display: "flex", alignItems: "center", gap: 14,
                  textAlign: "left", fontFamily: "inherit",
                  transition: "all 0.15s",
                  opacity: loading && chosen !== "midtrans" ? 0.5 : 1,
                }}
                onMouseEnter={e => { if (!loading) e.currentTarget.style.borderColor = "#7c3aed"; }}
                onMouseLeave={e => { if (chosen !== "midtrans") e.currentTarget.style.borderColor = "#e0e0e0"; }}
              >
                <div style={{
                  width: 44, height: 44, borderRadius: 10,
                  background: "#f5f3ff", border: "1.5px solid #ddd6fe",
                  display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                }}>
                  {loading && chosen === "midtrans"
                    ? <Loader2 style={{ width: 20, height: 20, color: "#7c3aed", animation: "spin 1s linear infinite" }} />
                    : <Smartphone style={{ width: 20, height: 20, color: "#7c3aed" }} />
                  }
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "#111", marginBottom: 2 }}>
                    Bayar Digital
                    <span style={{ marginLeft: 6, fontSize: 10, color: "#7c3aed", background: "#ede9fe", borderRadius: 4, padding: "1px 6px" }}>QRIS · GoPay · Transfer</span>
                  </div>
                  <div style={{ fontSize: 12, color: "#888", lineHeight: 1.4 }}>QRIS, GoPay, ShopeePay, Transfer Bank, dan lainnya</div>
                </div>
                <ArrowRight style={{ width: 14, height: 14, color: "#bbb", flexShrink: 0 }} />
              </button>
            </div>
          )}

          <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 14, padding: "8px 12px", background: "#fafafa", borderRadius: 8 }}>
            <ShieldCheck style={{ width: 13, height: 13, color: "#aaa", flexShrink: 0 }} />
            <span style={{ fontSize: 11, color: "#aaa" }}>Pembayaran aman dan terenkripsi</span>
          </div>
        </div>
      </div>
      <style>{`@keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }`}</style>
    </div>
  );
}

/* ─── Modal: Instruksi Cash ──────────────────────────────────────────── */
function ModalCashInfo({ invoice, onClose }: { invoice: Invoice; onClose(): void }) {
  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 1000,
        background: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: 16,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: "#fff", borderRadius: 16, width: "100%", maxWidth: 420,
          boxShadow: "0 24px 64px rgba(0,0,0,0.18)",
          fontFamily: "'Inter', sans-serif", overflow: "hidden",
        }}
      >
        <div style={{
          background: `linear-gradient(135deg, ${G}, #1b5e20)`,
          padding: "20px 20px 16px",
          display: "flex", alignItems: "flex-start", gap: 12,
        }}>
          <div style={{
            width: 44, height: 44, borderRadius: 10,
            background: "rgba(255,255,255,0.2)",
            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
          }}>
            <Banknote style={{ width: 22, height: 22, color: "#fff" }} />
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#fff" }}>Tagihan Diterima!</div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.75)", marginTop: 2 }}>
              Silakan menuju kasir klinik untuk menyelesaikan pembayaran tunai.
            </div>
          </div>
        </div>

        <div style={{ padding: "16px 20px" }}>
          <div style={{
            background: "#f9f9f9", border: "1px solid #f0f0f0",
            borderRadius: 10, padding: "12px 14px", marginBottom: 14,
          }}>
            <div style={{ fontSize: 11, color: "#888", marginBottom: 6 }}>Rincian tagihan</div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "#333", marginBottom: 4 }}>
              <span>No. Invoice</span>
              <span style={{ fontWeight: 600 }}>#{invoice.id_resep}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "#333" }}>
              <span>Total Tagihan</span>
              <span style={{ fontWeight: 700, color: G }}>{fmt(invoice.grand_total)}</span>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
            {[
              { icon: <Hash style={{ width: 14, height: 14 }} />, text: `Tunjukkan nomor invoice #${invoice.id_resep} ke kasir` },
              { icon: <MapPin style={{ width: 14, height: 14 }} />, text: "Bayar di loket kasir klinik" },
              { icon: <CheckCircle2 style={{ width: 14, height: 14 }} />, text: "Status akan otomatis berubah setelah dikonfirmasi" },
            ].map((item, i) => (
              <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                <div style={{
                  width: 28, height: 28, borderRadius: 7,
                  background: "#f0faf2", display: "flex",
                  alignItems: "center", justifyContent: "center",
                  color: G, flexShrink: 0,
                }}>
                  {item.icon}
                </div>
                <span style={{ fontSize: 13, color: "#444", lineHeight: 1.5, paddingTop: 4 }}>{item.text}</span>
              </div>
            ))}
          </div>

          <button
            onClick={onClose}
            style={{
              width: "100%", padding: "11px", borderRadius: 10,
              border: "none", background: G, color: "#fff",
              fontSize: 13, fontWeight: 600, cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            Mengerti
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Invoice Card ───────────────────────────────────────────────────── */
function InvoiceCard({ invoice, onBayar }: { invoice: Invoice; onBayar(inv: Invoice): void }) {
  const [expanded, setExpanded] = useState(false);
  const st = invoice.pembayaran.status;

  const totalLayanan = invoice.details.filter(d => d.tipe === "layanan").reduce((s, d) => s + d.subtotal, 0);
  const totalObat    = invoice.details.filter(d => d.tipe === "obat").reduce((s, d) => s + d.subtotal, 0);

  return (
    <div style={{
      border: `1px solid ${st === "lunas" ? "#c8e6c9" : st === "menunggu_pembayaran" || st === "gagal" ? "#fed7aa" : "#e0e0e0"}`,
      borderRadius: 12, background: "#fff",
      overflow: "hidden", marginBottom: 10,
      boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
    }}>
      <div style={{ padding: "13px 16px", display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
        <div style={{
          width: 34, height: 34, borderRadius: 8, background: "#f0faf2",
          display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
        }}>
          <Receipt style={{ width: 15, height: 15, color: G }} />
        </div>

        <div style={{ flex: 1, minWidth: 140 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: "#111" }}>Invoice #{invoice.id_resep}</span>
            <StatusBadge status={st} />
          </div>
          <div style={{ fontSize: 11, color: "#aaa", marginTop: 2, display: "flex", alignItems: "center", gap: 4 }}>
            <Calendar style={{ width: 10, height: 10 }} />
            {fmtTanggal(invoice.tanggal)}
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 15, fontWeight: 700, color: G }}>{fmt(invoice.grand_total)}</span>

          {(st === "menunggu_pembayaran" || st === "gagal") && (
            <button onClick={() => onBayar(invoice)} style={{
              display: "inline-flex", alignItems: "center", gap: 5,
              padding: "7px 14px", borderRadius: 8,
              border: "none", background: G, color: "#fff",
              fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
            }}
              onMouseEnter={e => e.currentTarget.style.background = "#1b5e20"}
              onMouseLeave={e => e.currentTarget.style.background = G}
            >
              <CreditCard style={{ width: 12, height: 12 }} /> Bayar
            </button>
          )}
          {st === "pending_midtrans" && (
            <button onClick={() => onBayar(invoice)} style={{
              display: "inline-flex", alignItems: "center", gap: 5,
              padding: "7px 14px", borderRadius: 8,
              border: "1.5px solid #7c3aed", background: "#f5f3ff", color: "#7c3aed",
              fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
            }}>
              <Smartphone style={{ width: 12, height: 12 }} /> Lanjutkan
            </button>
          )}
          {st === "pending_cash" && (
            <button onClick={() => onBayar(invoice)} style={{
              display: "inline-flex", alignItems: "center", gap: 5,
              padding: "7px 14px", borderRadius: 8,
              border: "1.5px solid #1d4ed8", background: "#eff6ff", color: "#1d4ed8",
              fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
            }}>
              <Info style={{ width: 12, height: 12 }} /> Info
            </button>
          )}

          <button onClick={() => setExpanded(p => !p)} style={{
            width: 28, height: 28, borderRadius: 7,
            border: "1px solid #e0e0e0", background: "#fafafa",
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer", color: "#888",
          }}>
            {expanded ? <ChevronUp style={{ width: 14, height: 14 }} /> : <ChevronDown style={{ width: 14, height: 14 }} />}
          </button>
        </div>
      </div>

      {expanded && (
        <div style={{ borderTop: "1px solid #f5f5f5", padding: "12px 16px" }}>
          {invoice.details.filter(d => d.tipe === "layanan").length > 0 && (
            <div style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 11, color: "#1565c0", fontWeight: 600, marginBottom: 6, display: "flex", alignItems: "center", gap: 5 }}>
                <Stethoscope style={{ width: 11, height: 11 }} /> LAYANAN KLINIK
              </div>
              {invoice.details.filter(d => d.tipe === "layanan").map(d => (
                <div key={d.id_detail} style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#444", padding: "4px 0", borderBottom: "1px dashed #f0f0f0" }}>
                  <span>{d.nama_item} <span style={{ color: "#aaa" }}>×{d.qty}</span></span>
                  <span style={{ color: "#555" }}>{fmt(d.subtotal)}</span>
                </div>
              ))}
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, padding: "5px 0 0", color: "#1565c0", fontWeight: 600 }}>
                <span>Subtotal layanan</span><span>{fmt(totalLayanan)}</span>
              </div>
            </div>
          )}
          {invoice.details.filter(d => d.tipe === "obat").length > 0 && (
            <div style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 11, color: "#c62828", fontWeight: 600, marginBottom: 6, display: "flex", alignItems: "center", gap: 5 }}>
                <Pill style={{ width: 11, height: 11 }} /> OBAT & VITAMIN
              </div>
              {invoice.details.filter(d => d.tipe === "obat").map(d => (
                <div key={d.id_detail} style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#444", padding: "4px 0", borderBottom: "1px dashed #f0f0f0" }}>
                  <span>{d.nama_item} <span style={{ color: "#aaa" }}>×{d.qty}</span></span>
                  <span style={{ color: "#555" }}>{fmt(d.subtotal)}</span>
                </div>
              ))}
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, padding: "5px 0 0", color: "#c62828", fontWeight: 600 }}>
                <span>Subtotal obat</span><span>{fmt(totalObat)}</span>
              </div>
            </div>
          )}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 12px", background: "#f0faf2", borderRadius: 8, marginTop: 6 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: "#1a1a1a" }}>Grand Total</span>
            <span style={{ fontSize: 15, fontWeight: 700, color: G }}>{fmt(invoice.grand_total)}</span>
          </div>
          {invoice.catatan && (
            <div style={{ marginTop: 8, padding: "8px 12px", background: "#fffde7", borderRadius: 8, fontSize: 12, color: "#555", lineHeight: 1.6 }}>
              <span style={{ fontWeight: 600, color: "#888" }}>Catatan dokter: </span>
              {invoice.catatan}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ─── Hewan Section ──────────────────────────────────────────────────── */
function HewanSection({ data, onBayar }: { data: HewanInvoice; onBayar(inv: Invoice): void }) {
  const [open, setOpen] = useState(true);

  const totalTagihan = data.invoices.filter(inv => inv.pembayaran.status !== "lunas").reduce((s, inv) => s + inv.grand_total, 0);
  const adaTagihan   = data.invoices.some(inv => inv.pembayaran.status === "menunggu_pembayaran" || inv.pembayaran.status === "gagal");

  return (
    <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #e8e8e8", marginBottom: 16, boxShadow: "0 2px 8px rgba(0,0,0,0.04)", overflow: "hidden" }}>
      <button
        onClick={() => setOpen(p => !p)}
        style={{ width: "100%", padding: "14px 18px", display: "flex", alignItems: "center", gap: 12, background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", textAlign: "left", borderBottom: open ? "1px solid #f0f0f0" : "none" }}
      >
        {data.foto ? (
          <img src={data.foto} alt={data.nama_hewan} style={{ width: 46, height: 46, borderRadius: "50%", objectFit: "cover", flexShrink: 0, border: "2px solid #c8e6c9" }} />
        ) : (
          <div style={{ width: 46, height: 46, borderRadius: "50%", background: "#e8f5e9", border: "2px solid #c8e6c9", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, color: G }}>
            <HewanIcon jenis={data.jenis} size={22} />
          </div>
        )}
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 15, fontWeight: 700, color: "#111" }}>{data.nama_hewan}</span>
            <span style={{ fontSize: 11, color: "#888", background: "#f4f4f4", borderRadius: 20, padding: "2px 8px" }}>{data.jenis} · {data.ras}</span>
          </div>
          <div style={{ fontSize: 12, color: "#aaa", marginTop: 2 }}>
            {data.invoices.length} invoice
            {adaTagihan && <span style={{ marginLeft: 8, color: "#b45309", fontWeight: 600 }}>· Belum lunas {fmt(totalTagihan)}</span>}
          </div>
        </div>
        {open ? <ChevronUp style={{ width: 16, height: 16, color: "#bbb", flexShrink: 0 }} /> : <ChevronDown style={{ width: 16, height: 16, color: "#bbb", flexShrink: 0 }} />}
      </button>

      {open && (
        <div style={{ padding: "12px 16px" }}>
          {data.invoices.length === 0 ? (
            <div style={{ padding: "20px", textAlign: "center", color: "#aaa", fontSize: 13 }}>Belum ada invoice</div>
          ) : (
            data.invoices.map(inv => <InvoiceCard key={inv.id_resep} invoice={inv} onBayar={onBayar} />)
          )}
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════
   MAIN PAGE
══════════════════════════════════════════════════════════════════════ */
export default function PembayaranPage() {
  const [data,     setData]     = useState<HewanInvoice[]>([]);
  const [loading,  setLoading]  = useState(true); // ← true dari awal, bukan false
  const [error,    setError]    = useState<string | null>(null);
  const [modalInv, setModalInv] = useState<Invoice | null>(null);
  const [cashInv,  setCashInv]  = useState<Invoice | null>(null);

  // Ref agar toast/router tidak masuk dependency fetchInvoice
  const toastErrRef = useRef<(title: string, msg: string) => void>(() => {});

  const fetchInvoice = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = sessionStorage.getItem("token") ?? "";
      const res = await fetch(`${API_BASE}/owner/invoice`, {
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      if (!json.success) throw new Error(json.message ?? "Gagal memuat invoice");
      setData(json.data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Gagal memuat data");
    } finally {
      setLoading(false);
    }
  }, []); // dependency kosong — stabil, tidak berubah reference

  useEffect(() => {
    fetchInvoice();
  }, [fetchInvoice]);

  async function handleBayar(metode: "cash" | "midtrans") {
    if (!modalInv) return;
    const token = sessionStorage.getItem("token") ?? "";

    const res = await fetch(`${API_BASE}/owner/pembayaran`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ id_resep: modalInv.id_resep, metode }),
    });

    const json = await res.json();
    if (!json.success) throw new Error(json.message ?? "Gagal memproses pembayaran");

    if (metode === "cash") {
      await fetchInvoice();
      setModalInv(null);
      const updatedInv = {
        ...modalInv,
        pembayaran: { ...modalInv.pembayaran, status: "pending_cash" as const, metode: "cash" as const },
      };
      setCashInv(updatedInv);
      return;
    }

    const snapToken: string = json.snap_token;
    setModalInv(null);
    await loadSnapScript();
    (window as any).snap.pay(snapToken, {
      onSuccess: async () => { await fetchInvoice(); },
      onPending: async () => { await fetchInvoice(); },
      onError:   async () => { await fetchInvoice(); },
      onClose:   async () => { await fetchInvoice(); },
    });
  }

  function loadSnapScript(): Promise<void> {
    return new Promise((resolve) => {
      if ((window as any).snap) { resolve(); return; }
      const script = document.createElement("script");
      script.src = "https://app.sandbox.midtrans.com/snap/snap.js";
      script.setAttribute("data-client-key", process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY ?? "");
      script.onload = () => resolve();
      document.body.appendChild(script);
    });
  }

  const totalBelumBayar = data.reduce((s, h) =>
    s + h.invoices.filter(inv => inv.pembayaran.status === "menunggu_pembayaran" || inv.pembayaran.status === "gagal").length, 0);
  const totalLunas = data.reduce((s, h) =>
    s + h.invoices.filter(inv => inv.pembayaran.status === "lunas").length, 0);
  const totalNominalBelumBayar = data.reduce((s, h) =>
    s + h.invoices.filter(inv => inv.pembayaran.status === "menunggu_pembayaran" || inv.pembayaran.status === "gagal").reduce((ss, inv) => ss + inv.grand_total, 0), 0);

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden", fontFamily: "'Inter', sans-serif" }}>
      <Sidebar activePage="pembayaran" />

      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "auto", background: "#f5f7f5" }}>
        <Header title="Pembayaran" subtitle="Lihat tagihan dan selesaikan pembayaran klinik" />

        <div style={{ padding: "22px 24px" }}>

          {loading ? (
            /* ── Skeleton: tampil saat loading, summary + hewan section ── */
            <SkeletonPembayaran />
          ) : (
            <>
              {/* Summary cards */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14, marginBottom: 22 }}>
                {[
                  { icon: <AlertCircle style={{ width: 18, height: 18, color: "#b45309" }} />, bg: "#fef9ee", border: "#fed7aa", label: "Belum Dibayar", value: totalBelumBayar, sub: totalBelumBayar > 0 ? fmt(totalNominalBelumBayar) : "Semua lunas", valueColor: "#b45309" },
                  { icon: <CheckCircle2 style={{ width: 18, height: 18, color: G }} />, bg: "#f0faf2", border: "#c8e6c9", label: "Sudah Lunas", value: totalLunas, sub: "invoice", valueColor: G },
                  { icon: <Receipt style={{ width: 18, height: 18, color: "#1565c0" }} />, bg: "#eff6ff", border: "#bfdbfe", label: "Total Invoice", value: data.reduce((s, h) => s + h.invoices.length, 0), sub: `${data.length} hewan`, valueColor: "#1565c0" },
                ].map((card, i) => (
                  <div key={i} style={{ background: card.bg, border: `1px solid ${card.border}`, borderRadius: 12, padding: "14px 16px", display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 10, background: "#fff", border: `1px solid ${card.border}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      {card.icon}
                    </div>
                    <div>
                      <div style={{ fontSize: 11, color: "#888", marginBottom: 2 }}>{card.label}</div>
                      <div style={{ fontSize: 20, fontWeight: 700, color: card.valueColor, lineHeight: 1 }}>{card.value}</div>
                      <div style={{ fontSize: 11, color: "#aaa", marginTop: 2 }}>{card.sub}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Tombol refresh */}
              <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 14 }}>
                <button
                  onClick={fetchInvoice}
                  disabled={loading}
                  style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "7px 14px", borderRadius: 8, border: "1px solid #e0e0e0", background: "#fff", color: "#555", fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}
                >
                  <RefreshCw style={{ width: 12, height: 12 }} /> Refresh
                </button>
              </div>

              {/* Error */}
              {error && (
                <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 10, marginBottom: 16 }}>
                  <AlertCircle style={{ width: 15, height: 15, color: "#dc2626", flexShrink: 0 }} />
                  <span style={{ fontSize: 13, color: "#dc2626", flex: 1 }}>{error}</span>
                  <button onClick={fetchInvoice} style={{ padding: "4px 12px", borderRadius: 6, border: "1px solid #dc2626", background: "#fff", color: "#dc2626", fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>Coba Lagi</button>
                </div>
              )}

              {/* Empty state */}
              {!error && data.length === 0 && (
                <div style={{ textAlign: "center", padding: "4rem 2rem", background: "#fff", borderRadius: 14, border: "1px solid #e8e8e8" }}>
                  <div style={{ width: 64, height: 64, borderRadius: "50%", background: "#e8f5e9", border: "2px solid #c8e6c9", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", color: G }}>
                    <PawPrint style={{ width: 30, height: 30 }} />
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 600, color: "#1a1a1a", marginBottom: 6 }}>Belum ada invoice</div>
                  <div style={{ fontSize: 13, color: "#888" }}>Invoice akan muncul setelah dokter membuat resep untuk hewan kamu.</div>
                </div>
              )}

              {/* Hewan sections */}
              {data.map(hewan => (
                <HewanSection key={hewan.id_hewan} data={hewan} onBayar={inv => setModalInv(inv)} />
              ))}
            </>
          )}
        </div>
      </div>

      {/* Modal pilih metode */}
      {modalInv && modalInv.pembayaran.status !== "pending_cash" && (
        <ModalBayar invoice={modalInv} onClose={() => setModalInv(null)} onBayar={handleBayar} />
      )}

      {/* Modal info cash */}
      {(cashInv || (modalInv && modalInv.pembayaran.status === "pending_cash")) && (
        <ModalCashInfo invoice={(cashInv ?? modalInv)!} onClose={() => { setCashInv(null); setModalInv(null); }} />
      )}

      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}