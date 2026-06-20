import { NextRequest } from 'next/server'
import { laravelRequest } from '@/lib/laravel'

export async function GET(request: NextRequest) {
  return laravelRequest(request, '/competences')
}
