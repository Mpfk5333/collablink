import { NextRequest, NextResponse } from 'next/server'
import { laravelRequest } from '@/lib/laravel'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const response = await laravelRequest(request, '/profil/portfolio', {
      method: 'POST',
      body
    })
    return response
  } catch (error) {
    return NextResponse.json({ erreur: 'Erreur lors de l\'ajout du projet' }, { status: 500 })
  }
}
