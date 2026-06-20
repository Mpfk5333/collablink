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

    // Retrieve Bearer token from cookie/headers
    let token = request.cookies.get('api_token')?.value || ''
    const authHeader = request.headers.get('Authorization')
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7)
    }

    // Create form data for Laravel
    const laravelFormData = new FormData()
    laravelFormData.append('file', file)
    if (type) laravelFormData.append('type', type)

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

    const contentType = response.headers.get('content-type') || ''
    if (!contentType.includes('application/json')) {
      const text = await response.text()
      console.error('Laravel returned non-JSON:', text.substring(0, 300))
      return NextResponse.json({ erreur: 'Erreur serveur Laravel (réponse non-JSON)' }, { status: 500 })
    }

    const data = await response.json()
    if (!response.ok) {
      const errMessage = data.message || data.erreur || "Erreur lors de l'upload"
      return NextResponse.json({ erreur: errMessage }, { status: response.status })
    }

    return NextResponse.json(data, { status: response.status })
  } catch (error: any) {
    console.error('Erreur upload:', error)
    return NextResponse.json({ erreur: "Erreur lors de l'upload du fichier" }, { status: 500 })
  }
}
