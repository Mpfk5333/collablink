'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import KanbanTaches from '@/components/KanbanTaches'
import { Button } from '@/components/ui/button'
import { ArrowLeft, MessageSquare } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

export default function TachesPage() {
  const params = useParams()
  const router = useRouter()
  const contratId = params.id as string

  const [user, setUser] = useState<any>(null)
  const [contrat, setContrat] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Charger l'utilisateur connecté
    fetch('/api/auth/me')
      .then((r) => r.json())
      .then((data) => {
        if (data.utilisateur) {
          setUser(data.utilisateur)
        } else {
          router.push('/') // Rediriger si non connecté
        }
      })
      .catch(() => router.push('/'))
  }, [router])

  useEffect(() => {
    if (!contratId) return

    // Charger les détails du contrat
    fetch(`/api/contrats/${contratId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.contrat) {
          setContrat(data.contrat)
        }
        setLoading(false)
      })
      .catch(() => {
        setLoading(false)
      })
  }, [contratId])

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#3B82F6] mx-auto mb-4"></div>
          <p className="text-muted-foreground">Chargement...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push('/?page=contrats')}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Retour aux contrats
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-[#1E293B]">Gestion des tâches</h1>
              {contrat && (
                <p className="text-sm text-muted-foreground mt-1">
                  Contrat: {contrat.numero_contrat} - {contrat.projet?.titre}
                </p>
              )}
            </div>
          </div>

          {/* Bouton vers la messagerie */}
          {contrat && (
            <Button
              className="bg-[#3B82F6] hover:bg-[#2563EB]"
              onClick={() => router.push(`/?page=messagerie&contrat=${contratId}`)}
            >
              <MessageSquare className="w-4 h-4 mr-2" />
              Messagerie
            </Button>
          )}
        </div>

        {/* Info contrat */}
        {contrat && (
          <Card>
            <CardContent className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Client:</span>{' '}
                  <strong>{contrat.client?.prenom} {contrat.client?.nom}</strong>
                </div>
                <div>
                  <span className="text-muted-foreground">Freelance:</span>{' '}
                  <strong>{contrat.freelance?.prenom} {contrat.freelance?.nom}</strong>
                </div>
                <div>
                  <span className="text-muted-foreground">Montant:</span>{' '}
                  <strong>{contrat.montant_total?.toLocaleString('fr-FR')} FCFA</strong>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Kanban des tâches */}
        <KanbanTaches
          contratId={contratId}
          userRole={user.role}
          userId={user.id}
        />
      </div>
    </div>
  )
}
