<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\{Evaluation, Contrat, User, ProfilFreelance};
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class EvaluationController extends Controller
{
    public function store(Request $request, $contratId)
    {
        $contrat = Contrat::findOrFail($contratId);
        $user = $request->user();

        if ($contrat->client_id !== $user->id && $contrat->freelance_id !== $user->id) {
            return response()->json(['message' => 'Non autorisé'], 403);
        }

        $validator = Validator::make($request->all(), [
            'note_globale' => 'required|numeric|min:0|max:5',
            'qualite' => 'nullable|numeric|min:0|max:5',
            'communication' => 'nullable|numeric|min:0|max:5',
            'delais' => 'nullable|numeric|min:0|max:5',
            'professionnalisme' => 'nullable|numeric|min:0|max:5',
            'commentaire' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $evalueId = $contrat->client_id === $user->id ? $contrat->freelance_id : $contrat->client_id;

        $evaluation = Evaluation::create([
            'contrat_id' => $contratId,
            'evaluateur_id' => $user->id,
            'evalue_id' => $evalueId,
            ...$validator->validated(),
        ]);

        // Mettre à jour les stats du freelance si c'est lui qui est évalué
        $evalue = User::find($evalueId);
        if ($evalue && $evalue->role === 'freelance' && $evalue->profilFreelance) {
            $moyenne = Evaluation::where('evalue_id', $evalueId)->avg('note_globale');
            $evalue->profilFreelance->update(['score_fiabilite' => $moyenne]);
        }

        return response()->json(['message' => 'Évaluation enregistrée', 'evaluation' => $evaluation], 201);
    }

    public function recues(Request $request)
    {
        $evaluations = Evaluation::with(['evaluateur', 'contrat.projet'])
            ->where('evalue_id', $request->user()->id)
            ->orderByDesc('created_at')
            ->paginate(15);
        return response()->json($evaluations);
    }

    public function donnees(Request $request)
    {
        $evaluations = Evaluation::with(['evalue', 'contrat.projet'])
            ->where('evaluateur_id', $request->user()->id)
            ->orderByDesc('created_at')
            ->paginate(15);
        return response()->json($evaluations);
    }
}
