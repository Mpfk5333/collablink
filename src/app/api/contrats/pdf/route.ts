import { NextRequest, NextResponse } from 'next/server'
import { laravelRequest } from '@/lib/laravel'

// GET /api/contrats/pdf?id=<precontratId ou contratId>
// Retourne une page HTML imprimable représentant le contrat
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return new NextResponse('ID du contrat requis', { status: 400 })
    }

    // Appeler Laravel pour générer le HTML du contrat/précontrat
    const response = await laravelRequest(request, `/contrats/${id}/pdf`, {
      method: 'GET',
    })

    // Laravel retourne déjà le HTML, on le passe simplement
    return response
  } catch (error) {
    console.error('Erreur génération PDF:', error)
    return new NextResponse('Erreur lors de la génération du document', { status: 500 })
  }
}
