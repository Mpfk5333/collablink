<?php

// Suppress deprecated warnings from PHP 8.5 (PDO constant rename) to prevent HTML output in API responses
error_reporting(E_ALL & ~E_DEPRECATED & ~E_USER_DEPRECATED);

require __DIR__.'/../vendor/autoload.php';

use Illuminate\Contracts\Http\Kernel;
use Illuminate\Contracts\Console\Kernel as ConsoleKernelContract;
use Illuminate\Http\Request;

/*
|--------------------------------------------------------------------------
| Run The Application
|--------------------------------------------------------------------------
*/

$app = require_once __DIR__.'/../bootstrap/app.php';

$kernel = $app->make(Kernel::class);

$response = $kernel->handle(
    $request = Request::capture()
)->send();

try {
    $kernel->terminate($request, $response);
} catch (\Throwable $e) {
    // Swallow terminate exceptions to prevent corrupting the already-sent response
    // These errors are non-critical (post-response cleanup) and must not pollute JSON output
    error_log('Laravel terminate error: ' . $e->getMessage());
}
