<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class LitigeMessage extends Model
{
    use HasUuids;

    protected $table = 'litige_messages';
    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'litige_id',
        'expediteur_id',
        'contenu',
    ];

    public function litige()
    {
        return $this->belongsTo(Litige::class, 'litige_id');
    }

    public function expediteur()
    {
        return $this->belongsTo(User::class, 'expediteur_id');
    }
}
