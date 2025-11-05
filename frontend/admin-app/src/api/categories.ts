const API_URL = import.meta.env.VITE_API_URL

export type Category = {
  id: number
  name: string
  description?: string
  parent_id?: number
  order_index: number
  created_at: string
  children?: Category[]
}

export type CategoryCreate = {
  name: string
  description?: string
  parent_id?: number
  order_index?: number
}

export type CategoryUpdate = {
  name?: string
  description?: string
  parent_id?: number
  order_index?: number
}

export type CategoryReorder = {
  id: number
  parent_id?: number
  order_index: number
}

export const categoriesApi = {
  getTree: async (token: string): Promise<Category[]> => {
    const response = await fetch(`${API_URL}/api/categories/tree`, {
      headers: { 'Authorization': `Bearer ${token}` },
    })

    if (!response.ok) {
      throw new Error('Failed to fetch category tree')
    }

    return response.json()
  },

  getAll: async (token: string): Promise<Category[]> => {
    const response = await fetch(`${API_URL}/api/categories/`, {
      headers: { 'Authorization': `Bearer ${token}` },
    })

    if (!response.ok) {
      throw new Error('Failed to fetch categories')
    }

    return response.json()
  },

  getById: async (token: string, id: number): Promise<Category> => {
    const response = await fetch(`${API_URL}/api/categories/${id}`, {
      headers: { 'Authorization': `Bearer ${token}` },
    })

    if (!response.ok) {
      throw new Error('Failed to fetch category')
    }

    return response.json()
  },

  create: async (token: string, data: CategoryCreate): Promise<Category> => {
    const response = await fetch(`${API_URL}/api/categories/`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.detail || 'Failed to create category')
    }

    return response.json()
  },

  update: async (token: string, id: number, data: CategoryUpdate): Promise<Category> => {
    const response = await fetch(`${API_URL}/api/categories/${id}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.detail || 'Failed to update category')
    }

    return response.json()
  },

  delete: async (token: string, id: number): Promise<void> => {
    const response = await fetch(`${API_URL}/api/categories/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` },
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.detail || 'Failed to delete category')
    }
  },

  reorder: async (token: string, data: CategoryReorder[]): Promise<void> => {
    const response = await fetch(`${API_URL}/api/categories/reorder`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.detail || 'Failed to reorder categories')
    }
  },
}
