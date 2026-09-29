const TOKEN_KEY = 'barbergo_token'

export function getToken() {
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token) {
  localStorage.setItem(TOKEN_KEY, token)
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY)
}

export async function api(path, { method = 'GET', body } = {}) {
  const headers = {}
  if (body !== undefined) headers['Content-Type'] = 'application/json'
  const token = getToken()
  if (token) headers.Authorization = `Bearer ${token}`

  let response
  try {
    response = await fetch(`/api${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    })
  } catch {
    throw new Error('No se pudo conectar con el servidor')
  }

  const data = await response.json().catch(() => ({}))
  if (response.status === 401 && token && !path.startsWith('/auth/login')) {
    clearToken()
    if (window.location.hash !== '#login') window.location.hash = 'login'
  }
  if (!response.ok) throw new Error(data.message || 'No se pudo completar la solicitud')
  return data
}
