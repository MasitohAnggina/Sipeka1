<?php

namespace App\Http\Controllers;

use App\Models\Booking;
use App\Models\RiwayatLayanan;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class RiwayatLayananController extends Controller
{
    // GET /api/riwayat
    public function index(Request $request): JsonResponse
    {
        try {
            $idUser = $request->user()->id_user;

            $riwayat = RiwayatLayanan::with([
                'booking.hewan',
                'booking.layanans',
                'booking.jadwal.dokter',
                'rekamMedis.dokter',
            ])
                ->whereHas('booking', fn($q) => $q->where('id_user', $idUser))
                ->orderBy('tanggal', 'desc')
                ->get()
                ->map(fn($r) => $this->fmt($r));

            $bookingIdsWithRiwayat = RiwayatLayanan::whereHas(
                'booking', fn($q) => $q->where('id_user', $idUser)
            )->pluck('id_booking');

            $bookingTanpaRiwayat = Booking::with([
                'hewan',
                'layanans',
                'jadwal.dokter',
            ])
                ->where('id_user', $idUser)
                ->where('status', 'selesai')
                ->whereNotIn('id_booking', $bookingIdsWithRiwayat)
                ->orderBy('tanggal_booking', 'desc')
                ->get()
                ->map(fn($b) => $this->fmtFromBooking($b));

            $merged = collect($riwayat)
                ->merge(collect($bookingTanpaRiwayat))
                ->sortByDesc('tanggal')
                ->values();

            return response()->json(['success' => true, 'data' => $merged]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
                'line'    => $e->getLine(),
                'file'    => basename($e->getFile()),
            ], 500);
        }
    }

    // GET /api/riwayat/stats
    public function stats(Request $request): JsonResponse
    {
        try {
            $idUser = $request->user()->id_user;

            $stats = [
                'total'      => 0,
                'Medis'      => 0,
                'Bedah'      => 0,
                'Grooming'   => 0,
                'Rawat Inap' => 0,
                'Lainnya'    => 0,
            ];

            $rows = RiwayatLayanan::with('booking.layanans')
                ->whereHas('booking', fn($q) => $q->where('id_user', $idUser))
                ->get();

            foreach ($rows as $r) {
                $kategoris = $r->booking?->layanans?->pluck('kategori')->unique() ?? collect();
                foreach ($kategoris as $kat) {
                    $key = array_key_exists($kat, $stats) ? $kat : 'Lainnya';
                    $stats[$key]++;
                }
                $stats['total']++;
            }

            $bookingIdsWithRiwayat = RiwayatLayanan::whereHas(
                'booking', fn($q) => $q->where('id_user', $idUser)
            )->pluck('id_booking');

            $bookingTanpaRiwayat = Booking::with('layanans')
                ->where('id_user', $idUser)
                ->where('status', 'selesai')
                ->whereNotIn('id_booking', $bookingIdsWithRiwayat)
                ->get();

            foreach ($bookingTanpaRiwayat as $b) {
                $kategoris = $b->layanans?->pluck('kategori')->unique() ?? collect();
                foreach ($kategoris as $kat) {
                    $key = array_key_exists($kat, $stats) ? $kat : 'Lainnya';
                    $stats[$key]++;
                }
                $stats['total']++;
            }

            return response()->json(['success' => true, 'data' => $stats]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
                'line'    => $e->getLine(),
                'file'    => basename($e->getFile()),
            ], 500);
        }
    }

    // GET /api/riwayat/{id}
    public function show(Request $request, int $id): JsonResponse
    {
        try {
            $idUser = $request->user()->id_user;

            $riwayat = RiwayatLayanan::with([
                'booking.hewan',
                'booking.layanans',
                'booking.jadwal.dokter',
                'rincianLayanan.layanan',
                'rincianLayanan.obat',
                'rekamMedis.dokter',
            ])
                ->whereHas('booking', fn($q) => $q->where('id_user', $idUser))
                ->findOrFail($id);

            return response()->json([
                'success' => true,
                'data'    => $this->fmt($riwayat, detail: true),
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
                'line'    => $e->getLine(),
                'file'    => basename($e->getFile()),
            ], 500);
        }
    }

    // ── Helper ────────────────────────────────────────────────────────────────

    private function getDokterDariJadwal(Booking $booking): ?array
    {
        $jadwal = $booking->jadwal;
        if (!$jadwal) return null;

        if ($jadwal->dokter) {
            return [
                'nama_dokter'  => $jadwal->dokter->nama_dokter,
                'spesialisasi' => $jadwal->dokter->spesialisasi ?? '-',
            ];
        }

        if (!empty($jadwal->nama_dokter)) {
            return [
                'nama_dokter'  => $jadwal->nama_dokter,
                'spesialisasi' => $jadwal->spesialisasi ?? '-',
            ];
        }

        return null;
    }

    // ── Format dari RiwayatLayanan ────────────────────────────────────────────

    private function fmt(RiwayatLayanan $r, bool $detail = false): array
    {
        $booking  = $r->booking;
        $hewan    = $booking?->hewan;
        $layanans = $booking?->layanans ?? collect();
        $bayar    = null; // ✅ sementara null sampai model Pembayaran siap
        $tanggal  = $r->tanggal ? \Carbon\Carbon::parse($r->tanggal) : null;
        $rekam    = $r->rekamMedis ?? null;

        $dokterDariJadwal = $booking ? $this->getDokterDariJadwal($booking) : null;
        $dokterFinal = ($rekam?->dokter)
            ? ['nama_dokter' => $rekam->dokter->nama_dokter, 'spesialisasi' => $rekam->dokter->spesialisasi ?? '-']
            : $dokterDariJadwal;

        $base = [
            'id_riwayat'          => $r->id_riwayat,
            'tanggal'             => $tanggal?->format('Y-m-d'),
            'tanggal_dd'          => $tanggal?->format('d'),
            'bulan'               => $tanggal?->translatedFormat('M Y'),
            'hari'                => $tanggal?->translatedFormat('l'),
            'jam'                 => $booking?->jam ?? '-',
            'grand_total'         => (float) $r->grand_total,
            'status_bayar'        => $bayar?->status ?? 'menunggu', // ✅ aman, $bayar null
            'catatan'             => $r->catatan,
            'no_booking'          => $booking?->no_booking,
            'no_antrian'          => $booking?->no_antrian,
            'status_booking'      => $booking?->status,
            'nama_dokter'         => $dokterFinal['nama_dokter'] ?? '-',
            'spesialisasi_dokter' => $dokterFinal['spesialisasi'] ?? '-',
            'hewan' => $hewan ? [
                'id_hewan' => $hewan->id_hewan,
                'nama'     => $hewan->nama_hewan,
                'jenis'    => $hewan->jenis,
                'ras'      => $hewan->ras,
                'umur'     => $hewan->umur !== null ? $hewan->umur . ' Tahun' : '-',
                'berat'    => $hewan->berat !== null ? $hewan->berat . ' Kg' : '-',
                'foto'     => $hewan->foto ? asset('storage/' . $hewan->foto) : null,
            ] : null,
            'layanans' => $layanans->map(fn($l) => [
                'id_layanan'         => $l->id_layanan,
                'nama_layanan'       => $l->nama_layanan,
                'kategori'           => $l->kategori,
                'harga_saat_booking' => (float) $l->pivot->harga_saat_booking,
            ])->values(),
            'layanan_utama'    => $layanans->first()?->nama_layanan ?? '-',
            'layanan_kategori' => $layanans->first()?->kategori ?? '-',
            'rekam_medis' => $rekam ? [
                'diagnosa'         => $rekam->diagnosa,
                'diagnosa_lengkap' => $rekam->diagnosa_lengkap,
                'catatan_dokter'   => $rekam->catatan_dokter,
                'dokter'           => $dokterFinal,
                'tindakanList'     => collect($rekam->tindakan ?? [])->map(fn($t, $i) => [
                    'id'         => $i,
                    'penanganan' => $t['penanganan'] ?? '-',
                    'durasi'     => $t['durasi'] ?? '-',
                ])->values()->toArray(),
            ] : null,
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

            $base['rekam_medis'] = $rekam ? [
                'diagnosa'         => $rekam->diagnosa,
                'diagnosa_lengkap' => $rekam->diagnosa_lengkap,
                'catatan_dokter'   => $rekam->catatan_dokter,
                'dokter'           => $dokterFinal,
                'tindakanList'     => collect($rekam->tindakan ?? [])->map(fn($t, $i) => [
                    'id'         => $i,
                    'penanganan' => $t['penanganan'] ?? '-',
                    'durasi'     => $t['durasi'] ?? '-',
                ])->values()->toArray(),
            ] : null;

            $base['pembayaran'] = null; // ✅ sementara null sampai model Pembayaran siap

            $base['total_breakdown'] = [
                'layanan'     => (float) $totalLayanan,
                'obat'        => (float) $totalObat,
                'lab'         => (float) $totalLab,
                'grand_total' => (float) $r->grand_total,
            ];

            $base['foto_before'] = $booking?->foto_before
                ? asset('storage/' . $booking->foto_before) : null;
            $base['foto_after']  = $booking?->foto_after
                ? asset('storage/' . $booking->foto_after) : null;
        }

        return $base;
    }

    // ── Format dari Booking langsung ─────────────────────────────────────────

    private function fmtFromBooking(Booking $b): array
    {
        $hewan      = $b->hewan;
        $layanans   = $b->layanans ?? collect();
        $tanggal    = $b->tanggal_booking ? \Carbon\Carbon::parse($b->tanggal_booking) : null;
        $grandTotal = $layanans->sum(fn($l) => (float) $l->pivot->harga_saat_booking);

        $dokterDariJadwal = $this->getDokterDariJadwal($b);

        return [
            'id_riwayat'          => -$b->id_booking,
            'tanggal'             => $tanggal?->format('Y-m-d'),
            'tanggal_dd'          => $tanggal?->format('d'),
            'bulan'               => $tanggal?->translatedFormat('M Y'),
            'hari'                => $tanggal?->translatedFormat('l'),
            'jam'                 => $b->jam ?? '-',
            'grand_total'         => $grandTotal,
            'status_bayar'        => 'menunggu',
            'catatan'             => null,
            'no_booking'          => $b->no_booking,
            'no_antrian'          => $b->no_antrian,
            'status_booking'      => $b->status,
            'nama_dokter'         => $dokterDariJadwal['nama_dokter'] ?? '-',
            'spesialisasi_dokter' => $dokterDariJadwal['spesialisasi'] ?? '-',
            'hewan' => $hewan ? [
                'id_hewan' => $hewan->id_hewan,
                'nama'     => $hewan->nama_hewan,
                'jenis'    => $hewan->jenis,
                'ras'      => $hewan->ras,
                'umur'     => $hewan->umur !== null ? $hewan->umur . ' Tahun' : '-',
                'berat'    => $hewan->berat !== null ? $hewan->berat . ' Kg' : '-',
                'foto'     => $hewan->foto ? asset('storage/' . $hewan->foto) : null,
            ] : null,
            'layanans' => $layanans->map(fn($l) => [
                'id_layanan'         => $l->id_layanan,
                'nama_layanan'       => $l->nama_layanan,
                'kategori'           => $l->kategori,
                'harga_saat_booking' => (float) $l->pivot->harga_saat_booking,
            ])->values(),
            'layanan_utama'    => $layanans->first()?->nama_layanan ?? '-',
            'layanan_kategori' => $layanans->first()?->kategori ?? '-',
            'rekam_medis'      => null,
        ];
    }
}