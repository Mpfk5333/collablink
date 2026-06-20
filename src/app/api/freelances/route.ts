import { NextRequest, NextResponse } from 'next/server'
import { laravelRequest } from '@/lib/laravel'

// GET /api/freelances → GET /api/freelances/search ou /api/freelances/recommandations
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const recommandation = searchParams.get('recommandation') === 'true'

  if (recommandation) {
    return laravelRequest(request, '/freelances/recommandations')
  }

  return laravelRequest(request, '/freelances/search')
}
