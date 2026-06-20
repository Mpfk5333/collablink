<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\{Litige, Contrat, Notification, User, LitigeMessage};
use App\Services\LitigeService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class LitigeController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        $query = Litige::with(['contrat.projet', 'plaignant', 'defendeur', 'messages']);

        if ($user->role !== 'administrateur') {
            $query->where('plaignant_id', $user->id)->orWhere('defendeur_id', $user->id);
        }

        if ($request->has('statut')) {
            $query->where('statut', $request->statut);
        }

        return response()->json($query->orderByDesc('created_at')->paginate(15));
    }

    public function store(Request $request, $contratId)
    {
        $contrat = Contrat::findOrFail($contratId);
        $user = $request->user();

        if ($contrat->client_id !== $user->id && $contrat->freelance_id !== $user->id) {
            return response()->json(['message' => 'Non autorisé'], 403);
        }

        $validator = Validator::make($request->all(), [
            'motif' => 'required|string|max:255',
            'preuves' => 'nullable|array',
            'preuves.*' => 'string',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $defendeurId = $contrat->client_id === $user->id ? $contrat->freelance_id : $contrat->client_id;

        $litige = Litige::create([
            'contrat_id' => $contratId,
            'plaignant_id' => $user->id,
            'defendeur_id' => $defendeurId,
            'motif' => $request->motif,
            'preuves' => $request->preuves,
            'statut' => 'ouvert',
        ]);

        $contrat->projet->update(['statut' => 'en_litige']);

        Notification::create([
            'utilisateur_id' => $defendeurId,
            'type' => 'litige_ouvert',
            'titre' => 'Litige ouvert',
            'contenu' => "Un litige a été ouvert à votre encontre pour le projet « {$contrat->projet->titre} ». Motif : {$request->motif}",
            'lien_action' => "/litiges/{$litige->id}",
        ]);

        return response()->json(['message' => 'Litige ouvert', 'litige' => $litige], 201);
    }

    /**
     * Marque le litige comme résolu.
     * Si motif = delai_depasse, ouvre un popup chez le client pour fixer un nouveau délai.
     */
    public function resoudre(Request $request, $id)
    {
        $litige = Litige::with(['contrat.projet', 'plaignant', 'defendeur'])->findOrFail($id);
        $user = $request->user();

        if ($litige->plaignant_id !== $user->id && $litige->defendeur_id !== $user->id) {
            return response()->json(['message' => 'Non autorisé'], 403);
        }

        if ($litige->statut === 'resolu') {
            return response()->json(['message' => 'Litige déjà résolu'], 422);
        }

        // Si motif = delai_depasse → rediriger vers nouveauDelai
        if ($litige->motif === 'delai_depasse') {
            return response()->json([
                'message' => 'Pour résoudre un litige de type "délai dépassé", veuillez utiliser l\'endpoint nouveau-delai pour fixer un nouveau délai.',
                'requires_nouveau_delai' => true,
            ]);
        }

        app(LitigeService::class)->resoudre($litige);

        // Notifier les deux parties
        $autreUserId = $litige->plaignant_id === $user->id ? $litige->defendeur_id : $litige->plaignant_id;
        Notification::create([
            'utilisateur_id' => $autreUserId,
            'type' => 'litige_resolu',
            'titre' => 'Litige résolu',
            'contenu' => "Le litige sur le projet « {$litige->contrat->projet->titre} » a été marqué comme résolu.",
        ]);

        return response()->json(['message' => 'Litige résolu']);
    }

    /**
     * Fixe un nouveau délai pour un litige "délai dépassé".
     * Met à jour le projet + notifie les deux parties.
     */
    public function nouveauDelai(Request $request, $id)
    {
        $validator = Validator::make($request->all(), [
            'nouveau_delai' => 'required|date|after:now',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $litige = Litige::with(['contrat.projet', 'plaignant', 'defendeur'])->findOrFail($id);
        $user = $request->user();

        if ($litige->plaignant_id !== $user->id && $litige->defendeur_id !== $user->id) {
            return response()->json(['message' => 'Non autorisé'], 403);
        }

        if ($litige->statut === 'resolu') {
            return response()->json(['message' => 'Litige déjà résolu'], 422);
        }

        app(LitigeService::class)->resoudre($litige, $request->nouveau_delai);

        return response()->json([
            'message' => 'Nouveau délai fixé et litige résolu. Le projet a été mis à jour.',
            'nouveau_delai' => $request->nouveau_delai,
        ]);
    }

    public function ajouterMessage(Request $request, $id)
    {
        $litige = Litige::findOrFail($id);
        $user = $request->user();

        if ($litige->plaignant_id !== $user->id && $litige->defendeur_id !== $user->id && !$user->estAdministrateur()) {
            return response()->json(['message' => 'Non autorisé'], 403);
        }

        $validator = Validator::make($request->all(), [
            'contenu' => 'required|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $message = LitigeMessage::create([
            'litige_id' => $litige->id,
            'expediteur_id' => $user->id,
            'contenu' => $request->contenu,
        ]);

        // Notifier l'autre partie
        $autreUserId = $litige->plaignant_id === $user->id ? $litige->defendeur_id : $litige->plaignant_id;
        Notification::create([
            'utilisateur_id' => $autreUserId,
            'type' => 'nouveau_message',
            'titre' => 'Nouveau message dans le litige',
            'contenu' => "Nouveau message dans le litige : {$request->contenu}",
        ]);

        return response()->json(['message' => $message], 201);
    }
}
