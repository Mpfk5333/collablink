import { NextRequest } from 'next/server'
import { laravelRequest } from '@/lib/laravel'

// GET /api/contrats → GET /api/contrats (Laravel)
// POST /api/contrats → actions sur précontrats/contrats (Laravel)
export async function GET(request: NextRequest) {
  return laravelRequest(request, '/contrats')
}

export async function POST(request: NextRequest) {
  const body = await request.clone().json().catch(() => ({}))
  const { action } = body

  if (action === 'payer_precontrat_existant') {
    // Nouveau flow : le précontrat n'existe pas encore, on paie pour une proposition
    const { propositionId, justificatifUrl, modePaiement } = body
    
    // Soumettre le paiement directement avec la proposition_id
    // Le précontrat sera créé par le backend après validation admin
    const paiementRes = await laravelRequest(request, `/propositions/${propositionId}/payer`, {
      method: 'POST',
      body: { justificatif_url: justificatifUrl, mode_paiement: modePaiement },
    })

    return paiementRes
  }

  if (action === 'payer_et_generer_precontrat') {
    // ANCIENNE VERSION - Génère précontrat + soumet paiement (deprecated)
    const { propositionId, objectifs, budgetFinal, dateDebut, dateFin, clauses, justificatifUrl, modePaiement } = body
    // 1) Génère le précontrat
    const precontratRes = await laravelRequest(request, `/propositions/${propositionId}/precontrat`, {
      method: 'POST',
      body: { objectifs, clauses, date_debut: dateDebut, date_fin: dateFin, budget_final: budgetFinal },
    })
    const precontratData = await precontratRes.json().catch(() => ({}))
    if (!precontratRes.ok) return precontratRes

    // 2) Soumet le paiement avec justificatif uploadé
    const precontratId = precontratData?.precontrat?.id
    if (precontratId && justificatifUrl) {
      await laravelRequest(request, `/precontrats/${precontratId}/payer`, {
        method: 'POST',
        body: { justificatif_url: justificatifUrl, mode_paiement: modePaiement || 'mobile_money' },
      })
    }

    const { NextResponse } = await import('next/server')
    return NextResponse.json(precontratData, { status: 201 })
  }

  if (action === 'valider_precontrat') {
    const { precontratId, valide } = body
    if (valide) {
      return laravelRequest(request, `/precontrats/${precontratId}/valider`, {
        method: 'POST',
        body: {},
      })
    } else {
      return laravelRequest(request, `/precontrats/${precontratId}/refuser`, {
        method: 'POST',
        body: { motif: body.motif || 'Refusé par le freelance' },
      })
    }
  }

  const { NextResponse } = await import('next/server')
  return NextResponse.json({ erreur: 'Action non reconnue' }, { status: 400 })
}
