<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class Transaction extends Model
{
    use HasUuids;

    protected $table = 'transactions';
    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'portefeuille_id', 'type', 'montant', 'reference', 'statut',
        'jalon_id', 'contrat_id', 'description', 'justificatif_url',
        'mode_paiement', 'motif_rejet', 'montant_commission', 'montant_total',
    ];

    protected $casts = [
        'montant' => 'decimal:2',
        'montant_commission' => 'decimal:2',
        'montant_total' => 'decimal:2',
    ];

    public function portefeuille() { return $this->belongsTo(Portefeuille::class, 'portefeuille_id'); }
    public function jalon() { return $this->belongsTo(Jalon::class, 'jalon_id'); }
    public function contrat() { return $this->belongsTo(Contrat::class, 'contrat_id'); }

    public static function genererReference(string $prefixe = 'TX'): string
    {
        return $prefixe.'-'.date('Y').'-'.str_pad((string) (self::count() + 1), 6, '0', STR_PAD_LEFT);
    }
}
