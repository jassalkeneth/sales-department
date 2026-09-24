<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Closer extends Model
{
    protected $keyType = 'string';

    public $incrementing = false;

    protected $fillable = [
        'id', 'name', 'email', 'title', 'avatar_url',
        'monthly_target', 'collection_target', 'effective_period',
        'base_commission_pct', 'accelerator_pct',
    ];

    protected $casts = [
        'monthly_target' => 'integer',
        'collection_target' => 'integer',
        'base_commission_pct' => 'float',
        'accelerator_pct' => 'float',
    ];

    public function leads()
    {
        return $this->hasMany(Lead::class, 'assigned_closer_id');
    }

    public function students()
    {
        return $this->hasMany(StudentEnrollment::class, 'assigned_closer_id');
    }

    public function payments()
    {
        return $this->hasMany(Payment::class, 'closer_id');
    }
}
