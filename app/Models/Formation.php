<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class Formation extends Model
{
    use HasUuids;

    protected $table = 'formations';
    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'profil_freelance_id', 'diplome', 'etablissement',
        'date_debut', 'date_fin', 'description'
    ];

    protected $casts = [
        'date_debut' => 'date',
        'date_fin' => 'date',
    ];

    public function profilFreelance()
    {
        return $this->belongsTo(ProfilFreelance::class, 'profil_freelance_id');
    }
}
