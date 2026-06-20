<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\{Conversation, Message, Notification, User};
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;

class MessagerieController extends Controller
{
    public function conversations(Request $request)
    {
        $user = $request->user();

        // Admin : voit toutes les conversations
        if ($user->role === 'administrateur') {
            $conversations = Conversation::with(['projet', 'participants.utilisateur', 'messages' => fn($q) => $q->latest()->limit(1)])
                ->orderByDesc('updated_at')
                ->get();
        } else {
            $conversations = Conversation::whereHas('participants', fn($q) => $q->where('utilisateur_id', $user->id))
                ->with(['projet', 'participants.utilisateur', 'messages' => fn($q) => $q->latest()->limit(1)])
                ->orderByDesc('updated_at')
                ->get();
        }

        return response()->json(['conversations' => $conversations]);
    }

    public function messages(Request $request, $conversationId)
    {
        $conversation = Conversation::with(['projet', 'participants'])->findOrFail($conversationId);
        $user = $request->user();

        if (!$conversation->participants->contains('utilisateur_id', $user->id)) {
            return response()->json(['message' => 'Non autorisé'], 403);
        }

        $messages = Message::where('conversation_id', $conversationId)
            ->with('expediteur')
            ->orderBy('created_at')
            ->get();

        // Marquer comme lus les messages reçus
        Message::where('conversation_id', $conversationId)
            ->where('expediteur_id', '!=', $user->id)
            ->where('est_lu', false)
            ->update(['est_lu' => true]);

        return response()->json([
            'conversation' => $conversation,
            'messages' => $messages,
        ]);
    }

    public function envoyer(Request $request, $conversationId)
    {
        $conversation = Conversation::with('participants')->findOrFail($conversationId);
        $user = $request->user();

        if (!$conversation->participants->contains('utilisateur_id', $user->id)) {
            return response()->json(['message' => 'Non autorisé'], 403);
        }

        $validator = Validator::make($request->all(), [
            'contenu' => 'required_without:piece_jointe|string',
            'piece_jointe' => 'nullable|file|max:10240',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $path = null;
        $nom = null;
        if ($request->hasFile('piece_jointe')) {
            $path = $request->file('piece_jointe')->store('pieces_jointes', 'public');
            $nom = $request->file('piece_jointe')->getClientOriginalName();
        }

        $message = Message::create([
            'conversation_id' => $conversationId,
            'expediteur_id' => $user->id,
            'contenu' => $request->contenu ?? '',
            'piece_jointe_url' => $path,
            'piece_jointe_nom' => $nom,
        ]);

        // Notifier les autres participants
        foreach ($conversation->participants as $participant) {
            if ($participant->utilisateur_id !== $user->id) {
                Notification::create([
                    'utilisateur_id' => $participant->utilisateur_id,
                    'type' => 'nouveau_message',
                    'titre' => 'Nouveau message',
                    'contenu' => "{$user->prenom} {$user->nom} vous a envoyé un message.",
                    'lien_action' => "/messagerie/{$conversationId}",
                ]);
            }
        }

        return response()->json(['message' => $message->load('expediteur')], 201);
    }

    public function uploadFichier(Request $request, $conversationId)
    {
        $validator = Validator::make($request->all(), [
            'fichier' => 'required|file|max:10240',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $path = $request->file('fichier')->store('pieces_jointes', 'public');
        return response()->json([
            'url' => asset('storage/'.$path),
            'nom' => $request->file('fichier')->getClientOriginalName(),
        ]);
    }

    public function signaler(Request $request, $id)
    {
        $message = Message::findOrFail($id);
        $user = $request->user();

        $validator = Validator::make($request->all(), [
            'raison' => 'required|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $message->update([
            'est_signale' => true,
            'raison_signalement' => $request->raison,
        ]);

        // Notifier les admins
        $admins = User::where('role', 'administrateur')->get();
        foreach ($admins as $admin) {
            Notification::create([
                'utilisateur_id' => $admin->id,
                'type' => 'message_signale',
                'titre' => 'Message signalé',
                'contenu' => "Un message a été signalé. Raison : {$request->raison}",
            ]);
        }

        return response()->json(['message' => 'Message signalé']);
    }

    public function downloadFichier($id)
    {
        $message = Message::findOrFail($id);
        if (!$message->piece_jointe_url) {
            return response()->json(['message' => 'Aucune pièce jointe'], 404);
        }

        $file = storage_path('app/public/'.$message->piece_jointe_url);
        if (!file_exists($file)) {
            return response()->json(['message' => 'Fichier introuvable'], 404);
        }

        return response()->download($file, $message->piece_jointe_nom ?? basename($file));
    }
}
