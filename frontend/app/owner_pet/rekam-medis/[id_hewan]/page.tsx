"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Image from "next/image";
import Sidebar from "@/components/Sidebar_owner_pet";
import Header from "@/components/Header";
import { DUMMY_RIWAYAT, RiwayatItem } from "@/lib/dummyRiwayat";

// ── Constants ─────────────────────────────────────────────────────────────────

const API_URL   = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
const USE_DUMMY = true; // 🔁 Ganti false saat backend sudah siap
const G         = "#2e7d32";
const G_LIGHT   = "#e8f5e9";

// ── Helpers ───────────────────────────────────────────────────────────────────

function getAuthToken(): string {
  return typeof window !== "undefined" ? (sessionStorage.getItem("token") ?? "") : "";
}

// ── Shared Styles ─────────────────────────────────────────────────────────────

const cardStyle: React.CSSProperties = {
  background: "#fff",
  borderRadius: 14,
  border: "1.5px solid #e0e0e0",
  padding: "18px 20px",
  boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
};

const sectionTitleStyle: React.CSSProperties = {
  fontWeight: 700,
  fontSize: 14,
  color: G,
  paddingBottom: 10,
  borderBottom: "1.5px solid #e8f5e9",
  marginBottom: 14,
};

// ── Sub-components ────────────────────────────────────────────────────────────

function HewanAvatar({ foto, emoji, nama, size = 48 }: { foto: string | null; emoji?: string; nama: string; size?: number }) {
  if (foto) {
    return (
      <div style={{ position: "relative", width: size, height: size, borderRadius: 12, overflow: "hidden", flexShrink: 0 }}>
        <Image src={foto} alt={nama} fill unoptimized style={{ objectFit: "cover" }} />
      </div>
    );
  }
  return (
    <div style={{ width: size, height: size, borderRadius: 12, background: G, display: "flex", alignItems: "center", justifyContent: "center", fontSize: size * 0.5, flexShrink: 0 }}>
      {emoji ?? "🐾"}
    </div>
  );
}

function InfoRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "10px 0", borderBottom: "1px solid #f0f0f0" }}>
      <div style={{ width: 32, height: 32, borderRadius: 8, background: G_LIGHT, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, flexShrink: 0 }}>
        {icon}
      </div>
      <div>
        <div style={{ fontSize: 11, color: "#888", fontWeight: 600, marginBottom: 2 }}>{label}</div>
        <div style={{ fontSize: 14, fontWeight: 600, color: "#1a1a1a" }}>{value || "—"}</div>
      </div>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <>
      <style>{`@keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}`}</style>
      <div style={{ padding: "28px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
        {[1, 2].map(col => (
          <div key={col} style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            {[160, 280, 180].map((h, i) => (
              <div key={i} style={{ height: h, borderRadius: 14, background: "linear-gradient(90deg,#f0f0f0 25%,#e8e8e8 50%,#f0f0f0 75%)", backgroundSize: "200% 100%", animation: "shimmer 1.5s infinite" }} />
            ))}
          </div>
        ))}
      </div>
    </>
  );
}

// ── Detail View ───────────────────────────────────────────────────────────────

function RekamMedisDetail({ item, onBack }: { item: RiwayatItem; onBack: () => void }) {
  const rm     = item.rekamMedis!;
  const hewan  = item.hewan;
  const dokter = item.dokter?.nama_dokter ?? "-";

  const tanggalFmt = new Date(rm.tanggal + "T00:00:00").toLocaleDateString("id-ID", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });

  return (
    <div style={{ padding: "0 28px 28px" }}>

      {/* Hewan Info Bar */}
      <div style={{ background: "#fff", borderRadius: 14, border: "1.5px solid #e0e0e0", padding: "16px 20px", margin: "18px 0", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ width: 1, height: 36, background: "#e0e0e0" }} />
          <HewanAvatar foto={hewan?.foto ?? null} emoji={hewan?.emoji} nama={hewan?.nama ?? "hewan"} size={48} />
          <div>
            <div style={{ fontWeight: 700, fontSize: 15 }}>{hewan?.nama ?? "-"}</div>
            <div style={{ fontSize: 12, color: "#666", marginTop: 2 }}>{hewan?.spesies ?? hewan?.jenis}</div>
            <div style={{ display: "flex", gap: 6, marginTop: 5, flexWrap: "wrap" }}>
              <span style={{ padding: "3px 9px", borderRadius: 20, fontSize: 11, fontWeight: 700, background: G_LIGHT, color: G, border: "1.5px solid #a5d6a7" }}>
                🐾 {hewan?.umur} · {hewan?.berat}
              </span>
            </div>
          </div>
        </div>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 14px", borderRadius: 20, background: G_LIGHT, color: G, border: "1.5px solid #a5d6a7", fontSize: 13, fontWeight: 700 }}>
          📋 Detail Rekam Medis
        </div>
      </div>

      {/* Status bar */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, background: G_LIGHT, border: "1.5px solid #a5d6a7", borderRadius: 10, padding: "12px 16px", marginBottom: 18 }}>
        <div style={{ width: 32, height: 32, borderRadius: "50%", background: G, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 15, flexShrink: 0 }}>✓</div>
        <div>
          <div style={{ fontWeight: 700, fontSize: 13, color: G }}>Rekam Medis Tersimpan</div>
          <div style={{ fontSize: 12, color: "#555", marginTop: 1 }}>Dicatat pada {tanggalFmt} oleh {dokter}</div>
        </div>
      </div>

      {/* 2-column grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>

        {/* KIRI */}
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>

          {/* Informasi Pemeriksaan */}
          <div style={cardStyle}>
            <div style={sectionTitleStyle}>📋 Informasi Pemeriksaan</div>
            <InfoRow icon="🐾" label="PASIEN"           value={`${hewan?.nama} (${hewan?.jenis})`} />
            <InfoRow icon="📅" label="TANGGAL"          value={tanggalFmt} />
            <InfoRow icon="👨‍⚕️" label="DOKTER PEMERIKSA" value={dokter} />
            <InfoRow icon="🏥" label="LAYANAN"          value={item.layanan_utama} />
          </div>

          {/* Tindakan Medis */}
          <div style={cardStyle}>
            <div style={sectionTitleStyle}>💊 Tindakan Medis</div>
            {rm.tindakanList.length === 0 ? (
              <p style={{ fontSize: 13, color: "#aaa", fontStyle: "italic" }}>Tidak ada tindakan dicatat.</p>
            ) : rm.tindakanList.map((t, idx) => (
              <div key={t.id} style={{ background: "#f9f9f9", border: "1.5px solid #e0e0e0", borderRadius: 10, padding: "12px 14px", marginBottom: idx < rm.tindakanList.length - 1 ? 10 : 0 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: G }}>Tindakan {idx + 1}</span>
                  <span style={{ padding: "3px 9px", borderRadius: 20, fontSize: 11, fontWeight: 700, background: "#fff8e1", color: "#e65100", border: "1.5px solid #ffcc80" }}>
                    ⏱ {t.durasi}
                  </span>
                </div>
                <div style={{ fontSize: 13, color: "#333", lineHeight: 1.6 }}>💊 {t.penanganan}</div>
              </div>
            ))}
          </div>
        </div>

        {/* KANAN */}
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>

          {/* Diagnosa */}
          <div style={cardStyle}>
            <div style={sectionTitleStyle}>🔍 Diagnosa</div>
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
              <div style={{ fontSize: 11, color: "#888", fontWeight: 600, marginBottom: 8 }}>DESKRIPSI DIAGNOSA</div>
              <div style={{ background: "#f9f9f9", border: "1.5px solid #e0e0e0", borderRadius: 8, padding: "12px 14px", fontSize: 13, color: rm.diagnosaLengkap ? "#333" : "#aaa", lineHeight: 1.65, fontStyle: rm.diagnosaLengkap ? "normal" : "italic" }}>
                {rm.diagnosaLengkap || "Tidak diisi"}
              </div>
            </div>
          </div>

          {/* Catatan Dokter */}
          <div style={cardStyle}>
            <div style={sectionTitleStyle}>📝 Catatan Dokter</div>
            <div style={{ background: "#f9f9f9", border: "1.5px solid #e0e0e0", borderRadius: 8, padding: "12px 14px", fontSize: 13, color: rm.catatanDokter ? "#333" : "#aaa", lineHeight: 1.65, fontStyle: rm.catatanDokter ? "normal" : "italic" }}>
              {rm.catatanDokter || "Tidak ada catatan tambahan"}
            </div>
          </div>

          {/* Tombol kembali */}
          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <button
              onClick={onBack}
              style={{ padding: "10px 26px", borderRadius: 8, border: `1.5px solid ${G}`, background: "#fff", color: G, fontWeight: 700, fontSize: 14, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6 }}
            >
              Kembali
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main Page Export ──────────────────────────────────────────────────────────

export default function RekamMedisPage() {
  const router       = useRouter();
  const searchParams = useSearchParams();

  const id_riwayat = searchParams.get("riwayat");

  const [item,    setItem]    = useState<RiwayatItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);

  const token = getAuthToken();

  useEffect(() => {
    if (!USE_DUMMY) {
      const t = typeof window !== "undefined" ? sessionStorage.getItem("token") : null;
      if (!t) { router.push("/login"); return; }
    }

    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        if (USE_DUMMY) {
          await new Promise(r => setTimeout(r, 500));
          const found = id_riwayat
            ? DUMMY_RIWAYAT.find(r => r.id_riwayat === Number(id_riwayat))
            : DUMMY_RIWAYAT.find(r => r.rekamMedis !== null);
          if (!cancelled) {
            if (found?.rekamMedis) setItem(found);
            else setError("Rekam medis tidak ditemukan.");
          }
        } else {
          const url = id_riwayat
            ? `${API_URL}/api/rekam-medis/riwayat/${id_riwayat}`
            : `${API_URL}/api/rekam-medis/latest`;
          const res  = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
          const data = await res.json();
          if (!cancelled) {
            if (data.success) setItem(data.data);
            else setError("Rekam medis tidak ditemukan.");
          }
        }
      } catch {
        if (!cancelled) setError("Gagal memuat rekam medis.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [id_riwayat, token, router]);

  const handleBack = () => router.push("/owner_pet/riwayat_layanan");

  return (
    <div style={{ display: "flex", height: "100vh", backgroundColor: "#f9f9f9", fontFamily: "Segoe UI, sans-serif" }}>
      <Sidebar activePage="riwayat" />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflowY: "auto" }}>
        <Header
          title="Rekam Medis"
          subtitle={item ? `Detail rekam medis — ${item.hewan?.nama}` : "Memuat rekam medis..."}
        />

        {/* Banner dummy mode */}
        {USE_DUMMY && (
          <div style={{ margin: "12px 28px 0", background: "#fff8e1", border: "1px solid #f59e0b", borderRadius: 8, padding: "8px 14px", fontSize: 12, color: "#92400e", display: "flex", alignItems: "center", gap: 8 }}>
            ⚠️ <strong>Mode Demo</strong> — Data dummy aktif. Set <code style={{ background: "#fef3c7", padding: "1px 5px", borderRadius: 4 }}>USE_DUMMY = false</code> saat backend sudah siap.
          </div>
        )}

        {loading ? (
          <LoadingSkeleton />
        ) : error ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flex: 1, gap: 12, color: "#888" }}>
            <div style={{ fontSize: 40 }}>🐾</div>
            <div style={{ fontSize: 15, fontWeight: 600, color: "#555" }}>{error}</div>
            <button onClick={handleBack} style={{ marginTop: 8, padding: "8px 20px", borderRadius: 8, border: `1.5px solid ${G}`, background: "#fff", color: G, fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
              Kembali
            </button>
          </div>
        ) : item ? (
          <RekamMedisDetail item={item} onBack={handleBack} />
        ) : null}
      </div>
    </div>
  );
}