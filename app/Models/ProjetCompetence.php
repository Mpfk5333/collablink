<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class ProjetCompetence extends Model
{
    use HasUuids;

    protected $table = 'projet_competences';
    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = ['projet_id', 'competence_id'];

    public function projet() { return $this->belongsTo(Projet::class, 'projet_id'); }
    public function competence() { return $this->belongsTo(Competence::class, 'competence_id'); }
}
