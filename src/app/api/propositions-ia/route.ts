import { NextRequest, NextResponse } from 'next/server'
import { laravelRequest, keysToSnake } from '@/lib/laravel'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const recues = searchParams.get('recues')
  const envoyees = searchParams.get('envoyees')
  
  let endpoint = '/propositions-ia/recues'
  if (envoyees) {
    endpoint = '/propositions-ia/envoyees'
  }

  const response = await laravelRequest(request, endpoint)
  if (!response.ok) return response

  const body = await response.json()
  // Extract flat array if paginated
  const list = body.data !== undefined ? body.data : body
  return NextResponse.json(list)
}

export async function POST(request: NextRequest) {
  try {
    const json = await request.json()
    
    // Convert keys to snake_case for Laravel
    const snakeBody = keysToSnake(json)
    
    // New route: Client propose to freelance via POST /propositions-ia
    // (No longer using /projets/{id}/propositions-ia)
    return laravelRequest(request, `/propositions-ia`, {
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
    const { id, action } = json

    if (!id || !action) {
      return NextResponse.json({ erreur: 'id et action requis' }, { status: 400 })
    }

    // Map action names to Laravel endpoints
    let actionEndpoint = ''
    if (action === 'negocier') actionEndpoint = 'negocier'
    else if (action === 'valider') actionEndpoint = 'valider'
    else if (action === 'refuser') actionEndpoint = 'refuser'
    else if (action === 'accepter_negociation') actionEndpoint = 'accepter-negociation'
    else if (action === 'refuser_negociation') actionEndpoint = 'refuser-negociation'
    else {
      return NextResponse.json({ erreur: 'Action invalide' }, { status: 400 })
    }

    // Prepare body
    const snakeBody = keysToSnake(json)

    // Call Laravel: POST /propositions-ia/{id}/{action}
    return laravelRequest(request, `/propositions-ia/${id}/${actionEndpoint}`, {
      method: 'POST',
      body: snakeBody
    })
  } catch (error) {
    return NextResponse.json({ erreur: 'Format JSON invalide' }, { status: 400 })
  }
}
