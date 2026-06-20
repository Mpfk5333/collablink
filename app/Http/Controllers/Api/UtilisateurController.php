<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\{User, ProfilClient, ProfilFreelance, ExperienceProfessionnelle, FreelanceCompetence, Competence, CategorieCompetence};
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class UtilisateurController extends Controller
{
    public function index(Request $request)
    {
        $query = User::with(['profilClient', 'profilFreelance']);

        if ($request->has('role')) {
            $query->where('role', $request->role);
        }

        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('nom', 'like', "%{$search}%")
                  ->orWhere('prenom', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%");
            });
        }

        return response()->json($query->orderByDesc('created_at')->paginate(15));
    }

    public function show($id)
    {
        $user = User::with(['profilClient', 'profilFreelance.competences.competence', 'profilFreelance.experiences', 'portefeuille'])
            ->findOrFail($id);
        return response()->json(['user' => $user]);
    }

    public function update(Request $request, $id)
    {
        $user = User::findOrFail($id);
        $currentUser = $request->user();

        if ($currentUser->id !== $user->id && !$currentUser->estAdministrateur()) {
            return response()->json(['message' => 'Non autorisé'], 403);
        }

        $validator = Validator::make($request->all(), [
            'nom' => 'sometimes|string|max:255',
            'prenom' => 'sometimes|string|max:255',
            'telephone' => 'sometimes|nullable|string|max:20',
            'pays' => 'sometimes|nullable|string|max:100',
            'est_actif' => 'sometimes|boolean',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $user->update($validator->validated());
        return response()->json(['message' => 'Utilisateur mis à jour', 'user' => $user->fresh()]);
    }

    public function destroy($id)
    {
        $user = User::findOrFail($id);
        $user->delete();
        return response()->json(['message' => 'Utilisateur supprimé']);
    }

    public function toggleActif($id)
    {
        $user = User::findOrFail($id);
        $user->update(['est_actif' => !$user->est_actif]);
        return response()->json([
            'message' => $user->est_actif ? 'Utilisateur activé' : 'Utilisateur désactivé',
            'est_actif' => $user->est_actif,
        ]);
    }
}
