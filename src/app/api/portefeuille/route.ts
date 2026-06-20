import { NextRequest, NextResponse } from 'next/server'
import { laravelRequest } from '@/lib/laravel'

const LARAVEL_API_URL = process.env.LARAVEL_API_URL || 'http://localhost:8000/api'

// GET /api/portefeuille → GET /api/portefeuille (Laravel)
export async function GET(request: NextRequest) {
  return laravelRequest(request, '/portefeuille')
}

// POST /api/portefeuille - Opérations sur le portefeuille
export async function POST(request: NextRequest) {
  const contentType = request.headers.get('content-type') || ''

  // Multipart: dépôt avec justificatif
  if (contentType.includes('multipart/form-data')) {
    const formData = await request.formData()
    const action = formData.get('action') as string

    if (action === 'depot') {
      const token = request.cookies.get('api_token')?.value || ''
      const authHeader = request.headers.get('Authorization')
      const bearer = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : token

      const laravelForm = new FormData()
      laravelForm.append('montant', formData.get('montant') as string)
      laravelForm.append('mode_paiement', formData.get('modePaiement') as string || 'mobile_money')
      const justificatif = formData.get('justificatif') as File
      if (justificatif) laravelForm.append('justificatif', justificatif)

      const headers: Record<string, string> = { 'Accept': 'application/json' }
      if (bearer) headers['Authorization'] = `Bearer ${bearer}`

      const response = await fetch(`${LARAVEL_API_URL}/portefeuille/depot`, {
        method: 'POST',
        headers,
        body: laravelForm,
      })
      const data = await response.json()
      return NextResponse.json(data, { status: response.status })
    }
  }

  // JSON: autres actions
  const body = await request.clone().json().catch(() => ({}))
  const { action, montant, transactionId, modePaiement, motifRejet } = body

  if (action === 'depot_json') {
    return laravelRequest(request, '/portefeuille/depot', {
      method: 'POST',
      body: { montant, mode_paiement: modePaiement || 'mobile_money' },
    })
  }

  if (action === 'retrait') {
    return laravelRequest(request, '/portefeuille/retrait', {
      method: 'POST',
      body: { montant, mode_paiement: modePaiement || 'mobile_money' },
    })
  }

  if (action === 'valider_transaction' && transactionId) {
    return laravelRequest(request, `/transactions/${transactionId}/valider`, {
      method: 'POST',
      body: {},
    })
  }

  if (action === 'refuser_transaction' && transactionId) {
    return laravelRequest(request, `/transactions/${transactionId}/rejeter`, {
      method: 'POST',
      body: { motif_rejet: motifRejet || 'Rejeté par l\'administrateur' },
    })
  }

  return NextResponse.json({ erreur: 'Action non reconnue' }, { status: 400 })
}
