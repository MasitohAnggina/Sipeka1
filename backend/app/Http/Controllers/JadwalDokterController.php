<?php

namespace App\Http\Controllers;

use App\Models\Jadwal;
use App\Models\Dokter;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Validation\Rule;
use Carbon\Carbon;

class JadwalDokterController extends Controller
{
    private function getDokter(Request $request)
    {
        return Dokter::where('id_user', $request->user()->id_user)->first();
    }

    public function index(Request $request): JsonResponse
    {
        $dokter = $this->getDokter($request);
        if (!$dokter) return response()->json(['message' => 'Data dokter tidak ditemukan'], 404);

        $jadwal = Jadwal::where('id_dokter', $dokter->id_dokter)
            ->orderBy('tanggal', 'asc')
            ->get()
            ->map(fn($j) => $this->formatJadwal($j));

        return response()->json(['success' => true, 'data' => $jadwal]);
    }

    public function store(Request $request): JsonResponse
    {
        $dokter = $this->getDokter($request);
        if (!$dokter) return response()->json(['message' => 'Data dokter tidak ditemukan'], 404);

        $validated = $request->validate([
            'tanggal'     => ['required', 'date', 'after_or_equal:today',
                              Rule::unique('jadwal')->where('id_dokter', $dokter->id_dokter)],
            'jam_mulai'   => ['nullable', 'date_format:H:i', 'required_if:status,Aktif'],
            'jam_selesai' => ['nullable', 'date_format:H:i', 'required_if:status,Aktif', 'after:jam_mulai'],
            'status'      => ['required', Rule::in(['Aktif', 'Libur'])],
        ], [
            'tanggal.unique'          => 'Jadwal pada tanggal ini sudah ada.',
            'tanggal.after_or_equal'  => 'Tanggal tidak boleh sebelum hari ini.',
            'jam_selesai.after'       => 'Jam selesai harus setelah jam mulai.',
            'jam_mulai.required_if'   => 'Jam mulai wajib diisi jika status Aktif.',
            'jam_selesai.required_if' => 'Jam selesai wajib diisi jika status Aktif.',
        ]);

        $tanggal = Carbon::parse($validated['tanggal']);

        $jadwal = Jadwal::create([
            'id_dokter'   => $dokter->id_dokter,
            'tanggal'     => $validated['tanggal'],
            'hari'        => $tanggal->locale('id')->isoFormat('dddd'),
            'jam_mulai'   => $validated['status'] === 'Aktif' ? $validated['jam_mulai']   : null,
            'jam_selesai' => $validated['status'] === 'Aktif' ? $validated['jam_selesai'] : null,
            'durasi'      => $validated['status'] === 'Aktif'
                                ? Jadwal::hitungDurasi($validated['jam_mulai'], $validated['jam_selesai'])
                                : null,
            'status'      => $validated['status'],
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Jadwal berhasil ditambahkan.',
            'data'    => $this->formatJadwal($jadwal),
        ], 201);
    }

    public function update(Request $request, int $idJadwal): JsonResponse
    {
        $dokter = $this->getDokter($request);
        if (!$dokter) return response()->json(['message' => 'Data dokter tidak ditemukan'], 404);

        $jadwal = Jadwal::where('id_jadwal', $idJadwal)
            ->where('id_dokter', $dokter->id_dokter)
            ->firstOrFail();

        $validated = $request->validate([
            'tanggal'     => ['required', 'date', 'after_or_equal:today',
                              Rule::unique('jadwal')->where('id_dokter', $dokter->id_dokter)->ignore($idJadwal, 'id_jadwal')],
            'jam_mulai'   => ['nullable', 'date_format:H:i', 'required_if:status,Aktif'],
            'jam_selesai' => ['nullable', 'date_format:H:i', 'required_if:status,Aktif', 'after:jam_mulai'],
            'status'      => ['required', Rule::in(['Aktif', 'Libur'])],
        ]);

        $tanggal = Carbon::parse($validated['tanggal']);

        $jadwal->update([
            'tanggal'     => $validated['tanggal'],
            'hari'        => $tanggal->locale('id')->isoFormat('dddd'),
            'jam_mulai'   => $validated['status'] === 'Aktif' ? $validated['jam_mulai']   : null,
            'jam_selesai' => $validated['status'] === 'Aktif' ? $validated['jam_selesai'] : null,
            'durasi'      => $validated['status'] === 'Aktif'
                                ? Jadwal::hitungDurasi($validated['jam_mulai'], $validated['jam_selesai'])
                                : null,
            'status'      => $validated['status'],
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Jadwal berhasil diperbarui.',
            'data'    => $this->formatJadwal($jadwal->fresh()),
        ]);
    }

    public function updateStatus(Request $request, int $idJadwal): JsonResponse
    {
        $dokter = $this->getDokter($request);
        if (!$dokter) return response()->json(['message' => 'Data dokter tidak ditemukan'], 404);

        $jadwal = Jadwal::where('id_jadwal', $idJadwal)
            ->where('id_dokter', $dokter->id_dokter)
            ->firstOrFail();

        $validated = $request->validate([
            'status' => ['required', Rule::in(['Aktif', 'Libur'])],
        ]);

        $updateData = ['status' => $validated['status']];

        if ($validated['status'] === 'Aktif') {
            $updateData['jam_mulai']   = $jadwal->jam_mulai   ?? '09:00';
            $updateData['jam_selesai'] = $jadwal->jam_selesai ?? '17:00';
            $updateData['durasi']      = Jadwal::hitungDurasi($updateData['jam_mulai'], $updateData['jam_selesai']);
        } else {
            $updateData['jam_mulai']   = null;
            $updateData['jam_selesai'] = null;
            $updateData['durasi']      = null;
        }

        $jadwal->update($updateData);

        return response()->json([
            'success' => true,
            'message' => 'Status jadwal berhasil diperbarui.',
            'data'    => $this->formatJadwal($jadwal->fresh()),
        ]);
    }

    public function destroy(Request $request, int $idJadwal): JsonResponse
    {
        $dokter = $this->getDokter($request);
        if (!$dokter) return response()->json(['message' => 'Data dokter tidak ditemukan'], 404);

        $jadwal = Jadwal::where('id_jadwal', $idJadwal)
            ->where('id_dokter', $dokter->id_dokter)
            ->firstOrFail();

        $jadwal->delete();

        return response()->json(['success' => true, 'message' => 'Jadwal berhasil dihapus.']);
    }

    /**
 * GET /admin/jadwal
 * Ambil semua jadwal semua dokter (untuk admin)
 */
public function adminIndex(Request $request): JsonResponse
{
    $jadwal = Jadwal::with('dokter')
        ->orderBy('tanggal', 'asc')
        ->get()
        ->map(fn($j) => array_merge($this->formatJadwal($j), [
            'nama_dokter' => $j->dokter->nama_dokter ?? '-',
            'id_dokter'   => $j->id_dokter,
        ]));

    return response()->json(['success' => true, 'data' => $jadwal]);
}
    private function formatJadwal(Jadwal $j): array
    {
        return [
            'id'          => $j->id_jadwal,
            'tanggal'     => $j->tanggal?->format('Y-m-d'),
            'hari'        => $j->hari,
            'jam_mulai'   => $j->jam_mulai   ? substr($j->jam_mulai,   0, 5) : null,
            'jam_selesai' => $j->jam_selesai ? substr($j->jam_selesai, 0, 5) : null,
            'durasi'      => $j->durasi,
            'status'      => $j->status,
        ];
    }
}