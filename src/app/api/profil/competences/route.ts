import { NextRequest, NextResponse } from 'next/server'
import { laravelRequest } from '@/lib/laravel'

export async function POST(request: NextRequest) {
  return laravelRequest(request, '/profil/competences')
}

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json()
    const id = body.id || body.competenceId
    if (!id) {
      return NextResponse.json({ erreur: 'ID de la compétence requis' }, { status: 400 })
    }
    return laravelRequest(request, `/profil/competences/${id}`, {
      method: 'DELETE'
    })
  } catch (error) {
    return NextResponse.json({ erreur: 'Format JSON invalide' }, { status: 400 })
  }
}
