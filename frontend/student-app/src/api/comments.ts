const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export interface CommentUserInfo {
  id: string
  name: string
  cohort: number
  role: string
}

export interface Comment {
  id: number
  topic_id: number
  user_id: string
  parent_comment_id: number | null
  content: string
  likes_count: number
  created_at: string
  updated_at: string
  user: CommentUserInfo
  replies: Comment[]
  is_liked: boolean
}

export interface CommentCreate {
  content: string
  parent_comment_id?: number | null
}

export interface CommentUpdate {
  content: string
}

export const commentsApi = {
  getAll: async (token: string, topicId: number): Promise<Comment[]> => {
    const response = await fetch(`${API_URL}/api/topics/${topicId}/comments`, {
      headers: { 'Authorization': `Bearer ${token}` },
    })
    if (!response.ok) throw new Error('Failed to fetch comments')
    return response.json()
  },

  create: async (token: string, topicId: number, data: CommentCreate): Promise<Comment> => {
    const response = await fetch(`${API_URL}/api/topics/${topicId}/comments`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })
    if (!response.ok) throw new Error('Failed to create comment')
    return response.json()
  },

  update: async (token: string, topicId: number, commentId: number, data: CommentUpdate): Promise<Comment> => {
    const response = await fetch(`${API_URL}/api/topics/${topicId}/comments/${commentId}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })
    if (!response.ok) throw new Error('Failed to update comment')
    return response.json()
  },

  delete: async (token: string, topicId: number, commentId: number): Promise<void> => {
    const response = await fetch(`${API_URL}/api/topics/${topicId}/comments/${commentId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` },
    })
    if (!response.ok) throw new Error('Failed to delete comment')
  },

  toggleLike: async (token: string, topicId: number, commentId: number): Promise<void> => {
    const response = await fetch(`${API_URL}/api/topics/${topicId}/comments/${commentId}/like`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
    })
    if (!response.ok) throw new Error('Failed to toggle like')
  },
}
