<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\{User, Projet, Transaction, Contrat, Litige, JournalActivite};
use Illuminate\Http\Request;

class AdminController extends Controller
{
    public function dashboard()
    {
        return response()->json([
            'stats' => [
                'utilisateurs' => User::count(),
                'clients' => User::where('role', 'client')->count(),
                'freelances' => User::where('role', 'freelance')->count(),
                'projets_publies' => Projet::where('statut', 'publie')->count(),
                'projets_en_cours' => Projet::where('statut', 'en_cours')->count(),
                'projets_termines' => Projet::where('statut', 'termine')->count(),
                'transactions_en_attente' => Transaction::where('statut', 'en_attente')->count(),
                'transactions_validees' => Transaction::where('statut', 'validee')->count(),
                'contrats_actifs' => Contrat::where('statut', 'actif')->count(),
                'litiges_ouverts' => Litige::where('statut', 'ouvert')->count(),
            ],
            'revenus_commission' => Transaction::where('type', 'mise_en_sequestre')
                ->where('statut', 'validee')
                ->sum('montant_commission'),
        ]);
    }

    /**
     * Liste des utilisateurs avec pagination 15/page, recherche et filtre rôle.
     */
    public function utilisateurs(Request $request)
    {
        $query = User::with(['profilClient', 'profilFreelance', 'portefeuille']);

        if ($request->has('role') && $request->role) {
            $query->where('role', $request->role);
        }

        if ($request->has('search') && $request->search) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('nom', 'like', "%{$search}%")
                  ->orWhere('prenom', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%");
            });
        }

        return response()->json($query->orderByDesc('created_at')->paginate(15));
    }

    public function projets()
    {
        return response()->json(Projet::with('client')->orderByDesc('created_at')->paginate(15));
    }

    /**
     * Gestion des paiements : en attente + validés + refusés
     */
    public function transactions(Request $request)
    {
        $query = Transaction::with(['portefeuille.utilisateur', 'contrat.projet']);

        if ($request->has('statut') && $request->statut) {
            $query->where('statut', $request->statut);
        }

        return response()->json($query->orderByDesc('created_at')->paginate(20));
    }

    public function contrats()
    {
        return response()->json(Contrat::with(['projet', 'client', 'freelance'])->orderByDesc('created_at')->paginate(15));
    }

    public function litiges()
    {
        return response()->json(Litige::with(['contrat.projet', 'plaignant', 'defendeur'])->orderByDesc('created_at')->paginate(15));
    }

    public function activites()
    {
        return response()->json(JournalActivite::with('utilisateur')->orderByDesc('created_at')->paginate(50));
    }
}
