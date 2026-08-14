<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MeetingAgendaItem extends Model
{
    protected $fillable = ['item_id', 'text', 'position', 'updated_by'];

    /** Reshape to the frontend AgendaItem contract. */
    public function toClient(): array
    {
        return ['id' => $this->item_id, 'text' => $this->text];
    }
}
