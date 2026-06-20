<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\{Proposition, Precontrat, Contrat, Projet, Notification, User, Conversation, ConversationParticipant, Message};
use App\Services\PortefeuilleService;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;

class ContratController extends Controller
{
    public function precontrats(Request $request)
    {
        $user = $request->user();
        $query = Precontrat::with(['projet.client', 'proposition.freelance.profilFreelance']);

        if ($user->role === 'client') {
            $query->whereHas('projet', fn($q) => $q->where('client_id', $user->id));
        } elseif ($user->role === 'freelance') {
            $query->whereHas('proposition', fn($q) => $q->where('freelance_id', $user->id));
        }

        return response()->json($query->orderByDesc('created_at')->paginate(15));
    }

    /**
     * Génère un précontrat à partir d'une proposition acceptée.
     * Calcule automatiquement la commission 5% et le total à payer.
     */
    public function genererPrecontrat(Request $request, $propositionId)
    {
        $proposition = Proposition::with(['projet', 'freelance'])->findOrFail($propositionId);
        $user = $request->user();

        if ($proposition->projet->client_id !== $user->id) {
            return response()->json(['message' => 'Non autorisé'], 403);
        }

        if ($proposition->statut !== 'acceptee') {
            return response()->json(['message' => 'La proposition doit être acceptée d\'abord'], 422);
        }

        $validator = Validator::make($request->all(), [
            'objectifs' => 'required|string',
            'clauses' => 'nullable|string',
            'date_debut' => 'required|date|after:now',
            'date_fin' => 'required|date|after:date_debut',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $data = $validator->validated();
        $data['projet_id'] = $proposition->projet_id;
        $data['proposition_id'] = $proposition->id;
        $data['budget_final'] = $proposition->montant_propose;
        $data['statut'] = 'en_attente_paiement';

        $precontrat = Precontrat::create($data);

        // Calcul de la commission
        $calc = app(PortefeuilleService::class)->calculerCommission($precontrat->budget_final);

        // Créer une transaction de mise en séquestre en attente de validation
        $portefeuille = $proposition->projet->client->portefeuille()->firstOrCreate(['solde' => 0]);

        // Notifier le freelance
        Notification::create([
            'utilisateur_id' => $proposition->freelance_id,
            'type' => 'precontrat_genere',
            'titre' => 'Précontrat généré',
            'contenu' => "Un précontrat a été généré pour le projet « {$proposition->projet->titre} ». Budget : {$precontrat->budget_final} FCFA. En attente du paiement du client.",
            'lien_action' => "/precontrats/{$precontrat->id}",
        ]);

        return response()->json([
            'message' => 'Précontrat généré. Le client doit maintenant procéder au paiement (commission 5% incluse).',
            'precontrat' => $precontrat,
            'paiement' => $calc,
        ], 201);
    }

    public function validerPrecontrat(Request $request, $id)
    {
        $precontrat = Precontrat::with(['projet', 'proposition.freelance'])->findOrFail($id);
        $user = $request->user();

        if ($precontrat->proposition->freelance_id !== $user->id) {
            return response()->json(['message' => 'Non autorisé'], 403);
        }

        if (!in_array($precontrat->statut, ['genere', 'en_attente_paiement', 'valide_freelance'])) {
            return response()->json(['message' => 'Précontrat déjà traité'], 422);
        }

        // Vérifier que le paiement a été validé
        if ($precontrat->statut !== 'valide_freelance') {
            return response()->json(['message' => 'Le paiement doit être validé par l\'administrateur d\'abord'], 422);
        }

        $precontrat->update(['statut' => 'signe']);

        // Créer le contrat
        $contrat = Contrat::create([
            'precontrat_id' => $precontrat->id,
            'projet_id' => $precontrat->projet_id,
            'client_id' => $precontrat->projet->client_id,
            'freelance_id' => $precontrat->proposition->freelance_id,
            'numero_contrat' => Contrat::genererNumero(),
            'montant_total' => $precontrat->budget_final,
            'statut' => 'actif',
        ]);

        // Mettre le projet en cours
        $precontrat->projet->update(['statut' => 'en_cours']);

        // Créer la conversation
        $conversation = Conversation::create(['projet_id' => $precontrat->projet_id]);
        ConversationParticipant::create([
            'conversation_id' => $conversation->id,
            'utilisateur_id' => $precontrat->projet->client_id,
        ]);
        ConversationParticipant::create([
            'conversation_id' => $conversation->id,
            'utilisateur_id' => $precontrat->proposition->freelance_id,
        ]);

        // Message système pour forcer l'envoi de la feuille de route
        Message::create([
            'conversation_id' => $conversation->id,
            'expediteur_id' => $precontrat->proposition->freelance_id,
            'contenu' => "Bonjour, conformément au workflow du projet, je vais vous envoyer la feuille de route contenant les différentes tâches et leurs durées. Veuillez la valider pour que nous puissions commencer.",
        ]);

        // Notifier les deux parties
        Notification::create([
            'utilisateur_id' => $precontrat->projet->client_id,
            'type' => 'contrat_signe',
            'titre' => 'Contrat signé !',
            'contenu' => "Le contrat {$contrat->numero_contrat} a été signé. Le projet est maintenant en cours. Le freelance va vous envoyer la feuille de route.",
            'lien_action' => "/contrats/{$contrat->id}",
        ]);

        Notification::create([
            'utilisateur_id' => $precontrat->proposition->freelance_id,
            'type' => 'contrat_signe',
            'titre' => 'Contrat signé !',
            'contenu' => "Vous avez signé le contrat {$contrat->numero_contrat}. N'oubliez pas d'envoyer la feuille de route au client via la messagerie.",
            'lien_action' => "/contrats/{$contrat->id}",
        ]);

        return response()->json([
            'message' => 'Précontrat signé. Le contrat est actif.',
            'contrat' => $contrat,
        ]);
    }

    public function refuserPrecontrat(Request $request, $id)
    {
        $validator = Validator::make($request->all(), [
            'motif' => 'required|string',
        ]);

        $precontrat = Precontrat::with(['projet', 'proposition.freelance'])->findOrFail($id);
        $user = $request->user();

        if ($precontrat->proposition->freelance_id !== $user->id) {
            return response()->json(['message' => 'Non autorisé'], 403);
        }

        $precontrat->update(['statut' => 'refuse_freelance']);

        // Remettre le projet en recrutement
        $precontrat->projet->update(['statut' => 'en_recrutement']);

        // Rembourser le séquestre
        app(PortefeuilleService::class);
        $portefeuilleClient = $precontrat->projet->client->portefeuille;
        if ($portefeuilleClient && $portefeuilleClient->solde_sequestre >= $precontrat->budget_final) {
            $portefeuilleClient->decrement('solde_sequestre', $precontrat->budget_final);
            $portefeuilleClient->increment('solde', $precontrat->budget_final);

            \App\Models\Transaction::create([
                'portefeuille_id' => $portefeuilleClient->id,
                'type' => 'remboursement',
                'montant' => $precontrat->budget_final,
                'reference' => \App\Models\Transaction::genererReference('RMB'),
                'statut' => 'validee',
                'description' => "Remboursement séquestre (précontrat refusé : {$request->motif})",
            ]);
        }

        Notification::create([
            'utilisateur_id' => $precontrat->projet->client_id,
            'type' => 'precontrat_refuse',
            'titre' => 'Précontrat refusé',
            'contenu' => "Le freelance a refusé le précontrat. Motif : {$request->motif}. Vos fonds ont été remboursés.",
        ]);

        return response()->json(['message' => 'Précontrat refusé. Le client a été remboursé.']);
    }

    public function index(Request $request)
    {
        $user = $request->user();
        $query = Contrat::with(['projet', 'client', 'freelance', 'jalons']);

        if ($user->role === 'client') {
            $query->where('client_id', $user->id);
        } elseif ($user->role === 'freelance') {
            $query->where('freelance_id', $user->id);
        }

        return response()->json($query->orderByDesc('created_at')->paginate(15));
    }

    public function show($id)
    {
        $contrat = Contrat::with([
            'projet', 'client', 'freelance', 'precontrat',
            'jalons' => fn($q) => $q->orderBy('ordre'),
            'evaluations', 'litiges', 'feuilleRoute'
        ])->findOrFail($id);
        return response()->json(['contrat' => $contrat]);
    }

    public function downloadPdf($id)
    {
        $contrat = Contrat::with(['projet', 'client', 'freelance', 'precontrat'])->findOrFail($id);

        $pdf = Pdf::loadView('contrats.pdf', compact('contrat'));
        $filename = "contrat_{$contrat->numero_contrat}.pdf";

        return response($pdf->output(), 200, [
            'Content-Type' => 'application/pdf',
            'Content-Disposition' => 'attachment; filename="'.$filename.'"',
        ]);
    }

    public function terminer(Request $request, $id)
    {
        $contrat = Contrat::findOrFail($id);
        $user = $request->user();

        if ($contrat->client_id !== $user->id && !$user->estAdministrateur()) {
            return response()->json(['message' => 'Non autorisé'], 403);
        }

        $contrat->update(['statut' => 'termine']);
        $contrat->projet->update(['statut' => 'termine']);

        // Libérer les fonds vers le freelance
        app(PortefeuilleService::class)->libererFonds($contrat);

        return response()->json(['message' => 'Projet terminé. Fonds libérés vers le freelance.']);
    }

    public function payerPrecontrat(Request $request, $id)
    {
        $precontrat = Precontrat::findOrFail($id);
        $user = $request->user();

        $validator = Validator::make($request->all(), [
            'justificatif_url' => 'required|string',
            'mode_paiement' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $portefeuille = $user->portefeuille()->firstOrCreate(['solde' => 0]);
        $calc = app(\App\Services\PortefeuilleService::class)->calculerCommission($precontrat->budget_final);

        $transaction = \App\Models\Transaction::create([
            'portefeuille_id' => $portefeuille->id,
            'type' => 'mise_en_sequestre',
            'montant' => $precontrat->budget_final,
            'reference' => \App\Models\Transaction::genererReference('SEQ'),
            'statut' => 'en_attente',
            'justificatif_url' => $request->justificatif_url,
            'mode_paiement' => $request->mode_paiement ?? 'mobile_money',
            'description' => "Paiement precontrat ID: {$precontrat->id} (commission 5% incluse)",
            'montant_commission' => $calc['commission'],
            'montant_total' => $calc['total'],
        ]);

        // Notifier les administrateurs
        $admins = User::where('role', 'administrateur')->get();
        foreach ($admins as $admin) {
            Notification::create([
                'utilisateur_id' => $admin->id,
                'type' => 'paiement_valide',
                'titre' => 'Nouveau paiement de contrat à valider',
                'contenu' => "Le client {$user->prenom} {$user->nom} a soumis un paiement de {$calc['total']} FCFA pour le précontrat du projet « {$precontrat->projet->titre} ».",
                'lien_action' => "/admin/transactions",
            ]);
        }

        return response()->json([
            'message' => 'Paiement soumis. En attente de validation par l\'administrateur.',
            'transaction' => $transaction,
        ]);
    }
}
