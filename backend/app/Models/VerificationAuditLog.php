<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class VerificationAuditLog extends Model
{
    protected $keyType = 'string';

    public $incrementing = false;

    protected $fillable = [
        'id', 'payment_id', 'transaction_ref',
        'previous_status', 'new_status', 'officer_name',
        'occurred_at', 'notes',
    ];

    protected $casts = [
        'occurred_at' => 'datetime',
    ];
}
