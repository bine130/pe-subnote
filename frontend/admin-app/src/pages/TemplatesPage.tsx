import { useState, useEffect, useRef } from 'react'
import { useAuthStore } from '../store/authStore'
import { templatesApi } from '../api/templates'
import { categoriesApi } from '../api/categories'
import type { TemplateListItem, TemplateCreate, TemplateUpdate, Template } from '../api/templates'
import type { Category } from '../api/categories'
import { Editor } from '@toast-ui/react-editor'
import '@toast-ui/editor/dist/toastui-editor.css'

export default function TemplatesPage() {
  const token = useAuthStore((state) => state.token)
  const editorRef = useRef<Editor>(null)
  const [templates, setTemplates] = useState<TemplateListItem[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    content: '',
    category: '',
  })

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
      setLoading(true)
      setError('')
      const data = await templatesApi.getAll(token)
      setTemplates(data)
    } catch (err: any) {
      setError(err.message || 'Failed to load templates')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadCategories()
    loadTemplates()
  }, [token])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!token || !editorRef.current) return

    try {
      const content = editorRef.current.getInstance().getMarkdown()
      await templatesApi.create(token, {
        name: formData.name,
        description: formData.description || undefined,
        content: content,
        category: formData.category || undefined,
      })
      setShowModal(false)
      setFormData({ name: '', description: '', content: '', category: '' })
      loadTemplates()
    } catch (err: any) {
      setError(err.message)
    }
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!token || !editingTemplate || !editorRef.current) return

    try {
      const content = editorRef.current.getInstance().getMarkdown()
      await templatesApi.update(token, editingTemplate.id, {
        name: formData.name,
        description: formData.description || undefined,
        content: content,
        category: formData.category || undefined,
      })
      setEditingTemplate(null)
      setFormData({ name: '', description: '', content: '', category: '' })
      loadTemplates()
    } catch (err: any) {
      setError(err.message)
    }
  }

  const handleDelete = async (id: number) => {
    if (!token) return
    if (!confirm('정말 이 템플릿을 삭제하시겠습니까?')) return

    try {
      await templatesApi.delete(token, id)
      loadTemplates()
    } catch (err: any) {
      setError(err.message)
    }
  }

  const openCreateModal = () => {
    setFormData({ name: '', description: '', content: '', category: '' })
    setEditingTemplate(null)
    setShowModal(true)
  }

  const openEditModal = async (id: number) => {
    if (!token) return
    try {
      const template = await templatesApi.getById(token, id)
      setFormData({
        name: template.name,
        description: template.description || '',
        content: template.content,
        category: template.category || '',
      })
      setEditingTemplate(template)
      setShowModal(true)
    } catch (err: any) {
      setError(err.message)
    }
  }

  const getCategoryName = (category?: string) => {
    return category || '미분류'
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">템플릿 관리</h1>
            <p className="mt-2 text-sm text-gray-600">
              서브노트 작성 시 재사용할 수 있는 템플릿을 관리합니다
            </p>
          </div>
          <button
            onClick={openCreateModal}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
          >
            새 템플릿 추가
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700">
          {error}
        </div>
      )}

      <div className="bg-white shadow rounded-lg overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            <p className="mt-2 text-gray-500">로딩 중...</p>
          </div>
        ) : templates.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            템플릿이 없습니다. 새 템플릿을 추가해보세요.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    이름
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    설명
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    카테고리
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    작성일
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    작업
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {templates.map((template) => (
                  <tr key={template.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{template.name}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-500 truncate max-w-md">
                        {template.description || '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{getCategoryName(template.category)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(template.created_at).toLocaleDateString('ko-KR')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => openEditModal(template.id)}
                          className="px-3 py-1 text-indigo-600 hover:text-indigo-800"
                        >
                          수정
                        </button>
                        <button
                          onClick={() => handleDelete(template.id)}
                          className="px-3 py-1 text-red-600 hover:text-red-800"
                        >
                          삭제
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl m-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">
              {editingTemplate ? '템플릿 수정' : '새 템플릿 추가'}
            </h2>
            <form onSubmit={editingTemplate ? handleUpdate : handleCreate}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    이름 *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    설명
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    rows={2}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    카테고리
                  </label>
                  <input
                    type="text"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="카테고리명 입력 (선택사항)"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    템플릿 내용 *
                  </label>
                  <Editor
                    ref={editorRef}
                    initialValue={formData.content}
                    previewStyle="vertical"
                    height="400px"
                    initialEditType="wysiwyg"
                    useCommandShortcut={true}
                    hideModeSwitch={false}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false)
                    setEditingTemplate(null)
                    setFormData({ name: '', description: '', content: '', category: '' })
                  }}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                >
                  {editingTemplate ? '수정' : '추가'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
