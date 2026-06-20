import { NextRequest, NextResponse } from 'next/server'
import { laravelRequest } from '@/lib/laravel'

const LARAVEL_API_URL = process.env.LARAVEL_API_URL || 'http://localhost:8000/api'

// GET /api/admin?type=stats|transactions|transactions_en_attente|litiges|utilisateurs|projets|contrats
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const type = searchParams.get('type')

  if (!type) {
    return NextResponse.json({ erreur: 'Type de requête non spécifié' }, { status: 400 })
  }

  if (type === 'stats') {
    return laravelRequest(request, '/admin/dashboard')
  }

  // Gestion des paiements : tous les paiements ou filtrés
  if (type === 'transactions' || type === 'transactions_en_attente') {
    const statut = searchParams.get('statut') || (type === 'transactions_en_attente' ? 'en_attente' : undefined)
    const params = new URLSearchParams()
    if (statut) params.append('statut', statut)
    const qs = params.toString() ? `?${params.toString()}` : ''
    return laravelRequest(request, `/admin/transactions${qs}`)
  }

  if (type === 'litiges') {
    return laravelRequest(request, '/admin/litiges')
  }

  if (type === 'utilisateurs') {
    // Support recherche et filtre rôle
    const search = searchParams.get('search') || ''
    const role = searchParams.get('role') || ''
    const page = searchParams.get('page') || '1'
    const params = new URLSearchParams()
    if (search) params.append('search', search)
    if (role) params.append('role', role)
    params.append('page', page)
    return laravelRequest(request, `/admin/utilisateurs?${params.toString()}`)
  }

  if (type === 'projets') {
    return laravelRequest(request, '/admin/projets')
  }

  if (type === 'contrats') {
    return laravelRequest(request, '/admin/contrats')
  }

  return NextResponse.json({ erreur: 'Type non reconnu' }, { status: 400 })
}

// PUT /api/admin - Actions admin
export async function PUT(request: NextRequest) {
  const body = await request.clone().json().catch(() => ({}))
  const { action, id, utilisateurId, motifRejet } = body

  if (action === 'valider_transaction' && id) {
    return laravelRequest(request, `/transactions/${id}/valider`, {
      method: 'POST',
      body: {},
    })
  }

  if (action === 'refuser_transaction' && id) {
    return laravelRequest(request, `/transactions/${id}/rejeter`, {
      method: 'POST',
      body: { motif_rejet: motifRejet || 'Rejeté par l\'administrateur' },
    })
  }

  if (action === 'toggle_utilisateur' && utilisateurId) {
    return laravelRequest(request, `/utilisateurs/${utilisateurId}/toggle-actif`, {
      method: 'PATCH',
      body: {},
    })
  }

  if (action === 'supprimer_utilisateur' && utilisateurId) {
    return laravelRequest(request, `/utilisateurs/${utilisateurId}`, {
      method: 'DELETE',
    })
  }

  if (action === 'resoudre_litige' && id) {
    return laravelRequest(request, `/litiges/${id}/resoudre`, {
      method: 'POST',
      body: { decision: body.decision, commentaire_decision: body.commentaireDecision },
    })
  }

  return NextResponse.json({ erreur: 'Action non reconnue' }, { status: 400 })
}
