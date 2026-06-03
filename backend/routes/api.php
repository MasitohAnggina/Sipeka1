<?php

use App\Http\Controllers\AdminController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\BookingController;
use App\Http\Controllers\BookingDokterController;
use App\Http\Controllers\BookingAdminController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\DokterController;
use App\Http\Controllers\HewanController;
use App\Http\Controllers\JadwalDokterController;
use App\Http\Controllers\LayananController;
use App\Http\Controllers\ObatController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\RiwayatLayananController;
use App\Http\Controllers\RekamMedisController;
use App\Http\Controllers\RiwayatMedisController;
use App\Http\Controllers\AdminRiwayatController;
use App\Http\Controllers\DashboardDokterController;
use App\Http\Controllers\DashboardAdminController;
use App\Http\Controllers\DokterLayananObatController;
use App\Http\Controllers\MidtransWebhookController;
use App\Http\Controllers\Owner\InvoiceController;
use App\Http\Controllers\Owner\PembayaranController;
use App\Http\Controllers\Admin\AdminPembayaranController;
use Illuminate\Support\Facades\Route;


// ═══════════════════════════════════════════════════════════════════════════
//  PUBLIK — tidak butuh auth
// ═══════════════════════════════════════════════════════════════════════════

Route::post('/register', [AuthController::class, 'register']);
Route::post('/login',    [AuthController::class, 'login']);

Route::get('/layanan/publik', [LayananController::class, 'publik']);

// ── Webhook Midtrans ─────────────────────────────────────────────────────
// PENTING: route ini TIDAK pakai auth middleware
// Tambahkan juga ke CSRF exception di App\Http\Middleware\VerifyCsrfToken:
//   protected $except = ['api/webhook/midtrans'];
Route::post('webhook/midtrans', [MidtransWebhookController::class, 'handle']);


// ═══════════════════════════════════════════════════════════════════════════
//  PROTECTED — semua butuh Bearer token (Sanctum)
// ═══════════════════════════════════════════════════════════════════════════

Route::middleware('auth:sanctum')->group(function () {

    Route::post('/logout', [AuthController::class, 'logout']);

    // ────────────────────────────────────────────────────────────────────────
    //  PEMILIK HEWAN (role: owner)
    // ────────────────────────────────────────────────────────────────────────

    Route::get('owner_pet/dashboard', [DashboardController::class, 'index']);

    Route::get('owner_pet/profile',          [ProfileController::class, 'getProfile']);
    Route::put('owner_pet/profile',          [ProfileController::class, 'updateProfile']);
    Route::put('owner_pet/profile/alamat',   [ProfileController::class, 'updateAlamat']);
    Route::post('owner_pet/profile/foto',    [ProfileController::class, 'uploadFoto']);
    Route::delete('owner_pet/profile/foto',  [ProfileController::class, 'hapusFoto']);

    Route::prefix('owner_pet/data_hewan')->group(function () {
        Route::get('/',        [HewanController::class, 'index']);
        Route::post('/',       [HewanController::class, 'store']);
        Route::get('/{id}',    [HewanController::class, 'show']);
        Route::put('/{id}',    [HewanController::class, 'update']);
        Route::delete('/{id}', [HewanController::class, 'destroy']);
    });

    Route::prefix('booking')->group(function () {
        Route::get('/',                [BookingController::class, 'index']);
        Route::post('/',               [BookingController::class, 'store']);
        Route::get('/aktif',           [BookingController::class, 'aktif']);
        Route::get('/jadwal-tersedia', [BookingController::class, 'jadwalTersedia']);
        Route::get('/{id}',            [BookingController::class, 'show']);
        Route::patch('/{id}/batal',    [BookingController::class, 'cancel']);
    });

    Route::prefix('riwayat')->group(function () {
        Route::get('/',      [RiwayatLayananController::class, 'index']);
        Route::get('/stats', [RiwayatLayananController::class, 'stats']);
        Route::get('/{id}',  [RiwayatLayananController::class, 'show']);
    });

    // Owner — Invoice & Pembayaran
    Route::prefix('owner')->group(function () {
        // GET  /api/owner/invoice          → list semua invoice per hewan
        // GET  /api/owner/invoice/{id}     → detail satu invoice
        Route::get('invoice',             [InvoiceController::class, 'index']);
        Route::get('invoice/{id_resep}',  [InvoiceController::class, 'show']);

        // POST /api/owner/pembayaran       → pilih metode bayar (cash / midtrans)
        Route::post('pembayaran', [PembayaranController::class, 'pilihMetode']);
    });

    // ────────────────────────────────────────────────────────────────────────
    //  DOKTER
    // ────────────────────────────────────────────────────────────────────────

    Route::get('/dokter/profile',  [DokterController::class, 'getProfile']);
    Route::put('/dokter/profile',  [DokterController::class, 'updateProfile']);
    Route::post('/dokter/foto',    [DokterController::class, 'uploadFoto']);

    Route::prefix('dokter/jadwal')->group(function () {
        Route::get('/',                     [JadwalDokterController::class, 'index']);
        Route::post('/',                    [JadwalDokterController::class, 'store']);
        Route::put('/{id_jadwal}',          [JadwalDokterController::class, 'update']);
        Route::patch('/{id_jadwal}/status', [JadwalDokterController::class, 'updateStatus']);
        Route::delete('/{id_jadwal}',       [JadwalDokterController::class, 'destroy']);
    });

    Route::get('/dokter/booking',               [BookingDokterController::class, 'index']);
    Route::patch('/dokter/booking/{id}/status', [BookingDokterController::class, 'updateStatus']);

    Route::get('/dokter/rekam-medis',      [RekamMedisController::class, 'index']);
    Route::post('/dokter/rekam-medis',     [RekamMedisController::class, 'store']);
    Route::get('/dokter/rekam-medis/{id}', [RekamMedisController::class, 'show']);

    Route::get('/dokter/riwayat-medis', [RiwayatMedisController::class, 'index']);
    Route::get('/dokter/dashboard',     [DashboardDokterController::class, 'index']);

    Route::get('dokter/layanan',            [DokterLayananObatController::class, 'indexLayanan']);
    Route::get('dokter/obat',               [DokterLayananObatController::class, 'indexObat']);
    Route::get('dokter/pemilik',            [DokterLayananObatController::class, 'indexPemilik']);
    Route::post('dokter/resep',             [DokterLayananObatController::class, 'simpanResep']);
    Route::get('dokter/resep/{id}',         [DokterLayananObatController::class, 'getResep']);
    Route::get('/dokter/resep/cek/{id_booking}', [DokterLayananObatController::class, 'cekResep']);

    // ────────────────────────────────────────────────────────────────────────
    //  ADMIN
    // ────────────────────────────────────────────────────────────────────────

    Route::get('/admin/jadwal',   [JadwalDokterController::class, 'adminIndex']);
    Route::get('/admin/profile',  [AdminController::class, 'getProfile']);
    Route::put('/admin/profile',  [AdminController::class, 'updateProfile']);
    Route::post('/admin/foto',    [AdminController::class, 'uploadFoto']);

    Route::get('/layanan',         [LayananController::class, 'index']);
    Route::post('/layanan',        [LayananController::class, 'store']);
    Route::put('/layanan/{id}',    [LayananController::class, 'update']);
    Route::delete('/layanan/{id}', [LayananController::class, 'destroy']);

    Route::get('/obat',         [ObatController::class, 'index']);
    Route::post('/obat',        [ObatController::class, 'store']);
    Route::put('/obat/{id}',    [ObatController::class, 'update']);
    Route::delete('/obat/{id}', [ObatController::class, 'destroy']);

    Route::get('/admin/booking/summary',       [BookingAdminController::class, 'summary']);
    Route::get('/admin/booking',               [BookingAdminController::class, 'index']);
    Route::get('/admin/booking/{id}',          [BookingAdminController::class, 'show']);
    Route::patch('/admin/booking/{id}/status', [BookingAdminController::class, 'updateStatus']);

    Route::get('/admin/riwayat',         [AdminRiwayatController::class, 'index']);
    Route::get('/admin/riwayat/summary', [AdminRiwayatController::class, 'summary']);

    Route::get('/admin/dashboard', [DashboardAdminController::class, 'index']);

    // Admin — Pembayaran
    Route::prefix('admin')->group(function () {
        // GET   /api/admin/pembayaran              → semua pembayaran (bisa difilter ?status=)
        // GET   /api/admin/pembayaran/{id}         → detail satu pembayaran
        // PATCH /api/admin/pembayaran/{id}/selesai → konfirmasi cash
        Route::get('pembayaran',                [AdminPembayaranController::class, 'index']);
        Route::get('pembayaran/{id}',           [AdminPembayaranController::class, 'show']);
        Route::patch('pembayaran/{id}/selesai', [AdminPembayaranController::class, 'konfirmasiCash']);
    });
});

// ═══════════════════════════════════════════════════════════════════════════
//  TESTING ONLY — otomatis tidak aktif di production
// ═══════════════════════════════════════════════════════════════════════════
if (app()->environment('local')) {
    Route::post('test/bayar-lunas/{order_id}', function ($order_id) {
        $pembayaran = \App\Models\Pembayaran::where('midtrans_order_id', $order_id)->first();
        if (!$pembayaran) {
            return response()->json(['success' => false, 'message' => 'Order ID tidak ditemukan'], 404);
        }
        $pembayaran->update([
            'status'          => 'lunas',
            'dikonfirmasi_at' => now(),
        ]);
        return response()->json([
            'success'   => true,
            'message'   => 'Pembayaran berhasil diset lunas',
            'order_id'  => $order_id,
            'invoice'   => $pembayaran->id_resep,
        ]);
    });
}