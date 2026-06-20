<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class Jalon extends Model
{
    use HasUuids;

    protected $table = 'jalons';
    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'contrat_id', 'feuille_route_id', 'titre', 'description',
        'ordre', 'date_echeance', 'livrable_url', 'date_soumission',
        'date_validation', 'commentaire_client', 'statut', 'cree_par',
    ];

    protected $casts = [
        'date_echeance' => 'datetime',
        'date_soumission' => 'datetime',
        'date_validation' => 'datetime',
    ];

    public function contrat() { return $this->belongsTo(Contrat::class, 'contrat_id'); }
    public function feuilleRoute() { return $this->belongsTo(FeuilleRoute::class, 'feuille_route_id'); }
    public function litiges() { return $this->hasMany(Litige::class, 'jalon_id'); }

    /**
     * Détermine si ce jalon est le dernier (la dernière tâche) du contrat.
     */
    public function estDernierDuContrat(): bool
    {
        $dernier = $this->contrat->jalons()->orderByDesc('ordre')->first();
        return $dernier && $dernier->id === $this->id;
    }
}
