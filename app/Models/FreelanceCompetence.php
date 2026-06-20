<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class FreelanceCompetence extends Model
{
    use HasUuids;

    protected $table = 'freelance_competences';
    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = ['profil_freelance_id', 'competence_id', 'niveau'];

    public function profilFreelance() { return $this->belongsTo(ProfilFreelance::class, 'profil_freelance_id'); }
    public function competence() { return $this->belongsTo(Competence::class, 'competence_id'); }
}
