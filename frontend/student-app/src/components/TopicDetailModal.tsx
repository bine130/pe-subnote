import { useState, useEffect, useRef } from 'react'
import { marked } from 'marked'
import DOMPurify from 'dompurify'
import { topicsApi, type Topic } from '../api/topics'
import { bookmarksApi } from '../api/bookmarks'
import { commentsApi, type Comment, type CommentCreate } from '../api/comments'
import { notesApi, type Note, type NoteCreate, type NoteUpdate } from '../api/notes'
import { useAuthStore } from '../store/authStore'

interface TopicDetailModalProps {
  topicId: number
  onClose: () => void
  cardRect?: DOMRect | null
  isDarkMode?: boolean
  onToggleDarkMode?: () => void
  onKeywordClick?: (keyword: string) => void
}

interface StickyNoteProps {
  note: Note
  onUpdate: (noteId: string, data: NoteUpdate) => void
  onDelete: (noteId: string) => void
}

const COLORS = [
  { name: 'yellow', bg: 'bg-yellow-100', border: 'border-yellow-300', text: 'text-yellow-900' },
  { name: 'pink', bg: 'bg-pink-100', border: 'border-pink-300', text: 'text-pink-900' },
  { name: 'blue', bg: 'bg-blue-100', border: 'border-blue-300', text: 'text-blue-900' },
  { name: 'green', bg: 'bg-green-100', border: 'border-green-300', text: 'text-green-900' },
]

function StickyNote({ note, onUpdate, onDelete }: StickyNoteProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [content, setContent] = useState(note.content)
  const [isDragging, setIsDragging] = useState(false)
  const [isResizing, setIsResizing] = useState(false)
  const [position, setPosition] = useState({ x: note.position_x, y: note.position_y })
  const [size, setSize] = useState({ width: note.width, height: note.height })
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, width: 0, height: 0 })
  const [showOpacitySlider, setShowOpacitySlider] = useState(false)
  const noteRef = useRef<HTMLDivElement>(null)

  const color = COLORS.find(c => c.name === note.color) || COLORS[0]

  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).tagName === 'TEXTAREA' ||
        (e.target as HTMLElement).tagName === 'BUTTON' ||
        (e.target as HTMLElement).tagName === 'INPUT' ||
        (e.target as HTMLElement).classList.contains('resize-handle')) {
      return
    }
    setIsDragging(true)
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    })
  }

  const handleTouchStart = (e: React.TouchEvent) => {
    if ((e.target as HTMLElement).tagName === 'TEXTAREA' ||
        (e.target as HTMLElement).tagName === 'BUTTON' ||
        (e.target as HTMLElement).tagName === 'INPUT' ||
        (e.target as HTMLElement).classList.contains('resize-handle')) {
      return
    }
    const touch = e.touches[0]
    setIsDragging(true)
    setDragStart({
      x: touch.clientX - position.x,
      y: touch.clientY - position.y,
    })
  }

  const handleResizeMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsResizing(true)
    setResizeStart({
      x: e.clientX,
      y: e.clientY,
      width: size.width,
      height: size.height,
    })
  }

  const handleResizeTouchStart = (e: React.TouchEvent) => {
    e.stopPropagation()
    const touch = e.touches[0]
    setIsResizing(true)
    setResizeStart({
      x: touch.clientX,
      y: touch.clientY,
      width: size.width,
      height: size.height,
    })
  }

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        const newX = e.clientX - dragStart.x
        const newY = e.clientY - dragStart.y
        setPosition({ x: newX, y: newY })
      } else if (isResizing) {
        const deltaX = e.clientX - resizeStart.x
        const deltaY = e.clientY - resizeStart.y
        const newWidth = Math.max(150, resizeStart.width + deltaX)
        const newHeight = Math.max(150, resizeStart.height + deltaY)
        setSize({ width: newWidth, height: newHeight })
      }
    }

    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault() // 스크롤 방지
      const touch = e.touches[0]
      if (isDragging) {
        const newX = touch.clientX - dragStart.x
        const newY = touch.clientY - dragStart.y
        setPosition({ x: newX, y: newY })
      } else if (isResizing) {
        const deltaX = touch.clientX - resizeStart.x
        const deltaY = touch.clientY - resizeStart.y
        const newWidth = Math.max(150, resizeStart.width + deltaX)
        const newHeight = Math.max(150, resizeStart.height + deltaY)
        setSize({ width: newWidth, height: newHeight })
      }
    }

    const handleMouseUp = () => {
      if (isDragging) {
        setIsDragging(false)
        // 위치가 변경되었으면 저장
        if (position.x !== note.position_x || position.y !== note.position_y) {
          onUpdate(note.id, { position_x: position.x, position_y: position.y })
        }
      } else if (isResizing) {
        setIsResizing(false)
        // 크기가 변경되었으면 저장
        if (size.width !== note.width || size.height !== note.height) {
          onUpdate(note.id, { width: size.width, height: size.height })
        }
      }
    }

    const handleTouchEnd = () => {
      if (isDragging) {
        setIsDragging(false)
        // 위치가 변경되었으면 저장
        if (position.x !== note.position_x || position.y !== note.position_y) {
          onUpdate(note.id, { position_x: position.x, position_y: position.y })
        }
      } else if (isResizing) {
        setIsResizing(false)
        // 크기가 변경되었으면 저장
        if (size.width !== note.width || size.height !== note.height) {
          onUpdate(note.id, { width: size.width, height: size.height })
        }
      }
    }

    if (isDragging || isResizing) {
      window.addEventListener('mousemove', handleMouseMove)
      window.addEventListener('mouseup', handleMouseUp)
      window.addEventListener('touchmove', handleTouchMove, { passive: false })
      window.addEventListener('touchend', handleTouchEnd)
      return () => {
        window.removeEventListener('mousemove', handleMouseMove)
        window.removeEventListener('mouseup', handleMouseUp)
        window.removeEventListener('touchmove', handleTouchMove)
        window.removeEventListener('touchend', handleTouchEnd)
      }
    }
  }, [isDragging, isResizing, position, size, dragStart, resizeStart, note.id, note.position_x, note.position_y, note.width, note.height, onUpdate])

  const handleSave = () => {
    if (content.trim() !== note.content) {
      onUpdate(note.id, { content: content.trim() })
    }
    setIsEditing(false)
  }

  const handleColorChange = (colorName: string) => {
    onUpdate(note.id, { color: colorName })
  }

  const handleOpacityChange = (newOpacity: number) => {
    onUpdate(note.id, { opacity: newOpacity })
  }

  return (
    <div
      ref={noteRef}
      className={`absolute ${color.bg} ${color.border} border-2 rounded-lg shadow-lg cursor-move ${
        isDragging || isResizing ? 'shadow-2xl z-50' : 'z-10'
      } transition-shadow`}
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        width: `${size.width}px`,
        height: `${size.height}px`,
        opacity: note.opacity ?? 1.0,
      }}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
    >
      <div className="p-3 h-full flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex gap-1">
            {COLORS.map((c) => (
              <button
                key={c.name}
                onClick={() => handleColorChange(c.name)}
                className={`w-4 h-4 rounded-full ${c.bg} ${c.border} border ${
                  c.name === note.color ? 'ring-2 ring-gray-600' : ''
                }`}
                title={`색상: ${c.name}`}
              />
            ))}
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setShowOpacitySlider(!showOpacitySlider)}
              className={`text-gray-500 hover:text-gray-700 p-0.5 rounded ${
                showOpacitySlider ? 'bg-gray-200' : ''
              }`}
              title="투명도 조절"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </button>
            <button
              onClick={() => onDelete(note.id)}
              className="text-gray-500 hover:text-red-600 p-0.5"
              title="삭제"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Opacity Slider */}
        {showOpacitySlider && (
          <div className="absolute top-10 left-3 right-3 pl-2 pr-3 py-1.5 bg-white bg-opacity-95 rounded border border-gray-300 shadow-md z-20">
            <div className="flex items-center gap-1.5">
              <input
                type="range"
                min="0.1"
                max="1"
                step="0.1"
                value={note.opacity ?? 1.0}
                onChange={(e) => handleOpacityChange(parseFloat(e.target.value))}
                className="flex-1 h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer min-w-0"
              />
              <span className="text-xs text-gray-600 font-medium w-[36px] flex-shrink-0 text-right">{Math.round((note.opacity ?? 1.0) * 100)}%</span>
            </div>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          {isEditing ? (
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className={`w-full h-full ${color.bg} ${color.text} resize-none border-none outline-none text-sm`}
              autoFocus
              onBlur={handleSave}
            />
          ) : (
            <p
              onClick={() => setIsEditing(true)}
              className={`${color.text} text-sm whitespace-pre-wrap cursor-text h-full overflow-y-auto`}
            >
              {note.content}
            </p>
          )}
        </div>
      </div>

      {/* Resize Handle */}
      <div
        className="resize-handle absolute bottom-0 right-0 w-6 h-6 md:w-4 md:h-4 cursor-se-resize bg-gray-400 opacity-50 hover:opacity-100 transition-opacity touch-none"
        onMouseDown={handleResizeMouseDown}
        onTouchStart={handleResizeTouchStart}
        style={{
          clipPath: 'polygon(100% 0, 100% 100%, 0 100%)',
        }}
      />
    </div>
  )
}

interface CommentItemProps {
  comment: Comment
  onReply: (commentId: number) => void
  onEdit: (commentId: number, content: string) => void
  onDelete: (commentId: number) => void
  onLike: (commentId: number) => void
  currentUserId: string | undefined
  editingComment: number | null
  editContent: string
  setEditContent: (content: string) => void
  setEditingComment: (id: number | null) => void
  replyingTo: number | null
  newComment: string
  setNewComment: (content: string) => void
  onSubmitReply: (parentId: number) => void
  setReplyingTo: (id: number | null) => void
  isDarkMode: boolean
}

function CommentItem({
  comment,
  onReply,
  onEdit,
  onDelete,
  onLike,
  currentUserId,
  editingComment,
  editContent,
  setEditContent,
  setEditingComment,
  replyingTo,
  newComment,
  setNewComment,
  onSubmitReply,
  setReplyingTo,
  isDarkMode,
}: CommentItemProps) {
  const isOwner = currentUserId === comment.user_id
  const isEditing = editingComment === comment.id
  const isReplying = replyingTo === comment.id

  return (
    <div className={`border-l-2 pl-4 ${
      isDarkMode ? 'border-gray-700' : 'border-gray-200'
    }`}>
      <div className="mb-3">
        {/* Comment Header */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className={`font-medium ${
              isDarkMode ? 'text-gray-100' : 'text-gray-900'
            }`}>{comment.user.name}</span>
            <span className={`text-xs ${
              isDarkMode ? 'text-gray-400' : 'text-gray-500'
            }`}>({comment.user.cohort}기)</span>
            <span className={`text-xs ${
              isDarkMode ? 'text-gray-500' : 'text-gray-400'
            }`}>
              {new Date(comment.created_at).toLocaleDateString('ko-KR')}
            </span>
          </div>
          {isOwner && (
            <div className="flex items-center gap-1">
              <button
                onClick={() => {
                  setEditingComment(comment.id)
                  setEditContent(comment.content)
                }}
                className={`text-xs hover:text-indigo-600 ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-500'
                }`}
              >
                수정
              </button>
              <span className={isDarkMode ? 'text-gray-600' : 'text-gray-300'}>|</span>
              <button
                onClick={() => onDelete(comment.id)}
                className={`text-xs hover:text-red-600 ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-500'
                }`}
              >
                삭제
              </button>
            </div>
          )}
        </div>

        {/* Comment Content */}
        {isEditing ? (
          <div className="mb-2">
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className={`w-full p-2 border rounded-lg text-sm resize-none ${
                isDarkMode
                  ? 'bg-gray-700 border-gray-600 text-gray-100'
                  : 'bg-white border-gray-300 text-gray-900'
              }`}
              rows={3}
            />
            <div className="flex gap-2 mt-2">
              <button
                onClick={() => onEdit(comment.id, editContent)}
                className="px-3 py-1 text-xs bg-indigo-600 text-white rounded hover:bg-indigo-700"
              >
                저장
              </button>
              <button
                onClick={() => {
                  setEditingComment(null)
                  setEditContent('')
                }}
                className="px-3 py-1 text-xs bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
              >
                취소
              </button>
            </div>
          </div>
        ) : (
          <p className={`text-sm mb-2 whitespace-pre-wrap ${
            isDarkMode ? 'text-gray-300' : 'text-gray-700'
          }`}>{comment.content}</p>
        )}

        {/* Comment Actions */}
        <div className="flex items-center gap-3 text-xs">
          <button
            onClick={() => onLike(comment.id)}
            className={`flex items-center gap-1 ${
              comment.is_liked ? 'text-indigo-600' : 'text-gray-500'
            } hover:text-indigo-600`}
          >
            <svg className="w-4 h-4" fill={comment.is_liked ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
            </svg>
            <span>{comment.likes_count}</span>
          </button>
          <button
            onClick={() => onReply(comment.id)}
            className={`hover:text-indigo-600 ${
              isDarkMode ? 'text-gray-400' : 'text-gray-500'
            }`}
          >
            답글
          </button>
        </div>

        {/* Reply Form */}
        {isReplying && (
          <div className={`mt-3 p-3 rounded-lg ${
            isDarkMode ? 'bg-gray-800' : 'bg-gray-50'
          }`}>
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="답글을 입력하세요..."
              className={`w-full p-2 border rounded-lg text-sm resize-none ${
                isDarkMode
                  ? 'bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400'
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
              }`}
              rows={2}
            />
            <div className="flex gap-2 mt-2">
              <button
                onClick={() => onSubmitReply(comment.id)}
                className="px-3 py-1 text-xs bg-indigo-600 text-white rounded hover:bg-indigo-700"
              >
                작성
              </button>
              <button
                onClick={() => {
                  setReplyingTo(null)
                  setNewComment('')
                }}
                className="px-3 py-1 text-xs bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
              >
                취소
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Nested Replies */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="ml-4 space-y-3">
          {comment.replies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              onReply={onReply}
              onEdit={onEdit}
              onDelete={onDelete}
              onLike={onLike}
              currentUserId={currentUserId}
              editingComment={editingComment}
              editContent={editContent}
              setEditContent={setEditContent}
              setEditingComment={setEditingComment}
              replyingTo={replyingTo}
              newComment={newComment}
              setNewComment={setNewComment}
              onSubmitReply={onSubmitReply}
              setReplyingTo={setReplyingTo}
              isDarkMode={isDarkMode}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default function TopicDetailModal({
  topicId,
  onClose,
  cardRect,
  isDarkMode = false,
  onToggleDarkMode: _onToggleDarkMode,
  onKeywordClick
}: TopicDetailModalProps) {
  const { token, user } = useAuthStore()
  const [topic, setTopic] = useState<Topic | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [isBookmarked, setIsBookmarked] = useState(false)
  const [bookmarkLoading, setBookmarkLoading] = useState(false)
  const [isAnimating, setIsAnimating] = useState(!!cardRect)

  // Comments state
  const [comments, setComments] = useState<Comment[]>([])
  const [commentsLoading, setCommentsLoading] = useState(false)
  const [newComment, setNewComment] = useState('')
  const [replyingTo, setReplyingTo] = useState<number | null>(null)
  const [editingComment, setEditingComment] = useState<number | null>(null)
  const [editContent, setEditContent] = useState('')

  // Notes (Sticky Notes) state
  const [notes, setNotes] = useState<Note[]>([])
  const [_notesLoading, setNotesLoading] = useState(false)
  const [showNotes, setShowNotes] = useState(false)

  // 애니메이션 시작
  useEffect(() => {
    if (cardRect) {
      // 다음 프레임에서 애니메이션 시작
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setIsAnimating(false)
        })
      })
    }
  }, [cardRect])

  // body 스크롤 방지
  useEffect(() => {
    // 모달이 열릴 때 body 스크롤 막기
    document.body.style.overflow = 'hidden'

    // 모달이 닫힐 때 body 스크롤 복원
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [])

  useEffect(() => {
    const loadTopic = async () => {
      try {
        setLoading(true)
        const data = await topicsApi.getById(topicId)
        setTopic(data)
      } catch (err: any) {
        setError(err.message || 'Failed to load topic')
      } finally {
        setLoading(false)
      }
    }

    const checkBookmark = async () => {
      if (!token) return
      try {
        const result = await bookmarksApi.check(topicId, token)
        setIsBookmarked(result.is_bookmarked)
      } catch (err) {
        console.error('Failed to check bookmark:', err)
      }
    }

    const loadComments = async () => {
      if (!token) return
      try {
        setCommentsLoading(true)
        const data = await commentsApi.getAll(token, topicId)
        setComments(data)
      } catch (err) {
        console.error('Failed to load comments:', err)
      } finally {
        setCommentsLoading(false)
      }
    }

    const loadNotes = async () => {
      if (!token) return
      try {
        setNotesLoading(true)
        const data = await notesApi.getAll(token, topicId)
        setNotes(data)
      } catch (err) {
        console.error('Failed to load notes:', err)
        // 에러가 나도 계속 진행 (포스트잇 기능이 비활성화될 뿐)
        setNotes([])
      } finally {
        setNotesLoading(false)
      }
    }

    loadTopic()
    checkBookmark()
    loadComments()
    // 포스트잇 기능은 나중에 로드
    loadNotes()
  }, [topicId, token])

  const handleBookmarkToggle = async () => {
    if (!token || bookmarkLoading) return

    try {
      setBookmarkLoading(true)
      const result = await bookmarksApi.toggle(topicId, token)
      setIsBookmarked(result.is_bookmarked)
    } catch (err: any) {
      console.error('Failed to toggle bookmark:', err)
    } finally {
      setBookmarkLoading(false)
    }
  }

  const handleCommentSubmit = async (parentId: number | null = null) => {
    if (!token) return
    const content = parentId ? newComment : newComment
    if (!content.trim()) return

    try {
      const commentData: CommentCreate = {
        content: content.trim(),
        parent_comment_id: parentId,
      }
      await commentsApi.create(token, topicId, commentData)
      setNewComment('')
      setReplyingTo(null)
      // Reload comments
      const data = await commentsApi.getAll(token, topicId)
      setComments(data)
    } catch (err) {
      console.error('Failed to create comment:', err)
    }
  }

  const handleCommentEdit = async (commentId: number) => {
    if (!token || !editContent.trim()) return

    try {
      await commentsApi.update(token, topicId, commentId, { content: editContent.trim() })
      setEditingComment(null)
      setEditContent('')
      // Reload comments
      const data = await commentsApi.getAll(token, topicId)
      setComments(data)
    } catch (err) {
      console.error('Failed to update comment:', err)
    }
  }

  const handleCommentDelete = async (commentId: number) => {
    if (!token || !confirm('정말 삭제하시겠습니까?')) return

    try {
      await commentsApi.delete(token, topicId, commentId)
      // Reload comments
      const data = await commentsApi.getAll(token, topicId)
      setComments(data)
    } catch (err) {
      console.error('Failed to delete comment:', err)
    }
  }

  const handleCommentLike = async (commentId: number) => {
    if (!token) return

    try {
      await commentsApi.toggleLike(token, topicId, commentId)
      // Reload comments
      const data = await commentsApi.getAll(token, topicId)
      setComments(data)
    } catch (err) {
      console.error('Failed to toggle like:', err)
    }
  }

  const handleAddNote = async () => {
    if (!token || !user) return

    try {
      const newNoteData: NoteCreate = {
        topic_id: topicId,
        content: '새 메모',
        position_x: 100 + notes.length * 20,
        position_y: 100 + notes.length * 20,
        color: 'yellow',
        opacity: 1.0,
      }
      const createdNote = await notesApi.create(token, newNoteData)
      // 낙관적 업데이트: 즉시 추가
      setNotes(prevNotes => [...prevNotes, createdNote])
    } catch (err) {
      console.error('Failed to create note:', err)
    }
  }

  const handleUpdateNote = async (noteId: string, updateData: NoteUpdate) => {
    if (!token) return

    // 낙관적 업데이트: 즉시 UI 업데이트
    setNotes(prevNotes =>
      prevNotes.map(note =>
        note.id === noteId
          ? { ...note, ...updateData }
          : note
      )
    )

    try {
      await notesApi.update(token, noteId, updateData)
    } catch (err) {
      console.error('Failed to update note:', err)
      // 실패 시 다시 로드
      const data = await notesApi.getAll(token, topicId)
      setNotes(data)
    }
  }

  const handleDeleteNote = async (noteId: string) => {
    if (!token) return

    // 낙관적 업데이트: 즉시 UI에서 제거
    setNotes(prevNotes => prevNotes.filter(note => note.id !== noteId))

    try {
      await notesApi.delete(token, noteId)
    } catch (err) {
      console.error('Failed to delete note:', err)
      // 실패 시 다시 로드
      const data = await notesApi.getAll(token, topicId)
      setNotes(data)
    }
  }

  const renderMarkdown = (content: string) => {
    const rawHtml = marked(content, { breaks: true })
    const cleanHtml = DOMPurify.sanitize(rawHtml as string)
    return { __html: cleanHtml }
  }

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  return (
    <div
      className={`fixed inset-0 z-50 ${isDarkMode ? 'dark' : ''}`}
      onClick={handleBackdropClick}
      style={{
        backgroundColor: isAnimating ? 'transparent' : 'rgba(0, 0, 0, 0.5)',
        transition: 'background-color 0.3s ease-out',
      }}
    >
      <div
        className={`shadow-2xl overflow-hidden flex flex-col ${
          isDarkMode ? 'bg-gray-900' : 'bg-white'
        }`}
        style={
          isAnimating && cardRect
            ? {
                position: 'fixed',
                top: `${cardRect.top}px`,
                left: `${cardRect.left}px`,
                width: `${cardRect.width}px`,
                height: `${cardRect.height}px`,
                borderRadius: '0.75rem', // rounded-xl from card
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              }
            : {
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100vw',
                height: '100vh',
                borderRadius: 0,
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              }
        }
      >
        {/* Header */}
        <div className={`flex items-center justify-between border-b ${
          isDarkMode
            ? 'border-gray-700 bg-gradient-to-r from-gray-800 to-gray-800'
            : 'border-gray-200 bg-gradient-to-r from-indigo-50 to-purple-50'
        }`} style={{ padding: '10px 20px' }}>
          <div className="flex-1 min-w-0 pr-4">
            {loading ? (
              <div className="space-y-2">
                <div className="h-6 bg-gray-200 rounded animate-pulse w-24"></div>
                <div className="h-8 bg-gray-200 rounded animate-pulse w-3/4"></div>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                {topic?.category && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800 border border-green-200 flex-shrink-0">
                    {topic.category.name}
                  </span>
                )}
                <h2 className={`text-2xl font-bold line-clamp-2 ${
                  isDarkMode ? 'text-gray-100' : 'text-gray-900'
                }`}>
                  {topic?.title.replace(/^[^-]+-\s*/, '')}
                </h2>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleBookmarkToggle}
              disabled={bookmarkLoading}
              className={`flex-shrink-0 p-2 rounded-lg transition-colors ${
                isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-white'
              }`}
            >
              <svg
                className={`w-6 h-6 ${bookmarkLoading ? 'animate-pulse' : ''} ${
                  isBookmarked ? 'text-red-500' : 'text-gray-400'
                }`}
                fill={isBookmarked ? 'currentColor' : 'none'}
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                />
              </svg>
            </button>
            <button
              onClick={onClose}
              className={`flex-shrink-0 p-2 rounded-lg transition-colors ${
                isDarkMode
                  ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-700'
                  : 'text-gray-400 hover:text-gray-600 hover:bg-white'
              }`}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 relative">
          {loading ? (
            <div className="space-y-4">
              <div className="h-4 bg-gray-200 rounded animate-pulse w-full"></div>
              <div className="h-4 bg-gray-200 rounded animate-pulse w-5/6"></div>
              <div className="h-4 bg-gray-200 rounded animate-pulse w-4/6"></div>
            </div>
          ) : error ? (
            <div className="p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-r">
              {error}
            </div>
          ) : topic ? (
            <div>
              {/* Importance Level */}
              <div className="flex gap-1 mb-4">
                {[...Array(5)].map((_, idx) => (
                  <svg
                    key={idx}
                    className={`w-6 h-6 ${
                      idx < topic.importance_level ? 'text-yellow-400' : 'text-gray-300'
                    }`}
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>

              {/* Keywords */}
              {topic.keywords && (
                <div className="mb-6">
                  <div className="flex flex-wrap gap-2">
                    {topic.keywords.split(',').map((keyword, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          if (onKeywordClick) {
                            onKeywordClick(keyword.trim())
                            onClose()
                          }
                        }}
                        className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-indigo-100 text-indigo-800 hover:bg-indigo-200 transition-colors"
                      >
                        #{keyword.trim()}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Mnemonic */}
              {topic.mnemonic && (
                <div className={`mb-6 p-4 border-l-4 border-yellow-400 rounded-r ${
                  isDarkMode ? 'bg-yellow-900/20' : 'bg-yellow-50'
                }`}>
                  <p className={`whitespace-pre-wrap ${
                    isDarkMode ? 'text-yellow-200' : 'text-yellow-900'
                  }`}>{topic.mnemonic}</p>
                </div>
              )}

              {/* Main Content */}
              <div className="mb-6">
                <div
                  className={`prose prose-sm max-w-none ${
                    isDarkMode
                      ? `prose-invert
                        prose-headings:text-gray-100 prose-headings:font-bold
                        prose-p:text-gray-300 prose-p:leading-relaxed
                        prose-a:text-indigo-400 prose-a:no-underline hover:prose-a:underline
                        prose-strong:text-gray-100 prose-strong:font-semibold
                        prose-ul:list-disc prose-ol:list-decimal
                        prose-li:text-gray-300
                        prose-code:text-indigo-400 prose-code:bg-indigo-950 prose-code:px-1 prose-code:py-0.5 prose-code:rounded
                        prose-pre:bg-black prose-pre:text-gray-100
                        prose-blockquote:border-l-indigo-500 prose-blockquote:bg-indigo-950/30 prose-blockquote:text-gray-300
                        prose-table:border-collapse
                        prose-th:bg-gray-800 prose-th:border prose-th:border-gray-600 prose-th:p-2
                        prose-td:border prose-td:border-gray-600 prose-td:p-2`
                      : `prose-headings:text-gray-900 prose-headings:font-bold
                        prose-p:text-gray-700 prose-p:leading-relaxed
                        prose-a:text-indigo-600 prose-a:no-underline hover:prose-a:underline
                        prose-strong:text-gray-900 prose-strong:font-semibold
                        prose-ul:list-disc prose-ol:list-decimal
                        prose-li:text-gray-700
                        prose-code:text-indigo-600 prose-code:bg-indigo-50 prose-code:px-1 prose-code:py-0.5 prose-code:rounded
                        prose-pre:bg-gray-900 prose-pre:text-gray-100
                        prose-blockquote:border-l-indigo-500 prose-blockquote:bg-indigo-50 prose-blockquote:text-gray-700
                        prose-table:border-collapse
                        prose-th:bg-gray-100 prose-th:border prose-th:border-gray-300 prose-th:p-2
                        prose-td:border prose-td:border-gray-300 prose-td:p-2`
                  }`}
                  dangerouslySetInnerHTML={renderMarkdown(topic.content)}
                />
              </div>

              {/* Meta Info */}
              <div className={`pt-6 border-t mb-6 ${
                isDarkMode ? 'border-gray-700' : 'border-gray-200'
              }`}>
                <div className={`flex items-center gap-4 text-sm ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-500'
                }`}>
                  <div className="flex items-center gap-1.5" title={`조회수: ${topic.view_count}`}>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    <span>{topic.view_count}</span>
                  </div>
                  <div className="flex items-center gap-1.5" title={`작성일: ${new Date(topic.created_at).toLocaleDateString('ko-KR')}`}>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>{new Date(topic.created_at).toLocaleDateString('ko-KR')}</span>
                  </div>
                  {topic.updated_at !== topic.created_at && (
                    <div className="flex items-center gap-1.5" title={`수정일: ${new Date(topic.updated_at).toLocaleDateString('ko-KR')}`}>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      <span>{new Date(topic.updated_at).toLocaleDateString('ko-KR')}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Comments Section */}
              <div className={`pt-6 border-t ${
                isDarkMode ? 'border-gray-700' : 'border-gray-200'
              }`}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className={`text-lg font-semibold flex items-center gap-2 ${
                    isDarkMode ? 'text-gray-100' : 'text-gray-900'
                  }`}>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    댓글 ({comments.length})
                  </h3>
                </div>

                {/* New Comment Form */}
                {!loading && (
                  <div className={`mb-6 p-4 rounded-lg ${
                    isDarkMode ? 'bg-gray-800' : 'bg-gray-50'
                  }`}>
                    <textarea
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="댓글을 입력하세요..."
                      className={`w-full p-3 border rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                        isDarkMode
                          ? 'bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400'
                          : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                      }`}
                      rows={3}
                    />
                    <div className="flex justify-end mt-2">
                      <button
                        onClick={() => handleCommentSubmit(null)}
                        disabled={!newComment.trim()}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-sm font-medium"
                      >
                        작성
                      </button>
                    </div>
                  </div>
                )}

                {/* Comments List */}
                {commentsLoading ? (
                  <div className="space-y-4">
                    <div className="h-20 bg-gray-100 rounded animate-pulse"></div>
                    <div className="h-20 bg-gray-100 rounded animate-pulse"></div>
                  </div>
                ) : comments.length === 0 ? (
                  <div className={`text-center py-8 ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-500'
                  }`}>
                    <svg className={`w-12 h-12 mx-auto mb-2 ${
                      isDarkMode ? 'text-gray-600' : 'text-gray-300'
                    }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    <p className="text-sm">첫 댓글을 작성해보세요!</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {comments.map((comment) => (
                      <CommentItem
                        key={comment.id}
                        comment={comment}
                        onReply={setReplyingTo}
                        onEdit={handleCommentEdit}
                        onDelete={handleCommentDelete}
                        onLike={handleCommentLike}
                        currentUserId={user?.id}
                        editingComment={editingComment}
                        editContent={editContent}
                        setEditContent={setEditContent}
                        setEditingComment={setEditingComment}
                        replyingTo={replyingTo}
                        newComment={newComment}
                        setNewComment={setNewComment}
                        onSubmitReply={handleCommentSubmit}
                        setReplyingTo={setReplyingTo}
                        isDarkMode={isDarkMode}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : null}

          {/* Sticky Notes Layer */}
          {showNotes && !loading && (
            <>
              {notes.map((note) => (
                <StickyNote
                  key={note.id}
                  note={note}
                  onUpdate={handleUpdateNote}
                  onDelete={handleDeleteNote}
                />
              ))}
            </>
          )}

          {/* Floating Post-it Button */}
          {!loading && (
            <div className="fixed bottom-6 right-6 flex flex-col gap-2 items-end z-50">
              {/* Add Post-it Button (appears when notes are visible) */}
              {showNotes && (
                <button
                  onClick={handleAddNote}
                  className="w-12 h-12 rounded-full bg-yellow-500 text-yellow-900 shadow-lg hover:bg-yellow-600 transition-all transform hover:scale-110 flex items-center justify-center"
                  title="포스트잇 추가"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </button>
              )}

              {/* Post-it Toggle Button */}
              <button
                onClick={() => setShowNotes(!showNotes)}
                className={`w-14 h-14 rounded-full shadow-lg transition-all transform hover:scale-110 flex items-center justify-center ${
                  showNotes
                    ? 'bg-yellow-400 text-yellow-900 hover:bg-yellow-500'
                    : 'bg-white text-gray-700 hover:bg-gray-50 border-2 border-gray-200'
                }`}
                title={showNotes ? '포스트잇 숨기기' : '포스트잇 보기'}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                </svg>
                {notes.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">
                    {notes.length}
                  </span>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
