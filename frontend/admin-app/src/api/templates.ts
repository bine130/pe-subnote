const API_URL = import.meta.env.VITE_API_URL

export type Template = {
  id: number
  name: string
  description?: string
  content: string
  category?: string
  created_by?: string
  created_at: string
}

export type TemplateListItem = {
  id: number
  name: string
  description?: string
  category?: string
  created_at: string
}

export type TemplateCreate = {
  name: string
  description?: string
  content: string
  category?: string
}

export type TemplateUpdate = {
  name?: string
  description?: string
  content?: string
  category?: string
}

export const templatesApi = {
  getAll: async (token: string, filters?: { category?: string }): Promise<TemplateListItem[]> => {
    let url = `${API_URL}/api/templates/`
    const params = new URLSearchParams()

    if (filters?.category !== undefined) {
      params.append('category', filters.category)
    }

    if (params.toString()) {
      url += `?${params.toString()}`
    }

    const response = await fetch(url, {
      headers: { 'Authorization': `Bearer ${token}` },
    })

    if (!response.ok) {
      throw new Error('Failed to fetch templates')
    }

    return response.json()
  },

  getById: async (token: string, id: number): Promise<Template> => {
    const response = await fetch(`${API_URL}/api/templates/${id}`, {
      headers: { 'Authorization': `Bearer ${token}` },
    })

    if (!response.ok) {
      throw new Error('Failed to fetch template')
    }

    return response.json()
  },

  create: async (token: string, data: TemplateCreate): Promise<Template> => {
    const response = await fetch(`${API_URL}/api/templates/`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.detail || 'Failed to create template')
    }

    return response.json()
  },

  update: async (token: string, id: number, data: TemplateUpdate): Promise<Template> => {
    const response = await fetch(`${API_URL}/api/templates/${id}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.detail || 'Failed to update template')
    }

    return response.json()
  },

  delete: async (token: string, id: number): Promise<void> => {
    const response = await fetch(`${API_URL}/api/templates/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` },
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.detail || 'Failed to delete template')
    }
  },
}
