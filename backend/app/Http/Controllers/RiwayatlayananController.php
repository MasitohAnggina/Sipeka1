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
                'rekamMedis.dokter',
                'resep.details',
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
                ->whereHas('booking', fn($q) => $q->where('id_user', $idUser))
                ->get();

            foreach ($rows as $r) {
                // Ambil kategori dari resep jika ada, fallback ke booking
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
                'rekamMedis.dokter',
                'resep.details',
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

    // =========================================================================
    // HELPERS
    // =========================================================================

    /**
     * Ambil info dokter dari jadwal booking.
     */
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

    /**
     * Ambil layanan aktual dari resep (tipe = 'layanan').
     * Kategori diambil dari tabel layanan via $kategoriMap.
     */
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

    /**
     * Ambil obat dari resep (tipe = 'obat').
     */
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

    /**
     * Format data dari model RiwayatLayanan.
     */
    private function fmt(RiwayatLayanan $r, bool $detail = false): array
    {
        $booking  = $r->booking;
        $hewan    = $booking?->hewan;
        $layanans = $booking?->layanans ?? collect();
        $tanggal  = $r->tanggal ? \Carbon\Carbon::parse($r->tanggal) : null;
        $rekam    = $r->rekamMedis ?? null;
        $resep    = $r->resep ?? null;

        // ── Dokter ───────────────────────────────────────────────────────────
        $dokterDariJadwal = $booking ? $this->getDokterDariJadwal($booking) : null;
        $dokterFinal = ($rekam?->dokter)
            ? [
                'nama_dokter'  => $rekam->dokter->nama_dokter,
                'spesialisasi' => $rekam->dokter->spesialisasi ?? '-',
              ]
            : $dokterDariJadwal;

        // ── Pre-load kategori layanan dari resep (hindari N+1) ───────────────
        $layananIds = collect($resep?->details ?? [])
            ->where('tipe', 'layanan')
            ->pluck('id_referensi')
            ->filter()
            ->unique();

        $kategoriMap = $layananIds->isNotEmpty()
            ? Layanan::whereIn('id_layanan', $layananIds)
                ->pluck('kategori', 'id_layanan')
            : collect();

        // ── Layanan: gunakan data aktual dari resep jika ada ─────────────────
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

        // ── Grand total: hitung ulang dari layanan aktual + obat ─────────────
        $totalLayanan = $adaLayananResep
            ? collect($layananDariResep)->sum('harga_saat_booking')
            : $layanans->sum(fn($l) => (float) $l->pivot->harga_saat_booking);

        $totalObat = collect($resep?->details ?? [])
            ->where('tipe', 'obat')
            ->sum(fn($d) => (float) $d->subtotal);

        $grandTotalFinal = $totalLayanan + $totalObat;

        $base = [
            'id_riwayat'          => $r->id_riwayat,
            'tanggal'             => $tanggal?->format('Y-m-d'),
            'tanggal_dd'          => $tanggal?->format('d'),
            'bulan'               => $tanggal?->translatedFormat('M Y'),
            'hari'                => $tanggal?->translatedFormat('l'),
            'jam'                 => $booking?->jam ?? '-',
            'grand_total'         => $grandTotalFinal,
            'status_bayar'        => 'menunggu',
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

            // Layanan aktual dari resep (jika ada), fallback ke booking
            'layanans' => $layanansOutput->values(),

            'layanan_utama'    => $layanansOutput->first()['nama_layanan']
                                    ?? $layanans->first()?->nama_layanan
                                    ?? '-',
            'layanan_kategori' => $layanansOutput->first()['kategori']
                                    ?? $layanans->first()?->kategori
                                    ?? '-',

            // ── Rekam Medis ───────────────────────────────────────────────
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

            // ── Obat dari resep ───────────────────────────────────────────
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

    /**
     * Format data langsung dari Booking (tanpa RiwayatLayanan).
     * id_riwayat dibuat negatif agar frontend tahu ini bukan dari tabel riwayat.
     */
    private function fmtFromBooking(Booking $b): array
    {
        $hewan      = $b->hewan;
        $layanans   = $b->layanans ?? collect();
        $tanggal    = $b->tanggal_booking
            ? \Carbon\Carbon::parse($b->tanggal_booking) : null;
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
            'obat'             => [],
        ];
    }
}