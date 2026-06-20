'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAppStore } from '@/store/app-store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Progress } from '@/components/ui/progress'
import { toast } from 'sonner'
import {
  LayoutDashboard, FolderKanban, FileText, Wallet, MessageSquare,
  Bell, LogOut, Star, Users, FileCheck, AlertTriangle, Settings,
  ChevronLeft, ChevronRight, Plus, Eye, CheckCircle, XCircle,
  Send, DollarSign, Shield, TrendingUp, Clock, UserCheck,
  Gavel, ArrowRight, Search, FileUp, Handshake, Edit, Trash2
} from 'lucide-react'

// ============================================================
// Composant principal
// ============================================================
export default function Home() {
  const { user, setUser, currentView, setCurrentView, profileViewerId, setProfileViewerId } = useAppStore()
  const [loading, setLoading] = useState(true)
  const [initializing, setInitializing] = useState(true)

  // Charger l'utilisateur au démarrage (vérifier la session)
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch('/api/auth/me')
        if (res.ok) {
          const data = await res.json()
          if (data.utilisateur) {
            setUser(data.utilisateur)
          }
        }
      } catch (error) {
        console.error('Erreur vérification auth:', error)
      } finally {
        setInitializing(false)
        setLoading(false)
      }
    }
    checkAuth()
  }, [setUser])

  // Afficher un loader pendant l'initialisation
  if (initializing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#1E3A8A] to-[#3B82F6]">
        <div className="text-center">
          <div className="inline-block w-16 h-16 bg-white rounded-full flex items-center justify-center mb-4">
            <Handshake className="w-8 h-8 text-[#3B82F6] animate-pulse" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">
            <span>Collab</span><span className="text-[#60A5FA]">Link</span>
          </h1>
          <p className="text-white/80">Chargement...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return <AuthPages onLogin={setUser} />
  }

  return (
    <div className="flex flex-col md:flex-row h-screen bg-[#F8FAFC]">
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden w-full min-w-0">
        <Navbar />
        <main className="flex-1 overflow-y-auto p-3 md:p-6">
          <MainContent currentView={currentView} user={user} />
        </main>
      </div>
      {/* Visionneuse de profil globale - s'ouvre quand on clique sur un avatar */}
      <ProfileViewer userId={profileViewerId} onClose={() => setProfileViewerId(null)} />
    </div>
  )
}

// ============================================================
// Visionneuse de profil (style Facebook - cliquer sur un avatar ouvre le profil)
// ============================================================
function ProfileViewer({ userId, onClose }: { userId: string | null; onClose: () => void }) {
  const [profil, setProfil] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!userId) {
      setProfil(null)
      return
    }
    setLoading(true)
    fetch(`/api/profil?utilisateurId=${userId}`)
      .then(r => r.json())
      .then(d => { if (!d.erreur) setProfil(d) })
      .finally(() => setLoading(false))
  }, [userId])

  if (!userId) return null

  return (
    <Dialog open={!!userId} onOpenChange={(open) => { if (!open) onClose() }}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        {loading ? (
          <div className="p-8 text-center text-muted-foreground">Chargement du profil...</div>
        ) : profil ? (
          <>
            {/* En-tête style Facebook avec bannière */}
            <div className="relative -m-6 mb-4">
              <div className="h-32 bg-gradient-to-r from-[#1E3A8A] to-[#3B82F6] rounded-t-lg" />
              <div className="px-6 pb-4 -mt-16 flex items-end gap-4">
                <Avatar className="h-28 w-28 border-4 border-white shadow-lg">
                  <AvatarFallback className="bg-gradient-to-br from-[#1E3A8A] to-[#3B82F6] text-white text-4xl font-bold">
                    {profil.prenom?.[0]}{profil.nom?.[0]}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 pb-2">
                  <h2 className="text-2xl font-bold text-[#1E293B]">{profil.prenom} {profil.nom}</h2>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge className={
                      profil.role === 'administrateur' ? 'bg-purple-100 text-purple-700' :
                      profil.role === 'freelance' ? 'bg-blue-100 text-blue-700' :
                      'bg-green-100 text-green-700'
                    }>
                      {profil.role === 'administrateur' ? 'Administrateur' :
                       profil.role === 'freelance' ? 'Freelance' : 'Client'}
                    </Badge>
                    {profil.profilFreelance?.titreProfessionnel && (
                      <span className="text-sm text-muted-foreground">{profil.profilFreelance.titreProfessionnel}</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Informations de contact */}
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <span className="font-medium">Email :</span> <span className="truncate">{profil.email}</span>
              </div>
              {profil.telephone && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <span className="font-medium">Téléphone :</span> {profil.telephone}
                </div>
              )}
              {profil.pays && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <span className="font-medium">Pays :</span> {profil.pays}
                </div>
              )}
            </div>

            {/* Stats pour freelance */}
            {profil.profilFreelance && (
              <div className="grid grid-cols-4 gap-3">
                <div className="bg-blue-50 rounded p-3 text-center">
                  <p className="text-xs text-muted-foreground">Fiabilité</p>
                  <p className="text-lg font-bold text-[#3B82F6]">{profil.profilFreelance.scoreFiabilite?.toFixed(1) || '0.0'}/5</p>
                </div>
                <div className="bg-green-50 rounded p-3 text-center">
                  <p className="text-xs text-muted-foreground">Complétion</p>
                  <p className="text-lg font-bold text-green-600">{profil.profilFreelance.tauxCompletion?.toFixed(0) || 0}%</p>
                </div>
                <div className="bg-purple-50 rounded p-3 text-center">
                  <p className="text-xs text-muted-foreground">Projets</p>
                  <p className="text-lg font-bold text-purple-600">{profil.profilFreelance.nombreProjets || 0}</p>
                </div>
                <div className="bg-yellow-50 rounded p-3 text-center">
                  <p className="text-xs text-muted-foreground">Tarif</p>
                  <p className="text-lg font-bold text-yellow-700">{profil.profilFreelance.tarif?.toLocaleString('fr-FR') || 0} FCFA/h</p>
                </div>
              </div>
            )}

            {/* Bio */}
            {profil.profilFreelance?.bio && (
              <div>
                <h3 className="font-semibold text-[#1E293B] mb-1">À propos</h3>
                <p className="text-sm text-muted-foreground bg-gray-50 p-3 rounded">{profil.profilFreelance.bio}</p>
              </div>
            )}

            {/* Compétences */}
            {profil.profilFreelance?.competences?.length > 0 && (
              <div>
                <h3 className="font-semibold text-[#1E293B] mb-2">Compétences</h3>
                <div className="flex flex-wrap gap-2">
                  {profil.profilFreelance.competences.map((fc: any) => (
                    <Badge key={fc.id} variant="secondary">
                      {fc.competence?.nom} <span className="ml-1 text-xs opacity-70">({fc.niveau})</span>
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Expériences professionnelles */}
            {profil.profilFreelance?.experiences?.length > 0 && (
              <div>
                <h3 className="font-semibold text-[#1E293B] mb-2">Expériences professionnelles</h3>
                <div className="space-y-2">
                  {profil.profilFreelance.experiences.map((exp: any) => (
                    <div key={exp.id} className="border-l-2 border-[#3B82F6] pl-3 py-1">
                      <p className="font-medium text-sm text-[#1E293B]">{exp.poste}</p>
                      <p className="text-xs text-muted-foreground">{exp.entreprise}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(exp.dateDebut).toLocaleDateString('fr-FR')} - {exp.dateFin ? new Date(exp.dateFin).toLocaleDateString('fr-FR') : 'Aujourd\'hui'}
                      </p>
                      {exp.description && <p className="text-xs text-muted-foreground mt-1">{exp.description}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Liens */}
            <div className="flex gap-2 flex-wrap">
              {profil.profilFreelance?.lienLinkedIn && (
                <Button variant="outline" size="sm" asChild>
                  <a href={profil.profilFreelance.lienLinkedIn} target="_blank" rel="noopener noreferrer">LinkedIn</a>
                </Button>
              )}
              {profil.profilFreelance?.lienGitHub && (
                <Button variant="outline" size="sm" asChild>
                  <a href={profil.profilFreelance.lienGitHub} target="_blank" rel="noopener noreferrer">GitHub</a>
                </Button>
              )}
              {profil.profilFreelance?.lienPortfolio && (
                <Button variant="outline" size="sm" asChild>
                  <a href={profil.profilFreelance.lienPortfolio} target="_blank" rel="noopener noreferrer">Portfolio</a>
                </Button>
              )}
            </div>
          </>
        ) : (
          <div className="p-8 text-center text-muted-foreground">Profil introuvable</div>
        )}
      </DialogContent>
    </Dialog>
  )
}

// ============================================================
// Pages d'authentification (Inscription / Connexion)
// ============================================================
function AuthPages({ onLogin }: { onLogin: (user: any) => void }) {
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [loading, setLoading] = useState(false)
  const [uploadingSig, setUploadingSig] = useState(false)
  const [formData, setFormData] = useState({
    nom: '', prenom: '', email: '', motDePasse: '', role: 'client',
    telephone: '+237', pays: 'Cameroun', signatureUrl: ''
  })

  // Upload de la signature numérique (sélection de fichier depuis la machine)
  const handleSignatureUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingSig(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('type', 'signature')
      const res = await fetch('/api/upload', { method: 'POST', body: fd })
      const data = await res.json()
      if (data.erreur) {
        toast.error(data.erreur)
      } else {
        setFormData(prev => ({ ...prev, signatureUrl: data.url }))
        toast.success('Signature uploadée avec succès')
      }
    } catch {
      toast.error('Erreur lors de l\'upload de la signature')
    }
    setUploadingSig(false)
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email, motDePasse: formData.motDePasse })
      })
      const data = await res.json()
      if (data.erreur) {
        toast.error(data.erreur)
      } else {
        onLogin(data.utilisateur)
        toast.success('Connexion réussie !')
      }
    } catch {
      toast.error('Erreur de connexion')
    }
    setLoading(false)
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      const data = await res.json()
      if (data.erreur) {
        toast.error(data.erreur)
      } else {
        toast.success('Compte créé ! Connectez-vous.')
        setMode('login')
      }
    } catch {
      toast.error('Erreur d\'inscription')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#1E3A8A] to-[#3B82F6] p-4">
      <Card className="w-full max-w-2xl shadow-2xl">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-[#1E3A8A] to-[#3B82F6] rounded-full flex items-center justify-center mb-4">
            <Handshake className="w-8 h-8 text-white" />
          </div>
          {/* Branding CollabLink */}
          <h1 className="text-3xl font-bold tracking-tight mb-1">
            <span className="text-[#1E3A8A]">Collab</span><span className="text-[#3B82F6]">Link</span>
          </h1>
          <CardTitle className="text-2xl font-bold text-[#1E293B]">
            {mode === 'login' ? 'Connexion' : 'Inscription'}
          </CardTitle>
          <CardDescription>
            Plateforme Collaborative de Gestion des Projets Freelances
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={mode} onValueChange={(v) => setMode(v as 'login' | 'register')}>
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="login">Connexion</TabsTrigger>
              <TabsTrigger value="register">Inscription</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" placeholder="votre@email.com"
                    value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="mdp">Mot de passe</Label>
                  <Input id="mdp" type="password" placeholder="Minimum 8 caractères"
                    value={formData.motDePasse} onChange={(e) => setFormData({...formData, motDePasse: e.target.value})} required />
                </div>
                <Button type="submit" className="w-full bg-gradient-to-r from-[#1E3A8A] to-[#3B82F6] hover:opacity-90" disabled={loading}>
                  {loading ? 'Connexion...' : 'Se connecter'}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="register">
              <form onSubmit={handleRegister} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Prénom</Label>
                    <Input placeholder="Prénom" value={formData.prenom}
                      onChange={(e) => setFormData({...formData, prenom: e.target.value})} required />
                  </div>
                  <div className="space-y-2">
                    <Label>Nom</Label>
                    <Input placeholder="Nom" value={formData.nom}
                      onChange={(e) => setFormData({...formData, nom: e.target.value})} required />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input type="email" placeholder="votre@email.com" value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})} required />
                </div>
                <div className="space-y-2">
                  <Label>Mot de passe (min. 8 caractères)</Label>
                  <Input type="password" placeholder="••••••••" value={formData.motDePasse}
                    onChange={(e) => setFormData({...formData, motDePasse: e.target.value})} required />
                </div>
                <div className="space-y-2">
                  <Label>Rôle</Label>
                  <Select value={formData.role} onValueChange={(v) => setFormData({...formData, role: v})}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="client">Client</SelectItem>
                      <SelectItem value="freelance">Freelance</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Téléphone</Label>
                    <Input placeholder="+237" value={formData.telephone}
                      onChange={(e) => setFormData({...formData, telephone: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <Label>Pays</Label>
                    <Input placeholder="Cameroun" value={formData.pays}
                      onChange={(e) => setFormData({...formData, pays: e.target.value})} />
                  </div>
                </div>
                <div>
                  <Label>Signature numérique *</Label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-[#3B82F6] transition-colors">
                    {formData.signatureUrl ? (
                      <div className="flex items-center gap-3">
                        <div className="h-16 w-32 border rounded bg-white flex items-center justify-center shrink-0">
                          <img src={formData.signatureUrl} alt="Signature" className="max-h-14 max-w-28 object-contain" />
                        </div>
                        <div className="flex-1">
                          <p className="text-xs text-green-600 font-medium flex items-center gap-1">
                            <CheckCircle className="w-4 h-4" /> Signature sélectionnée
                          </p>
                          <Button type="button" variant="outline" size="sm" className="mt-1 h-7 text-xs"
                            onClick={() => setFormData({ ...formData, signatureUrl: '' })}>
                            Changer
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <label className="flex flex-col items-center justify-center cursor-pointer py-2">
                        <FileUp className="w-8 h-8 text-[#3B82F6] mb-2" />
                        <span className="text-sm font-medium text-[#3B82F6]">
                          {uploadingSig ? 'Upload en cours...' : 'Cliquez pour sélectionner votre signature'}
                        </span>
                        <span className="text-xs text-muted-foreground mt-1">
                          Formats acceptés : PNG, JPG, WEBP (max 10 Mo)
                        </span>
                        <input
                          type="file"
                          accept="image/png,image/jpeg,image/jpg,image/webp"
                          onChange={handleSignatureUpload}
                          className="hidden"
                          disabled={uploadingSig}
                          required={!formData.signatureUrl}
                        />
                      </label>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">Obligatoire. Ne pourra plus être modifiée après inscription.</p>
                </div>
                <Button type="submit" className="w-full bg-gradient-to-r from-[#1E3A8A] to-[#3B82F6] hover:opacity-90" disabled={loading}>
                  {loading ? 'Création...' : 'Créer un compte'}
                </Button>
              </form>
            </TabsContent>
          </Tabs>


        </CardContent>
      </Card>
    </div>
  )
}

// ============================================================
// Sidebar (menu latéral)
// ============================================================
function Sidebar() {
  const { user, currentView, setCurrentView, sidebarOpen, setSidebarOpen, setProfileViewerId } = useAppStore()

  const menuClient = [
    { id: 'dashboard', label: 'Tableau de bord', icon: LayoutDashboard },
    { id: 'projets', label: 'Mes Projets', icon: FolderKanban },
    { id: 'rechercher_freelance', label: 'Rechercher un freelance', icon: Search },
    { id: 'candidatures', label: 'Candidatures', icon: FileText },
    { id: 'contrats', label: 'Contrats', icon: FileCheck },
    { id: 'jalons', label: 'Jalons', icon: TrendingUp },
    { id: 'messagerie', label: 'Messagerie', icon: MessageSquare },
    { id: 'portefeuille', label: 'Portefeuille', icon: Wallet },
    { id: 'litiges', label: 'Litiges', icon: Gavel },
    { id: 'evaluations', label: 'Évaluations', icon: Star },
    { id: 'profil', label: 'Profil', icon: Settings },
  ]

  const menuFreelance = [
    { id: 'dashboard', label: 'Tableau de bord', icon: LayoutDashboard },
    { id: 'projets_dispo', label: 'Projets disponibles', icon: Search },
    { id: 'mes_candidatures', label: 'Mes Candidatures', icon: FileText },
    { id: 'contrats', label: 'Contrats', icon: FileCheck },
    { id: 'jalons', label: 'Jalons', icon: TrendingUp },
    { id: 'messagerie', label: 'Messagerie', icon: MessageSquare },
    { id: 'portefeuille', label: 'Portefeuille', icon: Wallet },
    { id: 'litiges', label: 'Litiges', icon: Gavel },
    { id: 'evaluations', label: 'Évaluations', icon: Star },
    { id: 'profil', label: 'Profil', icon: Settings },
  ]

  const menuAdmin = [
    { id: 'dashboard', label: 'Tableau de bord', icon: LayoutDashboard },
    { id: 'validation_paiements', label: 'Gestion des paiements', icon: DollarSign },
    { id: 'utilisateurs', label: 'Utilisateurs', icon: Users },
    { id: 'messagerie', label: 'Messagerie', icon: MessageSquare },
    { id: 'parametres', label: 'Paramètres', icon: Settings },
  ]

  const menuItems = user?.role === 'administrateur' ? menuAdmin :
    user?.role === 'freelance' ? menuFreelance : menuClient

  const initials = user ? `${user.prenom[0]}${user.nom[0]}`.toUpperCase() : '??'
  const roleLabel = user?.role === 'administrateur' ? 'Administrateur' :
    user?.role === 'freelance' ? 'Freelance' : 'Client'

  return (
    <div className={`${sidebarOpen ? 'w-64' : 'w-16'} transition-all duration-300 bg-gradient-to-b from-[#1E3A8A] to-[#3B82F6] text-white flex flex-col`}>
      {/* Branding CollabLink en haut de la sidebar */}
      <div className="px-3 py-3 border-b border-white/20 flex items-center justify-center">
        {sidebarOpen ? (
          <span className="text-xl font-bold tracking-tight">
            <span className="text-white">Collab</span><span className="text-[#60A5FA]">Link</span>
          </span>
        ) : (
          <span className="text-xs font-bold leading-tight text-center">
            <span className="text-white block">Collab</span><span className="text-[#60A5FA] block">Link</span>
          </span>
        )}
      </div>
      {/* Profil utilisateur - cliquable pour voir son profil */}
      <div className="p-4 flex items-center gap-3 cursor-pointer hover:bg-white/10 transition-colors rounded-md"
        onClick={() => user?.id && setProfileViewerId(user.id)}
        title="Voir mon profil">
        <div className="flex items-center gap-1.5 shrink-0">
          <CollabLinkBadge size="xs" />
          <Avatar className="h-10 w-10 border-2 border-white/30 shrink-0">
            <AvatarFallback className="bg-white/20 text-white text-sm font-bold">{initials}</AvatarFallback>
          </Avatar>
        </div>
        {sidebarOpen && (
          <div className="min-w-0">
            <p className="text-sm font-semibold truncate">{user?.prenom} {user?.nom}</p>
            <p className="text-xs text-blue-200 truncate">{roleLabel}</p>
          </div>
        )}
      </div>

      <Separator className="bg-white/20 mx-2" />

      {/* Menu */}
      <nav className="flex-1 py-2 overflow-y-auto">
        {menuItems.map((item) => (
          <button key={item.id}
            onClick={() => setCurrentView(item.id)}
            className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
              currentView === item.id
                ? 'bg-white/20 text-white font-semibold border-r-4 border-white'
                : 'text-blue-100 hover:bg-white/10 hover:text-white'
            }`}>
            <item.icon className="w-5 h-5 shrink-0" />
            {sidebarOpen && <span className="truncate">{item.label}</span>}
          </button>
        ))}
      </nav>

      {/* Toggle sidebar */}
      <button onClick={() => setSidebarOpen(!sidebarOpen)}
        className="p-3 hover:bg-white/10 flex items-center justify-center">
        {sidebarOpen ? <ChevronLeft className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
      </button>
    </div>
  )
}

// ============================================================
// Navbar (barre supérieure)
// ============================================================

// Définition des types de notifications avec libellés et icônes
const TYPES_NOTIFICATIONS: { key: string; label: string; icon: any; color: string }[] = [
  { key: 'toutes', label: 'Toutes', icon: Bell, color: 'text-[#3B82F6]' },
  { key: 'nouvelle_proposition', label: 'Candidatures', icon: FileText, color: 'text-orange-600' },
  { key: 'proposition_acceptee', label: 'Candidatures acceptées', icon: CheckCircle, color: 'text-green-600' },
  { key: 'proposition_refusee', label: 'Candidatures refusées', icon: XCircle, color: 'text-red-600' },
  { key: 'precontrat_genere', label: 'Précontrats', icon: FileCheck, color: 'text-blue-600' },
  { key: 'contrat_signe', label: 'Contrats signés', icon: Handshake, color: 'text-purple-600' },
  { key: 'liberation_fonds', label: 'Libération fonds', icon: Wallet, color: 'text-emerald-600' },
  { key: 'jalon_valide', label: 'Jalons validés', icon: TrendingUp, color: 'text-teal-600' },
  { key: 'nouveau_message', label: 'Messages', icon: MessageSquare, color: 'text-cyan-600' },
  { key: 'litige_ouvert', label: 'Litiges', icon: AlertTriangle, color: 'text-red-700' },
  { key: 'recommandation_ia', label: 'Recommandations IA', icon: Star, color: 'text-yellow-600' },
]

// ============================================================
// Badge CollabLink — "Collab" en blanc, "Link" en bleu visible
// ============================================================
function CollabLinkBadge({ size = 'sm' }: { size?: 'xs' | 'sm' | 'md' | 'lg' }) {
  const sizes = {
    xs: 'text-[10px] leading-none px-1 py-0.5',
    sm: 'text-xs leading-none px-1.5 py-1',
    md: 'text-sm leading-none px-2 py-1.5',
    lg: 'text-base leading-none px-2.5 py-2',
  }
  return (
    <span className={`inline-flex items-center font-bold rounded ${sizes[size]} bg-gradient-to-r from-[#1E3A8A] to-[#3B82F6] shadow-sm shrink-0`} title="CollabLink">
      <span className="text-white">Collab</span><span className="text-[#60A5FA]">Link</span>
    </span>
  )
}

// Wrapper à utiliser devant chaque Avatar pour afficher le branding CollabLink
function AvatarWithBrand({ children, brandSize = 'xs' }: { children: React.ReactNode; brandSize?: 'xs' | 'sm' | 'md' }) {
  return (
    <div className="flex items-center gap-1.5">
      <CollabLinkBadge size={brandSize} />
      {children}
    </div>
  )
}

// Extrait le nom du projet depuis le contenu de la notification
function extraireProjetDuContenu(contenu: string): string | null {
  // Cherche les motifs comme : projet "X" / pour le projet "X" / du projet "X"
  const match = contenu.match(/projet\s+["«]([^"»]+)["»]/i)
  if (match) return match[1]
  // Cherche : jalon "X"
  const matchJalon = contenu.match(/jalon\s+["«]([^"»]+)["»]/i)
  if (matchJalon) return `Jalon : ${matchJalon[1]}`
  // Cherche : contrat CTR-XXXX-XXXXXX
  const matchContrat = contenu.match(/contrat\s+(CTR-\d{4}-\d{6})/i)
  if (matchContrat) return `Contrat ${matchContrat[1]}`
  return null
}

function Navbar() {
  const { user, setUser, setCurrentView } = useAppStore()
  const [notifications, setNotifications] = useState<any[]>([])
  const [nonLues, setNonLues] = useState(0)
  const [showNotif, setShowNotif] = useState(false)
  const [selectedType, setSelectedType] = useState<string>('toutes')
  const [selectedNotif, setSelectedNotif] = useState<any | null>(null)

  const loadNotifications = useCallback(async () => {
    if (!user) return
    try {
      const res = await fetch(`/api/notifications?utilisateurId=${user.id}`)
      const data = await res.json()
      if (data.notifications) {
        setNotifications(data.notifications)
        setNonLues(data.nonLues || 0)
      }
    } catch {}
  }, [user])

  useEffect(() => {
    let cancelled = false
    const doFetch = async () => {
      if (!user || cancelled) return
      try {
        const res = await fetch(`/api/notifications?utilisateurId=${user.id}`)
        const data = await res.json()
        if (!cancelled && data.notifications) {
          setNotifications(data.notifications)
          setNonLues(data.nonLues || 0)
        }
      } catch {}
    }
    doFetch()
    return () => { cancelled = true }
  }, [user])

  const markAsRead = async (notif: any) => {
    if (!notif.estLue) {
      await fetch('/api/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: notif.id, action: 'marquer_lue' })
      })
      toast.success('Notification marquée comme lue')
      loadNotifications()
    }
    setSelectedNotif(notif)
  }

  const markAllRead = async () => {
    await fetch('/api/notifications', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ utilisateurId: user?.id, action: 'marquer_toutes_lues' })
    })
    toast.success('Toutes les notifications ont été marquées comme lues')
    loadNotifications()
  }

  const handleLogout = () => {
    setUser(null)
    setCurrentView('dashboard')
    toast.success('Déconnexion réussie')
  }

  // Filtrage par type sélectionné
  const notifFiltrees = selectedType === 'toutes'
    ? notifications
    : notifications.filter(n => n.type === selectedType)

  // Comptage par type pour les badges
  const compteParType = (typeKey: string) => {
    if (typeKey === 'toutes') return nonLues
    return notifications.filter(n => n.type === typeKey && !n.estLue).length
  }

  return (
    <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-4 shrink-0">
      <div className="flex items-center gap-3">
        <span className="hidden md:inline-flex items-center font-bold text-base rounded px-2 py-1 bg-gradient-to-r from-[#1E3A8A] to-[#3B82F6] shadow-sm">
          <span className="text-white">Collab</span><span className="text-[#60A5FA]">Link</span>
        </span>
        <h2 className="text-lg font-semibold text-[#1E293B]">
          {user?.role === 'administrateur' ? 'Administration' :
           user?.role === 'freelance' ? 'Espace Freelance' : 'Espace Client'}
        </h2>
      </div>
      <div className="flex items-center gap-3">
        {/* Notifications - popup modal centré avec deux colonnes */}
        <div className="relative">
          <Button variant="ghost" size="icon" className="text-[#3B82F6] relative"
            onClick={() => { setShowNotif(true); loadNotifications() }}>
            <Bell className="w-5 h-5" />
            {nonLues > 0 && (
              <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-red-500 text-white text-xs">
                {nonLues}
              </Badge>
            )}
          </Button>

          {/* Modal Dialog centré avec backdrop sombre et flou - LARGEUR FLEXIBLE */}
          <Dialog open={showNotif} onOpenChange={setShowNotif}>
            <DialogContent className="w-[96vw] sm:w-[92vw] md:w-[88vw] lg:w-[1400px] xl:w-[1500px] max-w-[96vw] h-[92vh] max-h-[92vh] p-0 overflow-hidden gap-0 backdrop-blur-xl"
              showCloseButton={true}>
              <DialogHeader className="p-4 border-b border-gray-200 bg-gradient-to-r from-[#1E3A8A] to-[#3B82F6] text-white shrink-0">
                <DialogTitle className="text-white flex items-center gap-2">
                  <Bell className="w-5 h-5" />
                  Centre de notifications
                </DialogTitle>
                <DialogDescription className="text-blue-100">
                  Consultez et gérez toutes vos notifications par catégorie
                </DialogDescription>
              </DialogHeader>

              <div className="flex flex-1 min-h-0 flex-col md:flex-row">
                {/* Colonne gauche : types de notifications */}
                <div className="w-full md:w-56 bg-gradient-to-b from-[#1E3A8A] to-[#3B82F6] text-white flex md:flex-col shrink-0 overflow-x-auto md:overflow-x-hidden max-h-32 md:max-h-none">
                  <div className="p-3 border-b border-white/20 flex items-center justify-between shrink-0">
                    <span className="font-semibold text-sm">Catégories</span>
                    <Button variant="ghost" size="sm" onClick={markAllRead}
                      className="text-xs text-white/90 hover:bg-white/20 hover:text-white h-7">
                      Tout lire
                    </Button>
                  </div>
                  <ScrollArea className="flex-1 md:max-h-none">
                    <div className="flex md:flex-col">
                      {TYPES_NOTIFICATIONS.map(t => {
                        const Icon = t.icon
                        const count = compteParType(t.key)
                        const total = t.key === 'toutes' ? notifications.length : notifications.filter(n => n.type === t.key).length
                        return (
                          <button key={t.key}
                            onClick={() => { setSelectedType(t.key); setSelectedNotif(null) }}
                            className={`flex-1 md:w-full flex items-center gap-2 px-3 py-2.5 text-sm text-left transition-colors whitespace-nowrap ${
                              selectedType === t.key
                                ? 'bg-white/25 font-semibold'
                                : 'hover:bg-white/10 text-blue-50'
                            }`}>
                            <Icon className="w-4 h-4 shrink-0" />
                            <span className="flex-1 truncate">{t.label}</span>
                            {count > 0 && (
                              <Badge className="bg-red-500 text-white text-xs h-5 min-w-5 flex items-center justify-center p-0">
                                {count}
                              </Badge>
                            )}
                            {count === 0 && total > 0 && (
                              <span className="text-xs text-white/60">{total}</span>
                            )}
                          </button>
                        )
                      })}
                    </div>
                  </ScrollArea>
                </div>

                {/* Colonne du milieu : liste des notifications filtrées */}
                <div className="w-full md:w-80 md:border-r border-gray-200 flex flex-col shrink-0 max-h-64 md:max-h-none">
                  <div className="p-3 border-b border-gray-200 shrink-0">
                    <p className="font-semibold text-sm text-[#1E293B]">
                      {TYPES_NOTIFICATIONS.find(t => t.key === selectedType)?.label || 'Notifications'}
                    </p>
                    <p className="text-xs text-muted-foreground">{notifFiltrees.length} notification(s)</p>
                  </div>
                  <ScrollArea className="flex-1 min-h-0">
                    {notifFiltrees.length === 0 ? (
                      <p className="p-4 text-sm text-muted-foreground text-center">
                        Aucune notification dans cette catégorie
                      </p>
                    ) : notifFiltrees.map((n: any) => {
                      const typeConfig = TYPES_NOTIFICATIONS.find(t => t.key === n.type)
                      const Icon = typeConfig?.icon || Bell
                      const projet = extraireProjetDuContenu(n.contenu)
                      return (
                        <div key={n.id}
                          onClick={() => markAsRead(n)}
                          className={`p-3 border-b cursor-pointer hover:bg-blue-50 transition-colors ${
                            selectedNotif?.id === n.id ? 'bg-blue-100 border-l-4 border-l-[#3B82F6]' : ''
                          } ${!n.estLue ? 'bg-amber-50' : ''}`}>
                          <div className="flex items-start gap-2">
                            <Icon className={`w-4 h-4 mt-0.5 shrink-0 ${typeConfig?.color || 'text-gray-500'}`} />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-[#1E293B] truncate">{n.titre}</p>
                              {projet && (
                                <p className="text-xs font-semibold text-[#3B82F6] truncate">📋 {projet}</p>
                              )}
                              <p className="text-xs text-muted-foreground line-clamp-2">{n.contenu}</p>
                              <p className="text-[10px] text-muted-foreground mt-1">
                                {new Date(n.createdAt).toLocaleString('fr-FR', {
                                  day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit'
                                })}
                                {!n.estLue && <span className="ml-2 text-red-600 font-semibold">• Non lue</span>}
                              </p>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </ScrollArea>
                </div>

                {/* Colonne droite : détail de la notification sélectionnée - FLEX 1 */}
                <div className="flex-1 flex flex-col bg-gray-50 min-w-0 min-h-0">
                  {selectedNotif ? (
                    <div className="p-5 flex-1 overflow-y-auto">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-bold text-[#1E293B] text-lg">Détail de la notification</h3>
                        <Button variant="ghost" size="sm" onClick={() => setSelectedNotif(null)}
                          className="text-xs h-7">Fermer</Button>
                      </div>
                      <div className="space-y-4 bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                        <div>
                          <p className="text-xs text-muted-foreground uppercase tracking-wide">Titre</p>
                          <p className="font-semibold text-[#1E293B] text-base">{selectedNotif.titre}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground uppercase tracking-wide">Type</p>
                          <Badge variant="secondary" className="mt-1">
                            {TYPES_NOTIFICATIONS.find(t => t.key === selectedNotif.type)?.label || selectedNotif.type}
                          </Badge>
                        </div>
                        {extraireProjetDuContenu(selectedNotif.contenu) && (
                          <div>
                            <p className="text-xs text-muted-foreground uppercase tracking-wide">Projet concerné</p>
                            <p className="font-semibold text-[#3B82F6] flex items-center gap-1 mt-1">
                              <FolderKanban className="w-4 h-4" />
                              {extraireProjetDuContenu(selectedNotif.contenu)}
                            </p>
                          </div>
                        )}
                        <div>
                          <p className="text-xs text-muted-foreground uppercase tracking-wide">Message</p>
                          <p className="text-sm text-[#1E293B] bg-gray-50 p-3 rounded border border-gray-200 mt-1 whitespace-pre-wrap break-words">
                            {selectedNotif.contenu}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground uppercase tracking-wide">Date de réception</p>
                          <p className="text-sm mt-1">{new Date(selectedNotif.createdAt).toLocaleString('fr-FR')}</p>
                        </div>
                        {selectedNotif.lienAction && (
                          <Button
                            onClick={() => {
                              const lien = selectedNotif.lienAction
                              if (lien.includes('contrats')) setCurrentView('contrats')
                              else if (lien.includes('projets')) setCurrentView(user?.role === 'freelance' ? 'projets_dispo' : 'projets')
                              else if (lien.includes('messagerie')) setCurrentView('messagerie')
                              else if (lien.includes('portefeuille')) setCurrentView('portefeuille')
                              setShowNotif(false)
                              toast.info('Redirection vers la section concernée')
                            }}
                            className="w-full bg-gradient-to-r from-[#1E3A8A] to-[#3B82F6]">
                            <ArrowRight className="w-4 h-4 mr-2" /> Voir le détail
                          </Button>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="flex-1 flex items-center justify-center p-6">
                      <div className="text-center text-muted-foreground">
                        <Bell className="w-16 h-16 mx-auto mb-3 opacity-20" />
                        <p className="text-sm font-medium">Sélectionnez une notification</p>
                        <p className="text-xs mt-1">Cliquez sur une notification à gauche pour voir le détail complet</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* COLLABLINK - affiché juste avant les actions droites */}
        <span className="hidden sm:inline-flex items-center font-bold text-sm rounded px-2 py-1 bg-gradient-to-r from-[#1E3A8A] to-[#3B82F6] shadow-sm mr-1">
          <span className="text-white">Collab</span><span className="text-[#60A5FA]">Link</span>
        </span>

        {/* Déconnexion */}
        <Button variant="ghost" size="sm" onClick={handleLogout} className="text-[#3B82F6] gap-1">
          <LogOut className="w-4 h-4" />
          <span className="hidden sm:inline">Déconnexion</span>
        </Button>
      </div>
    </header>
  )
}

// ============================================================
// Contenu principal selon la vue
// ============================================================
function MainContent({ currentView, user }: { currentView: string; user: any }) {
  switch (currentView) {
    case 'dashboard':
      return user.role === 'administrateur' ? <AdminDashboard /> :
        user.role === 'freelance' ? <FreelanceDashboard /> : <ClientDashboard />
    case 'projets': return <ClientProjets />
    case 'rechercher_freelance': return <RechercherFreelancePage />
    case 'projets_dispo': return <FreelanceProjetsDispo />
    case 'candidatures': return <ClientCandidatures />
    case 'mes_candidatures': return <FreelanceCandidatures />
    case 'contrats': return <ContratsPage />
    case 'jalons': return <JalonsPage />
    case 'messagerie': return <MessageriePage />
    case 'portefeuille': return <PortefeuillePage />
    case 'evaluations': return <EvaluationsPage />
    case 'profil': return <ProfilPage />
    case 'validation_paiements': return <AdminValidationPaiements />
    case 'validation_jalons': return <AdminControleJalons />
    case 'litiges': return <LitigesPage />
    case 'utilisateurs': return <AdminUtilisateurs />
    default: return <ClientDashboard />
  }
}

// ============================================================
// Tableau de bord Client
// ============================================================
function ClientDashboard() {
  const { user, setCurrentView } = useAppStore()
  const [stats, setStats] = useState({ projets: 0, enCours: 0, candidatures: 0, depenses: 0 })

  useEffect(() => {
    if (!user) return
    const fetchStats = async () => {
      const [projetsRes, propositionsRes] = await Promise.all([
        fetch(`/api/projets?clientId=${user.id}`),
        fetch(`/api/propositions?projetId=`)
      ])
      const projets = await projetsRes.json()
      const propositions = await propositionsRes.json()
      const mesProjets = Array.isArray(projets) ? projets : []
      setStats({
        projets: mesProjets.length,
        enCours: mesProjets.filter((p: any) => p.statut === 'en_cours').length,
        candidatures: Array.isArray(propositions) ? propositions.filter((p: any) => mesProjets.some((pr: any) => pr.id === p.projetId)).length : 0,
        depenses: mesProjets.reduce((sum: number, p: any) => sum + (p.budgetEstime || 0), 0)
      })
    }
    fetchStats()
  }, [user])

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-[#1E293B]">Bienvenue, {user?.prenom} !</h1>
          <p className="text-muted-foreground">Voici un aperçu de votre activité</p>
        </div>
        <Button onClick={() => setCurrentView('projets')} className="bg-gradient-to-r from-[#1E3A8A] to-[#3B82F6]">
          <Plus className="w-4 h-4 mr-2" /> Nouveau projet
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard icon={FolderKanban} label="Projets" value={stats.projets} color="blue" />
        <StatCard icon={TrendingUp} label="En cours" value={stats.enCours} color="green" />
        <StatCard icon={FileText} label="Candidatures reçues" value={stats.candidatures} color="orange" />
        <StatCard icon={DollarSign} label="Budget total" value={`${stats.depenses.toLocaleString('fr-FR')} FCFA`} color="purple" />
      </div>

      <QuickActionsClient />
    </div>
  )
}

// ============================================================
// Tableau de bord Freelance
// ============================================================
function FreelanceDashboard() {
  const { user, setCurrentView } = useAppStore()
  const [stats, setStats] = useState({ disponibles: 0, candidatures: 0, enCours: 0, gains: 0 })

  useEffect(() => {
    if (!user) return
    const fetchStats = async () => {
      const [projetsRes, candidaturesRes, portefeuilleRes] = await Promise.all([
        fetch(`/api/projets?statut=publie`),
        fetch(`/api/propositions?freelanceId=${user.id}`),
        fetch(`/api/portefeuille?utilisateurId=${user.id}`)
      ])
      const projets = await projetsRes.json()
      const candidatures = await candidaturesRes.json()
      const portefeuille = await portefeuilleRes.json()
      setStats({
        disponibles: Array.isArray(projets) ? projets.length : 0,
        candidatures: Array.isArray(candidatures) ? candidatures.length : 0,
        enCours: Array.isArray(candidatures) ? candidatures.filter((c: any) => c.statut === 'acceptee').length : 0,
        gains: portefeuille?.totalGagne || 0,
      })
    }
    fetchStats()
  }, [user])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#1E293B]">Bienvenue, {user?.prenom} !</h1>
        <p className="text-muted-foreground">Découvrez les dernières opportunités</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard icon={Search} label="Projets disponibles" value={stats.disponibles} color="blue" />
        <StatCard icon={FileText} label="Mes candidatures" value={stats.candidatures} color="orange" />
        <StatCard icon={TrendingUp} label="Missions en cours" value={stats.enCours} color="green" />
        <StatCard icon={DollarSign} label="Gains totaux" value={`${stats.gains.toLocaleString('fr-FR')} FCFA`} color="purple" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Actions rapides</CardTitle>
        </CardHeader>
        <CardContent className="flex gap-3 flex-wrap">
          <Button variant="outline" onClick={() => setCurrentView('projets_dispo')} className="border-[#3B82F6] text-[#3B82F6]">
            <Search className="w-4 h-4 mr-2" /> Voir les projets
          </Button>
          <Button variant="outline" onClick={() => setCurrentView('portefeuille')} className="border-[#3B82F6] text-[#3B82F6]">
            <Wallet className="w-4 h-4 mr-2" /> Mon portefeuille
          </Button>
          <Button variant="outline" onClick={() => setCurrentView('profil')} className="border-[#3B82F6] text-[#3B82F6]">
            <Edit className="w-4 h-4 mr-2" /> Compléter mon profil
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

// ============================================================
// Tableau de bord Admin
// ============================================================
function AdminDashboard() {
  const [stats, setStats] = useState<any>({})

  useEffect(() => {
    fetch('/api/admin?type=stats').then(r => r.json()).then(setStats)
  }, [])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#1E293B]">Administration</h1>
        <p className="text-muted-foreground">Vue d'ensemble de la plateforme</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
        <StatCard icon={Users} label="Utilisateurs" value={stats.totalUtilisateurs || 0} color="blue" />
        <StatCard icon={FolderKanban} label="Projets" value={stats.totalProjets || 0} color="green" />
        <StatCard icon={TrendingUp} label="En cours" value={stats.projetsEnCours || 0} color="orange" />
        <StatCard icon={DollarSign} label="Paiements en attente" value={stats.transactionsEnAttente || 0} color="red" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle className="text-lg">Actions rapides</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            <Button variant="outline" className="w-full justify-start border-[#3B82F6] text-[#3B82F6]"
              onClick={() => useAppStore.getState().setCurrentView('validation_paiements')}>
              <DollarSign className="w-4 h-4 mr-2" /> Gérer les paiements ({stats.transactionsEnAttente || 0} en attente)
            </Button>
            <Button variant="outline" className="w-full justify-start border-[#3B82F6] text-[#3B82F6]"
              onClick={() => useAppStore.getState().setCurrentView('utilisateurs')}>
              <Users className="w-4 h-4 mr-2" /> Gérer les utilisateurs
            </Button>
            <Button variant="outline" className="w-full justify-start border-[#3B82F6] text-[#3B82F6]"
              onClick={() => useAppStore.getState().setCurrentView('messagerie')}>
              <MessageSquare className="w-4 h-4 mr-2" /> Messagerie
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-lg">Statistiques plateforme</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between text-sm"><span className="text-muted-foreground">Clients</span><span className="font-semibold">{stats.totalClients || 0}</span></div>
            <div className="flex justify-between text-sm"><span className="text-muted-foreground">Freelances</span><span className="font-semibold">{stats.totalFreelances || 0}</span></div>
            <div className="flex justify-between text-sm"><span className="text-muted-foreground">Projets terminés</span><span className="font-semibold">{stats.projetsTermines || 0}</span></div>
            <div className="flex justify-between text-sm"><span className="text-muted-foreground">Contrats actifs</span><span className="font-semibold">{stats.totalContrats || 0}</span></div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// ============================================================
// Page Projets (Client)
// ============================================================
function ClientProjets() {
  const { user } = useAppStore()
  const [projets, setProjets] = useState<any[]>([])
  const [showNew, setShowNew] = useState(false)
  const [editingProjet, setEditingProjet] = useState<any | null>(null)
  const [filtreStatut, setFiltreStatut] = useState<string>('tous')
  const [competences, setCompetences] = useState<any[]>([])
  const [uploadingCahier, setUploadingCahier] = useState(false)
  const [form, setForm] = useState({
    titre: '', description: '', budgetEstime: 0, delaiLivraison: '',
    cahierChargesUrl: '', cahierChargesNom: '', competenceIds: [] as string[], statut: 'brouillon'
  })

  useEffect(() => {
    if (!user) return
    fetch(`/api/projets?clientId=${user.id}`).then(r => r.json()).then(d => setProjets(Array.isArray(d) ? d : []))
    fetch('/api/competences').then(r => r.json()).then(d => setCompetences(Array.isArray(d) ? d : [])).catch(() => {})
  }, [user])

  // Upload du cahier des charges (sélection de fichier depuis la machine, type pièces jointes WhatsApp)
  const handleCahierUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingCahier(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('type', 'cahier')
      const res = await fetch('/api/upload', { method: 'POST', body: fd })
      const data = await res.json()
      if (data.erreur) {
        toast.error(data.erreur)
      } else {
        setForm(prev => ({ ...prev, cahierChargesUrl: data.url, cahierChargesNom: file.name }))
        toast.success('Cahier des charges ajouté : ' + file.name)
      }
    } catch {
      toast.error('Erreur lors de l\'upload du cahier des charges')
    }
    setUploadingCahier(false)
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    const res = await fetch('/api/projets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, clientId: user?.id })
    })
    const data = await res.json()
    if (data.erreur) { toast.error(data.erreur); return }
    toast.success(form.statut === 'publie' ? 'Projet publié !' : 'Projet enregistré en brouillon !')
    setShowNew(false)
    setProjets(prev => [data, ...prev])
    setForm({
      titre: '', description: '', budgetEstime: 0, delaiLivraison: '',
      cahierChargesUrl: '', cahierChargesNom: '', competenceIds: [], statut: 'brouillon'
    })
  }

  const publierProjet = async (id: string) => {
    const res = await fetch('/api/projets', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, statut: 'publie' })
    })
    const data = await res.json()
    if (data.erreur) { toast.error(data.erreur); return }
    toast.success('Projet publié !')
    setProjets(prev => prev.map(p => p.id === id ? { ...p, statut: 'publie' } : p))
  }

  // ============================================================
  // Édition / Suppression de projet
  // ============================================================
  const ouvrirEdition = (p: any) => {
    setEditingProjet(p)
    setForm({
      titre: p.titre || '',
      description: p.description || '',
      budgetEstime: p.budgetEstime || 0,
      delaiLivraison: p.delaiLivraison ? new Date(p.delaiLivraison).toISOString().slice(0, 10) : '',
      cahierChargesUrl: p.cahierChargesUrl || '',
      cahierChargesNom: p.cahierChargesUrl ? 'Cahier existant' : '',
      competenceIds: (p.competences || []).map((c: any) => c.competenceId || c.id),
      statut: p.statut || 'brouillon'
    })
    setShowNew(true)
  }

  const supprimerProjet = async (id: string) => {
    if (!confirm('Supprimer définitivement ce projet ? Cette action est irréversible.')) return
    const res = await fetch('/api/projets', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id })
    })
    const data = await res.json()
    if (data.erreur) { toast.error(data.erreur); return }
    toast.success('Projet supprimé')
    setProjets(prev => prev.filter(p => p.id !== id))
  }

  const handleCreateOrUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    const isEdit = !!editingProjet
    const url = '/api/projets'
    const method = isEdit ? 'PUT' : 'POST'
    const body: any = { ...form, clientId: user?.id }
    if (isEdit) body.id = editingProjet.id

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    })
    const data = await res.json()
    if (data.erreur) { toast.error(data.erreur); return }
    toast.success(isEdit ? 'Projet mis à jour !' : (form.statut === 'publie' ? 'Projet publié !' : 'Projet enregistré en brouillon !'))
    setShowNew(false)
    setEditingProjet(null)
    setProjets(prev => isEdit ? prev.map(p => p.id === data.id ? data : p) : [data, ...prev])
    setForm({
      titre: '', description: '', budgetEstime: 0, delaiLivraison: '',
      cahierChargesUrl: '', cahierChargesNom: '', competenceIds: [], statut: 'brouillon'
    })
  }

  // Filtrage par statut (dropdown)
  const projetsFiltres = filtreStatut === 'tous'
    ? projets
    : projets.filter(p => p.statut === filtreStatut)

  const statutColors: any = {
    brouillon: 'bg-gray-100 text-gray-700',
    publie: 'bg-blue-100 text-blue-700',
    en_recrutement: 'bg-yellow-100 text-yellow-700',
    en_cours: 'bg-green-100 text-green-700',
    en_litige: 'bg-red-100 text-red-700',
    termine: 'bg-emerald-100 text-emerald-700',
    annule: 'bg-gray-100 text-gray-500',
  }

  const statutLabels: any = {
    brouillon: 'Brouillon', publie: 'Publié', en_recrutement: 'En recrutement',
    en_cours: 'En cours', en_litige: 'En litige', termine: 'Terminé', annule: 'Annulé'
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
        <h1 className="text-2xl font-bold text-[#1E293B]">Mes Projets</h1>
        <div className="flex flex-wrap items-center gap-2">
          {/* Dropdown filtre par statut */}
          <Select value={filtreStatut} onValueChange={setFiltreStatut}>
            <SelectTrigger className="w-[180px] h-9">
              <SelectValue placeholder="Filtrer par statut" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="tous">Tous les statuts</SelectItem>
              <SelectItem value="brouillon">Brouillons</SelectItem>
              <SelectItem value="publie">Publiés</SelectItem>
              <SelectItem value="en_recrutement">En recrutement</SelectItem>
              <SelectItem value="en_cours">En cours</SelectItem>
              <SelectItem value="en_litige">En litige</SelectItem>
              <SelectItem value="termine">Terminés</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={() => { setEditingProjet(null); setForm({ titre: '', description: '', budgetEstime: 0, delaiLivraison: '', cahierChargesUrl: '', cahierChargesNom: '', competenceIds: [], statut: 'brouillon' }); setShowNew(true) }} className="bg-gradient-to-r from-[#1E3A8A] to-[#3B82F6]">
            <Plus className="w-4 h-4 mr-2" /> Nouveau projet
          </Button>
        </div>
      </div>

      {/* Formulaire création/édition projet */}
      <Dialog open={showNew} onOpenChange={(o) => { setShowNew(o); if (!o) setEditingProjet(null) }}>
        <DialogContent className="w-[95vw] sm:w-[90vw] max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingProjet ? 'Modifier le projet' : 'Créer un projet'}</DialogTitle>
            <DialogDescription>{editingProjet ? 'Mettez à jour les informations de votre projet' : 'Remplissez les informations de votre projet'}</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateOrUpdate} className="space-y-4">
            <div><Label>Titre *</Label><Input value={form.titre} onChange={e => setForm({...form, titre: e.target.value})} required /></div>
            <div><Label>Description *</Label><Textarea rows={4} value={form.description} onChange={e => setForm({...form, description: e.target.value})} required /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Budget estimé (FCFA) *</Label><Input type="number" value={form.budgetEstime || ''} onChange={e => setForm({...form, budgetEstime: Number(e.target.value)})} required /></div>
              <div><Label>Délai de livraison *</Label><Input type="date" value={form.delaiLivraison} onChange={e => setForm({...form, delaiLivraison: e.target.value})} required /></div>
            </div>

            {/* Cahier des charges - sélection de fichier depuis la machine */}
            <div>
              <Label>Cahier des charges - Obligatoire pour publier</Label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-[#3B82F6] transition-colors mt-1">
                {form.cahierChargesUrl ? (
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 bg-red-50 rounded-lg flex items-center justify-center shrink-0">
                      <FileText className="w-6 h-6 text-red-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[#1E293B] truncate">{form.cahierChargesNom}</p>
                      <p className="text-xs text-green-600 flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" /> Fichier ajouté
                      </p>
                    </div>
                    <Button type="button" variant="outline" size="sm" className="text-xs h-7"
                      onClick={() => setForm({ ...form, cahierChargesUrl: '', cahierChargesNom: '' })}>
                      Changer
                    </Button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center cursor-pointer py-4">
                    <FileUp className="w-10 h-10 text-[#3B82F6] mb-2" />
                    <span className="text-sm font-medium text-[#3B82F6]">
                      {uploadingCahier ? 'Upload en cours...' : 'Ajouter le cahier des charges'}
                    </span>
                    <span className="text-xs text-muted-foreground mt-1 text-center">
                      Cliquez pour parcourir les fichiers de votre machine ou téléphone
                    </span>
                    <span className="text-xs text-muted-foreground mt-1">
                      Formats acceptés : PDF, DOC, DOCX (max 10 Mo)
                    </span>
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                      onChange={handleCahierUpload}
                      className="hidden"
                      disabled={uploadingCahier}
                    />
                  </label>
                )}
              </div>
            </div>

            <div><Label>Compétences requises</Label>
              {/* Champ texte libre + bouton + pour ajout illimité insensible à la casse */}
              <CompetencesInput
                valeurs={form.competenceIds as unknown as string[]}
                onChange={(vals) => setForm({ ...form, competenceIds: vals as any })}
              />
            </div>
            <div className="flex gap-2 pt-2">
              {editingProjet ? (
                <Button type="submit" className="flex-1 bg-gradient-to-r from-[#1E3A8A] to-[#3B82F6]">
                  <Edit className="w-4 h-4 mr-2" /> Mettre à jour
                </Button>
              ) : (
                <>
                  <Button type="submit" variant="outline" className="flex-1">Enregistrer brouillon</Button>
                  <Button type="submit" className="flex-1 bg-gradient-to-r from-[#1E3A8A] to-[#3B82F6]"
                    onClick={() => setForm({...form, statut: 'publie'})}>Publier</Button>
                </>
              )}
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Liste des projets filtrés */}
      <div className="grid gap-4">
        {projetsFiltres.length === 0 ? (
          <Card><CardContent className="p-8 text-center text-muted-foreground">
            {projets.length === 0 ? 'Aucun projet. Créez votre premier projet !' : 'Aucun projet dans cette catégorie.'}
          </CardContent></Card>
        ) : projetsFiltres.map(p => (
          <Card key={p.id}>
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
                <div className="space-y-1 flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-[#1E293B]">{p.titre}</h3>
                    <Badge className={statutColors[p.statut] || 'bg-gray-100'}>{statutLabels[p.statut] || p.statut}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2">{p.description}</p>
                  <div className="flex flex-wrap gap-4 text-xs text-muted-foreground pt-1">
                    <span className="flex items-center gap-1"><DollarSign className="w-3 h-3" />{p.budgetEstime?.toLocaleString('fr-FR')} FCFA</span>
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{new Date(p.delaiLivraison).toLocaleDateString('fr-FR')}</span>
                    {p.typeContrat && <span className="flex items-center gap-1"><FileText className="w-3 h-3" />{p.typeContrat}</span>}
                  </div>
                  {p.competences?.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-1">{p.competences.map((c: any) => (
                      <Badge key={c.id} variant="secondary" className="text-xs">{c.competence?.nom || c.competenceId}</Badge>
                    ))}</div>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  {p.statut === 'brouillon' && p.cahierChargesUrl && (
                    <Button size="sm" onClick={() => publierProjet(p.id)} className="bg-[#3B82F6]">
                      Publier
                    </Button>
                  )}
                  {/* Boutons édition / suppression - accessibles si brouillon ou publie */}
                  {['brouillon', 'publie', 'en_recrutement'].includes(p.statut) && (
                    <>
                      <Button size="sm" variant="outline" onClick={() => ouvrirEdition(p)}>
                        <Edit className="w-3.5 h-3.5 mr-1" /> Modifier
                      </Button>
                      <Button size="sm" variant="outline" className="text-red-600 hover:bg-red-50"
                        onClick={() => supprimerProjet(p.id)}>
                        <XCircle className="w-3.5 h-3.5 mr-1" /> Supprimer
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

// ============================================================
// Page Rechercher un freelance (Client)
// ============================================================
function RechercherFreelancePage() {
  const { user, setProfileViewerId } = useAppStore()
  const [freelances, setFreelances] = useState<any[]>([])
  const [competences, setCompetences] = useState<any[]>([])
  const [recommandations, setRecommandations] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingReco, setLoadingReco] = useState(false)
  const [filtres, setFiltres] = useState({
    search: '',
    competenceId: '__toutes__',
    tarifMin: 0,
    tarifMax: 0,
    tri: 'pertinence',
  })

  // Charger les compétences pour le filtre
  useEffect(() => {
    fetch('/api/competences').then(r => r.json()).then(d => setCompetences(Array.isArray(d) ? d : [])).catch(() => {})
  }, [])

  // Recherche initiale sans filtre
  useEffect(() => {
    lancerRecherche()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const lancerRecherche = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filtres.search) params.append('search', filtres.search)
      if (filtres.competenceId && filtres.competenceId !== '__toutes__') params.append('competenceId', filtres.competenceId)
      if (filtres.tarifMin > 0) params.append('tarifMin', String(filtres.tarifMin))
      if (filtres.tarifMax > 0) params.append('tarifMax', String(filtres.tarifMax))
      if (filtres.tri) params.append('tri', filtres.tri)

      const res = await fetch(`/api/freelances?${params.toString()}`)
      const data = await res.json()
      if (Array.isArray(data)) {
        setFreelances(data)
        if (data.length > 0) {
          toast.success(`${data.length} freelance(s) trouvé(s)`)
        } else {
          toast.info('Aucun freelance ne correspond à vos critères')
        }
      } else {
        toast.error('Erreur lors de la recherche')
      }
    } catch {
      toast.error('Erreur lors de la recherche')
    }
    setLoading(false)
  }

  const lancerRecommandation = async () => {
    if (!user) return
    setLoadingReco(true)
    try {
      const res = await fetch(`/api/freelances?recommandation=true&clientId=${user.id}`)
      const data = await res.json()
      if (data.recommandations) {
        setRecommandations(data.recommandations)
        if (data.recommandations.length > 0) {
          toast.success(`${data.recommandations.length} recommandation(s) IA générée(s)`)
        } else {
          toast.info(data.message || 'Aucune recommandation disponible pour le moment')
        }
      } else {
        toast.error(data.erreur || 'Erreur lors de la recommandation')
      }
    } catch {
      toast.error('Erreur lors de la recommandation IA')
    }
    setLoadingReco(false)
  }

  const reinitialiserFiltres = () => {
    setFiltres({ search: '', competenceId: '__toutes__', tarifMin: 0, tarifMax: 0, tri: 'pertinence' })
    toast.info('Filtres réinitialisés')
    setTimeout(() => lancerRecherche(), 100)
  }

  // Grouper les recommandations par projet
  const recommandationsParProjet = recommandations.reduce((acc: any, rec) => {
    if (!acc[rec.projetId]) {
      acc[rec.projetId] = {
        projetId: rec.projetId,
        projetTitre: rec.projetTitre,
        projetDescription: rec.projetDescription,
        projetBudget: rec.projetBudget,
        projetStatut: rec.projetStatut,
        freelances: []
      }
    }
    acc[rec.projetId].freelances.push(rec)
    return acc
  }, {} as any)
  const projetsGroupes = Object.values(recommandationsParProjet) as any[]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#1E293B]">Rechercher un freelance</h1>
        <p className="text-muted-foreground">Trouvez le talent idéal pour vos projets ou laissez notre IA vous recommander les meilleurs profils</p>
      </div>

      {/* BARRE DE RECHERCHE PRINCIPALE EN HAUT */}
      <Card className="border-[#3B82F6] shadow-md">
        <CardHeader className="bg-gradient-to-r from-[#1E3A8A] to-[#3B82F6] text-white rounded-t-lg">
          <CardTitle className="text-lg flex items-center gap-2 text-white">
            <Search className="w-5 h-5" />
            Recherche rapide
          </CardTitle>
          <CardDescription className="text-blue-100">
            Entrez un mot-clé (nom, titre, bio, compétence) pour trouver un freelance
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="flex gap-2">
            <Input
              placeholder="🔍 Ex : développeur, designer, React, Python..."
              value={filtres.search}
              onChange={e => setFiltres({...filtres, search: e.target.value})}
              onKeyDown={e => { if (e.key === 'Enter') lancerRecherche() }}
              className="text-base h-12"
            />
            <Button onClick={lancerRecherche} disabled={loading}
              className="bg-gradient-to-r from-[#1E3A8A] to-[#3B82F6] h-12 px-6 text-base">
              {loading ? 'Recherche...' : <><Search className="w-5 h-5 mr-2" /> Rechercher</>}
            </Button>
          </div>
          {freelances.length > 0 && (
            <p className="text-sm text-muted-foreground mt-3">
              {freelances.length} freelance(s) trouvé(s)
            </p>
          )}
        </CardContent>
      </Card>

      {/* Section recommandation IA - regroupée par projet */}
      <Card className="border-[#3B82F6] bg-gradient-to-br from-blue-50 to-white">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Star className="w-5 h-5 text-yellow-500" />
            Recommandations IA par projet
          </CardTitle>
          <CardDescription>
            Notre algorithme analyse vos projets en cours et vous propose les freelances les plus pertinents, classés du meilleur au moins bon
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={lancerRecommandation} disabled={loadingReco}
            className="bg-gradient-to-r from-[#1E3A8A] to-[#3B82F6] mb-4">
            {loadingReco ? 'Analyse en cours...' : <><Star className="w-4 h-4 mr-2" /> Générer les recommandations IA</>}
          </Button>

          {projetsGroupes.length > 0 && (
            <div className="space-y-5 mt-3">
              {projetsGroupes.map((groupe: any) => (
                <Card key={groupe.projetId} className="border-l-4 border-l-[#3B82F6] overflow-hidden">
                  <CardHeader className="bg-blue-50 py-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <FolderKanban className="w-5 h-5 text-[#3B82F6]" />
                      {groupe.projetTitre}
                    </CardTitle>
                    <CardDescription className="line-clamp-1">
                      {groupe.projetDescription} — Budget : {groupe.projetBudget?.toLocaleString('fr-FR')} FCFA
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-3">
                    <p className="text-xs text-muted-foreground mb-3">
                      👥 {groupe.freelances.length} freelance(s) recommandé(s) — classés par score de correspondance
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {groupe.freelances.map((rec: any, idx: number) => (
                        <Card key={`${rec.freelance.id}-${idx}`} className={`border ${idx === 0 ? 'border-yellow-400 bg-yellow-50/30' : 'border-gray-200'}`}>
                          <CardContent className="p-3 space-y-2">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <div className="relative">
                                  <Avatar className="h-10 w-10 cursor-pointer hover:ring-2 hover:ring-[#3B82F6] transition-all"
                                    onClick={() => rec.freelance?.id && setProfileViewerId(rec.freelance.id)}>
                                    <AvatarFallback className="bg-gradient-to-br from-[#1E3A8A] to-[#3B82F6] text-white text-xs">
                                      {rec.freelance.prenom?.[0]}{rec.freelance.nom?.[0]}
                                    </AvatarFallback>
                                  </Avatar>
                                  {idx === 0 && (
                                    <span className="absolute -top-2 -right-1 text-sm" title="Meilleur match">🏆</span>
                                  )}
                                </div>
                                <div>
                                  <p className="font-semibold text-sm cursor-pointer hover:text-[#3B82F6]"
                                    onClick={() => rec.freelance?.id && setProfileViewerId(rec.freelance.id)}>
                                    {rec.freelance.prenom} {rec.freelance.nom}
                                  </p>
                                  {rec.freelance.profilFreelance?.titreProfessionnel && (
                                    <p className="text-xs text-muted-foreground">{rec.freelance.profilFreelance.titreProfessionnel}</p>
                                  )}
                                </div>
                              </div>
                              <Badge className={
                                rec.scoreCorrespondance >= 80 ? 'bg-green-100 text-green-700' :
                                rec.scoreCorrespondance >= 50 ? 'bg-yellow-100 text-yellow-700' :
                                'bg-gray-100 text-gray-700'
                              }>
                                {rec.scoreCorrespondance}% match
                              </Badge>
                            </div>
                            <p className="text-xs text-[#3B82F6] font-medium">🎯 {rec.raison}</p>
                            <div className="flex items-center gap-3 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                                {rec.freelance.profilFreelance?.scoreFiabilite?.toFixed(1) || '0.0'}/5
                              </span>
                              <span>• {rec.freelance.profilFreelance?.nombreProjets || 0} projet(s)</span>
                              {rec.freelance.profilFreelance?.tarif && (
                                <span>• {rec.freelance.profilFreelance.tarif.toLocaleString('fr-FR')} FCFA/h</span>
                              )}
                            </div>
                            {rec.competencesMatch.length > 0 && (
                              <div className="flex flex-wrap gap-1">
                                {rec.competencesMatch.map((c: string, i: number) => (
                                  <Badge key={i} variant="secondary" className="text-xs bg-green-50 text-green-700">✓ {c}</Badge>
                                ))}
                              </div>
                            )}
                            {rec.competencesManquantes.length > 0 && (
                              <div className="flex flex-wrap gap-1">
                                {rec.competencesManquantes.map((c: string, i: number) => (
                                  <Badge key={i} variant="outline" className="text-xs text-muted-foreground">{c}</Badge>
                                ))}
                              </div>
                            )}
                            <Button size="sm" variant="outline" className="w-full border-[#3B82F6] text-[#3B82F6]"
                              onClick={() => rec.freelance?.id && setProfileViewerId(rec.freelance.id)}>
                              <Eye className="w-3 h-3 mr-1" /> Voir le profil
                            </Button>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Filtres de recherche avancée */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recherche avancée</CardTitle>
          <CardDescription>Affinez votre recherche avec des filtres détaillés</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <Label>Compétence</Label>
              <Select value={filtres.competenceId} onValueChange={v => setFiltres({...filtres, competenceId: v})}>
                <SelectTrigger><SelectValue placeholder="Toutes les compétences" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__toutes__">Toutes les compétences</SelectItem>
                  {competences.map(c => <SelectItem key={c.id} value={c.id}>{c.nom}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Trier par</Label>
              <Select value={filtres.tri} onValueChange={v => setFiltres({...filtres, tri: v})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="pertinence">Pertinence</SelectItem>
                  <SelectItem value="tarif_asc">Tarif croissant</SelectItem>
                  <SelectItem value="tarif_desc">Tarif décroissant</SelectItem>
                  <SelectItem value="experience_desc">Expérience décroissante</SelectItem>
                  <SelectItem value="note_desc">Note décroissante</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label>Tarif min (FCFA/h)</Label>
                <Input type="number" value={filtres.tarifMin || ''} onChange={e => setFiltres({...filtres, tarifMin: Number(e.target.value)})} />
              </div>
              <div>
                <Label>Tarif max (FCFA/h)</Label>
                <Input type="number" value={filtres.tarifMax || ''} onChange={e => setFiltres({...filtres, tarifMax: Number(e.target.value)})} />
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={lancerRecherche} disabled={loading} className="bg-gradient-to-r from-[#1E3A8A] to-[#3B82F6]">
              {loading ? 'Recherche...' : <><Search className="w-4 h-4 mr-2" /> Rechercher</>}
            </Button>
            <Button variant="outline" onClick={reinitialiserFiltres}>Réinitialiser</Button>
          </div>
        </CardContent>
      </Card>

      {/* Résultats de recherche */}
      <div>
        <h2 className="text-lg font-semibold text-[#1E293B] mb-3">
          {freelances.length} freelance(s) disponible(s)
        </h2>
        {freelances.length === 0 ? (
          <Card><CardContent className="p-8 text-center text-muted-foreground">
            Aucun freelance trouvé. Essayez de modifier vos critères de recherche.
          </CardContent></Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {freelances.map(f => (
              <Card key={f.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-4 space-y-2">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-12 w-12">
                        <AvatarFallback className="bg-gradient-to-br from-[#1E3A8A] to-[#3B82F6] text-white">
                          {f.prenom?.[0]}{f.nom?.[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-semibold text-[#1E293B]">{f.prenom} {f.nom}</p>
                        {f.profilFreelance?.titreProfessionnel && (
                          <p className="text-sm text-muted-foreground">{f.profilFreelance.titreProfessionnel}</p>
                        )}
                        <div className="flex items-center gap-1 mt-1">
                          <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                          <span className="text-xs font-medium">{f.profilFreelance?.scoreFiabilite?.toFixed(1) || '0.0'}/5</span>
                          <span className="text-xs text-muted-foreground ml-1">
                            • {f.profilFreelance?.nombreProjets || 0} projet(s)
                          </span>
                        </div>
                      </div>
                    </div>
                    {f.profilFreelance?.tarif && (
                      <Badge className="bg-[#3B82F6]">
                        {f.profilFreelance.tarif.toLocaleString('fr-FR')} FCFA/h
                      </Badge>
                    )}
                  </div>

                  {f.profilFreelance?.bio && (
                    <p className="text-sm text-muted-foreground line-clamp-2">{f.profilFreelance.bio}</p>
                  )}

                  {f.profilFreelance?.competences?.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {f.profilFreelance.competences.slice(0, 5).map((fc: any) => (
                        <Badge key={fc.id} variant="secondary" className="text-xs">
                          {fc.competence?.nom} ({fc.niveau})
                        </Badge>
                      ))}
                      {f.profilFreelance.competences.length > 5 && (
                        <Badge variant="outline" className="text-xs">
                          +{f.profilFreelance.competences.length - 5}
                        </Badge>
                      )}
                    </div>
                  )}

                  <div className="flex gap-4 text-xs text-muted-foreground pt-1">
                    {f.profilFreelance?.anneesExperience != null && (
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {f.profilFreelance.anneesExperience} an(s) d'expérience
                      </span>
                    )}
                    {f.pays && (
                      <span>🌍 {f.pays}</span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    <Button size="sm" variant="outline" className="border-[#3B82F6] text-[#3B82F6]"
                      onClick={() => f.id && setProfileViewerId(f.id)}>
                      <Eye className="w-3 h-3 mr-1" /> Voir le profil
                    </Button>
                    <FairePropositionButton freelance={f} clientId={user?.id} />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Le profil détaillé d'un freelance s'ouvre via le ProfileViewer global (clic sur avatar) */}
    </div>
  )
}

// ============================================================
// Bouton "Faire une proposition" IA (freelance vers client)
// ============================================================
function FairePropositionButton({ freelance, clientId }: { freelance: any; clientId?: string }) {
  const [open, setOpen] = useState(false)
  const [projets, setProjets] = useState<any[]>([])
  const [form, setForm] = useState({
    projetId: '',
    montantPropose: 0,
    delaiPropose: '',
    lettreMotivation: ''
  })

  useEffect(() => {
    if (!open || !clientId) return
    // Charger les projets publiés/en recrutement du client
    fetch(`/api/projets?clientId=${clientId}`)
      .then(r => r.json())
      .then(d => setProjets((Array.isArray(d) ? d : []).filter((p: any) => ['publie', 'en_recrutement'].includes(p.statut))))
      .catch(() => {})
  }, [open, clientId])

  const envoyer = async () => {
    if (!form.projetId) { toast.error('Sélectionnez un projet'); return }
    if (!form.montantPropose || form.montantPropose <= 0) { toast.error('Montant invalide'); return }
    if (!form.delaiPropose) { toast.error('Délai requis'); return }

    const res = await fetch('/api/propositions-ia', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        projetId: form.projetId,
        freelanceId: freelance.id,
        montantPropose: form.montantPropose,
        delaiPropose: form.delaiPropose,
        lettreMotivation: form.lettreMotivation,
        source: 'recherche_freelance'
      })
    })
    const data = await res.json()
    if (data.erreur) { toast.error(data.erreur); return }
    toast.success('Proposition envoyée ! Le client a été notifié.')
    setOpen(false)
    setForm({ projetId: '', montantPropose: 0, delaiPropose: '', lettreMotivation: '' })
  }

  return (
    <>
      <Button size="sm" className="bg-gradient-to-r from-[#1E3A8A] to-[#3B82F6]"
        onClick={() => setOpen(true)}>
        <Handshake className="w-3 h-3 mr-1" /> Faire une proposition
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="w-[95vw] sm:w-[90vw] max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Handshake className="w-5 h-5 text-[#3B82F6]" />
              Faire une proposition à {freelance.prenom} {freelance.nom}
            </DialogTitle>
            <DialogDescription>
              Le freelance recevra votre proposition et pourra la négocier, l'accepter ou la refuser.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Projet concerné *</Label>
              <Select value={form.projetId} onValueChange={v => setForm({...form, projetId: v})}>
                <SelectTrigger><SelectValue placeholder="Sélectionnez un projet publié" /></SelectTrigger>
                <SelectContent>
                  {projets.length === 0 ? (
                    <SelectItem value="__none__" disabled>Aucun projet publié</SelectItem>
                  ) : projets.map(p => (
                    <SelectItem key={p.id} value={p.id}>{p.titre} ({p.budgetEstime?.toLocaleString('fr-FR')} FCFA)</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Montant proposé (FCFA) *</Label>
                <Input type="number" value={form.montantPropose || ''} onChange={e => setForm({...form, montantPropose: Number(e.target.value)})} />
              </div>
              <div>
                <Label>Délai proposé *</Label>
                <Input type="date" value={form.delaiPropose} onChange={e => setForm({...form, delaiPropose: e.target.value})} />
              </div>
            </div>
            <div>
              <Label>Lettre de motivation (optionnel)</Label>
              <Textarea rows={3} value={form.lettreMotivation} onChange={e => setForm({...form, lettreMotivation: e.target.value})}
                placeholder="Présentez brièvement votre offre..." />
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded p-3 text-xs text-blue-800">
              ℹ️ Le client verra votre proposition avec 3 actions : <strong>Négocier</strong> (saisir son budget),
              <strong> Valider</strong> (lance le workflow précontrat + paiement) ou <strong>Refuser</strong> (avec motif).
            </div>
            <Button onClick={envoyer} className="w-full bg-gradient-to-r from-[#1E3A8A] to-[#3B82F6]">
              <Send className="w-4 h-4 mr-2" /> Envoyer la proposition
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

// ============================================================
// Page Projets disponibles (Freelance)
// ============================================================
function FreelanceProjetsDispo() {
  const { user } = useAppStore()
  const [projets, setProjets] = useState<any[]>([])
  const [candidaterProjet, setCandidaterProjet] = useState<any | null>(null)
  const [form, setForm] = useState({ montantPropose: 0, delaiPropose: '' })

  useEffect(() => {
    fetch(`/api/projets?statut=publie`).then(r => r.json()).then(d => setProjets(Array.isArray(d) ? d : []))
  }, [])

  const ouvrirCandidature = (projet: any) => {
    setCandidaterProjet(projet)
    // Pré-remplir avec les valeurs du projet pour faciliter la modification
    setForm({
      montantPropose: projet.budgetEstime || 0,
      delaiPropose: projet.delaiLivraison ? new Date(projet.delaiLivraison).toISOString().split('T')[0] : '',
    })
  }

  const handleCandidater = async () => {
    if (!candidaterProjet) return
    if (!form.montantPropose || form.montantPropose <= 0) {
      toast.error('Le montant proposé doit être supérieur à 0')
      return
    }
    if (!form.delaiPropose) {
      toast.error('Veuillez renseigner un délai')
      return
    }
    const res = await fetch('/api/propositions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        projetId: candidaterProjet.id,
        freelanceId: user?.id,
        montantPropose: form.montantPropose,
        delaiPropose: form.delaiPropose,
      })
    })
    const data = await res.json()
    if (data.erreur) { toast.error(data.erreur); return }
    toast.success('Candidature envoyée !')
    setCandidaterProjet(null)
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-[#1E293B]">Projets disponibles</h1>
      <div className="grid gap-4">
        {projets.length === 0 ? (
          <Card><CardContent className="p-8 text-center text-muted-foreground">Aucun projet disponible pour le moment</CardContent></Card>
        ) : projets.map(p => (
          <Card key={p.id}>
            <CardContent className="p-4 space-y-2">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold text-[#1E293B]">{p.titre}</h3>
                  <p className="text-sm text-muted-foreground">{p.description}</p>
                  <div className="flex gap-4 text-xs text-muted-foreground pt-2">
                    <span className="flex items-center gap-1"><DollarSign className="w-3 h-3" />{p.budgetEstime?.toLocaleString('fr-FR')} FCFA</span>
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{new Date(p.delaiLivraison).toLocaleDateString('fr-FR')}</span>
                  </div>
                  {p.competences?.length > 0 && (
                    <div className="flex gap-1 pt-2">{p.competences.map((c: any) => (
                      <Badge key={c.id} variant="secondary" className="text-xs">{c.competence?.nom}</Badge>
                    ))}</div>
                  )}
                </div>
                <Button size="sm" className="bg-[#3B82F6]" onClick={() => ouvrirCandidature(p)}>
                  Candidater
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Dialogue de candidature simplifié - uniquement budget et délai */}
      <Dialog open={!!candidaterProjet} onOpenChange={() => setCandidaterProjet(null)}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Candidater au projet</DialogTitle>
            <DialogDescription>
              {candidaterProjet?.titre && (
                <>Vous pouvez ajuster le budget et le délai par rapport à ceux proposés par le client.</>
              )}
            </DialogDescription>
          </DialogHeader>
          {candidaterProjet && (
            <div className="space-y-4">
              {/* Récapitulatif des valeurs du client */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 space-y-1">
                <p className="text-xs font-semibold text-[#1E3A8A] uppercase tracking-wide">Propositions du client</p>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Budget :</span>
                  <span className="font-semibold text-[#1E293B]">{candidaterProjet.budgetEstime?.toLocaleString('fr-FR')} FCFA</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Délai :</span>
                  <span className="font-semibold text-[#1E293B]">
                    {new Date(candidaterProjet.delaiLivraison).toLocaleDateString('fr-FR')}
                  </span>
                </div>
              </div>

              <div>
                <Label>Votre budget proposé (FCFA) *</Label>
                <Input type="number" value={form.montantPropose || ''} onChange={e => setForm({...form, montantPropose: Number(e.target.value)})} />
                <p className="text-xs text-muted-foreground mt-1">Modifiez si vous souhaitez négocier le budget</p>
              </div>
              <div>
                <Label>Votre délai proposé *</Label>
                <Input type="date" value={form.delaiPropose} onChange={e => setForm({...form, delaiPropose: e.target.value})} />
                <p className="text-xs text-muted-foreground mt-1">Modifiez si vous souhaitez proposer un autre délai</p>
              </div>
              <div className="flex gap-2 pt-2">
                <Button variant="outline" className="flex-1" onClick={() => setCandidaterProjet(null)}>Annuler</Button>
                <Button className="flex-1 bg-[#3B82F6]" onClick={handleCandidater}>Envoyer ma candidature</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ============================================================
// Page Candidatures (Client - voir les candidatures reçues)
// ============================================================
function ClientCandidatures() {
  const { user, setProfileViewerId } = useAppStore()
  const [propositions, setPropositions] = useState<any[]>([])
  const [projets, setProjets] = useState<any[]>([])
  const [payerProposition, setPayerProposition] = useState<any | null>(null)
  const [paying, setPaying] = useState(false)
  const [uploadingJustificatif, setUploadingJustificatif] = useState(false)
  const [formPrecontrat, setFormPrecontrat] = useState({
    objectifs: '', budgetFinal: 0, dateDebut: '', dateFin: '', clauses: '', justificatifUrl: '', justificatifNom: ''
  })

  useEffect(() => {
    if (!user) return
    fetch(`/api/projets?clientId=${user.id}`).then(r => r.json()).then(d => {
      const p = Array.isArray(d) ? d : []
      setProjets(p)
      Promise.all(p.map((pr: any) => fetch(`/api/propositions?projetId=${pr.id}`).then(r => r.json())))
        .then(results => {
          const all = results.flat()
          setPropositions(all)
        })
    })
  }, [user])

  const accepter = async (id: string) => {
    const res = await fetch('/api/propositions', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, statut: 'acceptee' })
    })
    const data = await res.json()
    if (data.erreur) { toast.error(data.erreur); return }
    toast.success('Candidature acceptée ! Vous pouvez maintenant payer et générer le précontrat.')
    setPropositions(prev => prev.map(p => p.id === id ? { ...p, statut: 'acceptee' } : p))
  }

  const refuser = async (id: string) => {
    await fetch('/api/propositions', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, statut: 'refusee' })
    })
    toast.success('Candidature refusée')
    setPropositions(prev => prev.map(p => p.id === id ? { ...p, statut: 'refusee' } : p))
  }

  // Ouvrir le popup de paiement / génération de précontrat
  const ouvrirPaiement = (proposition: any) => {
    setPayerProposition(proposition)
    // Pré-remplir avec les données de la proposition
    const today = new Date()
    const delaiDefault = new Date(proposition.delaiPropose || proposition.projet?.delaiLivraison || today)
    setFormPrecontrat({
      objectifs: `Réalisation du projet "${proposition.projet?.titre || ''}" selon les conditions acceptées par les deux parties.`,
      budgetFinal: proposition.montantPropose || 0,
      dateDebut: today.toISOString().split('T')[0],
      dateFin: delaiDefault.toISOString().split('T')[0],
      clauses: '',
      justificatifUrl: '',
      justificatifNom: ''
    })
  }

  // Upload du justificatif de paiement
  const handleJustificatifUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingJustificatif(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('type', 'justificatif')
      const res = await fetch('/api/upload', { method: 'POST', body: fd })
      const data = await res.json()
      if (data.erreur) {
        toast.error(data.erreur)
      } else {
        setFormPrecontrat(prev => ({ ...prev, justificatifUrl: data.url, justificatifNom: file.name }))
        toast.success('Justificatif ajouté : ' + file.name)
      }
    } catch {
      toast.error('Erreur lors de l\'upload du justificatif')
    }
    setUploadingJustificatif(false)
  }

  // Soumettre le paiement + génération du précontrat
  const soumettrePaiement = async () => {
    if (!payerProposition) return
    if (!formPrecontrat.objectifs || !formPrecontrat.budgetFinal || !formPrecontrat.dateDebut || !formPrecontrat.dateFin) {
      toast.error('Veuillez remplir tous les champs obligatoires')
      return
    }
    if (!formPrecontrat.justificatifUrl) {
      toast.error('Veuillez uploader un justificatif de paiement')
      return
    }
    setPaying(true)
    try {
      const res = await fetch('/api/contrats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'payer_et_generer_precontrat',
          propositionId: payerProposition.id,
          clientId: user?.id,
          ...formPrecontrat,
        })
      })
      const data = await res.json()
      if (data.erreur) {
        toast.error(data.erreur)
      } else {
        toast.success('Paiement soumis ! Le précontrat sera généré dès validation par l\'administrateur.')
        setPayerProposition(null)
        // Recharger les propositions pour mettre à jour l'affichage
        if (user) {
          fetch(`/api/projets?clientId=${user.id}`).then(r => r.json()).then(d => {
            const p = Array.isArray(d) ? d : []
            setProjets(p)
            Promise.all(p.map((pr: any) => fetch(`/api/propositions?projetId=${pr.id}`).then(r => r.json())))
              .then(results => setPropositions(results.flat()))
          })
        }
      }
    } catch {
      toast.error('Erreur lors de la soumission du paiement')
    }
    setPaying(false)
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-[#1E293B]">Candidatures reçues</h1>
      <div className="bg-blue-50 border border-blue-200 rounded p-3 text-xs text-blue-800">
        <p className="font-semibold">ℹ️ Comment ça marche</p>
        <p className="mt-1">
          1️⃣ Acceptez la candidature du freelance → 2️⃣ Cliquez sur "Payer et générer le précontrat" →
          3️⃣ L'administrateur valide le paiement → 4️⃣ Le précontrat devient visible par le freelance →
          5️⃣ Le freelance valide → 6️⃣ Le contrat est téléchargeable.
        </p>
      </div>
      {propositions.length === 0 ? (
        <Card><CardContent className="p-8 text-center text-muted-foreground">Aucune candidature pour le moment</CardContent></Card>
      ) : propositions.map(p => (
        <Card key={p.id}>
          <CardContent className="p-4">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Avatar className="h-8 w-8 cursor-pointer hover:ring-2 hover:ring-[#3B82F6] transition-all"
                    onClick={() => p.freelance?.id && setProfileViewerId(p.freelance.id)}>
                    <AvatarFallback className="bg-[#3B82F6] text-white text-xs">
                      {p.freelance?.prenom?.[0]}{p.freelance?.nom?.[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="cursor-pointer hover:text-[#3B82F6] transition-colors"
                    onClick={() => p.freelance?.id && setProfileViewerId(p.freelance.id)}>
                    <span className="font-medium">{p.freelance?.prenom} {p.freelance?.nom}</span>
                    {p.freelance?.profilFreelance && (
                      <p className="text-xs text-muted-foreground">{p.freelance.profilFreelance.titreProfessionnel}</p>
                    )}
                  </div>
                  <Badge variant={p.statut === 'acceptee' ? 'default' : p.statut === 'refusee' ? 'destructive' : 'secondary'}>
                    {p.statut === 'acceptee' ? 'Acceptée' : p.statut === 'refusee' ? 'Refusée' : 'En attente'}
                  </Badge>
                </div>
                <div className="flex gap-4 text-xs text-muted-foreground mt-1">
                  <span>Montant : {p.montantPropose?.toLocaleString('fr-FR')} FCFA</span>
                  <span>Délai : {new Date(p.delaiPropose).toLocaleDateString('fr-FR')}</span>
                </div>
                <p className="text-xs text-[#3B82F6] mt-1">📁 {p.projet?.titre}</p>
              </div>
              <div className="flex flex-col gap-2 items-end">
                {p.statut === 'en_attente' && (
                  <div className="flex gap-2">
                    <Button size="sm" className="bg-green-600" onClick={() => accepter(p.id)}>
                      <CheckCircle className="w-4 h-4 mr-1" /> Accepter
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => refuser(p.id)}>
                      <XCircle className="w-4 h-4 mr-1" /> Refuser
                    </Button>
                  </div>
                )}
                {p.statut === 'acceptee' && (
                  <Button size="sm" className="bg-gradient-to-r from-[#1E3A8A] to-[#3B82F6]" onClick={() => ouvrirPaiement(p)}>
                    <DollarSign className="w-4 h-4 mr-1" /> Payer et générer le précontrat
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Dialogue de paiement et génération de précontrat */}
      <Dialog open={!!payerProposition} onOpenChange={() => setPayerProposition(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl">💳 Payer et générer le précontrat</DialogTitle>
            <DialogDescription>
              Le paiement sera mis en séquestre en attente de validation par l'administrateur.
              Une fois validé, le précontrat sera visible par le freelance qui pourra le valider ou le refuser.
            </DialogDescription>
          </DialogHeader>
          {payerProposition && (
            <div className="space-y-4">
              {/* Récapitulatif */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
                <p className="text-sm font-semibold text-[#1E3A8A] uppercase tracking-wide">Récapitulatif de la candidature acceptée</p>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-muted-foreground">Freelance :</span>{' '}
                    <span className="font-semibold">{payerProposition.freelance?.prenom} {payerProposition.freelance?.nom}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Projet :</span>{' '}
                    <span className="font-semibold">{payerProposition.projet?.titre}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Montant proposé :</span>{' '}
                    <span className="font-semibold">{payerProposition.montantPropose?.toLocaleString('fr-FR')} FCFA</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Délai proposé :</span>{' '}
                    <span className="font-semibold">{new Date(payerProposition.delaiPropose).toLocaleDateString('fr-FR')}</span>
                  </div>
                </div>
              </div>

              <div>
                <Label>Objectifs du contrat *</Label>
                <Textarea rows={3}
                  value={formPrecontrat.objectifs}
                  onChange={e => setFormPrecontrat({...formPrecontrat, objectifs: e.target.value})}
                  placeholder="Décrivez les objectifs et livrables attendus..."
                />
              </div>
              <div>
                <Label>Budget final (FCFA) *</Label>
                <Input type="number"
                  value={formPrecontrat.budgetFinal || ''}
                  onChange={e => setFormPrecontrat({...formPrecontrat, budgetFinal: Number(e.target.value)})}
                />
                <p className="text-xs text-muted-foreground mt-1">Budget du projet (montant pour le freelance)</p>
              </div>

              {/* Calcul commission 5% */}
              {formPrecontrat.budgetFinal > 0 && (
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-[#3B82F6] rounded-lg p-4">
                  <p className="text-sm font-semibold text-[#1E3A8A] mb-3 flex items-center gap-2">
                    <DollarSign className="w-4 h-4" />
                    Détails du paiement
                  </p>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Budget du projet :</span>
                      <span className="font-semibold">{formPrecontrat.budgetFinal.toLocaleString('fr-FR')} FCFA</span>
                    </div>
                    <div className="flex justify-between text-amber-700">
                      <span>Commission plateforme (5%) :</span>
                      <span className="font-semibold">+ {(formPrecontrat.budgetFinal * 0.05).toLocaleString('fr-FR')} FCFA</span>
                    </div>
                    <Separator className="my-2" />
                    <div className="flex justify-between text-lg font-bold text-[#1E3A8A]">
                      <span>Total à payer :</span>
                      <span>{(formPrecontrat.budgetFinal * 1.05).toLocaleString('fr-FR')} FCFA</span>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-3 flex items-center gap-1">
                    <Shield className="w-3 h-3" />
                    Ce montant sera débité de votre solde et mis en séquestre
                  </p>
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Date de début *</Label>
                  <Input type="date"
                    value={formPrecontrat.dateDebut}
                    onChange={e => setFormPrecontrat({...formPrecontrat, dateDebut: e.target.value})}
                  />
                </div>
                <div>
                  <Label>Date de fin *</Label>
                  <Input type="date"
                    value={formPrecontrat.dateFin}
                    onChange={e => setFormPrecontrat({...formPrecontrat, dateFin: e.target.value})}
                  />
                </div>
              </div>
              <div>
                <Label>Clauses particulières (optionnel)</Label>
                <Textarea rows={2}
                  value={formPrecontrat.clauses}
                  onChange={e => setFormPrecontrat({...formPrecontrat, clauses: e.target.value})}
                  placeholder="Conditions spécifiques, modalités de résiliation, etc."
                />
              </div>

              {/* Upload justificatif de paiement */}
              <div>
                <Label className="flex items-center gap-2">
                  Justificatif de paiement * 
                  <FileUp className="w-4 h-4" />
                </Label>
                <div className="mt-2">
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={handleJustificatifUpload}
                    disabled={uploadingJustificatif}
                    className="hidden"
                    id="justificatif-upload"
                  />
                  <label htmlFor="justificatif-upload">
                    <Button type="button" variant="outline" className="w-full" disabled={uploadingJustificatif} asChild>
                      <span className="cursor-pointer">
                        {uploadingJustificatif ? (
                          'Upload en cours...'
                        ) : formPrecontrat.justificatifNom ? (
                          <><CheckCircle className="w-4 h-4 mr-2 text-green-600" /> {formPrecontrat.justificatifNom}</>
                        ) : (
                          <><FileUp className="w-4 h-4 mr-2" /> Cliquez pour uploader (image ou PDF)</>
                        )}
                      </span>
                    </Button>
                  </label>
                  <p className="text-xs text-muted-foreground mt-1">
                    Upload une capture d'écran ou un reçu de votre paiement (Mobile Money, virement, etc.)
                  </p>
                </div>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-800 flex items-start gap-2">
                <Shield className="w-4 h-4 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">⚠️ Important</p>
                  <p className="mt-1">
                    Le montant total de {formPrecontrat.budgetFinal > 0 ? (formPrecontrat.budgetFinal * 1.05).toLocaleString('fr-FR') : '0'} FCFA 
                    (budget {formPrecontrat.budgetFinal.toLocaleString('fr-FR')} FCFA + commission 5%) sera mis en séquestre.
                    L'administrateur validera le paiement après vérification du justificatif.
                  </p>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <Button variant="outline" className="flex-1" onClick={() => setPayerProposition(null)}>Annuler</Button>
                <Button className="flex-1 bg-gradient-to-r from-[#1E3A8A] to-[#3B82F6]"
                  onClick={soumettrePaiement} disabled={paying || !formPrecontrat.justificatifUrl}>
                  {paying ? 'Traitement...' : <><DollarSign className="w-4 h-4 mr-2" /> Soumettre le paiement</>}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ============================================================
// Mes Candidatures (Freelance)
// ============================================================
function FreelanceCandidatures() {
  const { user, setCurrentView } = useAppStore()
  const [propositions, setPropositions] = useState<any[]>([])

  useEffect(() => {
    if (!user) return
    fetch(`/api/propositions?freelanceId=${user.id}`).then(r => r.json()).then(d => setPropositions(Array.isArray(d) ? d : []))
  }, [user])

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-[#1E293B]">Mes Candidatures</h1>
      <div className="bg-blue-50 border border-blue-200 rounded p-3 text-xs text-blue-800">
        <p className="font-semibold">ℹ️ Informations</p>
        <p className="mt-1">
          Une fois votre candidature acceptée par le client, ce dernier paiera et générera un précontrat.
          Vous verrez alors le précontrat dans la section « Contrats » pour le valider ou le refuser.
          Une fois validé, le contrat sera téléchargeable.
        </p>
      </div>
      {propositions.length === 0 ? (
        <Card><CardContent className="p-8 text-center text-muted-foreground">Vous n'avez pas encore postulé</CardContent></Card>
      ) : propositions.map(p => (
        <Card key={p.id}>
          <CardContent className="p-4 flex justify-between items-start">
            <div className="space-y-1">
              <h3 className="font-semibold text-[#1E293B]">{p.projet?.titre}</h3>
              <div className="flex gap-4 text-sm text-muted-foreground">
                <span>💰 Montant : {p.montantPropose?.toLocaleString('fr-FR')} FCFA</span>
                <span>📅 Délai : {new Date(p.delaiPropose).toLocaleDateString('fr-FR')}</span>
              </div>
              {p.statut === 'acceptee' && (
                <p className="text-xs text-[#3B82F6] mt-2">
                  ✓ Candidature acceptée ! En attente du paiement et du précontrat par le client.
                </p>
              )}
            </div>
            <div className="flex flex-col items-end gap-2">
              <Badge variant={p.statut === 'acceptee' ? 'default' : p.statut === 'refusee' ? 'destructive' : 'secondary'}>
                {p.statut === 'acceptee' ? 'Acceptée' : p.statut === 'refusee' ? 'Refusée' : 'En attente'}
              </Badge>
              {p.statut === 'acceptee' && (
                <Button size="sm" variant="outline" onClick={() => setCurrentView('contrats')}>
                  <FileCheck className="w-4 h-4 mr-1" /> Voir les contrats
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

// ============================================================
// Composant détail d'un contrat signé avec gestion feuille de route
// ============================================================
function ContratDetailCard({ contrat, user, telechargerContrat, loadContrats }: any) {
  const [showFeuilleRoute, setShowFeuilleRoute] = useState(false)
  const [feuilleRoute, setFeuilleRoute] = useState<any>(null)
  const [formFeuille, setFormFeuille] = useState({
    titre: '',
    description: '',
    taches: [{ titre: '', description: '', dureeJours: 1 }]
  })
  const [loading, setLoading] = useState(false)

  // Charger la feuille de route existante
  useEffect(() => {
    if (!contrat?.id) return
    fetch(`/api/feuille-route?contratId=${contrat.id}`)
      .then(r => r.ok ? r.json() : null)
      .then(d => d?.feuilleRoute && setFeuilleRoute(d.feuilleRoute))
      .catch(() => {})
  }, [contrat?.id])

  const ajouterTache = () => {
    setFormFeuille({
      ...formFeuille,
      taches: [...formFeuille.taches, { titre: '', description: '', dureeJours: 1 }]
    })
  }

  const supprimerTache = (index: number) => {
    const nouvelles = formFeuille.taches.filter((_, i) => i !== index)
    setFormFeuille({ ...formFeuille, taches: nouvelles })
  }

  const modifierTache = (index: number, champ: string, valeur: any) => {
    const nouvelles = [...formFeuille.taches]
    nouvelles[index] = { ...nouvelles[index], [champ]: valeur }
    setFormFeuille({ ...formFeuille, taches: nouvelles })
  }

  const envoyerFeuilleRoute = async () => {
    if (!formFeuille.titre.trim()) {
      toast.error('Le titre est obligatoire')
      return
    }
    if (formFeuille.taches.length === 0 || !formFeuille.taches[0].titre.trim()) {
      toast.error('Au moins une tâche est obligatoire')
      return
    }

    setLoading(true)
    try {
      const res = await fetch(`/api/feuille-route?contratId=${contrat.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formFeuille)
      })
      const data = await res.json()
      if (data.erreur) {
        toast.error(data.erreur)
      } else {
        toast.success('Feuille de route envoyée ! Le client doit maintenant la valider.')
        setFeuilleRoute(data.feuilleRoute)
        setShowFeuilleRoute(false)
        loadContrats()
      }
    } catch {
      toast.error('Erreur lors de l\'envoi')
    }
    setLoading(false)
  }

  const validerFeuilleRoute = async () => {
    if (!feuilleRoute?.id) return
    setLoading(true)
    try {
      const res = await fetch(`/api/feuille-route/${feuilleRoute.id}/valider`, {
        method: 'POST'
      })
      const data = await res.json()
      if (data.erreur) {
        toast.error(data.erreur)
      } else {
        toast.success('Feuille de route validée ! Les jalons ont été créés automatiquement.')
        setFeuilleRoute(data.feuilleRoute)
        loadContrats()
      }
    } catch {
      toast.error('Erreur lors de la validation')
    }
    setLoading(false)
  }

  const refuserFeuilleRoute = async () => {
    const motif = prompt('Motif du refus (obligatoire) :')
    if (!motif?.trim()) return

    setLoading(true)
    try {
      const res = await fetch(`/api/feuille-route/${feuilleRoute.id}/refuser`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ motifRefus: motif })
      })
      const data = await res.json()
      if (data.erreur) {
        toast.error(data.erreur)
      } else {
        toast.success('Feuille de route refusée. Le freelance a été notifié.')
        setFeuilleRoute(data.feuilleRoute)
        loadContrats()
      }
    } catch {
      toast.error('Erreur lors du refus')
    }
    setLoading(false)
  }

  const c = contrat

  return (
    <Card className="mb-3 border-l-4 border-l-green-600">
      <CardContent className="p-4 space-y-3">
        <div className="flex justify-between items-start">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <FileCheck className="w-5 h-5 text-green-600" />
              <h3 className="font-semibold text-[#1E293B]">{c.numeroContrat}</h3>
              <Badge variant={c.statut === 'actif' ? 'default' : c.statut === 'termine' ? 'secondary' : 'destructive'}>
                {c.statut === 'actif' ? 'Actif' : c.statut === 'termine' ? 'Terminé' : 'Résilié'}
              </Badge>
              <Badge className="bg-green-100 text-green-700">✓ Signé</Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-1">{c.projet?.titre}</p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-xs text-muted-foreground mt-2">
              <span>💰 Montant : <strong className="text-[#1E293B]">{c.montantTotal?.toLocaleString('fr-FR')} FCFA</strong></span>
              <span>📅 Signé le : <strong className="text-[#1E293B]">{new Date(c.createdAt).toLocaleDateString('fr-FR')}</strong></span>
              <span>👥 Freelance : <strong className="text-[#1E293B]">{c.freelance?.prenom} {c.freelance?.nom}</strong></span>
            </div>
          </div>
        </div>

        {/* État feuille de route */}
        {feuilleRoute && (
          <div className={`border rounded p-3 ${
            feuilleRoute.statut === 'validee' ? 'bg-green-50 border-green-200' :
            feuilleRoute.statut === 'refusee' ? 'bg-red-50 border-red-200' :
            'bg-yellow-50 border-yellow-200'
          }`}>
            <p className="text-sm font-semibold flex items-center gap-2">
              {feuilleRoute.statut === 'validee' ? <CheckCircle className="w-4 h-4 text-green-600" /> :
               feuilleRoute.statut === 'refusee' ? <XCircle className="w-4 h-4 text-red-600" /> :
               <Clock className="w-4 h-4 text-yellow-600" />}
              Feuille de route : {feuilleRoute.titre}
            </p>
            <Badge className={
              feuilleRoute.statut === 'validee' ? 'bg-green-100 text-green-700' :
              feuilleRoute.statut === 'refusee' ? 'bg-red-100 text-red-700' :
              'bg-yellow-100 text-yellow-700'
            }>
              {feuilleRoute.statut === 'validee' ? 'Validée ✓' :
               feuilleRoute.statut === 'refusee' ? 'Refusée' :
               'En attente de validation'}
            </Badge>
            {feuilleRoute.statut === 'en_attente' && user?.role === 'client' && (
              <div className="mt-3 flex gap-2">
                <Button size="sm" className="bg-green-600" onClick={validerFeuilleRoute} disabled={loading}>
                  <CheckCircle className="w-4 h-4 mr-1" /> Valider
                </Button>
                <Button size="sm" variant="destructive" onClick={refuserFeuilleRoute} disabled={loading}>
                  <XCircle className="w-4 h-4 mr-1" /> Refuser
                </Button>
              </div>
            )}
            {feuilleRoute.statut === 'refusee' && feuilleRoute.motifRefus && (
              <p className="text-xs text-red-600 mt-2">Motif : {feuilleRoute.motifRefus}</p>
            )}
          </div>
        )}

        <div className="border-t pt-3 flex flex-wrap gap-2">
          <Button size="sm" className="bg-gradient-to-r from-[#1E3A8A] to-[#3B82F6]" onClick={() => telechargerContrat(c)}>
            <FileCheck className="w-4 h-4 mr-1" /> 📥 Télécharger le contrat
          </Button>
          <Button size="sm" variant="outline" onClick={() => window.open(`/api/contrats/pdf?id=${c.precontrat?.id || c.id}`, '_blank')}>
            <Eye className="w-4 h-4 mr-1" /> Voir en ligne
          </Button>

          {/* Bouton envoyer feuille de route pour le freelance */}
          {user?.role === 'freelance' && !feuilleRoute && c.statut === 'actif' && (
            <Button size="sm" variant="outline" className="border-[#3B82F6] text-[#3B82F6]" onClick={() => setShowFeuilleRoute(true)}>
              <FileText className="w-4 h-4 mr-1" /> Envoyer la feuille de route
            </Button>
          )}
        </div>
      </CardContent>

      {/* Dialog feuille de route */}
      <Dialog open={showFeuilleRoute} onOpenChange={setShowFeuilleRoute}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Envoyer la feuille de route</DialogTitle>
            <DialogDescription>
              La feuille de route doit être validée par le client avant de pouvoir créer les jalons.
              Décrivez les différentes tâches avec leurs durées estimées.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Titre de la feuille de route *</Label>
              <Input
                placeholder="Ex : Plan de développement du projet"
                value={formFeuille.titre}
                onChange={e => setFormFeuille({ ...formFeuille, titre: e.target.value })}
              />
            </div>
            <div>
              <Label>Description générale</Label>
              <Textarea
                placeholder="Description générale de l'approche et de la méthodologie..."
                value={formFeuille.description}
                onChange={e => setFormFeuille({ ...formFeuille, description: e.target.value })}
                rows={3}
              />
            </div>

            <div className="border-t pt-3">
              <div className="flex items-center justify-between mb-2">
                <Label className="text-base">Tâches du projet *</Label>
                <Button size="sm" variant="outline" onClick={ajouterTache}>
                  <Plus className="w-4 h-4 mr-1" /> Ajouter une tâche
                </Button>
              </div>
              <div className="space-y-3">
                {formFeuille.taches.map((tache, index) => (
                  <Card key={index} className="p-3">
                    <div className="flex items-start justify-between mb-2">
                      <Badge variant="secondary">Tâche {index + 1}</Badge>
                      {formFeuille.taches.length > 1 && (
                        <Button size="sm" variant="ghost" onClick={() => supprimerTache(index)}>
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </Button>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Input
                        placeholder="Titre de la tâche *"
                        value={tache.titre}
                        onChange={e => modifierTache(index, 'titre', e.target.value)}
                      />
                      <Textarea
                        placeholder="Description de la tâche (optionnel)"
                        value={tache.description}
                        onChange={e => modifierTache(index, 'description', e.target.value)}
                        rows={2}
                      />
                      <div>
                        <Label className="text-xs">Durée estimée (jours)</Label>
                        <Input
                          type="number"
                          min={1}
                          value={tache.dureeJours}
                          onChange={e => modifierTache(index, 'dureeJours', parseInt(e.target.value) || 1)}
                        />
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t">
              <Button variant="outline" onClick={() => setShowFeuilleRoute(false)}>Annuler</Button>
              <Button className="bg-gradient-to-r from-[#1E3A8A] to-[#3B82F6]" onClick={envoyerFeuilleRoute} disabled={loading}>
                {loading ? 'Envoi...' : <><Send className="w-4 h-4 mr-1" /> Envoyer au client</>}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  )
}

// ============================================================
// Page Contrats
// ============================================================
function ContratsPage() {
  const { user, setProfileViewerId } = useAppStore()
  const [contrats, setContrats] = useState<any[]>([])
  const [showPrecontrat, setShowPrecontrat] = useState(false)
  const [selectedProposition, setSelectedProposition] = useState<any>(null)
  const [form, setForm] = useState({ objectifs: '', budgetFinal: 0, dateDebut: '', dateFin: '', clauses: '', jalonsData: [] as any[] })

  const loadContrats = useCallback(() => {
    if (!user) return
    const params = user.role === 'client' ? `clientId=${user.id}` : `freelanceId=${user.id}`
    fetch(`/api/contrats?${params}&includePrecontrats=true`).then(r => r.json()).then(d => setContrats(Array.isArray(d) ? d : []))
  }, [user])

  useEffect(() => {
    loadContrats()
  }, [loadContrats])

  const genererPrecontrat = async () => {
    const res = await fetch('/api/contrats', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'generer_precontrat', propositionId: selectedProposition.id, ...form })
    })
    const data = await res.json()
    if (data.erreur) { toast.error(data.erreur); return }
    toast.success('Précontrat généré !')
    setShowPrecontrat(false)
  }

  const validerPrecontrat = async (precontratId: string, valide: boolean) => {
    const res = await fetch('/api/contrats', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'valider_precontrat', precontratId, freelanceId: user?.id, valide, jalonsData: [] })
    })
    const data = await res.json()
    if (data.erreur) { toast.error(data.erreur); return }
    toast.success(valide ? 'Contrat signé ! Vous pouvez le télécharger.' : 'Précontrat refusé')
    loadContrats()
  }

  const telechargerContrat = async (contrat: any) => {
    // Téléchargement direct du contrat en HTML (blob) — évite le blocage par le navigateur
    const precontratId = contrat.precontratId || contrat.precontrat?.id || contrat.id
    try {
      const res = await fetch(`/api/contrats/pdf?id=${precontratId}`)
      if (!res.ok) {
        toast.error('Impossible de générer le contrat')
        return
      }
      const html = await res.text()
      const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `contrat-${contrat.numeroContrat || precontratId}.html`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      toast.success('Contrat téléchargé. Ouvrez-le dans votre navigateur puis utilisez "Imprimer" pour le PDF.')
    } catch (e) {
      // Fallback : ouvrir dans un nouvel onglet
      const url = `/api/contrats/pdf?id=${precontratId}`
      window.open(url, '_blank')
      toast.info('Ouverture du contrat dans un nouvel onglet.')
    }
  }

  // Séparer les contrats signés et les précontrats en attente
  const contratsSignes = contrats.filter(c => !c.type || c.type !== 'precontrat')
  const precontrats = contrats.filter(c => c.type === 'precontrat')

  const statutPrecontratLabels: any = {
    en_attente_paiement: { label: 'En attente de validation paiement', color: 'bg-amber-100 text-amber-700', desc: 'L\'administrateur doit valider le paiement' },
    genere: { label: 'En attente de validation freelance', color: 'bg-blue-100 text-blue-700', desc: 'Le freelance doit valider ou refuser' },
    valide_freelance: { label: 'Validé - contrat généré', color: 'bg-green-100 text-green-700', desc: 'Contrat signé et disponible' },
    refuse_freelance: { label: 'Refusé par le freelance', color: 'bg-red-100 text-red-700', desc: 'Le freelance a refusé le précontrat' },
    expire: { label: 'Expiré', color: 'bg-gray-100 text-gray-700', desc: 'Le précontrat a expiré' },
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#1E293B]">Contrats & Précontrats</h1>
        <p className="text-sm text-muted-foreground">
          Suivez le cycle complet : précontrat (paiement) → validation freelance → contrat signé téléchargeable
        </p>
      </div>

      {/* Précontrats en cours */}
      {precontrats.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-[#1E293B] mb-3 flex items-center gap-2">
            <FileText className="w-5 h-5 text-[#3B82F6]" />
            Précontrats en cours ({precontrats.length})
          </h2>
          <div className="grid gap-3">
            {precontrats.map(pc => {
              const statutInfo = statutPrecontratLabels[pc.statut] || { label: pc.statut, color: 'bg-gray-100', desc: '' }
              return (
                <Card key={pc.id} className="border-l-4 border-l-[#3B82F6]">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex justify-between items-start">
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <FileText className="w-4 h-4 text-[#3B82F6]" />
                          <h3 className="font-semibold text-[#1E293B]">Précontrat - {pc.projet?.titre}</h3>
                          <Badge className={statutInfo.color}>{statutInfo.label}</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">{statutInfo.desc}</p>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-2 text-sm">
                          <div>
                            <span className="text-xs text-muted-foreground block">Montant</span>
                            <span className="font-semibold">{pc.budgetFinal?.toLocaleString('fr-FR')} FCFA</span>
                          </div>
                          <div>
                            <span className="text-xs text-muted-foreground block">Début</span>
                            <span className="font-semibold">{new Date(pc.dateDebut).toLocaleDateString('fr-FR')}</span>
                          </div>
                          <div>
                            <span className="text-xs text-muted-foreground block">Fin</span>
                            <span className="font-semibold">{new Date(pc.dateFin).toLocaleDateString('fr-FR')}</span>
                          </div>
                          <div>
                            <span className="text-xs text-muted-foreground block">Créé le</span>
                            <span className="font-semibold">{new Date(pc.createdAt).toLocaleDateString('fr-FR')}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-xs text-muted-foreground">
                            {user?.role === 'client' ? 'Freelance :' : 'Client :'}
                          </span>
                          <Avatar className="h-6 w-6 cursor-pointer hover:ring-2 hover:ring-[#3B82F6] transition-all"
                            onClick={() => {
                              const otherId = user?.role === 'client' ? pc.freelance?.id : pc.client?.id
                              if (otherId) setProfileViewerId(otherId)
                            }}>
                            <AvatarFallback className="bg-[#3B82F6] text-white text-xs">
                              {(user?.role === 'client' ? pc.freelance : pc.client)?.prenom?.[0]}
                              {(user?.role === 'client' ? pc.freelance : pc.client)?.nom?.[0]}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm font-medium">
                            {(user?.role === 'client' ? pc.freelance : pc.client)?.prenom}{' '}
                            {(user?.role === 'client' ? pc.freelance : pc.client)?.nom}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Actions pour le freelance : valider/refuser */}
                    {pc.statut === 'genere' && user?.role === 'freelance' && (
                      <div className="border-t pt-3 flex flex-wrap gap-2">
                        <Button size="sm" className="bg-green-600" onClick={() => validerPrecontrat(pc.id, true)}>
                          <CheckCircle className="w-4 h-4 mr-1" /> Valider et signer le contrat
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => validerPrecontrat(pc.id, false)}>
                          <XCircle className="w-4 h-4 mr-1" /> Refuser
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => window.open(`/api/contrats/pdf?id=${pc.id}`, '_blank')}>
                          <Eye className="w-4 h-4 mr-1" /> Voir le précontrat
                        </Button>
                      </div>
                    )}

                    {/* Bouton voir pour le client */}
                    {pc.statut === 'genere' && user?.role === 'client' && (
                      <div className="border-t pt-3">
                        <Button size="sm" variant="outline" onClick={() => window.open(`/api/contrats/pdf?id=${pc.id}`, '_blank')}>
                          <Eye className="w-4 h-4 mr-1" /> Voir le précontrat
                        </Button>
                        <p className="text-xs text-muted-foreground mt-2">
                          ⏳ En attente de validation par {pc.freelance?.prenom} {pc.freelance?.nom}
                        </p>
                      </div>
                    )}

                    {/* Info pour le client pendant l'attente paiement */}
                    {pc.statut === 'en_attente_paiement' && user?.role === 'client' && (
                      <div className="border-t pt-3 bg-amber-50 -mx-4 -mb-4 p-3 rounded-b-lg">
                        <p className="text-xs text-amber-800 flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          Votre paiement est en attente de validation par l'administrateur.
                          Le précontrat sera visible par le freelance dès validation.
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      )}

      {/* Contrats signés */}
      <div>
        <h2 className="text-lg font-semibold text-[#1E293B] mb-3 flex items-center gap-2">
          <FileCheck className="w-5 h-5 text-green-600" />
          Contrats signés ({contratsSignes.length})
        </h2>
        {contratsSignes.length === 0 ? (
          <Card><CardContent className="p-8 text-center text-muted-foreground">Aucun contrat signé pour le moment</CardContent></Card>
        ) : contratsSignes.map(c => (
          <ContratDetailCard key={c.id} contrat={c} user={user} telechargerContrat={telechargerContrat} loadContrats={loadContrats} />
        ))}
      </div>

      {contrats.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <FileText className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-30" />
            <p className="text-muted-foreground">Aucun contrat ni précontrat pour le moment</p>
            <p className="text-xs text-muted-foreground mt-2">
              Les précontrats apparaissent ici après qu'un client a payé pour une candidature acceptée.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

// ============================================================
// Page Jalons (vue Kanban)
// ============================================================
// Page Jalons (vue Kanban + Historique)
// ============================================================
function JalonsPage() {
  const { user } = useAppStore()
  const [contrats, setContrats] = useState<any[]>([])
  const [selectedContrat, setSelectedContrat] = useState<string | null>(null)
  const [jalons, setJalons] = useState<any[]>([])
  const [viewMode, setViewMode] = useState<'kanban' | 'historique'>('kanban')
  const [commentaireRefus, setCommentaireRefus] = useState('')

  useEffect(() => {
    if (!user) return
    const params = user.role === 'client' ? `clientId=${user.id}` : `freelanceId=${user.id}`
    fetch(`/api/contrats?${params}`).then(r => r.json()).then(d => setContrats(Array.isArray(d) ? d : []))
  }, [user])

  useEffect(() => {
    if (!selectedContrat) return
    fetch(`/api/jalons?contratId=${selectedContrat}`).then(r => r.json()).then(d => setJalons(Array.isArray(d) ? d : []))
  }, [selectedContrat])

  const updateJalon = async (id: string, action: string, extra?: any) => {
    const res = await fetch('/api/jalons', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, action, ...extra })
    })
    const data = await res.json()
    if (data.erreur) { toast.error(data.erreur); return }
    toast.success('Jalon mis à jour')
    if (selectedContrat) fetch(`/api/jalons?contratId=${selectedContrat}`).then(r => r.json()).then(d => setJalons(Array.isArray(d) ? d : []))
  }

  const colonnes = [
    { key: 'a_faire', label: 'À faire', color: 'bg-gray-50' },
    { key: 'en_cours', label: 'En cours', color: 'bg-blue-50' },
    { key: 'livrable_soumis', label: 'Livrable soumis', color: 'bg-yellow-50' },
    { key: 'valide', label: 'Validé', color: 'bg-green-50' },
    { key: 'refuse', label: 'Refusé', color: 'bg-red-50' },
    { key: 'en_litige', label: 'En litige', color: 'bg-purple-50' },
  ]

  const getStatutLabel = (statut: string) => {
    const labels: any = {
      'a_faire': 'À faire',
      'en_cours': 'En cours',
      'livrable_soumis': 'Livrable soumis',
      'valide': 'Validé',
      'refuse': 'Refusé',
      'en_litige': 'En litige'
    }
    return labels[statut] || statut
  }

  const getStatutColor = (statut: string) => {
    const colors: any = {
      'a_faire': 'bg-gray-100 text-gray-700',
      'en_cours': 'bg-blue-100 text-blue-700',
      'livrable_soumis': 'bg-yellow-100 text-yellow-700',
      'valide': 'bg-green-100 text-green-700',
      'refuse': 'bg-red-100 text-red-700',
      'en_litige': 'bg-purple-100 text-purple-700'
    }
    return colors[statut] || 'bg-gray-100 text-gray-700'
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-[#1E293B]">Jalons</h1>
        <div className="flex gap-2">
          <Button size="sm" variant={viewMode === 'kanban' ? 'default' : 'outline'}
            onClick={() => setViewMode('kanban')}>
            <LayoutDashboard className="w-4 h-4 mr-2" /> Vue Kanban
          </Button>
          <Button size="sm" variant={viewMode === 'historique' ? 'default' : 'outline'}
            onClick={() => setViewMode('historique')}>
            <Clock className="w-4 h-4 mr-2" /> Historique
          </Button>
        </div>
      </div>

      <Select value={selectedContrat || ''} onValueChange={setSelectedContrat}>
        <SelectTrigger className="w-80"><SelectValue placeholder="Sélectionner un contrat" /></SelectTrigger>
        <SelectContent>
          {contrats.map(c => <SelectItem key={c.id} value={c.id}>{c.numeroContrat} - {c.projet?.titre}</SelectItem>)}
        </SelectContent>
      </Select>

      {selectedContrat && viewMode === 'kanban' && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {colonnes.map(col => (
            <div key={col.key} className={`${col.color} rounded-lg p-3 min-h-[200px]`}>
              <h3 className="font-semibold text-sm mb-2 text-center">{col.label}</h3>
              {jalons.filter(j => j.statut === col.key).map(j => (
                <Card key={j.id} className="mb-2">
                  <CardContent className="p-3 space-y-1">
                    <p className="font-medium text-sm">{j.titre}</p>
                    <p className="text-xs text-muted-foreground">{j.montantAlloue?.toLocaleString('fr-FR')} FCFA</p>
                    <p className="text-xs text-muted-foreground">Échéance : {new Date(j.dateEcheance).toLocaleDateString('fr-FR')}</p>
                    {j.livrableUrl && <p className="text-xs text-[#3B82F6] truncate">{j.livrableUrl}</p>}
                    {j.commentaireClient && <p className="text-xs text-red-600">{j.commentaireClient}</p>}
                    <div className="flex gap-1 flex-wrap">
                      {j.statut === 'a_faire' && user?.role === 'freelance' && (
                        <Button size="sm" variant="outline" className="text-xs h-6" onClick={() => updateJalon(j.id, 'demarrer')}>Démarrer</Button>
                      )}
                      {j.statut === 'en_cours' && user?.role === 'freelance' && (
                        <Button size="sm" variant="outline" className="text-xs h-6" onClick={() => updateJalon(j.id, 'soumettre', { livrableUrl: `livrable-${j.id}.pdf` })}>Soumettre</Button>
                      )}
                      {j.statut === 'livrable_soumis' && user?.role === 'client' && (
                        <>
                          <Button size="sm" className="text-xs h-6 bg-green-600" onClick={() => updateJalon(j.id, 'valider_client')}>Valider</Button>
                          <Button size="sm" variant="destructive" className="text-xs h-6"
                            onClick={() => {
                              const commentaire = prompt('Commentaire de refus (obligatoire) :')
                              if (commentaire) updateJalon(j.id, 'refuser_client', { commentaireClient: commentaire })
                            }}>Refuser</Button>
                        </>
                      )}
                      {j.statut === 'refuse' && user?.role === 'freelance' && (
                        <Button size="sm" variant="outline" className="text-xs h-6" onClick={() => updateJalon(j.id, 'demarrer')}>Recommencer</Button>
                      )}
                      {['livrable_soumis', 'refuse'].includes(j.statut) && (
                        <Button size="sm" variant="outline" className="text-xs h-6 text-red-600" onClick={() => updateJalon(j.id, 'ouvrir_litige')}>
                          <AlertTriangle className="w-3 h-3 mr-1" /> Litige
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ))}
        </div>
      )}

      {selectedContrat && viewMode === 'historique' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Historique des jalons</CardTitle>
            <CardDescription>
              {jalons.length} jalon(s) enregistré(s) — Vue complète avec toutes les actions passées
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">N°</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Titre</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Montant</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Échéance</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Statut</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Actions/Dates</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {jalons.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                        Aucun jalon trouvé pour ce contrat
                      </td>
                    </tr>
                  ) : jalons.map((j, idx) => (
                    <tr key={j.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">{j.ordre || idx + 1}</td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-sm">{j.titre}</p>
                        {j.description && (
                          <p className="text-xs text-muted-foreground line-clamp-1">{j.description}</p>
                        )}
                        {j.livrableUrl && (
                          <p className="text-xs text-[#3B82F6] mt-1">📎 Livrable soumis</p>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {j.montantAlloue ? `${j.montantAlloue.toLocaleString('fr-FR')} FCFA` : 'N/A'}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {new Date(j.dateEcheance).toLocaleDateString('fr-FR')}
                      </td>
                      <td className="px-4 py-3">
                        <Badge className={getStatutColor(j.statut)}>
                          {getStatutLabel(j.statut)}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="space-y-1 text-xs text-muted-foreground">
                          <p>Créé : {new Date(j.createdAt).toLocaleDateString('fr-FR')}</p>
                          {j.dateSoumission && (
                            <p className="text-blue-600">✓ Soumis : {new Date(j.dateSoumission).toLocaleDateString('fr-FR')}</p>
                          )}
                          {j.dateValidation && (
                            <p className="text-green-600">✓ Validé : {new Date(j.dateValidation).toLocaleDateString('fr-FR')}</p>
                          )}
                          {j.commentaireClient && (
                            <p className="text-red-600 line-clamp-2">💬 {j.commentaireClient}</p>
                          )}
                          {j.creePar && (
                            <p>Par : {j.creePar}</p>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

// ============================================================
// Page Messagerie
// ============================================================
// Page Messagerie
// ============================================================
function MessageriePage() {
  const { user, setProfileViewerId } = useAppStore()
  const [conversations, setConversations] = useState<any[]>([])
  const [allUsers, setAllUsers] = useState<any[]>([])
  const [selectedConv, setSelectedConv] = useState<string | null>(null)
  const [messages, setMessages] = useState<any[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [showNewConversation, setShowNewConversation] = useState(false)

  const isAdmin = user?.role === 'administrateur'

  useEffect(() => {
    if (!user) return
    fetch(`/api/messagerie?utilisateurId=${user.id}`).then(r => r.json()).then(d => setConversations(Array.isArray(d) ? d : []))
    
    // Si admin, charger tous les utilisateurs pour pouvoir leur écrire
    if (isAdmin) {
      fetch('/api/admin?type=utilisateurs').then(r => r.json()).then(d => setAllUsers(Array.isArray(d) ? d : []))
    }
  }, [user, isAdmin])

  useEffect(() => {
    if (!selectedConv) return
    fetch(`/api/messagerie?conversationId=${selectedConv}`).then(r => r.json()).then(d => setMessages(Array.isArray(d) ? d : []))
  }, [selectedConv])

  const envoyer = async () => {
    if (!newMessage.trim() || !selectedConv || sending) return
    setSending(true)
    try {
      const res = await fetch('/api/messagerie', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationId: selectedConv, expediteurId: user?.id, contenu: newMessage })
      })
      const data = await res.json()
      if (data.erreur) {
        toast.error(data.erreur)
      } else {
        toast.success('Message envoyé')
        setNewMessage('')
        fetch(`/api/messagerie?conversationId=${selectedConv}`).then(r => r.json()).then(d => setMessages(Array.isArray(d) ? d : []))
      }
    } catch {
      toast.error('Erreur lors de l\'envoi du message')
    }
    setSending(false)
  }

  const demarrerConversation = async (utilisateurId: string) => {
    try {
      const res = await fetch('/api/messagerie', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'creer_conversation', adminId: user?.id, utilisateurId })
      })
      const data = await res.json()
      if (data.erreur) {
        toast.error(data.erreur)
      } else {
        toast.success('Conversation créée')
        setShowNewConversation(false)
        fetch(`/api/messagerie?utilisateurId=${user?.id}`).then(r => r.json()).then(d => setConversations(Array.isArray(d) ? d : []))
        setSelectedConv(data.conversationId)
      }
    } catch {
      toast.error('Erreur lors de la création de la conversation')
    }
  }

  const filteredConversations = conversations.filter(c => {
    if (!searchTerm.trim()) return true
    const term = searchTerm.toLowerCase()
    const other = c.participants?.find((p: any) => p.utilisateurId !== user?.id)
    return (
      other?.utilisateur?.prenom?.toLowerCase().includes(term) ||
      other?.utilisateur?.nom?.toLowerCase().includes(term) ||
      other?.utilisateur?.email?.toLowerCase().includes(term) ||
      c.projet?.titre?.toLowerCase().includes(term)
    )
  })

  const filteredUsers = allUsers.filter(u => {
    if (!searchTerm.trim()) return true
    const term = searchTerm.toLowerCase()
    return (
      u.prenom?.toLowerCase().includes(term) ||
      u.nom?.toLowerCase().includes(term) ||
      u.email?.toLowerCase().includes(term)
    )
  })

  const statutProjetLabels: any = {
    en_cours: { label: 'En cours', color: 'bg-green-100 text-green-700' },
    termine: { label: 'Terminé', color: 'bg-emerald-100 text-emerald-700' },
    en_litige: { label: 'En litige', color: 'bg-red-100 text-red-700' },
    brouillon: { label: 'Brouillon', color: 'bg-gray-100 text-gray-700' },
    publie: { label: 'Publié', color: 'bg-blue-100 text-blue-700' },
    en_recrutement: { label: 'En recrutement', color: 'bg-yellow-100 text-yellow-700' },
    annule: { label: 'Annulé', color: 'bg-gray-100 text-gray-500' },
  }

  const selectedConversation = conversations.find(c => c.id === selectedConv)
  const otherParticipant = selectedConversation?.participants?.find((p: any) => p.utilisateurId !== user?.id)
  const projet = selectedConversation?.projet
  const estEnCours = projet?.statut === 'en_cours'

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-[#1E293B]">Messagerie</h1>
          <p className="text-sm text-muted-foreground">
            {isAdmin ? '📧 En tant qu\'administrateur, vous pouvez écrire à tous les utilisateurs' : '💬 La messagerie est activée automatiquement lorsque le contrat est signé'}
          </p>
        </div>
        {isAdmin && (
          <Button onClick={() => setShowNewConversation(true)} className="bg-[#3B82F6]">
            <Plus className="w-4 h-4 mr-2" /> Nouvelle conversation
          </Button>
        )}
      </div>

      {conversations.length === 0 && !isAdmin ? (
        <Card>
          <CardContent className="p-8 text-center">
            <MessageSquare className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-30" />
            <p className="text-muted-foreground">
              Aucune conversation pour le moment.
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              Les conversations sont créées automatiquement lorsque vous signez un contrat avec un freelance.
              Une fois le projet en cours, vous pourrez échanger avec la partie prenante.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-3 gap-4 h-[calc(100vh-220px)]">
          {/* Liste des conversations */}
          <Card className="overflow-hidden">
            <CardHeader className="p-3">
              <CardTitle className="text-sm">Conversations ({filteredConversations.length})</CardTitle>
              {/* Recherche pour admin */}
              {isAdmin && (
                <div className="mt-2">
                  <Input
                    placeholder="🔍 Rechercher..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="h-9 text-sm"
                  />
                </div>
              )}
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[calc(100vh-300px)]">
                {filteredConversations.map(c => {
                  const other = c.participants?.find((p: any) => p.utilisateurId !== user?.id)
                  const statut = c.projet?.statut
                  const statutInfo = statutProjetLabels[statut]
                  return (
                    <div key={c.id}
                      className={`p-3 border-b cursor-pointer hover:bg-gray-50 transition-colors ${selectedConv === c.id ? 'bg-blue-50 border-l-4 border-l-[#3B82F6]' : ''}`}
                      onClick={() => setSelectedConv(c.id)}>
                      <div className="flex items-center gap-2 mb-1">
                        <Avatar className="h-8 w-8 cursor-pointer hover:ring-2 hover:ring-[#3B82F6] transition-all"
                          onClick={(e) => { e.stopPropagation(); other?.utilisateur?.id && setProfileViewerId(other.utilisateur.id) }}>
                          <AvatarFallback className="bg-gradient-to-br from-[#1E3A8A] to-[#3B82F6] text-white text-xs">
                            {other?.utilisateur?.prenom?.[0]}{other?.utilisateur?.nom?.[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0 cursor-pointer hover:text-[#3B82F6] transition-colors"
                          onClick={(e) => { e.stopPropagation(); other?.utilisateur?.id && setProfileViewerId(other.utilisateur.id) }}>
                          <p className="font-medium text-sm truncate">{other?.utilisateur?.prenom} {other?.utilisateur?.nom}</p>
                          {c.projet?.titre && (
                            <p className="text-xs text-[#3B82F6] truncate">📁 {c.projet.titre}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 ml-10">
                        {statutInfo && (
                          <Badge className={`text-xs ${statutInfo.color}`}>{statutInfo.label}</Badge>
                        )}
                        {c.messages?.[0] && (
                          <p className="text-xs text-muted-foreground truncate flex-1">{c.messages[0].contenu}</p>
                        )}
                      </div>
                    </div>
                  )
                })}
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Zone de discussion */}
          <Card className="col-span-2 flex flex-col">
            {selectedConv ? (
              <>
                {/* En-tête avec info projet + interlocuteur */}
                <CardHeader className="p-3 border-b">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10 cursor-pointer hover:ring-2 hover:ring-[#3B82F6] transition-all"
                        onClick={() => otherParticipant?.utilisateur?.id && setProfileViewerId(otherParticipant.utilisateur.id)}>
                        <AvatarFallback className="bg-gradient-to-br from-[#1E3A8A] to-[#3B82F6] text-white">
                          {otherParticipant?.utilisateur?.prenom?.[0]}{otherParticipant?.utilisateur?.nom?.[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div className="cursor-pointer hover:text-[#3B82F6] transition-colors"
                        onClick={() => otherParticipant?.utilisateur?.id && setProfileViewerId(otherParticipant.utilisateur.id)}>
                        <CardTitle className="text-sm">
                          {otherParticipant?.utilisateur?.prenom} {otherParticipant?.utilisateur?.nom}
                        </CardTitle>
                        {projet?.titre && (
                          <p className="text-xs text-muted-foreground">📁 {projet.titre}</p>
                        )}
                      </div>
                    </div>
                    {projet && statutProjetLabels[projet.statut] && (
                      <Badge className={statutProjetLabels[projet.statut].color}>
                        {statutProjetLabels[projet.statut].label}
                      </Badge>
                    )}
                  </div>

                  {/* Bannière informative */}
                  {estEnCours && (
                    <div className="mt-3 p-2 bg-green-50 border border-green-200 rounded text-xs text-green-800 flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 shrink-0" />
                      <span>
                        ✅ Contrat signé et projet en cours. Vous pouvez maintenant échanger librement avec
                        {' '}{otherParticipant?.utilisateur?.prenom} {otherParticipant?.utilisateur?.nom}.
                      </span>
                    </div>
                  )}
                  {projet && projet.statut === 'en_litige' && (
                    <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-800 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 shrink-0" />
                      <span>⚠️ Projet en litige. La messagerie reste disponible mais surveillée.</span>
                    </div>
                  )}
                  {projet && projet.statut === 'termine' && (
                    <div className="mt-3 p-2 bg-emerald-50 border border-emerald-200 rounded text-xs text-emerald-800 flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 shrink-0" />
                      <span>🎉 Projet terminé. Conversation archivée mais consultable.</span>
                    </div>
                  )}
                </CardHeader>

                <CardContent className="flex-1 p-3 overflow-y-auto">
                  {messages.length === 0 ? (
                    <div className="flex-1 flex items-center justify-center h-full">
                      <div className="text-center text-muted-foreground">
                        <MessageSquare className="w-10 h-10 mx-auto mb-2 opacity-30" />
                        <p className="text-sm">Aucun message pour le moment.</p>
                        <p className="text-xs">Démarrez la conversation avec {otherParticipant?.utilisateur?.prenom}.</p>
                      </div>
                    </div>
                  ) : messages.map(m => (
                    <div key={m.id} className={`mb-3 ${m.expediteurId === user?.id ? 'text-right' : ''}`}>
                      <div className={`inline-block max-w-[70%] p-2 rounded-lg text-sm ${
                        m.expediteurId === user?.id ? 'bg-[#3B82F6] text-white' : 'bg-gray-100'
                      }`}>
                        <p>{m.contenu}</p>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {m.expediteur?.prenom} - {new Date(m.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  ))}
                </CardContent>

                <div className="p-3 border-t flex gap-2">
                  <Input
                    placeholder={estEnCours ? "Votre message..." : "Saisissez votre message..."}
                    value={newMessage}
                    onChange={e => setNewMessage(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); envoyer() } }}
                    disabled={sending}
                  />
                  <Button onClick={envoyer} disabled={sending || !newMessage.trim()} className="bg-[#3B82F6]">
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </>
            ) : (
              <CardContent className="flex-1 flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <MessageSquare className="w-12 h-12 mx-auto mb-2 opacity-30" />
                  <p>Sélectionnez une conversation à gauche</p>
                </div>
              </CardContent>
            )}
          </Card>
        </div>
      )}

      {/* Dialog nouvelle conversation pour admin */}
      <Dialog open={showNewConversation} onOpenChange={setShowNewConversation}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nouvelle conversation</DialogTitle>
            <DialogDescription>
              Sélectionnez un utilisateur pour démarrer une conversation
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Input
              placeholder="🔍 Rechercher un utilisateur..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {filteredUsers.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">Aucun utilisateur trouvé</p>
              ) : filteredUsers.map(u => (
                <Card key={u.id} className="cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => demarrerConversation(u.id)}>
                  <CardContent className="p-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-gradient-to-br from-[#1E3A8A] to-[#3B82F6] text-white">
                          {u.prenom?.[0]}{u.nom?.[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-sm">{u.prenom} {u.nom}</p>
                        <p className="text-xs text-muted-foreground">{u.email}</p>
                      </div>
                    </div>
                    <Badge className={
                      u.role === 'administrateur' ? 'bg-purple-100 text-purple-700' :
                      u.role === 'freelance' ? 'bg-blue-100 text-blue-700' :
                      'bg-green-100 text-green-700'
                    }>
                      {u.role === 'administrateur' ? 'Admin' : u.role === 'freelance' ? 'Freelance' : 'Client'}
                    </Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ============================================================
// Page Portefeuille
// ============================================================
function PortefeuillePage() {
  const { user } = useAppStore()
  const [portefeuille, setPortefeuille] = useState<any>(null)
  const [depotAmount, setDepotAmount] = useState(0)

  useEffect(() => {
    if (!user) return
    fetch(`/api/portefeuille?utilisateurId=${user.id}`).then(r => r.json()).then(d => { if (!d.erreur) setPortefeuille(d) })
  }, [user])

  const deposer = async () => {
    if (!depotAmount || depotAmount <= 0) {
      toast.error('Veuillez saisir un montant valide')
      return
    }
    const res = await fetch('/api/portefeuille', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'depot', utilisateurId: user?.id, montant: depotAmount })
    })
    const data = await res.json()
    if (data.erreur) { toast.error(data.erreur); return }
    toast.success(`Demande de dépôt de ${depotAmount.toLocaleString('fr-FR')} FCFA soumise. En attente de validation par l'administrateur.`)
    setDepotAmount(0)
    fetch(`/api/portefeuille?utilisateurId=${user?.id}`).then(r => r.json()).then(d => { if (!d.erreur) setPortefeuille(d) })
  }

  const mettreEnSequestre = async (montant: number) => {
    const res = await fetch('/api/portefeuille', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'mise_en_sequestre', utilisateurId: user?.id, montant })
    })
    const data = await res.json()
    if (data.erreur) { toast.error(data.erreur); return }
    toast.success(`Mise en séquestre de ${montant.toLocaleString('fr-FR')} FCFA soumise. En attente de validation par l'administrateur.`)
    fetch(`/api/portefeuille?utilisateurId=${user?.id}`).then(r => r.json()).then(d => { if (!d.erreur) setPortefeuille(d) })
  }

  if (!portefeuille) return <p>Chargement...</p>

  // Cartes du portefeuille selon le rôle :
  //  - Client : solde + séquestre + total déposé (PAS de "Total gagné")
  //  - Freelance : uniquement "Total gagné"
  const cartesPortefeuille = user?.role === 'freelance' ? (
    <Card><CardContent className="p-4 text-center">
      <p className="text-sm text-muted-foreground">Total gagné</p>
      <p className="text-2xl font-bold text-[#3B82F6]">{portefeuille.totalGagne?.toLocaleString('fr-FR')} FCFA</p>
    </CardContent></Card>
  ) : (
    <>
      <Card><CardContent className="p-4 text-center">
        <p className="text-sm text-muted-foreground">Solde disponible</p>
        <p className="text-2xl font-bold text-[#1E3A8A]">{portefeuille.solde?.toLocaleString('fr-FR')} FCFA</p>
      </CardContent></Card>
      <Card><CardContent className="p-4 text-center">
        <p className="text-sm text-muted-foreground">En séquestre</p>
        <p className="text-2xl font-bold text-yellow-600">{portefeuille.soldeSequestre?.toLocaleString('fr-FR')} FCFA</p>
      </CardContent></Card>
      <Card><CardContent className="p-4 text-center">
        <p className="text-sm text-muted-foreground">Total déposé</p>
        <p className="text-2xl font-bold text-green-600">{portefeuille.totalDepose?.toLocaleString('fr-FR')} FCFA</p>
      </CardContent></Card>
    </>
  )

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-[#1E293B]">Portefeuille</h1>

      <div className={`grid grid-cols-1 ${user?.role === 'freelance' ? 'md:grid-cols-1 max-w-md' : 'md:grid-cols-3'} gap-4`}>
        {cartesPortefeuille}
      </div>

      {user?.role === 'client' && (
        <Card>
          <CardHeader><CardTitle className="text-lg">Approvisionner le compte</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="flex gap-3 items-end">
              <div className="flex-1">
                <Label>Montant (FCFA)</Label>
                <Input type="number" value={depotAmount || ''} onChange={e => setDepotAmount(Number(e.target.value))} />
              </div>
              <Button onClick={deposer} className="bg-[#3B82F6]">Soumettre le dépôt</Button>
            </div>
            <div className="bg-amber-50 border border-amber-200 rounded p-3 text-xs text-amber-800 flex items-start gap-2">
              <Shield className="w-4 h-4 shrink-0 mt-0.5" />
              <p>
                <strong>Important :</strong> Tout dépôt doit être validé par un administrateur avant d'être crédité sur votre compte.
                Le statut de votre transaction restera « En attente » jusqu'à validation.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader><CardTitle className="text-lg">Historique des transactions</CardTitle></CardHeader>
        <CardContent>
          <ScrollArea className="max-h-96">
            {portefeuille.transactions?.length === 0 ? (
              <p className="text-center text-muted-foreground py-4">Aucune transaction</p>
            ) : portefeuille.transactions?.map((t: any) => (
              <div key={t.id} className="flex justify-between items-center p-3 border-b">
                <div>
                  <p className="text-sm font-medium">{t.description || t.type}</p>
                  <p className="text-xs text-muted-foreground">{t.reference} - {new Date(t.createdAt).toLocaleDateString('fr-FR')}</p>
                </div>
                <div className="text-right">
                  <p className={`font-semibold ${['depot', 'liberation_jalon'].includes(t.type) ? 'text-green-600' : 'text-red-600'}`}>
                    {['depot', 'liberation_jalon'].includes(t.type) ? '+' : '-'}{t.montant?.toLocaleString('fr-FR')} FCFA
                  </p>
                  <Badge variant={t.statut === 'validee' ? 'default' : t.statut === 'echouee' ? 'destructive' : 'secondary'} className="text-xs">
                    {t.statut === 'validee' ? 'Validée' : t.statut === 'echouee' ? 'Échouée' : 'En attente'}
                  </Badge>
                </div>
              </div>
            ))}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  )
}

// ============================================================
// Page Évaluations
// ============================================================
function StarRating({ value, onChange, readonly = false }: { value: number; onChange?: (v: number) => void; readonly?: boolean }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map(i => (
        <Star key={i} className={`w-5 h-5 ${i <= value ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'} ${!readonly ? 'cursor-pointer' : ''}`}
          onClick={() => !readonly && onChange?.(i)} />
      ))}
    </div>
  )
}

function EvaluationsPage() {
  const { user } = useAppStore()
  const [evaluations, setEvaluations] = useState<any[]>([])
  const [contratsTermines, setContratsTermines] = useState<any[]>([])
  const [showEval, setShowEval] = useState<string | null>(null)
  const [form, setForm] = useState({ noteGlobale: 5, qualite: 5, communication: 5, delais: 5, professionnalisme: 5, commentaire: '' })

  useEffect(() => {
    if (!user) return
    fetch(`/api/evaluations?evalueId=${user.id}`).then(r => r.json()).then(d => setEvaluations(Array.isArray(d) ? d : []))
    const params = user.role === 'client' ? `clientId=${user.id}` : `freelanceId=${user.id}`
    fetch(`/api/contrats?${params}`).then(r => r.json()).then(d => {
      setContratsTermines(Array.isArray(d) ? d.filter((c: any) => c.statut === 'termine') : [])
    })
  }, [user])

  const submitEval = async (contratId: string, evalueId: string) => {
    await fetch('/api/evaluations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, contratId, evaluateurId: user?.id, evalueId })
    })
    toast.success('Évaluation soumise !')
    setShowEval(null)
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-[#1E293B]">Évaluations</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <h2 className="text-lg font-semibold mb-3">Évaluations reçues</h2>
          {evaluations.length === 0 ? (
            <Card><CardContent className="p-6 text-center text-muted-foreground">Aucune évaluation reçue</CardContent></Card>
          ) : evaluations.map(e => (
            <Card key={e.id} className="mb-2">
              <CardContent className="p-3">
                <div className="flex items-center gap-2">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-[#3B82F6] text-white text-xs">{e.evaluateur?.prenom?.[0]}{e.evaluateur?.nom?.[0]}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium">{e.evaluateur?.prenom} {e.evaluateur?.nom}</p>
                    <StarRating value={Math.round(e.noteGlobale)} readonly />
                  </div>
                </div>
                {e.commentaire && <p className="text-sm text-muted-foreground mt-1">{e.commentaire}</p>}
              </CardContent>
            </Card>
          ))}
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-3">Contrats à évaluer</h2>
          {contratsTermines.filter(c => !c.evaluations?.some((e: any) => e.evaluateurId === user?.id)).map(c => (
            <Card key={c.id} className="mb-2">
              <CardContent className="p-3">
                <p className="font-medium text-sm">{c.numeroContrat} - {c.projet?.titre}</p>
                <Button size="sm" className="mt-2 bg-[#3B82F6]" onClick={() => setShowEval(c.id)}>
                  <Star className="w-4 h-4 mr-1" /> Évaluer
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <Dialog open={!!showEval} onOpenChange={() => setShowEval(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Évaluer</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Note globale</Label><StarRating value={form.noteGlobale} onChange={v => setForm({...form, noteGlobale: v})} /></div>
            <div><Label>Qualité</Label><StarRating value={form.qualite} onChange={v => setForm({...form, qualite: v})} /></div>
            <div><Label>Communication</Label><StarRating value={form.communication} onChange={v => setForm({...form, communication: v})} /></div>
            <div><Label>Respect des délais</Label><StarRating value={form.delais} onChange={v => setForm({...form, delais: v})} /></div>
            <div><Label>Professionnalisme</Label><StarRating value={form.professionnalisme} onChange={v => setForm({...form, professionnalisme: v})} /></div>
            <div><Label>Commentaire</Label><Textarea value={form.commentaire} onChange={e => setForm({...form, commentaire: e.target.value})} /></div>
            <Button className="w-full bg-[#3B82F6]" onClick={() => {
              const contrat = contratsTermines.find(c => c.id === showEval)
              if (contrat) {
                const evalueId = user?.role === 'client' ? contrat.freelanceId : contrat.clientId
                submitEval(showEval!, evalueId)
              }
            }}>Soumettre l'évaluation</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ============================================================
// Page Profil
// ============================================================
function ProfilPage() {
  const { user } = useAppStore()
  const [profil, setProfil] = useState<any>(null)
  const [saving, setSaving] = useState(false)
  const [competences, setCompetences] = useState<any[]>([])
  const [showAddComp, setShowAddComp] = useState(false)
  const [showAddExp, setShowAddExp] = useState(false)
  const [showAddFormation, setShowAddFormation] = useState(false)
  const [showAddCertification, setShowAddCertification] = useState(false)
  const [showAddPortfolio, setShowAddPortfolio] = useState(false)
  const [showAddLangue, setShowAddLangue] = useState(false)
  const [newComp, setNewComp] = useState({ competenceId: '', niveau: 'intermediaire' })
  const [newExp, setNewExp] = useState({ poste: '', entreprise: '', dateDebut: '', dateFin: '', description: '' })
  const [newFormation, setNewFormation] = useState({ diplome: '', etablissement: '', dateDebut: '', dateFin: '', description: '' })
  const [newCertification, setNewCertification] = useState({ nom: '', organisme: '', dateObtention: '', dateExpiration: '', numeroCertification: '', description: '' })
  const [newPortfolio, setNewPortfolio] = useState({ titre: '', description: '', lienProjet: '', lienDemo: '', technologies: '', dateRealisation: '' })
  const [newLangue, setNewLangue] = useState({ langue: '', niveau: 'intermediaire' })

  const loadProfil = useCallback(() => {
    if (!user) return
    fetch(`/api/profil?utilisateurId=${user.id}`).then(r => r.json()).then(d => { if (!d.erreur) setProfil(d) })
  }, [user])

  useEffect(() => {
    loadProfil()
    fetch('/api/competences').then(r => r.json()).then(d => setCompetences(Array.isArray(d) ? d : [])).catch(() => {})
  }, [loadProfil])

  const saveProfil = async () => {
    if (!user) return
    setSaving(true)
    try {
      // Récupère les valeurs actuelles des inputs
      const inputs = document.querySelectorAll('input, textarea')
      const data: any = { utilisateurId: user.id }
      const profilFreelance: any = {}
      const profilClient: any = {}

      inputs.forEach(input => {
        const el = input as HTMLInputElement
        const label = el.previousElementSibling?.textContent || el.placeholder || ''
        const val = el.value
        if (el.disabled) return

        if (label === 'Prénom') data.prenom = val
        else if (label === 'Nom') data.nom = val
        else if (label === 'Téléphone') data.telephone = val
        else if (label === 'Pays') data.pays = val
        else if (label === 'Titre professionnel') profilFreelance.titreProfessionnel = val
        else if (label === 'Bio') profilFreelance.bio = val
        else if (label === 'Tarif (FCFA/h)') profilFreelance.tarif = Number(val) || undefined
        else if (label === "Années d'expérience") profilFreelance.anneesExperience = Number(val) || undefined
        else if (label === 'LinkedIn') profilFreelance.lienLinkedIn = val
        else if (label === 'GitHub') profilFreelance.lienGitHub = val
        else if (label === 'Portfolio') profilFreelance.lienPortfolio = val
        else if (label === 'Type') profilClient.type = val
        else if (label === 'Nom entreprise') profilClient.nomEntreprise = val
        else if (label === "Secteur d'activité") profilClient.secteurActivite = val
      })

      if (Object.keys(profilFreelance).length > 0) data.profilFreelance = profilFreelance
      if (Object.keys(profilClient).length > 0) data.profilClient = profilClient

      const res = await fetch('/api/profil', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      const result = await res.json()
      if (result.erreur) {
        toast.error(result.erreur)
      } else {
        toast.success('Profil mis à jour avec succès')
        setProfil(result)
      }
    } catch {
      toast.error('Erreur lors de la mise à jour du profil')
    }
    setSaving(false)
  }

  // Ajouter une nouvelle compétence
  const ajouterCompetence = async () => {
    if (!newComp.competenceId) { toast.error('Veuillez sélectionner une compétence'); return }
    if (!profil?.profilFreelance?.id) { toast.error('Profil freelance introuvable'); return }
    const res = await fetch('/api/profil/competences', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        profilFreelanceId: profil.profilFreelance.id,
        competenceId: newComp.competenceId,
        niveau: newComp.niveau,
      })
    })
    const data = await res.json()
    if (data.erreur) { toast.error(data.erreur); return }
    toast.success('Compétence ajoutée avec succès')
    setShowAddComp(false)
    setNewComp({ competenceId: '', niveau: 'intermediaire' })
    loadProfil()
  }

  // Supprimer une compétence
  const supprimerCompetence = async (id: string) => {
    if (!confirm('Voulez-vous vraiment supprimer cette compétence ?')) return
    await fetch('/api/profil/competences', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id })
    })
    toast.success('Compétence supprimée')
    loadProfil()
  }

  // Ajouter une nouvelle expérience
  const ajouterExperience = async () => {
    if (!newExp.poste || !newExp.entreprise || !newExp.dateDebut) {
      toast.error('Veuillez remplir tous les champs obligatoires')
      return
    }
    if (!profil?.profilFreelance?.id) { toast.error('Profil freelance introuvable'); return }
    const res = await fetch('/api/profil/experiences', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        profilFreelanceId: profil.profilFreelance.id,
        ...newExp,
      })
    })
    const data = await res.json()
    if (data.erreur) { toast.error(data.erreur); return }
    toast.success('Expérience ajoutée avec succès')
    setShowAddExp(false)
    setNewExp({ poste: '', entreprise: '', dateDebut: '', dateFin: '', description: '' })
    loadProfil()
  }

  // Supprimer une expérience
  const supprimerExperience = async (id: string) => {
    if (!confirm('Voulez-vous vraiment supprimer cette expérience ?')) return
    await fetch(`/api/profil/experiences?id=${id}`, { method: 'DELETE' })
    toast.success('Expérience supprimée')
    loadProfil()
  }

  // ============================================================
  // FORMATIONS
  // ============================================================
  const ajouterFormation = async () => {
    if (!newFormation.diplome || !newFormation.etablissement || !newFormation.dateDebut) {
      toast.error('Veuillez remplir tous les champs obligatoires')
      return
    }
    if (!profil?.profilFreelance?.id) { toast.error('Profil freelance introuvable'); return }
    const res = await fetch('/api/profil/formations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        profilFreelanceId: profil.profilFreelance.id,
        ...newFormation,
      })
    })
    const data = await res.json()
    if (data.erreur) { toast.error(data.erreur); return }
    toast.success('Formation ajoutée avec succès')
    setShowAddFormation(false)
    setNewFormation({ diplome: '', etablissement: '', dateDebut: '', dateFin: '', description: '' })
    loadProfil()
  }

  const supprimerFormation = async (id: string) => {
    if (!confirm('Voulez-vous vraiment supprimer cette formation ?')) return
    await fetch(`/api/profil/formations/${id}`, { method: 'DELETE' })
    toast.success('Formation supprimée')
    loadProfil()
  }

  // ============================================================
  // CERTIFICATIONS
  // ============================================================
  const ajouterCertification = async () => {
    if (!newCertification.nom || !newCertification.organisme || !newCertification.dateObtention) {
      toast.error('Veuillez remplir tous les champs obligatoires')
      return
    }
    if (!profil?.profilFreelance?.id) { toast.error('Profil freelance introuvable'); return }
    const res = await fetch('/api/profil/certifications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        profilFreelanceId: profil.profilFreelance.id,
        ...newCertification,
      })
    })
    const data = await res.json()
    if (data.erreur) { toast.error(data.erreur); return }
    toast.success('Certification ajoutée avec succès')
    setShowAddCertification(false)
    setNewCertification({ nom: '', organisme: '', dateObtention: '', dateExpiration: '', numeroCertification: '', description: '' })
    loadProfil()
  }

  const supprimerCertification = async (id: string) => {
    if (!confirm('Voulez-vous vraiment supprimer cette certification ?')) return
    await fetch(`/api/profil/certifications/${id}`, { method: 'DELETE' })
    toast.success('Certification supprimée')
    loadProfil()
  }

  // ============================================================
  // PORTFOLIO
  // ============================================================
  const ajouterPortfolio = async () => {
    if (!newPortfolio.titre) {
      toast.error('Veuillez renseigner au moins le titre du projet')
      return
    }
    if (!profil?.profilFreelance?.id) { toast.error('Profil freelance introuvable'); return }
    const res = await fetch('/api/profil/portfolio', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        profilFreelanceId: profil.profilFreelance.id,
        ...newPortfolio,
      })
    })
    const data = await res.json()
    if (data.erreur) { toast.error(data.erreur); return }
    toast.success('Projet portfolio ajouté avec succès')
    setShowAddPortfolio(false)
    setNewPortfolio({ titre: '', description: '', lienProjet: '', lienDemo: '', technologies: '', dateRealisation: '' })
    loadProfil()
  }

  const supprimerPortfolio = async (id: string) => {
    if (!confirm('Voulez-vous vraiment supprimer ce projet ?')) return
    await fetch(`/api/profil/portfolio/${id}`, { method: 'DELETE' })
    toast.success('Projet portfolio supprimé')
    loadProfil()
  }

  // ============================================================
  // LANGUES
  // ============================================================
  const ajouterLangue = async () => {
    if (!newLangue.langue || !newLangue.niveau) {
      toast.error('Veuillez remplir tous les champs obligatoires')
      return
    }
    if (!profil?.profilFreelance?.id) { toast.error('Profil freelance introuvable'); return }
    const res = await fetch('/api/profil/langues', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        profilFreelanceId: profil.profilFreelance.id,
        ...newLangue,
      })
    })
    const data = await res.json()
    if (data.erreur) { toast.error(data.erreur); return }
    toast.success('Langue ajoutée avec succès')
    setShowAddLangue(false)
    setNewLangue({ langue: '', niveau: 'intermediaire' })
    loadProfil()
  }

  const supprimerLangue = async (id: string) => {
    if (!confirm('Voulez-vous vraiment supprimer cette langue ?')) return
    await fetch(`/api/profil/langues/${id}`, { method: 'DELETE' })
    toast.success('Langue supprimée')
    loadProfil()
  }

  if (!profil) return <p>Chargement...</p>

  // Bouton "+" réutilisable
  const PlusButton = ({ onClick, title }: { onClick: () => void; title: string }) => (
    <button
      onClick={onClick}
      title={title}
      className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-[#3B82F6] text-white hover:bg-[#1E3A8A] transition-colors shrink-0">
      <Plus className="w-4 h-4" />
    </button>
  )

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-[#1E293B]">Mon Profil</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="md:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Informations personnelles</CardTitle>
              <Badge variant="secondary" className="text-xs">Modifiable</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Prénom</Label><Input defaultValue={profil.prenom} /></div>
              <div><Label>Nom</Label><Input defaultValue={profil.nom} /></div>
            </div>
            <div><Label>Email</Label><Input defaultValue={profil.email} disabled /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Téléphone</Label><Input defaultValue={profil.telephone || ''} /></div>
              <div><Label>Pays</Label><Input defaultValue={profil.pays || ''} /></div>
            </div>

            {/* Signature numérique - lecture seule */}
            <div>
              <Label>Signature numérique</Label>
              <div className="flex items-center gap-2">
                {profil.signatureUrl && (
                  <div className="h-16 w-32 border rounded bg-gray-50 flex items-center justify-center">
                    <img src={profil.signatureUrl} alt="Signature" className="max-h-12 max-w-28 object-contain" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
                  </div>
                )}
                <Badge variant="secondary" className="text-xs">Verrouillée - Non modifiable</Badge>
              </div>
            </div>

            {profil.profilFreelance && (
              <>
                <Separator />
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-[#1E293B]">Profil Freelance</h3>
                  <Badge variant="secondary" className="text-xs">Modifiable</Badge>
                </div>
                <div><Label>Titre professionnel</Label><Input defaultValue={profil.profilFreelance.titreProfessionnel || ''} /></div>
                <div><Label>Bio</Label><Textarea defaultValue={profil.profilFreelance.bio || ''} /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Tarif (FCFA/h)</Label><Input type="number" defaultValue={profil.profilFreelance.tarif || ''} /></div>
                  <div><Label>Années d'expérience</Label><Input type="number" defaultValue={profil.profilFreelance.anneesExperience || ''} /></div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div><Label>LinkedIn</Label><Input defaultValue={profil.profilFreelance.lienLinkedIn || ''} /></div>
                  <div><Label>GitHub</Label><Input defaultValue={profil.profilFreelance.lienGitHub || ''} /></div>
                  <div><Label>Portfolio</Label><Input defaultValue={profil.profilFreelance.lienPortfolio || ''} /></div>
                </div>

                {/* Section Compétences avec bouton + */}
                <Separator />
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label className="text-base font-semibold">Compétences</Label>
                    <PlusButton onClick={() => setShowAddComp(true)} title="Ajouter une compétence" />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {profil.profilFreelance.competences?.length > 0 ? (
                      profil.profilFreelance.competences.map((c: any) => (
                        <Badge key={c.id} variant="secondary" className="flex items-center gap-1 pr-1">
                          {c.competence?.nom} <span className="text-xs opacity-70">({c.niveau})</span>
                          <button
                            onClick={() => supprimerCompetence(c.id)}
                            className="ml-1 hover:bg-red-100 hover:text-red-700 rounded-full w-4 h-4 flex items-center justify-center text-xs"
                            title="Supprimer">×</button>
                        </Badge>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground italic">Aucune compétence. Cliquez sur + pour en ajouter.</p>
                    )}
                  </div>
                </div>

                {/* Section Expériences professionnelles avec bouton + */}
                <Separator />
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label className="text-base font-semibold">Expériences professionnelles</Label>
                    <PlusButton onClick={() => setShowAddExp(true)} title="Ajouter une expérience" />
                  </div>
                  {profil.profilFreelance.experiences?.length > 0 ? (
                    <div className="space-y-2">
                      {profil.profilFreelance.experiences.map((exp: any) => (
                        <div key={exp.id} className="border-l-2 border-[#3B82F6] pl-3 py-1 relative">
                          <button
                            onClick={() => supprimerExperience(exp.id)}
                            className="absolute top-0 right-0 hover:bg-red-100 hover:text-red-700 rounded-full w-5 h-5 flex items-center justify-center text-xs"
                            title="Supprimer">×</button>
                          <p className="font-medium text-sm text-[#1E293B]">{exp.poste}</p>
                          <p className="text-xs text-muted-foreground">{exp.entreprise}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(exp.dateDebut).toLocaleDateString('fr-FR')} - {exp.dateFin ? new Date(exp.dateFin).toLocaleDateString('fr-FR') : "Aujourd'hui"}
                          </p>
                          {exp.description && <p className="text-xs text-muted-foreground mt-1">{exp.description}</p>}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground italic">Aucune expérience. Cliquez sur + pour en ajouter.</p>
                  )}
                </div>

                {/* Section Formations avec bouton + */}
                <Separator />
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label className="text-base font-semibold">Formations</Label>
                    <PlusButton onClick={() => setShowAddFormation(true)} title="Ajouter une formation" />
                  </div>
                  {profil.profilFreelance.formations?.length > 0 ? (
                    <div className="space-y-2">
                      {profil.profilFreelance.formations.map((formation: any) => (
                        <div key={formation.id} className="border-l-2 border-purple-500 pl-3 py-1 relative">
                          <button
                            onClick={() => supprimerFormation(formation.id)}
                            className="absolute top-0 right-0 hover:bg-red-100 hover:text-red-700 rounded-full w-5 h-5 flex items-center justify-center text-xs"
                            title="Supprimer">×</button>
                          <p className="font-medium text-sm text-[#1E293B]">{formation.diplome}</p>
                          <p className="text-xs text-muted-foreground">{formation.etablissement}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(formation.dateDebut).toLocaleDateString('fr-FR')} - {formation.dateFin ? new Date(formation.dateFin).toLocaleDateString('fr-FR') : "En cours"}
                          </p>
                          {formation.description && <p className="text-xs text-muted-foreground mt-1">{formation.description}</p>}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground italic">Aucune formation. Cliquez sur + pour en ajouter.</p>
                  )}
                </div>

                {/* Section Certifications avec bouton + */}
                <Separator />
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label className="text-base font-semibold">Certifications</Label>
                    <PlusButton onClick={() => setShowAddCertification(true)} title="Ajouter une certification" />
                  </div>
                  {profil.profilFreelance.certifications?.length > 0 ? (
                    <div className="space-y-2">
                      {profil.profilFreelance.certifications.map((cert: any) => (
                        <div key={cert.id} className="border-l-2 border-green-500 pl-3 py-1 relative">
                          <button
                            onClick={() => supprimerCertification(cert.id)}
                            className="absolute top-0 right-0 hover:bg-red-100 hover:text-red-700 rounded-full w-5 h-5 flex items-center justify-center text-xs"
                            title="Supprimer">×</button>
                          <p className="font-medium text-sm text-[#1E293B]">{cert.nom}</p>
                          <p className="text-xs text-muted-foreground">{cert.organisme}</p>
                          <p className="text-xs text-muted-foreground">
                            Obtenue le {new Date(cert.dateObtention).toLocaleDateString('fr-FR')}
                            {cert.dateExpiration && ` - Expire le ${new Date(cert.dateExpiration).toLocaleDateString('fr-FR')}`}
                          </p>
                          {cert.numeroCertification && <p className="text-xs text-muted-foreground">N° {cert.numeroCertification}</p>}
                          {cert.description && <p className="text-xs text-muted-foreground mt-1">{cert.description}</p>}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground italic">Aucune certification. Cliquez sur + pour en ajouter.</p>
                  )}
                </div>

                {/* Section Portfolio avec bouton + */}
                <Separator />
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label className="text-base font-semibold">Portfolio (Projets personnels)</Label>
                    <PlusButton onClick={() => setShowAddPortfolio(true)} title="Ajouter un projet" />
                  </div>
                  {profil.profilFreelance.portfolioProjets?.length > 0 ? (
                    <div className="space-y-2">
                      {profil.profilFreelance.portfolioProjets.map((projet: any) => (
                        <div key={projet.id} className="border-l-2 border-amber-500 pl-3 py-1 relative">
                          <button
                            onClick={() => supprimerPortfolio(projet.id)}
                            className="absolute top-0 right-0 hover:bg-red-100 hover:text-red-700 rounded-full w-5 h-5 flex items-center justify-center text-xs"
                            title="Supprimer">×</button>
                          <p className="font-medium text-sm text-[#1E293B]">{projet.titre}</p>
                          {projet.description && <p className="text-xs text-muted-foreground">{projet.description}</p>}
                          <div className="flex gap-2 mt-1">
                            {projet.lienProjet && <a href={projet.lienProjet} target="_blank" rel="noopener noreferrer" className="text-xs text-[#3B82F6] hover:underline">🔗 Code</a>}
                            {projet.lienDemo && <a href={projet.lienDemo} target="_blank" rel="noopener noreferrer" className="text-xs text-[#3B82F6] hover:underline">🚀 Demo</a>}
                          </div>
                          {projet.technologies && Array.isArray(projet.technologies) && (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {projet.technologies.map((tech: string, idx: number) => (
                                <span key={idx} className="text-xs bg-gray-100 px-1 rounded">{tech}</span>
                              ))}
                            </div>
                          )}
                          {projet.dateRealisation && <p className="text-xs text-muted-foreground mt-1">{new Date(projet.dateRealisation).toLocaleDateString('fr-FR')}</p>}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground italic">Aucun projet. Cliquez sur + pour en ajouter.</p>
                  )}
                </div>

                {/* Section Langues avec bouton + */}
                <Separator />
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label className="text-base font-semibold">Langues</Label>
                    <PlusButton onClick={() => setShowAddLangue(true)} title="Ajouter une langue" />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {profil.profilFreelance.langues?.length > 0 ? (
                      profil.profilFreelance.langues.map((langue: any) => (
                        <Badge key={langue.id} variant="outline" className="flex items-center gap-1 pr-1">
                          {langue.langue} <span className="text-xs opacity-70">({langue.niveau})</span>
                          <button
                            onClick={() => supprimerLangue(langue.id)}
                            className="ml-1 hover:bg-red-100 hover:text-red-700 rounded-full w-4 h-4 flex items-center justify-center text-xs"
                            title="Supprimer">×</button>
                        </Badge>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground italic">Aucune langue. Cliquez sur + pour en ajouter.</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3 text-center bg-gray-50 p-3 rounded">
                  <div><p className="text-sm text-muted-foreground">Score fiabilité</p><p className="text-xl font-bold text-[#3B82F6]">{profil.profilFreelance.scoreFiabilite?.toFixed(1)}/5</p></div>
                  <div><p className="text-sm text-muted-foreground">Taux complétion</p><p className="text-xl font-bold text-green-600">{profil.profilFreelance.tauxCompletion?.toFixed(0)}%</p></div>
                  <div><p className="text-sm text-muted-foreground">Projets réalisés</p><p className="text-xl font-bold text-[#1E3A8A]">{profil.profilFreelance.nombreProjets}</p></div>
                </div>
              </>
            )}

            {profil.profilClient && (
              <>
                <Separator />
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-[#1E293B]">Profil Client</h3>
                  <Badge variant="secondary" className="text-xs">Modifiable</Badge>
                </div>
                <div><Label>Type</Label><Input defaultValue={profil.profilClient.type || ''} /></div>
                <div><Label>Nom entreprise</Label><Input defaultValue={profil.profilClient.nomEntreprise || ''} /></div>
                <div><Label>Secteur d'activité</Label><Input defaultValue={profil.profilClient.secteurActivite || ''} /></div>
              </>
            )}

            <Button onClick={saveProfil} disabled={saving} className="bg-gradient-to-r from-[#1E3A8A] to-[#3B82F6]">
              {saving ? 'Sauvegarde...' : 'Sauvegarder les modifications'}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex flex-col items-center gap-3">
            <Avatar className="h-24 w-24">
              <AvatarFallback className="bg-gradient-to-br from-[#1E3A8A] to-[#3B82F6] text-white text-2xl font-bold">
                {profil.prenom?.[0]}{profil.nom?.[0]}
              </AvatarFallback>
            </Avatar>
            <h3 className="font-bold text-lg">{profil.prenom} {profil.nom}</h3>
            <Badge className="bg-gradient-to-r from-[#1E3A8A] to-[#3B82F6]">
              {profil.role === 'freelance' ? 'Freelance' : profil.role === 'administrateur' ? 'Administrateur' : 'Client'}
            </Badge>
            <p className="text-sm text-muted-foreground">{profil.email}</p>
            {profil.profilFreelance && (
              <div className="w-full space-y-2 mt-2">
                <div className="flex justify-between text-sm"><span>Fiabilité</span><Progress value={profil.profilFreelance.scoreFiabilite * 20} className="w-24" /></div>
                <div className="flex justify-between text-sm"><span>Complétion</span><Progress value={profil.profilFreelance.tauxCompletion} className="w-24" /></div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Dialogue - Ajouter une compétence */}
      <Dialog open={showAddComp} onOpenChange={setShowAddComp}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Ajouter une compétence</DialogTitle>
            <DialogDescription>Sélectionnez une compétence et indiquez votre niveau</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Compétence *</Label>
              <Select value={newComp.competenceId} onValueChange={v => setNewComp({ ...newComp, competenceId: v })}>
                <SelectTrigger><SelectValue placeholder="Choisir une compétence" /></SelectTrigger>
                <SelectContent>
                  {competences.map(c => <SelectItem key={c.id} value={c.id}>{c.nom}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Niveau *</Label>
              <Select value={newComp.niveau} onValueChange={v => setNewComp({ ...newComp, niveau: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="debutant">Débutant</SelectItem>
                  <SelectItem value="intermediaire">Intermédiaire</SelectItem>
                  <SelectItem value="avance">Avancé</SelectItem>
                  <SelectItem value="expert">Expert</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => setShowAddComp(false)}>Annuler</Button>
              <Button className="flex-1 bg-[#3B82F6]" onClick={ajouterCompetence}>Ajouter</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialogue - Ajouter une expérience */}
      <Dialog open={showAddExp} onOpenChange={setShowAddExp}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Ajouter une expérience professionnelle</DialogTitle>
            <DialogDescription>Renseignez les détails de votre expérience</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div><Label>Poste *</Label><Input value={newExp.poste} onChange={e => setNewExp({ ...newExp, poste: e.target.value })} placeholder="Ex: Développeur Senior" /></div>
            <div><Label>Entreprise *</Label><Input value={newExp.entreprise} onChange={e => setNewExp({ ...newExp, entreprise: e.target.value })} placeholder="Ex: TechCorp" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Date de début *</Label><Input type="date" value={newExp.dateDebut} onChange={e => setNewExp({ ...newExp, dateDebut: e.target.value })} /></div>
              <div><Label>Date de fin (laisser vide si en cours)</Label><Input type="date" value={newExp.dateFin} onChange={e => setNewExp({ ...newExp, dateFin: e.target.value })} /></div>
            </div>
            <div><Label>Description</Label><Textarea rows={3} value={newExp.description} onChange={e => setNewExp({ ...newExp, description: e.target.value })} placeholder="Décrivez vos missions et accomplissements..." /></div>
            <div className="flex gap-2 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => setShowAddExp(false)}>Annuler</Button>
              <Button className="flex-1 bg-[#3B82F6]" onClick={ajouterExperience}>Ajouter</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialogue - Ajouter une formation */}
      <Dialog open={showAddFormation} onOpenChange={setShowAddFormation}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Ajouter une formation</DialogTitle>
            <DialogDescription>Renseignez les détails de votre formation</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div><Label>Diplôme *</Label><Input value={newFormation.diplome} onChange={e => setNewFormation({ ...newFormation, diplome: e.target.value })} placeholder="Ex: Master en Informatique" /></div>
            <div><Label>Établissement *</Label><Input value={newFormation.etablissement} onChange={e => setNewFormation({ ...newFormation, etablissement: e.target.value })} placeholder="Ex: Université de Douala" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Date de début *</Label><Input type="date" value={newFormation.dateDebut} onChange={e => setNewFormation({ ...newFormation, dateDebut: e.target.value })} /></div>
              <div><Label>Date de fin (laisser vide si en cours)</Label><Input type="date" value={newFormation.dateFin} onChange={e => setNewFormation({ ...newFormation, dateFin: e.target.value })} /></div>
            </div>
            <div><Label>Description</Label><Textarea rows={3} value={newFormation.description} onChange={e => setNewFormation({ ...newFormation, description: e.target.value })} placeholder="Détails supplémentaires..." /></div>
            <div className="flex gap-2 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => setShowAddFormation(false)}>Annuler</Button>
              <Button className="flex-1 bg-purple-600" onClick={ajouterFormation}>Ajouter</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialogue - Ajouter une certification */}
      <Dialog open={showAddCertification} onOpenChange={setShowAddCertification}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Ajouter une certification</DialogTitle>
            <DialogDescription>Renseignez les détails de votre certification</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div><Label>Nom de la certification *</Label><Input value={newCertification.nom} onChange={e => setNewCertification({ ...newCertification, nom: e.target.value })} placeholder="Ex: AWS Certified Developer" /></div>
            <div><Label>Organisme *</Label><Input value={newCertification.organisme} onChange={e => setNewCertification({ ...newCertification, organisme: e.target.value })} placeholder="Ex: Amazon Web Services" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Date d'obtention *</Label><Input type="date" value={newCertification.dateObtention} onChange={e => setNewCertification({ ...newCertification, dateObtention: e.target.value })} /></div>
              <div><Label>Date d'expiration</Label><Input type="date" value={newCertification.dateExpiration} onChange={e => setNewCertification({ ...newCertification, dateExpiration: e.target.value })} /></div>
            </div>
            <div><Label>Numéro de certification</Label><Input value={newCertification.numeroCertification} onChange={e => setNewCertification({ ...newCertification, numeroCertification: e.target.value })} placeholder="Ex: AWS-12345678" /></div>
            <div><Label>Description</Label><Textarea rows={2} value={newCertification.description} onChange={e => setNewCertification({ ...newCertification, description: e.target.value })} placeholder="Détails supplémentaires..." /></div>
            <div className="flex gap-2 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => setShowAddCertification(false)}>Annuler</Button>
              <Button className="flex-1 bg-green-600" onClick={ajouterCertification}>Ajouter</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialogue - Ajouter un projet portfolio */}
      <Dialog open={showAddPortfolio} onOpenChange={setShowAddPortfolio}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Ajouter un projet portfolio</DialogTitle>
            <DialogDescription>Renseignez les détails de votre projet personnel</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div><Label>Titre du projet *</Label><Input value={newPortfolio.titre} onChange={e => setNewPortfolio({ ...newPortfolio, titre: e.target.value })} placeholder="Ex: Site e-commerce" /></div>
            <div><Label>Description</Label><Textarea rows={3} value={newPortfolio.description} onChange={e => setNewPortfolio({ ...newPortfolio, description: e.target.value })} placeholder="Décrivez votre projet..." /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Lien code source (GitHub)</Label><Input value={newPortfolio.lienProjet} onChange={e => setNewPortfolio({ ...newPortfolio, lienProjet: e.target.value })} placeholder="https://github.com/..." /></div>
              <div><Label>Lien démo</Label><Input value={newPortfolio.lienDemo} onChange={e => setNewPortfolio({ ...newPortfolio, lienDemo: e.target.value })} placeholder="https://..." /></div>
            </div>
            <div><Label>Technologies (séparées par des virgules)</Label><Input value={newPortfolio.technologies} onChange={e => setNewPortfolio({ ...newPortfolio, technologies: e.target.value })} placeholder="React, Node.js, MongoDB" /></div>
            <div><Label>Date de réalisation</Label><Input type="date" value={newPortfolio.dateRealisation} onChange={e => setNewPortfolio({ ...newPortfolio, dateRealisation: e.target.value })} /></div>
            <div className="flex gap-2 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => setShowAddPortfolio(false)}>Annuler</Button>
              <Button className="flex-1 bg-amber-600" onClick={ajouterPortfolio}>Ajouter</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialogue - Ajouter une langue */}
      <Dialog open={showAddLangue} onOpenChange={setShowAddLangue}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Ajouter une langue</DialogTitle>
            <DialogDescription>Indiquez la langue et votre niveau de maîtrise</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div><Label>Langue *</Label><Input value={newLangue.langue} onChange={e => setNewLangue({ ...newLangue, langue: e.target.value })} placeholder="Ex: Français, Anglais, Espagnol..." /></div>
            <div>
              <Label>Niveau *</Label>
              <Select value={newLangue.niveau} onValueChange={v => setNewLangue({ ...newLangue, niveau: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="debutant">Débutant</SelectItem>
                  <SelectItem value="intermediaire">Intermédiaire</SelectItem>
                  <SelectItem value="avance">Avancé</SelectItem>
                  <SelectItem value="courant">Courant</SelectItem>
                  <SelectItem value="natif">Natif</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => setShowAddLangue(false)}>Annuler</Button>
              <Button className="flex-1 bg-[#3B82F6]" onClick={ajouterLangue}>Ajouter</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ============================================================
// Page Admin - Validation paiements
// ============================================================
// Page Admin - Gestion des paiements (Tableau avec filtres)
// ============================================================
function AdminValidationPaiements() {
  const [transactions, setTransactions] = useState<any[]>([])
  const [filtreStatut, setFiltreStatut] = useState<string>('en_attente')
  const [justificatifModal, setJustificatifModal] = useState<any>(null)

  useEffect(() => {
    const endpoint = filtreStatut === 'en_attente' ? 'transactions_en_attente' : 'transactions'
    fetch(`/api/admin?type=${endpoint}`).then(r => r.json()).then(d => setTransactions(Array.isArray(d) ? d : []))
  }, [filtreStatut])

  const valider = async (transaction: any, action: string, motif?: string) => {
    const utilisateurId = transaction?.portefeuille?.utilisateur?.id
    if (!utilisateurId) {
      toast.error('Impossible de déterminer le propriétaire du portefeuille')
      return
    }

    if (action === 'refuser_transaction' && !motif) {
      const saisieMotif = prompt('Motif du refus (obligatoire) :')
      if (!saisieMotif?.trim()) return
      motif = saisieMotif
    }

    const res = await fetch('/api/portefeuille', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, utilisateurId, transactionId: transaction.id, motif })
    })
    const data = await res.json()
    if (data.erreur) { toast.error(data.erreur); return }
    toast.success(action === 'valider_transaction' ? 'Transaction validée' : 'Transaction refusée')
    
    const endpoint = filtreStatut === 'en_attente' ? 'transactions_en_attente' : 'transactions'
    fetch(`/api/admin?type=${endpoint}`).then(r => r.json()).then(d => setTransactions(Array.isArray(d) ? d : []))
  }

  const voirJustificatif = (transaction: any) => {
    if (!transaction.justificatifUrl) {
      toast.info('Aucun justificatif disponible')
      return
    }
    setJustificatifModal(transaction)
  }

  const transactionsFiltrees = transactions.filter(t => {
    if (filtreStatut === 'toutes') return true
    if (filtreStatut === 'en_attente') return t.statut === 'en_attente'
    if (filtreStatut === 'validee') return t.statut === 'validee'
    if (filtreStatut === 'refusee') return t.statut === 'refusee'
    return true
  })

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-[#1E293B]">Gestion des paiements</h1>
        <p className="text-sm text-muted-foreground">
          Validez ou refusez les paiements soumis par les clients. {transactionsFiltrees.length} paiement(s) trouvé(s).
        </p>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded p-3 text-xs text-blue-800">
        <p className="font-semibold">ℹ️ Rôle de l'administrateur</p>
        <p className="mt-1">
          Chaque dépôt et mise en séquestre effectué par un client doit être validé par un administrateur.
          Pour les mises en séquestre liées à un précontrat, la validation déclenche la génération automatique
          du précontrat qui sera ensuite visible par le freelance pour signature.
        </p>
      </div>

      {/* Filtres */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-2 flex-wrap">
            <Button size="sm" variant={filtreStatut === 'en_attente' ? 'default' : 'outline'}
              onClick={() => setFiltreStatut('en_attente')}>
              En attente
            </Button>
            <Button size="sm" variant={filtreStatut === 'validee' ? 'default' : 'outline'}
              onClick={() => setFiltreStatut('validee')}>
              Validés
            </Button>
            <Button size="sm" variant={filtreStatut === 'refusee' ? 'default' : 'outline'}
              onClick={() => setFiltreStatut('refusee')}>
              Refusés
            </Button>
            <Button size="sm" variant={filtreStatut === 'toutes' ? 'default' : 'outline'}
              onClick={() => setFiltreStatut('toutes')}>
              Toutes
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tableau */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Type</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Montant</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Utilisateur</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Référence</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Statut</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {transactionsFiltrees.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                      Aucune transaction trouvée
                    </td>
                  </tr>
                ) : transactionsFiltrees.map(t => {
                  const estPrecontrat = t.description?.includes('precontrat')
                  return (
                    <tr key={t.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <Badge variant={t.type === 'depot' ? 'default' : 'secondary'} className="text-xs">
                          {t.type === 'depot' ? 'Dépôt' : t.type === 'mise_en_sequestre' ? 'Séquestre' : t.type}
                        </Badge>
                        {estPrecontrat && (
                          <Badge className="bg-purple-100 text-purple-700 ml-1 text-xs">Précontrat</Badge>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-semibold text-sm">{t.montant?.toLocaleString('fr-FR')} FCFA</span>
                        {t.montantCommission && (
                          <p className="text-xs text-muted-foreground">Commission: {t.montantCommission} FCFA</p>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm font-medium">{t.portefeuille?.utilisateur?.prenom} {t.portefeuille?.utilisateur?.nom}</p>
                        <p className="text-xs text-muted-foreground">{t.portefeuille?.utilisateur?.email}</p>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-700">{t.reference}</td>
                      <td className="px-4 py-3 text-xs text-gray-700">{new Date(t.createdAt).toLocaleDateString('fr-FR')}</td>
                      <td className="px-4 py-3">
                        <Badge className={
                          t.statut === 'en_attente' ? 'bg-yellow-100 text-yellow-700' :
                          t.statut === 'validee' ? 'bg-green-100 text-green-700' :
                          'bg-red-100 text-red-700'
                        }>
                          {t.statut === 'en_attente' ? 'En attente' : t.statut === 'validee' ? 'Validé' : 'Refusé'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-2">
                          {t.justificatifUrl && (
                            <Button size="sm" variant="ghost" title="Voir le justificatif"
                              onClick={() => voirJustificatif(t)}>
                              <FileText className="w-4 h-4 text-[#3B82F6]" />
                            </Button>
                          )}
                          {t.statut === 'en_attente' && (
                            <>
                              <Button size="sm" variant="ghost" title="Valider le paiement"
                                onClick={() => valider(t, 'valider_transaction')}>
                                <CheckCircle className="w-4 h-4 text-green-600" />
                              </Button>
                              <Button size="sm" variant="ghost" title="Refuser le paiement"
                                onClick={() => valider(t, 'refuser_transaction')}>
                                <XCircle className="w-4 h-4 text-red-600" />
                              </Button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Modal justificatif */}
      <Dialog open={!!justificatifModal} onOpenChange={(open) => !open && setJustificatifModal(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Justificatif de paiement</DialogTitle>
            <DialogDescription>
              Transaction : {justificatifModal?.reference} — Montant : {justificatifModal?.montant?.toLocaleString('fr-FR')} FCFA
            </DialogDescription>
          </DialogHeader>
          {justificatifModal?.justificatifUrl && (
            <div className="space-y-3">
              {justificatifModal.justificatifUrl.match(/\.(jpg|jpeg|png|gif)$/i) ? (
                <img src={justificatifModal.justificatifUrl} alt="Justificatif" className="w-full rounded border" />
              ) : justificatifModal.justificatifUrl.match(/\.pdf$/i) ? (
                <div className="text-center p-8 border rounded">
                  <FileText className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground mb-3">Document PDF</p>
                  <Button onClick={() => window.open(justificatifModal.justificatifUrl, '_blank')}>
                    <FileText className="w-4 h-4 mr-2" /> Télécharger le PDF
                  </Button>
                </div>
              ) : (
                <div className="text-center p-8 border rounded">
                  <p className="text-sm text-muted-foreground">Format de fichier non supporté pour l'aperçu</p>
                  <Button className="mt-3" onClick={() => window.open(justificatifModal.justificatifUrl, '_blank')}>
                    Télécharger le fichier
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ============================================================
// Page Admin - Contrôle jalons
// ============================================================
function AdminControleJalons() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-[#1E293B]">Contrôle des jalons</h1>
      <Card><CardContent className="p-8 text-center text-muted-foreground">
        Les jalons validés par les clients apparaissent ici pour le contrôle final de l'administrateur avant le déblocage des fonds.
      </CardContent></Card>
    </div>
  )
}

// ============================================================
// Page Litiges
// ============================================================
function LitigesPage() {
  const { user } = useAppStore()
  const [litiges, setLitiges] = useState<any[]>([])
  const [showNew, setShowNew] = useState(false)
  const [form, setForm] = useState({ contratId: '', jalonId: '', motif: '', defendeurId: '' })

  useEffect(() => {
    fetch('/api/litiges').then(r => r.json()).then(d => setLitiges(Array.isArray(d) ? d : []))
  }, [])

  const ouvrirLitige = async () => {
    await fetch('/api/litiges', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, plaignantId: user?.id })
    })
    toast.success('Litige ouvert')
    setShowNew(false)
    fetch('/api/litiges').then(r => r.json()).then(d => setLitiges(Array.isArray(d) ? d : []))
  }

  const arbitrer = async (id: string, decision: string) => {
    await fetch('/api/litiges', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, decision, commentaireDecision: `Décision: ${decision}` })
    })
    toast.success('Décision rendue')
    fetch('/api/litiges').then(r => r.json()).then(d => setLitiges(Array.isArray(d) ? d : []))
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-[#1E293B]">Litiges</h1>
        {user?.role !== 'administrateur' && (
          <Button onClick={() => setShowNew(true)} className="bg-red-600">
            <AlertTriangle className="w-4 h-4 mr-2" /> Ouvrir un litige
          </Button>
        )}
      </div>

      {litiges.length === 0 ? (
        <Card><CardContent className="p-8 text-center text-muted-foreground">Aucun litige</CardContent></Card>
      ) : litiges.map(l => (
        <Card key={l.id}>
          <CardContent className="p-4">
            <div className="flex justify-between items-start">
              <div>
                <div className="flex items-center gap-2">
                  <Badge variant={l.statut === 'resolu' ? 'default' : 'destructive'}>{l.statut === 'resolu' ? 'Résolu' : 'En cours'}</Badge>
                  <span className="font-medium">{l.contrat?.projet?.titre}</span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">{l.motif}</p>
                <p className="text-xs text-muted-foreground">Plaignant : {l.plaignant?.prenom} {l.plaignant?.nom} | Défendeur : {l.defendeur?.prenom} {l.defendeur?.nom}</p>
                {l.decision && <p className="text-sm font-medium mt-1">Décision : {l.decision}</p>}
              </div>
              {user?.role === 'administrateur' && l.statut !== 'resolu' && (
                <div className="flex gap-2">
                  <Button size="sm" className="bg-green-600" onClick={() => arbitrer(l.id, 'liberation_freelance')}>Libérer freelance</Button>
                  <Button size="sm" className="bg-blue-600" onClick={() => arbitrer(l.id, 'remboursement_client')}>Rembourser client</Button>
                  <Button size="sm" className="bg-yellow-600" onClick={() => arbitrer(l.id, 'partage')}>Partage</Button>
                  <Button size="sm" variant="outline" onClick={() => arbitrer(l.id, 'classe_sans_suite')}>Classé</Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}

      <Dialog open={showNew} onOpenChange={setShowNew}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Ouvrir un litige</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Motif *</Label><Textarea value={form.motif} onChange={e => setForm({...form, motif: e.target.value})} /></div>
            <div><Label>ID Contrat</Label><Input value={form.contratId} onChange={e => setForm({...form, contratId: e.target.value})} /></div>
            <div><Label>ID Défendeur</Label><Input value={form.defendeurId} onChange={e => setForm({...form, defendeurId: e.target.value})} /></div>
            <Button onClick={ouvrirLitige} className="w-full bg-red-600">Ouvrir le litige</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ============================================================
// Page Admin - Utilisateurs
// ============================================================
// Page Admin - Utilisateurs (Tableau avec pagination)
// ============================================================
function AdminUtilisateurs() {
  const { setProfileViewerId } = useAppStore()
  const [utilisateurs, setUtilisateurs] = useState<any[]>([])
  const [filteredUsers, setFilteredUsers] = useState<any[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 15

  useEffect(() => {
    fetch('/api/admin?type=utilisateurs').then(r => r.json()).then(d => {
      const users = Array.isArray(d) ? d : []
      setUtilisateurs(users)
      setFilteredUsers(users)
    })
  }, [])

  // Recherche utilisateur
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredUsers(utilisateurs)
      setCurrentPage(1)
      return
    }
    const term = searchTerm.toLowerCase()
    const filtered = utilisateurs.filter(u =>
      u.prenom?.toLowerCase().includes(term) ||
      u.nom?.toLowerCase().includes(term) ||
      u.email?.toLowerCase().includes(term) ||
      u.role?.toLowerCase().includes(term)
    )
    setFilteredUsers(filtered)
    setCurrentPage(1)
  }, [searchTerm, utilisateurs])

  // Pagination
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentUsers = filteredUsers.slice(startIndex, endIndex)

  const toggleSuspension = async (userId: string, currentStatus: boolean) => {
    const action = currentStatus ? 'suspendre' : 'reactiver'
    const confirmed = confirm(`Voulez-vous ${action} cet utilisateur ?`)
    if (!confirmed) return

    try {
      const res = await fetch('/api/admin', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, userId })
      })
      const data = await res.json()
      if (data.erreur) {
        toast.error(data.erreur)
      } else {
        toast.success(`Utilisateur ${action === 'suspendre' ? 'suspendu' : 'réactivé'}`)
        setUtilisateurs(prev => prev.map(u => u.id === userId ? { ...u, estActif: !currentStatus } : u))
      }
    } catch {
      toast.error('Erreur lors de la modification')
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-[#1E293B]">Gestion des utilisateurs</h1>
        <p className="text-sm text-muted-foreground">{filteredUsers.length} utilisateur(s) trouvé(s)</p>
      </div>

      {/* Barre de recherche */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-2">
            <Input
              placeholder="🔍 Rechercher un utilisateur (nom, prénom, email, rôle)..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="flex-1"
            />
            {searchTerm && (
              <Button variant="outline" onClick={() => setSearchTerm('')}>
                <XCircle className="w-4 h-4 mr-1" /> Effacer
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Tableau des utilisateurs */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">N°</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Utilisateur</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Email</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Rôle</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Statut</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {currentUsers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                      Aucun utilisateur trouvé
                    </td>
                  </tr>
                ) : currentUsers.map((u, idx) => (
                  <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-sm text-gray-900">{startIndex + idx + 1}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9 cursor-pointer hover:ring-2 hover:ring-[#3B82F6] transition-all"
                          onClick={() => u.id && setProfileViewerId(u.id)}>
                          <AvatarFallback className="bg-gradient-to-br from-[#1E3A8A] to-[#3B82F6] text-white text-xs">
                            {u.prenom?.[0]}{u.nom?.[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-sm cursor-pointer hover:text-[#3B82F6] transition-colors"
                            onClick={() => u.id && setProfileViewerId(u.id)}>
                            {u.prenom} {u.nom}
                          </p>
                          <p className="text-xs text-muted-foreground">{u.telephone || 'N/A'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">{u.email}</td>
                    <td className="px-4 py-3">
                      <Badge className={
                        u.role === 'administrateur' ? 'bg-purple-100 text-purple-700' :
                        u.role === 'freelance' ? 'bg-blue-100 text-blue-700' :
                        'bg-green-100 text-green-700'
                      }>
                        {u.role === 'administrateur' ? 'Admin' : u.role === 'freelance' ? 'Freelance' : 'Client'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={u.estActif ? 'default' : 'destructive'} className={u.estActif ? 'bg-green-100 text-green-700' : ''}>
                        {u.estActif ? 'Actif' : 'Suspendu'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-2">
                        <Button size="sm" variant="ghost" title="Voir le profil"
                          onClick={() => u.id && setProfileViewerId(u.id)}>
                          <Eye className="w-4 h-4 text-[#3B82F6]" />
                        </Button>
                        {u.estActif ? (
                          <Button size="sm" variant="ghost" title="Suspendre l'utilisateur"
                            onClick={() => toggleSuspension(u.id, true)}>
                            <XCircle className="w-4 h-4 text-red-600" />
                          </Button>
                        ) : (
                          <Button size="sm" variant="ghost" title="Réactiver l'utilisateur"
                            onClick={() => toggleSuspension(u.id, false)}>
                            <CheckCircle className="w-4 h-4 text-green-600" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="border-t p-4 flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Page {currentPage} sur {totalPages} — {filteredUsers.length} utilisateur(s) au total
              </p>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" disabled={currentPage === 1}
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}>
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <span className="flex items-center px-3 text-sm font-medium">{currentPage}</span>
                <Button size="sm" variant="outline" disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}>
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

// ============================================================
// Composant CompetencesInput — saisie libre + bouton +, insensible à la casse
// ============================================================
function CompetencesInput({ valeurs, onChange }: { valeurs: string[]; onChange: (v: string[]) => void }) {
  const [inputVal, setInputVal] = useState('')

  const ajouter = () => {
    const val = inputVal.trim()
    if (!val) return
    // Insensible à la casse : on vérifie si déjà présent
    const existe = valeurs.some(v => v.toLowerCase() === val.toLowerCase())
    if (existe) { toast.info('Cette compétence est déjà ajoutée'); return }
    onChange([...valeurs, val])
    setInputVal('')
  }

  const supprimer = (idx: number) => {
    onChange(valeurs.filter((_, i) => i !== idx))
  }

  return (
    <div className="space-y-2 mt-1">
      <div className="flex gap-2">
        <Input
          value={inputVal}
          onChange={e => setInputVal(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); ajouter() } }}
          placeholder="Ex: PHP, React, Python..."
          className="flex-1"
        />
        <Button type="button" size="sm" onClick={ajouter}
          className="bg-gradient-to-r from-[#1E3A8A] to-[#3B82F6] shrink-0">
          <Plus className="w-4 h-4" />
        </Button>
      </div>
      {valeurs.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {valeurs.map((v, i) => (
            <Badge key={i} variant="secondary" className="flex items-center gap-1 pr-1">
              {v}
              <button
                type="button"
                onClick={() => supprimer(i)}
                className="ml-1 hover:bg-red-100 hover:text-red-700 rounded-full w-4 h-4 flex items-center justify-center text-xs font-bold">
                ×
              </button>
            </Badge>
          ))}
        </div>
      )}
      {valeurs.length === 0 && (
        <p className="text-xs text-muted-foreground">Aucune compétence. Saisissez un nom et cliquez sur +</p>
      )}
    </div>
  )
}

// ============================================================
// Composants utilitaires
// ============================================================
function StatCard({ icon: Icon, label, value, color }: { icon: any; label: string; value: string | number; color: string }) {
  const colors: any = {
    blue: 'from-[#1E3A8A] to-[#3B82F6]',
    green: 'from-green-600 to-green-400',
    orange: 'from-orange-600 to-orange-400',
    purple: 'from-purple-600 to-purple-400',
    red: 'from-red-600 to-red-400',
  }
  return (
    <Card>
      <CardContent className="p-4 flex items-center gap-3">
        <div className={`h-12 w-12 rounded-lg bg-gradient-to-br ${colors[color]} flex items-center justify-center shrink-0`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="text-2xl font-bold text-[#1E293B]">{value}</p>
        </div>
      </CardContent>
    </Card>
  )
}

function QuickActionsClient() {
  const { setCurrentView } = useAppStore()
  return (
    <Card>
      <CardHeader><CardTitle className="text-lg">Actions rapides</CardTitle></CardHeader>
      <CardContent className="flex gap-3 flex-wrap">
        <Button variant="outline" onClick={() => setCurrentView('projets')} className="border-[#3B82F6] text-[#3B82F6]">
          <Plus className="w-4 h-4 mr-2" /> Créer un projet
        </Button>
        <Button variant="outline" onClick={() => setCurrentView('candidatures')} className="border-[#3B82F6] text-[#3B82F6]">
          <FileText className="w-4 h-4 mr-2" /> Voir les candidatures
        </Button>
        <Button variant="outline" onClick={() => setCurrentView('portefeuille')} className="border-[#3B82F6] text-[#3B82F6]">
          <Wallet className="w-4 h-4 mr-2" /> Mon portefeuille
        </Button>
      </CardContent>
    </Card>
  )
}
