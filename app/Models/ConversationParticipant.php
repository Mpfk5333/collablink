<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class ConversationParticipant extends Model
{
    use HasUuids;

    protected $table = 'conversation_participants';
    protected $keyType = 'string';
    public $incrementing = false;
    public $timestamps = false; // La table n'a pas de colonnes created_at/updated_at

    protected $fillable = ['conversation_id', 'utilisateur_id'];

    public function conversation()
    {
        return $this->belongsTo(Conversation::class, 'conversation_id');
    }

    public function utilisateur()
    {
        return $this->belongsTo(User::class, 'utilisateur_id');
    }
}
