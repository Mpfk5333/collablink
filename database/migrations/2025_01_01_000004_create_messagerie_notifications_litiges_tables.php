<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        // Messagerie
        Schema::create('conversations', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('projet_id')->constrained('projets')->cascadeOnDelete();
            $table->timestamps();
        });

        Schema::create('conversation_participants', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('conversation_id')->constrained('conversations')->cascadeOnDelete();
            $table->foreignUuid('utilisateur_id')->constrained('utilisateurs')->cascadeOnDelete();
            $table->unique(['conversation_id', 'utilisateur_id']);
        });

        Schema::create('messages', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('conversation_id')->constrained('conversations')->cascadeOnDelete();
            $table->foreignUuid('expediteur_id')->constrained('utilisateurs')->cascadeOnDelete();
            $table->longText('contenu');
            $table->string('piece_jointe_url')->nullable();
            $table->string('piece_jointe_nom')->nullable();
            $table->boolean('est_signale')->default(false);
            $table->text('raison_signalement')->nullable();
            $table->boolean('est_lu')->default(false);
            $table->timestamps();
        });

        // Notifications
        Schema::create('notifications', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('utilisateur_id')->constrained('utilisateurs')->cascadeOnDelete();
            $table->enum('type', [
                'nouvelle_proposition', 'proposition_ia_recue', 'proposition_ia_negociee',
                'proposition_ia_validee', 'proposition_ia_refusee', 'negociation_acceptee',
                'negociation_refusee', 'precontrat_genere', 'precontrat_valide',
                'precontrat_refuse', 'paiement_valide', 'paiement_rejete', 'contrat_signe',
                'jalon_valide', 'jalon_refuse', 'liberation_fonds', 'litige_ouvert',
                'litige_resolu', 'nouveau_message', 'recommandation_ia',
                'feuille_route_recue', 'feuille_route_validee', 'feuille_route_refusee',
                'nouveau_jalon', 'projet_termine', 'nouveau_delai_fixe'
            ]);
            $table->string('titre');
            $table->longText('contenu');
            $table->string('lien_action')->nullable();
            $table->boolean('est_lue')->default(false);
            $table->dateTime('date_lecture')->nullable();
            $table->timestamps();
        });

        // Litiges
        Schema::create('litiges', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('contrat_id')->constrained('contrats');
            $table->foreignUuid('jalon_id')->nullable()->constrained('jalons')->nullOnDelete();
            $table->foreignUuid('plaignant_id')->constrained('utilisateurs');
            $table->foreignUuid('defendeur_id')->constrained('utilisateurs');
            $table->string('motif');
            $table->longText('preuves')->nullable(); // JSON
            $table->enum('decision', ['remboursement_client', 'liberation_freelance', 'partage', 'classe_sans_suite'])->nullable();
            $table->text('commentaire_decision')->nullable();
            $table->enum('statut', ['ouvert', 'en_arbitrage', 'resolu'])->default('ouvert');
            $table->dateTime('date_resolution')->nullable();
            $table->dateTime('nouveau_delai')->nullable();
            $table->timestamps();
        });

        Schema::create('litige_messages', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('litige_id')->constrained('litiges')->cascadeOnDelete();
            $table->foreignUuid('expediteur_id')->constrained('utilisateurs')->cascadeOnDelete();
            $table->longText('contenu');
            $table->timestamps();
        });

        // Commission
        Schema::create('commissions', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('contrat_id')->constrained('contrats')->cascadeOnDelete();
            $table->foreignUuid('jalon_id')->nullable()->constrained('jalons')->nullOnDelete();
            $table->decimal('montant', 12, 2);
            $table->decimal('taux', 5, 2)->default(0.05);
            $table->timestamps();
        });

        // Journal d'activité
        Schema::create('journal_activites', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('utilisateur_id')->nullable()->constrained('utilisateurs')->nullOnDelete();
            $table->string('action');
            $table->string('entite')->nullable();
            $table->uuid('entite_id')->nullable();
            $table->text('details')->nullable();
            $table->timestamps();
        });

        // Jobs/Queue
        Schema::create('jobs', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->string('queue')->index();
            $table->longText('payload');
            $table->unsignedSmallInteger('attempts');
            $table->unsignedInteger('reserved_at')->nullable();
            $table->unsignedInteger('available_at');
            $table->unsignedInteger('created_at');
        });

        Schema::create('job_batches', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->string('name');
            $table->integer('total_jobs');
            $table->integer('pending_jobs');
            $table->integer('failed_jobs');
            $table->longText('failed_job_ids');
            $table->longText('options')->nullable();
            $table->integer('cancelled_at')->nullable();
            $table->integer('created_at');
            $table->integer('finished_at')->nullable();
        });

        Schema::create('failed_jobs', function (Blueprint $table) {
            $table->id();
            $table->string('uuid')->unique();
            $table->text('connection');
            $table->text('queue');
            $table->longText('payload');
            $table->longText('exception');
            $table->timestamp('failed_at')->useCurrent();
        });

        // Cache
        Schema::create('cache', function (Blueprint $table) {
            $table->string('key')->primary();
            $table->mediumText('value');
            $table->integer('expiration');
        });

        Schema::create('cache_locks', function (Blueprint $table) {
            $table->string('key')->primary();
            $table->string('owner');
            $table->integer('expiration');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('cache_locks');
        Schema::dropIfExists('cache');
        Schema::dropIfExists('failed_jobs');
        Schema::dropIfExists('job_batches');
        Schema::dropIfExists('jobs');
        Schema::dropIfExists('journal_activites');
        Schema::dropIfExists('commissions');
        Schema::dropIfExists('litige_messages');
        Schema::dropIfExists('litiges');
        Schema::dropIfExists('notifications');
        Schema::dropIfExists('messages');
        Schema::dropIfExists('conversation_participants');
        Schema::dropIfExists('conversations');
    }
};
