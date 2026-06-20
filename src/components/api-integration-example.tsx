'use client'

import { useEffect, useState } from 'react'
import { authService, apiClient } from '@/lib/api'
import { User, ApiResponse } from '@/lib/types'

/**
 * Exemple de composant React utilisant les services API
 * Démontre l'intégration frontend/backend
 */
export default function ApiIntegrationExample() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  // Vérifier si l'utilisateur est authentifié au chargement
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('api_token')
      if (token) {
        try {
          const response = await authService.me()
          setUser(response.data.data)
          setIsAuthenticated(true)
        } catch (err) {
          localStorage.removeItem('api_token')
          setIsAuthenticated(false)
        }
      }
    }

    checkAuth()
  }, [])

  /**
   * Exemple: S'enregistrer
   */
  const handleRegister = async () => {
    setLoading(true)
    setError(null)
    try {
      const timestamp = Date.now()
      const response = await authService.register({
        nom: 'Dupont',
        prenom: 'Jean',
        email: `jean${timestamp}@example.com`,
        password: 'Password123!',
        role: 'client',
      })

      if (response.data.data?.token) {
        localStorage.setItem('api_token', response.data.data.token)
        setUser(response.data.data.user)
        setIsAuthenticated(true)
      }
    } catch (err: any) {
      setError(
        err.response?.data?.message || 'Erreur lors de l\'enregistrement'
      )
    } finally {
      setLoading(false)
    }
  }

  /**
   * Exemple: Se connecter
   */
  const handleLogin = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await authService.login(
        'jean1234567890@example.com',
        'Password123!'
      )

      if (response.data.data?.token) {
        localStorage.setItem('api_token', response.data.data.token)
        setUser(response.data.data.user)
        setIsAuthenticated(true)
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur de connexion')
    } finally {
      setLoading(false)
    }
  }

  /**
   * Exemple: Se déconnecter
   */
  const handleLogout = async () => {
    try {
      await authService.logout()
    } finally {
      localStorage.removeItem('api_token')
      setUser(null)
      setIsAuthenticated(false)
    }
  }

  /**
   * Exemple: Tester une requête GET
   */
  const handleTestGetRequest = async () => {
    if (!isAuthenticated) {
      setError('Vous devez être connecté')
      return
    }

    setLoading(true)
    setError(null)
    try {
      // Récupérer les utilisateurs
      const response = await apiClient.get('/utilisateurs')
      console.log('Utilisateurs:', response.data)
      setError(null)
    } catch (err: any) {
      setError('Erreur: ' + (err.response?.data?.message || err.message))
    } finally {
      setLoading(false)
    }
  }

  /**
   * Exemple: Tester une requête POST
   */
  const handleTestPostRequest = async () => {
    if (!isAuthenticated) {
      setError('Vous devez être connecté')
      return
    }

    setLoading(true)
    setError(null)
    try {
      // Créer un projet
      const response = await apiClient.post('/projets', {
        titre: 'Mon Projet Test',
        description: 'Description du projet de test',
        budget: 5000,
        typeContrat: 'forfait',
        dureeEstimee: '2 mois',
      })
      console.log('Projet créé:', response.data)
      setError(null)
    } catch (err: any) {
      setError('Erreur: ' + (err.response?.data?.message || err.message))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow">
      <h1 className="text-3xl font-bold mb-6">Test d'Intégration API</h1>

      {/* Status */}
      <div className="mb-6 p-4 bg-gray-100 rounded">
        <h2 className="font-semibold mb-2">Status</h2>
        <p>
          Backend:{' '}
          <span className="font-bold text-green-600">✅ Opérationnel</span>
        </p>
        <p>
          Frontend:{' '}
          <span className="font-bold text-green-600">✅ Opérationnel</span>
        </p>
        <p>
          Authentification:{' '}
          <span
            className={`font-bold ${isAuthenticated ? 'text-green-600' : 'text-red-600'}`}
          >
            {isAuthenticated ? '✅ Connecté' : '❌ Non connecté'}
          </span>
        </p>
      </div>

      {/* Utilisateur */}
      {isAuthenticated && user && (
        <div className="mb-6 p-4 bg-blue-50 rounded">
          <h2 className="font-semibold mb-2">Utilisateur Actuel</h2>
          <p>
            <strong>Nom:</strong> {user.prenom} {user.nom}
          </p>
          <p>
            <strong>Email:</strong> {user.email}
          </p>
          <p>
            <strong>Rôle:</strong> {user.role}
          </p>
        </div>
      )}

      {/* Erreur */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded">
          <p className="text-red-700">
            <strong>Erreur:</strong> {error}
          </p>
        </div>
      )}

      {/* Boutons */}
      <div className="space-y-3">
        {!isAuthenticated ? (
          <>
            <button
              onClick={handleRegister}
              disabled={loading}
              className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:bg-gray-400"
            >
              {loading ? 'Enregistrement...' : 'S\'enregistrer'}
            </button>
            <button
              onClick={handleLogin}
              disabled={loading}
              className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700 disabled:bg-gray-400"
            >
              {loading ? 'Connexion...' : 'Se connecter'}
            </button>
          </>
        ) : (
          <>
            <button
              onClick={handleTestGetRequest}
              disabled={loading}
              className="w-full bg-purple-600 text-white py-2 rounded hover:bg-purple-700 disabled:bg-gray-400"
            >
              {loading ? 'Chargement...' : 'Tester GET (Utilisateurs)'}
            </button>
            <button
              onClick={handleTestPostRequest}
              disabled={loading}
              className="w-full bg-orange-600 text-white py-2 rounded hover:bg-orange-700 disabled:bg-gray-400"
            >
              {loading ? 'Chargement...' : 'Tester POST (Créer Projet)'}
            </button>
            <button
              onClick={handleLogout}
              disabled={loading}
              className="w-full bg-red-600 text-white py-2 rounded hover:bg-red-700 disabled:bg-gray-400"
            >
              Se déconnecter
            </button>
          </>
        )}
      </div>

      {/* Info */}
      <div className="mt-6 p-4 bg-gray-50 rounded text-sm text-gray-600">
        <h3 className="font-semibold mb-2">ℹ️ Guide d'utilisation</h3>
        <ol className="list-decimal list-inside space-y-1">
          <li>Cliquez sur "S'enregistrer" pour créer un compte test</li>
          <li>Une fois connecté, testez les requêtes GET et POST</li>
          <li>Consultez la console du navigateur (F12) pour voir les réponses</li>
          <li>Vérifiez les logs dans le terminal du backend</li>
        </ol>
      </div>
    </div>
  )
}
