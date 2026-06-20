import { NextRequest, NextResponse } from 'next/server'
import { keysToCamel, keysToSnake } from '@/lib/laravel'

const LARAVEL_API = process.env.NEXT_PUBLIC_LARAVEL_API_URL || 'http://localhost:8000/api'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const contratId = searchParams.get('contratId')

    if (!contratId) {
      return NextResponse.json({ erreur: 'contratId requis' }, { status: 400 })
    }

    const res = await fetch(`${LARAVEL_API}/contrats/${contratId}/feuille-route`, {
      headers: {
        'Accept': 'application/json',
        'Cookie': request.headers.get('cookie') || '',
      },
    })

    if (!res.ok) {
      if (res.status === 404) {
        return NextResponse.json({ feuilleRoute: null })
      }
      const error = await res.json()
      return NextResponse.json({ erreur: error.message || 'Erreur lors de la récupération' }, { status: res.status })
    }

    const data = await res.json()
    return NextResponse.json(keysToCamel(data))
  } catch (error: any) {
    return NextResponse.json({ erreur: error.message || 'Erreur serveur' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const contratId = searchParams.get('contratId')

    if (!contratId) {
      return NextResponse.json({ erreur: 'contratId requis' }, { status: 400 })
    }

    const body = await request.json()
    const laravelPayload = keysToSnake(body)

    const res = await fetch(`${LARAVEL_API}/contrats/${contratId}/feuille-route`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Cookie': request.headers.get('cookie') || '',
      },
      body: JSON.stringify(laravelPayload),
    })

    const data = await res.json()

    if (!res.ok) {
      return NextResponse.json({ erreur: data.message || 'Erreur lors de l\'envoi' }, { status: res.status })
    }

    return NextResponse.json(keysToCamel(data))
  } catch (error: any) {
    return NextResponse.json({ erreur: error.message || 'Erreur serveur' }, { status: 500 })
  }
}
