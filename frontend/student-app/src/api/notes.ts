const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export interface Note {
  id: string
  user_id: string
  topic_id: number
  content: string
  position_x: number
  position_y: number
  width: number
  height: number
  color: string
  opacity: number
  created_at: string
  updated_at: string
}

export interface NoteCreate {
  topic_id: number
  content: string
  position_x?: number
  position_y?: number
  color?: string
  opacity?: number
}

export interface NoteUpdate {
  content?: string
  position_x?: number
  position_y?: number
  width?: number
  height?: number
  color?: string
  opacity?: number
}

export const notesApi = {
  getAll: async (token: string, topicId?: number): Promise<Note[]> => {
    const url = topicId
      ? `${API_URL}/api/notes?topic_id=${topicId}`
      : `${API_URL}/api/notes`

    const response = await fetch(url, {
      headers: { 'Authorization': `Bearer ${token}` },
    })
    if (!response.ok) throw new Error('Failed to fetch notes')
    return response.json()
  },

  getById: async (token: string, noteId: string): Promise<Note> => {
    const response = await fetch(`${API_URL}/api/notes/${noteId}`, {
      headers: { 'Authorization': `Bearer ${token}` },
    })
    if (!response.ok) throw new Error('Failed to fetch note')
    return response.json()
  },

  create: async (token: string, data: NoteCreate): Promise<Note> => {
    const response = await fetch(`${API_URL}/api/notes`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })
    if (!response.ok) throw new Error('Failed to create note')
    return response.json()
  },

  update: async (token: string, noteId: string, data: NoteUpdate): Promise<Note> => {
    const response = await fetch(`${API_URL}/api/notes/${noteId}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })
    if (!response.ok) throw new Error('Failed to update note')
    return response.json()
  },

  delete: async (token: string, noteId: string): Promise<void> => {
    const response = await fetch(`${API_URL}/api/notes/${noteId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` },
    })
    if (!response.ok) throw new Error('Failed to delete note')
  },
}
