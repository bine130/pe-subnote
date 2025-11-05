const API_URL = import.meta.env.VITE_API_URL

export type Topic = {
  id: number
  title: string
  content: string
  category_id?: number
  created_by?: string
  is_published: boolean
  view_count: number
  order_index: number
  created_at: string
}

export type TopicListItem = {
  id: number
  title: string
  category_id?: number
  is_published: boolean
  view_count: number
  created_at: string
}

export type TopicCreate = {
  title: string
  content: string
  category_id?: number
  is_published?: boolean
  order_index?: number
}

export type TopicUpdate = {
  title?: string
  content?: string
  category_id?: number
  is_published?: boolean
  order_index?: number
}

export const topicsApi = {
  getAll: async (
    token: string,
    filters?: { category_id?: number; is_published?: boolean; skip?: number; limit?: number }
  ): Promise<TopicListItem[]> => {
    let url = `${API_URL}/api/topics/`
    const params = new URLSearchParams()

    if (filters?.category_id !== undefined) {
      params.append('category_id', filters.category_id.toString())
    }
    if (filters?.is_published !== undefined) {
      params.append('is_published', filters.is_published.toString())
    }
    if (filters?.skip !== undefined) {
      params.append('skip', filters.skip.toString())
    }
    if (filters?.limit !== undefined) {
      params.append('limit', filters.limit.toString())
    }

    if (params.toString()) {
      url += `?${params.toString()}`
    }

    const response = await fetch(url, {
      headers: { 'Authorization': `Bearer ${token}` },
    })

    if (!response.ok) {
      throw new Error('Failed to fetch topics')
    }

    return response.json()
  },

  getById: async (token: string, id: number): Promise<Topic> => {
    const response = await fetch(`${API_URL}/api/topics/${id}`, {
      headers: { 'Authorization': `Bearer ${token}` },
    })

    if (!response.ok) {
      throw new Error('Failed to fetch topic')
    }

    return response.json()
  },

  create: async (token: string, data: TopicCreate): Promise<Topic> => {
    const response = await fetch(`${API_URL}/api/topics/`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.detail || 'Failed to create topic')
    }

    return response.json()
  },

  update: async (token: string, id: number, data: TopicUpdate): Promise<Topic> => {
    const response = await fetch(`${API_URL}/api/topics/${id}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.detail || 'Failed to update topic')
    }

    return response.json()
  },

  delete: async (token: string, id: number): Promise<void> => {
    const response = await fetch(`${API_URL}/api/topics/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` },
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.detail || 'Failed to delete topic')
    }
  },

  togglePublish: async (token: string, id: number): Promise<Topic> => {
    const response = await fetch(`${API_URL}/api/topics/${id}/publish`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.detail || 'Failed to toggle publish status')
    }

    return response.json()
  },
}
