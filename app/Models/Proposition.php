<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class Proposition extends Model
{
    use HasUuids;

    protected $table = 'propositions';
    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'projet_id', 'freelance_id', 'lettre_motivation',
        'montant_propose', 'delai_propose', 'statut',
    ];

    protected $casts = [
        'montant_propose' => 'decimal:2',
        'delai_propose' => 'datetime',
    ];

    public function projet() { return $this->belongsTo(Projet::class, 'projet_id'); }
    public function freelance() { return $this->belongsTo(User::class, 'freelance_id'); }
    public function precontrats() { return $this->hasMany(Precontrat::class, 'proposition_id'); }
}
