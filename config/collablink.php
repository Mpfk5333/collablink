<?php

return [
    'taux' => (float) env('COMMISSION_TAUX', 0.05),
    'devise' => env('DEVISE', 'FCFA'),
    'locale' => env('CURRENCY_LOCALE', 'fr-FR'),
];
