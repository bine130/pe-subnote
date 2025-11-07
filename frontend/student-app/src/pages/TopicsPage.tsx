import { useState, useEffect, useRef, useCallback } from 'react'
import { useAuthStore } from '../store/authStore'
import { topicsApi, type TopicListItem } from '../api/topics'
import { bookmarksApi } from '../api/bookmarks'
import { categoriesApi } from '../api/categories'
import type { CategoryTree as CategoryTreeType } from '../api/categories'
import TopicDetailModal from '../components/TopicDetailModal'
import CategoryTree from '../components/CategoryTree'

export default function TopicsPage() {
  const { token, user } = useAuthStore()
  const [topics, setTopics] = useState<TopicListItem[]>([])
  const [initialLoading, setInitialLoading] = useState(true)
  const [topicsLoading, setTopicsLoading] = useState(false)
  const [error, setError] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTopicId, setSelectedTopicId] = useState<number | null>(null)
  const [selectedTopicRect, setSelectedTopicRect] = useState<DOMRect | null>(null)
  const [showBookmarkedOnly, setShowBookmarkedOnly] = useState(false)
  const [bookmarkedTopicIds, setBookmarkedTopicIds] = useState<Set<number>>(new Set())
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [categories, setCategories] = useState<CategoryTreeType[]>([])
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null)
  const [showCategoryTree, setShowCategoryTree] = useState(false)
  const categoryDropdownRef = useRef<HTMLDivElement>(null)
  const [page, setPage] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const observerTarget = useRef<HTMLDivElement>(null)
  const isLoadingRef = useRef(false)
  const [selectedImportance, setSelectedImportance] = useState<number | null>(null)
  const [showImportanceDropdown, setShowImportanceDropdown] = useState(false)
  const importanceDropdownRef = useRef<HTMLDivElement>(null)

  const loadTopics = useCallback(async (isInitial = false, pageNum = 0, searchOverride?: string) => {
    if (isLoadingRef.current) return

    try {
      isLoadingRef.current = true
      if (isInitial) {
        setInitialLoading(true)
      } else {
        setTopicsLoading(true)
      }
      const data = await topicsApi.getAll({
        category_id: selectedCategoryId || undefined,
        search: (searchOverride !== undefined ? searchOverride : searchQuery) || undefined,
        skip: pageNum * 10,
        limit: 10,
      })

      if (pageNum === 0) {
        setTopics(data)
      } else {
        setTopics(prev => {
          // 중복 제거: 기존 항목의 ID 집합 생성
          const existingIds = new Set(prev.map(t => t.id))
          const newItems = data.filter(item => !existingIds.has(item.id))
          return [...prev, ...newItems]
        })
      }

      setHasMore(data.length === 10)
    } catch (err: any) {
      setError(err.message || 'Failed to load topics')
    } finally {
      if (isInitial) {
        setInitialLoading(false)
      } else {
        setTopicsLoading(false)
      }
      isLoadingRef.current = false
    }
  }, [selectedCategoryId, searchQuery])

  const loadCategories = async () => {
    try {
      const data = await categoriesApi.getTree()
      setCategories(data)
    } catch (err) {
      console.error('Failed to load categories:', err)
    }
  }

  const loadBookmarks = async () => {
    if (!token) return
    try {
      const bookmarks = await bookmarksApi.getAll(token)
      const ids = new Set(bookmarks.map(b => b.topic_id))
      setBookmarkedTopicIds(ids)
    } catch (err) {
      console.error('Failed to load bookmarks:', err)
    }
  }

  // Initial load only
  useEffect(() => {
    loadTopics(true, 0)
    loadBookmarks()
    loadCategories()

    // 초기 히스토리 상태 설정
    if (!window.history.state?.appState) {
      window.history.replaceState({ appState: 'main' }, '')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Reset and reload when category changes
  useEffect(() => {
    if (initialLoading) return
    setPage(0)
    setHasMore(true)
    loadTopics(false, 0)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCategoryId])

  // Set up Intersection Observer (only recreate when these specific values change)
  useEffect(() => {
    if (initialLoading) return

    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && hasMore && !topicsLoading && !isLoadingRef.current) {
          const nextPage = page + 1
          setPage(nextPage)
          loadTopics(false, nextPage)
        }
      },
      { threshold: 0.1 }
    )

    const target = observerTarget.current
    if (target) {
      observer.observe(target)
    }

    return () => {
      if (target) {
        observer.unobserve(target)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasMore, topicsLoading, initialLoading])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (categoryDropdownRef.current && !categoryDropdownRef.current.contains(event.target as Node)) {
        setShowCategoryTree(false)
      }
      if (importanceDropdownRef.current && !importanceDropdownRef.current.contains(event.target as Node)) {
        setShowImportanceDropdown(false)
      }
    }

    if (showCategoryTree || showImportanceDropdown) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showCategoryTree, showImportanceDropdown])

  // 뒤로가기 버튼 처리
  useEffect(() => {
    const handlePopState = () => {
      // 모달이 열려있으면 닫기
      if (selectedTopicId !== null) {
        setSelectedTopicId(null)
        setSelectedTopicRect(null)
        loadBookmarks()
        return
      }

      // 검색어가 있으면 초기화
      if (searchQuery) {
        setSearchQuery('')
        setPage(0)
        loadTopics(false, 0, '')
        return
      }

      // 필터가 활성화되어 있으면 초기화
      if (selectedCategoryId !== null) {
        setSelectedCategoryId(null)
        return
      }

      if (selectedImportance !== null) {
        setSelectedImportance(null)
        return
      }

      if (showBookmarkedOnly) {
        setShowBookmarkedOnly(false)
        return
      }
    }

    window.addEventListener('popstate', handlePopState)

    return () => {
      window.removeEventListener('popstate', handlePopState)
    }
  }, [selectedTopicId, searchQuery, selectedCategoryId, selectedImportance, showBookmarkedOnly, loadTopics])

  const filteredTopics = topics
    .filter(topic => {
      // 북마크 필터
      if (showBookmarkedOnly && !bookmarkedTopicIds.has(topic.id)) return false
      // 중요도 필터
      if (selectedImportance !== null && topic.importance_level !== selectedImportance) return false
      return true
    })

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(0)
    loadTopics(false, 0)

    // 히스토리에 검색 상태 추가
    if (searchQuery) {
      window.history.pushState({ appState: 'search', query: searchQuery }, '')
    }
  }

  const handleTopicClick = (topicId: number, event: React.MouseEvent<HTMLDivElement>) => {
    const card = event.currentTarget as HTMLElement
    const rect = card.getBoundingClientRect()
    setSelectedTopicRect(rect)
    setSelectedTopicId(topicId)

    // 히스토리에 모달 상태 추가
    window.history.pushState({ appState: 'modal', topicId }, '')
  }

  const handleCloseDetail = () => {
    setSelectedTopicId(null)
    setSelectedTopicRect(null)
    loadBookmarks() // 북마크 상태 갱신
  }

  const handleKeywordClick = (keyword: string) => {
    setSearchQuery(keyword)
    setPage(0)
    setHasMore(true)
    loadTopics(false, 0, keyword)

    // 히스토리에 키워드 검색 상태 추가
    window.history.pushState({ appState: 'search', query: keyword }, '')
  }

  const handleCategorySelect = (categoryId: number | null) => {
    setSelectedCategoryId(categoryId)
    setShowCategoryTree(false)

    // 히스토리에 카테고리 필터 상태 추가
    if (categoryId !== null) {
      window.history.pushState({ appState: 'filter', type: 'category', categoryId }, '')
    }
  }

  const getCategoryName = (categoryId: number | null): string => {
    if (categoryId === null) return '전체'

    const findCategory = (cats: CategoryTreeType[], id: number): CategoryTreeType | null => {
      for (const cat of cats) {
        if (cat.id === id) return cat
        if (cat.children) {
          const found = findCategory(cat.children, id)
          if (found) return found
        }
      }
      return null
    }

    const category = findCategory(categories, categoryId)
    return category?.name || '전체'
  }

  const handleBookmarkToggle = async (e: React.MouseEvent, topicId: number) => {
    e.stopPropagation() // 카드 클릭 이벤트 방지

    if (!token) return

    try {
      // 토글 API 호출
      await bookmarksApi.toggle(topicId, token)

      // 로컬 상태 업데이트
      if (bookmarkedTopicIds.has(topicId)) {
        // 북마크 해제
        setBookmarkedTopicIds(prev => {
          const next = new Set(prev)
          next.delete(topicId)
          return next
        })
      } else {
        // 북마크 추가
        setBookmarkedTopicIds(prev => new Set([...prev, topicId]))
      }
    } catch (err) {
      console.error('Failed to toggle bookmark:', err)
    }
  }

  if (initialLoading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${
        isDarkMode ? 'dark bg-gray-900' : 'bg-gray-50'
      }`}>
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          <p className={`mt-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>로딩 중...</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`h-screen flex flex-col overflow-hidden ${isDarkMode ? 'dark bg-gray-900' : 'bg-gray-50'}`}>
      {/* Header */}
      <header className={`shadow-sm flex-shrink-0 z-10 ${
        isDarkMode ? 'bg-gray-800' : 'bg-white'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsDarkMode(!isDarkMode)}
                className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center cursor-pointer hover:from-indigo-700 hover:to-purple-700 transition-all"
                title={isDarkMode ? '라이트 모드' : '다크 모드'}
              >
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </button>
              <div>
                <h1 className={`text-xl font-bold ${
                  isDarkMode ? 'text-gray-100' : 'text-gray-900'
                }`}>PE Subnote</h1>
                <p className={`text-xs ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-500'
                }`}>{user?.name} ({user?.cohort}기)</p>
              </div>
            </div>
            <button
              onClick={() => useAuthStore.getState().logout()}
              className={`text-sm ${
                isDarkMode
                  ? 'text-gray-300 hover:text-gray-100'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              로그아웃
            </button>
          </div>

          {/* Search Bar */}
          <form onSubmit={handleSearch} className="relative mb-3">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="제목 또는 키워드로 검색..."
              className={`w-full px-4 py-3 pl-12 ${searchQuery ? 'pr-12' : 'pr-4'} border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
                isDarkMode
                  ? 'bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400'
                  : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-500'
              }`}
            />
            <svg
              className={`absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 ${
                isDarkMode ? 'text-gray-400' : 'text-gray-400'
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('')
                  setPage(0)
                  loadTopics(false, 0, '')
                }}
                className={`absolute right-4 top-1/2 transform -translate-y-1/2 w-5 h-5 rounded-full flex items-center justify-center transition-colors ${
                  isDarkMode
                    ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-600'
                    : 'text-gray-400 hover:text-gray-600 hover:bg-gray-200'
                }`}
                title="검색어 지우기"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </form>

          {/* Filter Buttons */}
          <div className="flex items-center gap-2">
            <div className="relative" ref={categoryDropdownRef}>
              <button
                onClick={() => setShowCategoryTree(!showCategoryTree)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isDarkMode
                    ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                </svg>
                {getCategoryName(selectedCategoryId)}
                <svg
                  className={`w-4 h-4 transition-transform ${showCategoryTree ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {showCategoryTree && (
                <div className="absolute top-full left-0 mt-2 w-80 z-20">
                  <CategoryTree
                    categories={categories}
                    selectedCategoryId={selectedCategoryId}
                    onSelectCategory={handleCategorySelect}
                    isDarkMode={isDarkMode}
                  />
                </div>
              )}
            </div>

            {/* Importance Filter */}
            <div className="relative" ref={importanceDropdownRef}>
              <button
                onClick={() => setShowImportanceDropdown(!showImportanceDropdown)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedImportance !== null
                    ? 'bg-yellow-100 text-yellow-700'
                    : isDarkMode
                      ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  {selectedImportance !== null ? (
                    [...Array(5)].map((_, idx) => (
                      <svg
                        key={idx}
                        className={`w-4 h-4 ${
                          idx < selectedImportance ? 'text-yellow-400' : 'text-gray-300'
                        }`}
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                      <span>전체</span>
                    </>
                  )}
                </div>
                <svg
                  className={`w-4 h-4 transition-transform ${showImportanceDropdown ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {showImportanceDropdown && (
                <div className={`absolute top-full left-0 mt-2 w-48 rounded-lg border z-20 ${
                  isDarkMode
                    ? 'bg-gray-800 border-gray-700'
                    : 'bg-white border-gray-200'
                } p-2 shadow-lg`}>
                  <button
                    onClick={() => {
                      setSelectedImportance(null)
                      setShowImportanceDropdown(false)
                    }}
                    className={`w-full flex justify-center py-2 px-3 rounded-lg transition-colors mb-1 ${
                      selectedImportance === null
                        ? isDarkMode
                          ? 'bg-indigo-600 text-white'
                          : 'bg-indigo-100 text-indigo-900'
                        : isDarkMode
                        ? 'hover:bg-gray-700 text-gray-200'
                        : 'hover:bg-gray-100 text-gray-700'
                    }`}
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  </button>

                  {[5, 4, 3, 2, 1].map(level => (
                    <button
                      key={level}
                      onClick={() => {
                        setSelectedImportance(level)
                        setShowImportanceDropdown(false)
                        // 히스토리에 중요도 필터 상태 추가
                        window.history.pushState({ appState: 'filter', type: 'importance', level }, '')
                      }}
                      className={`w-full flex justify-center py-2 px-3 rounded-lg transition-colors mb-1 ${
                        selectedImportance === level
                          ? isDarkMode
                            ? 'bg-yellow-600 text-white'
                            : 'bg-yellow-100 text-yellow-900'
                          : isDarkMode
                          ? 'hover:bg-gray-700 text-gray-200'
                          : 'hover:bg-gray-100 text-gray-700'
                      }`}
                    >
                      <div className="flex items-center gap-0.5">
                        {[...Array(5)].map((_, idx) => (
                          <svg
                            key={idx}
                            className={`w-4 h-4 ${
                              idx < level ? 'text-yellow-400' : 'text-gray-300'
                            }`}
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        ))}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button
              onClick={() => {
                const newValue = !showBookmarkedOnly
                setShowBookmarkedOnly(newValue)
                // 히스토리에 북마크 필터 상태 추가
                if (newValue) {
                  window.history.pushState({ appState: 'filter', type: 'bookmark' }, '')
                }
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                showBookmarkedOnly
                  ? 'bg-red-100 text-red-700'
                  : isDarkMode
                    ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <svg className="w-4 h-4" fill={showBookmarkedOnly ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              북마크 ({bookmarkedTopicIds.size})
            </button>
          </div>
        </div>
      </header>

      {/* Topics List */}
      <main className="flex-1 overflow-y-auto relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {error && (
          <div className={`mb-6 p-4 border-l-4 border-red-500 rounded-r ${
            isDarkMode ? 'bg-red-900/20 text-red-300' : 'bg-red-50 text-red-700'
          }`}>
            {error}
          </div>
        )}

        {topicsLoading && filteredTopics.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
              <p className={`mt-2 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>로딩 중...</p>
            </div>
          </div>
        ) : filteredTopics.length === 0 ? (
          <div className="text-center py-12">
            <svg className={`mx-auto h-12 w-12 ${
              isDarkMode ? 'text-gray-600' : 'text-gray-400'
            }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className={`mt-2 text-sm font-medium ${
              isDarkMode ? 'text-gray-200' : 'text-gray-900'
            }`}>서브노트가 없습니다</h3>
            <p className={`mt-1 text-sm ${
              isDarkMode ? 'text-gray-400' : 'text-gray-500'
            }`}>{showBookmarkedOnly ? '북마크한 서브노트가 없습니다' : '검색어를 변경하거나 나중에 다시 시도해보세요'}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredTopics.map((topic) => (
              <div
                key={topic.id}
                onClick={(e) => handleTopicClick(topic.id, e)}
                className={`rounded-xl shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer border ${
                  isDarkMode
                    ? 'bg-gray-800 border-gray-700 hover:border-indigo-500'
                    : 'bg-white border-gray-100 hover:border-indigo-200'
                }`}
              >
                <div className="p-5">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        {topic.category && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200 flex-shrink-0">
                            {topic.category.name}
                          </span>
                        )}
                        <h3 className={`text-lg font-semibold line-clamp-1 ${
                          isDarkMode ? 'text-gray-100' : 'text-gray-900'
                        }`}>
                          {topic.title.replace(/^[^-]+-\s*/, '')}
                        </h3>
                      </div>

                      {/* Keywords */}
                      {topic.keywords && (
                        <div className="flex flex-wrap gap-2 mb-3">
                          {topic.keywords.split(',').map((keyword, idx) => (
                            <button
                              key={idx}
                              onClick={(e) => {
                                e.stopPropagation()
                                handleKeywordClick(keyword.trim())
                              }}
                              className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-colors"
                            >
                              {keyword.trim()}
                            </button>
                          ))}
                        </div>
                      )}

                      {/* Mnemonic */}
                      {topic.mnemonic && (
                        <div className={`mb-3 p-3 border-l-4 border-yellow-400 rounded-r ${
                          isDarkMode ? 'bg-yellow-900/20' : 'bg-yellow-50'
                        }`}>
                          <p className={`text-sm font-medium flex items-start gap-2 ${
                            isDarkMode ? 'text-yellow-200' : 'text-yellow-800'
                          }`}>
                            <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                            <span className="line-clamp-2">{topic.mnemonic}</span>
                          </p>
                        </div>
                      )}

                      {/* Meta Info */}
                      <div className={`flex items-center gap-4 text-xs ${
                        isDarkMode ? 'text-gray-400' : 'text-gray-500'
                      }`}>
                        <div className="flex items-center gap-1">
                          {[...Array(5)].map((_, idx) => (
                            <svg
                              key={idx}
                              className={`w-4 h-4 ${
                                idx < topic.importance_level ? 'text-yellow-400' : 'text-gray-300'
                              }`}
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                          ))}
                        </div>
                        <div className="flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                          <span>{topic.view_count}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                          </svg>
                          <span>{topic.comments_count}</span>
                        </div>
                        {topic.updated_at && (
                          <div className="flex items-center gap-1">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span>
                              {(() => {
                                try {
                                  const date = new Date(topic.updated_at)
                                  if (isNaN(date.getTime())) return null
                                  return date.toLocaleDateString('ko-KR', {
                                    year: 'numeric',
                                    month: '2-digit',
                                    day: '2-digit'
                                  })
                                } catch {
                                  return null
                                }
                              })()}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 flex-shrink-0 ml-4">
                      <button
                        onClick={(e) => handleBookmarkToggle(e, topic.id)}
                        className="hover:scale-110 transition-transform"
                        title={bookmarkedTopicIds.has(topic.id) ? '북마크 해제' : '북마크 추가'}
                      >
                        <svg
                          className={`w-5 h-5 ${bookmarkedTopicIds.has(topic.id) ? 'text-red-500' : isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}
                          fill={bookmarkedTopicIds.has(topic.id) ? 'currentColor' : 'none'}
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                      </button>
                      <svg className={`w-6 h-6 ${
                        isDarkMode ? 'text-gray-500' : 'text-gray-400'
                      }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Infinite Scroll Observer Target */}
        {!topicsLoading && hasMore && filteredTopics.length > 0 && (
          <div ref={observerTarget} className="h-10 flex items-center justify-center">
            <div className="text-sm text-gray-400">스크롤하여 더 보기...</div>
          </div>
        )}

        {topicsLoading && filteredTopics.length > 0 && (
          <div className="py-4 flex items-center justify-center">
            <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
          </div>
        )}
        </div>
      </main>

      {/* Topic Detail Modal */}
      {selectedTopicId && (
        <TopicDetailModal
          topicId={selectedTopicId}
          onClose={handleCloseDetail}
          cardRect={selectedTopicRect}
          isDarkMode={isDarkMode}
          onToggleDarkMode={() => setIsDarkMode(!isDarkMode)}
          onKeywordClick={handleKeywordClick}
        />
      )}
    </div>
  )
}
