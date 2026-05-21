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

        // ── Cari tanggal booking terbaru milik user ───────────────────────────
        $bookingTerbaru = Booking::where('id_user', $idUser)
            ->orderBy('tanggal_booking', 'desc')
            ->value('tanggal_booking');

        // ── Semua booking pada tanggal terbaru tersebut ───────────────────────
        $bookingsHariIni = collect();

        if ($bookingTerbaru) {
            $tanggalTerbaru = \Carbon\Carbon::parse($bookingTerbaru)->toDateString();

            $bookingsHariIni = Booking::with(['hewan', 'jadwal', 'layanans'])
                ->where('id_user', $idUser)
                ->whereDate('tanggal_booking', $tanggalTerbaru)
                ->orderByRaw("FIELD(status, 'diproses', 'dikonfirmasi', 'menunggu', 'selesai', 'dibatalkan')")
                ->orderBy('no_antrian', 'asc')
                ->get()
                ->map(function ($b) {
                    $layanans = $b->layanans ?? collect();
                    return [
                        'id_booking'      => $b->id_booking,
                        'no_booking'      => $b->no_booking,
                        'no_antrian'      => $b->no_antrian,
                        'tanggal_booking' => $b->tanggal_booking?->format('Y-m-d'),
                        'jam'             => $b->jam
                            ?? ($b->jadwal?->jam_mulai ? substr($b->jadwal->jam_mulai, 0, 5) : '-'),
                        'status'          => $b->status,
                        'hewan_nama'      => $b->hewan?->nama_hewan ?? '-',
                        'layanan_nama'    => $layanans->pluck('nama_layanan')->join(', ') ?: '-',
                        'updated_at'      => $b->updated_at?->format('Y-m-d H:i:s'),
                    ];
                });
        }

        // ── Booking aktif (untuk polling notifikasi status) ───────────────────
        $bookingAktif = Booking::with(['hewan', 'jadwal', 'layanans'])
            ->where('id_user', $idUser)
            ->where(function ($q) {
                $q->whereIn('status', ['menunggu', 'dikonfirmasi', 'diproses'])
                  ->orWhere(function ($q2) {
                      $q2->whereIn('status', ['selesai', 'dibatalkan'])
                         ->where('updated_at', '>=', now()->subDays(7));
                  });
            })
            ->orderByRaw("FIELD(status, 'menunggu', 'dikonfirmasi', 'diproses', 'selesai', 'dibatalkan')")
            ->orderBy('tanggal_booking', 'asc')
            ->first();

        $bookingAktifData = null;
        if ($bookingAktif) {
            $layanans = $bookingAktif->layanans ?? collect();
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
                'layanan_nama'    => $layanans->pluck('nama_layanan')->join(', ') ?: '-',
                'updated_at'      => $bookingAktif->updated_at?->format('Y-m-d H:i:s'),
            ];
        }

        // ── Total kunjungan ───────────────────────────────────────────────────
        $totalKunjungan = Booking::where('id_user', $idUser)
            ->where('status', 'selesai')
            ->count();

        // ── Riwayat 10 terakhir (gabungan riwayat_layanan + booking selesai) ──
        $riwayatDariTabel = RiwayatLayanan::with([
            'booking.hewan',
            'booking.layanans',
        ])
            ->whereHas('booking', fn($q) => $q->where('id_user', $idUser))
            ->orderBy('tanggal', 'desc')
            ->limit(10) // ← ubah dari 5
            ->get()
            ->map(function ($r) {
                $tanggal  = $r->tanggal ? \Carbon\Carbon::parse($r->tanggal) : null;
                $booking  = $r->booking;
                $layanans = $booking?->layanans ?? collect();
                return [
                    'id_riwayat'     => $r->id_riwayat,
                    'id_booking_ref' => $booking?->id_booking,
                    'tanggal'        => $tanggal?->format('d'),
                    'bulan'          => $tanggal?->translatedFormat('M Y'),
                    'hewan_nama'     => $booking?->hewan?->nama_hewan ?? '-',
                    'layanan_utama'  => $layanans->first()?->nama_layanan ?? '-',
                    'layanan_detail' => $layanans->pluck('nama_layanan')->join(', '),
                    'status'         => 'selesai',
                    'tanggal_sort'   => $r->tanggal ? $r->tanggal->format('Y-m-d') : '1970-01-01',
                ];
            });

        $bookingIdsWithRiwayat = RiwayatLayanan::whereHas(
            'booking', fn($q) => $q->where('id_user', $idUser)
        )->pluck('id_booking')->toArray();

        $riwayatDariBooking = Booking::with(['hewan', 'layanans'])
            ->where('id_user', $idUser)
            ->where('status', 'selesai')
            ->whereNotIn('id_booking', $bookingIdsWithRiwayat)
            ->orderBy('tanggal_booking', 'desc')
            ->limit(10) // ← ubah dari 5
            ->get()
            ->map(function ($b) {
                $layanans = $b->layanans ?? collect();
                $tanggal  = $b->tanggal_booking
                    ? \Carbon\Carbon::parse($b->tanggal_booking)
                    : null;
                return [
                    'id_riwayat'     => -$b->id_booking,
                    'id_booking_ref' => $b->id_booking,
                    'tanggal'        => $tanggal?->format('d'),
                    'bulan'          => $tanggal?->translatedFormat('M Y'),
                    'hewan_nama'     => $b->hewan?->nama_hewan ?? '-',
                    'layanan_utama'  => $layanans->first()?->nama_layanan ?? '-',
                    'layanan_detail' => $layanans->pluck('nama_layanan')->join(', '),
                    'status'         => 'selesai',
                    'tanggal_sort'   => $tanggal?->format('Y-m-d') ?? '1970-01-01',
                ];
            });

        $riwayat = collect($riwayatDariTabel)
            ->merge(collect($riwayatDariBooking))
            ->unique('id_booking_ref')
            ->sortByDesc('tanggal_sort')
            ->take(10) // ← ubah dari 3
            ->values();

        return response()->json([
            'success' => true,
            'data' => [
                'user' => [
                    'nama'         => $user->nama,
                    'foto_profile' => $user->foto_profile
                        ? asset('storage/' . $user->foto_profile) : null,
                ],
                'hewan'             => $hewan,
                'booking_aktif'     => $bookingAktifData,
                'bookings_hari_ini' => $bookingsHariIni,
                'total_kunjungan'   => $totalKunjungan,
                'riwayat_terakhir'  => $riwayat,
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