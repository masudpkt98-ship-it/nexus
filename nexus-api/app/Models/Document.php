<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Document extends Model
{
    protected $fillable = [
        'doc_id', 'title', 'type', 'folder', 'owner', 'version',
        'approval', 'signed', 'updated', 'created_by', 'updated_by',
    ];

    protected $casts = [
        'signed' => 'boolean',
        'updated' => 'date:Y-m-d',
    ];

    /** Reshape to the frontend DocItem contract (client id). */
    public function toClient(): array
    {
        return [
            'id' => $this->doc_id,
            'title' => $this->title,
            'type' => $this->type,
            'folder' => $this->folder,
            'owner' => $this->owner,
            'version' => $this->version,
            'approval' => $this->approval,
            'updated' => optional($this->updated)->format('Y-m-d'),
            'signed' => (bool) $this->signed,
        ];
    }
}
