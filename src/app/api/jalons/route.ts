import { NextRequest, NextResponse } from 'next/server'
import { laravelRequest } from '@/lib/laravel'

// GET /api/jalons?contratId=xxx → GET /api/contrats/{id}/jalons
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const contratId = searchParams.get('contratId')

  if (!contratId) {
    return NextResponse.json({ erreur: 'contratId requis' }, { status: 400 })
  }

  return laravelRequest(request, `/contrats/${contratId}/jalons`)
}

// PUT /api/jalons - Mettre à jour un jalon (soumettre livrable, valider, refuser)
export async function PUT(request: NextRequest) {
  const body = await request.clone().json().catch(() => ({}))
  const { id, action, livrableUrl, commentaireClient } = body

  if (!id) {
    return NextResponse.json({ erreur: 'id requis' }, { status: 400 })
  }

  if (action === 'demarrer') {
    return laravelRequest(request, `/jalons/${id}`, {
      method: 'PUT',
      body: { statut: 'en_cours' },
    })
  }

  if (action === 'soumettre') {
    return laravelRequest(request, `/jalons/${id}/soumettre`, {
      method: 'POST',
      body: { livrable_url: livrableUrl, commentaire: commentaireClient },
    })
  }

  if (action === 'valider_client') {
    return laravelRequest(request, `/jalons/${id}/valider`, {
      method: 'POST',
      body: { commentaire_client: commentaireClient },
    })
  }

  if (action === 'refuser_client') {
    return laravelRequest(request, `/jalons/${id}/refuser`, {
      method: 'POST',
      body: { commentaire: commentaireClient },
    })
  }

  if (action === 'ouvrir_litige') {
    return laravelRequest(request, `/jalons/${id}`, {
      method: 'PUT',
      body: { statut: 'en_litige' },
    })
  }

  return NextResponse.json({ erreur: 'Action non reconnue' }, { status: 400 })
}

// POST /api/jalons - Créer un jalon
export async function POST(request: NextRequest) {
  const body = await request.clone().json().catch(() => ({}))
  const { contratId, ...rest } = body

  if (!contratId) {
    return NextResponse.json({ erreur: 'contratId requis' }, { status: 400 })
  }

  return laravelRequest(request, `/contrats/${contratId}/jalons`, {
    method: 'POST',
    body: rest,
  })
}
