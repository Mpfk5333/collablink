<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class Competence extends Model
{
    use HasUuids;

    protected $table = 'competences';
    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = ['nom', 'categorie_id'];

    public function categorie() { return $this->belongsTo(CategorieCompetence::class, 'categorie_id'); }
    public function freelanceCompetences() { return $this->hasMany(FreelanceCompetence::class, 'competence_id'); }
    public function projetCompetences() { return $this->hasMany(ProjetCompetence::class, 'competence_id'); }
}
