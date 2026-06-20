<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class JournalActivite extends Model
{
    use HasUuids;

    protected $table = 'journal_activites';
    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = ['utilisateur_id', 'action', 'entite', 'entite_id', 'details'];

    public function utilisateur()
    {
        return $this->belongsTo(User::class, 'utilisateur_id');
    }
}
