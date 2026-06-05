<?php

namespace App\Http\Controllers;

use App\Models\Booking;
use App\Models\Layanan;
use App\Models\RiwayatLayanan;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class RiwayatLayananController extends Controller
{
    // =========================================================================
    // GET /api/riwayat
    // =========================================================================
    public function index(Request $request): JsonResponse
    {
        try {
            $idUser = $request->user()->id_user;

            $riwayat = RiwayatLayanan::with([
                'booking.hewan',
                'booking.layanans',
                'booking.jadwal.dokter',
                'booking.resep.pembayaran',
                'rekamMedis.dokter',
                'resep.details',
            ])
                ->whereHas('booking', fn($q) => $q
                    ->where('id_user', $idUser)
                    ->where('status', 'selesai') // ← hanya yang sudah selesai/lunas
                )
                ->orderBy('tanggal', 'desc')
                ->get()
                ->map(fn($r) => $this->fmt($r));

            return response()->json(['success' => true, 'data' => $riwayat]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
                'line'    => $e->getLine(),
                'file'    => basename($e->getFile()),
            ], 500);
        }
    }

    // =========================================================================
    // GET /api/riwayat/stats
    // =========================================================================
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

            $rows = RiwayatLayanan::with(['booking.layanans', 'resep.details'])
                ->whereHas('booking', fn($q) => $q
                    ->where('id_user', $idUser)
                    ->where('status', 'selesai') // ← hanya yang selesai
                )
                ->get();

            foreach ($rows as $r) {
                $resep = $r->resep ?? null;

                if ($resep && $resep->details->where('tipe', 'layanan')->count() > 0) {
                    $layananIds = $resep->details
                        ->where('tipe', 'layanan')
                        ->pluck('id_referensi')
                        ->filter()
                        ->unique();

                    $kategoris = Layanan::whereIn('id_layanan', $layananIds)
                        ->pluck('kategori')
                        ->unique();
                } else {
                    $kategoris = $r->booking?->layanans?->pluck('kategori')->unique() ?? collect();
                }

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

    // =========================================================================
    // GET /api/riwayat/{id}
    // =========================================================================
    public function show(Request $request, int $id): JsonResponse
    {
        try {
            $idUser = $request->user()->id_user;

            $riwayat = RiwayatLayanan::with([
                'booking.hewan',
                'booking.layanans',
                'booking.jadwal.dokter',
                'booking.resep.pembayaran',
                'rekamMedis.dokter',
                'resep.details',
            ])
                ->whereHas('booking', fn($q) => $q
                    ->where('id_user', $idUser)
                    ->where('status', 'selesai')
                )
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

    // =========================================================================
    // HELPERS
    // =========================================================================

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

    private function fmtLayananDariResep($resep, $kategoriMap = null): array
    {
        if (!$resep) return [];

        return collect($resep->details ?? [])
            ->where('tipe', 'layanan')
            ->map(fn($d) => [
                'id_layanan'         => $d->id_referensi,
                'nama_layanan'       => $d->nama_item,
                'kategori'           => $kategoriMap?->get($d->id_referensi) ?? 'Layanan',
                'harga_saat_booking' => (float) ($d->harga_satuan * $d->qty),
            ])
            ->values()
            ->toArray();
    }

    private function fmtObat($resep): array
    {
        if (!$resep) return [];

        return collect($resep->details ?? [])
            ->where('tipe', 'obat')
            ->map(fn($d) => [
                'nama_obat'    => $d->nama_item,
                'satuan'       => '-',
                'jumlah'       => (int) $d->qty,
                'harga_satuan' => (int) $d->harga_satuan,
                'subtotal'     => (int) $d->subtotal,
            ])
            ->values()
            ->toArray();
    }

    private function fmt(RiwayatLayanan $r, bool $detail = false): array
    {
        $booking    = $r->booking;
        $hewan      = $booking?->hewan;
        $layanans   = $booking?->layanans ?? collect();
        $tanggal    = $r->tanggal ? \Carbon\Carbon::parse($r->tanggal) : null;
        $rekam      = $r->rekamMedis ?? null;
        $resep      = $r->resep ?? null;
        $pembayaran = $booking?->resep?->pembayaran ?? null;

        // ── Dokter ───────────────────────────────────────────────────────────
        $dokterDariJadwal = $booking ? $this->getDokterDariJadwal($booking) : null;
        $dokterFinal = ($rekam?->dokter)
            ? [
                'nama_dokter'  => $rekam->dokter->nama_dokter,
                'spesialisasi' => $rekam->dokter->spesialisasi ?? '-',
              ]
            : $dokterDariJadwal;

        // ── Kategori layanan dari resep ──────────────────────────────────────
        $layananIds = collect($resep?->details ?? [])
            ->where('tipe', 'layanan')
            ->pluck('id_referensi')
            ->filter()
            ->unique();

        $kategoriMap = $layananIds->isNotEmpty()
            ? Layanan::whereIn('id_layanan', $layananIds)->pluck('kategori', 'id_layanan')
            : collect();

        // ── Layanan ──────────────────────────────────────────────────────────
        $layananDariResep = $this->fmtLayananDariResep($resep, $kategoriMap);
        $adaLayananResep  = count($layananDariResep) > 0;

        $layanansOutput = $adaLayananResep
            ? collect($layananDariResep)
            : $layanans->map(fn($l) => [
                'id_layanan'         => $l->id_layanan,
                'nama_layanan'       => $l->nama_layanan,
                'kategori'           => $l->kategori,
                'harga_saat_booking' => (float) $l->pivot->harga_saat_booking,
            ]);

        // ── Grand total langsung dari tabel (sudah diisi saat lunas) ─────────
        $grandTotalFinal = (float) $r->grand_total;

        $base = [
            'id_riwayat'          => $r->id_riwayat,
            'tanggal'             => $tanggal?->format('Y-m-d'),
            'tanggal_dd'          => $tanggal?->format('d'),
            'bulan'               => $tanggal?->translatedFormat('M Y'),
            'hari'                => $tanggal?->translatedFormat('l'),
            'jam'                 => $booking?->jam ?? '-',
            'grand_total'         => $grandTotalFinal,
            'status_bayar'        => $pembayaran?->status ?? 'lunas',
            'metode_bayar'        => $pembayaran?->metode ?? null,
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

            'layanans'         => $layanansOutput->values(),
            'layanan_utama'    => $layanansOutput->first()['nama_layanan']
                                    ?? $layanans->first()?->nama_layanan ?? '-',
            'layanan_kategori' => $layanansOutput->first()['kategori']
                                    ?? $layanans->first()?->kategori ?? '-',

            'rekam_medis' => $rekam ? [
                'diagnosa'         => $rekam->diagnosa,
                'diagnosa_lengkap' => $rekam->diagnosa_lengkap,
                'catatan_dokter'   => $rekam->catatan_dokter,
                'dokter'           => $dokterFinal,
                'tindakanList'     => collect($rekam->tindakan ?? [])
                    ->map(fn($t, $i) => [
                        'id'         => $i,
                        'penanganan' => $t['penanganan'] ?? '-',
                        'durasi'     => $t['durasi'] ?? '-',
                    ])
                    ->values()
                    ->toArray(),
            ] : null,

            'obat' => $this->fmtObat($resep),
        ];

        if ($detail) {
            $base['foto_before'] = $booking?->foto_before
                ? asset('storage/' . $booking->foto_before) : null;
            $base['foto_after']  = $booking?->foto_after
                ? asset('storage/' . $booking->foto_after) : null;
        }

        return $base;
    }
}