<?php

namespace App\Http\Controllers;

use App\Models\Hewan;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;

class HewanController extends Controller
{
    private function emojiMap(string $jenis): string
    {
        return match (strtolower($jenis)) {
            'anjing'  => '🐕',
            'kucing'  => '🐈',
            'kelinci' => '🐇',
            'hamster' => '🐹',
            'burung'  => '🐦',
            default   => '🐾',
        };
    }

    private function fmt(Hewan $h): array
    {
        return [
            'id_hewan'   => $h->id_hewan,
            'id'         => (string) $h->id_hewan,
            'name'       => $h->nama_hewan,
            'type'       => $h->jenis,
            'breed'      => $h->ras ?? '-',
            'age'        => $h->umur !== null ? $h->umur . ' Tahun' : '-',
            'weight'     => $h->berat !== null ? $h->berat . ' Kg' : '-',
            'emoji'      => $this->emojiMap($h->jenis),
            'photo'      => $h->foto ? asset('storage/' . $h->foto) : null,
            // raw untuk form edit
            'nama_hewan' => $h->nama_hewan,
            'jenis'      => $h->jenis,
            'ras'        => $h->ras,
            'umur'       => $h->umur,
            'berat'      => $h->berat,
        ];
    }

    // GET /api/hewan
    public function index(Request $request): JsonResponse
    {
        $hewan = Hewan::where('id_user', $request->user()->id_user)
            ->orderBy('created_at', 'desc')->get()
            ->map(fn($h) => $this->fmt($h));

        return response()->json(['success' => true, 'data' => $hewan]);
    }

    // POST /api/hewan
    public function store(Request $request): JsonResponse
    {
        $v = Validator::make($request->all(), [
            'nama_hewan' => 'required|string|max:255',
            'jenis'      => 'required|string|max:255',
            'ras'        => 'nullable|string|max:255',
            'umur'       => 'nullable|integer|min:0',
            'berat'      => 'nullable|numeric|min:0',
            'foto'       => 'nullable|image|mimes:jpg,jpeg,png,webp|max:5120',
            'foto_base64'=> 'nullable|string',
        ]);
        if ($v->fails()) return response()->json(['success'=>false,'errors'=>$v->errors()], 422);

        $data = [
            'id_user'    => $request->user()->id_user,
            'nama_hewan' => $request->nama_hewan,
            'jenis'      => $request->jenis,
            'ras'        => $request->ras,
            'umur'       => $request->umur,
            'berat'      => $request->berat,
        ];

        if ($request->hasFile('foto')) {
            $data['foto'] = $request->file('foto')->store('foto_hewan', 'public');
        } elseif ($request->filled('foto_base64')) {
            $data['foto'] = $this->saveBase64($request->foto_base64, 'foto_hewan');
        }

        $hewan = Hewan::create($data);
        return response()->json(['success'=>true,'message'=>'Hewan berhasil ditambahkan.','data'=>$this->fmt($hewan)], 201);
    }

    // GET /api/hewan/{id}
    public function show(Request $request, int $id): JsonResponse
    {
        $h = Hewan::where('id_hewan', $id)->where('id_user', $request->user()->id_user)->firstOrFail();
        return response()->json(['success'=>true,'data'=>$this->fmt($h)]);
    }

    // PUT /api/hewan/{id}
    public function update(Request $request, int $id): JsonResponse
    {
        $h = Hewan::where('id_hewan', $id)->where('id_user', $request->user()->id_user)->firstOrFail();

        $v = Validator::make($request->all(), [
            'nama_hewan' => 'sometimes|string|max:255',
            'jenis'      => 'sometimes|string|max:255',
            'ras'        => 'nullable|string|max:255',
            'umur'       => 'nullable|integer|min:0',
            'berat'      => 'nullable|numeric|min:0',
            'foto'       => 'nullable|image|mimes:jpg,jpeg,png,webp|max:5120',
            'foto_base64'=> 'nullable|string',
        ]);
        if ($v->fails()) return response()->json(['success'=>false,'errors'=>$v->errors()], 422);

        $data = $request->only(['nama_hewan','jenis','ras','umur','berat']);

        if ($request->hasFile('foto')) {
            if ($h->foto) Storage::disk('public')->delete($h->foto);
            $data['foto'] = $request->file('foto')->store('foto_hewan', 'public');
        } elseif ($request->filled('foto_base64')) {
            if ($h->foto) Storage::disk('public')->delete($h->foto);
            $data['foto'] = $this->saveBase64($request->foto_base64, 'foto_hewan');
        }

        $h->update($data);
        return response()->json(['success'=>true,'message'=>'Data hewan berhasil diperbarui.','data'=>$this->fmt($h->fresh())]);
    }

    // DELETE /api/hewan/{id}
    public function destroy(Request $request, int $id): JsonResponse
    {
        $h = Hewan::where('id_hewan', $id)->where('id_user', $request->user()->id_user)->firstOrFail();
        if ($h->foto) Storage::disk('public')->delete($h->foto);
        $h->delete();
        return response()->json(['success'=>true,'message'=>'Hewan berhasil dihapus.']);
    }

    // ── Helper base64 ─────────────────────────────────────────────────────────
    private function saveBase64(string $b64, string $folder): ?string
    {
        if (!str_contains($b64, ',')) return null;
        [$meta, $data] = explode(',', $b64, 2);
        preg_match('/data:image\/(\w+);base64/', $meta, $m);
        $ext      = $m[1] ?? 'jpg';
        $filename = $folder . '/' . uniqid() . '.' . $ext;
        Storage::disk('public')->put($filename, base64_decode($data));
        return $filename;
    }
}