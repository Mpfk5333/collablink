<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CategorieCompetence;
use App\Models\Competence;
use App\Models\FreelanceCompetence;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class CompetenceController extends Controller
{
    public function index()
    {
        return response()->json(Competence::with('categorie')->get());
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'nom' => 'required|string|max:255',
            'categorie_id' => 'nullable|exists:categorie_competences,id',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $data = $validator->validated();
        if (empty($data['categorie_id'])) {
            $cat = CategorieCompetence::firstOrCreate(['nom' => 'Général']);
            $data['categorie_id'] = $cat->id;
        }

        $comp = Competence::firstOrCreate([
            'nom' => $data['nom'],
            'categorie_id' => $data['categorie_id'],
        ]);

        return response()->json(['competence' => $comp], 201);
    }

    public function attachToProfile(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'competence_id' => 'sometimes|exists:competences,id',
            'nom' => 'sometimes|string',
            'niveau' => 'required|in:debutant,intermediaire,avance,expert',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $user = $request->user();
        $profil = $user->profilFreelance;
        if (!$profil) {
            return response()->json(['message' => 'Profil freelance introuvable'], 422);
        }

        $competenceId = $request->competence_id;
        if (!$competenceId && $request->nom) {
            $cat = CategorieCompetence::firstOrCreate(['nom' => 'Général']);
            $comp = Competence::firstOrCreate([
                'nom' => $request->nom,
                'categorie_id' => $cat->id,
            ]);
            $competenceId = $comp->id;
        }

        $fc = FreelanceCompetence::firstOrCreate([
            'profil_freelance_id' => $profil->id,
            'competence_id' => $competenceId,
        ], ['niveau' => $request->niveau]);

        return response()->json(['message' => 'Compétence ajoutée', 'freelance_competence' => $fc], 201);
    }

    public function detachFromProfile($id)
    {
        $user = request()->user();
        $profil = $user->profilFreelance;
        if (!$profil) {
            return response()->json(['message' => 'Profil freelance introuvable'], 422);
        }

        FreelanceCompetence::where('profil_freelance_id', $profil->id)
            ->where(function ($query) use ($id) {
                $query->where('competence_id', $id)
                      ->orWhere('id', $id);
            })
            ->delete();

        return response()->json(['message' => 'Compétence retirée']);
    }
}
