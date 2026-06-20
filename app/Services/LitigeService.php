<?php

namespace App\Services;

use App\Models\{Litige, Contrat, Jalon, Notification, User, Projet};
use Illuminate\Support\Facades\DB;

class LitigeService
{
    /**
     * Crée automatiquement un litige "délai dépassé" entre les deux parties.
     * Le statut du projet passe en "en_litige".
     */
    public function creerLitigeDelaiDepasse(Contrat $contrat): Litige
    {
        return DB::transaction(function () use ($contrat) {
            $litige = Litige::create([
                'contrat_id' => $contrat->id,
                'plaignant_id' => $contrat->client_id,
                'defendeur_id' => $contrat->freelance_id,
                'motif' => 'delai_depasse',
                'statut' => 'ouvert',
            ]);

            $contrat->update(['statut' => 'actif']); // reste actif mais projet en litige
            $contrat->projet->update(['statut' => 'en_litige']);

            // Notifier les deux parties
            Notification::create([
                'utilisateur_id' => $contrat->client_id,
                'type' => 'litige_ouvert',
                'titre' => 'Litige ouvert - Délai dépassé',
                'contenu' => "Le projet « {$contrat->projet->titre} » a dépassé le délai convenu. Un litige a été ouvert. Veuillez discuter avec l'autre partie pour trouver un accord sur un nouveau délai.",
                'lien_action' => "/litiges/{$litige->id}",
            ]);

            Notification::create([
                'utilisateur_id' => $contrat->freelance_id,
                'type' => 'litige_ouvert',
                'titre' => 'Litige ouvert - Délai dépassé',
                'contenu' => "Le projet « {$contrat->projet->titre} » a dépassé le délai convenu. Un litige a été ouvert. Veuillez discuter avec le client pour trouver un accord sur un nouveau délai.",
                'lien_action' => "/litiges/{$litige->id}",
            ]);

            return $litige;
        });
    }

    /**
     * Vérifie quotidiennement les projets dont le délai est dépassé.
     */
    public static function verifierDelaisDepasses(): void
    {
        $projetsEnCours = Projet::where('statut', 'en_cours')
            ->where('delai_livraison', '<', now())
            ->get();

        foreach ($projetsEnCours as $projet) {
            $contrat = $projet->contrats()->where('statut', 'actif')->first();
            if (!$contrat) continue;

            // Vérifier s'il existe déjà un litige "delai_depasse" non résolu
            $litigeExistant = Litige::where('contrat_id', $contrat->id)
                ->where('motif', 'delai_depasse')
                ->where('statut', '!=', 'resolu')
                ->exists();
            if ($litigeExistant) continue;

            app(self::class)->creerLitigeDelaiDepasse($contrat);
        }
    }

    /**
     * Résout un litige et, dans le cas "delai_depasse", ouvre un popup chez le client
     * pour fixer un nouveau délai.
     */
    public function resoudre(Litige $litige, ?string $nouveauDelai = null): void
    {
        DB::transaction(function () use ($litige, $nouveauDelai) {
            $litige->update([
                'statut' => 'resolu',
                'date_resolution' => now(),
                'nouveau_delai' => $nouveauDelai,
            ]);

            $contrat = $litige->contrat;

            // Si motif = delai_depasse et nouveau délai fixé → mettre à jour le projet
            if ($litige->motif === 'delai_depasse' && $nouveauDelai) {
                $contrat->projet->update([
                    'delai_livraison' => $nouveauDelai,
                    'statut' => 'en_cours',
                ]);

                // Notifier les deux parties
                Notification::create([
                    'utilisateur_id' => $contrat->client_id,
                    'type' => 'nouveau_delai_fixe',
                    'titre' => 'Nouveau délai fixé',
                    'contenu' => "Le litige a été résolu. Le nouveau délai pour le projet « {$contrat->projet->titre} » est le ".date('d/m/Y', strtotime($nouveauDelai)).".",
                ]);

                Notification::create([
                    'utilisateur_id' => $contrat->freelance_id,
                    'type' => 'nouveau_delai_fixe',
                    'titre' => 'Nouveau délai fixé',
                    'contenu' => "Le litige a été résolu. Le nouveau délai pour le projet « {$contrat->projet->titre} » est le ".date('d/m/Y', strtotime($nouveauDelai)).".",
                ]);
            } else {
                // Autre type de litige : remettre le projet en cours
                $contrat->projet->update(['statut' => 'en_cours']);
            }
        });
    }
}
