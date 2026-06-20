<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\{Portefeuille, Transaction, User, Notification};
use App\Services\PortefeuilleService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;

class PortefeuilleController extends Controller
{
    public function show(Request $request)
    {
        $portefeuille = Portefeuille::firstOrCreate(
            ['utilisateur_id' => $request->user()->id],
            ['solde' => 0, 'solde_sequestre' => 0]
        );

        return response()->json([
            'portefeuille' => $portefeuille,
            // Rôles différents : client ne voit pas total_gagne, freelance ne voit que total_gagne
            'stats_affichables' => $request->user()->role === 'freelance'
                ? ['total_gagne' => $portefeuille->total_gagne]
                : ['solde' => $portefeuille->solde, 'solde_sequestre' => $portefeuille->solde_sequestre],
        ]);
    }

    public function depot(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'montant' => 'required|numeric|min:1000',
            'mode_paiement' => 'required|in:mobile_money,virement,carte,especes',
            'justificatif' => 'required|file|mimes:pdf,jpg,jpeg,png|max:5120',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $portefeuille = Portefeuille::firstOrCreate(
            ['utilisateur_id' => $request->user()->id],
            ['solde' => 0]
        );

        $justificatifPath = $request->file('justificatif')->store('justificatifs', 'public');

        $transaction = Transaction::create([
            'portefeuille_id' => $portefeuille->id,
            'type' => 'depot',
            'montant' => $request->montant,
            'reference' => Transaction::genererReference('DEP'),
            'statut' => 'en_attente',
            'justificatif_url' => $justificatifPath,
            'mode_paiement' => $request->mode_paiement,
            'description' => "Dépôt via {$request->mode_paiement}",
        ]);

        // Notifier les admins
        $admins = User::where('role', 'administrateur')->get();
        foreach ($admins as $admin) {
            Notification::create([
                'utilisateur_id' => $admin->id,
                'type' => 'paiement_valide',
                'titre' => 'Nouveau dépôt à valider',
                'contenu' => "{$request->user()->prenom} {$request->user()->nom} a effectué un dépôt de {$request->montant} FCFA en attente de validation.",
                'lien_action' => "/admin/transactions",
            ]);
        }

        return response()->json([
            'message' => 'Dépôt soumis. En attente de validation par l\'administrateur.',
            'transaction' => $transaction,
        ], 201);
    }

    public function retrait(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'montant' => 'required|numeric|min:1000',
            'mode_paiement' => 'required|in:mobile_money,virement,carte,especes',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $portefeuille = Portefeuille::where('utilisateur_id', $request->user()->id)->first();
        if (!$portefeuille || $portefeuille->solde < $request->montant) {
            return response()->json(['message' => 'Solde insuffisant'], 422);
        }

        $transaction = Transaction::create([
            'portefeuille_id' => $portefeuille->id,
            'type' => 'retrait',
            'montant' => $request->montant,
            'reference' => Transaction::genererReference('RET'),
            'statut' => 'en_attente',
            'mode_paiement' => $request->mode_paiement,
            'description' => "Retrait via {$request->mode_paiement}",
        ]);

        return response()->json([
            'message' => 'Demande de retrait soumise.',
            'transaction' => $transaction,
        ], 201);
    }

    public function transactions(Request $request)
    {
        $portefeuille = Portefeuille::where('utilisateur_id', $request->user()->id)->first();
        if (!$portefeuille) {
            return response()->json(['data' => []]);
        }

        $query = Transaction::where('portefeuille_id', $portefeuille->id);
        if ($request->has('statut')) {
            $query->where('statut', $request->statut);
        }

        return response()->json($query->orderByDesc('created_at')->paginate(20));
    }

    public function uploadJustificatif(Request $request, $id)
    {
        $transaction = Transaction::findOrFail($id);
        $portefeuille = Portefeuille::where('utilisateur_id', $request->user()->id)->first();

        if (!$portefeuille || $transaction->portefeuille_id !== $portefeuille->id) {
            return response()->json(['message' => 'Non autorisé'], 403);
        }

        $validator = Validator::make($request->all(), [
            'justificatif' => 'required|file|mimes:pdf,jpg,jpeg,png|max:5120',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $path = $request->file('justificatif')->store('justificatifs', 'public');
        $transaction->update(['justificatif_url' => $path]);

        return response()->json([
            'message' => 'Justificatif uploadé',
            'justificatif_url' => asset('storage/'.$path),
        ]);
    }

    /**
     * Admin valide une transaction (dépôt).
     * Si la transaction est liée à un précontrat, lance automatiquement la suite.
     */
    public function validerTransaction(Request $request, $id)
    {
        $user = $request->user();
        if (!$user->estAdministrateur()) {
            return response()->json(['message' => 'Non autorisé'], 403);
        }

        $transaction = Transaction::with('portefeuille.utilisateur')->findOrFail($id);

        if ($transaction->statut !== 'en_attente') {
            return response()->json(['message' => 'Transaction déjà traitée'], 422);
        }

        app(PortefeuilleService::class)->validerTransaction($transaction);

        return response()->json([
            'message' => 'Transaction validée. Le solde du portefeuille a été crédité.',
            'transaction' => $transaction->fresh(),
        ]);
    }

    public function rejeterTransaction(Request $request, $id)
    {
        $user = $request->user();
        if (!$user->estAdministrateur()) {
            return response()->json(['message' => 'Non autorisé'], 403);
        }

        $validator = Validator::make($request->all(), [
            'motif_rejet' => 'required|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $transaction = Transaction::with('portefeuille.utilisateur')->findOrFail($id);

        $transaction->update([
            'statut' => 'echouee',
            'motif_rejet' => $request->motif_rejet,
        ]);

        Notification::create([
            'utilisateur_id' => $transaction->portefeuille->utilisateur_id,
            'type' => 'paiement_rejete',
            'titre' => 'Transaction rejetée',
            'contenu' => "Votre dépôt de {$transaction->montant} FCFA a été rejeté. Motif : {$request->motif_rejet}",
        ]);

        return response()->json(['message' => 'Transaction rejetée']);
    }
}
