const tokenKey = 'dashboard_auth_token'

export function getAuthToken() {
  return localStorage.getItem(tokenKey)
}

export function setAuthToken(token) {
  localStorage.setItem(tokenKey, token)
}

export function clearAuthToken() {
  localStorage.removeItem(tokenKey)
}

export function getAuthTokenAsBearer() {
  const token = getAuthToken()
  if (!token) {
    return null
  }
  return `Bearer ${token}`
}
