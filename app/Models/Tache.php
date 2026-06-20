<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class Tache extends Model
{
    use HasUuids;

    protected $table = 'taches';
    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'contrat_id',
        'jalon_id',
        'titre',
        'description',
        'ordre',
        'date_echeance',
        'date_debut',
        'date_soumission',
        'date_validation',
        'livrable_url',
        'commentaire_client',
        'commentaire_freelance',
        'statut',
        'cree_par',
    ];

    protected $casts = [
        'date_echeance' => 'date',
        'date_debut' => 'date',
        'date_soumission' => 'date',
        'date_validation' => 'date',
    ];

    // Relations
    public function contrat()
    {
        return $this->belongsTo(Contrat::class, 'contrat_id');
    }

    public function jalon()
    {
        return $this->belongsTo(Jalon::class, 'jalon_id');
    }

    public function createurPar()
    {
        return $this->belongsTo(User::class, 'cree_par');
    }

    // Méthodes utiles
    public function estEnRetard(): bool
    {
        if (!$this->date_echeance) {
            return false;
        }
        
        return now()->isAfter($this->date_echeance) && 
               !in_array($this->statut, ['validee', 'en_litige']);
    }

    public function peutEtreDemarree(): bool
    {
        return $this->statut === 'a_faire';
    }

    public function peutEtreSoumise(): bool
    {
        return $this->statut === 'en_cours';
    }

    public function peutEtreValideeOuRefusee(): bool
    {
        return $this->statut === 'livrable_soumis';
    }

    public function peutEtreRefaite(): bool
    {
        return $this->statut === 'refusee';
    }
}
