<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class Notification extends Model
{
    use HasUuids;

    protected $table = 'notifications';
    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'utilisateur_id', 'type', 'titre', 'contenu',
        'lien_action', 'est_lue', 'date_lecture',
    ];

    protected $casts = [
        'est_lue' => 'boolean',
        'date_lecture' => 'datetime',
    ];

    public function utilisateur() { return $this->belongsTo(User::class, 'utilisateur_id'); }
}
