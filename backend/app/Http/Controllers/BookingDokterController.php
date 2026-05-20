<?php

namespace App\Http\Controllers;

use App\Models\Booking;
use App\Models\Dokter;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class BookingDokterController extends Controller
{
    private function getDokter(Request $request)
    {
        return Dokter::where('id_user', $request->user()->id_user)->first();
    }

    // =========================================================================
    //  GET /api/dokter/booking
    // =========================================================================
    public function index(Request $request): JsonResponse
    {
        $dokter = $this->getDokter($request);
        if (!$dokter) {
            return response()->json(['success' => false, 'message' => 'Data dokter tidak ditemukan'], 404);
        }

        $bookings = Booking::with(['hewan', 'user', 'jadwal', 'layanans'])
            ->whereHas('jadwal', fn($q) => $q->where('id_dokter', $dokter->id_dokter))
            ->orderBy('tanggal_booking', 'asc')
            ->get()
            ->map(fn($b) => $this->formatBooking($b));

        return response()->json(['success' => true, 'data' => $bookings]);
    }

    // =========================================================================
    //  PATCH /api/dokter/booking/{id}/status
    // =========================================================================
    public function updateStatus(Request $request, int $idBooking): JsonResponse
    {
        $dokter = $this->getDokter($request);
        if (!$dokter) {
            return response()->json(['success' => false, 'message' => 'Data dokter tidak ditemukan'], 404);
        }

        $booking = Booking::whereHas('jadwal', fn($q) => $q->where('id_dokter', $dokter->id_dokter))
            ->where('id_booking', $idBooking)
            ->firstOrFail();

        // ✅ DIPERBAIKI: 'diproses' → 'dikonfirmasi' (sesuai ENUM di migration)
        $validated = $request->validate([
            'status' => ['required', Rule::in(['menunggu', 'dikonfirmasi', 'selesai', 'dibatalkan'])],
        ]);

        $booking->update(['status' => $validated['status']]);

        return response()->json([
            'success' => true,
            'message' => 'Status booking berhasil diperbarui.',
            'data'    => $this->formatBooking(
                $booking->fresh(['hewan', 'user', 'jadwal', 'layanans'])
            ),
        ]);
    }

    // =========================================================================
    //  PRIVATE: format booking untuk response
    // =========================================================================
    private function formatBooking(Booking $b): array
    {
        return [
            'id'              => $b->id_booking,
            'no_booking'      => $b->no_booking,
            'no_antrian'      => $b->no_antrian,
            'tanggal_booking' => $b->tanggal_booking?->format('Y-m-d'),
            'jam'             => $b->jam,
            'status'          => $b->status,
            'catatan'         => $b->catatan,

            'nama_pemilik'    => $b->user?->nama    ?? $b->user?->name    ?? '-',
            'no_hp'           => $b->user?->no_hp   ?? '-',

            'nama_hewan'      => $b->hewan?->nama_hewan ?? $b->hewan?->name  ?? '-',
            'jenis_hewan'     => $b->hewan?->jenis      ?? $b->hewan?->type  ?? '-',
            'ras_hewan'       => $b->hewan?->ras        ?? $b->hewan?->breed ?? '-',
            'foto_hewan'      => $b->hewan?->foto       ?? null,

            'tanggal_jadwal'  => $b->jadwal?->tanggal?->format('Y-m-d') ?? '-',
            'jam_mulai'       => $b->jadwal?->jam_mulai   ? substr($b->jadwal->jam_mulai,   0, 5) : '-',
            'jam_selesai'     => $b->jadwal?->jam_selesai ? substr($b->jadwal->jam_selesai, 0, 5) : '-',

            'layanans'        => $b->layanans->map(fn($l) => [
                'id_layanan'         => $l->id_layanan,
                'nama_layanan'       => $l->nama_layanan,
                'kategori'           => $l->kategori,
                'harga_saat_booking' => $l->pivot->harga_saat_booking,
            ])->toArray(),
        ];
    }
}