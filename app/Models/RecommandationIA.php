<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class RecommandationIA extends Model
{
    use HasUuids;

    protected $table = 'recommandation_ia';
    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'projet_id', 'freelance_id', 'score_correspondance', 'notifie',
    ];

    protected $casts = [
        'score_correspondance' => 'decimal:2',
        'notifie' => 'boolean',
    ];

    public function projet() { return $this->belongsTo(Projet::class, 'projet_id'); }
    public function freelance() { return $this->belongsTo(User::class, 'freelance_id'); }
}
