<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Concerns\ScopesByUnit;
use App\Http\Controllers\Controller;
use App\Models\Employee;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

/**
 * Employee Directory (PII) — server-enforced, unit-scoped.
 *
 * The directory is imported ONCE to the server by an admin (people.manage);
 * every read is row-level scoped (scopeToUser) so a KPI Partner receives only
 * their unit's employees and a Manajemen partner only their directorate. The
 * response is the raw Employee payloads, ready to hydrate the client cache.
 */
class EmployeeController extends Controller
{
    use ScopesByUnit;

    public function index(Request $request): JsonResponse
    {
        $rows = $this->scopeToUser(Employee::query(), $request->user())
            ->orderBy('id')
            ->get()
            ->map(fn (Employee $e) => $e->payload);

        return response()->json(['data' => $rows]);
    }

    /** Bulk import/replace the directory (admin only). Upserts by NPK. */
    public function import(Request $request): JsonResponse
    {
        $request->validate([
            'employees' => ['required', 'array', 'min:1'],
            'employees.*.npk' => ['required'],
            'replace' => ['nullable', 'boolean'], // first chunk may clear the table
        ]);

        // Read the FULL objects (validate() would strip un-ruled fields like name/unit).
        $employees = (array) $request->input('employees', []);
        $replace = $request->boolean('replace');
        $user = $request->user();

        DB::transaction(function () use ($employees, $replace, $user) {
            if ($replace) {
                Employee::query()->delete();
            }
            foreach ($employees as $emp) {
                $npk = (string) ($emp['npk'] ?? '');
                if ($npk === '') {
                    continue;
                }
                Employee::updateOrCreate(
                    ['npk' => $npk],
                    [
                        'name' => (string) ($emp['name'] ?? ''),
                        'unit_name' => (string) ($emp['unit'] ?? ''),
                        'directorate' => (string) ($emp['directorate'] ?? ''),
                        'payload' => $emp,
                        'created_by' => $user->id,
                        'updated_by' => $user->id,
                    ]
                );
            }
        });

        return response()->json(['data' => ['imported' => count($employees), 'total' => Employee::count()]]);
    }

    /** Clear the whole directory (admin only). */
    public function clear(Request $request): JsonResponse
    {
        Employee::query()->delete();

        return response()->json(['data' => ['cleared' => true]]);
    }
}
