import { NextRequest, NextResponse } from 'next/server'
import { laravelRequest } from '@/lib/laravel'

// GET /api/litiges → GET /api/litiges (Laravel)
export async function GET(request: NextRequest) {
  return laravelRequest(request, '/litiges')
}

// POST /api/litiges - Ouvrir un litige
// → POST /api/contrats/{contratId}/litiges
export async function POST(request: NextRequest) {
  const body = await request.clone().json().catch(() => ({}))
  const { contratId, motif, preuves } = body

  if (!contratId || !motif) {
    return NextResponse.json({ erreur: 'contratId et motif requis' }, { status: 400 })
  }

  return laravelRequest(request, `/contrats/${contratId}/litiges`, {
    method: 'POST',
    body: { motif, preuves },
  })
}

// PUT /api/litiges - Arbitrer/résoudre un litige (admin)
export async function PUT(request: NextRequest) {
  const body = await request.clone().json().catch(() => ({}))
  const { id, decision, commentaireDecision, nouveauDelai } = body

  if (!id) {
    return NextResponse.json({ erreur: 'id requis' }, { status: 400 })
  }

  // Si c'est un litige de délai dépassé avec un nouveau délai
  if (nouveauDelai) {
    return laravelRequest(request, `/litiges/${id}/nouveau-delai`, {
      method: 'POST',
      body: { nouveau_delai: nouveauDelai },
    })
  }

  return laravelRequest(request, `/litiges/${id}/resoudre`, {
    method: 'POST',
    body: { decision, commentaire_decision: commentaireDecision },
  })
}
