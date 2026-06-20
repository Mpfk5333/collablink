<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>CollabLink API</title>
    <style>
        body { font-family: 'Segoe UI', Tahoma, sans-serif; padding: 40px; background: #f5f5f5; }
        .container { max-width: 800px; margin: 0 auto; background: white; padding: 40px; border-radius: 10px; box-shadow: 0 4px 20px rgba(0,0,0,0.08); }
        h1 { color: #2563eb; }
        h2 { color: #1e40af; margin-top: 30px; }
        code { background: #f1f5f9; padding: 2px 8px; border-radius: 4px; font-family: 'Courier New', monospace; }
        .endpoint { background: #f8fafc; padding: 12px; border-left: 4px solid #2563eb; margin: 8px 0; font-family: monospace; }
        .method { font-weight: bold; color: #16a34a; }
        a { color: #2563eb; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🚀 CollabLink API</h1>
        <p>Bienvenue sur l'API REST de la plateforme freelance CollabLink.</p>
        
        <h2>Endpoints de base</h2>
        <div class="endpoint"><span class="method">GET</span> /api/health — État de l'API</div>
        <div class="endpoint"><span class="method">POST</span> /api/auth/register — Inscription</div>
        <div class="endpoint"><span class="method">POST</span> /api/auth/login — Connexion</div>
        <div class="endpoint"><span class="method">GET</span> /api/auth/me — Profil utilisateur (auth)</div>
        
        <h2>Documentation</h2>
        <p>Consultez le fichier <code>README.md</code> pour la liste complète des endpoints et le guide d'installation.</p>
        
        <h2>Comptes de test</h2>
        <p>Après avoir exécuté les seeders :</p>
        <ul>
            <li>Admin : <code>admin@collablink.com</code> / <code>password123</code></li>
            <li>Client : <code>marie.dupont@client.com</code> / <code>password123</code></li>
            <li>Freelance : <code>pierre.martin@freelance.com</code> / <code>password123</code></li>
        </ul>
    </div>
</body>
</html>
