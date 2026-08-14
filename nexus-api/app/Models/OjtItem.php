<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class OjtItem extends Model
{
    protected $fillable = ['item_id', 'employee', 'role', 'kind', 'activity', 'mentor', 'status', 'updated_by'];

    /** Reshape to the frontend OjtItem contract (client id). */
    public function toClient(): array
    {
        return [
            'id' => $this->item_id,
            'employee' => $this->employee,
            'role' => $this->role ?? '',
            'kind' => $this->kind,
            'activity' => $this->activity ?? '',
            'mentor' => $this->mentor ?? '',
            'status' => $this->status,
        ];
    }
}
