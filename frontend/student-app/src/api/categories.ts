const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export interface CategoryTree {
  id: number
  name: string
  description: string | null
  parent_id: number | null
  order_index: number
  created_at: string
  children: CategoryTree[]
}

export const categoriesApi = {
  getTree: async (): Promise<CategoryTree[]> => {
    const response = await fetch(`${API_URL}/api/categories/tree`)
    if (!response.ok) throw new Error('Failed to fetch category tree')
    return response.json()
  },
}
