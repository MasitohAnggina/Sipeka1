<?php

namespace App\Http\Controllers;

use App\Models\Booking;
use App\Models\Dokter;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class BookingDokterController extends Controller
{
    private function getDokter(Request $request)
    {
        return Dokter::where('id_user', $request->user()->id_user)->first();
    }

    // ── Helper: base query untuk dokter yang sedang login ────────────────────
    private function baseQuery(Dokter $dokter)
    {
        return Booking::with(['hewan', 'user', 'jadwal', 'layanans'])
            ->whereHas('jadwal', fn($q) => $q->where('id_dokter', $dokter->id_dokter));
    }

    // =========================================================================
    //  GET /api/dokter/booking
    //  Query params: pemilik, tanggal, layanan, status, page, per_page
    // =========================================================================
    public function index(Request $request): JsonResponse
    {
        $dokter = $this->getDokter($request);
        if (!$dokter) {
            return response()->json(['success' => false, 'message' => 'Data dokter tidak ditemukan'], 404);
        }

        // ── Filter server-side ───────────────────────────────────────────────
        $query = $this->baseQuery($dokter);

        if ($request->filled('pemilik')) {
            $keyword = $request->pemilik;
            $query->whereHas('user', fn($q) =>
                $q->where('nama', 'like', "%{$keyword}%")
                  ->orWhere('name', 'like', "%{$keyword}%")
            );
        }

        if ($request->filled('tanggal')) {
            $query->whereDate('tanggal_booking', $request->tanggal);
        }

        if ($request->filled('layanan')) {
            $query->whereHas('layanans', fn($q) =>
                $q->where('nama_layanan', $request->layanan)
            );
        }

        // Hanya izinkan status yang relevan untuk dokter
        $allowedStatuses = ['menunggu', 'dikonfirmasi', 'selesai', 'dibatalkan'];
        if ($request->filled('status') && in_array($request->status, $allowedStatuses)) {
            $query->where('status', $request->status);
        }

        // ── Pagination ───────────────────────────────────────────────────────
        $perPage  = min((int) $request->get('per_page', 15), 100); // max 100/page
        $bookings = $query
            ->orderBy('tanggal_booking', 'desc')
            ->orderBy('jam', 'asc')
            ->paginate($perPage);

        // ── Summary counts (selalu dari semua data, tanpa filter) ────────────
        $baseCount    = $this->baseQuery($dokter);
        $counts = [
            'total'        => (clone $baseCount)->count(),
            'menunggu'     => (clone $baseCount)->where('status', 'menunggu')->count(),
            'dikonfirmasi' => (clone $baseCount)->where('status', 'dikonfirmasi')->count(),
        ];

        return response()->json([
            'success' => true,
            'data'    => collect($bookings->items())->map(fn($b) => $this->formatBooking($b)),
            'meta'    => [
                'current_page' => $bookings->currentPage(),
                'last_page'    => $bookings->lastPage(),
                'per_page'     => $bookings->perPage(),
                'total'        => $bookings->total(),
            ],
            'counts'  => $counts,
        ]);
    }

    // =========================================================================
    //  PATCH /api/dokter/booking/{id}/status
    //  Dokter hanya boleh mengubah status "dikonfirmasi" → "selesai"
    // =========================================================================
    public function updateStatus(Request $request, int $idBooking): JsonResponse
    {
        $dokter = $this->getDokter($request);
        if (!$dokter) {
            return response()->json(['success' => false, 'message' => 'Data dokter tidak ditemukan'], 404);
        }

        $booking = Booking::whereHas('jadwal', fn($q) => $q->where('id_dokter', $dokter->id_dokter))
            ->where('id_booking', $idBooking)
            ->firstOrFail();

        $validated = $request->validate([
            'status' => ['required', Rule::in(['selesai'])],
        ]);

        if ($booking->status !== 'dikonfirmasi') {
            return response()->json([
                'success' => false,
                'message' => 'Status hanya dapat diubah menjadi selesai jika booking sudah dikonfirmasi.',
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

    // =========================================================================
    //  PRIVATE: format satu booking untuk response JSON
    // =========================================================================
    private function formatBooking(Booking $b): array
    {
        return [
            'id'              => $b->id_booking,
            'no_booking'      => $b->no_booking,
            'no_antrian'      => $b->no_antrian,
            'tanggal_booking' => $b->tanggal_booking?->format('Y-m-d'),
            'tanggal_dibuat'  => $b->created_at?->format('Y-m-d'),
            'jam'             => $b->jam,
            'status'          => $b->status,
            'catatan'         => $b->catatan,

            // Pemilik
            'nama_pemilik'    => $b->user?->nama  ?? $b->user?->name  ?? '-',
            'no_hp'           => $b->user?->no_hp ?? '-',

            // Hewan
            'nama_hewan'      => $b->hewan?->nama_hewan ?? $b->hewan?->name  ?? '-',
            'jenis_hewan'     => $b->hewan?->jenis      ?? $b->hewan?->type  ?? '-',
            'ras_hewan'       => $b->hewan?->ras        ?? $b->hewan?->breed ?? '-',
            'foto_hewan'      => $b->hewan?->foto       ?? null,
            'foto_before'     => $b->foto_before        ?? null,
            'foto_after'      => $b->foto_after         ?? null,

            // Jadwal & dokter
            'tanggal_jadwal'  => $b->jadwal?->tanggal?->format('Y-m-d') ?? '-',
            'jam_mulai'       => $b->jadwal?->jam_mulai   ? substr($b->jadwal->jam_mulai,   0, 5) : '-',
            'jam_selesai'     => $b->jadwal?->jam_selesai ? substr($b->jadwal->jam_selesai, 0, 5) : '-',
            'nama_dokter'     => $b->jadwal?->dokter?->nama_dokter ?? '-',

            // Layanan
            'layanans'        => $b->layanans->map(fn($l) => [
                'id_layanan'         => $l->id_layanan,
                'nama_layanan'       => $l->nama_layanan,
                'kategori'           => $l->kategori,
                'harga_saat_booking' => $l->pivot->harga_saat_booking,
            ])->toArray(),
        ];
    }
}