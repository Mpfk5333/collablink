import { NextRequest, NextResponse } from 'next/server'
import { laravelRequest } from '@/lib/laravel'

// GET /api/evaluations → GET /api/evaluations/recues ou /api/evaluations/donnees
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const type = searchParams.get('type') || 'recues'
  const contratId = searchParams.get('contratId')

  if (contratId) {
    // Récupérer les évaluations d'un contrat spécifique
    return laravelRequest(request, `/evaluations/recues`)
  }

  if (type === 'donnees') {
    return laravelRequest(request, '/evaluations/donnees')
  }

  return laravelRequest(request, '/evaluations/recues')
}

// POST /api/evaluations - Créer une évaluation
// → POST /api/contrats/{id}/evaluations
export async function POST(request: NextRequest) {
  const body = await request.clone().json().catch(() => ({}))
  const { contratId, noteGlobale, qualite, communication, delais, professionnalisme, commentaire } = body

  if (!contratId || noteGlobale === undefined) {
    return NextResponse.json({ erreur: 'contratId et noteGlobale requis' }, { status: 400 })
  }

  return laravelRequest(request, `/contrats/${contratId}/evaluations`, {
    method: 'POST',
    body: { note_globale: noteGlobale, qualite, communication, delais, professionnalisme, commentaire },
  })
}
