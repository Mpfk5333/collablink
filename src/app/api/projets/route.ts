import { NextRequest, NextResponse } from 'next/server'
import { laravelRequest } from '@/lib/laravel'

export async function GET(request: NextRequest) {
  return laravelRequest(request, '/projets')
}

export async function POST(request: NextRequest) {
  return laravelRequest(request, '/projets')
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, ...data } = body
    if (!id) {
      return NextResponse.json({ erreur: 'ID du projet requis' }, { status: 400 })
    }
    return laravelRequest(request, `/projets/${id}`, {
      method: 'PUT',
      body: data
    })
  } catch (error) {
    return NextResponse.json({ erreur: 'Format JSON invalide' }, { status: 400 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json()
    const { id } = body
    if (!id) {
      return NextResponse.json({ erreur: 'ID du projet requis' }, { status: 400 })
    }
    return laravelRequest(request, `/projets/${id}`, {
      method: 'DELETE'
    })
  } catch (error) {
    return NextResponse.json({ erreur: 'Format JSON invalide' }, { status: 400 })
  }
}
