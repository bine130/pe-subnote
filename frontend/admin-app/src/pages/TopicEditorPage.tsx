import { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { topicsApi } from '../api/topics'
import { categoriesApi } from '../api/categories'
import { templatesApi } from '../api/templates'
import type { Topic, TopicCreate, TopicUpdate } from '../api/topics'
import type { Category } from '../api/categories'
import type { TemplateListItem } from '../api/templates'
import { Editor } from '@toast-ui/react-editor'
import '@toast-ui/editor/dist/toastui-editor.css'

export default function TopicEditorPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const token = useAuthStore((state) => state.token)
  const editorRef = useRef<Editor>(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [categories, setCategories] = useState<Category[]>([])
  const [templates, setTemplates] = useState<TemplateListItem[]>([])

  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category_id: undefined as number | undefined,
    is_published: true,
  })

  const isEditMode = !!id

  const loadCategories = async () => {
    if (!token) return
    try {
      const data = await categoriesApi.getAll(token)
      setCategories(data)
    } catch (err: any) {
      console.error('Failed to load categories:', err.message)
    }
  }

  const loadTemplates = async () => {
    if (!token) return
    try {
      const data = await templatesApi.getAll(token)
      setTemplates(data)
    } catch (err: any) {
      console.error('Failed to load templates:', err.message)
    }
  }

  const handleApplyTemplate = async (templateId: number) => {
    if (!token || !editorRef.current) return
    try {
      const template = await templatesApi.getById(token, templateId)
      editorRef.current.getInstance().setMarkdown(template.content)
      if (!formData.title) {
        setFormData({ ...formData, title: template.name })
      }
    } catch (err: any) {
      setError(err.message)
    }
  }

  const loadTopic = async () => {
    if (!token || !id) return

    try {
      setLoading(true)
      const topic = await topicsApi.getById(token, parseInt(id))
      setFormData({
        title: topic.title,
        content: topic.content,
        category_id: topic.category_id,
        is_published: topic.is_published,
      })
    } catch (err: any) {
      setError(err.message || 'Failed to load topic')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadCategories()
    loadTemplates()
    if (isEditMode) {
      loadTopic()
    }
  }, [token, id])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!token || !editorRef.current) return

    try {
      setSaving(true)
      setError('')

      // 에디터에서 마크다운 가져오기
      const content = editorRef.current.getInstance().getMarkdown()

      if (isEditMode) {
        const updateData: TopicUpdate = {
          title: formData.title,
          content: content,
          category_id: formData.category_id,
          is_published: formData.is_published,
        }
        await topicsApi.update(token, parseInt(id!), updateData)
      } else {
        const createData: TopicCreate = {
          title: formData.title,
          content: content,
          category_id: formData.category_id,
          is_published: formData.is_published,
        }
        await topicsApi.create(token, createData)
      }

      navigate('/topics')
    } catch (err: any) {
      setError(err.message || 'Failed to save topic')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          <p className="mt-2 text-gray-500">로딩 중...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/topics')}
            className="text-gray-600 hover:text-gray-900"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-3xl font-bold text-gray-900">
            {isEditMode ? '서브노트 수정' : '새 서브노트 작성'}
          </h1>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="bg-white shadow rounded-lg p-6 space-y-6">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              제목 *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="서브노트 제목을 입력하세요"
              required
            />
          </div>

          {/* Template Selector (only for new topics) */}
          {!isEditMode && templates.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                템플릿 불러오기
              </label>
              <div className="flex gap-2">
                <select
                  onChange={(e) => {
                    if (e.target.value) {
                      handleApplyTemplate(parseInt(e.target.value))
                    }
                  }}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  <option value="">템플릿 선택...</option>
                  {templates.map(template => (
                    <option key={template.id} value={template.id}>
                      {template.name}
                      {template.description && ` - ${template.description}`}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => navigate('/templates')}
                  className="px-4 py-2 text-sm border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  템플릿 관리
                </button>
              </div>
              <p className="mt-1 text-xs text-gray-500">
                템플릿을 선택하면 에디터에 내용이 자동으로 삽입됩니다
              </p>
            </div>
          )}

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              카테고리
            </label>
            <select
              value={formData.category_id || ''}
              onChange={(e) => setFormData({
                ...formData,
                category_id: e.target.value ? parseInt(e.target.value) : undefined
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="">카테고리 선택 (선택사항)</option>
              {categories.map(category => (
                <option key={category.id} value={category.id}>{category.name}</option>
              ))}
            </select>
          </div>

          {/* Content Editor */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              내용 *
            </label>
            <Editor
              ref={editorRef}
              initialValue={formData.content}
              previewStyle="vertical"
              height="600px"
              initialEditType="wysiwyg"
              useCommandShortcut={true}
              hideModeSwitch={false}
              usageStatistics={false}
              toolbarItems={[
                ['heading', 'bold', 'italic', 'strike'],
                ['hr', 'quote'],
                ['ul', 'ol', 'task', 'indent', 'outdent'],
                ['table', 'link', 'image'],
                ['code', 'codeblock'],
              ]}
            />
          </div>

          {/* Publish Status */}
          <div className="flex items-center">
            <input
              type="checkbox"
              id="is_published"
              checked={formData.is_published}
              onChange={(e) => setFormData({ ...formData, is_published: e.target.checked })}
              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
            />
            <label htmlFor="is_published" className="ml-2 block text-sm text-gray-900">
              즉시 공개
            </label>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-4 pt-4 border-t">
            <button
              type="button"
              onClick={() => navigate('/topics')}
              className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {saving ? '저장 중...' : (isEditMode ? '수정 완료' : '작성 완료')}
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}
