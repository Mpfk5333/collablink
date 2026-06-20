<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

/**
 * Feuille de route : document envoyé par le freelance au début du projet.
 * Contient la liste des tâches + durées estimées. Le client doit obligatoirement
 * la valider pour débloquer la création des jalons.
 */
class FeuilleRoute extends Model
{
    use HasUuids;

    protected $table = 'feuille_routes';
    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'contrat_id', 'freelance_id', 'titre', 'description',
        'fichier_url', 'contenu_json', 'statut', 'motif_refus',
    ];

    protected $casts = [
        'contenu_json' => 'array',
    ];

    public function contrat() { return $this->belongsTo(Contrat::class, 'contrat_id'); }
    public function freelance() { return $this->belongsTo(User::class, 'freelance_id'); }
    public function jalons() { return $this->hasMany(Jalon::class, 'feuille_route_id'); }
}
