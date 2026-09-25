<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Payment extends Model
{
    protected $keyType = 'string';

    public $incrementing = false;

    protected $fillable = [
        'id', 'finance_transaction_id', 'transaction_ref', 'student_id', 'student_name',
        'closer_id', 'closer_name', 'program', 'amount', 'payment_type',
        'installment_number', 'total_installments', 'status', 'finance_verification_status',
        'income_product', 'created_at_source', 'verified_at', 'finance_updated_at', 'verified_by', 'finance_notes',
        'is_duplicate_flag',
    ];

    protected $casts = [
        'amount' => 'float',
        'finance_transaction_id' => 'integer',
        'installment_number' => 'integer',
        'total_installments' => 'integer',
        'created_at_source' => 'datetime',
        'verified_at' => 'datetime',
        'finance_updated_at' => 'datetime',
        'is_duplicate_flag' => 'boolean',
    ];

    public function student()
    {
        return $this->belongsTo(StudentEnrollment::class, 'student_id');
    }

    public function closer()
    {
        return $this->belongsTo(Closer::class, 'closer_id');
    }
}
