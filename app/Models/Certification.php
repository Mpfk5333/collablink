<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class Certification extends Model
{
    use HasUuids;

    protected $table = 'certifications';
    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'profil_freelance_id', 'nom', 'organisme',
        'date_obtention', 'date_expiration', 'numero_certification', 'description'
    ];

    protected $casts = [
        'date_obtention' => 'date',
        'date_expiration' => 'date',
    ];

    public function profilFreelance()
    {
        return $this->belongsTo(ProfilFreelance::class, 'profil_freelance_id');
    }
}
