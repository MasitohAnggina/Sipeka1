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
     */
    public function index(Request $request): JsonResponse
    {
        $dokter = $this->getDokter($request);
        if (!$dokter) return response()->json(['message' => 'Data dokter tidak ditemukan'], 404);

        // Ambil SEMUA booking ke dokter ini (termasuk yang sudah selesai)
        $bookings = Booking::with(['hewan.user', 'jadwal'])
            ->whereHas('jadwal', fn($q) => $q->where('id_dokter', $dokter->id_dokter))
            ->whereIn('status', ['dikonfirmasi', 'selesai'])
            ->orderBy('id_booking', 'desc')
            ->get();

        $hewanMap = [];
        foreach ($bookings as $booking) {
            if (!$booking->hewan) continue;
            $idHewan = $booking->hewan->id_hewan;

            if (!isset($hewanMap[$idHewan])) {
                $hewanMap[$idHewan] = [
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
                    'rekam_medis'   => [],
                    'sudah_dicatat' => false,
                ];
            }

            // Cek rekam medis untuk booking ini
            $riwayat = RiwayatLayanan::where('id_booking', $booking->id_booking)
                ->with('rekamMedis.dokter')
                ->first();

            if ($riwayat && $riwayat->rekamMedis) {
                $rm = $riwayat->rekamMedis;
                $hewanMap[$idHewan]['rekam_medis'][] = [
                    'id_rekam_medis'   => $rm->id_rekam_medis,
                    'tanggal'          => $riwayat->tanggal?->format('Y-m-d'),
                    'diagnosa'         => $rm->diagnosa,
                    'diagnosa_lengkap' => $rm->diagnosa_lengkap,
                    'catatan_dokter'   => $rm->catatan_dokter,
                    'nama_dokter'      => $rm->dokter->nama_dokter ?? '-',
                ];
                $hewanMap[$idHewan]['sudah_dicatat'] = true;
            } else {
                if (
                    $hewanMap[$idHewan]['id_booking'] === null &&
                    !in_array($booking->status, ['dibatalkan'])
                ) {
                    $hewanMap[$idHewan]['id_booking'] = $booking->id_booking;
                }
            }
        }

        // ── Sort: rekam medis terbaru di atas, belum tercatat di bawah ──
        $result = array_values($hewanMap);

        usort($result, function ($a, $b) {
            $latestA = !empty($a['rekam_medis'])
                ? max(array_column($a['rekam_medis'], 'tanggal'))
                : '0000-00-00';

            $latestB = !empty($b['rekam_medis'])
                ? max(array_column($b['rekam_medis'], 'tanggal'))
                : '0000-00-00';

            return strcmp($latestB, $latestA); // desc: terbaru di atas
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
            'tanggal'          => 'required|date',
        ]);

        $riwayat = RiwayatLayanan::firstOrCreate(
            ['id_booking' => $request->id_booking],
            ['tanggal' => $request->tanggal, 'grand_total' => 0]
        );

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