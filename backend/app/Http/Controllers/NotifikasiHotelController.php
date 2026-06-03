<?php
// app/Http/Controllers/NotifikasiHotelController.php

namespace App\Http\Controllers;

use App\Mail\NotifikasiPenjemputanHewan;
use App\Models\Booking;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;

class NotifikasiHotelController extends Controller
{
    // ── Helper: validasi booking ──────────────────────────────────────────────

    private function getValidatedBooking(int $id): Booking
    {
        return Booking::with(['hewan', 'user', 'layanans'])
            ->where('id_booking', $id)
            ->firstOrFail();
    }

    private function isPetHotel(Booking $booking): bool
    {
        return $booking->layanans->contains(
            fn($l) => stripos($l->nama_layanan, 'hotel') !== false ||
                      stripos($l->kategori,     'hotel') !== false ||
                      stripos($l->kategori, 'rawat inap') !== false
        );
    }

    // ── POST /api/admin/booking/{id}/notif-hotel/wa ───────────────────────────

    public function kirimWa(int $id): JsonResponse
    {
        $booking = $this->getValidatedBooking($id);

        if ($booking->status !== 'selesai') {
            return response()->json([
                'success' => false,
                'message' => 'Notifikasi hanya bisa dikirim jika status booking sudah selesai.',
            ], 422);
        }

        if (!$this->isPetHotel($booking)) {
            return response()->json([
                'success' => false,
                'message' => 'Booking ini bukan layanan Pet Hotel.',
            ], 422);
        }

        $token = config('services.fonnte.token');
        if (!$token) {
            return response()->json([
                'success' => false,
                'message' => 'Token Fonnte belum dikonfigurasi di server.',
            ], 422);
        }

        $user  = $booking->user;
        $hewan = $booking->hewan;
        $noHp  = $user?->no_hp ?? null;

        if (!$noHp) {
            return response()->json([
                'success' => false,
                'message' => 'No. HP pemilik tidak tersedia.',
            ], 422);
        }

        $noHp = preg_replace('/\D/', '', $noHp);
        $noHp = preg_replace('/^0/', '62', $noHp);
        $tgl = $booking->tanggal_selesai
    ? \Carbon\Carbon::parse($booking->tanggal_selesai)->locale('id')->translatedFormat('d F Y')
    : 'hari ini';

$ras   = $hewan->ras ?? '-';
$jenis = $hewan->jenis ?? '-';
$info  = ($ras && $ras !== $jenis && $ras !== '-') ? "{$jenis} · {$ras}" : $jenis;

$emojiHewan = match(strtolower($hewan->jenis ?? '')) {
    'anjing'  => '🐕',
    'kucing'  => '🐱',
    'kelinci' => '🐇',
    'burung'  => '🐦',
    'hamster' => '🐹',
    'ikan'    => '🐟',
    'kura-kura', 'kura kura' => '🐢',
    default   => '🐾',
};
$pesan = "*Pemberitahuan Penjemputan Hewan*\n\n"
       . "Yth. Bapak/Ibu *{$user->nama}*,\n\n"
       . "Masa penitipan hewan Anda:\n"
       . "{$emojiHewan} *{$hewan->nama_hewan}* ({$info})\n\n"
       . "di *Klinik Hewan* kami telah selesai.\n\n"
       . "📅 Batas penjemputan: *{$tgl}*\n"
       . "📋 No. Booking: *{$booking->no_booking}*\n\n"
       . "Mohon segera lakukan penjemputan.\n"
       . "Terima kasih telah mempercayakan perawatan hewan Anda kepada kami. 🙏";

        try {
            $response = Http::withHeaders([
                'Authorization' => $token,
            ])->post('https://api.fonnte.com/send', [
                'target'  => $noHp,
                'message' => $pesan,
            ]);

            $body = $response->json();

            if ($response->ok() && ($body['status'] ?? false)) {
                $booking->update([
                    'notif_terkirim'   => true,
                    'notif_dikirim_at' => now(),
                ]);
                return response()->json([
                    'success' => true,
                    'message' => 'WhatsApp berhasil dikirim ke ' . $noHp,
                ]);
            }

            return response()->json([
                'success' => false,
                'message' => 'Gagal kirim WhatsApp: ' . ($body['reason'] ?? 'unknown error'),
            ], 500);

        } catch (\Exception $e) {
            Log::error('Fonnte error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error: ' . $e->getMessage(),
            ], 500);
        }
    }

    // ── POST /api/admin/booking/{id}/notif-hotel/email ────────────────────────

    public function kirimEmail(int $id): JsonResponse
    {
        $booking = $this->getValidatedBooking($id);

        if ($booking->status !== 'selesai') {
            return response()->json([
                'success' => false,
                'message' => 'Notifikasi hanya bisa dikirim jika status booking sudah selesai.',
            ], 422);
        }

        if (!$this->isPetHotel($booking)) {
            return response()->json([
                'success' => false,
                'message' => 'Booking ini bukan layanan Pet Hotel.',
            ], 422);
        }

        $email = $booking->user?->email ?? null;

        if (!$email) {
            return response()->json([
                'success' => false,
                'message' => 'Email pemilik tidak tersedia.',
            ], 422);
        }

        try {
            Mail::to($email)->send(new NotifikasiPenjemputanHewan($booking));
            $booking->update([
                'notif_terkirim'   => true,
                'notif_dikirim_at' => now(),
            ]);
            return response()->json([
                'success' => true,
                'message' => 'Email berhasil dikirim ke ' . $email,
            ]);
        } catch (\Exception $e) {
            Log::error('Mail error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Gagal kirim email: ' . $e->getMessage(),
            ], 500);
        }
    }
}