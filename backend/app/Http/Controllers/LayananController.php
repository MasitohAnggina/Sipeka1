<?php

namespace App\Http\Controllers;

use App\Models\Layanan;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class LayananController extends Controller
{
    // GET /api/layanan
    public function index(Request $request): JsonResponse
    {
        $q = Layanan::query();
        if ($request->nama)     $q->where('nama_layanan', 'like', '%' . $request->nama . '%');
        if ($request->kategori) $q->where('kategori', $request->kategori);
        if ($request->status)   $q->where('status', $request->status);

        return response()->json(['success' => true, 'data' => $q->get()]);
    }

    // GET /api/layanan/publik
    public function publik(): JsonResponse
    {
        $layanan = Layanan::where('status', 'Aktif')
            ->orderBy('kategori')->orderBy('nama_layanan')
            ->get()
            ->map(fn($l) => [
                'id'             => (string) $l->id_layanan,
                'id_layanan'     => $l->id_layanan,
                'name'           => $l->nama_layanan,
                'nama_layanan'   => $l->nama_layanan,
                'icon'           => $this->iconMap($l->kategori),
                'kategori'       => $l->kategori,
                'sub_kategori'   => $l->sub_kategori,
                'harga'          => (float) $l->harga,
                'durasi'         => $l->durasi,
                'satuan_durasi'  => $l->satuan_durasi ?? 'menit', // ← tambah
                'deskripsi'      => $l->deskripsi,
            ]);

        return response()->json(['success' => true, 'data' => $layanan]);
    }

    // POST /api/layanan
    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'nama_layanan'  => 'required|string',
            'kategori'      => 'required|string',
            'harga'         => 'required|numeric|min:0',
            'satuan_durasi' => 'nullable|in:menit,jam,hari', // ← tambah
            'sub_kategori'  => 'nullable|string',
            'durasi'        => 'nullable|integer',
            'kapasitas'     => 'nullable|integer',
            'deskripsi'     => 'nullable|string',
            'status'        => 'in:Aktif,Nonaktif',
        ]);

        $l = Layanan::create([
            'nama_layanan'  => $request->nama_layanan,
            'kategori'      => $request->kategori,
            'sub_kategori'  => $request->sub_kategori,
            'durasi'        => $request->durasi,
            'satuan_durasi' => $request->satuan_durasi ?? 'menit', // ← tambah
            'harga'         => $request->harga,
            'kapasitas'     => $request->kapasitas,
            'deskripsi'     => $request->deskripsi,
            'status'        => $request->status ?? 'Aktif',
        ]);

        return response()->json(['success' => true, 'message' => 'Layanan berhasil ditambahkan.', 'data' => $l], 201);
    }

    // PUT /api/layanan/{id}
    public function update(Request $request, int $id): JsonResponse
    {
        $l = Layanan::findOrFail($id);

        $request->validate([
            'nama_layanan'  => 'required|string',
            'kategori'      => 'required|string',
            'harga'         => 'required|numeric|min:0',
            'satuan_durasi' => 'nullable|in:menit,jam,hari', // ← tambah
            'sub_kategori'  => 'nullable|string',
            'durasi'        => 'nullable|integer',
            'kapasitas'     => 'nullable|integer',
            'deskripsi'     => 'nullable|string',
            'status'        => 'in:Aktif,Nonaktif',
        ]);

        $l->update([
            'nama_layanan'  => $request->nama_layanan,
            'kategori'      => $request->kategori,
            'sub_kategori'  => $request->sub_kategori,
            'durasi'        => $request->durasi,
            'satuan_durasi' => $request->satuan_durasi ?? $l->satuan_durasi, // ← tambah
            'harga'         => $request->harga,
            'kapasitas'     => $request->kapasitas,
            'deskripsi'     => $request->deskripsi,
            'status'        => $request->status,
        ]);

        return response()->json(['success' => true, 'message' => 'Layanan berhasil diperbarui.', 'data' => $l->fresh()]);
    }

    // DELETE /api/layanan/{id}
    public function destroy(int $id): JsonResponse
    {
        Layanan::findOrFail($id)->delete();
        return response()->json(['success' => true, 'message' => 'Layanan berhasil dihapus.']);
    }

    private function iconMap(string $k): string
    {
        return match (strtolower($k)) {
            'medis'        => '🩺',
            'grooming'     => '✂️',
            'hotel hewan'  => '🏠',
            'vaksin'       => '💉',
            'bedah'        => '🔬',
            default        => '🐾',
        };
    }
}