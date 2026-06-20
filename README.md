# CollabLink API — Backend Laravel 11

API REST complète pour la plateforme freelance **CollabLink**.

## 📋 Prérequis

- **PHP 8.2+** avec extensions : mbstring, xml, sqlite3 (ou pdo_mysql), curl, zip, gd, bcmath
- **Composer** 2.5+
- **SQLite** (par défaut) ou **MySQL 8+**

## 🚀 Installation

```bash
# 1. Installer les dépendances
composer install

# 2. Copier le fichier d'environnement
cp .env.example .env

# 3. Générer la clé de l'application
php artisan key:generate

# 4. Créer la base de données SQLite
touch database/database.sqlite

# 5. Lancer les migrations
php artisan migrate

# 6. Remplir la base de données avec les données de test
php artisan db:seed

# 7. Créer le lien symbolique pour le storage public
php artisan storage:link

# 8. Démarrer le serveur
php artisan serve --port=8000
```

Ou en une seule commande :

```bash
composer setup
```

## 🔑 Comptes de test

| Rôle | Email | Mot de passe |
|------|-------|--------------|
| Administrateur | admin@collablink.com | password123 |
| Client | marie.dupont@client.com | password123 |
| Freelance | pierre.martin@freelance.com | password123 |
| Freelance | sophie.leroy@freelance.com | password123 |
| Freelance | lucas.bernard@freelance.com | password123 |

## 📚 Documentation API

Toutes les routes sont préfixées par `/api`.

### Authentification
- `POST /auth/register` — Inscription
- `POST /auth/login` — Connexion
- `POST /auth/logout` — Déconnexion (auth)
- `GET /auth/me` — Profil utilisateur (auth)
- `PUT /auth/profile` — Mise à jour profil
- `PUT /auth/password` — Changer mot de passe
- `POST /auth/avatar` — Upload avatar
- `POST /auth/signature` — Upload signature

### Utilisateurs
- `GET /utilisateurs` — Liste paginée
- `GET /utilisateurs/{id}` — Détail
- `PUT /utilisateurs/{id}` — Modifier
- `DELETE /utilisateurs/{id}` — Supprimer
- `PATCH /utilisateurs/{id}/toggle-actif` — Activer/désactiver

### Projets
- `GET /projets?statut=en_cours,termine&type_source=candidature` — Liste avec filtres
- `POST /projets` — Créer
- `GET /projets/{id}` — Détail
- `PUT /projets/{id}` — Modifier
- `DELETE /projets/{id}` — Supprimer
- `POST /projets/{id}/publier` — Publier (génère recommandations IA)
- `POST /projets/{id}/cahier-charges` — Upload cahier des charges
- `GET /projets/{id}/download-cahier` — Télécharger cahier des charges

### Propositions (candidatures classiques)
- `POST /projets/{id}/propositions` — Candidater
- `POST /propositions/{id}/accepter` — Accepter
- `POST /propositions/{id}/refuser` — Refuser

### Propositions IA (nouveau système)
- `POST /projets/{id}/propositions-ia` — Faire une proposition (freelance)
- `GET /propositions-ia/recues` — Reçues (client)
- `GET /propositions-ia/envoyees` — Envoyées (freelance)
- `POST /propositions-ia/{id}/negocier` — Contre-proposition (client)
- `POST /propositions-ia/{id}/valider` — Valider (client) → lance précontrat
- `POST /propositions-ia/{id}/refuser` — Refuser avec motif
- `POST /propositions-ia/{id}/accepter-negociation` — Freelance accepte
- `POST /propositions-ia/{id}/refuser-negociation` — Freelance refuse

### Portefeuille & Transactions (commission 5%)
- `GET /portefeuille` — Solde (affichage adapté au rôle)
- `POST /portefeuille/depot` — Dépôt (justificatif requis)
- `POST /portefeuille/retrait` — Retrait
- `GET /transactions` — Historique
- `POST /transactions/{id}/justificatif` — Upload justificatif
- `POST /transactions/{id}/valider` — Valider (admin)
- `POST /transactions/{id}/rejeter` — Rejeter (admin)

### Précontrats & Contrats
- `POST /propositions/{id}/precontrat` — Générer (calcule commission 5%)
- `POST /precontrats/{id}/valider` — Valider (freelance) → créé contrat + projet en cours
- `POST /precontrats/{id}/refuser` — Refuser (remboursement)
- `GET /contrats` — Liste
- `GET /contrats/{id}` — Détail
- `GET /contrats/{id}/pdf` — Télécharger PDF

### Feuille de route (nouveau)
- `POST /contrats/{id}/feuille-route` — Envoyer (freelance)
- `GET /contrats/{id}/feuille-route` — Consulter
- `POST /feuille-route/{id}/valider` — Valider (crée jalons automatiquement)
- `POST /feuille-route/{id}/refuser` — Refuser

### Jalons (sans montant)
- `GET /contrats/{id}/jalons` — Liste
- `POST /contrats/{id}/jalons` — Ajouter (client ou freelance, dernier par défaut)
- `PUT /jalons/{id}` — Modifier
- `DELETE /jalons/{id}` — Supprimer
- `POST /jalons/{id}/soumettre` — Soumettre livrable
- `POST /jalons/{id}/valider` — Valider (auto-termine projet si dernier + délai respecté)
- `POST /jalons/{id}/refuser` — Refuser
- `POST /jalons/{id}/livrable` — Upload livrable
- `GET /jalons/{id}/download-livrable` — Télécharger

### Messagerie
- `GET /conversations` — Liste conversations
- `GET /conversations/{id}/messages` — Messages
- `POST /conversations/{id}/messages` — Envoyer
- `POST /conversations/{id}/fichier` — Upload pièce jointe
- `POST /messages/{id}/signaler` — Signaler
- `GET /messages/{id}/download` — Télécharger pièce jointe

### Notifications
- `GET /notifications?type=...&non_lues=1` — Liste filtrée
- `POST /notifications/{id}/lire` — Marquer lue
- `POST /notifications/lire-tout` — Tout marquer lues
- `DELETE /notifications/{id}` — Supprimer

### Évaluations
- `POST /contrats/{id}/evaluations` — Créer
- `GET /evaluations/recues` — Reçues
- `GET /evaluations/donnees` — Données

### Litiges
- `GET /litiges` — Liste
- `POST /contrats/{id}/litiges` — Ouvrir
- `POST /litiges/{id}/resoudre` — Résoudre
- `POST /litiges/{id}/nouveau-delai` — Fixer nouveau délai (cas délai dépassé)
- `POST /litiges/{id}/messages` — Ajouter message

### Administration (middleware role:administrateur)
- `GET /admin/dashboard` — Statistiques
- `GET /admin/utilisateurs` — Gestion utilisateurs
- `GET /admin/projets` — Tous les projets
- `GET /admin/transactions` — Toutes les transactions
- `GET /admin/contrats` — Tous les contrats
- `GET /admin/litiges` — Tous les litiges
- `GET /admin/activites` — Journal d'activité

### Uploads
- `POST /upload` — Upload générique (dossier : uploads, contrats, avatars, etc.)
- `GET /storage/{path}` — Accès fichiers publics

## 🔧 Configuration

### Base de données
Par défaut SQLite. Pour MySQL, modifiez `.env` :
```
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=collablink
DB_USERNAME=root
DB_PASSWORD=
```

### Frontend Next.js
Modifiez `FRONTEND_URL` dans `.env` pour pointer vers votre frontend.

### Commission
Le taux de commission (5% par défaut) est configurable via `COMMISSION_TAUX` dans `.env`.

## 🎯 Workflows clés

### 1. Workflow complet d'un projet
1. Client crée un projet (brouillon)
2. Client upload le cahier des charges
3. Client publie → recommandations IA générées automatiquement
4. Freelances candidatent OU font une proposition IA
5. Client accepte une proposition
6. Client génère un précontrat (commission 5% calculée)
7. Client paie (mise en séquestre + justificatif)
8. Admin valide la transaction
9. Freelance valide le précontrat → contrat signé + projet en cours
10. Freelance envoie la feuille de route
11. Client valide la feuille de route → jalons créés automatiquement
12. Freelance soumet les livrables jalon par jalon
13. Client valide chaque jalon
14. Si dernier jalon validé ET délai respecté → projet terminé + paiement automatique freelance
15. Si délai dépassé → litige automatique → discussion → fixer nouveau délai

### 2. Commission 5%
- À chaque paiement client : `prix_projet × 5% = commission`
- Total à payer : `prix_projet + commission`
- À la libération : freelance reçoit `prix_projet - commission`

### 3. Jalons sans montant
- Les jalons n'ont plus de `montantAlloue` (selon demande utilisateur)
- Le paiement se fait en une seule fois à la fin du projet

### 4. Ajout de jalon par le client
- Le client peut ajouter un jalon même si d'autres sont en cours
- Le nouveau jalon est automatiquement le dernier (ordre = max + 1)
- Il est en statut `a_faire` (attente)
- Quand validé, si tous les autres sont validés → projet terminé

## 📦 Stack technique

- **Laravel 11** + PHP 8.2+
- **Laravel Sanctum** pour l'authentification par token
- **Barryvdh Laravel-DomPDF** pour la génération PDF des contrats
- **Spatie Laravel-Permission** (pré-installé pour gestion fine des rôles)
- **Intervention Image** pour le traitement des images
- **Laravel Reverb** pour les WebSockets (notifications temps réel)
- **Maatwebsite Excel** pour exports Excel

## 📝 Notes

- Tous les IDs sont des UUID (clés primaires `uuid`)
- Les migrations sont regroupées par module dans `database/migrations/`
- Les seeders créent 1 admin, 1 client et 3 freelances + catégories/compétences
- Le cron quotidien vérifie les projets en retard et crée automatiquement les litiges "délai dépassé"

## 🆘 Support

En cas de problème, vérifiez :
1. Les logs : `storage/logs/laravel.log`
2. La configuration `.env`
3. Les migrations : `php artisan migrate:status`
4. Les routes : `php artisan route:list`

---

**CollabLink** — Plateforme freelance — Backend Laravel 11
