"use client";
import { useMemo } from "react";

export interface BookingNotif {
  id: string;
  type: "H1" | "H12" | "BATAL";
  title: string;
  subtitle: string;
  timeLabel: string;
  detail: {
    no_booking: string;
    no_antrian: number;
    hewan_nama: string;
    layanan_nama: string;
    tanggal_booking: string;
    jam: string;
    status: string;
  };
}

interface BookingAktif {
  id_booking: number;
  no_booking: string;
  no_antrian: number;
  tanggal_booking: string;
  jam: string;
  status: string;
  hewan_nama: string;
  layanan_nama: string;
}

export function useBookingNotif(bookings: BookingAktif[]): BookingNotif[] {
  return useMemo(() => {
    if (!bookings?.length) return [];

    const now = new Date();

    return bookings.flatMap((booking) => {
      const detail = {
        no_booking:      booking.no_booking,
        no_antrian:      booking.no_antrian,
        hewan_nama:      booking.hewan_nama,
        layanan_nama:    booking.layanan_nama,
        tanggal_booking: booking.tanggal_booking,
        jam:             booking.jam,
        status:          booking.status,
      };

      // ── BATAL ─────────────────────────────────────────────────────────────
      if (booking.status === "dibatalkan") {
        return [{
          id:        `BATAL-${booking.id_booking}`,
          type:      "BATAL" as const,
          title:     "Booking Dibatalkan",
          subtitle:  `${booking.hewan_nama} · ${booking.layanan_nama}`,
          timeLabel: "Silakan buat booking baru atau reschedule",
          detail,
        }];
      }

      if (booking.status === "selesai") return [];

      // ── Hitung selisih waktu ───────────────────────────────────────────────
      const [yr, mo, dy] = booking.tanggal_booking.split("-").map(Number);
      const [hr, mn]     = booking.jam.split(":").map(Number);
      const bookingTime  = new Date(yr, mo - 1, dy, hr, mn, 0);
      const diffMs       = bookingTime.getTime() - now.getTime();
      const diffHrs      = diffMs / (1000 * 60 * 60);

      const fmtTanggal = new Date(booking.tanggal_booking).toLocaleDateString("id-ID", {
        weekday: "long", day: "numeric", month: "long", year: "numeric",
      });

      const notifs: BookingNotif[] = [];

      // ── H-1: 12–36 jam sebelum (diperlebar agar tidak terlewat) ──────────
      if (diffHrs > 12 && diffHrs <= 36) {
        notifs.push({
          id:        `H1-${booking.id_booking}`,
          type:      "H1",
          title:     "Pengingat: Booking Besok",
          subtitle:  `${booking.hewan_nama} · ${booking.layanan_nama}`,
          timeLabel: `${fmtTanggal}, ${booking.jam} WIB`,
          detail,
        });
      }

      // ── H-12: 0–12 jam sebelum ────────────────────────────────────────────
      if (diffHrs > 0 && diffHrs <= 12) {
        const hLeft = Math.floor(diffHrs);
        const mLeft = Math.floor((diffHrs - hLeft) * 60);
        const sisa  = hLeft > 0
          ? `${hLeft} jam${mLeft > 0 ? ` ${mLeft} menit` : ""}`
          : `${mLeft} menit`;
        notifs.push({
          id:        `H12-${booking.id_booking}`,
          type:      "H12",
          title:     `Booking dalam ${sisa} lagi!`,
          subtitle:  `${booking.hewan_nama} · ${booking.layanan_nama}`,
          timeLabel: `Hari ini, ${booking.jam} WIB`,
          detail,
        });
      }

      return notifs;
    });
  }, [bookings]);
}