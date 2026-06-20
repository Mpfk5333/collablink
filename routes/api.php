<?php

use Illuminate\Support\Facades\Route;

// Route de santé
Route::get('/health', function () {
    return response()->json(['status' => 'ok', 'service' => 'CollabLink API', 'version' => '1.0.0']);
});

// ============================================================
// AUTHENTIFICATION
// ============================================================
Route::post('/auth/register', [App\Http\Controllers\Api\AuthController::class, 'register']);
Route::post('/auth/login', [App\Http\Controllers\Api\AuthController::class, 'login']);
Route::post('/auth/forgot-password', [App\Http\Controllers\Api\AuthController::class, 'forgotPassword']);
Route::post('/auth/reset-password', [App\Http\Controllers\Api\AuthController::class, 'resetPassword']);

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/auth/logout', [App\Http\Controllers\Api\AuthController::class, 'logout']);
    Route::get('/auth/me', [App\Http\Controllers\Api\AuthController::class, 'me']);
    Route::put('/auth/profile', [App\Http\Controllers\Api\AuthController::class, 'updateProfile']);
    Route::put('/auth/password', [App\Http\Controllers\Api\AuthController::class, 'updatePassword']);
    Route::post('/auth/avatar', [App\Http\Controllers\Api\AuthController::class, 'uploadAvatar']);
    Route::post('/auth/signature', [App\Http\Controllers\Api\AuthController::class, 'uploadSignature']);

    // ============================================================
    // UTILISATEURS
    // ============================================================
    Route::get('/utilisateurs', [App\Http\Controllers\Api\UtilisateurController::class, 'index']);
    Route::get('/utilisateurs/{id}', [App\Http\Controllers\Api\UtilisateurController::class, 'show']);
    Route::put('/utilisateurs/{id}', [App\Http\Controllers\Api\UtilisateurController::class, 'update']);
    Route::delete('/utilisateurs/{id}', [App\Http\Controllers\Api\UtilisateurController::class, 'destroy']);
    Route::patch('/utilisateurs/{id}/toggle-actif', [App\Http\Controllers\Api\UtilisateurController::class, 'toggleActif']);

    // ============================================================
    // COMPÉTENCES & CATÉGORIES
    // ============================================================
    Route::get('/categories', [App\Http\Controllers\Api\CategorieController::class, 'index']);
    Route::post('/categories', [App\Http\Controllers\Api\CategorieController::class, 'store']);
    Route::get('/competences', [App\Http\Controllers\Api\CompetenceController::class, 'index']);
    Route::post('/competences', [App\Http\Controllers\Api\CompetenceController::class, 'store']);
    Route::post('/profil/competences', [App\Http\Controllers\Api\CompetenceController::class, 'attachToProfile']);
    Route::delete('/profil/competences/{id}', [App\Http\Controllers\Api\CompetenceController::class, 'detachFromProfile']);

    // ============================================================
    // PROFILS
    // ============================================================
    Route::get('/profil', [App\Http\Controllers\Api\ProfilController::class, 'me']);
    Route::put('/profil/client', [App\Http\Controllers\Api\ProfilController::class, 'updateClient']);
    Route::put('/profil/freelance', [App\Http\Controllers\Api\ProfilController::class, 'updateFreelance']);
    Route::post('/profil/experiences', [App\Http\Controllers\Api\ProfilController::class, 'addExperience']);
    Route::put('/profil/experiences/{id}', [App\Http\Controllers\Api\ProfilController::class, 'updateExperience']);
    Route::delete('/profil/experiences/{id}', [App\Http\Controllers\Api\ProfilController::class, 'deleteExperience']);
    // Formations
    Route::post('/profil/formations', [App\Http\Controllers\Api\ProfilController::class, 'addFormation']);
    Route::delete('/profil/formations/{id}', [App\Http\Controllers\Api\ProfilController::class, 'deleteFormation']);
    // Certifications
    Route::post('/profil/certifications', [App\Http\Controllers\Api\ProfilController::class, 'addCertification']);
    Route::delete('/profil/certifications/{id}', [App\Http\Controllers\Api\ProfilController::class, 'deleteCertification']);
    // Portfolio
    Route::post('/profil/portfolio', [App\Http\Controllers\Api\ProfilController::class, 'addPortfolioProjet']);
    Route::delete('/profil/portfolio/{id}', [App\Http\Controllers\Api\ProfilController::class, 'deletePortfolioProjet']);
    // Langues
    Route::post('/profil/langues', [App\Http\Controllers\Api\ProfilController::class, 'addLangue']);
    Route::delete('/profil/langues/{id}', [App\Http\Controllers\Api\ProfilController::class, 'deleteLangue']);
    Route::get('/freelances/search', [App\Http\Controllers\Api\FreelanceController::class, 'search']);
    Route::get('/freelances/recommandations', [App\Http\Controllers\Api\FreelanceController::class, 'recommandations']);
    Route::get('/freelances/{id}', [App\Http\Controllers\Api\FreelanceController::class, 'show']);

    // ============================================================
    // PROJETS
    // ============================================================
    Route::get('/projets', [App\Http\Controllers\Api\ProjetController::class, 'index']);
    Route::post('/projets', [App\Http\Controllers\Api\ProjetController::class, 'store']);
    Route::get('/projets/{id}', [App\Http\Controllers\Api\ProjetController::class, 'show']);
    Route::put('/projets/{id}', [App\Http\Controllers\Api\ProjetController::class, 'update']);
    Route::delete('/projets/{id}', [App\Http\Controllers\Api\ProjetController::class, 'destroy']);
    Route::post('/projets/{id}/publier', [App\Http\Controllers\Api\ProjetController::class, 'publier']);
    Route::post('/projets/{id}/cahier-charges', [App\Http\Controllers\Api\ProjetController::class, 'uploadCahierCharges']);
    Route::get('/projets/{id}/download-cahier', [App\Http\Controllers\Api\ProjetController::class, 'downloadCahierCharges']);

    // ============================================================
    // PROPOSITIONS / CANDIDATURES
    // ============================================================
    Route::get('/propositions', [App\Http\Controllers\Api\PropositionController::class, 'index']);
    Route::post('/projets/{id}/propositions', [App\Http\Controllers\Api\PropositionController::class, 'store']);
    Route::put('/propositions/{id}', [App\Http\Controllers\Api\PropositionController::class, 'update']);
    Route::post('/propositions/{id}/accepter', [App\Http\Controllers\Api\PropositionController::class, 'accepter']);
    Route::post('/propositions/{id}/refuser', [App\Http\Controllers\Api\PropositionController::class, 'refuser']);

    // ============================================================
    // PROPOSITIONS IA (nouveau système de recommandation)
    // ============================================================
    Route::post('/projets/{id}/propositions-ia', [App\Http\Controllers\Api\PropositionIAController::class, 'store']);
    Route::get('/propositions-ia/recues', [App\Http\Controllers\Api\PropositionIAController::class, 'recues']);
    Route::get('/propositions-ia/envoyees', [App\Http\Controllers\Api\PropositionIAController::class, 'envoyees']);
    Route::post('/propositions-ia/{id}/negocier', [App\Http\Controllers\Api\PropositionIAController::class, 'negocier']);
    Route::post('/propositions-ia/{id}/valider', [App\Http\Controllers\Api\PropositionIAController::class, 'valider']);
    Route::post('/propositions-ia/{id}/refuser', [App\Http\Controllers\Api\PropositionIAController::class, 'refuser']);
    Route::post('/propositions-ia/{id}/accepter-negociation', [App\Http\Controllers\Api\PropositionIAController::class, 'accepterNegociation']);
    Route::post('/propositions-ia/{id}/refuser-negociation', [App\Http\Controllers\Api\PropositionIAController::class, 'refuserNegociation']);

    // ============================================================
    // PORTEFEUILLE & TRANSACTIONS
    // ============================================================
    Route::get('/portefeuille', [App\Http\Controllers\Api\PortefeuilleController::class, 'show']);
    Route::post('/portefeuille/depot', [App\Http\Controllers\Api\PortefeuilleController::class, 'depot']);
    Route::post('/portefeuille/retrait', [App\Http\Controllers\Api\PortefeuilleController::class, 'retrait']);
    Route::get('/transactions', [App\Http\Controllers\Api\PortefeuilleController::class, 'transactions']);
    Route::post('/transactions/{id}/justificatif', [App\Http\Controllers\Api\PortefeuilleController::class, 'uploadJustificatif']);
    Route::post('/transactions/{id}/valider', [App\Http\Controllers\Api\PortefeuilleController::class, 'validerTransaction']);
    Route::post('/transactions/{id}/rejeter', [App\Http\Controllers\Api\PortefeuilleController::class, 'rejeterTransaction']);

    // ============================================================
    // PRÉCONTRATS & CONTRATS
    // ============================================================
    Route::get('/precontrats', [App\Http\Controllers\Api\ContratController::class, 'precontrats']);
    Route::post('/propositions/{id}/precontrat', [App\Http\Controllers\Api\ContratController::class, 'genererPrecontrat']);
    Route::post('/precontrats/{id}/valider', [App\Http\Controllers\Api\ContratController::class, 'validerPrecontrat']);
    Route::post('/precontrats/{id}/refuser', [App\Http\Controllers\Api\ContratController::class, 'refuserPrecontrat']);
    Route::post('/precontrats/{id}/payer', [App\Http\Controllers\Api\ContratController::class, 'payerPrecontrat']);
    Route::get('/contrats', [App\Http\Controllers\Api\ContratController::class, 'index']);
    Route::get('/contrats/{id}', [App\Http\Controllers\Api\ContratController::class, 'show']);
    Route::get('/contrats/{id}/pdf', [App\Http\Controllers\Api\ContratController::class, 'downloadPdf']);
    Route::post('/contrats/{id}/terminer', [App\Http\Controllers\Api\ContratController::class, 'terminer']);

    // ============================================================
    // FEUILLE DE ROUTE (nouveau)
    // ============================================================
    Route::post('/contrats/{id}/feuille-route', [App\Http\Controllers\Api\FeuilleRouteController::class, 'store']);
    Route::get('/contrats/{id}/feuille-route', [App\Http\Controllers\Api\FeuilleRouteController::class, 'show']);
    Route::post('/feuille-route/{id}/valider', [App\Http\Controllers\Api\FeuilleRouteController::class, 'valider']);
    Route::post('/feuille-route/{id}/refuser', [App\Http\Controllers\Api\FeuilleRouteController::class, 'refuser']);

    // ============================================================
    // JALONS
    // ============================================================
    Route::get('/contrats/{id}/jalons', [App\Http\Controllers\Api\JalonController::class, 'index']);
    Route::post('/contrats/{id}/jalons', [App\Http\Controllers\Api\JalonController::class, 'store']);
    Route::put('/jalons/{id}', [App\Http\Controllers\Api\JalonController::class, 'update']);
    Route::delete('/jalons/{id}', [App\Http\Controllers\Api\JalonController::class, 'destroy']);
    Route::post('/jalons/{id}/soumettre', [App\Http\Controllers\Api\JalonController::class, 'soumettre']);
    Route::post('/jalons/{id}/valider', [App\Http\Controllers\Api\JalonController::class, 'valider']);
    Route::post('/jalons/{id}/refuser', [App\Http\Controllers\Api\JalonController::class, 'refuser']);
    Route::post('/jalons/{id}/livrable', [App\Http\Controllers\Api\JalonController::class, 'uploadLivrable']);
    Route::get('/jalons/{id}/download-livrable', [App\Http\Controllers\Api\JalonController::class, 'downloadLivrable']);

    // ============================================================
    // MESSAGERIE
    // ============================================================
    Route::get('/conversations', [App\Http\Controllers\Api\MessagerieController::class, 'conversations']);
    Route::get('/conversations/{id}/messages', [App\Http\Controllers\Api\MessagerieController::class, 'messages']);
    Route::post('/conversations/{id}/messages', [App\Http\Controllers\Api\MessagerieController::class, 'envoyer']);
    Route::post('/conversations/{id}/fichier', [App\Http\Controllers\Api\MessagerieController::class, 'uploadFichier']);
    Route::post('/messages/{id}/signaler', [App\Http\Controllers\Api\MessagerieController::class, 'signaler']);
    Route::get('/messages/{id}/download', [App\Http\Controllers\Api\MessagerieController::class, 'downloadFichier']);

    // ============================================================
    // NOTIFICATIONS
    // ============================================================
    Route::get('/notifications', [App\Http\Controllers\Api\NotificationController::class, 'index']);
    Route::post('/notifications/{id}/lire', [App\Http\Controllers\Api\NotificationController::class, 'marquerLue']);
    Route::post('/notifications/lire-tout', [App\Http\Controllers\Api\NotificationController::class, 'marquerToutLues']);
    Route::delete('/notifications/{id}', [App\Http\Controllers\Api\NotificationController::class, 'destroy']);

    // ============================================================
    // ÉVALUATIONS
    // ============================================================
    Route::post('/contrats/{id}/evaluations', [App\Http\Controllers\Api\EvaluationController::class, 'store']);
    Route::get('/evaluations/recues', [App\Http\Controllers\Api\EvaluationController::class, 'recues']);
    Route::get('/evaluations/donnees', [App\Http\Controllers\Api\EvaluationController::class, 'donnees']);

    // ============================================================
    // LITIGES
    // ============================================================
    Route::get('/litiges', [App\Http\Controllers\Api\LitigeController::class, 'index']);
    Route::post('/contrats/{id}/litiges', [App\Http\Controllers\Api\LitigeController::class, 'store']);
    Route::post('/litiges/{id}/resoudre', [App\Http\Controllers\Api\LitigeController::class, 'resoudre']);
    Route::post('/litiges/{id}/nouveau-delai', [App\Http\Controllers\Api\LitigeController::class, 'nouveauDelai']);
    Route::post('/litiges/{id}/messages', [App\Http\Controllers\Api\LitigeController::class, 'ajouterMessage']);

    // ============================================================
    // ADMINISTRATION
    // ============================================================
    Route::middleware('role:administrateur')->prefix('admin')->group(function () {
        Route::get('/dashboard', [App\Http\Controllers\Api\AdminController::class, 'dashboard']);
        Route::get('/utilisateurs', [App\Http\Controllers\Api\AdminController::class, 'utilisateurs']);
        Route::get('/projets', [App\Http\Controllers\Api\AdminController::class, 'projets']);
        Route::get('/transactions', [App\Http\Controllers\Api\AdminController::class, 'transactions']);
        Route::get('/contrats', [App\Http\Controllers\Api\AdminController::class, 'contrats']);
        Route::get('/litiges', [App\Http\Controllers\Api\AdminController::class, 'litiges']);
        Route::get('/activites', [App\Http\Controllers\Api\AdminController::class, 'activites']);
    });
});

// Upload de fichiers (public pour permettre l'upload pendant l'inscription)
Route::post('/upload', [App\Http\Controllers\Api\UploadController::class, 'store']);
Route::get('/storage/{path}', function ($path) {
    $file = storage_path('app/public/'.$path);
    if (!file_exists($file)) {
        return response()->json(['error' => 'Fichier introuvable'], 404);
    }
    return response()->file($file);
})->where('path', '.*');
