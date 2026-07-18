<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ProgressPin;
use App\Models\ProgressRecord;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ProgressController extends Controller
{
    /**
     * Publish a period's per-employee KPI progress + access PINs (Admin).
     * Upserts one row per (period, NPK) so re-publishing a period is idempotent.
     */
    public function publish(Request $request): JsonResponse
    {
        $data = $request->validate([
            'period' => ['required', 'array'],
            'period.id' => ['required', 'string'],
            'period.year' => ['required', 'integer'],
            'period.gran' => ['required', 'string'],
            'period.value' => ['required', 'integer'],
            'period.label' => ['nullable', 'string'],
            'records' => ['required', 'array'],
            'records.*.npk' => ['required', 'string'],
            'records.*.name' => ['nullable', 'string'],
            'records.*.position' => ['nullable', 'string'],
            'records.*.unit' => ['nullable', 'string'],
            'records.*.directorate' => ['nullable', 'string'],
            'records.*.compartment' => ['nullable', 'string'],
            'records.*.metrics' => ['required', 'array'],
            'pins' => ['array'],
        ]);

        $p = $data['period'];
        $now = now();
        $records = 0;

        foreach ($data['records'] as $r) {
            $npk = trim((string) ($r['npk'] ?? ''));
            if ($npk === '') {
                continue;
            }
            ProgressRecord::updateOrCreate(
                ['period_id' => $p['id'], 'npk' => $npk],
                [
                    'year' => $p['year'],
                    'gran' => $p['gran'],
                    'value' => $p['value'],
                    'name' => $r['name'] ?? null,
                    'position' => $r['position'] ?? null,
                    'unit' => $r['unit'] ?? null,
                    'directorate' => $r['directorate'] ?? null,
                    'compartment' => $r['compartment'] ?? null,
                    'metrics' => $r['metrics'],
                    'period_label' => $p['label'] ?? null,
                    'published_at' => $now,
                ]
            );
            $records++;
        }

        $pins = 0;
        foreach (($data['pins'] ?? []) as $npk => $pin) {
            $npk = trim((string) $npk);
            $pin = trim((string) $pin);
            if ($npk === '' || $pin === '') {
                continue;
            }
            ProgressPin::updateOrCreate(['npk' => $npk], ['pin' => $pin]);
            $pins++;
        }

        return response()->json(['records' => $records, 'pins' => $pins, 'period' => $p['id']]);
    }

    /**
     * Public: an employee looks up their own latest progress by NPK + PIN.
     * No login. Rate-limited at the route to blunt PIN guessing.
     */
    public function lookup(Request $request): JsonResponse
    {
        $data = $request->validate([
            'npk' => ['required', 'string'],
            'pin' => ['required', 'string'],
        ]);

        $npk = trim($data['npk']);
        $pin = trim($data['pin']);

        $pinRow = ProgressPin::where('npk', $npk)->first();
        if (! $pinRow || ! hash_equals((string) $pinRow->pin, $pin)) {
            return response()->json(['message' => 'NPK atau PIN salah, atau akses belum diaktifkan.'], 403);
        }

        $rec = ProgressRecord::where('npk', $npk)
            ->orderByDesc('year')
            ->orderByDesc('value')
            ->orderByDesc('published_at')
            ->first();

        if (! $rec) {
            return response()->json(['message' => 'Data progress Anda belum dipublikasikan.'], 404);
        }

        return response()->json([
            'npk' => $rec->npk,
            'name' => $rec->name,
            'position' => $rec->position,
            'unit' => $rec->unit,
            'directorate' => $rec->directorate,
            'compartment' => $rec->compartment,
            'metrics' => $rec->metrics,
            'period' => $rec->period_label ?: ($rec->year.' · '.$rec->gran),
        ]);
    }
}
