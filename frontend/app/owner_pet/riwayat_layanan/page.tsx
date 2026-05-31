"use client";
import { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar_owner_pet";
import Header from "@/components/Header";
import {
  Calendar, Clock, Bookmark, Hash, Building2, Stethoscope,
  Award, Search, Pill, FileText, Camera, Check, ClipboardList,
  Scissors, Syringe, BedDouble, RotateCcw, AlertCircle, PawPrint,
  Dog, Cat, Rabbit, Bird, ChevronLeft, ChevronRight, X, ShoppingBag,
} from "lucide-react";

const API_URL    = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
const G          = "#2e7d32";
const ITEMS_PAGE = 4;

function getAuthToken(): string {
  return typeof window !== "undefined" ? (sessionStorage.getItem("token") ?? "") : "";
}

const toRp = (n: number) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n);

function getGrandTotal(item: RiwayatItem): number {
  if (item.grand_total && item.grand_total > 0) return item.grand_total;
  const totalLayanan = item.layanans.reduce((sum, l) => sum + Number(l.harga_saat_booking ?? 0), 0);
  const totalObat    = (item.obat ?? []).reduce((sum, o) => sum + o.subtotal, 0);
  return totalLayanan + totalObat;
}

function getIconForKategori(kat: string, size = 22): React.ReactNode {
  const props = { size, color: G };
  switch (kat) {
    case "Medis":       return <Building2 {...props} />;
    case "Bedah":       return <Syringe   {...props} />;
    case "Grooming":    return <Scissors  {...props} />;
    case "Hotel Hewan": return <BedDouble {...props} />;
    case "Vaksin":      return <Syringe   {...props} />;
    default:            return <PawPrint  {...props} />;
  }
}

function AnimalIcon({ jenis, size = 22 }: { jenis: string; size?: number }) {
  const props = { size, color: G };
  switch (jenis?.toLowerCase()) {
    case "anjing":  return <Dog      {...props} />;
    case "kucing":  return <Cat      {...props} />;
    case "kelinci": return <Rabbit   {...props} />;
    case "hamster": return <PawPrint {...props} />;
    case "burung":  return <Bird     {...props} />;
    default:        return <PawPrint {...props} />;
  }
}

// ── Interfaces ───────────────────────────────────────────────────────────────

interface HewanInfo {
  id_hewan: number;
  nama: string;
  jenis: string;
  ras: string;
  umur: string;
  berat: string;
  foto: string | null;
}
interface LayananInfo {
  id_layanan: number;
  nama_layanan: string;
  kategori: string;
  harga_saat_booking: number;
}
interface DokterInfo {
  nama_dokter: string;
  spesialisasi: string;
}
interface TindakanItem {
  id: number;
  penanganan: string;
  durasi: string;
}
interface ObatItem {
  nama_obat: string;
  satuan: string;
  jumlah: number;
  harga_satuan: number;
  subtotal: number;
}
interface RekamMedisDetail {
  diagnosa: string | null;
  diagnosa_lengkap: string | null;
  catatan_dokter: string | null;
  dokter: DokterInfo | null;
  tindakanList?: TindakanItem[];
}
interface RiwayatItem {
  id_riwayat: number;
  tanggal: string;
  tanggal_dd: string;
  bulan: string;
  hari: string;
  jam: string;
  grand_total: number;
  status_bayar: string;
  catatan: string | null;
  no_booking: string;
  no_antrian: number;
  status_booking: string;
  hewan: HewanInfo | null;
  layanans: LayananInfo[];
  layanan_utama: string;
  layanan_kategori: string;
  nama_dokter?: string;
  spesialisasi_dokter?: string;
  rekam_medis?: RekamMedisDetail | null;
  obat?: ObatItem[];
  foto_before?: string | null;
  foto_after?: string | null;
}
interface StatsData {
  total: number;
  [kategori: string]: number;
}

// ── Sub-components ───────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const cfg: Record<string, { bg: string; color: string }> = {
    selesai:             { bg: "#e8f5e9", color: G },
    proses:              { bg: "#fff8e1", color: "#d97706" },
    dibatalkan:          { bg: "#fce4ec", color: "#c62828" },
    menunggu:            { bg: "#fff8e1", color: "#d97706" },
    dikonfirmasi:        { bg: "#e3f2fd", color: "#1565c0" },
    lunas:               { bg: "#e8f5e9", color: G },
    menunggu_pembayaran: { bg: "#fff8e1", color: "#d97706" },
  };
  const { bg, color } = cfg[status?.toLowerCase()] ?? { bg: "#f5f5f5", color: "#888" };
  return (
    <span style={{ padding: "3px 10px", borderRadius: 20, fontSize: 12, fontWeight: 600, background: bg, color }}>
      {status?.charAt(0).toUpperCase() + status?.slice(1).replace(/_/g, " ")}
    </span>
  );
}

function LoadingRows() {
  return (
    <>
      <style>{`@keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}`}</style>
      {[1, 2, 3].map(i => (
        <div key={i} style={{ padding: "16px 20px", borderBottom: "1px solid #f0f0f0", display: "flex", gap: 20, alignItems: "center" }}>
          {[120, 200, 200, 150, 80, 80].map((w, j) => (
            <div key={j} style={{ width: w, height: 40, borderRadius: 6, background: "linear-gradient(90deg,#f0f0f0 25%,#e0e0e0 50%,#f0f0f0 75%)", backgroundSize: "200% 100%", animation: "shimmer 1.5s infinite" }} />
          ))}
        </div>
      ))}
    </>
  );
}

function HewanAvatar({ foto, jenis, nama, size = 44 }: { foto: string | null; jenis?: string; nama: string; size?: number }) {
  if (foto) {
    return (
      <div style={{ position: "relative", width: size, height: size, borderRadius: 8, overflow: "hidden", flexShrink: 0 }}>
        <Image src={foto} alt={nama} fill unoptimized style={{ objectFit: "cover" }} />
      </div>
    );
  }
  return (
    <div style={{ width: size, height: size, borderRadius: 8, background: "#f0faf2", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
      <AnimalIcon jenis={jenis ?? ""} size={Math.round(size * 0.5)} />
    </div>
  );
}

const G_LIGHT = "#e8f5e9";

function ModalInfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "8px 0", borderBottom: "1px solid #f5f5f5" }}>
      <div style={{ width: 28, height: 28, borderRadius: 7, background: G_LIGHT, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        {icon}
      </div>
      <div>
        <div style={{ fontSize: 11, color: "#888", fontWeight: 600, marginBottom: 2 }}>{label}</div>
        <div style={{ fontSize: 13, fontWeight: 600, color: "#1a1a1a" }}>{value || "—"}</div>
      </div>
    </div>
  );
}

function RekamMedisPlaceholder({ dokter }: { dokter?: DokterInfo | null }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {dokter && (
        <div style={{ background: "#fff", borderRadius: 14, border: "1.5px solid #e0e0e0", padding: "16px 18px", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
          <div style={{ fontWeight: 700, fontSize: 13, color: G, paddingBottom: 10, borderBottom: "1.5px solid #e8f5e9", marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}>
            <Stethoscope size={14} color={G} /> Dokter / Petugas
          </div>
          <ModalInfoRow icon={<Stethoscope size={14} color={G} />} label="NAMA"         value={dokter.nama_dokter} />
          <ModalInfoRow icon={<Award       size={14} color={G} />} label="SPESIALISASI" value={dokter.spesialisasi} />
        </div>
      )}
      <div style={{
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        padding: "28px 20px", textAlign: "center",
        background: "linear-gradient(135deg,#f9fbe7,#f1f8e9)",
        borderRadius: 12, border: "1.5px dashed #a5d6a7",
      }}>
        <div style={{ marginBottom: 10 }}><Stethoscope size={36} color="#81c784" /></div>
        <div style={{ fontSize: 14, fontWeight: 700, color: G, marginBottom: 6 }}>Rekam Medis Belum Tersedia</div>
        <div style={{ fontSize: 12, color: "#777", lineHeight: 1.6, maxWidth: 260 }}>
          Data rekam medis untuk kunjungan ini sedang disiapkan oleh dokter.
          Silakan periksa kembali setelah pemeriksaan selesai diinputkan.
        </div>
        <div style={{
          marginTop: 14, padding: "5px 14px", borderRadius: 20,
          background: "#fff", border: "1.5px solid #c8e6c9",
          fontSize: 11, fontWeight: 600, color: G,
          display: "inline-flex", alignItems: "center", gap: 5,
        }}>
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: G, display: "inline-block", animation: "pulse 1.5s infinite" }} />
          Dalam proses pengisian
        </div>
        <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.3}}`}</style>
      </div>
    </div>
  );
}

// ── Detail Modal ──────────────────────────────────────────────────────────────

function DetailModal({
  item,
  loadingDetail,
  onClose,
}: {
  item: RiwayatItem;
  loadingDetail: boolean;
  onClose: () => void;
}) {
  const hewan = item.hewan;
  const rm    = item.rekam_medis;
  const obat  = item.obat ?? [];

  const dokterModal: DokterInfo | null =
    rm?.dokter ??
    (item.nama_dokter && item.nama_dokter !== "-"
      ? { nama_dokter: item.nama_dokter, spesialisasi: item.spesialisasi_dokter ?? "-" }
      : null);

  const tanggalFmt = item.tanggal
    ? new Date(item.tanggal + "T00:00:00").toLocaleDateString("id-ID", {
        weekday: "long", day: "numeric", month: "long", year: "numeric",
      })
    : "-";

  const grandTotal  = getGrandTotal(item);
  const totalObat   = obat.reduce((s, o) => s + o.subtotal, 0);
  const totalLayanan = grandTotal - totalObat;

  const cardS: React.CSSProperties = {
    background: "#fff", borderRadius: 14, border: "1.5px solid #e0e0e0",
    padding: "16px 18px", boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
  };

  const secTitle = (icon: React.ReactNode, label: string) => (
    <div style={{ fontWeight: 700, fontSize: 13, color: G, paddingBottom: 10, borderBottom: "1.5px solid #e8f5e9", marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}>
      {icon} {label}
    </div>
  );

  return (
    <div
      onClick={onClose}
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 300, display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "24px 16px", overflowY: "auto" }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{ background: "#f9f9f9", borderRadius: 16, width: 900, maxWidth: "100%", marginBottom: 24, overflow: "hidden", boxShadow: "0 12px 40px rgba(0,0,0,0.2)" }}
      >
        {/* ── Header modal ── */}
        <div style={{ background: "#fff", padding: "14px 20px", borderBottom: "1px solid #ebebeb", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <HewanAvatar foto={hewan?.foto ?? null} jenis={hewan?.jenis} nama={hewan?.nama ?? "hewan"} size={46} />
            <div>
              <div style={{ fontWeight: 700, fontSize: 16 }}>{hewan?.nama ?? "-"}</div>
              <div style={{ fontSize: 12, color: "#666", marginTop: 2 }}>{hewan?.jenis} · {hewan?.ras}</div>
              <div style={{ marginTop: 5, display: "flex", gap: 6, flexWrap: "wrap" }}>
                <span style={{ padding: "3px 9px", borderRadius: 20, fontSize: 11, fontWeight: 700, background: G_LIGHT, color: G, border: "1.5px solid #a5d6a7", display: "inline-flex", alignItems: "center", gap: 4 }}>
                  <PawPrint size={11} color={G} /> {hewan?.umur} · {hewan?.berat}
                </span>
                <span style={{ padding: "3px 9px", borderRadius: 20, fontSize: 11, fontWeight: 700, background: "#e3f2fd", color: "#1565c0", border: "1.5px solid #90caf9", display: "inline-flex", alignItems: "center", gap: 4 }}>
                  <ClipboardList size={11} color="#1565c0" /> Detail Kunjungan
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ width: 32, height: 32, borderRadius: "50%", border: "none", background: "#f5f5f5", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
          >
            <X size={16} color="#888" />
          </button>
        </div>

        {/* ── Body modal ── */}
        <div style={{ padding: "18px 20px" }}>

          {/* Banner status */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, background: G_LIGHT, border: "1.5px solid #a5d6a7", borderRadius: 10, padding: "11px 16px", marginBottom: 18 }}>
            <div style={{ width: 32, height: 32, borderRadius: "50%", background: G, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Check size={16} color="#fff" strokeWidth={3} />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 13, color: G }}>Layanan Selesai</div>
              <div style={{ fontSize: 12, color: "#555", marginTop: 1 }}>Kunjungan pada {tanggalFmt}</div>
            </div>
            <div style={{ marginLeft: "auto", textAlign: "right" }}>
              <div style={{ fontSize: 11, color: "#888" }}>Total Bayar</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: G }}>{toRp(grandTotal)}</div>
            </div>
          </div>

          {loadingDetail ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {[180, 120, 160].map((h, i) => (
                <div key={i} style={{ height: h, borderRadius: 12, background: "linear-gradient(90deg,#f0f0f0 25%,#e0e0e0 50%,#f0f0f0 75%)", backgroundSize: "200% 100%", animation: "shimmer 1.5s infinite" }} />
              ))}
              <style>{`@keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}`}</style>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>

              {/* ══ KOLOM KIRI ══ */}
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

                {/* Informasi Kunjungan */}
                <div style={cardS}>
                  {secTitle(<ClipboardList size={14} color={G} />, "Informasi Kunjungan")}
                  <ModalInfoRow icon={<PawPrint   size={14} color={G} />} label="PASIEN"      value={`${hewan?.nama ?? "-"} (${hewan?.jenis ?? "-"})`} />
                  <ModalInfoRow icon={<Calendar   size={14} color={G} />} label="TANGGAL"     value={tanggalFmt} />
                  <ModalInfoRow icon={<Clock      size={14} color={G} />} label="JAM"         value={item.jam ? `${item.jam} WIB` : "-"} />
                  <ModalInfoRow icon={<Bookmark   size={14} color={G} />} label="NO. BOOKING" value={`#${item.no_booking}`} />
                  <ModalInfoRow icon={<Hash       size={14} color={G} />} label="NO. ANTRIAN" value={String(item.no_antrian).padStart(3, "0")} />
                </div>

                {/* Layanan — tanpa total di sini */}
                <div style={cardS}>
                  {secTitle(<Building2 size={14} color={G} />, "Layanan")}
                  {item.layanans.length === 0 ? (
                    <p style={{ fontSize: 13, color: "#aaa", fontStyle: "italic" }}>Tidak ada data layanan.</p>
                  ) : item.layanans.map((l, idx) => (
                    <div key={l.id_layanan} style={{
                      background: "#f9f9f9", border: "1.5px solid #e0e0e0", borderRadius: 10,
                      padding: "10px 13px", marginBottom: idx < item.layanans.length - 1 ? 8 : 0,
                      display: "flex", alignItems: "center", justifyContent: "space-between",
                    }}>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: "#1a1a1a" }}>{l.nama_layanan}</div>
                        <div style={{ fontSize: 11, color: "#888", marginTop: 2 }}>{l.kategori}</div>
                      </div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: G }}>{toRp(Number(l.harga_saat_booking))}</div>
                    </div>
                  ))}
                  {/* Subtotal Layanan */}
                  <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 13px 0", borderTop: "1.5px solid #e8f5e9", marginTop: 8 }}>
                    <span style={{ fontSize: 12, color: "#888" }}>Subtotal Layanan</span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: "#555" }}>{toRp(totalLayanan)}</span>
                  </div>
                </div>

                {/* Foto Before / After */}
                {(item.foto_before || item.foto_after) && (
                  <div style={cardS}>
                    {secTitle(<Camera size={14} color={G} />, "Foto Before / After")}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                      {[{ label: "Sebelum", url: item.foto_before }, { label: "Sesudah", url: item.foto_after }].map(({ label, url }) => (
                        <div key={label}>
                          <div style={{ fontSize: 11, color: "#888", fontWeight: 600, marginBottom: 6 }}>{label.toUpperCase()}</div>
                          {url ? (
                            <div style={{ position: "relative", width: "100%", paddingTop: "75%", borderRadius: 10, overflow: "hidden", border: "1.5px solid #e0e0e0" }}>
                              <Image src={url} alt={label} fill unoptimized style={{ objectFit: "cover" }} />
                            </div>
                          ) : (
                            <div style={{ height: 80, borderRadius: 10, background: "#f5f5f5", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, color: "#bbb", border: "1.5px dashed #e0e0e0" }}>
                              Tidak ada foto
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* ══ KOLOM KANAN ══ */}
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {rm ? (
                  <>
                    {/* Dokter / Petugas */}
                    {dokterModal && (
                      <div style={cardS}>
                        {secTitle(<Stethoscope size={14} color={G} />, "Dokter / Petugas")}
                        <ModalInfoRow icon={<Stethoscope size={14} color={G} />} label="NAMA DOKTER"  value={dokterModal.nama_dokter} />
                        <ModalInfoRow icon={<Award       size={14} color={G} />} label="SPESIALISASI" value={dokterModal.spesialisasi} />
                      </div>
                    )}

                    {/* Diagnosa */}
                    <div style={cardS}>
                      {secTitle(<Search size={14} color={G} />, "Diagnosa")}
                      <div style={{ marginBottom: 14 }}>
                        <div style={{ fontSize: 11, color: "#888", fontWeight: 600, marginBottom: 8 }}>DIAGNOSA UTAMA</div>
                        {rm.diagnosa ? (
                          <span style={{ display: "inline-flex", alignItems: "center", padding: "5px 16px", borderRadius: 20, background: G, color: "#fff", fontSize: 13, fontWeight: 700 }}>
                            {rm.diagnosa}
                          </span>
                        ) : (
                          <span style={{ fontSize: 13, color: "#aaa", fontStyle: "italic" }}>Tidak diisi</span>
                        )}
                      </div>
                      <div>
                        <div style={{ fontSize: 11, color: "#888", fontWeight: 600, marginBottom: 8 }}>DESKRIPSI</div>
                        <div style={{ background: "#f9f9f9", border: "1.5px solid #e0e0e0", borderRadius: 8, padding: "11px 13px", fontSize: 13, color: rm.diagnosa_lengkap ? "#333" : "#aaa", lineHeight: 1.65, fontStyle: rm.diagnosa_lengkap ? "normal" : "italic" }}>
                          {rm.diagnosa_lengkap || "Tidak diisi"}
                        </div>
                      </div>
                    </div>

                    {/* Tindakan Medis */}
                    {(rm.tindakanList ?? []).filter(t => t.penanganan && t.penanganan !== "-").length > 0 && (
                      <div style={cardS}>
                        {secTitle(<Pill size={14} color={G} />, "Tindakan Medis")}
                        {(rm.tindakanList ?? []).filter(t => t.penanganan && t.penanganan !== "-").map((t, idx, arr) => (
                          <div key={t.id} style={{ background: "#f9f9f9", border: "1.5px solid #e0e0e0", borderRadius: 10, padding: "11px 13px", marginBottom: idx < arr.length - 1 ? 8 : 0 }}>
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 7 }}>
                              <span style={{ fontSize: 12, fontWeight: 700, color: G }}>Tindakan {idx + 1}</span>
                              {t.durasi && t.durasi !== "-" && (
                                <span style={{ padding: "3px 9px", borderRadius: 20, fontSize: 11, fontWeight: 700, background: "#fff8e1", color: "#e65100", border: "1.5px solid #ffcc80", display: "inline-flex", alignItems: "center", gap: 4 }}>
                                  <Clock size={11} color="#e65100" /> {t.durasi}
                                </span>
                              )}
                            </div>
                            <div style={{ fontSize: 13, color: "#333", lineHeight: 1.6, display: "flex", alignItems: "flex-start", gap: 6 }}>
                              <Pill size={13} color={G} style={{ marginTop: 2, flexShrink: 0 }} /> {t.penanganan}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Catatan Dokter */}
                    <div style={cardS}>
                      {secTitle(<FileText size={14} color={G} />, "Catatan Dokter")}
                      <div style={{ background: "#f9f9f9", border: "1.5px solid #e0e0e0", borderRadius: 8, padding: "11px 13px", fontSize: 13, color: rm.catatan_dokter ? "#333" : "#aaa", lineHeight: 1.65, fontStyle: rm.catatan_dokter ? "normal" : "italic" }}>
                        {rm.catatan_dokter || "Tidak ada catatan tambahan"}
                      </div>
                    </div>

                    {/* Obat & Vitamin — tanpa total di sini */}
                    {obat.length > 0 && (
                      <div style={cardS}>
                        {secTitle(<ShoppingBag size={14} color={G} />, "Obat & Vitamin")}
                        {obat.map((o, idx) => (
                          <div key={idx} style={{
                            background: "#f9f9f9", border: "1.5px solid #e0e0e0", borderRadius: 10,
                            padding: "10px 13px", marginBottom: idx < obat.length - 1 ? 8 : 0,
                            display: "flex", alignItems: "center", justifyContent: "space-between",
                          }}>
                            <div>
                              <div style={{ fontSize: 13, fontWeight: 700, color: "#1a1a1a" }}>{o.nama_obat}</div>
                              <div style={{ fontSize: 11, color: "#888", marginTop: 2 }}>×{o.jumlah}{o.satuan !== "-" ? ` ${o.satuan}` : ""}</div>
                            </div>
                            <div style={{ fontSize: 13, fontWeight: 700, color: G }}>{toRp(o.subtotal)}</div>
                          </div>
                        ))}
                        {/* Subtotal Obat */}
                        <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 13px 0", borderTop: "1.5px solid #e8f5e9", marginTop: 8 }}>
                          <span style={{ fontSize: 12, color: "#888" }}>Subtotal Obat</span>
                          <span style={{ fontSize: 13, fontWeight: 600, color: "#555" }}>{toRp(totalObat)}</span>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <RekamMedisPlaceholder dokter={dokterModal} />
                )}

                {/* ── Grand Total Gabungan ── */}
                <div style={{
                  background: `linear-gradient(135deg, ${G}, #1b5e20)`,
                  borderRadius: 12, padding: "16px 18px",
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  boxShadow: "0 4px 12px rgba(46,125,50,0.25)",
                }}>
                  <div>
                    <div style={{ fontSize: 12, color: "rgba(255,255,255,0.7)", marginBottom: 4 }}>
                      {obat.length > 0
                        ? `Layanan ${toRp(totalLayanan)} + Obat ${toRp(totalObat)}`
                        : "Total Layanan"}
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "#fff" }}>Grand Total</div>
                  </div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: "#fff" }}>{toRp(grandTotal)}</div>
                </div>

                {/* Tombol Kembali */}
                <div style={{ display: "flex", justifyContent: "flex-end" }}>
                  <button
                    onClick={onClose}
                    style={{ padding: "10px 26px", borderRadius: 8, border: `1.5px solid ${G}`, background: "#fff", color: G, fontWeight: 700, fontSize: 14, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6 }}
                  >
                    <ChevronLeft size={16} color={G} /> Kembali
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main Content ──────────────────────────────────────────────────────────────

function RiwayatLayananContent() {
  const [riwayat,       setRiwayat]       = useState<RiwayatItem[]>([]);
  const [stats,         setStats]         = useState<StatsData | null>(null);
  const [loading,       setLoading]       = useState(true);
  const [error,         setError]         = useState<string | null>(null);
  const [filterKat,     setFilterKat]     = useState("Semua");
  const [filterHewan,   setFilterHewan]   = useState("Semua Hewan");
  const [currentPage,   setCurrentPage]   = useState(1);
  const [modalItem,     setModalItem]     = useState<RiwayatItem | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const token = getAuthToken();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const [rRes, sRes] = await Promise.all([
          fetch(`${API_URL}/api/riwayat`,       { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
          fetch(`${API_URL}/api/riwayat/stats`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
        ]);
        if (!cancelled) {
          if (rRes.success) setRiwayat(rRes.data);
          if (sRes.success) setStats(sRes.data);
        }
      } catch {
        if (!cancelled) setError("Gagal memuat riwayat layanan. Periksa koneksi atau coba lagi.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [token]);

  const handleOpenDetail = async (item: RiwayatItem) => {
    setModalItem(item);
    if (item.id_riwayat < 0) { setLoadingDetail(false); return; }
    setLoadingDetail(true);
    try {
      const res  = await fetch(`${API_URL}/api/riwayat/${item.id_riwayat}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (json.success) setModalItem(prev => prev ? { ...prev, ...json.data } : null);
    } catch {
      // Modal tetap tampil dengan data list yang ada
    } finally {
      setLoadingDetail(false);
    }
  };

  const kategoriUnik = Array.from(
    new Set(riwayat.flatMap(r => r.layanans.map(l => l.kategori)).filter(Boolean))
  ).sort();

  const statCards = [
    { icon: <Calendar size={22} color={G} />, label: "Total Layanan", value: stats?.total ?? riwayat.length, key: "Semua" },
    ...kategoriUnik.map(kat => ({
      icon:  getIconForKategori(kat),
      label: kat,
      value: stats?.[kat] ?? riwayat.filter(r => r.layanans.some(l => l.kategori === kat)).length,
      key:   kat,
    })),
  ];

  const filtered = riwayat.filter(r => {
    const matchKat   = filterKat === "Semua" || r.layanans.some(l => l.kategori === filterKat);
    const matchHewan = filterHewan === "Semua Hewan" || r.hewan?.jenis === filterHewan;
    return matchKat && matchHewan;
  });

  const totalPages = Math.ceil(filtered.length / ITEMS_PAGE);
  const paginated  = filtered.slice((currentPage - 1) * ITEMS_PAGE, currentPage * ITEMS_PAGE);

  const jenisHewanList = [
    "Semua Hewan",
    ...Array.from(new Set(riwayat.map(r => r.hewan?.jenis).filter(Boolean) as string[])),
  ];

  const filterLayananOptions = ["Semua", ...kategoriUnik];

  return (
    <>
      {modalItem && (
        <DetailModal
          item={modalItem}
          loadingDetail={loadingDetail}
          onClose={() => { setModalItem(null); setLoadingDetail(false); }}
        />
      )}

      {/* Stat Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 14, marginBottom: 20 }}>
        {statCards.map(s => {
          const isActive = filterKat === s.key;
          return (
            <div
              key={s.key}
              onClick={() => { setFilterKat(s.key); setCurrentPage(1); }}
              style={{
                background: isActive ? "#f0faf2" : "#fff",
                borderRadius: 12, padding: "14px 18px",
                boxShadow: "0 1px 4px rgba(0,0,0,0.07)",
                display: "flex", alignItems: "center", gap: 12,
                border: isActive ? `1.5px solid ${G}` : "1.5px solid transparent",
                cursor: "pointer", transition: "all .15s",
              }}
            >
              <span>{s.icon}</span>
              <div>
                <p style={{ margin: 0, fontSize: 12, color: "#888" }}>{s.label}</p>
                <p style={{ margin: 0, fontSize: 20, fontWeight: 700, color: "#1a1a1a" }}>
                  {s.value} <span style={{ fontSize: 12, fontWeight: 400, color: "#888" }}>Kali</span>
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Filter Bar */}
      <div style={{ background: "#fff", borderRadius: 12, padding: "12px 18px", marginBottom: 16, boxShadow: "0 1px 4px rgba(0,0,0,0.07)", display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: "#444", marginRight: 4, display: "inline-flex", alignItems: "center", gap: 5 }}>
          <Search size={14} color="#444" /> Filter:
        </span>
        {[
          { label: "Jenis Layanan", value: filterKat,   options: filterLayananOptions, onChange: (v: string) => { setFilterKat(v);   setCurrentPage(1); } },
          { label: "Jenis Hewan",   value: filterHewan, options: jenisHewanList,       onChange: (v: string) => { setFilterHewan(v); setCurrentPage(1); } },
        ].map(f => (
          <div key={f.label} style={{ display: "flex", alignItems: "center", gap: 6, background: "#f9f9f9", borderRadius: 8, padding: "2px 4px 2px 10px", border: "1px solid #e0e0e0" }}>
            <span style={{ fontSize: 12, color: "#666", fontWeight: 600, whiteSpace: "nowrap" }}>{f.label}</span>
            <select value={f.value} onChange={e => f.onChange(e.target.value)} style={{ padding: "6px 10px", border: "none", background: "transparent", fontSize: 13, color: "#333", cursor: "pointer", outline: "none", fontWeight: 500 }}>
              {f.options.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
        ))}
        <button
          onClick={() => { setFilterKat("Semua"); setFilterHewan("Semua Hewan"); setCurrentPage(1); }}
          style={{ padding: "7px 16px", borderRadius: 8, border: "none", background: "#fce4ec", color: "#c62828", fontSize: 13, fontWeight: 700, cursor: "pointer", marginLeft: "auto", display: "inline-flex", alignItems: "center", gap: 6 }}
        >
          <RotateCcw size={13} color="#c62828" /> Reset
        </button>
      </div>

      {/* Tabel */}
      <div style={{ background: "#fff", borderRadius: 12, boxShadow: "0 1px 4px rgba(0,0,0,0.07)", overflow: "hidden" }}>
        <div style={{ display: "grid", gridTemplateColumns: "120px 1fr 1fr 1fr 90px 90px", padding: "12px 20px", background: "#f9f9f9", borderBottom: "1px solid #f0f0f0" }}>
          {["Tanggal", "Hewan", "Layanan", "Dokter / Petugas", "Status", "Aksi"].map(h => (
            <span key={h} style={{ fontSize: 13, fontWeight: 700, color: "#555" }}>{h}</span>
          ))}
        </div>
        {loading ? (
          <LoadingRows />
        ) : error ? (
          <div style={{ padding: 40, textAlign: "center", color: "#e53935", fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
            <AlertCircle size={18} color="#e53935" /> {error}
          </div>
        ) : paginated.length === 0 ? (
          <div style={{ padding: 40, textAlign: "center", color: "#aaa", fontSize: 14 }}>
            {riwayat.length === 0 ? "Belum ada riwayat layanan." : "Tidak ada data untuk filter ini."}
          </div>
        ) : (
          paginated.map((item, i) => {
            const rowTotal = getGrandTotal(item);
            return (
              <div
                key={item.id_riwayat}
                style={{ display: "grid", gridTemplateColumns: "120px 1fr 1fr 1fr 90px 90px", padding: "14px 20px", borderBottom: i < paginated.length - 1 ? "1px solid #f0f0f0" : "none", alignItems: "center" }}
              >
                <div>
                  <p style={{ margin: 0, fontSize: 20, fontWeight: 700, color: "#1a1a1a" }}>{item.tanggal_dd}</p>
                  <p style={{ margin: 0, fontSize: 13, color: "#555" }}>{item.bulan}</p>
                  <p style={{ margin: 0, fontSize: 11, color: "#aaa" }}>{item.hari}</p>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <HewanAvatar foto={item.hewan?.foto ?? null} jenis={item.hewan?.jenis} nama={item.hewan?.nama ?? "hewan"} />
                  <div>
                    <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: "#1a1a1a" }}>{item.hewan?.nama ?? "-"}</p>
                    <p style={{ margin: 0, fontSize: 12, color: "#888" }}>{item.hewan?.jenis}</p>
                    <p style={{ margin: 0, fontSize: 12, color: "#888" }}>{item.hewan?.umur} · {item.hewan?.berat}</p>
                  </div>
                </div>
                <div>
                  <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "#1a1a1a" }}>{item.layanan_utama}</p>
                  {item.layanans.length > 1 && (
                    <p style={{ margin: "2px 0 0", fontSize: 11, color: G }}>+{item.layanans.length - 1} layanan lainnya</p>
                  )}
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: G }}>{toRp(rowTotal)}</p>
                </div>
                <div>
                  {item.nama_dokter && item.nama_dokter !== "-" ? (
                    <>
                      <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: "#1a1a1a", display: "flex", alignItems: "center", gap: 5 }}>
                        <Stethoscope size={13} color="#555" /> {item.nama_dokter}
                      </p>
                      {item.spesialisasi_dokter && item.spesialisasi_dokter !== "-" && (
                        <p style={{ margin: "2px 0 0", fontSize: 11, color: "#888" }}>{item.spesialisasi_dokter}</p>
                      )}
                    </>
                  ) : (
                    <p style={{ margin: 0, fontSize: 12, color: "#bbb", fontStyle: "italic" }}>–</p>
                  )}
                </div>
                <StatusBadge status={item.status_booking} />
                <div>
                  <button
                    onClick={() => handleOpenDetail(item)}
                    style={{ padding: "6px 14px", borderRadius: 8, border: `1.5px solid ${G}`, background: "#fff", color: G, fontSize: 12, fontWeight: 700, cursor: "pointer", transition: "all .15s", whiteSpace: "nowrap", display: "inline-flex", alignItems: "center", gap: 5 }}
                    onMouseEnter={e => { e.currentTarget.style.background = G; e.currentTarget.style.color = "#fff"; }}
                    onMouseLeave={e => { e.currentTarget.style.background = "#fff"; e.currentTarget.style.color = G; }}
                  >
                    <ClipboardList size={13} /> Detail
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 6, marginTop: 16 }}>
          <button
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            style={{ padding: "6px 14px", borderRadius: 8, border: "1px solid #d1d5db", background: "#fff", fontSize: 13, cursor: "pointer", color: "#333", display: "inline-flex", alignItems: "center", gap: 4 }}
          >
            <ChevronLeft size={14} /> Sebelumnya
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
            <button
              key={page}
              onClick={() => setCurrentPage(page)}
              style={{ width: 32, height: 32, borderRadius: 8, border: "1px solid #d1d5db", background: currentPage === page ? G : "#fff", color: currentPage === page ? "#fff" : "#333", fontSize: 13, fontWeight: 600, cursor: "pointer" }}
            >
              {page}
            </button>
          ))}
          <button
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            style={{ padding: "6px 14px", borderRadius: 8, border: "1px solid #d1d5db", background: "#fff", fontSize: 13, cursor: "pointer", color: "#333", display: "inline-flex", alignItems: "center", gap: 4 }}
          >
            Berikutnya <ChevronRight size={14} />
          </button>
        </div>
      )}
    </>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function RiwayatLayananPage() {
  const router = useRouter();
  useEffect(() => {
    const token = typeof window !== "undefined" ? sessionStorage.getItem("token") : null;
    if (!token) router.push("/auth/login");
  }, [router]);

  return (
    <div style={{ display: "flex", height: "100vh", backgroundColor: "#f5f5f5", fontFamily: "Segoe UI, sans-serif" }}>
      <Sidebar activePage="riwayat" />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflowY: "auto" }}>
        <Header title="Riwayat Layanan" subtitle="Lihat riwayat layanan hewan peliharaan Anda" />
        <main style={{ flex: 1, padding: "20px 24px" }}>
          <RiwayatLayananContent />
        </main>
      </div>
    </div>
  );
}