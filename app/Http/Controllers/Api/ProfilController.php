<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ExperienceProfessionnelle;
use App\Models\FreelanceCompetence;
use App\Models\ProfilClient;
use App\Models\Formation;
use App\Models\Certification;
use App\Models\PortfolioProjet;
use App\Models\Langue;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class ProfilController extends Controller
{
    public function me(Request $request)
    {
        return response()->json([
            'user' => $request->user()->load([
                'profilClient',
                'profilFreelance.competences.competence',
                'profilFreelance.experiences',
                'profilFreelance.formations',
                'profilFreelance.certifications',
                'profilFreelance.portfolioProjets',
                'profilFreelance.langues',
                'portefeuille',
            ]),
        ]);
    }

    public function updateClient(Request $request)
    {
        $user = $request->user();
        $validator = Validator::make($request->all(), [
            'type' => 'sometimes|in:particulier,entreprise',
            'nom_entreprise' => 'sometimes|nullable|string|max:255',
            'secteur_activite' => 'sometimes|nullable|string|max:255',
            'domaines_projets' => 'sometimes|nullable|array',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $profil = $user->profilClient()->firstOrCreate(['utilisateur_id' => $user->id]);
        $profil->update($validator->validated());

        return response()->json(['message' => 'Profil client mis à jour', 'profil' => $profil->fresh()]);
    }

    public function updateFreelance(Request $request)
    {
        $user = $request->user();
        $validator = Validator::make($request->all(), [
            'titre_professionnel' => 'sometimes|string|max:255',
            'bio' => 'sometimes|nullable|string',
            'tarif' => 'sometimes|nullable|numeric',
            'annees_experience' => 'sometimes|nullable|integer|min:0',
            'lien_linkedin' => 'sometimes|nullable|string',
            'lien_github' => 'sometimes|nullable|string',
            'lien_portfolio' => 'sometimes|nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $profil = $user->profilFreelance()->firstOrCreate([
            'utilisateur_id' => $user->id,
        ], ['titre_professionnel' => 'Freelance']);
        $profil->update($validator->validated());

        return response()->json(['message' => 'Profil freelance mis à jour', 'profil' => $profil->fresh()]);
    }

    public function addExperience(Request $request)
    {
        $user = $request->user();

        $validator = Validator::make($request->all(), [
            'poste' => 'required|string|max:255',
            'entreprise' => 'required|string|max:255',
            'date_debut' => 'required|date',
            'date_fin' => 'nullable|date|after:date_debut',
            'description' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $profil = $user->profilFreelance;
        if (!$profil) {
            return response()->json(['message' => 'Profil freelance introuvable'], 422);
        }

        $exp = ExperienceProfessionnelle::create([
            'profil_freelance_id' => $profil->id,
            ...$validator->validated(),
        ]);

        return response()->json(['message' => 'Expérience ajoutée', 'experience' => $exp], 201);
    }

    public function updateExperience(Request $request, $id)
    {
        $exp = ExperienceProfessionnelle::findOrFail($id);
        $user = $request->user();

        if ($exp->profilFreelance->utilisateur_id !== $user->id) {
            return response()->json(['message' => 'Non autorisé'], 403);
        }

        $exp->update($request->all());

        return response()->json(['message' => 'Expérience mise à jour', 'experience' => $exp->fresh()]);
    }

    public function deleteExperience(Request $request, $id)
    {
        $exp = ExperienceProfessionnelle::findOrFail($id);
        $user = $request->user();

        if ($exp->profilFreelance->utilisateur_id !== $user->id) {
            return response()->json(['message' => 'Non autorisé'], 403);
        }

        $exp->delete();

        return response()->json(['message' => 'Expérience supprimée']);
    }

    // ============================================================
    // FORMATIONS
    // ============================================================
    public function addFormation(Request $request)
    {
        $user = $request->user();
        $validator = Validator::make($request->all(), [
            'diplome' => 'required|string|max:255',
            'etablissement' => 'required|string|max:255',
            'date_debut' => 'required|date',
            'date_fin' => 'nullable|date|after:date_debut',
            'description' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $profil = $user->profilFreelance;
        if (!$profil) {
            return response()->json(['message' => 'Profil freelance introuvable'], 422);
        }

        $formation = Formation::create([
            'profil_freelance_id' => $profil->id,
            ...$validator->validated(),
        ]);

        return response()->json(['message' => 'Formation ajoutée', 'formation' => $formation], 201);
    }

    public function deleteFormation(Request $request, $id)
    {
        $formation = Formation::findOrFail($id);
        $user = $request->user();

        if ($formation->profilFreelance->utilisateur_id !== $user->id) {
            return response()->json(['message' => 'Non autorisé'], 403);
        }

        $formation->delete();
        return response()->json(['message' => 'Formation supprimée']);
    }

    // ============================================================
    // CERTIFICATIONS
    // ============================================================
    public function addCertification(Request $request)
    {
        $user = $request->user();
        $validator = Validator::make($request->all(), [
            'nom' => 'required|string|max:255',
            'organisme' => 'required|string|max:255',
            'date_obtention' => 'required|date',
            'date_expiration' => 'nullable|date|after:date_obtention',
            'numero_certification' => 'nullable|string|max:255',
            'description' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $profil = $user->profilFreelance;
        if (!$profil) {
            return response()->json(['message' => 'Profil freelance introuvable'], 422);
        }

        $certification = Certification::create([
            'profil_freelance_id' => $profil->id,
            ...$validator->validated(),
        ]);

        return response()->json(['message' => 'Certification ajoutée', 'certification' => $certification], 201);
    }

    public function deleteCertification(Request $request, $id)
    {
        $certification = Certification::findOrFail($id);
        $user = $request->user();

        if ($certification->profilFreelance->utilisateur_id !== $user->id) {
            return response()->json(['message' => 'Non autorisé'], 403);
        }

        $certification->delete();
        return response()->json(['message' => 'Certification supprimée']);
    }

    // ============================================================
    // PORTFOLIO
    // ============================================================
    public function addPortfolioProjet(Request $request)
    {
        $user = $request->user();
        $validator = Validator::make($request->all(), [
            'titre' => 'required|string|max:255',
            'description' => 'nullable|string',
            'lien_projet' => 'nullable|string',
            'lien_demo' => 'nullable|string',
            'technologies' => 'nullable|string', // comma-separated
            'date_realisation' => 'nullable|date',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $profil = $user->profilFreelance;
        if (!$profil) {
            return response()->json(['message' => 'Profil freelance introuvable'], 422);
        }

        $data = $validator->validated();
        // Convertir technologies en array si présent
        if (isset($data['technologies']) && is_string($data['technologies'])) {
            $data['technologies'] = array_map('trim', explode(',', $data['technologies']));
        }

        $projet = PortfolioProjet::create([
            'profil_freelance_id' => $profil->id,
            ...$data,
        ]);

        return response()->json(['message' => 'Projet portfolio ajouté', 'projet' => $projet], 201);
    }

    public function deletePortfolioProjet(Request $request, $id)
    {
        $projet = PortfolioProjet::findOrFail($id);
        $user = $request->user();

        if ($projet->profilFreelance->utilisateur_id !== $user->id) {
            return response()->json(['message' => 'Non autorisé'], 403);
        }

        $projet->delete();
        return response()->json(['message' => 'Projet portfolio supprimé']);
    }

    // ============================================================
    // LANGUES
    // ============================================================
    public function addLangue(Request $request)
    {
        $user = $request->user();
        $validator = Validator::make($request->all(), [
            'langue' => 'required|string|max:255',
            'niveau' => 'required|in:debutant,intermediaire,avance,courant,natif',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $profil = $user->profilFreelance;
        if (!$profil) {
            return response()->json(['message' => 'Profil freelance introuvable'], 422);
        }

        $langue = Langue::create([
            'profil_freelance_id' => $profil->id,
            ...$validator->validated(),
        ]);

        return response()->json(['message' => 'Langue ajoutée', 'langue' => $langue], 201);
    }

    public function deleteLangue(Request $request, $id)
    {
        $langue = Langue::findOrFail($id);
        $user = $request->user();

        if ($langue->profilFreelance->utilisateur_id !== $user->id) {
            return response()->json(['message' => 'Non autorisé'], 403);
        }

        $langue->delete();
        return response()->json(['message' => 'Langue supprimée']);
    }
}
