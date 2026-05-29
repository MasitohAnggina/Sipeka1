<?php

namespace App\Http\Controllers;

use App\Models\Booking;
use App\Models\Jadwal;
use App\Models\Hewan;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Carbon;

class DashboardAdminController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $today    = Carbon::today();
        $bulanIni = Carbon::now()->startOfMonth();

        // ── 1. Jadwal hari ini ────────────────────────────────────────────────
        $jadwalHariIniIds = Jadwal::whereDate('tanggal', $today)
            ->pluck('id_jadwal');

        $totalJadwal      = $jadwalHariIniIds->count();

        // ── 2. Booking hari ini ───────────────────────────────────────────────
        // ── 2. Booking bulan ini (ganti dari hari ini) ────────────────────────────
$bookingBulanIni    = Booking::where('created_at', '>=', $bulanIni)->get();

$totalBooking       = $bookingBulanIni->count();
$bookingSelesai     = $bookingBulanIni->where('status', 'selesai')->count();
$bookingMenunggu    = $bookingBulanIni->whereIn('status', ['menunggu', 'dikonfirmasi', 'berlangsung'])->count();
$bookingDibatalkan  = $bookingBulanIni->where('status', 'dibatalkan')->count();

        // ── 3. Total hewan/pasien ─────────────────────────────────────────────
        $totalHewan       = Hewan::count();

        // ── 4. Pasien terbaru (5 booking terbaru) ─────────────────────────────
        $pasienTerbaru = Booking::with(['hewan.user', 'riwayatLayanan.rekamMedis', 'layanans', 'jadwal.dokter'])
            ->orderByDesc('created_at')
            ->limit(5)
            ->get()
            ->map(function (Booking $b) {
                $hewan   = $b->hewan;
                $pemilik = $hewan?->user;
                $rm      = $b->riwayatLayanan?->rekamMedis;
                $dokter  = $b->jadwal?->dokter;
                $layanan = $b->layanans->first()?->nama_layanan ?? '-';

                return [
                    'id_booking'   => $b->id_booking,
                    'nama_hewan'   => $hewan?->nama_hewan   ?? '-',
                    'jenis'        => $hewan?->jenis        ?? '-',
                    'ras'          => $hewan?->ras          ?? null,
                    'foto'         => $hewan?->foto ? asset('storage/' . $hewan->foto) : null,
                    'nama_pemilik' => $pemilik?->nama       ?? '-',
                    'nama_dokter'  => $dokter?->nama_dokter ?? '-',
                    'layanan'      => $layanan,
                    'status'       => $b->status,
                    'diagnosa'     => $rm?->diagnosa        ?? null,
                    'waktu'        => $b->created_at?->diffForHumans() ?? '-',
                ];
            });

        // ── 5. Ringkasan kunjungan ────────────────────────────────────────────
        $kunjunganBulanIni = Booking::where('status', 'selesai')
            ->where('created_at', '>=', $bulanIni)
            ->count();

        $kunjunganTahunIni = Booking::where('status', 'selesai')
            ->where('created_at', '>=', Carbon::now()->startOfYear())
            ->count();

        return response()->json([
            'success' => true,
            'data'    => [
                'nama_admin' => $request->user()->nama ?? 'Admin',
                'stat_cards' => [
                    'jadwal_hari_ini' => [
                        'total'      => $totalJadwal,
                    ],
                    'booking_hari_ini' => [
                        'total'      => $totalBooking,
                        'selesai'    => $bookingSelesai,
                        'menunggu'   => $bookingMenunggu,
                        'dibatalkan' => $bookingDibatalkan,
                    ],
                    'total_hewan'          => $totalHewan,
                    'pendapatan_bulan_ini' => null, // dummy, belum ada tabel pembayaran
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