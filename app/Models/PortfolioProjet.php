<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class PortfolioProjet extends Model
{
    use HasUuids;

    protected $table = 'portfolio_projets';
    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'profil_freelance_id', 'titre', 'description',
        'lien_projet', 'lien_demo', 'technologies', 'date_realisation'
    ];

    protected $casts = [
        'date_realisation' => 'date',
        'technologies' => 'array',
    ];

    public function profilFreelance()
    {
        return $this->belongsTo(ProfilFreelance::class, 'profil_freelance_id');
    }
}
