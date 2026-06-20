<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\{PropositionIA, Projet, Notification, Precontrat, Proposition, User};
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

/**
 * PropositionIA : un freelance envoie une proposition à un client suite à une
 * recommandation IA ou via la recherche de freelances ("Faire une proposition").
 *
 * 3 actions possibles côté client :
 *  - négocier : saisir son budget à lui (montant + délai)
 *  - valider : accepter tel quel → lance le workflow précontrat + paiement
 *  - refuser : refuser avec motif
 *
 * Si négocie, le freelance peut à son tour accepter ou refuser la négociation.
 */
class PropositionIAController extends Controller
{
    public function store(Request $request, $projetId)
    {
        $projet = Projet::findOrFail($projetId);
        $user = $request->user();

        if ($user->role !== 'freelance') {
            return response()->json(['message' => 'Seuls les freelances peuvent faire une proposition'], 403);
        }

        $validator = Validator::make($request->all(), [
            'lettre_motivation' => 'nullable|string',
            'montant_propose' => 'required|numeric|min:0',
            'delai_propose' => 'required|date|after:now',
            'source' => 'nullable|in:recommandation_ia,recherche_freelance',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $existante = PropositionIA::where('projet_id', $projet->id)
            ->where('freelance_id', $user->id)
            ->whereIn('statut', ['en_attente', 'negociation', 'validee'])
            ->first();
        if ($existante) {
            return response()->json(['message' => 'Vous avez déjà une proposition en cours sur ce projet'], 422);
        }

        $data = $validator->validated();
        $data['projet_id'] = $projet->id;
        $data['freelance_id'] = $user->id;
        $data['statut'] = 'en_attente';

        $propositionIA = PropositionIA::create($data);

        // Notifier le client
        Notification::create([
            'utilisateur_id' => $projet->client_id,
            'type' => 'proposition_ia_recue',
            'titre' => 'Nouvelle proposition de freelance',
            'contenu' => "{$user->prenom} {$user->nom} vous a fait une proposition pour le projet « {$projet->titre} » : {$propositionIA->montant_propose} FCFA, livraison le {$propositionIA->delai_propose->format('d/m/Y')}.",
            'lien_action' => "/propositions-ia/{$propositionIA->id}",
        ]);

        return response()->json([
            'message' => 'Proposition envoyée. Le client a été notifié.',
            'proposition' => $propositionIA,
        ], 201);
    }

    public function recues(Request $request)
    {
        $user = $request->user();
        $propositions = PropositionIA::with(['projet', 'freelance.profilFreelance'])
            ->whereHas('projet', fn($q) => $q->where('client_id', $user->id))
            ->orderByDesc('created_at')
            ->paginate(15);
        return response()->json($propositions);
    }

    public function envoyees(Request $request)
    {
        $user = $request->user();
        $propositions = PropositionIA::with(['projet.client'])
            ->where('freelance_id', $user->id)
            ->orderByDesc('created_at')
            ->paginate(15);
        return response()->json($propositions);
    }

    /**
     * Client négocie : saisit son propre budget + délai
     */
    public function negocier(Request $request, $id)
    {
        $proposition = PropositionIA::with('projet')->findOrFail($id);
        $user = $request->user();

        if ($proposition->projet->client_id !== $user->id) {
            return response()->json(['message' => 'Non autorisé'], 403);
        }

        if ($proposition->statut !== 'en_attente') {
            return response()->json(['message' => 'Cette proposition ne peut plus être négociée'], 422);
        }

        $validator = Validator::make($request->all(), [
            'montant_negocie' => 'required|numeric|min:0',
            'delai_negocie' => 'required|date|after:now',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $proposition->update([
            'statut' => 'negociation',
            'montant_negocie' => $request->montant_negocie,
            'delai_negocie' => $request->delai_negocie,
        ]);

        Notification::create([
            'utilisateur_id' => $proposition->freelance_id,
            'type' => 'proposition_ia_negociee',
            'titre' => 'Contre-proposition reçue',
            'contenu' => "Le client a fait une contre-proposition sur le projet « {$proposition->projet->titre} » : {$proposition->montant_negocie} FCFA, livraison le {$proposition->delai_negocie->format('d/m/Y')}.",
            'lien_action' => "/propositions-ia/{$proposition->id}",
        ]);

        return response()->json([
            'message' => 'Contre-proposition envoyée au freelance',
            'proposition' => $proposition->fresh(),
        ]);
    }

    /**
     * Client valide directement la proposition → lance le workflow précontrat + paiement
     */
    public function valider(Request $request, $id)
    {
        $proposition = PropositionIA::with(['projet', 'freelance'])->findOrFail($id);
        $user = $request->user();

        if ($proposition->projet->client_id !== $user->id) {
            return response()->json(['message' => 'Non autorisé'], 403);
        }

        if (!in_array($proposition->statut, ['en_attente', 'negociation'])) {
            return response()->json(['message' => 'Cette proposition ne peut plus être validée'], 422);
        }

        $montantFinal = $proposition->statut === 'negociation' && $proposition->montant_negocie
            ? $proposition->montant_negocie
            : $proposition->montant_propose;
        $delaiFinal = $proposition->statut === 'negociation' && $proposition->delai_negocie
            ? $proposition->delai_negocie
            : $proposition->delai_propose;

        $proposition->update(['statut' => 'validee']);

        // Créer une Proposition classique pour réutiliser le workflow existant
        $propositionClassique = Proposition::create([
            'projet_id' => $proposition->projet_id,
            'freelance_id' => $proposition->freelance_id,
            'lettre_motivation' => $proposition->lettre_motivation ?? 'Proposition IA acceptée',
            'montant_propose' => $montantFinal,
            'delai_propose' => $delaiFinal,
            'statut' => 'acceptee',
        ]);

        // Mettre le projet en recrutement
        $proposition->projet->update(['statut' => 'en_recrutement']);

        Notification::create([
            'utilisateur_id' => $proposition->freelance_id,
            'type' => 'proposition_ia_validee',
            'titre' => 'Proposition acceptée !',
            'contenu' => "Votre proposition pour le projet « {$proposition->projet->titre} » a été acceptée par le client. Procédez au paiement et à la signature du précontrat.",
            'lien_action' => "/propositions/{$propositionClassique->id}",
        ]);

        return response()->json([
            'message' => 'Proposition validée. Le freelance a été notifié. Il doit maintenant procéder au paiement et signer le précontrat.',
            'proposition_ia' => $proposition->fresh(),
            'proposition_classique_id' => $propositionClassique->id,
        ]);
    }

    /**
     * Client refuse la proposition
     */
    public function refuser(Request $request, $id)
    {
        $validator = Validator::make($request->all(), [
            'motif_refus' => 'required|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $proposition = PropositionIA::with('projet')->findOrFail($id);
        $user = $request->user();

        if ($proposition->projet->client_id !== $user->id) {
            return response()->json(['message' => 'Non autorisé'], 403);
        }

        $proposition->update([
            'statut' => 'refusee',
            'motif_refus' => $request->motif_refus,
        ]);

        Notification::create([
            'utilisateur_id' => $proposition->freelance_id,
            'type' => 'proposition_ia_refusee',
            'titre' => 'Proposition refusée',
            'contenu' => "Votre proposition pour le projet « {$proposition->projet->titre} » a été refusée. Motif : {$request->motif_refus}",
        ]);

        return response()->json(['message' => 'Proposition refusée']);
    }

    /**
     * Freelance accepte la contre-proposition du client
     */
    public function accepterNegociation(Request $request, $id)
    {
        $proposition = PropositionIA::with('projet')->findOrFail($id);
        $user = $request->user();

        if ($proposition->freelance_id !== $user->id) {
            return response()->json(['message' => 'Non autorisé'], 403);
        }

        if ($proposition->statut !== 'negociation') {
            return response()->json(['message' => 'Cette proposition n\'est pas en négociation'], 422);
        }

        $proposition->update(['statut' => 'validee']);

        // Créer Proposition classique avec montant négocié
        $propositionClassique = Proposition::create([
            'projet_id' => $proposition->projet_id,
            'freelance_id' => $proposition->freelance_id,
            'lettre_motivation' => $proposition->lettre_motivation ?? 'Proposition IA acceptée après négociation',
            'montant_propose' => $proposition->montant_negocie,
            'delai_propose' => $proposition->delai_negocie,
            'statut' => 'acceptee',
        ]);

        $proposition->projet->update(['statut' => 'en_recrutement']);

        Notification::create([
            'utilisateur_id' => $proposition->projet->client_id,
            'type' => 'negociation_acceptee',
            'titre' => 'Négociation acceptée',
            'contenu' => "{$user->prenom} {$user->nom} a accepté votre contre-proposition pour le projet « {$proposition->projet->titre} ».",
            'lien_action' => "/propositions/{$propositionClassique->id}",
        ]);

        return response()->json([
            'message' => 'Négociation acceptée. Le client a été notifié.',
            'proposition_classique_id' => $propositionClassique->id,
        ]);
    }

    public function refuserNegociation(Request $request, $id)
    {
        $proposition = PropositionIA::with('projet')->findOrFail($id);
        $user = $request->user();

        if ($proposition->freelance_id !== $user->id) {
            return response()->json(['message' => 'Non autorisé'], 403);
        }

        if ($proposition->statut !== 'negociation') {
            return response()->json(['message' => 'Cette proposition n\'est pas en négociation'], 422);
        }

        $proposition->update(['statut' => 'refusee']);

        Notification::create([
            'utilisateur_id' => $proposition->projet->client_id,
            'type' => 'negociation_refusee',
            'titre' => 'Négociation refusée',
            'contenu' => "{$user->prenom} {$user->nom} a refusé votre contre-proposition pour le projet « {$proposition->projet->titre} ».",
        ]);

        return response()->json(['message' => 'Négociation refusée']);
    }
}
