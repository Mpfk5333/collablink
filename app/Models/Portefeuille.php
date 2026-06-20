<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class Portefeuille extends Model
{
    use HasUuids;

    protected $table = 'portefeuilles';
    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'utilisateur_id', 'solde', 'solde_sequestre',
        'total_depose', 'total_retire', 'total_gagne',
    ];

    protected $casts = [
        'solde' => 'decimal:2',
        'solde_sequestre' => 'decimal:2',
        'total_depose' => 'decimal:2',
        'total_retire' => 'decimal:2',
        'total_gagne' => 'decimal:2',
    ];

    public function utilisateur() { return $this->belongsTo(User::class, 'utilisateur_id'); }
    public function transactions() { return $this->hasMany(Transaction::class, 'portefeuille_id'); }
}
