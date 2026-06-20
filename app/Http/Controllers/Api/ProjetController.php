<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Projet;
use App\Models\ProjetCompetence;
use App\Models\Competence;
use App\Models\RecommandationIA;
use App\Models\User;
use App\Models\Notification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;

class ProjetController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        $query = Projet::with(['client', 'competences.competence']);

        // Filtres par statut (dropdown)
        if ($request->has('statut')) {
            $statuts = explode(',', $request->statut);
            $query->whereIn('statut', $statuts);
        }

        // Filtre par type (candidature / proposition)
        if ($request->has('type_source')) {
            if ($request->type_source === 'candidature') {
                $query->whereHas('propositions', fn($q) => $q->where('freelance_id', $user->id));
            } elseif ($request->type_source === 'proposition') {
                $query->whereHas('propositionsIA', fn($q) => $q->where('freelance_id', $user->id));
            }
        }

        // Scope par rôle
        if ($user->role === 'client') {
            $query->where('client_id', $user->id);
        } elseif ($user->role === 'freelance') {
            // Freelance : projets publiés + projets où il a candidaté ou proposé
            $query->where(function ($q) use ($user) {
                $q->whereIn('statut', ['publie', 'en_recrutement'])
                  ->orWhereHas('propositions', fn($qq) => $qq->where('freelance_id', $user->id))
                  ->orWhereHas('propositionsIA', fn($qq) => $qq->where('freelance_id', $user->id));
            });
        }

        // Recherche textuelle
        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('titre', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%");
            });
        }

        $projets = $query->orderByDesc('created_at')->paginate(15);
        return response()->json($projets);
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'titre' => 'required|string|max:255',
            'description' => 'required|string',
            'budget_estime' => 'required|numeric|min:0',
            'delai_livraison' => 'required|date|after:now',
            'type_contrat' => 'nullable|in:forfait,regie',
            'competences' => 'nullable|array',
            'competences.*' => 'string',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $data = $validator->validated();
        $data['client_id'] = $request->user()->id;
        $data['statut'] = 'brouillon';

        $projet = Projet::create($data);

        // Attacher les compétences (insensible à la casse)
        if (!empty($data['competences'])) {
            foreach ($data['competences'] as $compName) {
                // Recherche insensible à la casse
                $comp = Competence::whereRaw('LOWER(nom) = ?', [strtolower(trim($compName))])->first();
                if (!$comp) {
                    $cat = \App\Models\CategorieCompetence::firstOrCreate(['nom' => 'Général']);
                    $comp = Competence::create(['nom' => ucfirst(strtolower(trim($compName))), 'categorie_id' => $cat->id]);
                }
                ProjetCompetence::firstOrCreate([
                    'projet_id' => $projet->id,
                    'competence_id' => $comp->id,
                ]);
            }
        }

        return response()->json([
            'message' => 'Projet créé',
            'projet' => $projet->load(['competences.competence']),
        ], 201);
    }

    public function show($id)
    {
        $projet = Projet::with([
            'client', 'competences.competence', 'propositions.freelance',
            'propositionsIA.freelance', 'precontrats', 'contrats'
        ])->findOrFail($id);
        return response()->json(['projet' => $projet]);
    }

    public function update(Request $request, $id)
    {
        $projet = Projet::findOrFail($id);

        if ($projet->client_id !== $request->user()->id && !$request->user()->estAdministrateur()) {
            return response()->json(['message' => 'Non autorisé'], 403);
        }

        $validator = Validator::make($request->all(), [
            'titre' => 'sometimes|string|max:255',
            'description' => 'sometimes|string',
            'budget_estime' => 'sometimes|numeric|min:0',
            'delai_livraison' => 'sometimes|date',
            'type_contrat' => 'sometimes|nullable|in:forfait,regie',
            'statut' => 'sometimes|in:brouillon,publie,en_analyse_ia,en_recrutement,en_cours,en_litige,termine,annule',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $projet->update($validator->validated());
        return response()->json(['message' => 'Projet mis à jour', 'projet' => $projet->fresh()]);
    }

    public function destroy(Request $request, $id)
    {
        $projet = Projet::findOrFail($id);

        if ($projet->client_id !== $request->user()->id && !$request->user()->estAdministrateur()) {
            return response()->json(['message' => 'Non autorisé'], 403);
        }

        // Empêcher la suppression si projet en cours
        if (in_array($projet->statut, ['en_cours', 'en_litige'])) {
            return response()->json(['message' => 'Impossible de supprimer un projet en cours ou en litige'], 422);
        }

        $projet->delete();
        return response()->json(['message' => 'Projet supprimé']);
    }

    public function publier(Request $request, $id)
    {
        $projet = Projet::findOrFail($id);

        if ($projet->client_id !== $request->user()->id) {
            return response()->json(['message' => 'Non autorisé'], 403);
        }

        if (!$projet->cahier_charges_url) {
            return response()->json(['message' => 'Le cahier des charges est obligatoire pour publier'], 422);
        }

        $projet->update([
            'statut' => 'publie',
            'date_publication' => now(),
        ]);

        // Lancer la génération automatique des recommandations IA
        $this->genererRecommandationsIA($projet);

        return response()->json([
            'message' => 'Projet publié. Les freelances peuvent désormais postuler.',
            'projet' => $projet->fresh(),
        ]);
    }

    public function uploadCahierCharges(Request $request, $id)
    {
        $projet = Projet::findOrFail($id);

        if ($projet->client_id !== $request->user()->id) {
            return response()->json(['message' => 'Non autorisé'], 403);
        }

        $validator = Validator::make($request->all(), [
            'fichier' => 'required|file|mimes:pdf,doc,docx|max:10240',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $path = $request->file('fichier')->store('cahiers_charges', 'public');
        $projet->update(['cahier_charges_url' => $path]);

        return response()->json([
            'message' => 'Cahier des charges uploadé',
            'url' => asset('storage/'.$path),
        ]);
    }

    public function downloadCahierCharges($id)
    {
        $projet = Projet::findOrFail($id);
        if (!$projet->cahier_charges_url) {
            return response()->json(['message' => 'Aucun cahier des charges'], 404);
        }

        $file = storage_path('app/public/'.$projet->cahier_charges_url);
        if (!file_exists($file)) {
            return response()->json(['message' => 'Fichier introuvable'], 404);
        }

        return response()->download($file, basename($file), [
            'Content-Type' => mime_content_type($file),
        ]);
    }

    /**
     * Génère des recommandations IA pour un projet nouvellement publié.
     */
    private function genererRecommandationsIA(Projet $projet): void
    {
        $competenceIds = $projet->competences->pluck('competence_id')->toArray();

        $freelances = User::where('role', 'freelance')
            ->where('est_actif', true)
            ->whereHas('profilFreelance.competences', function ($q) use ($competenceIds) {
                $q->whereIn('competence_id', $competenceIds);
            })
            ->with('profilFreelance')
            ->get();

        foreach ($freelances as $freelance) {
            // Calcul du score de correspondance
            $score = $this->calculerScore($projet, $freelance);

            RecommandationIA::create([
                'projet_id' => $projet->id,
                'freelance_id' => $freelance->id,
                'score_correspondance' => $score,
                'notifie' => true,
            ]);

            // Notifier le freelance
            Notification::create([
                'utilisateur_id' => $freelance->id,
                'type' => 'recommandation_ia',
                'titre' => 'Nouvelle recommandation IA',
                'contenu' => "Vous avez été recommandé pour le projet « {$projet->titre} » avec un score de {$score}%.",
                'lien_action' => "/projets/{$projet->id}",
            ]);
        }
    }

    private function calculerScore(Projet $projet, User $freelance): float
    {
        $competenceIdsProjet = $projet->competences->pluck('competence_id')->toArray();
        $competenceIdsFreelance = $freelance->profilFreelance
            ? $freelance->profilFreelance->competences->pluck('competence_id')->toArray()
            : [];

        $inter = count(array_intersect($competenceIdsProjet, $competenceIdsFreelance));
        $union = count(array_unique(array_merge($competenceIdsProjet, $competenceIdsFreelance))) ?: 1;
        $scoreCompetences = ($inter / $union) * 70;

        $experience = $freelance->profilFreelance && $freelance->profilFreelance->annees_experience
            ? min($freelance->profilFreelance->annees_experience * 2, 10)
            : 0;

        $fiabilite = $freelance->profilFreelance
            ? ($freelance->profilFreelance->score_fiabilite / 5) * 20
            : 0;

        return round($scoreCompetences + $experience + $fiabilite, 2);
    }
}
