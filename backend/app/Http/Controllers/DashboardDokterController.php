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

        // Ambil semua id_jadwal milik dokter ini
        $jadwalIds = Jadwal::where('id_dokter', $dokter->id_dokter)
            ->pluck('id_jadwal');

        // ── 1. Jadwal & Booking hari ini ──────────────────────────────────────
        $jadwalHariIniIds = Jadwal::where('id_dokter', $dokter->id_dokter)
            ->whereDate('tanggal', $today)
            ->pluck('id_jadwal');

        // ── 2. Booking bulan ini (ganti dari hari ini) ────────────────────────────
$bookingBulanIni    = Booking::where('created_at', '>=', $bulanIni)->get();

$totalBooking       = $bookingBulanIni->count();
$bookingSelesai     = $bookingBulanIni->where('status', 'selesai')->count();
$bookingMenunggu    = $bookingBulanIni->whereIn('status', ['menunggu', 'dikonfirmasi', 'berlangsung'])->count();
$bookingDibatalkan  = $bookingBulanIni->where('status', 'dibatalkan')->count();
$bookingDibatalkan = Booking::whereIn('id_jadwal', $jadwalHariIniIds)
            ->where('status', 'dibatalkan')
            ->count();

        // ── 2. Rekam medis bulan ini ──────────────────────────────────────────
        $rekamMedisBulanIni = RekamMedis::where('id_dokter', $dokter->id_dokter)
            ->where('created_at', '>=', $bulanIni)
            ->count();

        // ── 3. Pasien terbaru ─────────────────────────────────────────────────
        $pasienTerbaru = Booking::with(['hewan.user', 'riwayatLayanan.rekamMedis', 'layanans'])
            ->whereIn('id_jadwal', $jadwalIds)
            ->whereNotIn('status', ['dibatalkan'])
            ->orderByDesc('created_at')
            ->limit(5)
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

        // ── 4. Ringkasan kunjungan ────────────────────────────────────────────
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
                        'total'      => $totalBooking,
                        'selesai'    => $bookingSelesai,
                        'menunggu'   => $bookingMenunggu,
                        'dibatalkan' => $bookingDibatalkan,
                    ],
                    'booking_hari_ini' => [
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