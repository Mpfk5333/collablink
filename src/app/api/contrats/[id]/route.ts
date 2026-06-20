import { NextRequest } from 'next/server'
import { laravelRequest } from '@/lib/laravel'

// GET /api/contrats/[id]
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params
  return laravelRequest(request, `/contrats/${id}`)
}
