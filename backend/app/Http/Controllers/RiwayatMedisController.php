<?php

namespace App\Http\Controllers;

use App\Models\Dokter;
use App\Models\RekamMedis;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class RiwayatMedisController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $dokter = Dokter::where('id_user', $request->user()->id_user)->first();
        if (!$dokter) {
            return response()->json(['message' => 'Data dokter tidak ditemukan'], 404);
        }

        $riwayat = RekamMedis::with([
            'riwayatLayanan.booking.hewan.user',
            'dokter',
        ])
        ->where('id_dokter', $dokter->id_dokter)
        ->orderByDesc('id_rekam_medis')
        ->get()
        ->map(function ($rm) {
            $booking = $rm->riwayatLayanan?->booking;
            $hewan   = $booking?->hewan;

            return [
                'id_rekam_medis'   => $rm->id_rekam_medis,
                'tanggal'          => $rm->riwayatLayanan?->tanggal?->format('Y-m-d'),
                'nama_hewan'       => $hewan?->nama_hewan   ?? '-',
                'jenis'            => $hewan?->jenis         ?? '-',
                'foto'             => $hewan?->foto
                                        ? asset('storage/' . $hewan->foto)
                                        : null,
                'nama_pemilik'     => $hewan?->user?->nama   ?? '-',
                'diagnosa'         => $rm->diagnosa,
                'diagnosa_lengkap' => $rm->diagnosa_lengkap,
                'catatan_dokter'   => $rm->catatan_dokter,
                'tindakan'         => $rm->tindakan,
                'nama_dokter'      => $rm->dokter?->nama_dokter ?? '-',
            ];
        });

        return response()->json([
            'success' => true,
            'data'    => $riwayat,
        ]);
    }
}