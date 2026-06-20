'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { 
  PlayCircle, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  RefreshCw,
  Upload,
  Eye,
  Plus,
  Edit,
  Trash2,
  Clock
} from 'lucide-react'

interface Tache {
  id: string
  titre: string
  description?: string
  statut: 'a_faire' | 'en_cours' | 'livrable_soumis' | 'validee' | 'refusee' | 'en_litige'
  date_echeance?: string
  date_debut?: string
  date_soumission?: string
  date_validation?: string
  livrable_url?: string
  commentaire_client?: string
  commentaire_freelance?: string
  ordre: number
  cree_par: string
  created_at: string
  updated_at: string
}

interface Kanban {
  a_faire: Tache[]
  en_cours: Tache[]
  livrable_soumis: Tache[]
  validee: Tache[]
  refusee: Tache[]
  en_litige: Tache[]
}

interface KanbanTachesProps {
  contratId: string
  userRole: 'client' | 'freelance' | 'administrateur'
  userId: string
}

const statutLabels: Record<string, { label: string; color: string }> = {
  a_faire: { label: 'À faire', color: 'bg-gray-100 text-gray-800' },
  en_cours: { label: 'En cours', color: 'bg-blue-100 text-blue-800' },
  livrable_soumis: { label: 'Livrable soumis', color: 'bg-yellow-100 text-yellow-800' },
  validee: { label: 'Validée ✓', color: 'bg-green-100 text-green-800' },
  refusee: { label: 'Refusée', color: 'bg-red-100 text-red-800' },
  en_litige: { label: 'Litige', color: 'bg-orange-100 text-orange-800' },
}

export default function KanbanTaches({ contratId, userRole, userId }: KanbanTachesProps) {
  const [kanban, setKanban] = useState<Kanban>({
    a_faire: [],
    en_cours: [],
    livrable_soumis: [],
    validee: [],
    refusee: [],
    en_litige: [],
  })
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [actionDialog, setActionDialog] = useState<{ tache: Tache | null; action: string } | null>(null)
  
  // Formulaire nouvelle tâche
  const [nouvelleTache, setNouvelleTache] = useState({
    titre: '',
    description: '',
    date_echeance: '',
  })

  // Formulaire action
  const [actionData, setActionData] = useState({
    livrable_url: '',
    commentaire_freelance: '',
    commentaire_client: '',
    description_litige: '',
  })

  const loadTaches = async () => {
    try {
      const res = await fetch(`/api/taches?contratId=${contratId}`)
      const data = await res.json()
      if (data.kanban) {
        setKanban(data.kanban)
      }
    } catch (error) {
      console.error('Erreur chargement tâches:', error)
      toast.error('Erreur lors du chargement des tâches')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadTaches()
    // Auto-refresh toutes les 10 secondes
    const interval = setInterval(loadTaches, 10000)
    return () => clearInterval(interval)
  }, [contratId])

  const creerTache = async () => {
    if (!nouvelleTache.titre.trim()) {
      toast.error('Le titre est requis')
      return
    }

    try {
      const res = await fetch('/api/taches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'creer',
          contratId,
          ...nouvelleTache,
        }),
      })

      const data = await res.json()
      if (res.ok) {
        toast.success('Tâche créée')
        setNouvelleTache({ titre: '', description: '', date_echeance: '' })
        setDialogOpen(false)
        loadTaches()
      } else {
        toast.error(data.message || 'Erreur lors de la création')
      }
    } catch (error) {
      toast.error('Erreur réseau')
    }
  }

  const executerAction = async (tacheId: string, action: string, data: any = {}) => {
    try {
      const res = await fetch('/api/taches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          tacheId,
          ...data,
        }),
      })

      const result = await res.json()
      if (res.ok) {
        toast.success(result.message || 'Action effectuée')
        setActionDialog(null)
        setActionData({
          livrable_url: '',
          commentaire_freelance: '',
          commentaire_client: '',
          description_litige: '',
        })
        loadTaches()
      } else {
        toast.error(result.message || 'Erreur lors de l\'action')
      }
    } catch (error) {
      toast.error('Erreur réseau')
    }
  }

  const estEnRetard = (tache: Tache) => {
    if (!tache.date_echeance) return false
    if (['validee', 'en_litige'].includes(tache.statut)) return false
    return new Date() > new Date(tache.date_echeance)
  }

  const TacheCard = ({ tache }: { tache: Tache }) => {
    const enRetard = estEnRetard(tache)
    const estClient = userRole === 'client'
    const estFreelance = userRole === 'freelance'

    return (
      <Card className={`mb-3 ${enRetard ? 'border-red-300 border-2' : ''}`}>
        <CardContent className="p-4 space-y-2">
          <div className="flex justify-between items-start">
            <h4 className="font-semibold text-sm">{tache.titre}</h4>
            <Badge className={`text-xs ${statutLabels[tache.statut]?.color}`}>
              {statutLabels[tache.statut]?.label}
            </Badge>
          </div>

          {tache.description && (
            <p className="text-xs text-muted-foreground">{tache.description}</p>
          )}

          {tache.date_echeance && (
            <div className="flex items-center gap-1 text-xs">
              <Clock className="w-3 h-3" />
              <span className={enRetard ? 'text-red-600 font-semibold' : ''}>
                Échéance: {new Date(tache.date_echeance).toLocaleDateString()}
                {enRetard && ' (RETARD)'}
              </span>
            </div>
          )}

          {tache.commentaire_freelance && (
            <div className="text-xs bg-blue-50 p-2 rounded">
              <strong>Freelance:</strong> {tache.commentaire_freelance}
            </div>
          )}

          {tache.commentaire_client && (
            <div className="text-xs bg-yellow-50 p-2 rounded">
              <strong>Client:</strong> {tache.commentaire_client}
            </div>
          )}

          {tache.livrable_url && (
            <Button
              size="sm"
              variant="outline"
              className="w-full text-xs"
              onClick={() => window.open(tache.livrable_url, '_blank')}
            >
              <Eye className="w-3 h-3 mr-1" /> Voir le livrable
            </Button>
          )}

          {/* Actions FREELANCE */}
          {estFreelance && (
            <div className="flex flex-wrap gap-2 pt-2">
              {tache.statut === 'a_faire' && (
                <Button
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-700"
                  onClick={() => executerAction(tache.id, 'demarrer')}
                >
                  <PlayCircle className="w-3 h-3 mr-1" /> Démarrer
                </Button>
              )}

              {tache.statut === 'en_cours' && (
                <Button
                  size="sm"
                  className="bg-green-600 hover:bg-green-700"
                  onClick={() => setActionDialog({ tache, action: 'soumettre' })}
                >
                  <Upload className="w-3 h-3 mr-1" /> Soumettre
                </Button>
              )}

              {tache.statut === 'refusee' && (
                <Button
                  size="sm"
                  className="bg-yellow-600 hover:bg-yellow-700"
                  onClick={() => executerAction(tache.id, 'refaire')}
                >
                  <RefreshCw className="w-3 h-3 mr-1" /> Refaire
                </Button>
              )}
            </div>
          )}

          {/* Actions CLIENT */}
          {estClient && (
            <div className="flex flex-wrap gap-2 pt-2">
              {tache.statut === 'livrable_soumis' && (
                <>
                  <Button
                    size="sm"
                    className="bg-green-600 hover:bg-green-700"
                    onClick={() => setActionDialog({ tache, action: 'valider' })}
                  >
                    <CheckCircle className="w-3 h-3 mr-1" /> Valider
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => setActionDialog({ tache, action: 'refuser' })}
                  >
                    <XCircle className="w-3 h-3 mr-1" /> Refuser
                  </Button>
                  {enRetard && (
                    <Button
                      size="sm"
                      className="bg-orange-600 hover:bg-orange-700"
                      onClick={() => setActionDialog({ tache, action: 'litige' })}
                    >
                      <AlertTriangle className="w-3 h-3 mr-1" /> Litige
                    </Button>
                  )}
                </>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  if (loading) {
    return <div className="text-center py-8">Chargement des tâches...</div>
  }

  return (
    <div className="space-y-6">
      {/* Header avec bouton créer tâche (client uniquement) */}
      {userRole === 'client' && (
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">Gestion des tâches</h2>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-[#3B82F6] hover:bg-[#2563EB]">
                <Plus className="w-4 h-4 mr-2" /> Nouvelle tâche
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Créer une nouvelle tâche</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Titre *</Label>
                  <Input
                    value={nouvelleTache.titre}
                    onChange={(e) => setNouvelleTache({ ...nouvelleTache, titre: e.target.value })}
                    placeholder="Ex: Intégration de l'API de paiement"
                  />
                </div>
                <div>
                  <Label>Description</Label>
                  <Textarea
                    value={nouvelleTache.description}
                    onChange={(e) => setNouvelleTache({ ...nouvelleTache, description: e.target.value })}
                    placeholder="Détails de la tâche..."
                    rows={3}
                  />
                </div>
                <div>
                  <Label>Date d'échéance</Label>
                  <Input
                    type="date"
                    value={nouvelleTache.date_echeance}
                    onChange={(e) => setNouvelleTache({ ...nouvelleTache, date_echeance: e.target.value })}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogOpen(false)}>Annuler</Button>
                <Button onClick={creerTache}>Créer</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      )}

      {/* Kanban Board */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* À faire */}
        <Card>
          <CardHeader className="bg-gray-50">
            <CardTitle className="text-base flex items-center gap-2">
              📋 À faire ({kanban.a_faire.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 space-y-2">
            {kanban.a_faire.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-4">Aucune tâche</p>
            ) : (
              kanban.a_faire.map((tache) => <TacheCard key={tache.id} tache={tache} />)
            )}
          </CardContent>
        </Card>

        {/* En cours */}
        <Card>
          <CardHeader className="bg-blue-50">
            <CardTitle className="text-base flex items-center gap-2">
              🔄 En cours ({kanban.en_cours.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 space-y-2">
            {kanban.en_cours.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-4">Aucune tâche</p>
            ) : (
              kanban.en_cours.map((tache) => <TacheCard key={tache.id} tache={tache} />)
            )}
          </CardContent>
        </Card>

        {/* Livrable soumis */}
        <Card>
          <CardHeader className="bg-yellow-50">
            <CardTitle className="text-base flex items-center gap-2">
              📦 Livrable soumis ({kanban.livrable_soumis.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 space-y-2">
            {kanban.livrable_soumis.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-4">Aucune tâche</p>
            ) : (
              kanban.livrable_soumis.map((tache) => <TacheCard key={tache.id} tache={tache} />)
            )}
          </CardContent>
        </Card>

        {/* Validée */}
        <Card>
          <CardHeader className="bg-green-50">
            <CardTitle className="text-base flex items-center gap-2">
              ✅ Validées ({kanban.validee.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 space-y-2">
            {kanban.validee.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-4">Aucune tâche</p>
            ) : (
              kanban.validee.map((tache) => <TacheCard key={tache.id} tache={tache} />)
            )}
          </CardContent>
        </Card>

        {/* Refusée */}
        <Card>
          <CardHeader className="bg-red-50">
            <CardTitle className="text-base flex items-center gap-2">
              ❌ Refusées ({kanban.refusee.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 space-y-2">
            {kanban.refusee.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-4">Aucune tâche</p>
            ) : (
              kanban.refusee.map((tache) => <TacheCard key={tache.id} tache={tache} />)
            )}
          </CardContent>
        </Card>

        {/* Litige */}
        <Card>
          <CardHeader className="bg-orange-50">
            <CardTitle className="text-base flex items-center gap-2">
              ⚠️ Litiges ({kanban.en_litige.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 space-y-2">
            {kanban.en_litige.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-4">Aucune tâche</p>
            ) : (
              kanban.en_litige.map((tache) => <TacheCard key={tache.id} tache={tache} />)
            )}
          </CardContent>
        </Card>
      </div>

      {/* Dialog Actions (Soumettre, Valider, Refuser, Litige) */}
      {actionDialog && (
        <Dialog open={!!actionDialog} onOpenChange={() => setActionDialog(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {actionDialog.action === 'soumettre' && 'Soumettre le livrable'}
                {actionDialog.action === 'valider' && 'Valider la tâche'}
                {actionDialog.action === 'refuser' && 'Refuser la tâche'}
                {actionDialog.action === 'litige' && 'Créer un litige'}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              {actionDialog.action === 'soumettre' && (
                <>
                  <div>
                    <Label>URL du livrable *</Label>
                    <Input
                      value={actionData.livrable_url}
                      onChange={(e) => setActionData({ ...actionData, livrable_url: e.target.value })}
                      placeholder="https://..."
                    />
                  </div>
                  <div>
                    <Label>Commentaire</Label>
                    <Textarea
                      value={actionData.commentaire_freelance}
                      onChange={(e) => setActionData({ ...actionData, commentaire_freelance: e.target.value })}
                      placeholder="Notes pour le client..."
                      rows={3}
                    />
                  </div>
                </>
              )}

              {actionDialog.action === 'valider' && (
                <div>
                  <Label>Commentaire (optionnel)</Label>
                  <Textarea
                    value={actionData.commentaire_client}
                    onChange={(e) => setActionData({ ...actionData, commentaire_client: e.target.value })}
                    placeholder="Félicitations, excellent travail !"
                    rows={3}
                  />
                </div>
              )}

              {actionDialog.action === 'refuser' && (
                <div>
                  <Label>Raison du refus *</Label>
                  <Textarea
                    value={actionData.commentaire_client}
                    onChange={(e) => setActionData({ ...actionData, commentaire_client: e.target.value })}
                    placeholder="Expliquez pourquoi le livrable ne convient pas..."
                    rows={4}
                  />
                </div>
              )}

              {actionDialog.action === 'litige' && (
                <div>
                  <Label>Description du litige *</Label>
                  <Textarea
                    value={actionData.description_litige}
                    onChange={(e) => setActionData({ ...actionData, description_litige: e.target.value })}
                    placeholder="Décrivez le problème (délai dépassé, qualité insuffisante...)..."
                    rows={4}
                  />
                </div>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setActionDialog(null)}>Annuler</Button>
              <Button
                onClick={() => {
                  if (actionDialog.action === 'soumettre') {
                    if (!actionData.livrable_url.trim()) {
                      toast.error('URL du livrable requise')
                      return
                    }
                    executerAction(actionDialog.tache!.id, 'soumettre', {
                      livrable_url: actionData.livrable_url,
                      commentaire_freelance: actionData.commentaire_freelance,
                    })
                  } else if (actionDialog.action === 'valider') {
                    executerAction(actionDialog.tache!.id, 'valider', {
                      commentaire_client: actionData.commentaire_client,
                    })
                  } else if (actionDialog.action === 'refuser') {
                    if (!actionData.commentaire_client.trim()) {
                      toast.error('Raison du refus requise')
                      return
                    }
                    executerAction(actionDialog.tache!.id, 'refuser', {
                      commentaire_client: actionData.commentaire_client,
                    })
                  } else if (actionDialog.action === 'litige') {
                    if (!actionData.description_litige.trim()) {
                      toast.error('Description du litige requise')
                      return
                    }
                    executerAction(actionDialog.tache!.id, 'litige', {
                      description: actionData.description_litige,
                    })
                  }
                }}
              >
                Confirmer
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
