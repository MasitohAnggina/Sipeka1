<?php

namespace App\Http\Controllers;

use App\Models\Dokter;
use App\Models\Booking;
use App\Models\Layanan;
use App\Models\Obat;
use App\Models\Resep;
use App\Models\DetailResep;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DokterLayananObatController extends Controller
{
    // ── Ambil semua layanan ───────────────────────────────────────────────
    public function indexLayanan(): JsonResponse
    {
        $layanan = Layanan::all()->map(fn($l) => [
            'id'           => $l->id_layanan,
            'nama'         => $l->nama_layanan,
            'kategori'     => $l->kategori,
            'sub_kategori' => $l->sub_kategori ?? null,
            'durasi'       => $l->durasi       ?? null,
            'harga'        => (int) $l->harga,
            'deskripsi'    => $l->deskripsi    ?? '',
            'tersedia'     => (bool) ($l->tersedia ?? true),
            'catatan'      => $l->catatan      ?? null,
        ]);

        return response()->json(['success' => true, 'data' => $layanan]);
    }

    // ── Ambil semua obat ──────────────────────────────────────────────────
    public function indexObat(): JsonResponse
    {
        $obat = Obat::all()->map(fn($o) => [
            'id'        => $o->id_obat,
            'nama'      => $o->nama_obat,
            'kategori'  => $o->kategori,
            'satuan'    => $o->satuan,
            'harga'     => (int) $o->harga,
            'stok'      => (int) $o->stok,
            'min_stok'  => (int) $o->min_stok,
            'deskripsi' => $o->deskripsi ?? '',
        ]);

        return response()->json(['success' => true, 'data' => $obat]);
    }

    // ── Ambil pemilik & hewan dari booking selesai milik dokter yang login ─
    public function indexPemilik(Request $request): JsonResponse
    {
        try {
            $dokter = Dokter::where('id_user', $request->user()->id_user)->first();

            if (!$dokter) {
                return response()->json([
                    'success' => false,
                    'message' => 'Data dokter tidak ditemukan',
                ], 404);
            }

            $bookings = Booking::with(['hewan.user'])
                ->whereHas('jadwal', fn($q) => $q->where('id_dokter', $dokter->id_dokter))
                ->where('status', 'selesai')
                ->orderBy('id_booking', 'desc')
                ->get();

            // Ambil semua id_booking yang sudah punya resep sekaligus
            $bookingIds     = $bookings->pluck('id_booking')->toArray();
            $resepByBooking = Resep::whereIn('id_booking', $bookingIds)
                ->pluck('id_resep', 'id_booking'); // key=id_booking, value=id_resep

            $pemilikMap = [];

            foreach ($bookings as $booking) {
                if (!$booking->hewan || !$booking->hewan->user) continue;

                $user    = $booking->hewan->user;
                $hewan   = $booking->hewan;
                $idUser  = $user->id_user;
                $idHewan = $hewan->id_hewan;

                if (!isset($pemilikMap[$idUser])) {
                    $pemilikMap[$idUser] = [
                        'id'    => $idUser,
                        'nama'  => $user->nama,
                        'no_hp' => $user->no_hp,
                        'email' => $user->email,
                        'hewan' => [],
                    ];
                }

                $hewanSudahAda = collect($pemilikMap[$idUser]['hewan'])
                    ->contains(fn($h) => $h['id_hewan'] === $idHewan);

                if (!$hewanSudahAda) {
                    $idBooking = $booking->id_booking;
                    $idResep   = $resepByBooking[$idBooking] ?? null;

                    $pemilikMap[$idUser]['hewan'][] = [
                        'id_hewan'   => $idHewan,
                        'id_booking' => $idBooking,
                        'nama_hewan' => $hewan->nama_hewan,
                        'jenis'      => $hewan->jenis,
                        'ras'        => $hewan->ras   ?? '-',
                        'berat'      => $hewan->berat ?? '-',
                        'usia'       => $hewan->umur  ?? '-',
                        'foto'       => $hewan->foto
                            ? asset('storage/' . $hewan->foto)
                            : null,
                        'id_resep'   => $idResep,
                        'has_resep'  => $idResep !== null,
                    ];
                }
            }

            return response()->json([
                'success' => true,
                'data'    => array_values($pemilikMap),
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    // ── Cek apakah booking sudah punya resep ─────────────────────────────
    public function cekResep(int $idBooking): JsonResponse
    {
        $resep = Resep::where('id_booking', $idBooking)->first();

        if (!$resep) {
            return response()->json(['success' => true, 'has_resep' => false]);
        }

        return response()->json([
            'success'   => true,
            'has_resep' => true,
            'id_resep'  => $resep->id_resep,
        ]);
    }

    // ── Ambil detail resep by ID ──────────────────────────────────────────
    public function getResep(int $id): JsonResponse
    {
        $resep = Resep::with(['details', 'hewan.user'])->find($id);

        if (!$resep) {
            return response()->json(['success' => false, 'message' => 'Resep tidak ditemukan'], 404);
        }

        return response()->json([
            'success' => true,
            'data'    => [
                'id_resep'    => $resep->id_resep,
                'catatan'     => $resep->catatan,
                'grand_total' => $resep->grand_total,
                'details'     => $resep->details->map(fn($d) => [
                    'tipe'         => $d->tipe,
                    'id_referensi' => $d->id_referensi,
                    'nama_item'    => $d->nama_item,
                    'harga_satuan' => (int) $d->harga_satuan,
                    'qty'          => (int) $d->qty,
                    'subtotal'     => (int) $d->subtotal,
                ]),
                'hewan' => $resep->hewan ? [
                    'id_hewan'   => $resep->hewan->id_hewan,
                    'id_booking' => $resep->id_booking,
                    'nama_hewan' => $resep->hewan->nama_hewan,
                    'jenis'      => $resep->hewan->jenis,
                    'ras'        => $resep->hewan->ras   ?? '-',
                    'berat'      => $resep->hewan->berat ?? '-',
                    'usia'       => $resep->hewan->umur  ?? '-',
                    'foto'       => $resep->hewan->foto
                        ? asset('storage/' . $resep->hewan->foto)
                        : null,
                ] : null,
                'pemilik' => $resep->hewan?->user ? [
                    'id'    => $resep->hewan->user->id_user,
                    'nama'  => $resep->hewan->user->nama,
                    'no_hp' => $resep->hewan->user->no_hp,
                    'email' => $resep->hewan->user->email,
                ] : null,
            ],
        ]);
    }

    // ── Simpan resep (layanan + obat) ─────────────────────────────────────
    public function simpanResep(Request $request): JsonResponse
    {
        try {
            $dokter = Dokter::where('id_user', $request->user()->id_user)->first();

            if (!$dokter) {
                return response()->json([
                    'success' => false,
                    'message' => 'Data dokter tidak ditemukan',
                ], 404);
            }

            $validated = $request->validate([
                'id_booking'           => 'required|integer|exists:booking,id_booking',
                'id_hewan'             => 'required|integer|exists:hewan,id_hewan',
                'id_user'              => 'required|integer|exists:users,id_user',
                'catatan'              => 'nullable|string',
                'grand_total'          => 'required|integer',
                'items'                => 'required|array|min:1',
                'items.*.tipe'         => 'required|in:layanan,obat',
                'items.*.id_referensi' => 'required|integer',
                'items.*.nama_item'    => 'required|string',
                'items.*.harga_satuan' => 'required|integer',
                'items.*.qty'          => 'required|integer|min:1',
                'items.*.subtotal'     => 'required|integer',
            ]);

            // ── Cegah duplikat resep untuk booking yang sama ──────────────
            $existing = Resep::where('id_booking', $validated['id_booking'])->first();
            if ($existing) {
                return response()->json([
                    'success'  => false,
                    'message'  => 'Booking ini sudah memiliki resep.',
                    'id_resep' => $existing->id_resep,
                ], 422);
            }

            $resep = Resep::create([
                'id_booking'  => $validated['id_booking'],
                'id_dokter'   => $dokter->id_dokter,
                'id_hewan'    => $validated['id_hewan'],
                'id_user'     => $validated['id_user'],
                'catatan'     => $validated['catatan'] ?? null,
                'grand_total' => $validated['grand_total'],
            ]);

            foreach ($validated['items'] as $item) {
                DetailResep::create([
                    'id_resep'     => $resep->id_resep,
                    'tipe'         => $item['tipe'],
                    'id_referensi' => $item['id_referensi'],
                    'nama_item'    => $item['nama_item'],
                    'harga_satuan' => $item['harga_satuan'],
                    'qty'          => $item['qty'],
                    'subtotal'     => $item['subtotal'],
                ]);
            }

            return response()->json([
                'success'  => true,
                'id_resep' => $resep->id_resep,
                'message'  => 'Resep berhasil disimpan',
            ]);

        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 500);
        }
    }
}