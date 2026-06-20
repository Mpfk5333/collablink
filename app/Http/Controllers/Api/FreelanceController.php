<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\{User, ProfilFreelance, FreelanceCompetence, Competence, RecommandationIA, Projet};
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class FreelanceController extends Controller
{
    /**
     * Recherche de freelances avec filtres avancés.
     * Support des paramètres : search, competenceId, tarifMin, tarifMax, tri
     * Support également du paramètre recommandation=true pour générer les recommandations IA
     */
    public function search(Request $request)
    {
        // Si c'est une demande de recommandation IA
        if ($request->boolean('recommandation')) {
            return $this->genererRecommandations($request);
        }

        $query = User::where('role', 'freelance')
            ->where('est_actif', true)
            ->with(['profilFreelance.competences.competence', 'profilFreelance.experiences']);

        // Recherche textuelle (nom, prénom, titre, bio, compétences)
        if ($request->has('search') && $request->search) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('nom', 'like', "%{$search}%")
                  ->orWhere('prenom', 'like', "%{$search}%")
                  ->orWhereHas('profilFreelance', function ($qq) use ($search) {
                      $qq->where('titre_professionnel', 'like', "%{$search}%")
                        ->orWhere('bio', 'like', "%{$search}%");
                  })
                  ->orWhereHas('profilFreelance.competences.competence', function ($qq) use ($search) {
                      $qq->where('nom', 'like', "%{$search}%");
                  });
            });
        }

        // Filtre par compétence spécifique
        if ($request->has('competenceId') && $request->competenceId !== '__toutes__') {
            $query->whereHas('profilFreelance.competences', function ($q) use ($request) {
                $q->where('competence_id', $request->competenceId);
            });
        }

        // Filtre par tarif minimum
        if ($request->has('tarifMin') && $request->tarifMin > 0) {
            $query->whereHas('profilFreelance', fn($q) => $q->where('tarif', '>=', $request->tarifMin));
        }

        // Filtre par tarif maximum
        if ($request->has('tarifMax') && $request->tarifMax > 0) {
            $query->whereHas('profilFreelance', fn($q) => $q->where('tarif', '<=', $request->tarifMax));
        }

        // Tri
        $tri = $request->tri ?? 'pertinence';
        switch ($tri) {
            case 'tarif_asc':
                $query->join('profil_freelances', 'utilisateurs.id', '=', 'profil_freelances.utilisateur_id')
                      ->orderBy('profil_freelances.tarif', 'asc')
                      ->select('utilisateurs.*');
                break;
            case 'tarif_desc':
                $query->join('profil_freelances', 'utilisateurs.id', '=', 'profil_freelances.utilisateur_id')
                      ->orderBy('profil_freelances.tarif', 'desc')
                      ->select('utilisateurs.*');
                break;
            case 'experience_desc':
                $query->join('profil_freelances', 'utilisateurs.id', '=', 'profil_freelances.utilisateur_id')
                      ->orderBy('profil_freelances.annees_experience', 'desc')
                      ->select('utilisateurs.*');
                break;
            case 'note_desc':
                $query->join('profil_freelances', 'utilisateurs.id', '=', 'profil_freelances.utilisateur_id')
                      ->orderBy('profil_freelances.score_fiabilite', 'desc')
                      ->select('utilisateurs.*');
                break;
            default:
                $query->orderByDesc('created_at');
        }

        $freelances = $query->get();
        return response()->json($freelances);
    }

    /**
     * Générer les recommandations IA pour les projets du client.
     * Analyse les compétences, expérience, tarifs et historique pour scorer chaque freelance.
     */
    private function genererRecommandations(Request $request)
    {
        $clientId = $request->clientId ?? $request->user()->id;

        // Récupérer les projets en recrutement du client
        $projets = Projet::where('client_id', $clientId)
            ->whereIn('statut', ['publie', 'en_recrutement'])
            ->with(['competences.competence'])
            ->get();

        if ($projets->isEmpty()) {
            return response()->json([
                'recommandations' => [],
                'message' => 'Aucun projet en recrutement. Publiez un projet pour obtenir des recommandations.'
            ]);
        }

        $toutesRecommandations = [];

        foreach ($projets as $projet) {
            // Récupérer tous les freelances actifs
            $freelances = User::where('role', 'freelance')
                ->where('est_actif', true)
                ->with(['profilFreelance.competences.competence', 'profilFreelance'])
                ->get();

            $competencesProjet = $projet->competences->pluck('competence.nom')->map(fn($c) => strtolower($c))->toArray();

            foreach ($freelances as $freelance) {
                if (!$freelance->profilFreelance) continue;

                $score = 0;
                $competencesMatch = [];
                $competencesManquantes = [];

                // 1. Score sur les compétences (40 points max)
                $competencesFreelance = $freelance->profilFreelance->competences->pluck('competence.nom')->map(fn($c) => strtolower($c))->toArray();
                
                foreach ($competencesProjet as $comp) {
                    if (in_array($comp, $competencesFreelance)) {
                        $score += 40 / count($competencesProjet);
                        $competencesMatch[] = ucfirst($comp);
                    } else {
                        $competencesManquantes[] = ucfirst($comp);
                    }
                }

                // 2. Score sur la fiabilité (20 points max)
                $score += ($freelance->profilFreelance->score_fiabilite / 5) * 20;

                // 3. Score sur le taux de complétion (20 points max)
                $score += ($freelance->profilFreelance->taux_completion / 100) * 20;

                // 4. Score sur l'expérience (10 points max)
                $score += min(10, $freelance->profilFreelance->nombre_projets);

                // 5. Score sur le tarif (10 points max) - si le tarif est proche du budget
                if ($freelance->profilFreelance->tarif && $projet->budget_estime) {
                    $tarifHoraire = $freelance->profilFreelance->tarif;
                    $budgetTotal = $projet->budget_estime;
                    // Estimation : 160h de travail par mois, calculer si le tarif est dans le budget
                    $coutEstime = $tarifHoraire * 160;
                    if ($coutEstime <= $budgetTotal) {
                        $score += 10;
                    } elseif ($coutEstime <= $budgetTotal * 1.2) {
                        $score += 5;
                    }
                }

                $score = round($score);

                // Générer une raison personnalisée
                $raison = '';
                if (count($competencesMatch) === count($competencesProjet)) {
                    $raison = 'Toutes les compétences requises maîtrisées';
                } elseif (count($competencesMatch) > 0) {
                    $raison = count($competencesMatch) . '/' . count($competencesProjet) . ' compétences correspondantes';
                } else {
                    $raison = 'Aucune compétence correspondante';
                }

                if ($freelance->profilFreelance->nombre_projets > 10) {
                    $raison .= ' • Expert confirmé (' . $freelance->profilFreelance->nombre_projets . ' projets)';
                }

                if ($freelance->profilFreelance->score_fiabilite >= 4.5) {
                    $raison .= ' • Excellente fiabilité';
                }

                $toutesRecommandations[] = [
                    'projetId' => $projet->id,
                    'projetTitre' => $projet->titre,
                    'projetDescription' => $projet->description,
                    'projetBudget' => $projet->budget_estime,
                    'projetStatut' => $projet->statut,
                    'freelance' => $freelance,
                    'scoreCorrespondance' => $score,
                    'raison' => $raison,
                    'competencesMatch' => $competencesMatch,
                    'competencesManquantes' => $competencesManquantes,
                ];
            }
        }

        // Trier par score décroissant
        usort($toutesRecommandations, fn($a, $b) => $b['scoreCorrespondance'] <=> $a['scoreCorrespondance']);

        return response()->json(['recommandations' => $toutesRecommandations]);
    }

    /**
     * Point d'entrée dédié pour les recommandations IA (appelé via /freelances/recommandations).
     */
    public function recommandations(Request $request)
    {
        return $this->genererRecommandations($request);
    }

    public function show($id)
    {
        $freelance = User::where('role', 'freelance')
            ->with(['profilFreelance.competences.competence', 'profilFreelance.experiences', 'evaluationsRecues'])
            ->findOrFail($id);
        return response()->json(['freelance' => $freelance]);
    }
}
