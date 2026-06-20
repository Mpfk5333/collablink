<?php

namespace App\Models;

use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class User extends Authenticatable
{
    use HasApiTokens, Notifiable, HasUuids;

    protected $table = 'utilisateurs';
    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'nom', 'prenom', 'email', 'mot_de_passe', 'role',
        'telephone', 'pays', 'signature_url', 'photo_url', 'est_actif',
    ];

    protected $hidden = [
        'mot_de_passe', 'remember_token', 'api_token',
    ];

    public function getAuthPassword()
    {
        return $this->mot_de_passe;
    }

    public function getNomCompletAttribute(): string
    {
        return $this->prenom.' '.$this->nom;
    }

    public function getAvatarUrlAttribute(): ?string
    {
        return $this->photo_url ? asset('storage/'.$this->photo_url) : null;
    }

    // Relations
    public function profilClient() { return $this->hasOne(ProfilClient::class, 'utilisateur_id'); }
    public function profilFreelance() { return $this->hasOne(ProfilFreelance::class, 'utilisateur_id'); }
    public function portefeuille() { return $this->hasOne(Portefeuille::class, 'utilisateur_id'); }
    public function projetsPublies() { return $this->hasMany(Projet::class, 'client_id'); }
    public function propositions() { return $this->hasMany(Proposition::class, 'freelance_id'); }
    public function contratsClient() { return $this->hasMany(Contrat::class, 'client_id'); }
    public function contratsFreelance() { return $this->hasMany(Contrat::class, 'freelance_id'); }
    public function evaluationsDonnees() { return $this->hasMany(Evaluation::class, 'evaluateur_id'); }
    public function evaluationsRecues() { return $this->hasMany(Evaluation::class, 'evalue_id'); }
    public function notifications() { return $this->hasMany(Notification::class, 'utilisateur_id'); }
    public function conversations() { return $this->hasMany(ConversationParticipant::class, 'utilisateur_id'); }
    public function recommandations() { return $this->hasMany(RecommandationIA::class, 'freelance_id'); }
    public function messagesEnvoyes() { return $this->hasMany(Message::class, 'expediteur_id'); }
    public function litigesOuverts() { return $this->hasMany(Litige::class, 'plaignant_id'); }
    public function litigesDefense() { return $this->hasMany(Litige::class, 'defendeur_id'); }
    public function journalActivites() { return $this->hasMany(JournalActivite::class, 'utilisateur_id'); }

    public function estClient(): bool { return $this->role === 'client'; }
    public function estFreelance(): bool { return $this->role === 'freelance'; }
    public function estAdministrateur(): bool { return $this->role === 'administrateur'; }
}
