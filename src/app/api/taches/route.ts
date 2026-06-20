import { NextRequest } from 'next/server'
import { laravelRequest } from '@/lib/laravel'

// GET /api/taches?contratId=xxx
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const contratId = searchParams.get('contratId')
  
  if (!contratId) {
    const { NextResponse } = await import('next/server')
    return NextResponse.json({ erreur: 'contratId requis' }, { status: 400 })
  }

  return laravelRequest(request, `/contrats/${contratId}/taches`)
}

// POST /api/taches
export async function POST(request: NextRequest) {
  const body = await request.clone().json().catch(() => ({}))
  const { action, contratId, tacheId, ...data } = body

  // Créer une tâche
  if (action === 'creer' && contratId) {
    return laravelRequest(request, `/contrats/${contratId}/taches`, {
      method: 'POST',
      body: data,
    })
  }

  // Actions sur une tâche existante
  if (tacheId) {
    if (action === 'demarrer') {
      return laravelRequest(request, `/taches/${tacheId}/demarrer`, { method: 'POST', body: {} })
    }
    if (action === 'soumettre') {
      return laravelRequest(request, `/taches/${tacheId}/soumettre`, { method: 'POST', body: data })
    }
    if (action === 'valider') {
      return laravelRequest(request, `/taches/${tacheId}/valider`, { method: 'POST', body: data })
    }
    if (action === 'refuser') {
      return laravelRequest(request, `/taches/${tacheId}/refuser`, { method: 'POST', body: data })
    }
    if (action === 'refaire') {
      return laravelRequest(request, `/taches/${tacheId}/refaire`, { method: 'POST', body: {} })
    }
    if (action === 'litige') {
      return laravelRequest(request, `/taches/${tacheId}/litige`, { method: 'POST', body: data })
    }
    if (action === 'modifier') {
      return laravelRequest(request, `/taches/${tacheId}`, { method: 'PUT', body: data })
    }
    if (action === 'supprimer') {
      return laravelRequest(request, `/taches/${tacheId}`, { method: 'DELETE' })
    }
  }

  const { NextResponse } = await import('next/server')
  return NextResponse.json({ erreur: 'Action non reconnue' }, { status: 400 })
}
