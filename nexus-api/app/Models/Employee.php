<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Employee extends Model
{
    protected $fillable = [
        'npk', 'period', 'name', 'unit_name', 'directorate', 'payload', 'created_by', 'updated_by',
    ];

    /**
     * Chronological sort key for a "TWx-YYYY" period string (e.g. TW2-2026 → 20262).
     * Lexicographic ordering of the raw string is wrong across years, so callers
     * use this to order/pick the latest quarter.
     */
    public static function periodSortKey(?string $period): int
    {
        if ($period && preg_match('/TW(\d)-(\d{4})/', $period, $m)) {
            return ((int) $m[2]) * 10 + (int) $m[1];
        }

        return 0;
    }

    protected $casts = [
        'payload' => 'array',
    ];
}
