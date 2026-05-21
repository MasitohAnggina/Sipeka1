"use client";
import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useBookingNotif } from "@/hooks/useBookingNotif";
import type { BookingNotif } from "@/hooks/useBookingNotif";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
const POLL_MS = 15_000;

interface BookingAktif {
  id_booking: number;
  no_booking: string;
  no_antrian: number;
  tanggal_booking: string;
  jam: string;
  status: string;
  hewan_nama: string;
  layanan_nama: string;
  updated_at?: string;
}

interface NotifContextValue {
  notifs: BookingNotif[];
}

const NotifContext = createContext<NotifContextValue>({ notifs: [] });

export function NotifProvider({ children }: { children: React.ReactNode }) {
  const [bookingAktif, setBookingAktif] = useState<BookingAktif | null>(null);

  const fetchBooking = useCallback(async () => {
    const token =
      typeof window !== "undefined"
        ? (sessionStorage.getItem("token") ?? "")
        : "";
    if (!token) return;

    try {
      const r = await fetch(`${API_URL}/api/owner_pet/dashboard`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!r.ok) return;
      const res = await r.json();
      if (res.success) {
        setBookingAktif(res.data.booking_aktif ?? null);
      }
    } catch {
      // silent fail — tidak perlu crash kalau polling gagal
    }
  }, []);

  useEffect(() => {
    fetchBooking();
    const interval = setInterval(fetchBooking, POLL_MS);
    return () => clearInterval(interval);
  }, [fetchBooking]);

  const notifs = useBookingNotif(bookingAktif);

  return (
    <NotifContext.Provider value={{ notifs }}>
      {children}
    </NotifContext.Provider>
  );
}

export const useNotifContext = () => useContext(NotifContext);