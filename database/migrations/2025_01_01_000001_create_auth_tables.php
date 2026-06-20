<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        // 1. Utilisateurs
        Schema::create('utilisateurs', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('nom');
            $table->string('prenom');
            $table->string('email')->unique();
            $table->string('mot_de_passe');
            $table->enum('role', ['client', 'freelance', 'administrateur'])->default('client');
            $table->string('telephone')->nullable();
            $table->string('pays')->nullable();
            $table->string('signature_url')->nullable();
            $table->string('photo_url')->nullable();
            $table->boolean('est_actif')->default(true);
            $table->string('api_token', 80)->unique()->nullable();
            $table->rememberToken();
            $table->timestamps();
        });

        Schema::create('password_reset_tokens', function (Blueprint $table) {
            $table->string('email')->primary();
            $table->string('token');
            $table->timestamp('created_at')->nullable();
        });

        Schema::create('sessions', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->foreignUuid('user_id')->nullable()->index();
            $table->string('ip_address', 45)->nullable();
            $table->text('user_agent')->nullable();
            $table->longText('payload');
            $table->integer('last_activity')->index();
        });

        // 2. Profil client
        Schema::create('profil_clients', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('utilisateur_id')->unique()->constrained('utilisateurs')->cascadeOnDelete();
            $table->enum('type', ['particulier', 'entreprise'])->default('particulier');
            $table->string('nom_entreprise')->nullable();
            $table->string('secteur_activite')->nullable();
            $table->text('domaines_projets')->nullable(); // JSON
            $table->timestamps();
        });

        // 3. Catégories de compétences
        Schema::create('categorie_competences', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('nom');
            $table->timestamps();
        });

        Schema::create('competences', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('nom');
            $table->foreignUuid('categorie_id')->constrained('categorie_competences')->cascadeOnDelete();
            $table->timestamps();
        });

        // 4. Profil freelance
        Schema::create('profil_freelances', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('utilisateur_id')->unique()->constrained('utilisateurs')->cascadeOnDelete();
            $table->string('titre_professionnel');
            $table->text('bio')->nullable();
            $table->decimal('tarif', 12, 2)->nullable();
            $table->integer('annees_experience')->nullable();
            $table->string('lien_linkedin')->nullable();
            $table->string('lien_github')->nullable();
            $table->string('lien_portfolio')->nullable();
            $table->decimal('score_fiabilite', 5, 2)->default(0);
            $table->decimal('taux_completion', 5, 2)->default(0);
            $table->decimal('respect_delais', 5, 2)->default(0);
            $table->integer('nombre_projets')->default(0);
            $table->timestamps();
        });

        Schema::create('freelance_competences', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('profil_freelance_id')->constrained('profil_freelances')->cascadeOnDelete();
            $table->foreignUuid('competence_id')->constrained('competences')->cascadeOnDelete();
            $table->enum('niveau', ['debutant', 'intermediaire', 'avance', 'expert'])->default('intermediaire');
            $table->unique(['profil_freelance_id', 'competence_id']);
        });

        Schema::create('experience_professionnelles', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('profil_freelance_id')->constrained('profil_freelances')->cascadeOnDelete();
            $table->string('poste');
            $table->string('entreprise');
            $table->date('date_debut');
            $table->date('date_fin')->nullable();
            $table->text('description')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('experience_professionnelles');
        Schema::dropIfExists('freelance_competences');
        Schema::dropIfExists('profil_freelances');
        Schema::dropIfExists('competences');
        Schema::dropIfExists('categorie_competences');
        Schema::dropIfExists('profil_clients');
        Schema::dropIfExists('sessions');
        Schema::dropIfExists('password_reset_tokens');
        Schema::dropIfExists('utilisateurs');
    }
};
