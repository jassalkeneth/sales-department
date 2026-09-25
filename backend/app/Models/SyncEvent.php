<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SyncEvent extends Model
{
    protected $keyType = 'string';

    public $incrementing = false;

    protected $fillable = [
        'id', 'occurred_at', 'payment_id', 'transaction_ref',
        'closer_name', 'student_name', 'amount', 'program',
        'status', 'verification_latency_ms', 'details',
    ];

    protected $casts = [
        'occurred_at' => 'datetime',
        'amount' => 'float',
        'verification_latency_ms' => 'integer',
    ];
}
