<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use App\Services\PortefeuilleService;

class Projet extends Model
{
    use HasUuids;

    protected $table = 'projets';
    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'client_id', 'titre', 'description', 'budget_estime',
        'delai_livraison', 'type_contrat', 'cahier_charges_url',
        'statut', 'date_publication',
    ];

    protected $casts = [
        'budget_estime' => 'decimal:2',
        'delai_livraison' => 'datetime',
        'date_publication' => 'datetime',
    ];

    public function client() { return $this->belongsTo(User::class, 'client_id'); }
    public function competences() { return $this->hasMany(ProjetCompetence::class, 'projet_id'); }
    public function recommandations() { return $this->hasMany(RecommandationIA::class, 'projet_id'); }
    public function propositions() { return $this->hasMany(Proposition::class, 'projet_id'); }
    public function propositionsIA() { return $this->hasMany(PropositionIA::class, 'projet_id'); }
    public function precontrats() { return $this->hasMany(Precontrat::class, 'projet_id'); }
    public function contrats() { return $this->hasMany(Contrat::class, 'projet_id'); }
    public function espaceCollaboratif() { return $this->hasOne(EspaceCollaboratif::class, 'projet_id'); }

    public function scopePublie($q) { return $q->where('statut', 'publie'); }
    public function scopeEnCours($q) { return $q->where('statut', 'en_cours'); }
    public function scopeTermine($q) { return $q->where('statut', 'termine'); }
}
