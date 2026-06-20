import { NextResponse } from 'next/server'

// POST /api/seed - DÉSACTIVÉ : les données de test ne doivent plus être créées via ce endpoint.
// Les données réelles sont gérées dans la base MySQL via les seeders Laravel.
export async function POST() {
  return NextResponse.json(
    { erreur: 'Le seed de données de test est désactivé. Utilisez les seeders Laravel (`php artisan db:seed`).' },
    { status: 410 }
  )
}
