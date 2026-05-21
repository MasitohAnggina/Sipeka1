"use client";

export interface BookingPDFData {
  bookingNumber: string;
  date: string;
  time: string;
  queueNumber: number;
  pets: Array<{
    name: string;
    breed: string;
    type: string;
    serviceName: string;
    note?: string;
  }>;
}

// ── Lucide SVG paths (viewBox 0 0 24 24, stroke icons) ──────────────────────
const ICONS: Record<string, string> = {
  PawPrint: `
    <circle cx="11" cy="4" r="2"/>
    <circle cx="18" cy="4" r="2"/>
    <circle cx="20" cy="12" r="2"/>
    <circle cx="4" cy="12" r="2"/>
    <path d="M5.4 19.4c-.5-1.1-.8-2.3-.8-3.4C4.6 13 7.3 11 10 11c1.3 0 2.6.3 3.7.9"/>
    <path d="M10.9 19.8C11.5 21 12.7 22 14 22c3 0 5-2.5 5-5.5 0-2-1-3.5-2.5-4.5"/>`,
  Calendar: `
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
    <line x1="16" y1="2" x2="16" y2="6"/>
    <line x1="8" y1="2" x2="8" y2="6"/>
    <line x1="3" y1="10" x2="21" y2="10"/>`,
  Clock: `
    <circle cx="12" cy="12" r="10"/>
    <polyline points="12 6 12 12 16 14"/>`,
  Info: `
    <circle cx="12" cy="12" r="10"/>
    <line x1="12" y1="8" x2="12" y2="12"/>
    <line x1="12" y1="16" x2="12.01" y2="16"/>`,
  Tag: `
    <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/>
    <line x1="7" y1="7" x2="7.01" y2="7"/>`,
  Hash: `
    <line x1="4" y1="9" x2="20" y2="9"/>
    <line x1="4" y1="15" x2="20" y2="15"/>
    <line x1="10" y1="3" x2="8" y2="21"/>
    <line x1="16" y1="3" x2="14" y2="21"/>`,
  Stethoscope: `
    <path d="M4.8 2.3A.3.3 0 1 0 5 2H4a2 2 0 0 0-2 2v5a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6V4a2 2 0 0 0-2-2h-1a.2.2 0 1 0 .3.3"/>
    <path d="M8 15v1a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6v-4"/>
    <circle cx="20" cy="10" r="2"/>`,
  Ticket: `
    <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z"/>
    <line x1="9" y1="12" x2="15" y2="12"/>`,
};

/**
 * Render ikon Lucide ke PNG data URL via canvas (async, resolusi tinggi).
 */
function renderIcon(name: string, sizePx: number, color: string): Promise<string> {
  return new Promise((resolve) => {
    const paths = ICONS[name];
    if (!paths) { resolve(""); return; }

    const svgStr = `<svg xmlns="http://www.w3.org/2000/svg" width="${sizePx}" height="${sizePx}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${paths}</svg>`;
    const b64 = btoa(unescape(encodeURIComponent(svgStr)));
    const dataUrl = `data:image/svg+xml;base64,${b64}`;

    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = sizePx;
      canvas.height = sizePx;
      canvas.getContext("2d")!.drawImage(img, 0, 0, sizePx, sizePx);
      resolve(canvas.toDataURL("image/png"));
    };
    img.onerror = () => resolve("");
    img.src = dataUrl;
  });
}

export function useBookingPDF() {
  const downloadPDF = async (data: BookingPDFData) => {
    const { jsPDF } = await import("jspdf");

    // ── Pre-render semua ikon yang dibutuhkan ──────────────────────────────────
    // Resolusi: 10× size mm (misal 7mm → 70px) agar tajam di PDF
    const RES = 10;
    const icons = {
      hash:        await renderIcon("Hash",        50,  "#757575"),
      calendar:    await renderIcon("Calendar",    70,  "#2e7d32"),
      clock:       await renderIcon("Clock",       70,  "#2e7d32"),
      stethoscope: await renderIcon("Stethoscope", 70,  "#2e7d32"),
      tag:         await renderIcon("Tag",         50,  "#2e7d32"),
      info:        await renderIcon("Info",        70,  "#0d47a1"),
    };

    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a5" });

    const W       = 148;
    const MARGIN  = 10;
    const IW      = W - MARGIN * 2; // inner width = 128mm

    // ── Warna ─────────────────────────────────────────────────────────────────
    const C = {
      green:      "#1b5e20",
      greenMid:   "#2e7d32",
      greenLight: "#43a047",
      greenBg:    "#f1f8f1",
      greenPale:  "#e8f5e9",
      accent:     "#00c853",
      white:      "#ffffff",
      dark:       "#1a1a1a",
      mid:        "#424242",
      muted:      "#757575",
      line:       "#dcedc8",
      cardBg:     "#fafafa",
      badgeBg:    "#e8f5e9",
      infoBg:     "#e3f2fd",
      infoText:   "#0d47a1",
    };

    // ── Helper: persegi panjang rounded ───────────────────────────────────────
    const fillRect = (x: number, y: number, w: number, h: number, r: number, color: string) => {
      doc.setFillColor(color);
      doc.roundedRect(x, y, w, h, r, r, "F");
    };
    const strokeRect = (x: number, y: number, w: number, h: number, r: number, color: string, lw = 0.3) => {
      doc.setDrawColor(color);
      doc.setLineWidth(lw);
      doc.roundedRect(x, y, w, h, r, r, "S");
    };

    // ── Helper: tambah ikon PNG ke dokumen ────────────────────────────────────
    const icon = (key: keyof typeof icons, x: number, y: number, size: number) => {
      const png = icons[key];
      if (png) doc.addImage(png, "PNG", x, y, size, size);
    };

    // ── Helper: format tanggal ─────────────────────────────────────────────────
    const fmtDate = (d: string) => {
      if (!d) return "-";
      return new Date(d).toLocaleDateString("id-ID", {
        weekday: "long", day: "numeric", month: "long", year: "numeric",
      });
    };

    // ════════════════════════════════════════════════════════════════════════════
    // HEADER (y = 0–34mm)
    // ════════════════════════════════════════════════════════════════════════════
    fillRect(0, 0, W, 34, 0, C.green);
    doc.setFillColor(C.accent);
    doc.rect(0, 33, W, 1.5, "F");


    doc.setTextColor(C.white);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(15);
    doc.text("SIPEKA", MARGIN, 13);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor("#c8e6c9");
    doc.text("Sistem Informasi Pelayanan Klinik Hewan", MARGIN, 19);

    // Kanan header
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor("#a5d6a7");
    doc.text("TIKET ANTRIAN BOOKING", W - MARGIN, 13, { align: "right" });

    const nowStr = new Date().toLocaleString("id-ID", {
      day: "2-digit", month: "short", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    });
    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.5);
    doc.setTextColor("#81c784");
    doc.text(`Dicetak: ${nowStr}`, W - MARGIN, 27, { align: "right" });

    // ════════════════════════════════════════════════════════════════════════════
    // NOMOR ANTRIAN (y = 38mm)
    // ════════════════════════════════════════════════════════════════════════════
    let y = 38;
    const CARD_H = 28;

    fillRect(MARGIN, y, IW, CARD_H, 4, C.white);
    strokeRect(MARGIN, y, IW, CARD_H, 4, C.greenLight, 0.4);

    // Aksen kiri
    fillRect(MARGIN, y, 3, CARD_H, 2, C.greenMid);

    // No. Antrian
    doc.setTextColor(C.muted);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.text("NO. ANTRIAN", MARGIN + 7, y + 8);

    const qNum = String(data.queueNumber).padStart(3, "0");
    doc.setTextColor(C.greenMid);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(24);
    doc.text(qNum, MARGIN + 7, y + 23);

    // Garis pembatas
    doc.setDrawColor(C.line);
    doc.setLineWidth(0.4);
    doc.line(MARGIN + 58, y + 4, MARGIN + 58, y + 24);

    // No. Booking
    icon("hash", MARGIN + 61, y + 2.5, 5);
    doc.setTextColor(C.muted);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.text("NO. BOOKING", MARGIN + 68, y + 8);

    doc.setTextColor(C.dark);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text(`#${data.bookingNumber}`, MARGIN + 63, y + 19);

    y += CARD_H + 5;

    // ════════════════════════════════════════════════════════════════════════════
    // INFO JADWAL (dua kolom)
    // ════════════════════════════════════════════════════════════════════════════
    const COL_W = (IW - 3) / 2; // ~62.5mm per kolom
    const COL_H = 20;

    // Kolom Tanggal
    fillRect(MARGIN, y, COL_W, COL_H, 3, C.greenPale);
    icon("calendar", MARGIN + 3, y + 4, 7);
    doc.setTextColor(C.muted);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.5);
    doc.text("TANGGAL BOOKING", MARGIN + 12, y + 7);
    doc.setTextColor(C.dark);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    doc.text(fmtDate(data.date), MARGIN + 12, y + 14, { maxWidth: COL_W - 14 });

    // Kolom Jam
    const col2X = MARGIN + COL_W + 3;
    fillRect(col2X, y, COL_W, COL_H, 3, C.greenPale);
    icon("clock", col2X + 3, y + 4, 7);
    doc.setTextColor(C.muted);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.5);
    doc.text("JAM BOOKING", col2X + 12, y + 7);

    doc.setTextColor(C.dark);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text(data.time, col2X + 12, y + 16);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(C.muted);
    // Letakkan "WIB" di sebelah kanan jam
    const timeW = doc.getTextWidth(data.time);
    doc.text("WIB", col2X + 12 + timeW + 1.5, y + 16);

    y += COL_H + 6;

    // ════════════════════════════════════════════════════════════════════════════
    // HEADER SECTION: Detail Hewan & Layanan
    // ════════════════════════════════════════════════════════════════════════════
    icon("stethoscope", MARGIN, y, 7);
    doc.setTextColor(C.greenMid);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.text("Detail Hewan & Layanan", MARGIN + 9, y + 5);

    doc.setDrawColor(C.accent);
    doc.setLineWidth(0.6);
    doc.line(MARGIN, y + 8, MARGIN + 60, y + 8);
    doc.setDrawColor(C.line);
    doc.setLineWidth(0.3);
    doc.line(MARGIN + 60, y + 8, MARGIN + IW, y + 8);

    y += 13;

    // ════════════════════════════════════════════════════════════════════════════
    // KARTU HEWAN
    // ════════════════════════════════════════════════════════════════════════════
    const ACCENT_COLORS = [C.greenMid, C.greenLight, "#558b2f", "#33691e"];

    for (let i = 0; i < data.pets.length; i++) {
      const pet     = data.pets[i];
      const hasNote = !!pet.note;
      const CARD    = hasNote ? 36 : 28;

      fillRect(MARGIN, y, IW, CARD, 3, i % 2 === 0 ? C.cardBg : C.white);
      strokeRect(MARGIN, y, IW, CARD, 3, C.line, 0.25);

      // Aksen kiri berwarna
      fillRect(MARGIN, y, 3, CARD, 1.5, ACCENT_COLORS[i % ACCENT_COLORS.length]);

      // Badge nomor urut
      fillRect(MARGIN + 5, y + 4, 6.5, 6.5, 1.5, C.greenBg);
      doc.setTextColor(C.greenMid);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(6.5);
      doc.text(String(i + 1), MARGIN + 5 + 6.5 / 2, y + 9, { align: "center" });

      // Nama hewan
      doc.setTextColor(C.dark);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.text(pet.name, MARGIN + 14, y + 9);

      // Tipe & ras
      doc.setTextColor(C.muted);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
      doc.text(`${pet.type}  ·  ${pet.breed}`, MARGIN + 14, y + 15);

      // Badge layanan
      const BADGE_Y = y + 18;
      const BADGE_X = MARGIN + 5;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7);
      const serviceW = doc.getTextWidth(pet.serviceName);
      const BADGE_W  = Math.min(serviceW + 18, IW - 8); // ikon 5mm + gap 2mm + teks + padding 2mm
      fillRect(BADGE_X, BADGE_Y, BADGE_W, 7, 1.5, C.badgeBg);
      icon("tag", BADGE_X + 1.5, BADGE_Y + 1, 5);
      doc.setTextColor(C.greenMid);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7);
      doc.text(pet.serviceName, BADGE_X + 8.5, BADGE_Y + 5.2);

      // Catatan (opsional)
      if (hasNote) {
        doc.setTextColor("#9e9e9e");
        doc.setFont("helvetica", "italic");
        doc.setFontSize(6.8);
        doc.text(`Catatan: ${pet.note}`, MARGIN + 6, y + CARD - 4, { maxWidth: IW - 10 });
      }

      y += CARD + 4;
    }

    y += 2;

    // ════════════════════════════════════════════════════════════════════════════
    // FOOTER INFO
    // ════════════════════════════════════════════════════════════════════════════
    const INFO_H = 15;

    // Tambah halaman baru jika tidak muat
    if (y + INFO_H + 12 > 210) {
      doc.addPage();
      y = 10;
    }

    fillRect(MARGIN, y, IW, INFO_H, 3, C.infoBg);
    icon("info", MARGIN + 3, y + 4, 7);
    doc.setTextColor(C.infoText);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.text("Informasi Penting", MARGIN + 13, y + 7);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.8);
    doc.text(
      "Tunjukkan tiket ini kepada petugas saat tiba di klinik.",
      MARGIN + 13, y + 12,
      { maxWidth: IW - 16 },
    );

    y += INFO_H + 5;

    doc.setDrawColor(C.line);
    doc.setLineWidth(0.4);
    doc.line(MARGIN, y, MARGIN + IW, y);
    y += 5;

    doc.setTextColor(C.muted);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.5);
    doc.text(
      "SIPEKA – Sistem Informasi Pelayanan Klinik Hewan",
      W / 2, y,
      { align: "center" },
    );

    doc.save(`Tiket-Antrian-${data.bookingNumber}.pdf`);
  };

  return { downloadPDF };
}