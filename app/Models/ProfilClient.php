<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class ProfilClient extends Model
{
    use HasUuids;

    protected $table = 'profil_clients';
    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'utilisateur_id', 'type', 'nom_entreprise',
        'secteur_activite', 'domaines_projets',
    ];

    protected $casts = [
        'domaines_projets' => 'array',
    ];

    public function utilisateur() { return $this->belongsTo(User::class, 'utilisateur_id'); }
}
