import { NextRequest, NextResponse } from 'next/server'
import { laravelRequest } from '@/lib/laravel'

// GET /api/messagerie?utilisateurId=xxx → GET /api/conversations
// GET /api/messagerie?conversationId=xxx → GET /api/conversations/{id}/messages
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const conversationId = searchParams.get('conversationId')

  if (conversationId) {
    return laravelRequest(request, `/conversations/${conversationId}/messages`)
  }

  // Liste toutes les conversations (utilisateur courant via token)
  return laravelRequest(request, '/conversations')
}

// POST /api/messagerie - Envoyer un message
export async function POST(request: NextRequest) {
  const body = await request.clone().json().catch(() => ({}))
  const { conversationId, contenu } = body

  if (!conversationId || !contenu) {
    return NextResponse.json({ erreur: 'conversationId et contenu requis' }, { status: 400 })
  }

  return laravelRequest(request, `/conversations/${conversationId}/messages`, {
    method: 'POST',
    body: { contenu },
  })
}
