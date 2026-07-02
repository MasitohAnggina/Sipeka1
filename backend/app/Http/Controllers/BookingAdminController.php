<?php

namespace App\Http\Controllers;

use App\Models\Booking;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class BookingAdminController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Booking::with(['hewan', 'user', 'jadwal', 'layanans']);

        if ($request->filled('status')) {
            $query->where('status', strtolower($request->status));
        }
        if ($request->filled('tanggal')) {
            $query->whereDate('tanggal_booking', $request->tanggal);
        }
        if ($request->filled('pemilik')) {
            $query->whereHas('user', function ($q) use ($request) {
                $q->where('nama', 'like', '%' . $request->pemilik . '%')
                  ->orWhere('name', 'like', '%' . $request->pemilik . '%');
            });
        }
        if ($request->filled('layanan')) {
            $query->whereHas('layanans', function ($q) use ($request) {
                $q->where('nama_layanan', $request->layanan);
            });
        }

        $bookings = $query
            ->orderBy('tanggal_booking', 'desc')
            ->orderBy('jam', 'asc')
            ->get()
            ->map(fn($b) => $this->formatBooking($b));

        return response()->json(['success' => true, 'data' => $bookings]);
    }

    public function show(int $idBooking): JsonResponse
    {
        $booking = Booking::with(['hewan', 'user', 'jadwal', 'layanans'])
            ->where('id_booking', $idBooking)
            ->firstOrFail();

        return response()->json(['success' => true, 'data' => $this->formatBooking($booking)]);
    }

    public function updateStatus(Request $request, int $idBooking): JsonResponse
    {
        $booking = Booking::with(['hewan', 'user', 'jadwal', 'layanans'])
            ->where('id_booking', $idBooking)
            ->firstOrFail();

        $validated = $request->validate([
            'status' => ['required', Rule::in(['menunggu', 'dikonfirmasi', 'dibatalkan'])],
        ]);

        if (strtolower($booking->status) === 'selesai') {
            return response()->json([
                'success' => false,
                'message' => 'Booking yang sudah selesai tidak dapat diubah statusnya.',
            ], 422);
        }

        $booking->update(['status' => $validated['status']]);

        return response()->json([
            'success' => true,
            'message' => 'Status booking berhasil diperbarui.',
            'data'    => $this->formatBooking(
                $booking->fresh(['hewan', 'user', 'jadwal', 'layanans'])
            ),
        ]);
    }

    /**
     * Daftar booking yang menunggu konfirmasi pembatalan dari owner.
     * Dipakai oleh bell notifikasi "Pembatalan dari Owner" di Header admin/dokter.
     */
    public function cancelRequests(): JsonResponse
    {
        $bookings = Booking::with(['hewan', 'user', 'jadwal.dokter', 'layanans'])
            ->where('status', 'menunggu_pembatalan')
            ->orderBy('updated_at', 'desc')
            ->get()
            ->map(function ($b) {
                return [
                    'id'              => $b->id_booking,
                    'no_booking'      => $b->no_booking,
                    'nama_hewan'      => $b->hewan?->nama_hewan ?? '-',
                    'nama_pemilik'    => $b->user?->nama  ?? $b->user?->name  ?? '-',
                    'no_hp'           => $b->user?->no_hp ?? '-',
                    'layanan_nama'    => $b->layanans->first()?->nama_layanan ?? '-',
                    'tanggal_booking' => $b->tanggal_booking?->format('Y-m-d'),
                    'jam'             => $b->jam,
                    'no_antrian'      => $b->no_antrian,
                    'nama_dokter'     => $b->jadwal?->dokter?->nama_dokter ?? '-',
                    // pakai updated_at sebagai fallback jika kolom cancelled_at belum ada di tabel
                    'cancelled_at'    => $b->cancelled_at?->toIso8601String()
                                          ?? $b->updated_at?->toIso8601String(),
                ];
            });

        return response()->json(['success' => true, 'data' => $bookings]);
    }

    /**
     * Konfirmasi pembatalan booking oleh admin (dipanggil dari modal detail
     * notifikasi pembatalan di Header). Mengubah status jadi 'dibatalkan'.
     */
    public function confirmCancel(int $idBooking): JsonResponse
    {
        $booking = Booking::where('id_booking', $idBooking)
            ->where('status', 'menunggu_pembatalan')
            ->first();

        if (!$booking) {
            return response()->json([
                'success' => false,
                'message' => 'Booking tidak ditemukan atau bukan status menunggu pembatalan.',
            ], 404);
        }

        $booking->update(['status' => 'dibatalkan']);

        return response()->json([
            'success' => true,
            'message' => 'Pembatalan berhasil dikonfirmasi.',
        ]);
    }

    public function summary(): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data'    => [
                'total'        => Booking::count(),
                'menunggu'     => Booking::where('status', 'menunggu')->count(),
                'dikonfirmasi' => Booking::where('status', 'dikonfirmasi')->count(),
                'selesai'      => Booking::where('status', 'selesai')->count(),
                'dibatalkan'   => Booking::where('status', 'dibatalkan')->count(),
            ],
        ]);
    }

    private function formatBooking(Booking $b): array
    {
        return [
            'id'               => $b->id_booking,
            'no_booking'       => $b->no_booking,
            'no_antrian'       => $b->no_antrian,
            'tanggal_booking'  => $b->tanggal_booking?->format('Y-m-d'),
            'tanggal_dibuat'   => $b->created_at?->format('Y-m-d'),
            'jam'              => $b->jam,
            'status'           => strtolower($b->status),
            'catatan'          => $b->catatan,
            'nama_pemilik'     => $b->user?->nama  ?? $b->user?->name  ?? '-',
            'no_hp'            => $b->user?->no_hp ?? '-',
            'nama_hewan'       => $b->hewan?->nama_hewan ?? '-',
            'jenis_hewan'      => $b->hewan?->jenis      ?? '-',
            'ras_hewan'        => $b->hewan?->ras        ?? '-',
            'foto_hewan'       => $b->hewan?->foto       ?? null,
            'foto_before'      => $b->foto_before ?? null,
            'foto_after'       => $b->foto_after  ?? null,
            'tanggal_jadwal'   => $b->jadwal?->tanggal?->format('Y-m-d') ?? '-',
            'jam_mulai'        => $b->jadwal?->jam_mulai   ? substr($b->jadwal->jam_mulai,   0, 5) : '-',
            'jam_selesai'      => $b->jadwal?->jam_selesai ? substr($b->jadwal->jam_selesai, 0, 5) : '-',
            'nama_dokter'      => $b->jadwal?->dokter?->nama_dokter ?? '-',
            'layanans'         => $b->layanans->map(fn($l) => [
                'id_layanan'         => $l->id_layanan,
                'nama_layanan'       => $l->nama_layanan,
                'kategori'           => $l->kategori,
                'harga_saat_booking' => $l->pivot->harga_saat_booking,
            ])->toArray(),
            'can_edit_status'  => strtolower($b->status) !== 'selesai',
            'layanan_nama'     => $b->layanans->first()?->nama_layanan ?? '-',
        ];
    }
}