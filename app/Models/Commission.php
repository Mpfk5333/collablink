<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class Commission extends Model
{
    use HasUuids;

    protected $table = 'commissions';
    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = ['contrat_id', 'jalon_id', 'montant', 'taux'];

    protected $casts = [
        'montant' => 'decimal:2',
        'taux' => 'decimal:2',
    ];

    public function contrat()
    {
        return $this->belongsTo(Contrat::class, 'contrat_id');
    }

    public function jalon()
    {
        return $this->belongsTo(Jalon::class, 'jalon_id');
    }
}
