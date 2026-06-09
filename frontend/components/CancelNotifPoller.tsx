"use client";
import { useEffect } from "react";
import { useCancelNotifContext } from "@/context/CancelNotifContext";
import type { CancelNotif } from "@/context/CancelNotifContext";
import { getToken } from "@/lib/auth"; // ← pastikan ada ini

export default function CancelNotifPoller() {
  const { setCancelNotifs } = useCancelNotifContext();

  useEffect(() => {
    const fetchCancelNotifs = async () => {
      try {
        const token = getToken(); // ← pastikan pakai ini
        console.log("TOKEN:", token); // ← tambah sementara untuk debug
        if (!token) return;

        const res = await fetch(
          `http://localhost:8000/api/admin/booking/cancel-requests`, // ← hardcode dulu
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        console.log("STATUS:", res.status); // ← tambah sementara
        if (!res.ok) return;

        const json = await res.json();
        console.log("DATA:", json); // ← tambah sementara

        const mapped: CancelNotif[] = (json.data ?? []).map((b: any) => ({
          id:              String(b.id),
          id_booking:      b.id,
          no_booking:      b.no_booking,
          hewan_nama:      b.nama_hewan,
          nama_pemilik:    b.nama_pemilik,
          no_hp:           b.no_hp,
          layanan_nama:    b.layanan_nama,
          tanggal_booking: b.tanggal_booking,
          jam:             b.jam,
          no_antrian:      b.no_antrian,
          nama_dokter:     b.nama_dokter,
          cancelled_at:    b.cancelled_at,
        }));
        setCancelNotifs(mapped);
      } catch (e) {
        console.error("FETCH ERROR:", e); // ← tambah sementara
      }
    };

    fetchCancelNotifs();
    const interval = setInterval(fetchCancelNotifs, 30_000);
    return () => clearInterval(interval);
  }, [setCancelNotifs]);

  return null;
}