<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class Contrat extends Model
{
    use HasUuids;

    protected $table = 'contrats';
    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'precontrat_id', 'projet_id', 'client_id', 'freelance_id',
        'numero_contrat', 'montant_total', 'contrat_pdf_url', 'statut',
    ];

    protected $casts = [
        'montant_total' => 'decimal:2',
    ];

    public function precontrat() { return $this->belongsTo(Precontrat::class, 'precontrat_id'); }
    public function projet() { return $this->belongsTo(Projet::class, 'projet_id'); }
    public function client() { return $this->belongsTo(User::class, 'client_id'); }
    public function freelance() { return $this->belongsTo(User::class, 'freelance_id'); }
    public function jalons() { return $this->hasMany(Jalon::class, 'contrat_id'); }
    public function evaluations() { return $this->hasMany(Evaluation::class, 'contrat_id'); }
    public function litiges() { return $this->hasMany(Litige::class, 'contrat_id'); }
    public function feuilleRoute() { return $this->hasOne(FeuilleRoute::class, 'contrat_id'); }

    public static function genererNumero(): string
    {
        return 'CTR-'.date('Y').'-'.str_pad((string) (self::count() + 1), 6, '0', STR_PAD_LEFT);
    }
}
