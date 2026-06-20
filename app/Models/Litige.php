<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class Litige extends Model
{
    use HasUuids;

    protected $table = 'litiges';
    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'contrat_id',
        'jalon_id',
        'plaignant_id',
        'defendeur_id',
        'motif',
        'preuves',
        'decision',
        'commentaire_decision',
        'statut',
        'date_resolution',
        'nouveau_delai',
    ];

    protected $casts = [
        'preuves' => 'array',
        'date_resolution' => 'datetime',
        'nouveau_delai' => 'datetime',
    ];

    public function contrat()
    {
        return $this->belongsTo(Contrat::class, 'contrat_id');
    }

    public function jalon()
    {
        return $this->belongsTo(Jalon::class, 'jalon_id');
    }

    public function plaignant()
    {
        return $this->belongsTo(User::class, 'plaignant_id');
    }

    public function defendeur()
    {
        return $this->belongsTo(User::class, 'defendeur_id');
    }

    public function messages()
    {
        return $this->hasMany(LitigeMessage::class, 'litige_id');
    }
}
