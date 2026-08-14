<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MeetingActionItem extends Model
{
    protected $fillable = ['item_id', 'assignee', 'text', 'status', 'position', 'updated_by'];

    /** Reshape to the frontend ActionItem contract. */
    public function toClient(): array
    {
        return [
            'id' => $this->item_id,
            'assignee' => $this->assignee ?? '',
            'text' => $this->text,
            'status' => $this->status,
        ];
    }
}
