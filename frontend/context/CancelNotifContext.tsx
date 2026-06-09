"use client";
import {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
} from "react";
import { getToken } from "@/lib/auth";

export type CancelNotif = {
  id: string;
  id_booking: number;
  no_booking: string;
  hewan_nama: string;
  nama_pemilik: string;
  no_hp: string;
  layanan_nama: string;
  tanggal_booking: string;
  jam: string;
  no_antrian: number;
  nama_dokter: string;
  cancelled_at: string;
};

type CancelNotifContextType = {
  cancelNotifs: CancelNotif[];
  setCancelNotifs: (notifs: CancelNotif[]) => void;
  cancelReadIds: Set<string>;
  markCancelRead: (id: string) => void;
  cancelUnreadCount: number;
  confirmCancel: (idBooking: number, id: string) => Promise<boolean>;
  confirming: boolean;
};

const CancelNotifContext = createContext<CancelNotifContextType | undefined>(undefined);

export function CancelNotifProvider({ children }: { children: ReactNode }) {
  const [cancelNotifs, setCancelNotifs]   = useState<CancelNotif[]>([]);
  const [cancelReadIds, setCancelReadIds] = useState<Set<string>>(new Set());
  const [confirming, setConfirming]       = useState(false);

  const cancelUnreadCount = cancelNotifs.filter((n) => !cancelReadIds.has(n.id)).length;

  const markCancelRead = useCallback((id: string) => {
    setCancelReadIds((prev) => new Set([...prev, id]));
  }, []);

  const confirmCancel = useCallback(async (idBooking: number, id: string): Promise<boolean> => {
    setConfirming(true);
    try {
      const token = getToken();
      if (!token) return false;

      // ✅ FIX: method PATCH + endpoint yang benar pakai idBooking
      const res = await fetch(
        `http://localhost:8000/api/admin/booking/${idBooking}/confirm-cancel`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!res.ok) return false;

      // ✅ Hapus dari list notif setelah konfirmasi berhasil
      setCancelNotifs((prev) => prev.filter((n) => n.id !== id));
      return true;
    } catch {
      return false;
    } finally {
      setConfirming(false);
    }
  }, []);

  return (
    <CancelNotifContext.Provider
      value={{
        cancelNotifs,
        setCancelNotifs,
        cancelReadIds,
        markCancelRead,
        cancelUnreadCount,
        confirmCancel,
        confirming,
      }}
    >
      {children}
    </CancelNotifContext.Provider>
  );
}

export function useCancelNotifContext() {
  const context = useContext(CancelNotifContext);
  if (!context) throw new Error("useCancelNotifContext must be used within CancelNotifProvider");
  return context;
}

export function timeAgo(dateString: string): string {
  const now  = new Date();
  const date = new Date(dateString);
  const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (diff < 60)    return `${diff} detik yang lalu`;
  if (diff < 3600)  return `${Math.floor(diff / 60)} menit yang lalu`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} jam yang lalu`;
  return `${Math.floor(diff / 86400)} hari yang lalu`;
}