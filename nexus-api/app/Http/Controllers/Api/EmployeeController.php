<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Concerns\ScopesByUnit;
use App\Http\Controllers\Controller;
use App\Models\Employee;
use App\Support\Audit;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

/**
 * Employee Directory (PII) — server-enforced, unit-scoped, quarterly-versioned.
 *
 * The directory is imported per Triwulan (period, e.g. "TW1-2026") by an admin
 * (people.manage). Each import is a SNAPSHOT for that quarter: importing a new
 * period never touches earlier ones, so a person's position history is kept
 * across quarters. Every read is row-level scoped (scopeToUser) so a KPI Partner
 * receives only their unit's employees and a Manajemen partner only their scope.
 */
class EmployeeController extends Controller
{
    use ScopesByUnit;

    /**
     * List employees for one quarter (defaults to the latest available within
     * the caller's scope). Response payloads hydrate the client cache directly.
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $period = trim((string) $request->query('period', ''));

        if ($period === '') {
            $period = $this->latestPeriod($user); // newest quarter the user can see
        }

        $rows = $period === ''
            ? collect()
            : $this->scopeToUser(Employee::query(), $user)
                ->where('period', $period)
                ->orderBy('id')
                ->get()
                ->map(fn (Employee $e) => $e->payload);

        return response()->json(['data' => $rows, 'meta' => ['period' => $period]]);
    }

    /** The distinct quarters available within the caller's scope, newest first. */
    public function periods(Request $request): JsonResponse
    {
        $periods = $this->scopeToUser(Employee::query(), $request->user())
            ->select('period')
            ->distinct()
            ->pluck('period')
            ->filter()
            ->sortByDesc(fn ($p) => Employee::periodSortKey($p))
            ->values();

        return response()->json(['data' => $periods]);
    }

    /**
     * Full position history for one employee across every quarter (scoped).
     * Returns one entry per period so the UI can show how their jabatan changed.
     */
    public function history(Request $request, string $npk): JsonResponse
    {
        $rows = $this->scopeToUser(Employee::query(), $request->user())
            ->where('npk', $npk)
            ->get()
            ->sortByDesc(fn (Employee $e) => Employee::periodSortKey($e->period))
            ->map(fn (Employee $e) => ['period' => $e->period, 'payload' => $e->payload])
            ->values();

        return response()->json(['data' => $rows]);
    }

    /**
     * Bulk import/replace ONE quarter's directory (admin only). Upserts by
     * (npk, period); `replace` clears only that period first, never other
     * quarters. Sent chunked by the client with replace=true on the first chunk.
     */
    public function import(Request $request): JsonResponse
    {
        $request->validate([
            'period' => ['required', 'string', 'regex:/^TW[1-4]-\d{4}$/'],
            'employees' => ['required', 'array', 'min:1'],
            'employees.*.npk' => ['required'],
            'replace' => ['nullable', 'boolean'], // first chunk clears THIS period
        ]);

        // Read the FULL objects (validate() would strip un-ruled fields like name/unit).
        $period = (string) $request->input('period');
        $employees = (array) $request->input('employees', []);
        $replace = $request->boolean('replace');
        $user = $request->user();

        DB::transaction(function () use ($employees, $period, $replace, $user) {
            if ($replace) {
                Employee::query()->where('period', $period)->delete();
            }
            foreach ($employees as $emp) {
                $npk = (string) ($emp['npk'] ?? '');
                if ($npk === '') {
                    continue;
                }
                Employee::updateOrCreate(
                    ['npk' => $npk, 'period' => $period],
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

        $inPeriod = Employee::query()->where('period', $period)->count();
        Audit::record('employee.import', ['meta' => [
            'period' => $period, 'count' => count($employees), 'replace' => $replace, 'total' => $inPeriod,
        ]]);

        return response()->json(['data' => ['imported' => count($employees), 'total' => $inPeriod, 'period' => $period]]);
    }

    /**
     * Clear the directory (admin only). With `period`, clears only that quarter;
     * without it, clears every quarter (full wipe — kept for explicit resets).
     */
    public function clear(Request $request): JsonResponse
    {
        $period = trim((string) ($request->query('period', $request->input('period', ''))));

        $query = Employee::query();
        if ($period !== '') {
            $query->where('period', $period);
        }
        $query->delete();

        Audit::record('employee.clear', ['user' => $request->user(), 'meta' => ['period' => $period ?: 'all']]);

        return response()->json(['data' => ['cleared' => true, 'period' => $period ?: 'all']]);
    }

    /** Newest quarter (by chronological order) visible to this user, or '' if none. */
    private function latestPeriod($user): string
    {
        return (string) ($this->scopeToUser(Employee::query(), $user)
            ->select('period')
            ->distinct()
            ->pluck('period')
            ->filter()
            ->sortByDesc(fn ($p) => Employee::periodSortKey($p))
            ->first() ?? '');
    }
}
