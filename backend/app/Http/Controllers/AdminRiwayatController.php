<?php

namespace App\Http\Controllers;

use App\Models\Booking;
use App\Models\Pembayaran;
use App\Models\RiwayatLayanan;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class AdminRiwayatController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $riwayat = RiwayatLayanan::with([
            'booking.hewan',
            'booking.user',
            'booking.layanans',
            'booking.jadwal.dokter',
            'rekamMedis',
        ])
        ->whereHas('booking', fn($q) => $q->where('status', 'selesai')) // ← hanya selesai
        ->orderBy('tanggal', 'desc')
        ->get()
        ->map(fn($r) => $this->formatRiwayat($r));

        return response()->json(['success' => true, 'data' => $riwayat]);
    }

    public function summary(): JsonResponse
    {
        $total           = RiwayatLayanan::whereHas('booking', fn($q) => $q->where('status', 'selesai'))->count();
        $selesai         = Booking::where('status', 'selesai')->count();
        $dibatalkan      = Booking::where('status', 'dibatalkan')->count();
        $totalPendapatan = Pembayaran::where('status', 'lunas')->sum('jumlah');

        return response()->json([
            'success' => true,
            'data'    => [
                'total'            => $total,
                'selesai'          => $selesai,
                'dibatalkan'       => $dibatalkan,
                'total_pendapatan' => $totalPendapatan,
            ],
        ]);
    }

    private function formatRiwayat(RiwayatLayanan $r): array
    {
        $booking = $r->booking;
        $dokter  = $booking?->jadwal?->dokter;

        return [
            'id_riwayat'      => $r->id_riwayat,
            'tanggal'         => $r->tanggal?->format('Y-m-d'),
            'grand_total'     => (float) $r->grand_total,
            'catatan'         => $r->catatan,
            'no_booking'      => $booking?->no_booking         ?? '-',
            'status_booking'  => $booking?->status             ?? '-',
            'nama_pemilik'    => $booking?->user?->nama        ?? '-',
            'no_hp'           => $booking?->user?->no_hp       ?? '-',
            'nama_hewan'      => $booking?->hewan?->nama_hewan ?? '-',
            'jenis_hewan'     => $booking?->hewan?->jenis      ?? '-',
            'foto_hewan'      => $booking?->hewan?->foto
                                    ? asset('storage/' . $booking->hewan->foto)
                                    : null,
            'nama_dokter'     => $dokter?->nama_dokter ?? '-',
            'layanans'        => $booking?->layanans?->map(fn($l) => [
                'nama_layanan'       => $l->nama_layanan,
                'harga_saat_booking' => $l->pivot->harga_saat_booking,
            ])->toArray() ?? [],
            'diagnosa'        => $r->rekamMedis?->diagnosa ?? null,
        ];
    }
}