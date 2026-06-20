<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class Conversation extends Model
{
    use HasUuids;

    protected $table = 'conversations';
    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = ['projet_id'];

    public function projet()
    {
        return $this->belongsTo(Projet::class, 'projet_id');
    }

    public function participants()
    {
        return $this->hasMany(ConversationParticipant::class, 'conversation_id');
    }

    public function messages()
    {
        return $this->hasMany(Message::class, 'conversation_id');
    }
}
