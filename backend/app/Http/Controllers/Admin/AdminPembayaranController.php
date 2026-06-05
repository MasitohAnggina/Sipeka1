<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Pembayaran;
use App\Models\RiwayatLayanan;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class AdminPembayaranController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Pembayaran::with([
                'resep.hewan',
                'resep.details',
                'user',
                'dikonfirmasiOleh',
            ])
            ->orderByDesc('created_at');

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }
        if ($request->filled('metode')) {
            $query->where('metode', $request->metode);
        }

        $list = $query->get()->map(fn (Pembayaran $p) => $this->formatPembayaran($p));

        return response()->json([
            'success' => true,
            'data'    => $list,
        ]);
    }

    public function konfirmasiCash(Request $request, int $id): JsonResponse
    {
        $request->validate([
            'catatan_admin' => 'nullable|string|max:500',
            'no_referensi'  => 'nullable|string|max:100',
        ]);

        $pembayaran = Pembayaran::findOrFail($id);

        if ($pembayaran->status !== 'pending_cash') {
            return response()->json([
                'success' => false,
                'message' => 'Hanya pembayaran dengan status pending_cash yang bisa dikonfirmasi.',
            ], 422);
        }

        $pembayaran->update([
            'status'            => 'lunas',
            'dikonfirmasi_oleh' => Auth::id(),
            'dikonfirmasi_at'   => now(),
            'catatan_admin'     => $request->catatan_admin,
            'no_referensi'      => $request->no_referensi,
        ]);

        // ── Buat RiwayatLayanan otomatis setelah lunas ────────────────────
        $resep = $pembayaran->resep;
        if ($resep) {
            RiwayatLayanan::updateOrCreate(
    ['id_booking' => $resep->id_booking],
    [
        'tanggal'     => now()->toDateString(),
        'grand_total' => $resep->grand_total ?? 0,
        'catatan'     => null,
    ]
);
            // Update status booking jadi selesai
            $resep->booking?->update(['status' => 'selesai']);
        }
        // ─────────────────────────────────────────────────────────────────

        $pembayaran->load(['resep.hewan', 'resep.details', 'user', 'dikonfirmasiOleh']);

        return response()->json([
            'success' => true,
            'message' => 'Pembayaran berhasil dikonfirmasi.',
            'data'    => $this->formatPembayaran($pembayaran),
        ]);
    }

    public function show(int $id): JsonResponse
    {
        $pembayaran = Pembayaran::with([
                'resep.hewan',
                'resep.details',
                'user',
                'dikonfirmasiOleh',
            ])->findOrFail($id);

        return response()->json([
            'success' => true,
            'data'    => $this->formatPembayaran($pembayaran),
        ]);
    }

    private function formatPembayaran(Pembayaran $p): array
    {
        $resep = $p->resep;
        $hewan = $resep?->hewan;
        $user  = $p->user;

        return [
            'id_pembayaran'           => $p->id_pembayaran,
            'id_resep'                => $p->id_resep,
            'jumlah'                  => $p->jumlah,
            'metode'                  => $p->metode,
            'status'                  => $p->status,
            'no_referensi'            => $p->no_referensi,
            'catatan_admin'           => $p->catatan_admin,
            'midtrans_payment_type'   => $p->midtrans_payment_type,
            'dikonfirmasi_at'         => $p->dikonfirmasi_at,
            'dikonfirmasi_oleh_nama'  => $p->dikonfirmasiOleh?->name,
            'created_at'              => $p->created_at,

            'pemilik' => [
                'id'    => $user?->id_user,
                'nama'  => $user?->nama,
                'no_hp' => $user?->no_hp,
                'email' => $user?->email,
            ],

            'hewan' => [
                'id_hewan'   => $hewan?->id_hewan,
                'nama_hewan' => $hewan?->nama_hewan,
                'jenis'      => $hewan?->jenis,
                'ras'        => $hewan?->ras,
                'foto'       => $hewan?->foto ? asset('storage/' . $hewan->foto) : null,
            ],

            'grand_total' => $resep?->grand_total,

            'details' => $resep?->details->map(fn ($d) => [
                'tipe'         => $d->tipe,
                'nama_item'    => $d->nama_item,
                'harga_satuan' => $d->harga_satuan,
                'qty'          => $d->qty,
                'subtotal'     => $d->subtotal,
            ]) ?? [],
        ];
    }
}