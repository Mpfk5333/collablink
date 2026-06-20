import { NextRequest, NextResponse } from 'next/server'
import { keysToSnake, keysToCamel } from '@/lib/laravel'

const LARAVEL_API_URL = process.env.LARAVEL_API_URL || 'http://localhost:8000/api'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const snakeBody = keysToSnake(body)
    
    // Inject confirmation password for Laravel validation
    if (snakeBody.mot_de_passe && !snakeBody.mot_de_passe_confirmation) {
      snakeBody.mot_de_passe_confirmation = snakeBody.mot_de_passe
    }

    const response = await fetch(`${LARAVEL_API_URL}/auth/register`, {
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
      const errors = camelData.errors
      let errMessage = camelData.message || camelData.erreur || 'Erreur lors de l\'inscription'
      if (errors) {
        const firstKey = Object.keys(errors)[0]
        if (Array.isArray(errors[firstKey])) {
          errMessage = errors[firstKey][0]
        }
      }
      return NextResponse.json({ erreur: errMessage }, { status: response.status })
    }

    const token = camelData.token
    const user = camelData.user

    const res = NextResponse.json({
      message: 'Compte créé avec succès',
      utilisateur: user
    }, { status: 201 })

    res.cookies.set('api_token', token, {
      path: '/',
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7 // 1 week
    })

    return res
  } catch (error) {
    console.error('Erreur inscription:', error)
    return NextResponse.json({ erreur: 'Erreur lors de l\'inscription' }, { status: 500 })
  }
}
