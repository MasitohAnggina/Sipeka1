<?php

namespace App\Http\Controllers;

use App\Models\Pembayaran;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class MidtransWebhookController extends Controller
{
    /**
     * POST /api/webhook/midtrans
     *
     * Midtrans akan POST ke sini setiap kali status transaksi berubah.
     * Endpoint ini TIDAK pakai auth middleware (karena dari Midtrans server).
     * Keamanan dijaga dengan verifikasi signature_key.
     *
     * Daftarkan URL ini di Midtrans Dashboard:
     *   Sandbox : https://dashboard.sandbox.midtrans.com → Settings → Configuration
     *   Production: https://dashboard.midtrans.com → Settings → Configuration
     */
    public function handle(Request $request): JsonResponse
    {
        $payload = $request->all();

        Log::info('Midtrans webhook received', $payload);

        // ── 1. Verifikasi signature_key ──────────────────────────────────
        // Format: SHA512(order_id + status_code + gross_amount + server_key)
        $orderId     = $payload['order_id']     ?? '';
        $statusCode  = $payload['status_code']  ?? '';
        $grossAmount = $payload['gross_amount'] ?? '';
        $serverKey   = config('services.midtrans.server_key');

        $expectedSignature = hash(
            'sha512',
            $orderId . $statusCode . $grossAmount . $serverKey
        );

        if (($payload['signature_key'] ?? '') !== $expectedSignature) {
            Log::warning('Midtrans invalid signature', ['order_id' => $orderId]);
            return response()->json(['message' => 'Invalid signature'], 403);
        }

        // ── 2. Cari record pembayaran berdasarkan order_id ───────────────
        $pembayaran = Pembayaran::where('midtrans_order_id', $orderId)->first();

        if (! $pembayaran) {
            Log::warning('Midtrans webhook: pembayaran tidak ditemukan', ['order_id' => $orderId]);
            return response()->json(['message' => 'Order not found'], 404);
        }

        // ── 3. Update status berdasarkan transaction_status ──────────────
        $transactionStatus = $payload['transaction_status'] ?? '';
        $fraudStatus       = $payload['fraud_status']       ?? '';

        /*
         * Midtrans transaction_status yang penting:
         *  capture    → pembayaran berhasil (kartu kredit) — perlu cek fraud_status
         *  settlement → pembayaran berhasil (transfer/QRIS/e-wallet)
         *  pending    → menunggu pembayaran
         *  deny       → ditolak
         *  expire     → kedaluwarsa
         *  cancel     → dibatalkan
         */
        $newStatus = match (true) {
            $transactionStatus === 'capture' && $fraudStatus === 'accept' => 'lunas',
            $transactionStatus === 'settlement'                           => 'lunas',
            $transactionStatus === 'pending'                              => 'pending_midtrans',
            in_array($transactionStatus, ['deny', 'expire', 'cancel'])   => 'gagal',
            default                                                       => null,
        };

        if ($newStatus === null) {
            Log::info('Midtrans webhook: status tidak dikenali', [
                'transaction_status' => $transactionStatus,
                'order_id'           => $orderId,
            ]);
            return response()->json(['message' => 'Status ignored']);
        }

        // Jangan downgrade status yang sudah lunas
        if ($pembayaran->status === 'lunas' && $newStatus !== 'lunas') {
            return response()->json(['message' => 'Already paid, ignored']);
        }

        $pembayaran->update([
            'status'                    => $newStatus,
            'midtrans_transaction_id'   => $payload['transaction_id']   ?? null,
            'midtrans_payment_type'     => $payload['payment_type']     ?? null,
            'midtrans_raw'              => $payload,
            'dikonfirmasi_at'           => $newStatus === 'lunas' ? now() : null,
        ]);

        Log::info('Midtrans webhook processed', [
            'order_id'   => $orderId,
            'new_status' => $newStatus,
        ]);

        return response()->json(['message' => 'OK']);
    }
}