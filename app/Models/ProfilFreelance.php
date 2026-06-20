<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class ProfilFreelance extends Model
{
    use HasUuids;

    protected $table = 'profil_freelances';
    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'utilisateur_id', 'titre_professionnel', 'bio', 'tarif',
        'annees_experience', 'lien_linkedin', 'lien_github', 'lien_portfolio',
        'score_fiabilite', 'taux_completion', 'respect_delais', 'nombre_projets',
    ];

    protected $casts = [
        'tarif' => 'decimal:2',
        'score_fiabilite' => 'decimal:2',
        'taux_completion' => 'decimal:2',
        'respect_delais' => 'decimal:2',
    ];

    public function utilisateur() { return $this->belongsTo(User::class, 'utilisateur_id'); }
    public function competences() { return $this->hasMany(FreelanceCompetence::class, 'profil_freelance_id'); }
    public function experiences() { return $this->hasMany(ExperienceProfessionnelle::class, 'profil_freelance_id'); }
    public function formations() { return $this->hasMany(Formation::class, 'profil_freelance_id'); }
    public function certifications() { return $this->hasMany(Certification::class, 'profil_freelance_id'); }
    public function portfolioProjets() { return $this->hasMany(PortfolioProjet::class, 'profil_freelance_id'); }
    public function langues() { return $this->hasMany(Langue::class, 'profil_freelance_id'); }
}
