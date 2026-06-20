<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

class UserFactory extends Factory
{
    public function definition(): array
    {
        return [
            'nom' => fake()->lastName(),
            'prenom' => fake()->firstName(),
            'email' => fake()->unique()->safeEmail(),
            'mot_de_passe' => bcrypt('password'),
            'role' => fake()->randomElement(['client', 'freelance']),
            'telephone' => '+2376'.fake()->numberBetween(10000000, 99999999),
            'pays' => 'Cameroun',
            'est_actif' => true,
        ];
    }
}
