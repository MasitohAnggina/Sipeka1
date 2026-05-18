<?php

namespace App\Http\Controllers;

use App\Models\Booking;
use App\Models\Jadwal;
use App\Models\Layanan;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class BookingController extends Controller
{
    // =========================================================================
    //  GET /api/booking
    //  Semua booking milik user yang login
    // =========================================================================
    public function index(Request $request): JsonResponse
    {
        $bookings = Booking::with(['hewan', 'jadwal.dokter', 'layanans'])
            ->where('id_user', $request->user()->id_user)
            ->orderBy('tanggal_booking', 'desc')
            ->get()
            ->map(fn($b) => $this->formatBooking($b));

        return response()->json(['success' => true, 'data' => $bookings]);
    }

    // =========================================================================
    //  GET /api/booking/aktif
    //  Booking aktif (status Menunggu/Diproses) — untuk dashboard
    // =========================================================================
    public function aktif(Request $request): JsonResponse
    {
        $bookings = Booking::with(['hewan', 'jadwal', 'layanans'])
            ->where('id_user', $request->user()->id_user)
            ->whereIn('status', ['Menunggu', 'Diproses'])
            ->orderBy('tanggal_booking', 'asc')
            ->get()
            ->map(fn($b) => $this->formatBooking($b));

        return response()->json(['success' => true, 'data' => $bookings]);
    }

    // =========================================================================
    //  GET /api/booking/jadwal-tersedia
    //  Jadwal dokter Aktif >= hari ini — untuk owner saat booking
    //  TIDAK cek apakah user adalah dokter
    // =========================================================================
    public function jadwalTersedia(Request $request): JsonResponse
    {
        $jadwal = Jadwal::with('dokter')
            ->where('status', 'Aktif')
            ->where('tanggal', '>=', now()->toDateString())
            ->orderBy('tanggal', 'asc')
            ->get()
            ->map(fn($j) => [
                'id_jadwal'   => $j->id_jadwal,
                'tanggal'     => $j->tanggal?->format('Y-m-d'),
                'hari'        => $j->hari,
                'jam_mulai'   => $j->jam_mulai   ? substr($j->jam_mulai,   0, 5) : null,
                'jam_selesai' => $j->jam_selesai ? substr($j->jam_selesai, 0, 5) : null,
                'durasi'      => $j->durasi,
                'nama_dokter' => $j->dokter?->nama_dokter ?? null,
                'id_dokter'   => $j->id_dokter,
            ]);

        return response()->json(['success' => true, 'data' => $jadwal]);
    }

    // =========================================================================
    //  GET /api/booking/{id}
    //  Detail satu booking
    // =========================================================================
    public function show(Request $request, int $id): JsonResponse
    {
        $booking = Booking::with(['hewan', 'jadwal.dokter', 'layanans'])
            ->where('id_booking', $id)
            ->where('id_user', $request->user()->id_user)
            ->firstOrFail();

        return response()->json(['success' => true, 'data' => $this->formatBooking($booking)]);
    }

    // =========================================================================
    //  POST /api/booking
    //  Buat booking baru — multi-hewan, multi-layanan
    //
    //  Payload:
    //  {
    //    "tanggal_booking": "2026-05-22",
    //    "jam": "09:00",
    //    "id_jadwal": 3,
    //    "items": [
    //      {
    //        "id_hewan": 1,
    //        "id_layanans": [2, 5],
    //        "catatan": "Max susah makan",
    //        "foto_before": "data:image/...",   // opsional, base64
    //        "foto_after":  "data:image/..."    // opsional, base64
    //      }
    //    ]
    //  }
    // =========================================================================
    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'tanggal_booking'       => 'required|date',
            'jam'                   => 'required|string',
            'id_jadwal'             => 'required|integer|exists:jadwal,id_jadwal',
            'items'                 => 'required|array|min:1',
            'items.*.id_hewan'      => 'required|integer|exists:hewan,id_hewan',
            'items.*.id_layanans'   => 'required|array|min:1',
            'items.*.id_layanans.*' => 'integer|exists:layanan,id_layanan',
            'items.*.catatan'       => 'nullable|string',
            'items.*.foto_before'   => 'nullable|string',
            'items.*.foto_after'    => 'nullable|string',
        ]);

        $userId  = $request->user()->id_user;
        $tanggal = $request->tanggal_booking;
        $jam     = $request->jam;
        $jadwalId = $request->id_jadwal;

        $bookings = [];

        DB::beginTransaction();
        try {
            foreach ($request->items as $item) {
                $fotoBefore = $this->saveBase64($item['foto_before'] ?? null, 'foto_kondisi');
                $fotoAfter  = $this->saveBase64($item['foto_after']  ?? null, 'foto_kondisi');

                $booking = Booking::create([
                    'no_booking'      => Booking::generateNoBooking(),
                    'id_user'         => $userId,
                    'id_hewan'        => $item['id_hewan'],
                    'id_jadwal'       => $jadwalId,
                    'tanggal_booking' => $tanggal,
                    'tanggal_dibuat'  => now()->toDateString(),
                    'jam'             => $jam,
                    'catatan'         => $item['catatan'] ?? null,
                    'foto_before'     => $fotoBefore,
                    'foto_after'      => $fotoAfter,
                    'no_antrian'      => Booking::nextAntrian($tanggal),
                    'status'          => 'Menunggu',
                ]);

                // Attach layanan ke pivot booking_layanan
                $pivotData = [];
                foreach ($item['id_layanans'] as $idLayanan) {
                    $layanan = Layanan::find($idLayanan);
                    $pivotData[$idLayanan] = [
                        'harga_saat_booking' => $layanan?->harga ?? 0,
                    ];
                }
                $booking->layanans()->attach($pivotData);

                $bookings[] = [
                    'no_booking'  => $booking->no_booking,
                    'no_antrian'  => $booking->no_antrian,
                    'id_hewan'    => $booking->id_hewan,
                    'id_booking'  => $booking->id_booking,
                ];
            }

            DB::commit();

            return response()->json([
                'success'  => true,
                'message'  => 'Booking berhasil dibuat.',
                'bookings' => $bookings,
            ], 201);

        } catch (\Throwable $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Gagal membuat booking: ' . $e->getMessage(),
            ], 500);
        }
    }

    // =========================================================================
    //  PATCH /api/booking/{id}/batal
    //  Batalkan booking (hanya yang masih Menunggu)
    // =========================================================================
    public function cancel(Request $request, int $id): JsonResponse
    {
        $booking = Booking::where('id_booking', $id)
            ->where('id_user', $request->user()->id_user)
            ->firstOrFail();

        if ($booking->status !== 'Menunggu') {
            return response()->json([
                'success' => false,
                'message' => 'Hanya booking dengan status Menunggu yang dapat dibatalkan.',
            ], 422);
        }

        $booking->update(['status' => 'Dibatalkan']);

        return response()->json([
            'success' => true,
            'message' => 'Booking berhasil dibatalkan.',
        ]);
    }

    // =========================================================================
    //  PRIVATE HELPERS
    // =========================================================================

    /**
     * Format booking untuk response JSON
     */
    private function formatBooking(Booking $b): array
    {
        return [
            'id_booking'      => $b->id_booking,
            'no_booking'      => $b->no_booking,
            'no_antrian'      => $b->no_antrian,
            'status'          => $b->status,
            'tanggal_booking' => $b->tanggal_booking?->format('Y-m-d'),
            'jam'             => $b->jam,
            'catatan'         => $b->catatan,
            'foto_before'     => $b->foto_before ? Storage::url($b->foto_before) : null,
            'foto_after'      => $b->foto_after  ? Storage::url($b->foto_after)  : null,
            'hewan'           => $b->hewan ? [
                'id_hewan' => $b->hewan->id_hewan,
                'name'     => $b->hewan->name ?? $b->hewan->nama_hewan,
                'type'     => $b->hewan->type ?? $b->hewan->jenis,
                'breed'    => $b->hewan->breed ?? $b->hewan->ras,
            ] : null,
            'jadwal'          => $b->jadwal ? [
                'id_jadwal'   => $b->jadwal->id_jadwal,
                'tanggal'     => $b->jadwal->tanggal?->format('Y-m-d'),
                'hari'        => $b->jadwal->hari,
                'jam_mulai'   => $b->jadwal->jam_mulai   ? substr($b->jadwal->jam_mulai,   0, 5) : null,
                'jam_selesai' => $b->jadwal->jam_selesai ? substr($b->jadwal->jam_selesai, 0, 5) : null,
                'nama_dokter' => $b->jadwal->dokter?->nama_dokter ?? null,
            ] : null,
            'layanans'        => $b->layanans->map(fn($l) => [
                'id_layanan'         => $l->id_layanan,
                'nama_layanan'       => $l->nama_layanan,
                'kategori'           => $l->kategori,
                'harga_saat_booking' => $l->pivot->harga_saat_booking,
            ])->toArray(),
        ];
    }

    /**
     * Simpan gambar base64 ke storage, return path-nya
     * Kalau bukan base64 valid, return null
     */
    private function saveBase64(?string $data, string $folder): ?string
    {
        if (!$data || !str_contains($data, 'base64,')) {
            return null;
        }

        try {
            [, $base64] = explode('base64,', $data);
            $binary   = base64_decode($base64);
            $ext      = 'jpg';

            // Deteksi ekstensi dari mime type
            if (str_contains($data, 'image/png'))  $ext = 'png';
            if (str_contains($data, 'image/webp')) $ext = 'webp';

            $filename = $folder . '/' . uniqid('img_', true) . '.' . $ext;
            Storage::disk('public')->put($filename, $binary);

            return $filename;
        } catch (\Throwable) {
            return null;
        }
    }
}