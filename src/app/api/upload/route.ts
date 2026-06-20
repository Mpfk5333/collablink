import { NextRequest, NextResponse } from 'next/server'

const LARAVEL_API_URL = process.env.LARAVEL_API_URL || 'http://localhost:8000/api'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const type = formData.get('type') as string | null

    if (!file) {
      return NextResponse.json({ erreur: 'Aucun fichier fourni' }, { status: 400 })
    }

    // Map type to Laravel dossier parameter
    let dossier = 'uploads'
    if (type === 'signature') dossier = 'signatures'
    else if (type === 'cahier') dossier = 'cahiers_charges'
    else if (type === 'justificatif') dossier = 'justificatifs'
    else if (type === 'livrable') dossier = 'livrables'
    else if (type === 'avatar') dossier = 'avatars'
    else if (type === 'roadmap') dossier = 'feuilles_route'

    // Retrieve Bearer token from cookie/headers
    let token = request.cookies.get('api_token')?.value || ''
    const authHeader = request.headers.get('Authorization')
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7)
    }

    // Create form data for Laravel
    const laravelFormData = new FormData()
    laravelFormData.append('fichier', file)
    laravelFormData.append('dossier', dossier)

    const headers: Record<string, string> = {
      'Accept': 'application/json',
    }
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }

    const response = await fetch(`${LARAVEL_API_URL}/upload`, {
      method: 'POST',
      headers,
      body: laravelFormData
    })

    const data = await response.json()
    if (!response.ok) {
      const errMessage = data.message || data.erreur || 'Erreur lors de l\'upload'
      return NextResponse.json({ erreur: errMessage }, { status: response.status })
    }

    return NextResponse.json(data, { status: response.status })
  } catch (error) {
    console.error('Erreur upload:', error)
    return NextResponse.json({ erreur: 'Erreur lors de l\'upload du fichier' }, { status: 500 })
  }
}
