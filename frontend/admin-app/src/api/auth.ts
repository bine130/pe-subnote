const API_URL = import.meta.env.VITE_API_URL

export interface OAuthLoginRequest {
  provider: string
  id_token: string
}

export interface TokenResponse {
  access_token: string
  token_type: string
}

export interface User {
  id: string
  email: string
  name: string
  cohort: number
  role: string
  approval_status: string
}

export const authApi = {
  login: async (data: OAuthLoginRequest): Promise<TokenResponse> => {
    const response = await fetch(`${API_URL}/api/auth/oauth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.detail || 'Login failed')
    }

    return response.json()
  },

  getMe: async (token: string): Promise<User> => {
    const response = await fetch(`${API_URL}/api/auth/me`, {
      headers: { 'Authorization': `Bearer ${token}` },
    })

    if (!response.ok) {
      throw new Error('Failed to get user info')
    }

    return response.json()
  },
}
