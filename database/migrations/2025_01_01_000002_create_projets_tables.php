<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        // Projets
        Schema::create('projets', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('client_id')->constrained('utilisateurs')->cascadeOnDelete();
            $table->string('titre');
            $table->longText('description');
            $table->decimal('budget_estime', 12, 2);
            $table->dateTime('delai_livraison');
            $table->enum('type_contrat', ['forfait', 'regie'])->nullable();
            $table->string('cahier_charges_url')->nullable();
            $table->enum('statut', [
                'brouillon', 'publie', 'en_analyse_ia', 'en_recrutement',
                'en_cours', 'en_litige', 'termine', 'annule'
            ])->default('brouillon');
            $table->dateTime('date_publication')->nullable();
            $table->timestamps();
        });

        Schema::create('projet_competences', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('projet_id')->constrained('projets')->cascadeOnDelete();
            $table->foreignUuid('competence_id')->constrained('competences')->cascadeOnDelete();
            $table->unique(['projet_id', 'competence_id']);
        });

        // Recommandations IA (générées automatiquement par le système)
        Schema::create('recommandation_ia', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('projet_id')->constrained('projets')->cascadeOnDelete();
            $table->foreignUuid('freelance_id')->constrained('utilisateurs')->cascadeOnDelete();
            $table->decimal('score_correspondance', 5, 2);
            $table->boolean('notifie')->default(false);
            $table->timestamps();
        });

        // Propositions / Candidatures
        Schema::create('propositions', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('projet_id')->constrained('projets')->cascadeOnDelete();
            $table->foreignUuid('freelance_id')->constrained('utilisateurs')->cascadeOnDelete();
            $table->longText('lettre_motivation');
            $table->decimal('montant_propose', 12, 2);
            $table->dateTime('delai_propose');
            $table->enum('statut', ['en_attente', 'acceptee', 'refusee'])->default('en_attente');
            $table->timestamps();
            $table->unique(['projet_id', 'freelance_id']);
        });

        // ============================================================
        // NOUVEAU : Propositions IA (initiées par le freelance via "Faire une proposition")
        // ============================================================
        Schema::create('proposition_ia', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('projet_id')->constrained('projets')->cascadeOnDelete();
            $table->foreignUuid('freelance_id')->constrained('utilisateurs')->cascadeOnDelete();
            $table->enum('source', ['recommandation_ia', 'recherche_freelance'])->default('recherche_freelance');
            $table->longText('lettre_motivation')->nullable();
            $table->decimal('montant_propose', 12, 2);
            $table->dateTime('delai_propose');
            $table->enum('statut', ['en_attente', 'negociation', 'validee', 'refusee', 'expire'])->default('en_attente');
            // Négociation
            $table->decimal('montant_negocie', 12, 2)->nullable();
            $table->dateTime('delai_negocie')->nullable();
            $table->text('motif_refus')->nullable();
            $table->timestamps();
        });

        // ============================================================
        // Portefeuilles & Transactions
        // ============================================================
        Schema::create('portefeuilles', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('utilisateur_id')->unique()->constrained('utilisateurs')->cascadeOnDelete();
            $table->decimal('solde', 12, 2)->default(0);
            $table->decimal('solde_sequestre', 12, 2)->default(0);
            $table->decimal('total_depose', 12, 2)->default(0);
            $table->decimal('total_retire', 12, 2)->default(0);
            $table->decimal('total_gagne', 12, 2)->default(0);
            $table->timestamps();
        });

        Schema::create('transactions', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('portefeuille_id')->constrained('portefeuilles')->cascadeOnDelete();
            $table->enum('type', ['depot', 'retrait', 'mise_en_sequestre', 'liberation_jalon', 'commission_plateforme', 'remboursement', 'paiement_freelance']);
            $table->decimal('montant', 12, 2);
            $table->string('reference')->unique();
            $table->enum('statut', ['en_attente', 'validee', 'echouee'])->default('en_attente');
            $table->foreignUuid('jalon_id')->nullable();
            $table->foreignUuid('contrat_id')->nullable();
            $table->text('description')->nullable();
            $table->string('justificatif_url')->nullable();
            $table->string('mode_paiement')->nullable(); // mobile_money, virement, carte, etc.
            $table->text('motif_rejet')->nullable();
            $table->decimal('montant_commission', 12, 2)->default(0);
            $table->decimal('montant_total', 12, 2)->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('transactions');
        Schema::dropIfExists('portefeuilles');
        Schema::dropIfExists('proposition_ia');
        Schema::dropIfExists('propositions');
        Schema::dropIfExists('recommandation_ia');
        Schema::dropIfExists('projet_competences');
        Schema::dropIfExists('projets');
    }
};
