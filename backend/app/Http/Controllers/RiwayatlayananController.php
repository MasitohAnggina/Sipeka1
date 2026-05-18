<?php

namespace App\Http\Controllers;

use App\Models\RiwayatLayanan;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class RiwayatLayananController extends Controller
{
    // GET /api/riwayat
    public function index(Request $request): JsonResponse
    {
        $idUser = $request->user()->id_user;

        $riwayat = RiwayatLayanan::with([
            'booking.hewan',
            'booking.layanans',   // many-to-many
            'pembayaran',
        ])
            ->whereHas('booking', fn($q) => $q->where('id_user', $idUser))
            ->orderBy('tanggal', 'desc')
            ->get()
            ->map(fn($r) => $this->fmt($r));

        return response()->json(['success' => true, 'data' => $riwayat]);
    }

    // GET /api/riwayat/stats
    public function stats(Request $request): JsonResponse
    {
        $idUser = $request->user()->id_user;

        $rows = RiwayatLayanan::with('booking.layanans')
            ->whereHas('booking', fn($q) => $q->where('id_user', $idUser))
            ->get();

        $stats = [
            'total'            => $rows->count(),
            'Vaksinasi'        => 0,
            'Grooming'         => 0,
            'Perawatan Medis'  => 0,
            'Hotel'            => 0,
            'Lainnya'          => 0,
        ];

        foreach ($rows as $r) {
            // Hitung berdasarkan kategori dari semua layanan yang ada di booking
            $kategoris = $r->booking?->layanans?->pluck('kategori')->unique() ?? collect();
            foreach ($kategoris as $kat) {
                $key = array_key_exists($kat, $stats) ? $kat : 'Lainnya';
                $stats[$key]++;
            }
        }

        return response()->json(['success' => true, 'data' => $stats]);
    }

    // GET /api/riwayat/{id}
    public function show(Request $request, int $id): JsonResponse
    {
        $idUser = $request->user()->id_user;

        $riwayat = RiwayatLayanan::with([
            'booking.hewan',
            'booking.layanans',
            'rincianLayanan.layanan',
            'rincianLayanan.obat',
            'rekamMedis.dokter',
            'pembayaran',
        ])
            ->whereHas('booking', fn($q) => $q->where('id_user', $idUser))
            ->findOrFail($id);

        return response()->json([
            'success' => true,
            'data'    => $this->fmt($riwayat, detail: true),
        ]);
    }

    // ── Format ────────────────────────────────────────────────────────────────

    private function fmt(RiwayatLayanan $r, bool $detail = false): array
    {
        $booking  = $r->booking;
        $hewan    = $booking?->hewan;
        $layanans = $booking?->layanans ?? collect();
        $bayar    = $r->pembayaran;
        $tanggal  = $r->tanggal ? \Carbon\Carbon::parse($r->tanggal) : null;

        $base = [
            'id_riwayat'       => $r->id_riwayat,
            'tanggal'          => $tanggal?->format('Y-m-d'),
            'tanggal_dd'       => $tanggal?->format('d'),
            'bulan'            => $tanggal?->translatedFormat('M Y'),
            'hari'             => $tanggal?->translatedFormat('l'),
            'jam'              => $booking?->jam ?? '-',
            'grand_total'      => (float) $r->grand_total,
            'status_bayar'     => $bayar?->status ?? 'menunggu',
            'catatan'          => $r->catatan,
            'no_booking'       => $booking?->no_booking,
            'no_antrian'       => $booking?->no_antrian,
            'status_booking'   => $booking?->status,
            'hewan' => $hewan ? [
                'id_hewan' => $hewan->id_hewan,
                'nama'     => $hewan->nama_hewan,
                'jenis'    => $hewan->jenis,
                'ras'      => $hewan->ras,
                'umur'     => $hewan->umur !== null ? $hewan->umur . ' Tahun' : '-',
                'berat'    => $hewan->berat !== null ? $hewan->berat . ' Kg' : '-',
                'foto'     => $hewan->foto ? asset('storage/' . $hewan->foto) : null,
            ] : null,
            // Array layanan — bisa lebih dari 1, per hewan terpisah
            'layanans' => $layanans->map(fn($l) => [
                'id_layanan'         => $l->id_layanan,
                'nama_layanan'       => $l->nama_layanan,
                'kategori'           => $l->kategori,
                'harga_saat_booking' => (float) $l->pivot->harga_saat_booking,
            ])->values(),
            // Untuk kolom "Layanan" di tabel riwayat (tampilkan yang pertama)
            'layanan_utama'    => $layanans->first()?->nama_layanan ?? '-',
            'layanan_kategori' => $layanans->first()?->kategori     ?? '-',
        ];

        if ($detail) {
            $rincians     = $r->rincianLayanan ?? collect();
            $totalObat    = $rincians->where('tipe', 'obat')->sum('subtotal');
            $totalLab     = $rincians->where('tipe', 'lab')->sum('subtotal');
            $totalLayanan = $layanans->sum(fn($l) => (float) $l->pivot->harga_saat_booking);

            $base['rincian'] = $rincians->map(fn($rc) => [
                'id_rincian'   => $rc->id_rincian,
                'tipe'         => $rc->tipe,
                'jumlah'       => $rc->jumlah,
                'harga_satuan' => (float) $rc->harga_satuan,
                'subtotal'     => (float) $rc->subtotal,
                'layanan'      => $rc->layanan
                    ? ['nama_layanan' => $rc->layanan->nama_layanan, 'kategori' => $rc->layanan->kategori]
                    : null,
                'obat' => $rc->obat
                    ? ['nama_obat' => $rc->obat->nama_obat, 'satuan' => $rc->obat->satuan]
                    : null,
            ])->values();

            $rekam = $r->rekamMedis;
            $base['rekam_medis'] = $rekam ? [
                'diagnosa'         => $rekam->diagnosa,
                'diagnosa_lengkap' => $rekam->diagnosa_lengkap,
                'catatan_dokter'   => $rekam->catatan_dokter,
                'dokter'           => $rekam->dokter
                    ? ['nama_dokter' => $rekam->dokter->nama_dokter, 'spesialisasi' => $rekam->dokter->spesialisasi]
                    : null,
            ] : null;

            $base['pembayaran'] = $bayar ? [
                'metode'       => $bayar->metode_pembayaran,
                'status'       => $bayar->status,
                'jumlah_bayar' => (float) $bayar->jumlah_bayar,
            ] : null;

            $base['total_breakdown'] = [
                'layanan'     => (float) $totalLayanan,
                'obat'        => (float) $totalObat,
                'lab'         => (float) $totalLab,
                'grand_total' => (float) $r->grand_total,
            ];

            $base['foto_before'] = $booking?->foto_before
                ? asset('storage/' . $booking->foto_before) : null;
            $base['foto_after']  = $booking?->foto_after
                ? asset('storage/' . $booking->foto_after)  : null;
        }

        return $base;
    }
}