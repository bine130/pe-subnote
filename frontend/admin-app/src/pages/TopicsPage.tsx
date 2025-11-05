import { useState, useEffect } from 'react'
import { useAuthStore } from '../store/authStore'
import { topicsApi } from '../api/topics'
import { categoriesApi } from '../api/categories'
import type { TopicListItem } from '../api/topics'
import type { Category } from '../api/categories'
import { useNavigate } from 'react-router-dom'

export default function TopicsPage() {
  const token = useAuthStore((state) => state.token)
  const navigate = useNavigate()
  const [topics, setTopics] = useState<TopicListItem[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<number | 'all'>('all')
  const [publishFilter, setPublishFilter] = useState<boolean | 'all'>('all')

  const loadCategories = async () => {
    if (!token) return
    try {
      const data = await categoriesApi.getAll(token)
      setCategories(data)
    } catch (err: any) {
      console.error('Failed to load categories:', err.message)
    }
  }

  const loadTopics = async () => {
    if (!token) return

    try {
      setLoading(true)
      setError('')

      const filters: any = {}
      if (categoryFilter !== 'all') {
        filters.category_id = categoryFilter
      }
      if (publishFilter !== 'all') {
        filters.is_published = publishFilter
      }

      const data = await topicsApi.getAll(token, filters)
      setTopics(data)
    } catch (err: any) {
      setError(err.message || 'Failed to load topics')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadCategories()
  }, [token])

  useEffect(() => {
    loadTopics()
  }, [token, categoryFilter, publishFilter])

  const handleDelete = async (id: number) => {
    if (!token) return
    if (!confirm('정말 이 서브노트를 삭제하시겠습니까?')) return

    try {
      await topicsApi.delete(token, id)
      loadTopics()
    } catch (err: any) {
      setError(err.message)
    }
  }

  const handleTogglePublish = async (id: number) => {
    if (!token) return

    try {
      await topicsApi.togglePublish(token, id)
      loadTopics()
    } catch (err: any) {
      setError(err.message)
    }
  }

  const getCategoryName = (categoryId?: number) => {
    if (!categoryId) return '미분류'
    const category = categories.find(c => c.id === categoryId)
    return category?.name || `카테고리 ${categoryId}`
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">서브노트 관리</h1>
            <p className="mt-2 text-sm text-gray-600">
              기술사 시험 서브노트를 작성하고 관리합니다
            </p>
          </div>
          <button
            onClick={() => navigate('/topics/new')}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
          >
            새 서브노트 작성
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700">
          {error}
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg shadow mb-6 p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              카테고리
            </label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value === 'all' ? 'all' : parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="all">전체 카테고리</option>
              {categories.map(category => (
                <option key={category.id} value={category.id}>{category.name}</option>
              ))}
            </select>
          </div>

          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              공개 상태
            </label>
            <select
              value={publishFilter.toString()}
              onChange={(e) => {
                const val = e.target.value
                setPublishFilter(val === 'all' ? 'all' : val === 'true')
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="all">전체</option>
              <option value="true">공개</option>
              <option value="false">비공개</option>
            </select>
          </div>
        </div>
      </div>

      {/* Topics Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            <p className="mt-2 text-gray-500">로딩 중...</p>
          </div>
        ) : topics.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            서브노트가 없습니다. 새 서브노트를 작성해보세요.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    제목
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    카테고리
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    상태
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    조회수
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
                {topics.map((topic) => (
                  <tr key={topic.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{topic.title}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{getCategoryName(topic.category_id)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        topic.is_published
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {topic.is_published ? '공개' : '비공개'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {topic.view_count}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(topic.created_at).toLocaleDateString('ko-KR')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => navigate(`/topics/${topic.id}`)}
                          className="px-3 py-1 text-indigo-600 hover:text-indigo-800"
                        >
                          수정
                        </button>
                        <button
                          onClick={() => handleTogglePublish(topic.id)}
                          className="px-3 py-1 text-blue-600 hover:text-blue-800"
                        >
                          {topic.is_published ? '비공개' : '공개'}
                        </button>
                        <button
                          onClick={() => handleDelete(topic.id)}
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

      {/* Stats */}
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm font-medium text-gray-500">전체 서브노트</div>
          <div className="mt-1 text-3xl font-semibold text-gray-900">
            {topics.length}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm font-medium text-gray-500">공개</div>
          <div className="mt-1 text-3xl font-semibold text-green-600">
            {topics.filter(t => t.is_published).length}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm font-medium text-gray-500">비공개</div>
          <div className="mt-1 text-3xl font-semibold text-gray-600">
            {topics.filter(t => !t.is_published).length}
          </div>
        </div>
      </div>
    </div>
  )
}
