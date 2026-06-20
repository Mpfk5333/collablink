<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class Evaluation extends Model
{
    use HasUuids;

    protected $table = 'evaluations';
    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'contrat_id', 'evaluateur_id', 'evalue_id',
        'note_globale', 'qualite', 'communication', 'delais',
        'professionnalisme', 'commentaire',
    ];

    protected $casts = [
        'note_globale' => 'decimal:1',
        'qualite' => 'decimal:1',
        'communication' => 'decimal:1',
        'delais' => 'decimal:1',
        'professionnalisme' => 'decimal:1',
    ];

    public function contrat() { return $this->belongsTo(Contrat::class, 'contrat_id'); }
    public function evaluateur() { return $this->belongsTo(User::class, 'evaluateur_id'); }
    public function evalue() { return $this->belongsTo(User::class, 'evalue_id'); }
}
