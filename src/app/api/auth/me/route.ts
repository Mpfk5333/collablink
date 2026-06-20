import { NextRequest, NextResponse } from 'next/server'

const LARAVEL_API_URL = process.env.LARAVEL_API_URL || 'http://localhost:8000/api'

export async function GET(request: NextRequest) {
  const token = request.cookies.get('api_token')?.value

  if (!token) {
    return NextResponse.json({ erreur: 'Non authentifié' }, { status: 401 })
  }

  try {
    const res = await fetch(`${LARAVEL_API_URL}/auth/me`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    })

    if (!res.ok) {
      return NextResponse.json({ erreur: 'Session invalide' }, { status: res.status })
    }

    const data = await res.json()
    
    // Le backend retourne { user: {...} }, on harmonise avec "utilisateur"
    return NextResponse.json({ 
      utilisateur: data.user 
    })
  } catch (error) {
    console.error('Erreur récupération utilisateur:', error)
    return NextResponse.json({ erreur: 'Erreur serveur' }, { status: 500 })
  }
}
