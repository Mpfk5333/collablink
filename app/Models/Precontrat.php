<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class Precontrat extends Model
{
    use HasUuids;

    protected $table = 'precontrats';
    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'projet_id', 'proposition_id', 'objectifs', 'budget_final',
        'date_debut', 'date_fin', 'clauses', 'statut',
    ];

    protected $casts = [
        'budget_final' => 'decimal:2',
        'date_debut' => 'datetime',
        'date_fin' => 'datetime',
    ];

    public function projet() { return $this->belongsTo(Projet::class, 'projet_id'); }
    public function proposition() { return $this->belongsTo(Proposition::class, 'proposition_id'); }
    public function contrat() { return $this->hasOne(Contrat::class, 'precontrat_id'); }
}
