<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Modifier la colonne ENUM pour ajouter les types manquants
        DB::statement("ALTER TABLE notifications MODIFY COLUMN type ENUM(
            'nouvelle_proposition', 
            'proposition_acceptee',
            'proposition_refusee',
            'proposition_ia_recue',
            'proposition_client_recue',
            'proposition_ia_negociee', 
            'proposition_ia_validee', 
            'proposition_ia_refusee', 
            'negociation_acceptee',
            'negociation_refusee', 
            'precontrat_genere', 
            'precontrat_valide',
            'precontrat_refuse', 
            'paiement_valide', 
            'paiement_rejete', 
            'contrat_signe',
            'jalon_valide', 
            'jalon_refuse', 
            'liberation_fonds', 
            'litige_ouvert',
            'litige_resolu', 
            'nouveau_message', 
            'recommandation_ia',
            'feuille_route_recue', 
            'feuille_route_validee', 
            'feuille_route_refusee',
            'nouveau_jalon', 
            'projet_termine', 
            'nouveau_delai_fixe'
        )");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Revenir à l'ENUM d'origine (optionnel)
        DB::statement("ALTER TABLE notifications MODIFY COLUMN type ENUM(
            'nouvelle_proposition', 
            'proposition_ia_recue', 
            'proposition_ia_negociee',
            'proposition_ia_validee', 
            'proposition_ia_refusee', 
            'negociation_acceptee',
            'negociation_refusee', 
            'precontrat_genere', 
            'precontrat_valide',
            'precontrat_refuse', 
            'paiement_valide', 
            'paiement_rejete', 
            'contrat_signe',
            'jalon_valide', 
            'jalon_refuse', 
            'liberation_fonds', 
            'litige_ouvert',
            'litige_resolu', 
            'nouveau_message', 
            'recommandation_ia',
            'feuille_route_recue', 
            'feuille_route_validee', 
            'feuille_route_refusee',
            'nouveau_jalon', 
            'projet_termine', 
            'nouveau_delai_fixe'
        )");
    }
};
