<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// Planificateur CollabLink
Schedule::call(function () {
    // Vérification quotidienne des projets dont le délai est dépassé
    \App\Services\LitigeService::verifierDelaisDepasses();
})->dailyAt('00:30');

Schedule::call(function () {
    // Libération automatique des fonds séquestrés après validation
    \App\Services\PortefeuilleService::libererFondsEnAttente();
})->hourly();
