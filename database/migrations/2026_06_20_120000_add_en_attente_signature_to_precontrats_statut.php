<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // Add 'en_attente_signature' to precontrats.statut ENUM
        DB::statement("ALTER TABLE precontrats MODIFY COLUMN statut ENUM('genere', 'en_attente_paiement', 'en_attente_signature', 'valide_freelance', 'refuse_freelance', 'expire', 'signe') DEFAULT 'genere'");
    }

    public function down(): void
    {
        // Remove 'en_attente_signature' from precontrats.statut ENUM
        DB::statement("ALTER TABLE precontrats MODIFY COLUMN statut ENUM('genere', 'en_attente_paiement', 'valide_freelance', 'refuse_freelance', 'expire', 'signe') DEFAULT 'genere'");
    }
};
