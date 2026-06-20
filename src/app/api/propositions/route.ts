import { NextRequest, NextResponse } from 'next/server'
import { laravelRequest, keysToSnake } from '@/lib/laravel'

export async function GET(request: NextRequest) {
  const response = await laravelRequest(request, '/propositions')
  if (!response.ok) return response
  
  const body = await response.json()
  const list = body.data !== undefined ? body.data : body
  return NextResponse.json(list)
}

export async function POST(request: NextRequest) {
  try {
    const json = await request.json()
    const { projetId } = json
    if (!projetId) {
      return NextResponse.json({ erreur: 'projetId requis' }, { status: 400 })
    }

    const snakeBody = keysToSnake(json)
    return laravelRequest(request, `/projets/${projetId}/propositions`, {
      method: 'POST',
      body: snakeBody
    })
  } catch (error) {
    return NextResponse.json({ erreur: 'Format JSON invalide' }, { status: 400 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const json = await request.json()
    const { id, statut } = json

    if (!id || !statut) {
      return NextResponse.json({ erreur: 'id et statut requis' }, { status: 400 })
    }

    let endpoint = `/propositions/${id}/refuser`
    if (statut === 'acceptee' || statut === 'accepte') {
      endpoint = `/propositions/${id}/accepter`
    }

    return laravelRequest(request, endpoint, {
      method: 'POST'
    })
  } catch (error) {
    return NextResponse.json({ erreur: 'Format JSON invalide' }, { status: 400 })
  }
}
