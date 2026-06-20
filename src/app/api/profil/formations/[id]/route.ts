import { NextRequest, NextResponse } from 'next/server'
import { laravelRequest } from '@/lib/laravel'

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const response = await laravelRequest(request, `/profil/formations/${params.id}`, {
      method: 'DELETE'
    })
    return response
  } catch (error) {
    return NextResponse.json({ erreur: 'Erreur lors de la suppression' }, { status: 500 })
  }
}
