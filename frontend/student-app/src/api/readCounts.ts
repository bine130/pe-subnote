const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export interface ReadCount {
  user_id: string
  topic_id: number
  count: number
  last_read_at: string
  created_at: string
}

export const readCountsApi = {
  getAll: async (token: string): Promise<ReadCount[]> => {
    const response = await fetch(`${API_URL}/api/read-counts`, {
      headers: { 'Authorization': `Bearer ${token}` },
    })
    if (!response.ok) throw new Error('Failed to fetch read counts')
    return response.json()
  },

  getByTopic: async (token: string, topicId: number): Promise<ReadCount> => {
    const response = await fetch(`${API_URL}/api/read-counts/${topicId}`, {
      headers: { 'Authorization': `Bearer ${token}` },
    })
    if (!response.ok) throw new Error('Failed to fetch read count')
    return response.json()
  },

  increment: async (token: string, topicId: number): Promise<ReadCount> => {
    const response = await fetch(`${API_URL}/api/read-counts`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ topic_id: topicId }),
    })
    if (!response.ok) throw new Error('Failed to increment read count')
    return response.json()
  },
}
