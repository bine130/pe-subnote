const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export interface Category {
  id: number
  name: string
}

export interface Topic {
  id: number
  title: string
  content: string
  keywords: string | null
  mnemonic: string | null
  category_id: number | null
  category: Category | null
  is_published: boolean
  order_index: number
  view_count: number
  importance_level: number
  created_at: string
  updated_at: string
}

export interface TopicListItem {
  id: number
  title: string
  keywords: string | null
  mnemonic: string | null
  category_id: number | null
  category: Category | null
  is_published: boolean
  view_count: number
  importance_level: number
  comments_count: number
  created_at: string
  updated_at: string
}

export const topicsApi = {
  getAll: async (params?: {
    category_id?: number
    search?: string
    skip?: number
    limit?: number
  }): Promise<TopicListItem[]> => {
    const queryParams = new URLSearchParams()
    if (params?.category_id !== undefined) queryParams.append('category_id', params.category_id.toString())
    if (params?.search) queryParams.append('search', params.search)
    if (params?.skip !== undefined) queryParams.append('skip', params.skip.toString())
    if (params?.limit !== undefined) queryParams.append('limit', params.limit.toString())
    queryParams.append('is_published', 'true')  // 학생은 공개된 것만 볼 수 있음

    const response = await fetch(`${API_URL}/api/topics/?${queryParams}`)
    if (!response.ok) throw new Error('Failed to fetch topics')
    return response.json()
  },

  getById: async (id: number): Promise<Topic> => {
    const response = await fetch(`${API_URL}/api/topics/${id}`)
    if (!response.ok) throw new Error('Failed to fetch topic')
    return response.json()
  },
}
