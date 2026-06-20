<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\ProfilClient;
use App\Models\ProfilFreelance;
use App\Models\Portefeuille;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;

class AuthController extends Controller
{
    public function register(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'nom' => 'required|string|max:255',
            'prenom' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:utilisateurs',
            'mot_de_passe' => 'required|string|min:6|confirmed',
            'role' => ['required', Rule::in(['client', 'freelance'])],
            'telephone' => 'nullable|string|max:20',
            'pays' => 'nullable|string|max:100',
            // Profil client
            'type' => 'nullable|in:particulier,entreprise',
            'nom_entreprise' => 'nullable|string|max:255',
            'secteur_activite' => 'nullable|string|max:255',
            // Profil freelance
            'titre_professionnel' => 'nullable|string|max:255|required_if:role,freelance',
            'tarif' => 'nullable|numeric',
            'annees_experience' => 'nullable|integer|min:0',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $data = $validator->validated();

        $user = User::create([
            'nom' => $data['nom'],
            'prenom' => $data['prenom'],
            'email' => $data['email'],
            'mot_de_passe' => Hash::make($data['mot_de_passe']),
            'role' => $data['role'],
            'telephone' => $data['telephone'] ?? null,
            'pays' => $data['pays'] ?? null,
            'est_actif' => true,
        ]);

        // Création du portefeuille
        $portefeuille = Portefeuille::create([
            'utilisateur_id' => $user->id,
            'solde' => 0,
            'solde_sequestre' => 0,
        ]);

        // Création du profil selon le rôle
        if ($user->role === 'client') {
            ProfilClient::create([
                'utilisateur_id' => $user->id,
                'type' => $data['type'] ?? 'particulier',
                'nom_entreprise' => $data['nom_entreprise'] ?? null,
                'secteur_activite' => $data['secteur_activite'] ?? null,
            ]);
        } elseif ($user->role === 'freelance') {
            ProfilFreelance::create([
                'utilisateur_id' => $user->id,
                'titre_professionnel' => $data['titre_professionnel'] ?? 'Freelance',
                'tarif' => $data['tarif'] ?? null,
                'annees_experience' => $data['annees_experience'] ?? null,
            ]);
        }

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'message' => 'Inscription réussie',
            'user' => $user->load(['profilClient', 'profilFreelance', 'portefeuille']),
            'token' => $token,
        ], 201);
    }

    public function login(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|string|email',
            'mot_de_passe' => 'required|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $user = User::where('email', $request->email)->first();

        if (!$user || !Hash::check($request->mot_de_passe, $user->mot_de_passe)) {
            return response()->json(['message' => 'Identifiants incorrects'], 401);
        }

        if (!$user->est_actif) {
            return response()->json(['message' => 'Compte désactivé. Contactez l\'administrateur.'], 403);
        }

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'message' => 'Connexion réussie',
            'user' => $user->load(['profilClient', 'profilFreelance', 'portefeuille']),
            'token' => $token,
        ]);
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();
        return response()->json(['message' => 'Déconnexion réussie']);
    }

    public function me(Request $request)
    {
        return response()->json([
            'user' => $request->user()->load(['profilClient', 'profilFreelance', 'portefeuille']),
        ]);
    }

    public function updateProfile(Request $request)
    {
        $user = $request->user();
        $validator = Validator::make($request->all(), [
            'nom' => 'sometimes|string|max:255',
            'prenom' => 'sometimes|string|max:255',
            'telephone' => 'sometimes|nullable|string|max:20',
            'pays' => 'sometimes|nullable|string|max:100',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $user->update($validator->validated());
        return response()->json(['message' => 'Profil mis à jour', 'user' => $user->fresh()]);
    }

    public function updatePassword(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'current_password' => 'required|string',
            'mot_de_passe' => 'required|string|min:6|confirmed',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $user = $request->user();
        if (!Hash::check($request->current_password, $user->mot_de_passe)) {
            return response()->json(['message' => 'Mot de passe actuel incorrect'], 422);
        }

        $user->update(['mot_de_passe' => Hash::make($request->mot_de_passe)]);
        return response()->json(['message' => 'Mot de passe modifié']);
    }

    public function uploadAvatar(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'photo' => 'required|image|max:5120',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $path = $request->file('photo')->store('avatars', 'public');
        $user = $request->user();
        $user->update(['photo_url' => $path]);

        return response()->json([
            'message' => 'Avatar mis à jour',
            'photo_url' => asset('storage/'.$path),
        ]);
    }

    public function uploadSignature(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'signature' => 'required|image|max:2048',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $path = $request->file('signature')->store('signatures', 'public');
        $user = $request->user();
        $user->update(['signature_url' => $path]);

        return response()->json([
            'message' => 'Signature mise à jour',
            'signature_url' => asset('storage/'.$path),
        ]);
    }

    public function forgotPassword(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|string|email',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $user = User::where('email', $request->email)->first();
        if (!$user) {
            return response()->json(['message' => 'Si l\'email existe, un lien de réinitialisation a été envoyé.']);
        }

        // Ici, envoyer l'email avec le token
        // Pour l'instant on renvoie juste un message
        return response()->json(['message' => 'Si l\'email existe, un lien de réinitialisation a été envoyé.']);
    }

    public function resetPassword(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|string|email',
            'token' => 'required|string',
            'mot_de_passe' => 'required|string|min:6|confirmed',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        // Logique de réinitialisation - à implémenter avec DB table password_reset_tokens
        return response()->json(['message' => 'Mot de passe réinitialisé']);
    }
}
