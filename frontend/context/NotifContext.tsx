"use client";
import { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
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
}

interface NotifContextValue {
  notifs: BookingNotif[];
  readIds: Set<string>;
  markRead(id: string): void;
  unreadCount: number;
}

const NotifContext = createContext<NotifContextValue>({
  notifs: [],
  readIds: new Set(),
  markRead: () => {},
  unreadCount: 0,
});

export function NotifProvider({ children }: { children: React.ReactNode }) {
  const [bookingsAktif, setBookingsAktif] = useState<BookingAktif[]>([]);
  const [readIds, setReadIds]             = useState<Set<string>>(new Set());

  // Simpan id notif yang sudah pernah di-remind agar tidak toast berulang
  const remindedRef = useRef<Set<string>>(new Set());

  const fetchBooking = useCallback(async () => {
    const token = typeof window !== "undefined"
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
        const raw = res.data.bookings_hari_ini;
        setBookingsAktif(Array.isArray(raw) ? raw : []);
      }
    } catch {
      // silent fail
    }
  }, []);

  useEffect(() => {
    fetchBooking();
    const interval = setInterval(fetchBooking, POLL_MS);
    return () => clearInterval(interval);
  }, [fetchBooking]);

  const notifs = useBookingNotif(bookingsAktif);

  // ── Auto-remind: munculkan browser Notification H-1 & H-12 ────────────────
  useEffect(() => {
    if (typeof window === "undefined") return;

    // Minta izin notifikasi browser sekali
    if (Notification.permission === "default") {
      Notification.requestPermission();
    }

    notifs.forEach((n) => {
      if (n.type === "BATAL") return;                    // skip batal
      if (remindedRef.current.has(n.id)) return;         // sudah pernah remind
      remindedRef.current.add(n.id);

      const label = n.type === "H12" ? "⏰ Booking Hari Ini!" : "📅 Pengingat Booking Besok";

      // Browser Notification (muncul di OS)
      if (Notification.permission === "granted") {
        new Notification(label, {
          body: `${n.detail.hewan_nama} · ${n.detail.layanan_nama}\n${n.timeLabel}`,
          icon: "/favicon.ico",
        });
      }
    });
  }, [notifs]);

  // Bersihkan readIds kalau notif sudah tidak ada
  useEffect(() => {
    const activeIds = new Set(notifs.map((n) => n.id));
    setReadIds((prev) => {
      const cleaned = new Set([...prev].filter((id) => activeIds.has(id)));
      return cleaned.size === prev.size ? prev : cleaned;
    });
  }, [notifs]);

  const markRead = useCallback((id: string) => {
    setReadIds((prev) => new Set([...prev, id]));
  }, []);

  const unreadCount = notifs.filter((n) => !readIds.has(n.id)).length;

  return (
    <NotifContext.Provider value={{ notifs, readIds, markRead, unreadCount }}>
      {children}
    </NotifContext.Provider>
  );
}

export const useNotifContext = () => useContext(NotifContext);