<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\{Proposition, Projet, Precontrat, Notification, User, Portefeuille, Transaction};
use App\Services\PortefeuilleService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class PropositionController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        $query = Proposition::with(['projet.client', 'freelance.profilFreelance']);

        if ($user->role === 'client') {
            $query->whereHas('projet', fn($q) => $q->where('client_id', $user->id));
        } elseif ($user->role === 'freelance') {
            $query->where('freelance_id', $user->id);
        }

        if ($request->has('statut')) {
            $query->where('statut', $request->statut);
        }

        return response()->json($query->orderByDesc('created_at')->paginate(15));
    }

    public function store(Request $request, $projetId)
    {
        $projet = Projet::findOrFail($projetId);
        $user = $request->user();

        if ($user->role !== 'freelance') {
            return response()->json(['message' => 'Seuls les freelances peuvent candidater'], 403);
        }

        if (!in_array($projet->statut, ['publie', 'en_recrutement'])) {
            return response()->json(['message' => 'Ce projet n\'accepte plus de candidatures'], 422);
        }

        $validator = Validator::make($request->all(), [
            'lettre_motivation' => 'required|string',
            'montant_propose' => 'required|numeric|min:0',
            'delai_propose' => 'required|date|after:now',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $existante = Proposition::where('projet_id', $projet->id)
            ->where('freelance_id', $user->id)
            ->first();
        if ($existante) {
            return response()->json(['message' => 'Vous avez déjà candidaté à ce projet'], 422);
        }

        $proposition = Proposition::create([
            'projet_id' => $projet->id,
            'freelance_id' => $user->id,
            ...$validator->validated(),
        ]);

        Notification::create([
            'utilisateur_id' => $projet->client_id,
            'type' => 'nouvelle_proposition',
            'titre' => 'Nouvelle candidature',
            'contenu' => "{$user->prenom} {$user->nom} a candidaté à votre projet « {$projet->titre} » pour {$proposition->montant_propose} FCFA.",
            'lien_action' => "/projets/{$projet->id}",
        ]);

        return response()->json(['message' => 'Candidature envoyée', 'proposition' => $proposition], 201);
    }

    public function update(Request $request, $id)
    {
        $proposition = Proposition::findOrFail($id);
        $user = $request->user();

        if ($proposition->freelance_id !== $user->id) {
            return response()->json(['message' => 'Non autorisé'], 403);
        }

        if ($proposition->statut !== 'en_attente') {
            return response()->json(['message' => 'Candidature déjà traitée'], 422);
        }

        $validator = Validator::make($request->all(), [
            'lettre_motivation' => 'sometimes|string',
            'montant_propose' => 'sometimes|numeric|min:0',
            'delai_propose' => 'sometimes|date|after:now',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $proposition->update($validator->validated());
        return response()->json(['message' => 'Candidature mise à jour', 'proposition' => $proposition->fresh()]);
    }

    public function accepter(Request $request, $id)
    {
        $proposition = Proposition::with('projet')->findOrFail($id);
        $user = $request->user();

        if ($proposition->projet->client_id !== $user->id) {
            return response()->json(['message' => 'Non autorisé'], 403);
        }

        $proposition->update(['statut' => 'acceptee']);
        $proposition->projet->update(['statut' => 'en_recrutement']);

        // Refuser automatiquement les autres candidatures
        Proposition::where('projet_id', $proposition->projet_id)
            ->where('id', '!=', $proposition->id)
            ->where('statut', 'en_attente')
            ->update(['statut' => 'refusee']);

        Notification::create([
            'utilisateur_id' => $proposition->freelance_id,
            'type' => 'proposition_acceptee',
            'titre' => 'Candidature acceptée',
            'contenu' => "Votre candidature pour le projet « {$proposition->projet->titre} » a été acceptée. Le client va procéder au paiement et générer le précontrat.",
            'lien_action' => "/propositions/{$proposition->id}",
        ]);

        return response()->json(['message' => 'Candidature acceptée', 'proposition' => $proposition->fresh()]);
    }

    public function refuser(Request $request, $id)
    {
        $validator = Validator::make($request->all(), [
            'motif' => 'nullable|string',
        ]);

        $proposition = Proposition::with('projet')->findOrFail($id);
        $user = $request->user();

        if ($proposition->projet->client_id !== $user->id) {
            return response()->json(['message' => 'Non autorisé'], 403);
        }

        $proposition->update(['statut' => 'refusee']);

        Notification::create([
            'utilisateur_id' => $proposition->freelance_id,
            'type' => 'proposition_refusee',
            'titre' => 'Candidature refusée',
            'contenu' => "Votre candidature pour le projet « {$proposition->projet->titre} » a été refusée.".($request->motif ? " Motif : {$request->motif}" : ''),
        ]);

        return response()->json(['message' => 'Candidature refusée']);
    }
}
