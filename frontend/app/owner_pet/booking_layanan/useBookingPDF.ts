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

    const icons = {
      hash:        await renderIcon("Hash",        50, "#616161"),
      calendar:    await renderIcon("Calendar",    70, "#2e7d32"),
      clock:       await renderIcon("Clock",       70, "#2e7d32"),
      stethoscope: await renderIcon("Stethoscope", 70, "#2e7d32"),
      tag:         await renderIcon("Tag",         50, "#2e7d32"),
      info:        await renderIcon("Info",        70, "#1565c0"),
    };

    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a5" });

    const W      = 148;
    const MARGIN = 12;
    const IW     = W - MARGIN * 2; // 124mm

    const C = {
      green:      "#1b5e20",
      greenMid:   "#2e7d32",
      greenLight: "#4caf50",
      greenPale:  "#f1f8e9",
      greenBg:    "#e8f5e9",
      accent:     "#69f0ae",
      white:      "#ffffff",
      dark:       "#212121",
      mid:        "#424242",
      muted:      "#757575",
      line:       "#e0e0e0",
      cardBg:     "#fafafa",
      infoBg:     "#e8f0fe",
      infoText:   "#1565c0",
      infoStroke: "#90caf9",
    };

    // ── Helpers ───────────────────────────────────────────────────────────────
    const fillRect = (x: number, y: number, w: number, h: number, r: number, color: string) => {
      doc.setFillColor(color);
      doc.roundedRect(x, y, w, h, r, r, "F");
    };
    const strokeRect = (x: number, y: number, w: number, h: number, r: number, color: string, lw = 0.25) => {
      doc.setDrawColor(color);
      doc.setLineWidth(lw);
      doc.roundedRect(x, y, w, h, r, r, "S");
    };
    const icon = (key: keyof typeof icons, x: number, y: number, size: number) => {
      const png = icons[key];
      if (png) doc.addImage(png, "PNG", x, y, size, size);
    };
    const fmtDate = (d: string) => {
      if (!d) return "-";
      return new Date(d).toLocaleDateString("id-ID", {
        weekday: "long", day: "numeric", month: "long", year: "numeric",
      });
    };

    // ═════════════════════════════════════════════════════════════════════
    // HEADER  (tinggi 30mm — lebih kompak dari 34mm sebelumnya)
    // ═════════════════════════════════════════════════════════════════════
    const HDR_H = 30;
    fillRect(0, 0, W, HDR_H, 0, C.green);
    // garis aksen bawah header
    doc.setFillColor(C.accent);
    doc.rect(0, HDR_H - 1.2, W, 1.2, "F");

    // Kiri: nama sistem
    doc.setTextColor(C.white);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text("SIPEKA", MARGIN, 12);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.5);
    doc.setTextColor("#c8e6c9");
    doc.text("Sistem Informasi Pelayanan Klinik Hewan", MARGIN, 17.5);

    // Kanan: label tiket + tanggal cetak (lebih dekat ke kiri label)
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    doc.setTextColor("#a5d6a7");
    doc.text("TIKET ANTRIAN BOOKING", W - MARGIN, 12, { align: "right" });

    const nowStr = new Date().toLocaleString("id-ID", {
      day: "2-digit", month: "short", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    });
    doc.setFont("helvetica", "normal");
    doc.setFontSize(6);
    doc.setTextColor("#81c784");
    doc.text(`Dicetak: ${nowStr}`, W - MARGIN, 17.5, { align: "right" });

    // ═════════════════════════════════════════════════════════════════════
    // BLOK ANTRIAN + BOOKING  (satu baris, dua kolom)
    // ═════════════════════════════════════════════════════════════════════
    let y = HDR_H + 5;
    const QCARD_H = 24;

    fillRect(MARGIN, y, IW, QCARD_H, 3, C.white);
    strokeRect(MARGIN, y, IW, QCARD_H, 3, C.line);
    // aksen kiri
    fillRect(MARGIN, y, 2.5, QCARD_H, 1.5, C.greenMid);

    // Kolom kiri: No. Antrian
    doc.setTextColor(C.muted);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.5);
    doc.text("NO. ANTRIAN", MARGIN + 5.5, y + 7);

    const qNum = String(data.queueNumber).padStart(3, "0");
    doc.setTextColor(C.greenMid);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.text(qNum, MARGIN + 5.5, y + 19.5);

    // Garis pembatas vertikal
    doc.setDrawColor(C.line);
    doc.setLineWidth(0.35);
    doc.line(MARGIN + 55, y + 3.5, MARGIN + 55, y + QCARD_H - 3.5);

    // Kolom kanan: No. Booking
    const RX = MARGIN + 58;
    icon("hash", RX, y + 3, 4.5);
    doc.setTextColor(C.muted);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.5);
    doc.text("NO. BOOKING", RX + 6, y + 7);

    doc.setTextColor(C.dark);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10.5);
    doc.text(`#${data.bookingNumber}`, RX + 0.5, y + 18);

    y += QCARD_H + 4;

    // ═════════════════════════════════════════════════════════════════════
    // INFO JADWAL  (dua kolom setara)
    // ═════════════════════════════════════════════════════════════════════
    const COL_W = (IW - 3) / 2;
    const COL_H = 18;

    // Tanggal
    fillRect(MARGIN, y, COL_W, COL_H, 3, C.greenPale);
    strokeRect(MARGIN, y, COL_W, COL_H, 3, "#c5e1a5", 0.25);
    icon("calendar", MARGIN + 3, y + 5, 6);
    doc.setTextColor(C.muted);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(6);
    doc.text("TANGGAL BOOKING", MARGIN + 11, y + 7);
    doc.setTextColor(C.dark);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(6.8);
    const dateLines = doc.splitTextToSize(fmtDate(data.date), COL_W - 14);
    doc.text(dateLines, MARGIN + 11, y + 12.5);

    // Jam
    const CX = MARGIN + COL_W + 3;
    fillRect(CX, y, COL_W, COL_H, 3, C.greenPale);
    strokeRect(CX, y, COL_W, COL_H, 3, "#c5e1a5", 0.25);
    icon("clock", CX + 3, y + 5, 6);
    doc.setTextColor(C.muted);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(6);
    doc.text("JAM BOOKING", CX + 11, y + 7);

    doc.setTextColor(C.dark);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.text(data.time, CX + 11, y + 15.5);
    const timeW = doc.getTextWidth(data.time);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.5);
    doc.setTextColor(C.muted);
    doc.text("WIB", CX + 11 + timeW + 1.2, y + 15.5);

    y += COL_H + 5;

    // ═════════════════════════════════════════════════════════════════════
    // SECTION HEADER: Detail Hewan & Layanan
    // ═════════════════════════════════════════════════════════════════════
    icon("stethoscope", MARGIN, y, 6);
    doc.setTextColor(C.greenMid);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.text("Detail Hewan & Layanan", MARGIN + 8, y + 4.5);

    // Garis bawah section header: aksen hijau pendek + garis abu panjang
    doc.setDrawColor(C.accent);
    doc.setLineWidth(0.7);
    doc.line(MARGIN, y + 7.5, MARGIN + 52, y + 7.5);
    doc.setDrawColor(C.line);
    doc.setLineWidth(0.25);
    doc.line(MARGIN + 52, y + 7.5, MARGIN + IW, y + 7.5);

    y += 11;

    // ═════════════════════════════════════════════════════════════════════
    // KARTU HEWAN  (lebih rapat, proporsi teks konsisten)
    // ═════════════════════════════════════════════════════════════════════
    const ACCENT_COLORS = [C.greenMid, C.greenLight, "#558b2f", "#33691e"];

    for (let i = 0; i < data.pets.length; i++) {
      const pet     = data.pets[i];
      const hasNote = !!pet.note;
      // Tinggi kartu: base 26mm, tambah 7mm jika ada catatan
      const CARD_H  = hasNote ? 33 : 26;

      fillRect(MARGIN, y, IW, CARD_H, 3, i % 2 === 0 ? C.cardBg : C.white);
      strokeRect(MARGIN, y, IW, CARD_H, 3, C.line, 0.2);
      // aksen kiri berwarna
      fillRect(MARGIN, y, 2.5, CARD_H, 1.5, ACCENT_COLORS[i % ACCENT_COLORS.length]);

      // Badge nomor urut
      const BADGE_SZ = 6;
      fillRect(MARGIN + 5, y + 3.5, BADGE_SZ, BADGE_SZ, 1.5, C.greenBg);
      doc.setTextColor(C.greenMid);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(6);
      doc.text(String(i + 1), MARGIN + 5 + BADGE_SZ / 2, y + 3.5 + BADGE_SZ * 0.72, { align: "center" });

      // Nama hewan
      doc.setTextColor(C.dark);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9.5);
      doc.text(pet.name, MARGIN + 13.5, y + 8);

      // Tipe & ras  — font lebih kecil sedikit, warna muted
      doc.setTextColor(C.muted);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7);
      doc.text(`${pet.type}  ·  ${pet.breed}`, MARGIN + 13.5, y + 13.5);

      // Badge layanan
      const BY    = y + 16.5;
      const BX    = MARGIN + 5;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(6.8);
      const svcW   = doc.getTextWidth(pet.serviceName);
      const BADGE_W = Math.min(svcW + 16, IW - 8);
      fillRect(BX, BY, BADGE_W, 6.5, 1.5, C.greenBg);
      icon("tag", BX + 1.5, BY + 0.8, 4.8);
      doc.setTextColor(C.greenMid);
      doc.text(pet.serviceName, BX + 8, BY + 5);

      // Catatan (opsional)
      if (hasNote) {
        doc.setTextColor("#9e9e9e");
        doc.setFont("helvetica", "italic");
        doc.setFontSize(6.5);
        doc.text(`Catatan: ${pet.note}`, MARGIN + 5.5, y + CARD_H - 3.5, { maxWidth: IW - 10 });
      }

      y += CARD_H + 3;
    }

    y += 3;

    // ═════════════════════════════════════════════════════════════════════
    // INFORMASI PENTING
    // ═════════════════════════════════════════════════════════════════════
    const INFO_H = 14;
    if (y + INFO_H + 10 > 210) { doc.addPage(); y = MARGIN; }

    fillRect(MARGIN, y, IW, INFO_H, 3, C.infoBg);
    strokeRect(MARGIN, y, IW, INFO_H, 3, C.infoStroke, 0.25);
    icon("info", MARGIN + 3, y + 3.5, 6);
    doc.setTextColor(C.infoText);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    doc.text("Informasi Penting", MARGIN + 12, y + 6.5);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.5);
    doc.text(
      "Tunjukkan tiket ini kepada petugas saat tiba di klinik.",
      MARGIN + 12, y + 11.5,
      { maxWidth: IW - 15 },
    );

    y += INFO_H + 5;

    // ── Garis + footer ──────────────────────────────────────────────────
    doc.setDrawColor(C.line);
    doc.setLineWidth(0.3);
    doc.line(MARGIN, y, MARGIN + IW, y);
    y += 4;

    doc.setTextColor(C.muted);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(6);
    doc.text(
      "SIPEKA – Sistem Informasi Pelayanan Klinik Hewan",
      W / 2, y,
      { align: "center" },
    );

    doc.save(`Tiket-Antrian-${data.bookingNumber}.pdf`);
  };

  return { downloadPDF };
}