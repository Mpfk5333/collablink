<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\Portefeuille;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class AdminUserSeeder extends Seeder
{
    /**
     * Crée un compte administrateur par défaut.
     * 
     * Identifiants :
     * Email: admin@collablink.com
     * Mot de passe: Admin@2026!
     */
    public function run(): void
    {
        // Vérifier si l'admin existe déjà
        $existingAdmin = User::where('email', 'admin@collablink.com')->first();
        
        if ($existingAdmin) {
            $this->command->warn('⚠️  Un administrateur existe déjà avec cet email.');
            $this->command->info("   Email: {$existingAdmin->email}");
            $this->command->info("   Nom: {$existingAdmin->prenom} {$existingAdmin->nom}");
            return;
        }

        // Créer l'administrateur
        $admin = User::create([
            'nom' => 'Admin',
            'prenom' => 'Super',
            'email' => 'admin@collablink.com',
            'mot_de_passe' => Hash::make('Admin@2026!'),
            'role' => 'administrateur',
            'telephone' => '+237 000 000 000',
            'pays' => 'Cameroun',
            'signature_url' => 'signatures/admin_signature.png', // Signature fictive
            'photo_url' => null,
            'est_actif' => true,
        ]);

        // Créer un portefeuille pour l'admin (solde 0)
        Portefeuille::create([
            'utilisateur_id' => $admin->id,
            'solde' => 0,
        ]);

        $this->command->info('✓ Administrateur créé avec succès !');
        $this->command->info('');
        $this->command->info('=== IDENTIFIANTS ADMINISTRATEUR ===');
        $this->command->info("Email      : admin@collablink.com");
        $this->command->info("Mot de passe : Admin@2026!");
        $this->command->info("Nom        : Super Admin");
        $this->command->info("ID         : {$admin->id}");
        $this->command->info('===================================');
    }
}
