<?php

namespace Database\Seeders;

use App\Models\{CategorieCompetence, Competence};
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // Catégories & compétences de base (nécessaires pour le système)
        $catDev = CategorieCompetence::create(['nom' => 'Développement']);
        $catDesign = CategorieCompetence::create(['nom' => 'Design']);
        $catMarketing = CategorieCompetence::create(['nom' => 'Marketing']);
        $catRedaction = CategorieCompetence::create(['nom' => 'Rédaction']);
        $catGestion = CategorieCompetence::create(['nom' => 'Gestion de projet']);

        // Compétences développement
        Competence::create(['nom' => 'React', 'categorie_id' => $catDev->id]);
        Competence::create(['nom' => 'Vue.js', 'categorie_id' => $catDev->id]);
        Competence::create(['nom' => 'Angular', 'categorie_id' => $catDev->id]);
        Competence::create(['nom' => 'Node.js', 'categorie_id' => $catDev->id]);
        Competence::create(['nom' => 'Laravel', 'categorie_id' => $catDev->id]);
        Competence::create(['nom' => 'Python', 'categorie_id' => $catDev->id]);
        Competence::create(['nom' => 'PHP', 'categorie_id' => $catDev->id]);
        Competence::create(['nom' => 'JavaScript', 'categorie_id' => $catDev->id]);
        Competence::create(['nom' => 'TypeScript', 'categorie_id' => $catDev->id]);
        Competence::create(['nom' => 'Java', 'categorie_id' => $catDev->id]);
        Competence::create(['nom' => 'C#', 'categorie_id' => $catDev->id]);
        Competence::create(['nom' => 'Swift', 'categorie_id' => $catDev->id]);
        Competence::create(['nom' => 'Kotlin', 'categorie_id' => $catDev->id]);
        Competence::create(['nom' => 'Flutter', 'categorie_id' => $catDev->id]);
        Competence::create(['nom' => 'React Native', 'categorie_id' => $catDev->id]);

        // Compétences design
        Competence::create(['nom' => 'Figma', 'categorie_id' => $catDesign->id]);
        Competence::create(['nom' => 'Adobe XD', 'categorie_id' => $catDesign->id]);
        Competence::create(['nom' => 'Photoshop', 'categorie_id' => $catDesign->id]);
        Competence::create(['nom' => 'Illustrator', 'categorie_id' => $catDesign->id]);
        Competence::create(['nom' => 'InDesign', 'categorie_id' => $catDesign->id]);
        Competence::create(['nom' => 'Sketch', 'categorie_id' => $catDesign->id]);
        Competence::create(['nom' => 'UI/UX Design', 'categorie_id' => $catDesign->id]);

        // Compétences marketing
        Competence::create(['nom' => 'SEO', 'categorie_id' => $catMarketing->id]);
        Competence::create(['nom' => 'SEA', 'categorie_id' => $catMarketing->id]);
        Competence::create(['nom' => 'Google Ads', 'categorie_id' => $catMarketing->id]);
        Competence::create(['nom' => 'Facebook Ads', 'categorie_id' => $catMarketing->id]);
        Competence::create(['nom' => 'Email Marketing', 'categorie_id' => $catMarketing->id]);
        Competence::create(['nom' => 'Social Media', 'categorie_id' => $catMarketing->id]);

        // Compétences rédaction
        Competence::create(['nom' => 'Rédaction web', 'categorie_id' => $catRedaction->id]);
        Competence::create(['nom' => 'Copywriting', 'categorie_id' => $catRedaction->id]);
        Competence::create(['nom' => 'Traduction', 'categorie_id' => $catRedaction->id]);
        Competence::create(['nom' => 'Relecture', 'categorie_id' => $catRedaction->id]);

        // Compétences gestion
        Competence::create(['nom' => 'Scrum', 'categorie_id' => $catGestion->id]);
        Competence::create(['nom' => 'Agile', 'categorie_id' => $catGestion->id]);
        Competence::create(['nom' => 'Jira', 'categorie_id' => $catGestion->id]);
        Competence::create(['nom' => 'Trello', 'categorie_id' => $catGestion->id]);

        echo "✅ Seed terminé : Compétences et catégories créées (pas de données de test)\n";
    }
}
