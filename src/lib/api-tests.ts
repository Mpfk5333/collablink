// Test de communication entre le frontend et le backend
// Ce fichier teste les endpoints API de base

import { apiClient, authService } from '@/lib/api'

/**
 * Test la route de santé de l'API
 */
export async function testHealthEndpoint() {
  try {
    const response = await apiClient.get('/health')
    console.log('✅ Health Check:', response.data)
    return true
  } catch (error) {
    console.error('❌ Health Check Failed:', error)
    return false
  }
}

/**
 * Test l'enregistrement d'un nouvel utilisateur
 */
export async function testRegisterEndpoint(
  email: string = 'test@example.com',
  password: string = 'Test123456!'
) {
  try {
    const response = await authService.register({
      nom: 'Test',
      prenom: 'User',
      email,
      password,
      role: 'client',
    })
    console.log('✅ Register Success:', response.data)
    return response.data
  } catch (error: any) {
    console.error('❌ Register Failed:', error.response?.data || error.message)
    return null
  }
}

/**
 * Test la connexion d'un utilisateur
 */
export async function testLoginEndpoint(
  email: string = 'test@example.com',
  password: string = 'Test123456!'
) {
  try {
    const response = await authService.login(email, password)
    console.log('✅ Login Success:', response.data)

    // Sauvegarder le token
    if (response.data.data?.token) {
      localStorage.setItem('api_token', response.data.data.token)
      localStorage.setItem('user', JSON.stringify(response.data.data.user))
    }

    return response.data
  } catch (error: any) {
    console.error('❌ Login Failed:', error.response?.data || error.message)
    return null
  }
}

/**
 * Test la récupération du profil utilisateur
 */
export async function testGetProfileEndpoint() {
  try {
    const response = await authService.me()
    console.log('✅ Get Profile Success:', response.data)
    return response.data
  } catch (error: any) {
    console.error('❌ Get Profile Failed:', error.response?.data || error.message)
    return null
  }
}

/**
 * Exécute tous les tests de communication
 */
export async function runAllTests() {
  console.log('🚀 Starting API Communication Tests\n')

  console.log('1️⃣ Testing Health Endpoint...')
  const healthOk = await testHealthEndpoint()

  if (!healthOk) {
    console.log('\n❌ Backend is not accessible. Make sure the Laravel server is running.')
    return
  }

  console.log('\n2️⃣ Testing Register Endpoint...')
  const timestamp = Date.now()
  const registerResult = await testRegisterEndpoint(
    `testuser${timestamp}@example.com`,
    'Test123456!'
  )

  if (!registerResult) {
    console.log('\n⚠️ Registration test failed. Skipping login test.')
    return
  }

  console.log('\n3️⃣ Testing Login Endpoint...')
  const loginResult = await testLoginEndpoint(
    `testuser${timestamp}@example.com`,
    'Test123456!'
  )

  if (!loginResult) {
    console.log('\n❌ Login test failed.')
    return
  }

  console.log('\n4️⃣ Testing Get Profile Endpoint...')
  await testGetProfileEndpoint()

  console.log('\n✅ All tests completed!')
}

export default runAllTests
