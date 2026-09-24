<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class StudentEnrollment extends Model
{
    protected $keyType = 'string';

    public $incrementing = false;

    protected $fillable = [
        'id', 'lead_id', 'full_name', 'email', 'phone', 'program', 'tier',
        'assigned_closer_id', 'total_contract_value', 'payment_plan',
        'enrolled_at', 'finance_status',
    ];

    protected $casts = [
        'total_contract_value' => 'integer',
        'enrolled_at' => 'datetime',
    ];

    public function closer()
    {
        return $this->belongsTo(Closer::class, 'assigned_closer_id');
    }

    public function payments()
    {
        return $this->hasMany(Payment::class, 'student_id');
    }
}
