import { NextRequest, NextResponse } from 'next/server'
import { laravelRequest } from '@/lib/laravel'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const response = await laravelRequest(request, '/profil/formations', {
      method: 'POST',
      body
    })
    return response
  } catch (error) {
    return NextResponse.json({ erreur: 'Erreur lors de l\'ajout de la formation' }, { status: 500 })
  }
}
