<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\{Jalon, Contrat, Notification, User, Projet};
use App\Services\PortefeuilleService;
use App\Services\LitigeService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;

class JalonController extends Controller
{
    public function index(Request $request, $contratId)
    {
        $jalons = Jalon::where('contrat_id', $contratId)
            ->with(['litiges'])
            ->orderBy('ordre')
            ->get();
        return response()->json(['jalons' => $jalons]);
    }

    /**
     * Ajout d'un jalon.
     * - Le client peut ajouter un jalon même s'il y en a d'autres en cours de traitement.
     * - Un jalon ajouté est directement en statut 'a_faire' (attente).
     * - Le nouveau jalon est considéré comme la dernière tâche (ordre = max + 1).
     */
    public function store(Request $request, $contratId)
    {
        $contrat = Contrat::with(['projet', 'client', 'freelance'])->findOrFail($contratId);
        $user = $request->user();

        // Le client OU le freelance peuvent ajouter
        if ($contrat->client_id !== $user->id && $contrat->freelance_id !== $user->id) {
            return response()->json(['message' => 'Non autorisé'], 403);
        }

        $validator = Validator::make($request->all(), [
            'titre' => 'required|string|max:255',
            'description' => 'nullable|string',
            'date_echeance' => 'required|date|after:now',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $data = $validator->validated();
        $data['contrat_id'] = $contratId;
        $data['cree_par'] = $user->role;
        $data['statut'] = 'a_faire';

        // Le nouveau jalon prend l'ordre max + 1 (considéré comme la dernière tâche)
        $ordreMax = Jalon::where('contrat_id', $contratId)->max('ordre') ?? 0;
        $data['ordre'] = $ordreMax + 1;

        $jalon = Jalon::create($data);

        // Notifier l'autre partie
        $destinataireId = $user->role === 'client' ? $contrat->freelance_id : $contrat->client_id;
        Notification::create([
            'utilisateur_id' => $destinataireId,
            'type' => 'nouveau_jalon',
            'titre' => 'Nouveau jalon ajouté',
            'contenu' => "Un nouveau jalon « {$jalon->titre} » a été ajouté au contrat {$contrat->numero_contrat}. Il est en attente de validation.",
            'lien_action' => "/contrats/{$contrat->id}",
        ]);

        return response()->json([
            'message' => 'Jalon ajouté. Il est considéré comme la dernière tâche et en attente.',
            'jalon' => $jalon,
        ], 201);
    }

    public function update(Request $request, $id)
    {
        $jalon = Jalon::with('contrat')->findOrFail($id);
        $user = $request->user();

        if ($jalon->contrat->client_id !== $user->id && $jalon->contrat->freelance_id !== $user->id) {
            return response()->json(['message' => 'Non autorisé'], 403);
        }

        $validator = Validator::make($request->all(), [
            'titre' => 'sometimes|string|max:255',
            'description' => 'sometimes|nullable|string',
            'date_echeance' => 'sometimes|date',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $jalon->update($validator->validated());
        return response()->json(['message' => 'Jalon mis à jour', 'jalon' => $jalon->fresh()]);
    }

    public function destroy(Request $request, $id)
    {
        $jalon = Jalon::with('contrat')->findOrFail($id);
        $user = $request->user();

        if ($jalon->contrat->client_id !== $user->id && !$user->estAdministrateur()) {
            return response()->json(['message' => 'Non autorisé'], 403);
        }

        if (in_array($jalon->statut, ['valide', 'en_litige'])) {
            return response()->json(['message' => 'Impossible de supprimer un jalon validé ou en litige'], 422);
        }

        $jalon->delete();
        return response()->json(['message' => 'Jalon supprimé']);
    }

    /**
     * Freelance soumet un livrable pour un jalon.
     */
    public function soumettre(Request $request, $id)
    {
        $jalon = Jalon::with(['contrat.projet', 'contrat.client', 'contrat.freelance'])->findOrFail($id);
        $user = $request->user();

        if ($jalon->contrat->freelance_id !== $user->id) {
            return response()->json(['message' => 'Non autorisé'], 403);
        }

        $validator = Validator::make($request->all(), [
            'livrable' => 'required|file|max:20480',
            'commentaire' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $path = $request->file('livrable')->store('livrables', 'public');

        $jalon->update([
            'statut' => 'livrable_soumis',
            'livrable_url' => $path,
            'date_soumission' => now(),
            'commentaire_client' => $request->commentaire,
        ]);

        Notification::create([
            'utilisateur_id' => $jalon->contrat->client_id,
            'type' => 'jalon_soumis',
            'titre' => 'Livrable soumis',
            'contenu' => "Le freelance a soumis un livrable pour le jalon « {$jalon->titre} » du projet « {$jalon->contrat->projet->titre} ».",
            'lien_action' => "/contrats/{$jalon->contrat->id}",
        ]);

        return response()->json(['message' => 'Livrable soumis. Le client va le valider.', 'jalon' => $jalon->fresh()]);
    }

    /**
     * Client valide un jalon.
     * Si c'est le DERNIER jalon (dernière tâche) :
     *   - Si date du jour ≤ délai_livraison du projet → projet terminé + libération automatique des fonds
     *   - Sinon → litige "délai dépassé" créé automatiquement
     */
    public function valider(Request $request, $id)
    {
        $jalon = Jalon::with(['contrat.projet', 'contrat.client', 'contrat.freelance', 'contrat.jalons'])->findOrFail($id);
        $user = $request->user();

        if ($jalon->contrat->client_id !== $user->id) {
            return response()->json(['message' => 'Non autorisé'], 403);
        }

        if ($jalon->statut !== 'livrable_soumis' && $jalon->statut !== 'a_faire') {
            return response()->json(['message' => 'Ce jalon ne peut pas être validé'], 422);
        }

        DB::transaction(function () use ($jalon, $user) {
            $jalon->update([
                'statut' => 'valide',
                'date_validation' => now(),
            ]);

            $contrat = $jalon->contrat;

            // Vérifier s'il reste des jalons non validés
            $jalonsRestants = $contrat->jalons()
                ->where('statut', '!=', 'valide')
                ->where('id', '!=', $jalon->id)
                ->count();

            if ($jalonsRestants === 0) {
                // Tous les jalons sont validés : projet terminé
                $maintenant = now();
                $delaiProjet = $contrat->projet->delai_livraison;

                if ($maintenant <= $delaiProjet) {
                    // Projet terminé dans les délais → libération automatique des fonds
                    $contrat->update(['statut' => 'termine']);
                    $contrat->projet->update(['statut' => 'termine']);

                    app(PortefeuilleService::class)->libererFonds($contrat);

                    // Notifier les deux parties + admin
                    Notification::create([
                        'utilisateur_id' => $contrat->client_id,
                        'type' => 'projet_termine',
                        'titre' => 'Projet terminé',
                        'contenu' => "Le projet « {$contrat->projet->titre} » est terminé dans les délais. Les fonds ont été libérés vers le freelance.",
                    ]);

                    Notification::create([
                        'utilisateur_id' => $contrat->freelance_id,
                        'type' => 'projet_termine',
                        'titre' => 'Projet terminé',
                        'contenu' => "Le projet « {$contrat->projet->titre} » est terminé. Vous avez reçu votre paiement.",
                    ]);

                    // Notifier les admins
                    $admins = User::where('role', 'administrateur')->get();
                    foreach ($admins as $admin) {
                        Notification::create([
                            'utilisateur_id' => $admin->id,
                            'type' => 'projet_termine',
                            'titre' => 'Projet terminé',
                            'contenu' => "Le projet « {$contrat->projet->titre} » est terminé dans les délais. Fonds libérés automatiquement.",
                        ]);
                    }
                } else {
                    // Délai dépassé → ouverture automatique d'un litige
                    app(LitigeService::class)->creerLitigeDelaiDepasse($contrat);
                }
            }
        });

        return response()->json([
            'message' => 'Jalon validé.',
            'jalon' => $jalon->fresh(),
        ]);
    }

    public function refuser(Request $request, $id)
    {
        $validator = Validator::make($request->all(), [
            'commentaire' => 'required|string',
        ]);

        $jalon = Jalon::with(['contrat.projet', 'contrat.client', 'contrat.freelance'])->findOrFail($id);
        $user = $request->user();

        if ($jalon->contrat->client_id !== $user->id) {
            return response()->json(['message' => 'Non autorisé'], 403);
        }

        $jalon->update([
            'statut' => 'refuse',
            'commentaire_client' => $request->commentaire,
        ]);

        Notification::create([
            'utilisateur_id' => $jalon->contrat->freelance_id,
            'type' => 'jalon_refuse',
            'titre' => 'Jalon refusé',
            'contenu' => "Le jalon « {$jalon->titre} » a été refusé. Motif : {$request->commentaire}",
        ]);

        return response()->json(['message' => 'Jalon refusé']);
    }

    public function uploadLivrable(Request $request, $id)
    {
        $jalon = Jalon::with('contrat')->findOrFail($id);
        $user = $request->user();

        if ($jalon->contrat->freelance_id !== $user->id) {
            return response()->json(['message' => 'Non autorisé'], 403);
        }

        $validator = Validator::make($request->all(), [
            'livrable' => 'required|file|max:20480',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $path = $request->file('livrable')->store('livrables', 'public');
        $jalon->update([
            'livrable_url' => $path,
            'date_soumission' => now(),
            'statut' => 'livrable_soumis',
        ]);

        return response()->json([
            'message' => 'Livrable uploadé',
            'livrable_url' => asset('storage/'.$path),
        ]);
    }

    public function downloadLivrable($id)
    {
        $jalon = Jalon::findOrFail($id);
        if (!$jalon->livrable_url) {
            return response()->json(['message' => 'Aucun livrable'], 404);
        }

        $file = storage_path('app/public/'.$jalon->livrable_url);
        if (!file_exists($file)) {
            return response()->json(['message' => 'Fichier introuvable'], 404);
        }

        return response()->download($file, basename($file), [
            'Content-Type' => mime_content_type($file),
            'Content-Disposition' => 'attachment; filename="'.basename($file).'"',
        ]);
    }
}
