import { NextRequest, NextResponse } from 'next/server'
import { laravelRequest } from '@/lib/laravel'

// GET /api/profil?utilisateurId=...
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const utilisateurId = searchParams.get('utilisateurId')

  if (!utilisateurId) {
    return NextResponse.json({ erreur: 'utilisateurId requis' }, { status: 400 })
  }

  const response = await laravelRequest(request, `/utilisateurs/${utilisateurId}`)
  if (response.status !== 200) return response

  const body = await response.json()
  return NextResponse.json(body.user)
}

// PUT /api/profil
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { prenom, nom, telephone, pays, profilClient, profilFreelance } = body

    // 1. Update basic info if present
    if (prenom || nom || telephone !== undefined || pays !== undefined) {
      const basicResponse = await laravelRequest(request, '/auth/profile', {
        method: 'PUT',
        body: { prenom, nom, telephone, pays }
      })
      if (!basicResponse.ok) return basicResponse
    }

    // 2. Update client profile if present
    if (profilClient) {
      const clientResponse = await laravelRequest(request, '/profil/client', {
        method: 'PUT',
        body: profilClient
      })
      if (!clientResponse.ok) return clientResponse
    }

    // 3. Update freelance profile if present
    if (profilFreelance) {
      const freelanceResponse = await laravelRequest(request, '/profil/freelance', {
        method: 'PUT',
        body: profilFreelance
      })
      if (!freelanceResponse.ok) return freelanceResponse
    }

    // 4. Get current user
    const meResponse = await laravelRequest(request, '/auth/me', { method: 'GET' })
    if (!meResponse.ok) return meResponse

    const meBody = await meResponse.json()
    return NextResponse.json(meBody.user)
  } catch (error) {
    console.error('Erreur mise à jour profil:', error)
    return NextResponse.json({ erreur: 'Erreur lors de la mise à jour du profil' }, { status: 500 })
  }
}
