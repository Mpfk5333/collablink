<?php

namespace App\Services;

use App\Models\{Transaction, Portefeuille, Notification, Precontrat, Contrat, User};
use Illuminate\Support\Facades\DB;

class PortefeuilleService
{
    /**
     * Valide une transaction :
     *  - Dépôt → crédite le solde
     *  - Mise en séquestre → déplace vers solde_sequestre (déjà fait à la création)
     *  - Libération jalon → crédite le freelance
     *  - Paiement freelance → crédite le freelance
     */
    public function validerTransaction(Transaction $transaction): void
    {
        DB::transaction(function () use ($transaction) {
            $portefeuille = $transaction->portefeuille;

            switch ($transaction->type) {
                case 'depot':
                    $portefeuille->increment('solde', $transaction->montant);
                    $portefeuille->increment('total_depose', $transaction->montant);
                    break;

                case 'retrait':
                    $portefeuille->decrement('solde', $transaction->montant);
                    $portefeuille->increment('total_retire', $transaction->montant);
                    break;

                case 'mise_en_sequestre':
                    // Débiter le solde et créditer le séquestre
                    $totalAvecCommission = $transaction->montant_total ?? ($transaction->montant + ($transaction->montant_commission ?? 0));
                    
                    if ($portefeuille->solde < $totalAvecCommission) {
                        // Si solde insuffisant, on annule
                        throw new \Exception('Solde insuffisant pour la mise en séquestre');
                    }
                    
                    $portefeuille->decrement('solde', $totalAvecCommission);
                    $portefeuille->increment('solde_sequestre', $transaction->montant);
                    break;

                case 'liberation_jalon':
                case 'paiement_freelance':
                    $portefeuille->increment('solde', $transaction->montant);
                    $portefeuille->increment('total_gagne', $transaction->montant);
                    break;

                case 'remboursement':
                    $portefeuille->increment('solde', $transaction->montant);
                    break;
            }

            $transaction->update(['statut' => 'validee']);

            // Notifier le propriétaire du portefeuille
            Notification::create([
                'utilisateur_id' => $portefeuille->utilisateur_id,
                'type' => 'paiement_valide',
                'titre' => 'Transaction validée',
                'contenu' => "Votre transaction de {$transaction->montant} FCFA ({$transaction->type}) a été validée.",
            ]);

            // Si la transaction concerne une PROPOSITION (nouveau flow) → créer le précontrat
            if (preg_match('/Paiement proposition ID: ([a-f0-9-]+)/', $transaction->description, $matches)) {
                $proposition = \App\Models\Proposition::with(['projet', 'freelance'])->find($matches[1]);
                
                if ($proposition && $proposition->statut === 'acceptee') {
                    // Créer le précontrat maintenant que le paiement est validé
                    $dateDebut = now()->addDays(2);
                    $dateFin = $proposition->delai_propose;
                    
                    $precontrat = Precontrat::create([
                        'projet_id' => $proposition->projet_id,
                        'proposition_id' => $proposition->id,
                        'objectifs' => $proposition->projet->description ?? "Réalisation du projet « {$proposition->projet->titre} » selon les conditions convenues.",
                        'clauses' => 'Clauses standards : Le freelance s\'engage à livrer le projet dans les délais convenus. Le client s\'engage à valider les jalons dans un délai de 3 jours ouvrables. En cas de litige, les deux parties s\'engagent à chercher une solution amiable.',
                        'budget_final' => $proposition->montant_propose,
                        'date_debut' => $dateDebut,
                        'date_fin' => $dateFin,
                        'statut' => 'en_attente_signature', // Directement en attente de signature car paiement déjà validé
                    ]);
                    
                    // Notifier le freelance que le précontrat est créé et prêt à signer
                    Notification::create([
                        'utilisateur_id' => $proposition->freelance_id,
                        'type' => 'precontrat_valide',
                        'titre' => 'Précontrat généré et prêt à signer !',
                        'contenu' => "Le paiement pour le projet « {$proposition->projet->titre} » a été validé par l'administrateur. Le précontrat est maintenant généré. Vous pouvez le consulter et le signer.",
                        'lien_action' => "/contrats",
                    ]);
                    
                    // Notifier le client que le précontrat est créé
                    Notification::create([
                        'utilisateur_id' => $proposition->projet->client_id,
                        'type' => 'paiement_valide',
                        'titre' => 'Paiement validé et précontrat généré !',
                        'contenu' => "Votre paiement pour le projet « {$proposition->projet->titre} » a été validé. Le précontrat a été généré automatiquement. En attente de la signature du freelance.",
                        'lien_action' => "/contrats",
                    ]);
                }
                
                return; // Fin du traitement pour les propositions
            }

            // Si la transaction est liée à un PRÉCONTRAT existant (ancien flow) → l'activer
            if (preg_match('/Paiement precontrat ID: ([a-f0-9-]+)/', $transaction->description, $matches)) {
                $precontrat = Precontrat::where('id', $matches[1])
                    ->where('statut', 'en_attente_paiement')
                    ->first();
                if ($precontrat) {
                    $precontrat->update(['statut' => 'en_attente_signature']);
                    
                    // Notifier le freelance que le paiement est validé et qu'il peut signer
                    Notification::create([
                        'utilisateur_id' => $precontrat->proposition->freelance_id,
                        'type' => 'precontrat_valide',
                        'titre' => 'Paiement validé !',
                        'contenu' => "Le paiement pour le projet « {$precontrat->projet->titre} » a été validé par l'administrateur. Vous pouvez maintenant consulter et signer le précontrat.",
                        'lien_action' => "/contrats",
                    ]);
                    
                    // Notifier le client
                    Notification::create([
                        'utilisateur_id' => $precontrat->projet->client_id,
                        'type' => 'paiement_valide',
                        'titre' => 'Paiement validé !',
                        'contenu' => "Votre paiement pour le projet « {$precontrat->projet->titre} » a été validé. En attente de la signature du freelance.",
                        'lien_action' => "/contrats",
                    ]);
                }
            }

            // Si la transaction est liée à un précontrat en attente → l'activer
            if ($transaction->contrat_id) {
                $precontrat = Precontrat::whereHas('contrat', fn($q) => $q->where('id', $transaction->contrat_id))
                    ->where('statut', 'en_attente_paiement')
                    ->first();
                if ($precontrat) {
                    $precontrat->update(['statut' => 'valide_freelance']);
                }
            }
        });
    }

    /**
     * Calcule la commission (5%) et le total à payer.
     */
    public function calculerCommission(float $montant): array
    {
        $taux = (float) config('collablink.taux', 0.05);
        $commission = round($montant * $taux, 2);
        return [
            'prix_projet' => $montant,
            'commission' => $commission,
            'total' => $montant + $commission,
            'taux' => $taux,
        ];
    }

    /**
     * Met en séquestre le montant + commission chez le client.
     * Crée une transaction en attente de validation admin.
     */
    public function miseEnSequestre(Portefeuille $portefeuille, float $montant, string $contratId = null): Transaction
    {
        $calc = $this->calculerCommission($montant);

        if ($portefeuille->solde < $calc['total']) {
            throw new \Exception('Solde insuffisant pour la mise en séquestre (commission 5% incluse)');
        }

        return DB::transaction(function () use ($portefeuille, $montant, $calc, $contratId) {
            // Débiter le solde immédiatement
            $portefeuille->decrement('solde', $calc['total']);
            $portefeuille->increment('solde_sequestre', $montant);

            $transaction = Transaction::create([
                'portefeuille_id' => $portefeuille->id,
                'type' => 'mise_en_sequestre',
                'montant' => $montant,
                'reference' => Transaction::genererReference('SEQ'),
                'statut' => 'validee',
                'contrat_id' => $contratId,
                'description' => "Mise en séquestre pour contrat (commission 5% : {$calc['commission']} FCFA, total : {$calc['total']} FCFA)",
                'montant_commission' => $calc['commission'],
                'montant_total' => $calc['total'],
            ]);

            return $transaction;
        });
    }

    /**
     * Libère les fonds séquestrés vers le freelance à la fin du projet.
     */
    public function libererFonds(Contrat $contrat): void
    {
        DB::transaction(function () use ($contrat) {
            $client = $contrat->client;
            $freelance = $contrat->freelance;

            $portefeuilleClient = Portefeuille::firstOrCreate(
                ['utilisateur_id' => $client->id],
                ['solde' => 0]
            );
            $portefeuilleFreelance = Portefeuille::firstOrCreate(
                ['utilisateur_id' => $freelance->id],
                ['solde' => 0]
            );

            $montant = $contrat->montant_total;

            // Débiter le séquestre
            $portefeuilleClient->decrement('solde_sequestre', $montant);

            // Créditer le freelance (montant - commission)
            $calc = $this->calculerCommission($montant);
            $montantFreelance = $montant - $calc['commission'];

            $portefeuilleFreelance->increment('solde', $montantFreelance);
            $portefeuilleFreelance->increment('total_gagne', $montantFreelance);

            // Transaction de libération
            Transaction::create([
                'portefeuille_id' => $portefeuilleFreelance->id,
                'type' => 'paiement_freelance',
                'montant' => $montantFreelance,
                'reference' => Transaction::genererReference('PAY'),
                'statut' => 'validee',
                'contrat_id' => $contrat->id,
                'description' => "Paiement pour le contrat {$contrat->numero_contrat} (commission 5% : {$calc['commission']} FCFA)",
                'montant_commission' => $calc['commission'],
                'montant_total' => $montant,
            ]);

            // Notifier les deux parties
            Notification::create([
                'utilisateur_id' => $freelance->id,
                'type' => 'liberation_fonds',
                'titre' => 'Paiement reçu',
                'contenu' => "Vous avez reçu {$montantFreelance} FCFA pour le contrat {$contrat->numero_contrat}.",
            ]);

            Notification::create([
                'utilisateur_id' => $client->id,
                'type' => 'liberation_fonds',
                'titre' => 'Fonds libérés',
                'contenu' => "Les fonds séquestrés pour le contrat {$contrat->numero_contrat} ont été libérés vers le freelance.",
            ]);
        });
    }

    /**
     * Vérifie périodiquement les fonds séquestrés en attente (cron).
     */
    public static function libererFondsEnAttente(): void
    {
        // Implémentation cron pour libérer les fonds en attente de validation
    }
}
