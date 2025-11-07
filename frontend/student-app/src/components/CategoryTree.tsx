import { useState } from 'react'
import type { CategoryTree as CategoryTreeType } from '../api/categories'

interface CategoryTreeProps {
  categories: CategoryTreeType[]
  selectedCategoryId: number | null
  onSelectCategory: (categoryId: number | null) => void
  isDarkMode?: boolean
}

interface CategoryNodeProps {
  category: CategoryTreeType
  level: number
  selectedCategoryId: number | null
  onSelectCategory: (categoryId: number | null) => void
  isDarkMode?: boolean
}

function CategoryNode({
  category,
  level,
  selectedCategoryId,
  onSelectCategory,
  isDarkMode
}: CategoryNodeProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const hasChildren = category.children && category.children.length > 0
  const isSelected = selectedCategoryId === category.id

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (hasChildren) {
      setIsExpanded(!isExpanded)
    }
  }

  const handleSelect = () => {
    onSelectCategory(category.id)
  }

  return (
    <div className="w-full">
      <div
        className={`flex items-center gap-2 py-2 px-3 cursor-pointer rounded-lg transition-colors ${
          isSelected
            ? isDarkMode
              ? 'bg-indigo-600 text-white'
              : 'bg-indigo-100 text-indigo-900'
            : isDarkMode
            ? 'hover:bg-gray-700 text-gray-200'
            : 'hover:bg-gray-100 text-gray-700'
        }`}
        style={{ paddingLeft: `${(level + 1) * 12}px` }}
        onClick={handleSelect}
      >
        {hasChildren && (
          <button
            onClick={handleToggle}
            className="flex-shrink-0 w-4 h-4 flex items-center justify-center"
          >
            <svg
              className={`w-3 h-3 transition-transform ${
                isExpanded ? 'rotate-90' : ''
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>
        )}
        {!hasChildren && <div className="w-4" />}
        <span className="text-sm font-medium truncate">{category.name}</span>
      </div>

      {isExpanded && hasChildren && (
        <div className="mt-1">
          {category.children.map((child) => (
            <CategoryNode
              key={child.id}
              category={child}
              level={level + 1}
              selectedCategoryId={selectedCategoryId}
              onSelectCategory={onSelectCategory}
              isDarkMode={isDarkMode}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default function CategoryTree({
  categories,
  selectedCategoryId,
  onSelectCategory,
  isDarkMode,
}: CategoryTreeProps) {
  return (
    <div className={`rounded-lg border ${
      isDarkMode
        ? 'bg-gray-800 border-gray-700'
        : 'bg-white border-gray-200'
    } p-3 max-h-96 overflow-y-auto`}>
      <button
        onClick={() => onSelectCategory(null)}
        className={`w-full text-left py-2 px-3 rounded-lg transition-colors mb-2 ${
          selectedCategoryId === null
            ? isDarkMode
              ? 'bg-indigo-600 text-white'
              : 'bg-indigo-100 text-indigo-900'
            : isDarkMode
            ? 'hover:bg-gray-700 text-gray-200'
            : 'hover:bg-gray-100 text-gray-700'
        }`}
      >
        <span className="text-sm font-medium">전체</span>
      </button>

      {categories.map((category) => (
        <CategoryNode
          key={category.id}
          category={category}
          level={0}
          selectedCategoryId={selectedCategoryId}
          onSelectCategory={onSelectCategory}
          isDarkMode={isDarkMode}
        />
      ))}
    </div>
  )
}
