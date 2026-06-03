<?php

namespace App\Http\Controllers\Owner;

use App\Http\Controllers\Controller;
use App\Models\Pembayaran;
use App\Models\Resep;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;

class InvoiceController extends Controller
{
    /**
     * GET /api/owner/invoice
     *
     * Kembalikan semua resep milik owner yang sedang login,
     * di-group per hewan, lengkap dengan status pembayaran.
     *
     * Contoh response:
     * {
     *   "success": true,
     *   "data": [
     *     {
     *       "id_hewan": 1,
     *       "nama_hewan": "Milo",
     *       "jenis": "Kucing",
     *       "ras": "Persia",
     *       "foto": null,
     *       "invoices": [
     *         {
     *           "id_resep": 10,
     *           "id_booking": 5,
     *           "tanggal": "2024-04-30T08:00:00.000000Z",
     *           "catatan": "Kontrol ulang 3 hari",
     *           "grand_total": 250000,
     *           "pembayaran": {
     *             "id_pembayaran": 3,
     *             "status": "menunggu_pembayaran",
     *             "metode": null
     *           },
     *           "details": [...]
     *         }
     *       ]
     *     }
     *   ]
     * }
     */
    public function index(): JsonResponse
    {
        $idUser = Auth::id();   // id owner dari token

        // Ambil semua resep milik owner ini, eager-load semua relasi sekaligus
        $reseps = Resep::with([
            'hewan',
            'details',
            'pembayaran',
        ])
            ->where('id_user', $idUser)
            ->orderByDesc('created_at')
            ->get();

        // Group per hewan
        $grouped = $reseps->groupBy('id_hewan')->map(function ($resepGroup) {
            $hewan = $resepGroup->first()->hewan;

            return [
                'id_hewan'   => $hewan->id_hewan,
                'nama_hewan' => $hewan->nama_hewan,
                'jenis'      => $hewan->jenis,
                'ras'        => $hewan->ras,
                'foto'       => $hewan->foto
                    ? asset('storage/' . $hewan->foto)
                    : null,

                'invoices' => $resepGroup->map(function (Resep $resep) {

                    // Jika belum ada record pembayaran, buat otomatis
                    $pembayaran = $resep->pembayaran ?? Pembayaran::firstOrCreate(
                        ['id_resep' => $resep->id_resep],
                        [
                            'id_user' => $resep->id_user,
                            'jumlah'  => $resep->grand_total,
                            'status'  => 'menunggu_pembayaran',
                        ]
                    );

                    return [
                        'id_resep'    => $resep->id_resep,
                        'id_booking'  => $resep->id_booking,
                        'tanggal'     => $resep->created_at,
                        'catatan'     => $resep->catatan,
                        'grand_total' => $resep->grand_total,

                        'pembayaran' => [
                            'id_pembayaran' => $pembayaran->id_pembayaran,
                            'status'        => $pembayaran->status,
                            'metode'        => $pembayaran->metode,
                            'snap_token'    => $pembayaran->status === 'pending_midtrans'
                                ? $pembayaran->snap_token
                                : null,
                        ],

                        'details' => $resep->details->map(fn($d) => [
                            'id_detail'    => $d->id_detail,
                            'tipe'         => $d->tipe,
                            'nama_item'    => $d->nama_item,
                            'harga_satuan' => $d->harga_satuan,
                            'qty'          => $d->qty,
                            'subtotal'     => $d->subtotal,
                        ]),
                    ];
                })->values(),
            ];
        })->values();

        return response()->json([
            'success' => true,
            'data'    => $grouped,
        ]);
    }

    /**
     * GET /api/owner/invoice/{id_resep}
     *
     * Detail satu invoice — ditampilkan di halaman sebelum bayar.
     */
    public function show(int $idResep): JsonResponse
    {
        $idUser = Auth::id();

        $resep = Resep::with(['hewan', 'details', 'pembayaran'])
            ->where('id_resep', $idResep)
            ->where('id_user', $idUser)   // pastikan milik owner ini
            ->firstOrFail();

        // Auto-create record pembayaran jika belum ada
        $pembayaran = $resep->pembayaran ?? Pembayaran::firstOrCreate(
            ['id_resep' => $resep->id_resep],
            [
                'id_user' => $resep->id_user,
                'jumlah'  => $resep->grand_total,
                'status'  => 'menunggu_pembayaran',
            ]
        );

        return response()->json([
            'success' => true,
            'data'    => [
                'id_resep'    => $resep->id_resep,
                'id_booking'  => $resep->id_booking,
                'tanggal'     => $resep->created_at,
                'catatan'     => $resep->catatan,
                'grand_total' => $resep->grand_total,

                'hewan' => [
                    'id_hewan'   => $resep->hewan->id_hewan,
                    'nama_hewan' => $resep->hewan->nama_hewan,
                    'jenis'      => $resep->hewan->jenis,
                    'ras'        => $resep->hewan->ras,
                    'foto'       => $resep->hewan->foto
                        ? asset('storage/' . $resep->hewan->foto)
                        : null,
                ],

                'pembayaran' => [
                    'id_pembayaran' => $pembayaran->id_pembayaran,
                    'status'        => $pembayaran->status,
                    'metode'        => $pembayaran->metode,
                    // Snap token hanya dikembalikan jika masih pending Midtrans
                    'snap_token'    => $pembayaran->status === 'pending_midtrans'
                        ? $pembayaran->snap_token
                        : null,
                ],

                'details' => $resep->details->map(fn($d) => [
                    'id_detail'    => $d->id_detail,
                    'tipe'         => $d->tipe,
                    'nama_item'    => $d->nama_item,
                    'harga_satuan' => $d->harga_satuan,
                    'qty'          => $d->qty,
                    'subtotal'     => $d->subtotal,
                ]),
            ],
        ]);
    }
}
