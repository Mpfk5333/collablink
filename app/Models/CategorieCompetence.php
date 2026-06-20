<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class CategorieCompetence extends Model
{
    use HasUuids;

    protected $table = 'categorie_competences';
    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = ['nom'];

    public function competences() { return $this->hasMany(Competence::class, 'categorie_id'); }
}
