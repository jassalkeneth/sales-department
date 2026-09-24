<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Lead extends Model
{
    protected $keyType = 'string';

    public $incrementing = false;

    protected $fillable = [
        'id', 'full_name', 'email', 'phone', 'target_program',
        'assigned_closer_id', 'stage', 'estimated_deal_value', 'source',
        'notes', 'enrollment_id', 'created_at_source', 'last_activity_at',
    ];

    protected $casts = [
        'estimated_deal_value' => 'integer',
        'created_at_source' => 'datetime',
        'last_activity_at' => 'datetime',
    ];

    public function closer()
    {
        return $this->belongsTo(Closer::class, 'assigned_closer_id');
    }
}
