import { NextRequest, NextResponse } from 'next/server'
import { laravelRequest } from '@/lib/laravel'

// GET /api/notifications → GET /api/notifications (Laravel)
export async function GET(request: NextRequest) {
  return laravelRequest(request, '/notifications')
}

// PUT /api/notifications - Marquer lue / toutes lues
export async function PUT(request: NextRequest) {
  const body = await request.clone().json().catch(() => ({}))
  const { id, action } = body

  if (action === 'marquer_lue' && id) {
    return laravelRequest(request, `/notifications/${id}/lire`, {
      method: 'POST',
      body: {},
    })
  }

  if (action === 'marquer_toutes_lues') {
    return laravelRequest(request, '/notifications/lire-tout', {
      method: 'POST',
      body: {},
    })
  }

  return NextResponse.json({ message: 'OK' })
}
