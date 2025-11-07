const API_URL = import.meta.env.VITE_API_URL

export type User = {
  id: string
  email: string
  name: string
  cohort: number
  role: string
  approval_status: string
  oauth_provider: string
  created_at: string
  updated_at: string
  approved_by?: string
  approved_at?: string
}

export const usersApi = {
  getAll: async (token: string, filters?: { approval_status?: string; role?: string }): Promise<User[]> => {
    let url = `${API_URL}/api/users/`
    const params = new URLSearchParams()

    if (filters?.approval_status) {
      params.append('approval_status', filters.approval_status)
    }
    if (filters?.role) {
      params.append('role', filters.role)
    }

    if (params.toString()) {
      url += `?${params.toString()}`
    }

    const response = await fetch(url, {
      headers: { 'Authorization': `Bearer ${token}` },
    })

    if (!response.ok) {
      throw new Error('Failed to fetch users')
    }

    return response.json()
  },

  getPending: async (token: string): Promise<User[]> => {
    const response = await fetch(`${API_URL}/api/users/pending`, {
      headers: { 'Authorization': `Bearer ${token}` },
    })

    if (!response.ok) {
      throw new Error('Failed to fetch pending users')
    }

    return response.json()
  },

  approve: async (token: string, userId: string): Promise<User> => {
    const response = await fetch(`${API_URL}/api/users/${userId}/approve`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.detail || 'Failed to approve user')
    }

    return response.json()
  },

  reject: async (token: string, userId: string): Promise<User> => {
    const response = await fetch(`${API_URL}/api/users/${userId}/reject`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.detail || 'Failed to reject user')
    }

    return response.json()
  },

  delete: async (token: string, userId: string): Promise<void> => {
    const response = await fetch(`${API_URL}/api/users/${userId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` },
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.detail || 'Failed to delete user')
    }
  },

  updateRole: async (token: string, userId: string, role: 'student' | 'admin'): Promise<User> => {
    const response = await fetch(`${API_URL}/api/users/${userId}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ role }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.detail || 'Failed to update user role')
    }

    return response.json()
  },
}
