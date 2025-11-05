import { useState, useEffect } from 'react'
import { useAuthStore } from '../store/authStore'
import { categoriesApi } from '../api/categories'
import type { Category } from '../api/categories'

export default function CategoriesPage() {
  const token = useAuthStore((state) => state.token)
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    parent_id: undefined as number | undefined,
  })

  const loadCategories = async () => {
    if (!token) return

    try {
      setLoading(true)
      setError('')
      const data = await categoriesApi.getTree(token)
      setCategories(data)
    } catch (err: any) {
      setError(err.message || 'Failed to load categories')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadCategories()
  }, [token])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!token) return

    try {
      await categoriesApi.create(token, {
        name: formData.name,
        description: formData.description || undefined,
        parent_id: formData.parent_id || undefined,
      })
      setShowCreateModal(false)
      setFormData({ name: '', description: '', parent_id: '' })
      loadCategories()
    } catch (err: any) {
      setError(err.message)
    }
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!token || !editingCategory) return

    try {
      await categoriesApi.update(token, editingCategory.id, {
        name: formData.name,
        description: formData.description || undefined,
      })
      setEditingCategory(null)
      setFormData({ name: '', description: '', parent_id: '' })
      loadCategories()
    } catch (err: any) {
      setError(err.message)
    }
  }

  const handleDelete = async (id: number) => {
    if (!token) return
    if (!confirm('정말 이 카테고리를 삭제하시겠습니까?')) return

    try {
      await categoriesApi.delete(token, id)
      loadCategories()
    } catch (err: any) {
      setError(err.message)
    }
  }

  const openCreateModal = (parentId?: number) => {
    setFormData({ name: '', description: '', parent_id: parentId })
    setShowCreateModal(true)
  }

  const openEditModal = (category: Category) => {
    setFormData({
      name: category.name,
      description: category.description || '',
      parent_id: category.parent_id,
    })
    setEditingCategory(category)
  }

  const renderCategoryTree = (items: Category[], level: number = 0) => {
    return items.map((category) => (
      <div key={category.id} className="border-l-2 border-gray-200">
        <div
          className={`flex items-center justify-between p-3 hover:bg-gray-50 ${
            level > 0 ? 'ml-' + (level * 4) : ''
          }`}
          style={{ paddingLeft: `${level * 1.5 + 0.75}rem` }}
        >
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
              </svg>
              <div>
                <div className="font-medium text-gray-900">{category.name}</div>
                {category.description && (
                  <div className="text-sm text-gray-500">{category.description}</div>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => openCreateModal(category.id)}
              className="px-3 py-1 text-sm text-blue-600 hover:text-blue-800"
              title="하위 카테고리 추가"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
            <button
              onClick={() => openEditModal(category)}
              className="px-3 py-1 text-sm text-indigo-600 hover:text-indigo-800"
            >
              수정
            </button>
            <button
              onClick={() => handleDelete(category.id)}
              className="px-3 py-1 text-sm text-red-600 hover:text-red-800"
            >
              삭제
            </button>
          </div>
        </div>
        {category.children && category.children.length > 0 && (
          <div>{renderCategoryTree(category.children, level + 1)}</div>
        )}
      </div>
    ))
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">카테고리 관리</h1>
            <p className="mt-2 text-sm text-gray-600">
              서브노트 카테고리를 계층 구조로 관리합니다
            </p>
          </div>
          <button
            onClick={() => openCreateModal()}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
          >
            새 카테고리 추가
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
        ) : categories.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            카테고리가 없습니다. 새 카테고리를 추가해보세요.
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {renderCategoryTree(categories)}
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {(showCreateModal || editingCategory) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">
              {editingCategory ? '카테고리 수정' : '새 카테고리 추가'}
            </h2>
            <form onSubmit={editingCategory ? handleUpdate : handleCreate}>
              <div className="mb-4">
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
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  설명
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  rows={3}
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false)
                    setEditingCategory(null)
                    setFormData({ name: '', description: '', parent_id: undefined })
                  }}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                >
                  {editingCategory ? '수정' : '추가'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
