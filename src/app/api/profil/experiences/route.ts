import { NextRequest, NextResponse } from 'next/server'
import { laravelRequest } from '@/lib/laravel'

export async function POST(request: NextRequest) {
  return laravelRequest(request, '/profil/experiences')
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  if (!id) {
    return NextResponse.json({ erreur: 'id requis' }, { status: 400 })
  }
  return laravelRequest(request, `/profil/experiences/${id}`, {
    method: 'DELETE'
  })
}
