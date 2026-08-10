<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class StrategyItem extends Model
{
    protected $fillable = [
        'kind', 'item_id', 'text', 'letter', 'title', 'description',
        'swot_type', 'position', 'created_by', 'updated_by',
    ];

    /** Reshape to the frontend contract for the item's kind. */
    public function toClient(): array
    {
        return match ($this->kind) {
            'mission' => ['id' => $this->item_id, 'text' => $this->text],
            'value' => ['id' => $this->item_id, 'letter' => $this->letter, 'title' => $this->title, 'description' => $this->description],
            'swot' => ['id' => $this->item_id, 'type' => $this->swot_type, 'text' => $this->text],
            default => ['id' => $this->item_id, 'text' => $this->text],
        };
    }
}
