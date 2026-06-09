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

        if (in_array(strtolower($booking->status), ['berlangsung', 'selesai'])) {
            return response()->json([
                'success' => false,
                'message' => 'Booking yang sedang berlangsung atau sudah selesai tidak dapat diubah statusnya.',
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

    public function summary(): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data'    => [
                'total'               => Booking::count(),
                'menunggu'            => Booking::where('status', 'menunggu')->count(),
                'dikonfirmasi'        => Booking::where('status', 'dikonfirmasi')->count(),
                'berlangsung'         => Booking::where('status', 'berlangsung')->count(),
                'selesai'             => Booking::where('status', 'selesai')->count(),
                'dibatalkan'          => Booking::where('status', 'dibatalkan')->count(),
                'menunggu_pembatalan' => Booking::where('status', 'menunggu_pembatalan')->count(),
            ],
        ]);
    }

    public function cancelRequests(): JsonResponse
    {
        $bookings = Booking::with(['hewan', 'user', 'jadwal', 'layanans'])
            ->where('status', 'menunggu_pembatalan')
            ->where('cancel_confirmed', false)
            ->whereNotNull('cancelled_at')
            ->orderBy('cancelled_at', 'desc')
            ->get()
            ->map(fn($b) => $this->formatBooking($b));

        return response()->json([
            'success' => true,
            'data'    => $bookings,
        ]);
    }

    public function confirmCancel(int $idBooking): JsonResponse
    {
        $booking = Booking::where('id_booking', $idBooking)
            ->where('status', 'menunggu_pembatalan')
            ->firstOrFail();

        if ($booking->cancel_confirmed) {
            return response()->json([
                'success' => false,
                'message' => 'Pembatalan ini sudah pernah dikonfirmasi.',
            ], 422);
        }

        $booking->update([
            'status'           => 'dibatalkan',
            'cancel_confirmed' => true,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Pembatalan berhasil dikonfirmasi.',
            'data'    => $this->formatBooking($booking->fresh(['hewan', 'user', 'jadwal', 'layanans'])),
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
            'cancel_confirmed' => $b->cancel_confirmed,
            'cancelled_at'     => $b->cancelled_at?->toISOString(),
            'nama_pemilik'     => $b->user?->nama  ?? $b->user?->name  ?? '-',
            'no_hp'            => $b->user?->no_hp ?? '-',
            'nama_hewan'       => $b->hewan?->nama_hewan ?? '-',
            'jenis_hewan'      => $b->hewan?->jenis      ?? '-',
            'ras_hewan'        => $b->hewan?->ras        ?? '-',
            'foto_hewan'       => $b->hewan?->foto       ?? null,
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
            'can_edit_status'  => !in_array(strtolower($b->status), ['berlangsung', 'selesai']),
            'layanan_nama'     => $b->layanans->first()?->nama_layanan ?? '-',
        ];
    }
}