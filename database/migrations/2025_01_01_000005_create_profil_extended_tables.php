<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Table des formations
        Schema::create('formations', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('profil_freelance_id');
            $table->string('diplome');
            $table->string('etablissement');
            $table->date('date_debut');
            $table->date('date_fin')->nullable();
            $table->text('description')->nullable();
            $table->timestamps();

            $table->foreign('profil_freelance_id')
                ->references('id')->on('profil_freelances')
                ->onDelete('cascade');
        });

        // Table des certifications
        Schema::create('certifications', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('profil_freelance_id');
            $table->string('nom');
            $table->string('organisme');
            $table->date('date_obtention');
            $table->date('date_expiration')->nullable();
            $table->string('numero_certification')->nullable();
            $table->text('description')->nullable();
            $table->timestamps();

            $table->foreign('profil_freelance_id')
                ->references('id')->on('profil_freelances')
                ->onDelete('cascade');
        });

        // Table du portfolio (projets personnels)
        Schema::create('portfolio_projets', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('profil_freelance_id');
            $table->string('titre');
            $table->text('description')->nullable();
            $table->string('lien_projet')->nullable();
            $table->string('lien_demo')->nullable();
            $table->string('technologies')->nullable(); // JSON array
            $table->date('date_realisation')->nullable();
            $table->timestamps();

            $table->foreign('profil_freelance_id')
                ->references('id')->on('profil_freelances')
                ->onDelete('cascade');
        });

        // Table des langues
        Schema::create('langues', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('profil_freelance_id');
            $table->string('langue');
            $table->enum('niveau', ['debutant', 'intermediaire', 'avance', 'courant', 'natif']);
            $table->timestamps();

            $table->foreign('profil_freelance_id')
                ->references('id')->on('profil_freelances')
                ->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('langues');
        Schema::dropIfExists('portfolio_projets');
        Schema::dropIfExists('certifications');
        Schema::dropIfExists('formations');
    }
};
