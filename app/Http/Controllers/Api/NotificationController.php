<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Notification;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    public function index(Request $request)
    {
        $query = Notification::where('utilisateur_id', $request->user()->id);

        if ($request->has('type')) {
            $query->where('type', $request->type);
        }

        if ($request->has('non_lues') && $request->boolean('non_lues')) {
            $query->where('est_lue', false);
        }

        $notifications = $query->orderByDesc('created_at')->paginate(50);

        $nonLues = Notification::where('utilisateur_id', $request->user()->id)
            ->where('est_lue', false)
            ->count();

        return response()->json([
            'notifications' => $notifications,
            'non_lues' => $nonLues,
        ]);
    }

    public function marquerLue($id)
    {
        $notification = Notification::findOrFail($id);
        if ($notification->utilisateur_id !== request()->user()->id) {
            return response()->json(['message' => 'Non autorisé'], 403);
        }

        $notification->update([
            'est_lue' => true,
            'date_lecture' => now(),
        ]);

        return response()->json(['message' => 'Notification marquée comme lue']);
    }

    public function marquerToutLues(Request $request)
    {
        Notification::where('utilisateur_id', $request->user()->id)
            ->where('est_lue', false)
            ->update([
                'est_lue' => true,
                'date_lecture' => now(),
            ]);

        return response()->json(['message' => 'Toutes les notifications ont été marquées comme lues']);
    }

    public function destroy($id)
    {
        $notification = Notification::findOrFail($id);
        if ($notification->utilisateur_id !== request()->user()->id) {
            return response()->json(['message' => 'Non autorisé'], 403);
        }

        $notification->delete();
        return response()->json(['message' => 'Notification supprimée']);
    }
}
