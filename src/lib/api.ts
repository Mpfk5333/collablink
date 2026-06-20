import axios, { AxiosInstance, AxiosError } from 'axios'

// Configuration du client API
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'

// Types pour les réponses API
export interface ApiResponse<T> {
  success: boolean
  data?: T
  message?: string
  errors?: Record<string, string[]>
}

export interface PaginatedResponse<T> {
  data: T[]
  current_page: number
  last_page: number
  per_page: number
  total: number
}

// Créer une instance Axios configurée
const createApiClient = (): AxiosInstance => {
  const client = axios.create({
    baseURL: API_BASE_URL,
    withCredentials: true,
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
  })

  // Intercepteur pour ajouter le token d'authentification
  client.interceptors.request.use((config) => {
    const token = localStorage.getItem('api_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  })

  // Intercepteur pour gérer les erreurs
  client.interceptors.response.use(
    (response) => response,
    (error: AxiosError) => {
      if (error.response?.status === 401) {
        localStorage.removeItem('api_token')
        localStorage.removeItem('user')
        window.location.href = '/login'
      }
      return Promise.reject(error)
    }
  )

  return client
}

export const apiClient = createApiClient()

// Services d'authentification
export const authService = {
  login: (email: string, password: string) =>
    apiClient.post<ApiResponse<{ token: string; user: any }>>('/auth/login', {
      email,
      password,
    }),

  register: (data: {
    nom: string
    prenom: string
    email: string
    password: string
    role: 'client' | 'freelance'
  }) =>
    apiClient.post<ApiResponse<{ token: string; user: any }>>('/auth/register', data),

  logout: () => apiClient.post('/auth/logout'),

  me: () => apiClient.get('/auth/me'),

  updateProfile: (data: any) => apiClient.put('/auth/profile', data),

  updatePassword: (data: { current_password: string; password: string }) =>
    apiClient.put('/auth/password', data),

  uploadAvatar: (file: File) => {
    const formData = new FormData()
    formData.append('avatar', file)
    return apiClient.post('/auth/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },

  uploadSignature: (file: File) => {
    const formData = new FormData()
    formData.append('signature', file)
    return apiClient.post('/auth/signature', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },

  forgotPassword: (email: string) =>
    apiClient.post('/auth/forgot-password', { email }),

  resetPassword: (data: {
    token: string
    email: string
    password: string
  }) => apiClient.post('/auth/reset-password', data),
}

// Services Utilisateurs
export const utilisateurService = {
  list: () => apiClient.get<ApiResponse<any[]>>('/utilisateurs'),

  get: (id: string) => apiClient.get<ApiResponse<any>>(`/utilisateurs/${id}`),

  update: (id: string, data: any) =>
    apiClient.put<ApiResponse<any>>(`/utilisateurs/${id}`, data),

  delete: (id: string) => apiClient.delete(`/utilisateurs/${id}`),

  toggleActif: (id: string) =>
    apiClient.patch(`/utilisateurs/${id}/toggle-actif`),
}

// Services Profil
export const profilService = {
  me: () => apiClient.get('/profil'),

  updateClient: (data: any) => apiClient.put('/profil/client', data),

  updateFreelance: (data: any) => apiClient.put('/profil/freelance', data),

  addExperience: (data: any) => apiClient.post('/profil/experiences', data),

  updateExperience: (id: string, data: any) =>
    apiClient.put(`/profil/experiences/${id}`, data),

  deleteExperience: (id: string) =>
    apiClient.delete(`/profil/experiences/${id}`),
}

// Services Freelances
export const freelanceService = {
  search: (params: any) =>
    apiClient.get<ApiResponse<PaginatedResponse<any>>>('/freelances/search', {
      params,
    }),

  recommandations: () =>
    apiClient.get<ApiResponse<any[]>>('/freelances/recommandations'),

  get: (id: string) => apiClient.get<ApiResponse<any>>(`/freelances/${id}`),
}

// Services Compétences
export const competenceService = {
  categories: () => apiClient.get<ApiResponse<any[]>>('/categories'),

  createCategory: (data: any) =>
    apiClient.post<ApiResponse<any>>('/categories', data),

  list: () => apiClient.get<ApiResponse<any[]>>('/competences'),

  create: (data: any) => apiClient.post<ApiResponse<any>>('/competences', data),

  attachToProfile: (data: any) =>
    apiClient.post('/profil/competences', data),

  detachFromProfile: (id: string) =>
    apiClient.delete(`/profil/competences/${id}`),
}

// Services Projets
export const projetService = {
  list: () => apiClient.get<ApiResponse<any[]>>('/projets'),

  create: (data: any) => apiClient.post<ApiResponse<any>>('/projets', data),

  get: (id: string) => apiClient.get<ApiResponse<any>>(`/projets/${id}`),

  update: (id: string, data: any) =>
    apiClient.put<ApiResponse<any>>(`/projets/${id}`, data),

  delete: (id: string) => apiClient.delete(`/projets/${id}`),

  publish: (id: string) =>
    apiClient.post(`/projets/${id}/publier`, {}),

  uploadCahierCharges: (id: string, file: File) => {
    const formData = new FormData()
    formData.append('cahier_charges', file)
    return apiClient.post(`/projets/${id}/cahier-charges`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },

  downloadCahierCharges: (id: string) =>
    apiClient.get(`/projets/${id}/download-cahier`, {
      responseType: 'blob',
    }),
}

// Services Propositions
export const propositionService = {
  list: () => apiClient.get<ApiResponse<any[]>>('/propositions'),

  create: (projetId: string, data: any) =>
    apiClient.post<ApiResponse<any>>(`/projets/${projetId}/propositions`, data),

  update: (id: string, data: any) =>
    apiClient.put<ApiResponse<any>>(`/propositions/${id}`, data),

  accept: (id: string) =>
    apiClient.post(`/propositions/${id}/accepter`, {}),

  refuse: (id: string) =>
    apiClient.post(`/propositions/${id}/refuser`, {}),
}

// Services Propositions IA
export const propositionIAService = {
  create: (projetId: string, data: any) =>
    apiClient.post(`/projets/${projetId}/propositions-ia`, data),

  received: () =>
    apiClient.get<ApiResponse<any[]>>('/propositions-ia/recues'),

  sent: () =>
    apiClient.get<ApiResponse<any[]>>('/propositions-ia/envoyees'),

  negotiate: (id: string, data: any) =>
    apiClient.post(`/propositions-ia/${id}/negocier`, data),

  validate: (id: string) =>
    apiClient.post(`/propositions-ia/${id}/valider`, {}),

  refuse: (id: string) =>
    apiClient.post(`/propositions-ia/${id}/refuser`, {}),

  acceptNegotiation: (id: string) =>
    apiClient.post(`/propositions-ia/${id}/accepter-negociation`, {}),

  refuseNegotiation: (id: string) =>
    apiClient.post(`/propositions-ia/${id}/refuser-negociation`, {}),
}

// Services Portefeuille
export const portefeuilleService = {
  get: () => apiClient.get('/portefeuille'),

  deposit: (data: any) => apiClient.post('/portefeuille/depot', data),

  withdraw: (data: any) => apiClient.post('/portefeuille/retrait', data),

  transactions: () =>
    apiClient.get<ApiResponse<any[]>>('/transactions'),

  uploadReceipt: (transactionId: string, file: File) => {
    const formData = new FormData()
    formData.append('justificatif', file)
    return apiClient.post(
      `/transactions/${transactionId}/justificatif`,
      formData,
      {
        headers: { 'Content-Type': 'multipart/form-data' },
      }
    )
  },

  validateTransaction: (id: string) =>
    apiClient.post(`/transactions/${id}/valider`, {}),

  rejectTransaction: (id: string) =>
    apiClient.post(`/transactions/${id}/rejeter`, {}),
}

// Services Contrats
export const contratService = {
  list: () => apiClient.get<ApiResponse<any[]>>('/contrats'),

  create: (data: any) => apiClient.post<ApiResponse<any>>('/contrats', data),

  get: (id: string) => apiClient.get<ApiResponse<any>>(`/contrats/${id}`),

  update: (id: string, data: any) =>
    apiClient.put<ApiResponse<any>>(`/contrats/${id}`, data),

  delete: (id: string) => apiClient.delete(`/contrats/${id}`),

  sign: (id: string, signature: string) =>
    apiClient.post(`/contrats/${id}/signer`, { signature }),

  terminate: (id: string, reason: string) =>
    apiClient.post(`/contrats/${id}/terminer`, { reason }),
}

// Services Jalons
export const jalonService = {
  list: (contratId: string) =>
    apiClient.get<ApiResponse<any[]>>(`/contrats/${contratId}/jalons`),

  create: (contratId: string, data: any) =>
    apiClient.post<ApiResponse<any>>(`/contrats/${contratId}/jalons`, data),

  validate: (id: string) =>
    apiClient.post(`/jalons/${id}/valider`, {}),

  reject: (id: string, reason: string) =>
    apiClient.post(`/jalons/${id}/refuser`, { reason }),
}

// Services Messagerie
export const messagerieService = {
  conversations: () =>
    apiClient.get<ApiResponse<any[]>>('/conversations'),

  createConversation: (data: any) =>
    apiClient.post<ApiResponse<any>>('/conversations', data),

  messages: (conversationId: string) =>
    apiClient.get<ApiResponse<any[]>>(`/conversations/${conversationId}/messages`),

  sendMessage: (conversationId: string, content: string) =>
    apiClient.post(`/conversations/${conversationId}/messages`, {
      contenu: content,
    }),
}

// Services Notifications
export const notificationService = {
  list: () => apiClient.get<ApiResponse<any[]>>('/notifications'),

  markAsRead: (id: string) =>
    apiClient.post(`/notifications/${id}/lire`, {}),

  markAllAsRead: () =>
    apiClient.post('/notifications/marquer-tout-lu', {}),

  delete: (id: string) => apiClient.delete(`/notifications/${id}`),
}

// Services Litiges
export const litigeService = {
  list: () => apiClient.get<ApiResponse<any[]>>('/litiges'),

  create: (data: any) => apiClient.post<ApiResponse<any>>('/litiges', data),

  get: (id: string) => apiClient.get<ApiResponse<any>>(`/litiges/${id}`),

  update: (id: string, data: any) =>
    apiClient.put<ApiResponse<any>>(`/litiges/${id}`, data),

  resolve: (id: string, data: any) =>
    apiClient.post(`/litiges/${id}/resoudre`, data),

  close: (id: string) => apiClient.post(`/litiges/${id}/fermer`, {}),
}

// Services Évaluations
export const evaluationService = {
  create: (data: any) =>
    apiClient.post<ApiResponse<any>>('/evaluations', data),

  list: () => apiClient.get<ApiResponse<any[]>>('/evaluations'),

  get: (id: string) => apiClient.get<ApiResponse<any>>(`/evaluations/${id}`),
}

export default apiClient
