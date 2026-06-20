<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class Message extends Model
{
    use HasUuids;

    protected $table = 'messages';
    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'conversation_id',
        'expediteur_id',
        'contenu',
        'piece_jointe_url',
        'piece_jointe_nom',
        'est_signale',
        'raison_signalement',
        'est_lu',
    ];

    protected $casts = [
        'est_signale' => 'boolean',
        'est_lu' => 'boolean',
    ];

    public function conversation()
    {
        return $this->belongsTo(Conversation::class, 'conversation_id');
    }

    public function expediteur()
    {
        return $this->belongsTo(User::class, 'expediteur_id');
    }
}
