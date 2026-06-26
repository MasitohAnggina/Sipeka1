<?php

namespace App\Http\Controllers;

use App\Models\Booking;
use App\Models\Dokter;
use App\Models\Jadwal;
use App\Models\RekamMedis;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Carbon;

class DashboardDokterController extends Controller
{
    private function getDokter(Request $request): ?Dokter
    {
        return Dokter::with('user')->where('id_user', $request->user()->id_user)->first();
    }

    public function index(Request $request): JsonResponse
    {
        $dokter = $this->getDokter($request);
        if (!$dokter) {
            return response()->json(['message' => 'Data dokter tidak ditemukan'], 404);
        }

        $today    = Carbon::today();
        $bulanIni = Carbon::now()->startOfMonth();
        $tahunIni = Carbon::now()->startOfYear();

        // ── Semua jadwal dokter ini (1 query, dipecah di memory) ──────────────
        $semuaJadwal      = Jadwal::where('id_dokter', $dokter->id_dokter)->get();
        $jadwalIds        = $semuaJadwal->pluck('id_jadwal');
        $jadwalHariIniIds = $semuaJadwal->where('tanggal', $today->toDateString())->pluck('id_jadwal');

        // ── Booking hari ini ──────────────────────────────────────────────────
        $bookingHariIni   = Booking::whereIn('id_jadwal', $jadwalHariIniIds)->get();
        $jadwalTotal      = $bookingHariIni->count();
        $jadwalSelesai    = $bookingHariIni->where('status', 'selesai')->count();
        $jadwalMenunggu   = $bookingHariIni->whereIn('status', ['menunggu', 'dikonfirmasi'])->count();
        $jadwalDibatalkan = $bookingHariIni->where('status', 'dibatalkan')->count();

        // ── Booking bulan ini ─────────────────────────────────────────────────
        $bookingBulanIni   = Booking::whereIn('id_jadwal', $jadwalIds)
            ->where('created_at', '>=', $bulanIni)
            ->get();
        $totalBooking      = $bookingBulanIni->count();
        $bookingSelesai    = $bookingBulanIni->where('status', 'selesai')->count();
        $bookingMenunggu   = $bookingBulanIni->whereIn('status', ['menunggu', 'dikonfirmasi'])->count();
        $bookingDibatalkan = $bookingBulanIni->where('status', 'dibatalkan')->count();

        // ── Rekam medis bulan ini ─────────────────────────────────────────────
        $rekamMedisBulanIni = RekamMedis::where('id_dokter', $dokter->id_dokter)
            ->where('created_at', '>=', $bulanIni)
            ->count();

        // ── Pasien terbaru (7 hari, semua status) ─────────────────────────────
        $pasienTerbaru = Booking::with(['hewan.user', 'riwayatLayanan.rekamMedis', 'layanans'])
            ->whereIn('id_jadwal', $jadwalIds)
            ->where('created_at', '>=', Carbon::now()->subDays(7))
            ->orderByDesc('created_at')
            ->limit(10)
            ->get()
            ->map(function (Booking $b) {
                $hewan   = $b->hewan;
                $pemilik = $hewan?->user;
                $rm      = $b->riwayatLayanan?->rekamMedis;
                $layanan = $b->layanans->first()?->nama_layanan ?? '-';

                return [
                    'id_booking'   => $b->id_booking,
                    'nama_hewan'   => $hewan?->nama_hewan ?? '-',
                    'jenis'        => $hewan?->jenis      ?? '-',
                    'ras'          => $hewan?->ras        ?? null,
                    'foto'         => $hewan?->foto ? asset('storage/' . $hewan->foto) : null,
                    'nama_pemilik' => $pemilik?->nama     ?? '-',
                    'layanan'      => $layanan,
                    'status'       => $b->status,
                    'diagnosa'     => $rm?->diagnosa      ?? null,
                    'waktu'        => $b->created_at?->diffForHumans() ?? '-',
                ];
            });

        // ── Ringkasan kunjungan ───────────────────────────────────────────────
        $kunjunganBulanIni = Booking::whereIn('id_jadwal', $jadwalIds)
            ->where('status', 'selesai')
            ->where('created_at', '>=', $bulanIni)
            ->count();

        $kunjunganTahunIni = Booking::whereIn('id_jadwal', $jadwalIds)
            ->where('status', 'selesai')
            ->where('created_at', '>=', $tahunIni)
            ->count();

        return response()->json([
            'success' => true,
            'data'    => [
                'nama_dokter' => $dokter->user?->nama ?? 'Dokter',
                'stat_cards'  => [
                    'jadwal_hari_ini' => [
                        'total'      => $jadwalTotal,
                        'selesai'    => $jadwalSelesai,
                        'menunggu'   => $jadwalMenunggu,
                        'dibatalkan' => $jadwalDibatalkan,
                    ],
                    'booking_bulan_ini' => [
                        'total'      => $totalBooking,
                        'selesai'    => $bookingSelesai,
                        'menunggu'   => $bookingMenunggu,
                        'dibatalkan' => $bookingDibatalkan,
                    ],
                    'rekam_medis_bulan_ini' => $rekamMedisBulanIni,
                ],
                'pasien_terbaru'      => $pasienTerbaru,
                'ringkasan_kunjungan' => [
                    'bulan_ini' => $kunjunganBulanIni,
                    'tahun_ini' => $kunjunganTahunIni,
                ],
            ],
        ]);
    }
}