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
                    // Déjà débité à la création, on valide juste
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

            // Si la transaction est liée à un précontrat en attente (via description) → l'activer
            if (preg_match('/Paiement precontrat ID: ([a-f0-9-]+)/', $transaction->description, $matches)) {
                $precontrat = Precontrat::where('id', $matches[1])
                    ->where('statut', 'en_attente_paiement')
                    ->first();
                if ($precontrat) {
                    $precontrat->update(['statut' => 'valide_freelance']);
                    Notification::create([
                        'utilisateur_id' => $precontrat->proposition->freelance_id,
                        'type' => 'precontrat_valide',
                        'titre' => 'Paiement validé !',
                        'contenu' => "Le paiement pour le projet « {$precontrat->projet->titre} » a été validé. Vous pouvez maintenant signer le précontrat.",
                        'lien_action' => "/precontrats/{$precontrat->id}",
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
