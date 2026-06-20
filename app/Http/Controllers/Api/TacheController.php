<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Tache;
use App\Models\Contrat;
use App\Models\Notification;
use App\Models\Litige;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class TacheController extends Controller
{
    /**
     * Liste toutes les tâches d'un contrat (Kanban)
     */
    public function index(Request $request, $contratId)
    {
        $contrat = Contrat::with(['client', 'freelance'])->findOrFail($contratId);
        $user = $request->user();

        // Vérifier que l'utilisateur est autorisé (client ou freelance du contrat)
        if ($contrat->client_id !== $user->id && $contrat->freelance_id !== $user->id) {
            return response()->json(['message' => 'Non autorisé'], 403);
        }

        $taches = Tache::where('contrat_id', $contratId)
            ->with(['jalon', 'createurPar'])
            ->orderBy('ordre')
            ->orderBy('created_at')
            ->get();

        // Grouper par statut pour le Kanban
        $kanban = [
            'a_faire' => $taches->where('statut', 'a_faire')->values(),
            'en_cours' => $taches->where('statut', 'en_cours')->values(),
            'livrable_soumis' => $taches->where('statut', 'livrable_soumis')->values(),
            'validee' => $taches->where('statut', 'validee')->values(),
            'refusee' => $taches->where('statut', 'refusee')->values(),
            'en_litige' => $taches->where('statut', 'en_litige')->values(),
        ];

        return response()->json([
            'contrat' => $contrat,
            'taches' => $taches,
            'kanban' => $kanban,
        ]);
    }

    /**
     * Créer une nouvelle tâche (réservé au client)
     */
    public function store(Request $request, $contratId)
    {
        $contrat = Contrat::findOrFail($contratId);
        $user = $request->user();

        // Seul le client peut créer des tâches
        if ($contrat->client_id !== $user->id) {
            return response()->json(['message' => 'Seul le client peut créer des tâches'], 403);
        }

        $validated = $request->validate([
            'titre' => 'required|string|max:255',
            'description' => 'nullable|string',
            'date_echeance' => 'nullable|date',
            'jalon_id' => 'nullable|uuid|exists:jalons,id',
            'ordre' => 'nullable|integer',
        ]);

        $tache = Tache::create([
            'contrat_id' => $contratId,
            'jalon_id' => $validated['jalon_id'] ?? null,
            'titre' => $validated['titre'],
            'description' => $validated['description'] ?? null,
            'date_echeance' => $validated['date_echeance'] ?? null,
            'ordre' => $validated['ordre'] ?? 0,
            'statut' => 'a_faire',
            'cree_par' => $user->id,
        ]);

        // Notifier le freelance
        Notification::create([
            'utilisateur_id' => $contrat->freelance_id,
            'type' => 'nouvelle_tache',
            'titre' => 'Nouvelle tâche assignée',
            'contenu' => "Le client a créé une nouvelle tâche : {$tache->titre}",
            'lien_action' => "/contrats/{$contratId}/taches",
        ]);

        return response()->json([
            'message' => 'Tâche créée avec succès',
            'tache' => $tache->load(['jalon', 'createurPar']),
        ], 201);
    }

    /**
     * Mettre à jour une tâche (titre, description, échéance) - Réservé au client
     */
    public function update(Request $request, $tacheId)
    {
        $tache = Tache::with('contrat')->findOrFail($tacheId);
        $user = $request->user();

        // Seul le client peut modifier
        if ($tache->contrat->client_id !== $user->id) {
            return response()->json(['message' => 'Seul le client peut modifier une tâche'], 403);
        }

        $validated = $request->validate([
            'titre' => 'sometimes|string|max:255',
            'description' => 'nullable|string',
            'date_echeance' => 'nullable|date',
            'ordre' => 'nullable|integer',
        ]);

        $tache->update($validated);

        return response()->json([
            'message' => 'Tâche mise à jour',
            'tache' => $tache->load(['jalon', 'createurPar']),
        ]);
    }

    /**
     * Supprimer une tâche (réservé au client)
     */
    public function destroy(Request $request, $tacheId)
    {
        $tache = Tache::with('contrat')->findOrFail($tacheId);
        $user = $request->user();

        if ($tache->contrat->client_id !== $user->id) {
            return response()->json(['message' => 'Seul le client peut supprimer une tâche'], 403);
        }

        // Ne pas supprimer si tâche déjà validée
        if ($tache->statut === 'validee') {
            return response()->json(['message' => 'Impossible de supprimer une tâche validée'], 422);
        }

        $tache->delete();

        return response()->json(['message' => 'Tâche supprimée']);
    }

    /**
     * DÉMARRER une tâche (freelance clique sur "Démarrer")
     */
    public function demarrer(Request $request, $tacheId)
    {
        $tache = Tache::with('contrat')->findOrFail($tacheId);
        $user = $request->user();

        // Seul le freelance peut démarrer
        if ($tache->contrat->freelance_id !== $user->id) {
            return response()->json(['message' => 'Seul le freelance peut démarrer une tâche'], 403);
        }

        if (!$tache->peutEtreDemarree()) {
            return response()->json(['message' => 'Cette tâche ne peut pas être démarrée (statut actuel: '.$tache->statut.')'], 422);
        }

        $tache->update([
            'statut' => 'en_cours',
            'date_debut' => now(),
        ]);

        // Notifier le client
        Notification::create([
            'utilisateur_id' => $tache->contrat->client_id,
            'type' => 'tache_demarree',
            'titre' => 'Tâche démarrée',
            'contenu' => "Le freelance a démarré la tâche : {$tache->titre}",
            'lien_action' => "/contrats/{$tache->contrat_id}/taches",
        ]);

        return response()->json([
            'message' => 'Tâche démarrée',
            'tache' => $tache->fresh(['jalon', 'createurPar']),
        ]);
    }

    /**
     * SOUMETTRE une tâche avec livrable (freelance clique sur "Soumettre")
     */
    public function soumettre(Request $request, $tacheId)
    {
        $tache = Tache::with('contrat')->findOrFail($tacheId);
        $user = $request->user();

        // Seul le freelance peut soumettre
        if ($tache->contrat->freelance_id !== $user->id) {
            return response()->json(['message' => 'Seul le freelance peut soumettre une tâche'], 403);
        }

        if (!$tache->peutEtreSoumise()) {
            return response()->json(['message' => 'Cette tâche ne peut pas être soumise (statut actuel: '.$tache->statut.')'], 422);
        }

        $validated = $request->validate([
            'livrable_url' => 'required|string',
            'commentaire_freelance' => 'nullable|string',
        ]);

        $tache->update([
            'statut' => 'livrable_soumis',
            'date_soumission' => now(),
            'livrable_url' => $validated['livrable_url'],
            'commentaire_freelance' => $validated['commentaire_freelance'] ?? null,
        ]);

        // Notifier le client
        Notification::create([
            'utilisateur_id' => $tache->contrat->client_id,
            'type' => 'tache_soumise',
            'titre' => 'Livrable soumis',
            'contenu' => "Le freelance a soumis le livrable pour : {$tache->titre}",
            'lien_action' => "/contrats/{$tache->contrat_id}/taches",
        ]);

        return response()->json([
            'message' => 'Livrable soumis avec succès',
            'tache' => $tache->fresh(['jalon', 'createurPar']),
        ]);
    }

    /**
     * VALIDER une tâche (client clique sur "Valider")
     */
    public function valider(Request $request, $tacheId)
    {
        $tache = Tache::with('contrat')->findOrFail($tacheId);
        $user = $request->user();

        // Seul le client peut valider
        if ($tache->contrat->client_id !== $user->id) {
            return response()->json(['message' => 'Seul le client peut valider une tâche'], 403);
        }

        if (!$tache->peutEtreValideeOuRefusee()) {
            return response()->json(['message' => 'Cette tâche ne peut pas être validée (statut actuel: '.$tache->statut.')'], 422);
        }

        $validated = $request->validate([
            'commentaire_client' => 'nullable|string',
        ]);

        $tache->update([
            'statut' => 'validee',
            'date_validation' => now(),
            'commentaire_client' => $validated['commentaire_client'] ?? null,
        ]);

        // Notifier le freelance
        Notification::create([
            'utilisateur_id' => $tache->contrat->freelance_id,
            'type' => 'tache_validee',
            'titre' => 'Tâche validée ✅',
            'contenu' => "Le client a validé la tâche : {$tache->titre}",
            'lien_action' => "/contrats/{$tache->contrat_id}/taches",
        ]);

        return response()->json([
            'message' => 'Tâche validée',
            'tache' => $tache->fresh(['jalon', 'createurPar']),
        ]);
    }

    /**
     * REFUSER une tâche (client clique sur "Refuser")
     */
    public function refuser(Request $request, $tacheId)
    {
        $tache = Tache::with('contrat')->findOrFail($tacheId);
        $user = $request->user();

        // Seul le client peut refuser
        if ($tache->contrat->client_id !== $user->id) {
            return response()->json(['message' => 'Seul le client peut refuser une tâche'], 403);
        }

        if (!$tache->peutEtreValideeOuRefusee()) {
            return response()->json(['message' => 'Cette tâche ne peut pas être refusée (statut actuel: '.$tache->statut.')'], 422);
        }

        $validated = $request->validate([
            'commentaire_client' => 'required|string',
        ]);

        $tache->update([
            'statut' => 'refusee',
            'commentaire_client' => $validated['commentaire_client'],
        ]);

        // Notifier le freelance
        Notification::create([
            'utilisateur_id' => $tache->contrat->freelance_id,
            'type' => 'tache_refusee',
            'titre' => 'Tâche refusée ❌',
            'contenu' => "Le client a refusé la tâche : {$tache->titre}. Raison : {$validated['commentaire_client']}",
            'lien_action' => "/contrats/{$tache->contrat_id}/taches",
        ]);

        return response()->json([
            'message' => 'Tâche refusée',
            'tache' => $tache->fresh(['jalon', 'createurPar']),
        ]);
    }

    /**
     * REFAIRE une tâche refusée (freelance clique sur "Refaire")
     */
    public function refaire(Request $request, $tacheId)
    {
        $tache = Tache::with('contrat')->findOrFail($tacheId);
        $user = $request->user();

        // Seul le freelance peut refaire
        if ($tache->contrat->freelance_id !== $user->id) {
            return response()->json(['message' => 'Seul le freelance peut refaire une tâche'], 403);
        }

        if (!$tache->peutEtreRefaite()) {
            return response()->json(['message' => 'Cette tâche ne peut pas être refaite (statut actuel: '.$tache->statut.')'], 422);
        }

        $tache->update([
            'statut' => 'en_cours',
            'livrable_url' => null,
            'commentaire_freelance' => null,
        ]);

        // Notifier le client
        Notification::create([
            'utilisateur_id' => $tache->contrat->client_id,
            'type' => 'tache_refaite',
            'titre' => 'Tâche en cours de correction',
            'contenu' => "Le freelance travaille sur la correction de : {$tache->titre}",
            'lien_action' => "/contrats/{$tache->contrat_id}/taches",
        ]);

        return response()->json([
            'message' => 'Tâche remise en cours',
            'tache' => $tache->fresh(['jalon', 'createurPar']),
        ]);
    }

    /**
     * CRÉER un LITIGE sur une tâche (client clique sur "Litige" si délai dépassé)
     */
    public function creerLitige(Request $request, $tacheId)
    {
        $tache = Tache::with('contrat')->findOrFail($tacheId);
        $user = $request->user();

        // Seul le client peut créer un litige
        if ($tache->contrat->client_id !== $user->id) {
            return response()->json(['message' => 'Seul le client peut créer un litige'], 403);
        }

        // Vérifier que la tâche est en retard
        if (!$tache->estEnRetard()) {
            return response()->json(['message' => 'Cette tâche n\'est pas en retard, impossible de créer un litige'], 422);
        }

        $validated = $request->validate([
            'description' => 'required|string',
        ]);

        // Créer le litige
        $litige = Litige::create([
            'contrat_id' => $tache->contrat_id,
            'jalon_id' => $tache->jalon_id,
            'ouvert_par' => $user->id,
            'type' => 'delai',
            'description' => "Tâche en retard : {$tache->titre}. " . $validated['description'],
            'statut' => 'ouvert',
        ]);

        // Mettre la tâche en litige
        $tache->update(['statut' => 'en_litige']);

        // Notifier le freelance
        Notification::create([
            'utilisateur_id' => $tache->contrat->freelance_id,
            'type' => 'litige_ouvert',
            'titre' => '⚠️ Litige ouvert',
            'contenu' => "Un litige a été ouvert sur la tâche : {$tache->titre}",
            'lien_action' => "/litiges/{$litige->id}",
        ]);

        // Notifier les admins
        $admins = \App\Models\User::where('role', 'administrateur')->get();
        foreach ($admins as $admin) {
            Notification::create([
                'utilisateur_id' => $admin->id,
                'type' => 'litige_ouvert',
                'titre' => 'Nouveau litige',
                'contenu' => "Litige ouvert sur le contrat {$tache->contrat->numero_contrat} pour la tâche : {$tache->titre}",
                'lien_action' => "/admin/litiges/{$litige->id}",
            ]);
        }

        return response()->json([
            'message' => 'Litige créé',
            'litige' => $litige,
            'tache' => $tache->fresh(['jalon', 'createurPar']),
        ]);
    }
}
