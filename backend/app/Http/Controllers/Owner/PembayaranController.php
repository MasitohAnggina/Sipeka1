<?php

namespace App\Http\Controllers\Owner;

use App\Http\Controllers\Controller;
use App\Models\Pembayaran;
use App\Models\Resep;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;

class PembayaranController extends Controller
{
    /**
     * POST /api/owner/pembayaran
     *
     * Owner memilih metode pembayaran.
     * Body: { "id_resep": 10, "metode": "cash" | "midtrans" }
     */
    public function pilihMetode(Request $request): JsonResponse
    {
        $request->validate([
            'id_resep' => 'required|integer|exists:resep,id_resep',
            'metode'   => 'required|in:cash,midtrans',
        ]);

        $idUser = Auth::id();

        // Pastikan resep milik owner ini
        $resep = Resep::where('id_resep', $request->id_resep)
            ->where('id_user', $idUser)
            ->firstOrFail();

        // Ambil atau buat record pembayaran
        $pembayaran = Pembayaran::firstOrCreate(
            ['id_resep' => $resep->id_resep],
            [
                'id_user' => $idUser,
                'jumlah'  => $resep->grand_total,
                'status'  => 'menunggu_pembayaran',
            ]
        );

        // Jika sudah lunas, tolak
        if ($pembayaran->isLunas()) {
            return response()->json([
                'success' => false,
                'message' => 'Invoice ini sudah lunas.',
            ], 422);
        }

        // ── CASH ────────────────────────────────────────────────────────
        if ($request->metode === 'cash') {
            $pembayaran->update([
                'metode' => 'cash',
                'status' => 'pending_cash',
            ]);

            return response()->json([
                'success' => true,
                'metode'  => 'cash',
                'pesan'   => 'Silakan menuju kasir klinik untuk menyelesaikan pembayaran tunai.',
                'data'    => [
                    'id_pembayaran' => $pembayaran->id_pembayaran,
                    'jumlah'        => $pembayaran->jumlah,
                    'status'        => 'pending_cash',
                ],
            ]);
        }

        // ── MIDTRANS — selalu buat token baru ───────────────────────────
        $orderId   = 'INV-' . $resep->id_resep . '-' . Str::upper(Str::random(6));
        $snapToken = $this->createMidtransTransaction($resep, $pembayaran, $orderId);

        $pembayaran->update([
            'metode'            => 'midtrans',
            'status'            => 'pending_midtrans',
            'snap_token'        => $snapToken,
            'midtrans_order_id' => $orderId,
        ]);

        return response()->json([
            'success'            => true,
            'metode'             => 'midtrans',
            'snap_token'         => $snapToken,
            'midtrans_order_id'  => $orderId,
        ]);
    }

    // ────────────────────────────────────────────────────────────────────
    // Helper: Buat transaksi di Midtrans dan return snap_token
    // ────────────────────────────────────────────────────────────────────
    private function createMidtransTransaction(
        Resep $resep,
        Pembayaran $pembayaran,
        string $orderId
    ): string {
        $resep->loadMissing(['details', 'hewan', 'user']);

        $itemDetails = $resep->details->map(fn($d) => [
            'id'       => (string) $d->id_detail,
            'price'    => $d->harga_satuan,
            'quantity' => $d->qty,
            'name'     => mb_substr($d->nama_item, 0, 50),
        ])->toArray();

        $payload = [
            'transaction_details' => [
                'order_id'     => $orderId,
                'gross_amount' => $resep->grand_total,
            ],
            'customer_details' => [
                'first_name' => $resep->user->nama ?? 'Pemilik',
                'phone'      => $resep->user->no_hp ?? '',
                'email'      => $resep->user->email ?? '',
            ],
            'item_details'     => $itemDetails,
            'enabled_payments' => [
                'credit_card',
                'qris',
                'gopay',
                'shopeepay',
                'other_qris',
                'bca_va',
                'bni_va',
                'bri_va',
                'mandiri_va',
            ],
        ];

        $serverKey = config('services.midtrans.server_key');
        $baseUrl   = config('services.midtrans.is_production')
            ? 'https://app.midtrans.com/snap/v1/transactions'
            : 'https://app.sandbox.midtrans.com/snap/v1/transactions';

        $response = \Illuminate\Support\Facades\Http::withHeaders([
            'Authorization' => 'Basic ' . base64_encode($serverKey . ':'),
            'Content-Type'  => 'application/json',
        ])->post($baseUrl, $payload);

        if (! $response->successful()) {
            \Illuminate\Support\Facades\Log::error('Midtrans error', [
                'status'  => $response->status(),
                'body'    => $response->body(),
                'payload' => $payload,
            ]);
            throw new \Exception('Gagal membuat transaksi Midtrans: ' . $response->body());
        }

        return $response->json('token');
    }
}
