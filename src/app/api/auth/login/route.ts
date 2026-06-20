import { NextRequest, NextResponse } from 'next/server'
import { keysToSnake, keysToCamel } from '@/lib/laravel'

const LARAVEL_API_URL = process.env.LARAVEL_API_URL || 'http://localhost:8000/api'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const snakeBody = keysToSnake(body)

    const response = await fetch(`${LARAVEL_API_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(snakeBody)
    })

    const data = await response.json()
    const camelData = keysToCamel(data)

    if (!response.ok) {
      const errMessage = camelData.message || camelData.erreur || 'Identifiants incorrects'
      return NextResponse.json({ erreur: errMessage }, { status: response.status })
    }

    const token = camelData.token
    const user = camelData.user

    const res = NextResponse.json({
      message: 'Connexion réussie',
      utilisateur: user
    })

    res.cookies.set('api_token', token, {
      path: '/',
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7 // 1 week
    })

    return res
  } catch (error) {
    console.error('Erreur connexion:', error)
    return NextResponse.json({ erreur: 'Erreur lors de la connexion' }, { status: 500 })
  }
}
