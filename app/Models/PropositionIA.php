<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

/**
 * Proposition IA : proposition initiée par un freelance suite à une recommandation
 * ou via la recherche de freelances ("Faire une proposition").
 *
 * Flux :
 *  - Freelance crée une proposition IA → statut = en_attente
 *  - Client peut : negocier (saisir son budget) / valider / refuser
 *  - Si négocie → statut = negociation, freelance peut accepterNegociation ou refuserNegociation
 *  - Si valide (ou accepterNegociation) → statut = validee → lancement précontrat
 *  - Si refuse → statut = refuse avec motif
 */
class PropositionIA extends Model
{
    use HasUuids;

    protected $table = 'proposition_ia';
    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'projet_id', 'freelance_id', 'source',
        'lettre_motivation', 'montant_propose', 'delai_propose', 'statut',
        'montant_negocie', 'delai_negocie', 'motif_refus',
    ];

    protected $casts = [
        'montant_propose' => 'decimal:2',
        'delai_propose' => 'datetime',
        'montant_negocie' => 'decimal:2',
        'delai_negocie' => 'datetime',
    ];

    public function projet() { return $this->belongsTo(Projet::class, 'projet_id'); }
    public function freelance() { return $this->belongsTo(User::class, 'freelance_id'); }
}
