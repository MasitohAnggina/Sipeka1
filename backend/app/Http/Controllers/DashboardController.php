<?php

namespace App\Http\Controllers;

use App\Models\Booking;
use App\Models\Hewan;
use App\Models\RiwayatLayanan;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $idUser = $request->user()->id_user;
        $user   = $request->user();

        // ── Data hewan ────────────────────────────────────────────────────────
        $hewan = Hewan::where('id_user', $idUser)
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(fn($h) => [
                'id'       => (string) $h->id_hewan,
                'id_hewan' => $h->id_hewan,
                'name'     => $h->nama_hewan,
                'type'     => $h->jenis,
                'breed'    => $h->ras ?? '-',
                'age'      => $h->umur !== null ? $h->umur . ' Tahun' : '-',
                'weight'   => $h->berat !== null ? $h->berat . ' Kg' : '-',
                'emoji'    => $this->emojiMap($h->jenis),
                'photo'    => $h->foto ? asset('storage/' . $h->foto) : null,
            ]);

        // ── Booking aktif (menunggu / dikonfirmasi) — per hewan terpisah ─────
        // Ambil semua booking aktif, bukan hanya satu, agar dashboard akurat
        $bookingAktifList = Booking::with(['hewan', 'jadwal', 'layanans'])
            ->where('id_user', $idUser)
            ->whereIn('status', ['menunggu', 'dikonfirmasi'])
            ->orderBy('tanggal_booking', 'asc')
            ->get();

        // Untuk tampilan dashboard: ambil yang pertama sebagai "aktif"
        $bookingAktif = $bookingAktifList->first();
        $bookingAktifData = null;

        if ($bookingAktif) {
            $layanans    = $bookingAktif->layanans ?? collect();
            $layananNama = $layanans->pluck('nama_layanan')->join(', ');

            $bookingAktifData = [
                'id_booking'      => $bookingAktif->id_booking,
                'no_booking'      => $bookingAktif->no_booking,
                'no_antrian'      => $bookingAktif->no_antrian,
                'tanggal_booking' => $bookingAktif->tanggal_booking?->format('Y-m-d'),
                'jam'             => $bookingAktif->jam
                    ?? ($bookingAktif->jadwal?->jam_mulai
                        ? substr($bookingAktif->jadwal->jam_mulai, 0, 5) : '-'),
                'status'          => $bookingAktif->status,
                'hewan_nama'      => $bookingAktif->hewan?->nama_hewan ?? '-',
                'layanan_nama'    => $layananNama ?: '-',
            ];
        }

        // ── Total kunjungan (booking selesai) ─────────────────────────────────
        $totalKunjungan = Booking::where('id_user', $idUser)
            ->where('status', 'selesai')
            ->count();

        // ── Riwayat 3 terakhir ─────────────────────────────────────────────
        $riwayat = RiwayatLayanan::with([
            'booking.hewan',
            'booking.layanans',
        ])
            ->whereHas('booking', fn($q) => $q->where('id_user', $idUser))
            ->orderBy('tanggal', 'desc')
            ->limit(3)
            ->get()
            ->map(function ($r) {
                $tanggal  = $r->tanggal ? \Carbon\Carbon::parse($r->tanggal) : null;
                $booking  = $r->booking;
                $layanans = $booking?->layanans ?? collect();

                return [
                    'id_riwayat'    => $r->id_riwayat,
                    'tanggal'       => $tanggal?->format('d'),
                    'bulan'         => $tanggal?->translatedFormat('M Y'),
                    'hewan_nama'    => $booking?->hewan?->nama_hewan ?? '-',
                    'layanan_utama' => $layanans->first()?->nama_layanan ?? '-',
                    // Untuk riwayat_detail: gabung semua layanan
                    'layanan_detail'=> $layanans->pluck('nama_layanan')->join(', '),
                    'status'        => $booking?->status ?? 'selesai',
                ];
            });

        return response()->json([
            'success' => true,
            'data' => [
                'user' => [
                    'nama'         => $user->nama,
                    'foto_profile' => $user->foto_profile
                        ? asset('storage/' . $user->foto_profile) : null,
                ],
                'hewan'            => $hewan,
                'booking_aktif'    => $bookingAktifData,
                'total_kunjungan'  => $totalKunjungan,
                'riwayat_terakhir' => $riwayat,
            ],
        ]);
    }

    private function emojiMap(string $jenis): string
    {
        return match (strtolower($jenis)) {
            'anjing'  => '🐕',
            'kucing'  => '🐈',
            'kelinci' => '🐇',
            'hamster' => '🐹',
            'burung'  => '🐦',
            default   => '🐾',
        };
    }
}