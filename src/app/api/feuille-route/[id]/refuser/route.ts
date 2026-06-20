import { NextRequest, NextResponse } from 'next/server'
import { keysToCamel, keysToSnake } from '@/lib/laravel'

const LARAVEL_API = process.env.NEXT_PUBLIC_LARAVEL_API_URL || 'http://localhost:8000/api'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const laravelPayload = keysToSnake(body)

    const res = await fetch(`${LARAVEL_API}/feuille-route/${id}/refuser`, {
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
      return NextResponse.json({ erreur: data.message || 'Erreur lors du refus' }, { status: res.status })
    }

    return NextResponse.json(keysToCamel(data))
  } catch (error: any) {
    return NextResponse.json({ erreur: error.message || 'Erreur serveur' }, { status: 500 })
  }
}
