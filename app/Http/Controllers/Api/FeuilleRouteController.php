<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\{FeuilleRoute, Contrat, Jalon, Notification, User, Message, Conversation};
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;

/**
 * Feuille de route : document envoyé par le freelance au début du projet,
 * contenant les tâches + durées. Le client doit la valider pour débloquer les jalons.
 */
class FeuilleRouteController extends Controller
{
    public function store(Request $request, $contratId)
    {
        $contrat = Contrat::with(['projet', 'freelance'])->findOrFail($contratId);
        $user = $request->user();

        if ($contrat->freelance_id !== $user->id) {
            return response()->json(['message' => 'Seul le freelance peut envoyer la feuille de route'], 403);
        }

        $validator = Validator::make($request->all(), [
            'titre' => 'required|string|max:255',
            'description' => 'nullable|string',
            'fichier' => 'nullable|file|mimes:pdf,doc,docx|max:10240',
            'taches' => 'required|array|min:1',
            'taches.*.titre' => 'required|string|max:255',
            'taches.*.description' => 'nullable|string',
            'taches.*.duree_jours' => 'required|integer|min:1',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $data = $validator->validated();
        $fichierUrl = null;
        if ($request->hasFile('fichier')) {
            $fichierUrl = $request->file('fichier')->store('feuilles_route', 'public');
        }

        // Vérifier qu'il n'y a pas déjà une feuille de route active
        $existante = FeuilleRoute::where('contrat_id', $contratId)
            ->whereIn('statut', ['en_attente', 'validee'])
            ->first();
        if ($existante) {
            return response()->json(['message' => 'Une feuille de route existe déjà pour ce contrat'], 422);
        }

        $feuille = FeuilleRoute::create([
            'contrat_id' => $contratId,
            'freelance_id' => $user->id,
            'titre' => $data['titre'],
            'description' => $data['description'] ?? null,
            'fichier_url' => $fichierUrl,
            'contenu_json' => $data['taches'],
            'statut' => 'en_attente',
        ]);

        // Envoyer un message dans la conversation pour forcer la validation
        $conversation = Conversation::where('projet_id', $contrat->projet_id)->first();
        if ($conversation) {
            Message::create([
                'conversation_id' => $conversation->id,
                'expediteur_id' => $user->id,
                'contenu' => "J'ai envoyé la feuille de route « {$feuille->titre} ». Merci de la valider pour que nous puissions commencer les travaux.",
                'piece_jointe_url' => $fichierUrl,
                'piece_jointe_nom' => $fichierUrl ? basename($fichierUrl) : null,
            ]);
        }

        Notification::create([
            'utilisateur_id' => $contrat->client_id,
            'type' => 'feuille_route_recue',
            'titre' => 'Feuille de route reçue',
            'contenu' => "Le freelance a envoyé la feuille de route « {$feuille->titre} » pour le projet « {$contrat->projet->titre} ». Veuillez la valider pour démarrer.",
            'lien_action' => "/contrats/{$contrat->id}",
        ]);

        return response()->json([
            'message' => 'Feuille de route envoyée. Le client a été notifié.',
            'feuille_route' => $feuille,
        ], 201);
    }

    public function show($contratId)
    {
        $feuille = FeuilleRoute::where('contrat_id', $contratId)
            ->with(['freelance', 'jalons'])
            ->firstOrFail();
        return response()->json(['feuille_route' => $feuille]);
    }

    /**
     * Client valide la feuille de route → les jalons sont automatiquement créés à partir des tâches
     */
    public function valider(Request $request, $id)
    {
        $feuille = FeuilleRoute::with(['contrat.projet', 'freelance'])->findOrFail($id);
        $user = $request->user();

        if ($feuille->contrat->client_id !== $user->id) {
            return response()->json(['message' => 'Non autorisé'], 403);
        }

        if ($feuille->statut !== 'en_attente') {
            return response()->json(['message' => 'Feuille déjà traitée'], 422);
        }

        $feuille->update(['statut' => 'validee']);

        // Créer automatiquement les jalons à partir des tâches
        $taches = $feuille->contenu_json ?? [];
        $ordre = 1;
        $dateCourante = now();
        foreach ($taches as $tache) {
            $dureeJours = $tache['duree_jours'] ?? 1;
            $echeance = (clone $dateCourante)->addDays($dureeJours);

            Jalon::create([
                'contrat_id' => $feuille->contrat_id,
                'feuille_route_id' => $feuille->id,
                'titre' => $tache['titre'],
                'description' => $tache['description'] ?? null,
                'ordre' => $ordre++,
                'date_echeance' => $echeance,
                'statut' => 'a_faire',
                'cree_par' => 'freelance',
            ]);

            $dateCourante = $echeance;
        }

        Notification::create([
            'utilisateur_id' => $feuille->freelance_id,
            'type' => 'feuille_route_validee',
            'titre' => 'Feuille de route validée',
            'contenu' => "Le client a validé votre feuille de route pour le projet « {$feuille->contrat->projet->titre} ». Les jalons ont été créés automatiquement.",
            'lien_action' => "/contrats/{$feuille->contrat_id}",
        ]);

        return response()->json([
            'message' => 'Feuille de route validée. Les jalons ont été créés automatiquement.',
            'feuille_route' => $feuille->fresh(),
        ]);
    }

    public function refuser(Request $request, $id)
    {
        $validator = Validator::make($request->all(), [
            'motif_refus' => 'required|string',
        ]);

        $feuille = FeuilleRoute::with(['contrat.projet', 'freelance'])->findOrFail($id);
        $user = $request->user();

        if ($feuille->contrat->client_id !== $user->id) {
            return response()->json(['message' => 'Non autorisé'], 403);
        }

        $feuille->update([
            'statut' => 'refusee',
            'motif_refus' => $request->motif_refus,
        ]);

        Notification::create([
            'utilisateur_id' => $feuille->freelance_id,
            'type' => 'feuille_route_refusee',
            'titre' => 'Feuille de route refusée',
            'contenu' => "Le client a refusé votre feuille de route pour le projet « {$feuille->contrat->projet->titre} ». Motif : {$request->motif_refus}",
        ]);

        return response()->json(['message' => 'Feuille de route refusée']);
    }
}
