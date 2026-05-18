<?php

use App\Http\Controllers\AdminController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\BookingController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\DokterController;
use App\Http\Controllers\HewanController;
use App\Http\Controllers\JadwalDokterController;
use App\Http\Controllers\LayananController;
use App\Http\Controllers\ObatController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\RiwayatLayananController;
use Illuminate\Support\Facades\Route;

// ═══════════════════════════════════════════════════════════════════════════
//  PUBLIK — tidak butuh auth
// ═══════════════════════════════════════════════════════════════════════════

Route::post('/register', [AuthController::class, 'register']);
Route::post('/login',    [AuthController::class, 'login']);

// Layanan aktif — dipakai frontend booking untuk menampilkan pilihan layanan
Route::get('/layanan/publik', [LayananController::class, 'publik']);

// ═══════════════════════════════════════════════════════════════════════════
//  PROTECTED — semua butuh Bearer token (Sanctum)
// ═══════════════════════════════════════════════════════════════════════════

Route::middleware('auth:sanctum')->group(function () {

    Route::post('/logout', [AuthController::class, 'logout']);

    // ────────────────────────────────────────────────────────────────────────
    //  PEMILIK HEWAN (role: user)
    // ────────────────────────────────────────────────────────────────────────

    // Dashboard — satu endpoint untuk semua data dashboard
    Route::get('owner_pet/dashboard', [DashboardController::class, 'index']);

    // Profil pemilik
    Route::get('owner_pet/profile',        [ProfileController::class, 'getProfile']);
    Route::put('owner_pet/profile',        [ProfileController::class, 'updateProfile']);
    Route::put('owner_pet/profile/alamat', [ProfileController::class, 'updateAlamat']);
    Route::post('owner_pet/profile/foto',  [ProfileController::class, 'uploadFoto']);

    // Hewan peliharaan — CRUD
    Route::prefix('owner_pet/data_hewan')->group(function () {
        Route::get('/',        [HewanController::class, 'index']);    // semua hewan user
        Route::post('/',       [HewanController::class, 'store']);    // tambah hewan
        Route::get('/{id}',    [HewanController::class, 'show']);     // detail
        Route::put('/{id}',    [HewanController::class, 'update']);   // edit
        Route::delete('/{id}', [HewanController::class, 'destroy']);  // hapus
    });

    // Booking — multi-hewan, multi-layanan, data tiap hewan terpisah
    Route::prefix('booking')->group(function () {
        Route::get('/',                [BookingController::class, 'index']);          // semua booking user
        Route::post('/',               [BookingController::class, 'store']);          // buat booking baru
        Route::get('/aktif',           [BookingController::class, 'aktif']);          // booking aktif (dashboard)
        Route::get('/jadwal-tersedia', [BookingController::class, 'jadwalTersedia']); // jadwal dokter aktif
        Route::get('/{id}',            [BookingController::class, 'show']);           // detail satu booking
        Route::patch('/{id}/batal',    [BookingController::class, 'cancel']);         // batalkan
    });

    // Riwayat layanan
    Route::prefix('riwayat')->group(function () {
        Route::get('/',      [RiwayatLayananController::class, 'index']); // daftar riwayat
        Route::get('/stats', [RiwayatLayananController::class, 'stats']); // statistik per kategori
        Route::get('/{id}',  [RiwayatLayananController::class, 'show']);  // detail + rincian obat/lab
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

    // ────────────────────────────────────────────────────────────────────────
    //  ADMIN
    // ────────────────────────────────────────────────────────────────────────

    Route::get('/admin/jadwal',   [JadwalDokterController::class, 'adminIndex']);
    Route::get('/admin/profile',  [AdminController::class, 'getProfile']);
    Route::put('/admin/profile',  [AdminController::class, 'updateProfile']);
    Route::post('/admin/foto',    [AdminController::class, 'uploadFoto']);

    // Layanan — CRUD (admin)
    Route::get('/layanan',         [LayananController::class, 'index']);
    Route::post('/layanan',        [LayananController::class, 'store']);
    Route::put('/layanan/{id}',    [LayananController::class, 'update']);
    Route::delete('/layanan/{id}', [LayananController::class, 'destroy']);

    // Obat — CRUD (admin/dokter)
    Route::get('/obat',         [ObatController::class, 'index']);
    Route::post('/obat',        [ObatController::class, 'store']);
    Route::put('/obat/{id}',    [ObatController::class, 'update']);
    Route::delete('/obat/{id}', [ObatController::class, 'destroy']);
});