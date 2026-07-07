<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class GeneratedArtifact extends Model
{
    protected $fillable = ['user_id', 'kind', 'title', 'markdown', 'source', 'params'];

    protected $casts = ['params' => 'array'];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
