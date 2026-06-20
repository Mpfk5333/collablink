import { NextRequest, NextResponse } from 'next/server'

const LARAVEL_API_URL = process.env.LARAVEL_API_URL || 'http://localhost:8000/api'

// Helpers for key conversions
function toCamel(s: string): string {
  return s.replace(/([-_][a-z])/ig, ($1) => {
    return $1.toUpperCase()
      .replace('-', '')
      .replace('_', '');
  });
}

function toSnake(s: string): string {
  return s.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
}

export function keysToCamel(obj: any): any {
  if (Array.isArray(obj)) {
    return obj.map(v => keysToCamel(v));
  } else if (obj !== null && obj !== undefined && typeof obj === 'object') {
    if (obj instanceof Date || obj instanceof RegExp) {
      return obj;
    }
    // Check if it's standard object
    if (obj.constructor === Object || !obj.constructor) {
      return Object.keys(obj).reduce(
        (result, key) => ({
          ...result,
          [toCamel(key)]: keysToCamel(obj[key]),
        }),
        {},
      );
    }
  }
  return obj;
}

export function keysToSnake(obj: any): any {
  if (Array.isArray(obj)) {
    return obj.map(v => keysToSnake(v));
  } else if (obj !== null && obj !== undefined && typeof obj === 'object') {
    if (obj instanceof Date || obj instanceof RegExp) {
      return obj;
    }
    if (obj.constructor === Object || !obj.constructor) {
      return Object.keys(obj).reduce(
        (result, key) => ({
          ...result,
          [toSnake(key)]: keysToSnake(obj[key]),
        }),
        {},
      );
    }
  }
  return obj;
}

export async function laravelRequest(
  req: NextRequest,
  path: string,
  options: {
    method?: string
    body?: any
    headers?: Record<string, string>
    searchParams?: URLSearchParams
  } = {}
) {
  const method = options.method || req.method
  let token = req.cookies.get('api_token')?.value || ''

  // Fallback check in Auth header
  const authHeader = req.headers.get('Authorization')
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7)
  }

  const headers: Record<string, string> = {
    'Accept': 'application/json',
    ...options.headers
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  let body = options.body
  const contentType = req.headers.get('content-type') || ''

  if (body === undefined && ['POST', 'PUT', 'PATCH'].includes(method)) {
    if (contentType.includes('application/json')) {
      try {
        const jsonBody = await req.json()
        // Automatically convert camelCase payload to snake_case for Laravel
        body = keysToSnake(jsonBody)
      } catch (e) {
        // Body might be empty
      }
    }
  } else if (body !== undefined && typeof body === 'object' && !(body instanceof FormData)) {
    // Convert camelCase keys to snake_case when body is passed directly via options.body
    body = keysToSnake(body)
  }

  let url = `${LARAVEL_API_URL}${path}`
  const params = options.searchParams || req.nextUrl.searchParams
  if (params) {
    // Convert params keys to snake_case
    const snakeParams = new URLSearchParams()
    params.forEach((value, key) => {
      // Don't convert keys that are specific or shouldn't be converted
      snakeParams.append(toSnake(key), value)
    })
    if (snakeParams.toString()) {
      url += `?${snakeParams.toString()}`
    }
  }

  const fetchOptions: RequestInit = {
    method,
    headers,
  }

  if (body !== undefined) {
    if (typeof body === 'object' && !(body instanceof FormData)) {
      fetchOptions.body = JSON.stringify(body)
      headers['Content-Type'] = 'application/json'
    } else {
      fetchOptions.body = body
    }
  }

  try {
    const response = await fetch(url, fetchOptions)
    
    // Check if it's JSON
    const responseContentType = response.headers.get('content-type') || ''
    if (responseContentType.includes('application/json')) {
      const json = await response.json()
      // Auto convert snake_case keys back to camelCase for Next.js
      const camelJson = keysToCamel(json)
      return NextResponse.json(camelJson, { status: response.status })
    }

    // Non-JSON response (e.g. file, text)
    const text = await response.text()
    return new NextResponse(text, {
      status: response.status,
      headers: {
        'Content-Type': response.headers.get('Content-Type') || 'text/plain'
      }
    })
  } catch (error: any) {
    console.error(`Error requesting Laravel at ${path}:`, error)
    return NextResponse.json({ erreur: 'Erreur de communication avec le serveur backend Laravel' }, { status: 500 })
  }
}
