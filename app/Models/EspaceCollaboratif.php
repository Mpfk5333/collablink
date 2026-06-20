<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class EspaceCollaboratif extends Model
{
    use HasUuids;

    protected $table = 'espace_collaboratifs';
    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = ['projet_id', 'nom'];

    public function projet()
    {
        return $this->belongsTo(Projet::class, 'projet_id');
    }
}
