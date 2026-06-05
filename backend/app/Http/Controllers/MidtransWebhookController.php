<?php

namespace App\Http\Controllers;

use App\Models\Pembayaran;
use App\Models\RiwayatLayanan;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class MidtransWebhookController extends Controller
{
    public function handle(Request $request): JsonResponse
    {
        $payload = $request->all();

        Log::info('Midtrans webhook received', $payload);

        // ── 1. Verifikasi signature_key ──────────────────────────────────
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

        // ── 2. Cari record pembayaran ────────────────────────────────────
        $pembayaran = Pembayaran::where('midtrans_order_id', $orderId)->first();

        if (! $pembayaran) {
            Log::warning('Midtrans webhook: pembayaran tidak ditemukan', ['order_id' => $orderId]);
            return response()->json(['message' => 'Order not found'], 404);
        }

        // ── 3. Update status ─────────────────────────────────────────────
        $transactionStatus = $payload['transaction_status'] ?? '';
        $fraudStatus       = $payload['fraud_status']       ?? '';

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

        // ── 4. Buat RiwayatLayanan otomatis setelah lunas ────────────────
        if ($newStatus === 'lunas') {
            $resep = $pembayaran->resep;
            if ($resep) {
                $sudahAda = RiwayatLayanan::where('id_booking', $resep->id_booking)->exists();
                if (!$sudahAda) {
                    RiwayatLayanan::create([
                        'id_booking'  => $resep->id_booking,
                        'tanggal'     => now()->toDateString(),
                        'grand_total' => $resep->grand_total,
                        'catatan'     => null,
                    ]);
                }
                // Update status booking jadi selesai
                $resep->booking?->update(['status' => 'selesai']);
            }
        }
        // ─────────────────────────────────────────────────────────────────

        Log::info('Midtrans webhook processed', [
            'order_id'   => $orderId,
            'new_status' => $newStatus,
        ]);

        return response()->json(['message' => 'OK']);
    }
}