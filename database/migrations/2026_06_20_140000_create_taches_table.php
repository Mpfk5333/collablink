<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('taches', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('contrat_id');
            $table->uuid('jalon_id')->nullable(); // Peut être lié à un jalon ou créé directement
            $table->string('titre');
            $table->text('description')->nullable();
            $table->integer('ordre')->default(0); // Pour trier les tâches
            $table->date('date_echeance')->nullable();
            $table->date('date_debut')->nullable(); // Quand la tâche est démarrée
            $table->date('date_soumission')->nullable(); // Quand le livrable est soumis
            $table->date('date_validation')->nullable(); // Quand validée par le client
            $table->text('livrable_url')->nullable(); // URL du fichier uploadé
            $table->text('commentaire_client')->nullable(); // Commentaire du client lors validation/refus
            $table->text('commentaire_freelance')->nullable(); // Commentaire du freelance lors soumission
            $table->enum('statut', [
                'a_faire',        // Tâche créée, pas encore démarrée
                'en_cours',       // Démarrée par le freelance
                'livrable_soumis',// Freelance a soumis le livrable
                'validee',        // Client a validé
                'refusee',        // Client a refusé
                'en_litige'       // Client a déclaré un litige (délai dépassé)
            ])->default('a_faire');
            $table->uuid('cree_par'); // Qui a créé la tâche (normalement le client)
            $table->timestamps();

            $table->foreign('contrat_id')->references('id')->on('contrats')->onDelete('cascade');
            $table->foreign('jalon_id')->references('id')->on('jalons')->onDelete('set null');
            $table->foreign('cree_par')->references('id')->on('utilisateurs')->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('taches');
    }
};
