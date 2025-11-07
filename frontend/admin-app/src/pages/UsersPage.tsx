import { useState, useEffect } from 'react'
import { useAuthStore } from '../store/authStore'
import { usersApi } from '../api/users'
import type { User } from '../api/users'

export default function UsersPage() {
  const token = useAuthStore((state) => state.token)
  const [users, setUsers] = useState<User[]>([])
  const [pendingUsers, setPendingUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved'>('pending')
  const [cohortFilter, setCohortFilter] = useState<number | 'all'>('all')

  const loadUsers = async () => {
    if (!token) return

    try {
      setLoading(true)
      setError('')

      if (filter === 'pending') {
        const data = await usersApi.getPending(token)
        setPendingUsers(data)
        setUsers([])
      } else {
        const filters: any = {}
        if (filter === 'approved') {
          filters.approval_status = 'approved'
        }
        const data = await usersApi.getAll(token, filters)
        setUsers(data)
        setPendingUsers([])
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load users')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadUsers()
  }, [filter])

  const handleApprove = async (userId: string) => {
    if (!token) return

    try {
      await usersApi.approve(token, userId)
      loadUsers()
    } catch (err: any) {
      setError(err.message)
    }
  }

  const handleReject = async (userId: string) => {
    if (!token) return
    if (!confirm('정말 이 사용자를 거부하시겠습니까?')) return

    try {
      await usersApi.reject(token, userId)
      loadUsers()
    } catch (err: any) {
      setError(err.message)
    }
  }

  const handleDelete = async (userId: string) => {
    if (!token) return
    if (!confirm('정말 이 사용자를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) return

    try {
      await usersApi.delete(token, userId)
      loadUsers()
    } catch (err: any) {
      setError(err.message)
    }
  }

  const handleRoleChange = async (userId: string, currentRole: string) => {
    if (!token) return
    const newRole = currentRole === 'admin' ? 'student' : 'admin'
    const roleLabel = newRole === 'admin' ? '관리자' : '수강생'

    if (!confirm(`이 사용자를 ${roleLabel}로 변경하시겠습니까?`)) return

    try {
      await usersApi.updateRole(token, userId, newRole)
      loadUsers()
    } catch (err: any) {
      setError(err.message)
    }
  }

  const displayUsers = filter === 'pending' ? pendingUsers : users
  const cohorts = Array.from(new Set(displayUsers.map(u => u.cohort))).sort()

  const filteredUsers = cohortFilter === 'all'
    ? displayUsers
    : displayUsers.filter(u => u.cohort === cohortFilter)

  const getStatusBadge = (status: string) => {
    const styles = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
    }
    const labels = {
      pending: '승인 대기',
      approved: '승인 완료',
      rejected: '거부됨',
    }
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${styles[status as keyof typeof styles]}`}>
        {labels[status as keyof typeof labels]}
      </span>
    )
  }

  const getRoleBadge = (role: string) => {
    const styles = {
      admin: 'bg-purple-100 text-purple-800',
      student: 'bg-blue-100 text-blue-800',
    }
    const labels = {
      admin: '관리자',
      student: '수강생',
    }
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${styles[role as keyof typeof styles]}`}>
        {labels[role as keyof typeof labels]}
      </span>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">사용자 관리</h1>
        <p className="mt-2 text-sm text-gray-600">
          수강생 승인 및 관리
        </p>
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
              상태
            </label>
            <div className="flex gap-2">
              <button
                onClick={() => setFilter('pending')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  filter === 'pending'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                승인 대기 ({pendingUsers.length})
              </button>
              <button
                onClick={() => setFilter('approved')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  filter === 'approved'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                승인 완료
              </button>
              <button
                onClick={() => setFilter('all')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  filter === 'all'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                전체
              </button>
            </div>
          </div>

          <div className="w-full sm:w-48">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              기수
            </label>
            <select
              value={cohortFilter}
              onChange={(e) => setCohortFilter(e.target.value === 'all' ? 'all' : parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="all">전체 기수</option>
              {cohorts.map(cohort => (
                <option key={cohort} value={cohort}>{cohort}기</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            <p className="mt-2 text-gray-500">로딩 중...</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            사용자가 없습니다.
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
                    이메일
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    기수
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    권한
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    상태
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    가입일
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    작업
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{user.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{user.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{user.cohort}기</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getRoleBadge(user.role)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(user.approval_status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(user.created_at).toLocaleDateString('ko-KR')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      {user.approval_status === 'pending' ? (
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => handleApprove(user.id)}
                            className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                          >
                            승인
                          </button>
                          <button
                            onClick={() => handleReject(user.id)}
                            className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                          >
                            거부
                          </button>
                        </div>
                      ) : (
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => handleRoleChange(user.id, user.role)}
                            className="px-3 py-1 bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors"
                          >
                            {user.role === 'admin' ? '수강생으로' : '관리자로'}
                          </button>
                          <button
                            onClick={() => handleDelete(user.id)}
                            className="px-3 py-1 text-red-600 hover:text-red-800"
                          >
                            삭제
                          </button>
                        </div>
                      )}
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
          <div className="text-sm font-medium text-gray-500">전체 사용자</div>
          <div className="mt-1 text-3xl font-semibold text-gray-900">
            {users.length + pendingUsers.length}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm font-medium text-gray-500">승인 대기</div>
          <div className="mt-1 text-3xl font-semibold text-yellow-600">
            {pendingUsers.length}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm font-medium text-gray-500">승인 완료</div>
          <div className="mt-1 text-3xl font-semibold text-green-600">
            {users.filter(u => u.approval_status === 'approved').length}
          </div>
        </div>
      </div>
    </div>
  )
}
