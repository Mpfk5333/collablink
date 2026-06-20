<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        // Précontrats
        Schema::create('precontrats', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('projet_id')->constrained('projets')->cascadeOnDelete();
            $table->foreignUuid('proposition_id')->constrained('propositions')->cascadeOnDelete();
            $table->longText('objectifs');
            $table->decimal('budget_final', 12, 2);
            $table->dateTime('date_debut');
            $table->dateTime('date_fin');
            $table->longText('clauses')->nullable();
            $table->enum('statut', ['genere', 'en_attente_paiement', 'valide_freelance', 'refuse_freelance', 'expire', 'signe'])->default('genere');
            $table->timestamps();
        });

        // Contrats
        Schema::create('contrats', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('precontrat_id')->unique()->constrained('precontrats')->cascadeOnDelete();
            $table->foreignUuid('projet_id')->constrained('projets')->cascadeOnDelete();
            $table->foreignUuid('client_id')->constrained('utilisateurs');
            $table->foreignUuid('freelance_id')->constrained('utilisateurs');
            $table->string('numero_contrat')->unique();
            $table->decimal('montant_total', 12, 2);
            $table->string('contrat_pdf_url')->nullable();
            $table->enum('statut', ['actif', 'resilie', 'termine'])->default('actif');
            $table->timestamps();
        });

        // Met à jour transactions avec foreign keys vers contrats
        Schema::table('transactions', function (Blueprint $table) {
            $table->foreign('contrat_id')->references('id')->on('contrats')->nullOnDelete();
        });

        // ============================================================
        // NOUVEAU : Feuille de route (envoyée par le freelance au début du projet)
        // ============================================================
        Schema::create('feuille_routes', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('contrat_id')->constrained('contrats')->cascadeOnDelete();
            $table->foreignUuid('freelance_id')->constrained('utilisateurs');
            $table->string('titre');
            $table->longText('description')->nullable();
            $table->string('fichier_url')->nullable(); // PDF/docx
            $table->longText('contenu_json')->nullable(); // tâches + durées structurées
            $table->enum('statut', ['en_attente', 'validee', 'refusee'])->default('en_attente');
            $table->text('motif_refus')->nullable();
            $table->timestamps();
        });

        // Jalons (sans montantAlloue car demandé par l'utilisateur)
        Schema::create('jalons', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('contrat_id')->constrained('contrats')->cascadeOnDelete();
            $table->foreignUuid('feuille_route_id')->nullable()->constrained('feuille_routes')->nullOnDelete();
            $table->string('titre');
            $table->longText('description')->nullable();
            $table->integer('ordre');
            $table->dateTime('date_echeance');
            $table->string('livrable_url')->nullable();
            $table->dateTime('date_soumission')->nullable();
            $table->dateTime('date_validation')->nullable();
            $table->text('commentaire_client')->nullable();
            $table->enum('statut', ['a_faire', 'en_cours', 'livrable_soumis', 'valide', 'refuse', 'en_litige'])->default('a_faire');
            $table->enum('cree_par', ['freelance', 'client'])->default('freelance');
            $table->timestamps();
        });

        Schema::table('transactions', function (Blueprint $table) {
            $table->foreign('jalon_id')->references('id')->on('jalons')->nullOnDelete();
        });

        // Évaluations
        Schema::create('evaluations', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('contrat_id')->constrained('contrats')->cascadeOnDelete();
            $table->foreignUuid('evaluateur_id')->constrained('utilisateurs');
            $table->foreignUuid('evalue_id')->constrained('utilisateurs');
            $table->decimal('note_globale', 3, 1);
            $table->decimal('qualite', 3, 1)->nullable();
            $table->decimal('communication', 3, 1)->nullable();
            $table->decimal('delais', 3, 1)->nullable();
            $table->decimal('professionnalisme', 3, 1)->nullable();
            $table->text('commentaire')->nullable();
            $table->timestamps();
            $table->unique(['contrat_id', 'evaluateur_id']);
        });

        // Espace collaboratif
        Schema::create('espace_collaboratifs', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('projet_id')->unique()->constrained('projets')->cascadeOnDelete();
            $table->string('nom');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::table('transactions', function (Blueprint $table) {
            $table->dropForeign(['jalon_id']);
            $table->dropForeign(['contrat_id']);
        });
        Schema::dropIfExists('espace_collaboratifs');
        Schema::dropIfExists('evaluations');
        Schema::dropIfExists('jalons');
        Schema::dropIfExists('feuille_routes');
        Schema::table('transactions', function (Blueprint $table) {
            $table->dropForeign(['contrat_id']);
        });
        Schema::dropIfExists('contrats');
        Schema::dropIfExists('precontrats');
    }
};
