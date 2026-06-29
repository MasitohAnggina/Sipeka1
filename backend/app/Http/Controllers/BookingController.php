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
    public function index(Request $request): JsonResponse
    {
        $bookings = Booking::with(['hewan', 'jadwal.dokter', 'layanans'])
            ->where('id_user', $request->user()->id_user)
            ->orderBy('tanggal_booking', 'desc')
            ->get()
            ->map(fn($b) => $this->formatBooking($b));
        return response()->json(['success' => true, 'data' => $bookings]);
    }

    public function aktif(Request $request): JsonResponse
    {
        $bookings = Booking::with(['hewan', 'jadwal', 'layanans'])
            ->where('id_user', $request->user()->id_user)
            ->whereIn('status', ['menunggu', 'diproses'])
            ->orderBy('tanggal_booking', 'asc')
            ->get()
            ->map(fn($b) => $this->formatBooking($b));
        return response()->json(['success' => true, 'data' => $bookings]);
    }

    public function jadwalTersedia(Request $request): JsonResponse
    {
        $jadwal = Jadwal::with('dokter')
            ->where('status', 'aktif')
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

    public function show(Request $request, int $id): JsonResponse
    {
        $booking = Booking::with(['hewan', 'jadwal.dokter', 'layanans'])
            ->where('id_booking', $id)
            ->where('id_user', $request->user()->id_user)
            ->firstOrFail();
        return response()->json(['success' => true, 'data' => $this->formatBooking($booking)]);
    }

    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'tanggal_booking'       => 'required|date',
            'jam'                   => 'required|string',
            'id_jadwal'             => 'required|integer|exists:jadwal,id_jadwal',
            'force'                 => 'nullable|boolean',
            'items'                 => 'required|array|min:1',
            'items.*.id_hewan'      => 'required|integer|exists:hewan,id_hewan',
            'items.*.id_layanans'   => 'required|array|min:1',
            'items.*.id_layanans.*' => 'integer|exists:layanan,id_layanan',
            'items.*.catatan'       => 'nullable|string',
            'items.*.foto_before'   => 'nullable|string',
            'items.*.foto_after'    => 'nullable|string',
        ]);

        $userId   = $request->user()->id_user;
        $tanggal  = $request->tanggal_booking;
        $jam      = $request->jam;
        $jadwalId = $request->id_jadwal;
        $force    = $request->boolean('force', false);

        // ── Validasi jam dalam rentang jadwal dokter ──────────────────────────
        $jadwal = Jadwal::find($jadwalId);
        if ($jadwal) {
            $jamMulai   = $jadwal->jam_mulai   ? substr($jadwal->jam_mulai,   0, 5) : null;
            $jamSelesai = $jadwal->jam_selesai ? substr($jadwal->jam_selesai, 0, 5) : null;
            if ($jamMulai && $jamSelesai) {
                if ($jam < $jamMulai || $jam >= $jamSelesai) {
                    return response()->json([
                        'success' => false,
                        'message' => "Jam {$jam} di luar rentang jadwal dokter ({$jamMulai} – {$jamSelesai}).",
                    ], 422);
                }
            }
        }

        // ── Cek konflik slot (tanggal + jadwal + jam) ─────────────────────────
        $slotTerpakai = Booking::where('tanggal_booking', $tanggal)
            ->where('id_jadwal', $jadwalId)
            ->where('jam', $jam)
            ->whereNotIn('status', ['batal', 'menunggu_pembatalan'])
            ->count();

        $kapasitasSlot = 1; // bisa diambil dari kolom jadwal jika ada

        if ($slotTerpakai >= $kapasitasSlot && !$force) {
            return response()->json([
                'success'       => false,
                'conflict'      => true,
                'message'       => "Slot jam {$jam} pada tanggal ini sudah dipesan oleh owner lain. Anda bisa tetap memilih jam ini (akan menunggu giliran dan sedikit lebih lama) atau pilih jam lain.",
                'slot_terpakai' => $slotTerpakai,
            ], 409);
        }

        $bookings = [];

        $allLayananIds = collect($request->items)
            ->flatMap(fn($item) => $item['id_layanans'])
            ->unique()
            ->values();

        $layanans = Layanan::whereIn('id_layanan', $allLayananIds)
            ->pluck('harga', 'id_layanan');

        // Simpan foto SEBELUM transaksi DB dimulai
        $savedPhotos = [];
        foreach ($request->items as $idx => $item) {
            $savedPhotos[$idx] = [
                'before' => $this->saveBase64($item['foto_before'] ?? null, 'foto_kondisi'),
                'after'  => $this->saveBase64($item['foto_after']  ?? null, 'foto_kondisi'),
            ];
        }

        DB::beginTransaction();
        try {
            $baseAntrian = (int) Booking::where('tanggal_booking', $tanggal)
                ->lockForUpdate()
                ->max('no_antrian');

            foreach ($request->items as $idx => $item) {
                $baseAntrian++;
                $booking = Booking::create([
                    'no_booking'       => Booking::generateNoBooking(),
                    'id_user'          => $userId,
                    'id_hewan'         => $item['id_hewan'],
                    'id_jadwal'        => $jadwalId,
                    'tanggal_booking'  => $tanggal,
                    'tanggal_dibuat'   => now()->toDateString(),
                    'jam'              => $jam,
                    'catatan'          => $item['catatan'] ?? null,
                    'foto_before'      => $savedPhotos[$idx]['before'],
                    'foto_after'       => $savedPhotos[$idx]['after'],
                    'no_antrian'       => $baseAntrian,
                    'status'           => 'menunggu',
                    'cancel_confirmed' => false,
                    'cancelled_at'     => null,
                ]);

                $pivotData = [];
                foreach ($item['id_layanans'] as $idLayanan) {
                    $pivotData[$idLayanan] = [
                        'harga_saat_booking' => $layanans[$idLayanan] ?? 0,
                    ];
                }
                $booking->layanans()->attach($pivotData);

                $bookings[] = [
                    'no_booking' => $booking->no_booking,
                    'no_antrian' => $booking->no_antrian,
                    'id_hewan'   => $booking->id_hewan,
                    'id_booking' => $booking->id_booking,
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
            foreach ($savedPhotos as $photos) {
                if ($photos['before']) Storage::disk('public')->delete($photos['before']);
                if ($photos['after'])  Storage::disk('public')->delete($photos['after']);
            }
            return response()->json([
                'success' => false,
                'message' => 'Gagal membuat booking: ' . $e->getMessage(),
            ], 500);
        }
    }

    public function cancel(Request $request, int $id): JsonResponse
    {
        $booking = Booking::where('id_booking', $id)
            ->where('id_user', $request->user()->id_user)
            ->firstOrFail();

        $status = strtolower($booking->status);
        if (!in_array($status, ['menunggu', 'dikonfirmasi'])) {
            return response()->json([
                'success' => false,
                'message' => 'Booking tidak dapat dibatalkan.',
            ], 422);
        }

        $booking->update([
            'status'           => 'menunggu_pembatalan',
            'cancel_confirmed' => false,
            'cancelled_at'     => now(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Permintaan pembatalan telah dikirim. Menunggu konfirmasi admin.',
        ]);
    }

    private function formatBooking(Booking $b): array
    {
        return [
            'id_booking'       => $b->id_booking,
            'no_booking'       => $b->no_booking,
            'no_antrian'       => $b->no_antrian,
            'status'           => strtolower($b->status),
            'tanggal_booking'  => $b->tanggal_booking?->format('Y-m-d'),
            'jam'              => $b->jam,
            'catatan'          => $b->catatan,
            'cancel_confirmed' => $b->cancel_confirmed,
            'cancelled_at'     => $b->cancelled_at?->toISOString(),
            'foto_before'      => $b->foto_before ? Storage::url($b->foto_before) : null,
            'foto_after'       => $b->foto_after  ? Storage::url($b->foto_after)  : null,
            'hewan'            => $b->hewan ? [
                'id_hewan' => $b->hewan->id_hewan,
                'name'     => $b->hewan->name ?? $b->hewan->nama_hewan,
                'type'     => $b->hewan->type ?? $b->hewan->jenis,
                'breed'    => $b->hewan->breed ?? $b->hewan->ras,
            ] : null,
            'jadwal'           => $b->jadwal ? [
                'id_jadwal'   => $b->jadwal->id_jadwal,
                'tanggal'     => $b->jadwal->tanggal?->format('Y-m-d'),
                'hari'        => $b->jadwal->hari,
                'jam_mulai'   => $b->jadwal->jam_mulai   ? substr($b->jadwal->jam_mulai,   0, 5) : null,
                'jam_selesai' => $b->jadwal->jam_selesai ? substr($b->jadwal->jam_selesai, 0, 5) : null,
                'nama_dokter' => $b->jadwal->dokter?->nama_dokter ?? null,
            ] : null,
            'layanans'         => $b->layanans->map(fn($l) => [
                'id_layanan'         => $l->id_layanan,
                'nama_layanan'       => $l->nama_layanan,
                'kategori'           => $l->kategori,
                'harga_saat_booking' => $l->pivot->harga_saat_booking,
            ])->toArray(),
        ];
    }

    private function saveBase64(?string $data, string $folder): ?string
    {
        if (!$data || !str_contains($data, 'base64,')) {
            return null;
        }
        try {
            [, $base64] = explode('base64,', $data);
            $binary = base64_decode($base64);
            $ext    = 'jpg';
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