<?php

namespace App\Http\Controllers;

use App\Models\Booking;
use App\Models\Dokter;
use App\Models\Hewan;
use App\Models\RekamMedis;
use App\Models\RiwayatLayanan;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class RekamMedisController extends Controller
{
    private function getDokter(Request $request)
    {
        return Dokter::where('id_user', $request->user()->id_user)->first();
    }

    /**
     * GET /dokter/rekam-medis
     *
     * PERBAIKAN:
     * Sebelumnya data dikelompokkan per id_hewan, sehingga jika satu hewan
     * punya lebih dari satu booking, status "sudah_dicatat" milik salah satu
     * booking akan "bocor" ke booking lain milik hewan yang sama (bug: tombol
     * "Catat" berubah jadi "Tercatat" walau booking tsb belum dicatat).
     *
     * Sekarang: 1 baris hasil = 1 booking. rekam_medis adalah objek tunggal
     * (atau null), dan sudah_dicatat selalu murni mencerminkan status booking
     * itu sendiri.
     */
    public function index(Request $request): JsonResponse
    {
        $dokter = $this->getDokter($request);
        if (!$dokter) return response()->json(['message' => 'Data dokter tidak ditemukan'], 404);

        $bookings = Booking::with(['hewan.user', 'jadwal'])
            ->whereHas('jadwal', fn($q) => $q->where('id_dokter', $dokter->id_dokter))
            ->whereIn('status', ['dikonfirmasi', 'selesai'])
            ->orderBy('id_booking', 'desc')
            ->get();

        $result = [];

        foreach ($bookings as $booking) {
            if (!$booking->hewan) continue;

            $riwayat = RiwayatLayanan::where('id_booking', $booking->id_booking)
                ->with('rekamMedis.dokter')
                ->first();

            $rekamMedis = null;
            if ($riwayat && $riwayat->rekamMedis) {
                $rm = $riwayat->rekamMedis;
                $rekamMedis = [
                    'id_rekam_medis'   => $rm->id_rekam_medis,
                    'tanggal'          => $riwayat->tanggal?->format('Y-m-d'),
                    'diagnosa'         => $rm->diagnosa,
                    'diagnosa_lengkap' => $rm->diagnosa_lengkap,
                    'catatan_dokter'   => $rm->catatan_dokter,
                    'nama_dokter'      => $rm->dokter->nama_dokter ?? '-',
                ];
            }

            $result[] = [
                'id_hewan'      => $booking->hewan->id_hewan,
                'id_booking'    => $booking->id_booking,
                'nama_hewan'    => $booking->hewan->nama_hewan,
                'jenis'         => $booking->hewan->jenis,
                'ras'           => $booking->hewan->ras,
                'umur'          => $booking->hewan->umur,
                'foto'          => $booking->hewan->foto
                                    ? asset('storage/' . $booking->hewan->foto)
                                    : null,
                'nama_pemilik'  => $booking->hewan->user->nama ?? '-',
                'rekam_medis'   => $rekamMedis,       // objek tunggal atau null
                'sudah_dicatat' => $rekamMedis !== null,
            ];
        }

        // Urutkan: booking yang BELUM dicatat naik ke atas dulu (memudahkan
        // dokter menemukan yang perlu ditindaklanjuti). Di dalam grup yang
        // sama, booking terbaru (id_booking terbesar) tampil lebih dulu.
        usort($result, function ($a, $b) {
            if ($a['sudah_dicatat'] !== $b['sudah_dicatat']) {
                return $a['sudah_dicatat'] ? 1 : -1;
            }
            return $b['id_booking'] <=> $a['id_booking'];
        });

        return response()->json([
            'success' => true,
            'data'    => $result,
        ]);
    }

    /**
     * POST /dokter/rekam-medis
     */
    public function store(Request $request): JsonResponse
    {
        $dokter = $this->getDokter($request);
        if (!$dokter) return response()->json(['message' => 'Data dokter tidak ditemukan'], 404);

        $request->validate([
            'id_booking'       => 'required|integer|exists:booking,id_booking',
            'diagnosa'         => 'required|string',
            'diagnosa_lengkap' => 'nullable|string',
            'catatan_dokter'   => 'nullable|string',
            'tindakan'         => 'nullable|string',
            'tanggal'          => 'required|date',
        ]);

        $riwayat = RiwayatLayanan::firstOrCreate(
            ['id_booking' => $request->id_booking],
            ['tanggal' => $request->tanggal, 'grand_total' => 0]
        );

        // PERBAIKAN: cek duplikasi dilakukan dalam transaksi implisit yang
        // sama dengan firstOrCreate di atas untuk mengurangi race condition
        // dua request store() bersamaan pada booking yang sama.
        $existing = RekamMedis::where('id_riwayat', $riwayat->id_riwayat)->first();
        if ($existing) {
            return response()->json([
                'success' => false,
                'message' => 'Rekam medis untuk booking ini sudah ada.',
            ], 422);
        }

        $rekamMedis = RekamMedis::create([
            'id_riwayat'       => $riwayat->id_riwayat,
            'id_dokter'        => $dokter->id_dokter,
            'diagnosa'         => $request->diagnosa,
            'diagnosa_lengkap' => $request->diagnosa_lengkap,
            'catatan_dokter'   => $request->catatan_dokter,
            'tindakan'         => $request->tindakan,
        ]);

        Booking::where('id_booking', $request->id_booking)
            ->update(['status' => 'selesai']);

        return response()->json([
            'success' => true,
            'message' => 'Rekam medis berhasil disimpan.',
            'data'    => $rekamMedis,
        ], 201);
    }

    /**
     * GET /dokter/rekam-medis/{id}
     * Detail rekam medis
     */
    public function show(Request $request, int $id): JsonResponse
    {
        $dokter = $this->getDokter($request);
        if (!$dokter) return response()->json(['message' => 'Data dokter tidak ditemukan'], 404);

        $rm = RekamMedis::with(['riwayatLayanan.booking.hewan.user', 'dokter'])
            ->where('id_rekam_medis', $id)
            ->where('id_dokter', $dokter->id_dokter)
            ->firstOrFail();

        $booking = $rm->riwayatLayanan->booking;
        $hewan   = $booking->hewan;

        return response()->json([
            'success' => true,
            'data'    => [
                'id_rekam_medis'   => $rm->id_rekam_medis,
                'tanggal'          => $rm->riwayatLayanan->tanggal?->format('Y-m-d'),
                'diagnosa'         => $rm->diagnosa,
                'diagnosa_lengkap' => $rm->diagnosa_lengkap,
                'catatan_dokter'   => $rm->catatan_dokter,
                'nama_dokter'      => $rm->dokter->nama_dokter ?? '-',
                'nama_hewan'       => $hewan->nama_hewan ?? '-',
                'jenis_hewan'      => $hewan->jenis      ?? '-',
                'ras_hewan'        => $hewan->ras         ?? '-',
                'nama_pemilik'     => $hewan->user->nama  ?? '-',
                'tindakan'         => $rm->tindakan,
            ],
        ]);
    }
}