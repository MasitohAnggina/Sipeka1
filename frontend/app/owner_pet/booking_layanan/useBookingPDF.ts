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

export function useBookingPDF() {
  const downloadPDF = async (data: BookingPDFData) => {
    const { jsPDF } = await import("jspdf");

    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a5" });
    const W = 148;
    const GREEN = "#2e7d32";
    const LIGHTGREEN = "#e8f5e9";
    const DARKTEXT = "#1a1a1a";
    const GRAY = "#666666";
    const LINE = "#e0e0e0";

    const fmtDate = (d: string) => {
      if (!d) return "-";
      const dt = new Date(d);
      return dt.toLocaleDateString("id-ID", {
        weekday: "long", day: "numeric", month: "long", year: "numeric",
      });
    };

    // ── Header Banner ──────────────────────────────────────────────────────────
    doc.setFillColor(GREEN);
    doc.rect(0, 0, W, 28, "F");

    // Emoji 🐾 via canvas
    const canvas = document.createElement("canvas");
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext("2d")!;
    ctx.font = "48px serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("🐾", 32, 36);
    const emojiImg = canvas.toDataURL("image/png");
    doc.addImage(emojiImg, "PNG", 8, 2, 10, 10);

    doc.setTextColor("#ffffff");
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("SIPEKA", 21, 11);

    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text("Sistem Informasi Pelayanan Klinik Hewan", 10, 20);
    doc.text("Tiket Antrian Booking", 10, 26);

    // ── No. Antrian box ────────────────────────────────────────────────────────
    const boxX = W - 42;
    const boxW = 36;
    const boxCenterX = boxX + boxW / 2;

    doc.setFillColor("#ffffff");
    doc.roundedRect(boxX, 4, boxW, 20, 3, 3, "F");

    doc.setTextColor(GREEN);
    doc.setFontSize(7);
    doc.setFont("helvetica", "bold");
    doc.text("NO. ANTRIAN", boxCenterX, 10, { align: "center" });

    doc.setFontSize(22);
    doc.text(String(data.queueNumber).padStart(3, "0"), boxCenterX, 21, { align: "center" });

    // ── Booking Info Block ─────────────────────────────────────────────────────
    let y = 34;

    doc.setFillColor(LIGHTGREEN);
    doc.roundedRect(8, y, W - 16, 22, 3, 3, "F");

    doc.setTextColor(GREEN);
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.text("No. Booking", 14, y + 7);
    doc.text("Tanggal", 60, y + 7);
    doc.text("Jam", W - 30, y + 7);

    doc.setTextColor(DARKTEXT);
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text(`#${data.bookingNumber}`, 14, y + 16);
    doc.setFontSize(9);
    doc.text(fmtDate(data.date), 60, y + 16, { maxWidth: 56 });
    doc.text(`${data.time} WIB`, W - 30, y + 16);

    y += 28;

    doc.setDrawColor(LINE);
    doc.setLineWidth(0.3);
    doc.line(8, y, W - 8, y);
    y += 6;

    // ── Detail Hewan & Layanan ─────────────────────────────────────────────────
    doc.setTextColor(GREEN);
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("Detail Hewan & Layanan", 10, y);
    y += 6;

    data.pets.forEach((pet, i) => {
      const cardH = pet.note ? 32 : 26;

      doc.setFillColor(i % 2 === 0 ? "#f9f9f9" : "#ffffff");
      doc.roundedRect(8, y, W - 16, cardH, 2, 2, "F");
      doc.setDrawColor(LINE);
      doc.setLineWidth(0.2);
      doc.roundedRect(8, y, W - 16, cardH, 2, 2, "S");

      // Aksen garis hijau kiri
      doc.setFillColor(GREEN);
      doc.rect(8, y, 2.5, cardH, "F");

      // Nama hewan
      doc.setTextColor(DARKTEXT);
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.text(`${pet.name}`, 15, y + 8);

      // Jenis & ras
      doc.setTextColor(GRAY);
      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      doc.text(`${pet.type} · ${pet.breed}`, 15, y + 14);

      // Badge layanan
      doc.setFillColor(LIGHTGREEN);
      doc.roundedRect(14, y + 17, 70, 7, 2, 2, "F");
      doc.setTextColor(GREEN);
      doc.setFontSize(7.5);
      doc.setFont("helvetica", "bold");
      doc.text(`Layanan: ${pet.serviceName}`, 16, y + 22);

      // Catatan (opsional)
      if (pet.note) {
        doc.setTextColor("#888888");
        doc.setFontSize(7);
        doc.setFont("helvetica", "normal");
        doc.text(`Catatan: ${pet.note}`, 16, y + 29, { maxWidth: W - 30 });
      }

      y += cardH + 4;
    });

    y += 4;

    // ── Footer info ────────────────────────────────────────────────────────────
    doc.setFillColor("#e3f2fd");
    doc.roundedRect(8, y, W - 16, 12, 2, 2, "F");
    doc.setTextColor("#1565c0");
    doc.setFontSize(7.5);
    doc.setFont("helvetica", "normal");
    const notice = "Tunjukkan tiket ini kepada petugas saat tiba di klinik.";
    doc.text(notice, 14, y + 8);

    y += 18;

    doc.setDrawColor(LINE);
    doc.line(8, y, W - 8, y);
    y += 5;

    doc.setTextColor(GRAY);
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    const now = new Date().toLocaleString("id-ID");
    doc.text(`Dicetak: ${now}`, 10, y);
    doc.text("SIPEKA - Sistem Informasi Pelayanan Klinik Hewan", W - 10, y, { align: "right" });

    doc.save(`Tiket-Antrian-${data.bookingNumber}.pdf`);
  };

  return { downloadPDF };
}