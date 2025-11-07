const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export interface Bookmark {
  user_id: string
  topic_id: number
  created_at: string
}

export const bookmarksApi = {
  getAll: async (token: string): Promise<Bookmark[]> => {
    const response = await fetch(`${API_URL}/api/bookmarks`, {
      headers: { 'Authorization': `Bearer ${token}` },
    })
    if (!response.ok) throw new Error('Failed to fetch bookmarks')
    return response.json()
  },

  toggle: async (topicId: number, token: string): Promise<{ is_bookmarked: boolean }> => {
    const response = await fetch(`${API_URL}/api/bookmarks`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ topic_id: topicId }),
    })
    if (!response.ok) throw new Error('Failed to toggle bookmark')
    // 토글 후 다시 체크
    const checkResponse = await fetch(`${API_URL}/api/bookmarks/check/${topicId}`, {
      headers: { 'Authorization': `Bearer ${token}` },
    })
    const isBookmarked = await checkResponse.json()
    return { is_bookmarked: isBookmarked }
  },

  check: async (topicId: number, token: string): Promise<{ is_bookmarked: boolean }> => {
    const response = await fetch(`${API_URL}/api/bookmarks/check/${topicId}`, {
      headers: { 'Authorization': `Bearer ${token}` },
    })
    if (!response.ok) throw new Error('Failed to check bookmark')
    const isBookmarked = await response.json()
    return { is_bookmarked: isBookmarked }
  },
}
