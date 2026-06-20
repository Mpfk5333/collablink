import { create } from 'zustand'

interface User {
  id: string
  email: string
  nom: string
  prenom: string
  role: string
  photoUrl?: string | null
  profilClient?: any
  profilFreelance?: any
  portefeuille?: any
}

interface AppState {
  user: User | null
  currentView: string
  sidebarOpen: boolean
  // Profil viewer global (style Facebook - cliquer sur un avatar ouvre le profil)
  profileViewerId: string | null
  setUser: (user: User | null) => void
  setCurrentView: (view: string) => void
  setSidebarOpen: (open: boolean) => void
  setProfileViewerId: (id: string | null) => void
}

export const useAppStore = create<AppState>((set) => ({
  user: null,
  currentView: 'dashboard',
  sidebarOpen: true,
  profileViewerId: null,
  setUser: (user) => set({ user }),
  setCurrentView: (currentView) => set({ currentView }),
  setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
  setProfileViewerId: (profileViewerId) => set({ profileViewerId }),
}))
