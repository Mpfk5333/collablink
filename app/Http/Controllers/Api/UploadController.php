<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class UploadController extends Controller
{
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'file' => 'required|file|max:20480',
            'type' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['erreur' => 'Fichier invalide', 'errors' => $validator->errors()], 422);
        }

        // Déterminer le dossier selon le type
        $typeMap = [
            'cahier' => 'cahiers_charges',
            'signature' => 'signatures',
            'avatar' => 'avatars',
            'livrable' => 'livrables',
            'justificatif' => 'justificatifs',
            'piece_jointe' => 'pieces_jointes',
            'feuille_route' => 'feuilles_route',
        ];
        $dossier = $typeMap[$request->type ?? ''] ?? 'uploads';

        $file = $request->file('file');
        $extension = $file->getClientOriginalExtension();
        $filename = time() . '_' . uniqid() . '.' . $extension;
        $path = $file->storeAs($dossier, $filename, 'public');

        return response()->json([
            'url' => asset('storage/'.$path),
            'path' => $path,
            'nom' => $file->getClientOriginalName(),
            'taille' => $file->getSize(),
            'mime' => $file->getMimeType(),
        ], 201);
    }
}
