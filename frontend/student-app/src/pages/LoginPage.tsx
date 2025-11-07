import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google'
import { authApi } from '../api/auth'
import { useAuthStore } from '../store/authStore'

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || ''

export default function LoginPage() {
  const navigate = useNavigate()
  const setAuth = useAuthStore((state) => state.setAuth)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showRegister, setShowRegister] = useState(false)
  const [registerData, setRegisterData] = useState({ name: '', cohort: '', idToken: '' })

  const handleGoogleSuccess = async (credentialResponse: any) => {
    setLoading(true)
    setError('')

    const idToken = credentialResponse.credential

    try {
      // 로그인 시도
      const tokenResponse = await authApi.login({
        provider: 'google',
        id_token: idToken,
      })

      // 사용자 정보 가져오기
      const user = await authApi.getMe(tokenResponse.access_token)

      // 승인 대기 중인 사용자 체크
      if (user.approval_status === 'pending') {
        setError('Account pending approval. Please wait for admin approval.')
        setLoading(false)
        return
      }

      if (user.approval_status === 'rejected') {
        setError('Account has been rejected. Please contact administrator.')
        setLoading(false)
        return
      }

      // 로그인 성공
      setAuth(tokenResponse.access_token, user)
      navigate('/', { replace: true })
    } catch (err: any) {
      if (err.message.includes('not found')) {
        // 회원가입 필요
        setShowRegister(true)
        setRegisterData({ ...registerData, idToken: idToken })
        setError('')
      } else if (err.message.includes('pending approval')) {
        setError('Your account is pending approval. Please wait for administrator approval.')
      } else if (err.message.includes('rejected')) {
        setError('Your account has been rejected. Please contact administrator.')
      } else {
        setError(err.message || 'Authentication failed')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      await authApi.register({
        provider: 'google',
        id_token: registerData.idToken,
        name: registerData.name,
        cohort: parseInt(registerData.cohort),
      })

      // 회원가입 성공 - 승인 대기 메시지
      setError('Registration successful! Your account is pending approval. Please wait for administrator to approve your account.')
      setShowRegister(false)
    } catch (err: any) {
      setError(err.message || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-10">
          <div className="text-center mb-8">
            <div className="mb-6">
              <div className="w-20 h-20 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                PE Subnote
              </h1>
              <p className="text-gray-600">
                기술사 합격을 위한 서브노트
              </p>
            </div>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-r text-red-700 text-sm">
              <div className="flex items-center">
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                {error}
              </div>
            </div>
          )}

          <div className="space-y-4">
            {!showRegister ? (
              <>
                <div className="flex justify-center">
                  <GoogleLogin
                    onSuccess={handleGoogleSuccess}
                    onError={() => setError('Google login failed')}
                    theme="outline"
                    size="large"
                    text="signin_with"
                    shape="rectangular"
                    width="280"
                  />
                </div>

                <div className="flex justify-center opacity-50 cursor-not-allowed" title="Apple 로그인 준비 중">
                  <div className="flex items-center w-[280px] h-[44px] pl-[14px] bg-white text-gray-700 rounded border border-gray-300 font-medium text-sm">
                    <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                    </svg>
                    <span className="ml-[46px]">Apple 계정으로 로그인</span>
                  </div>
                </div>
              </>
            ) : (
              <form onSubmit={handleRegister} className="space-y-4">
                <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r mb-4">
                  <p className="text-sm text-blue-700">
                    회원가입이 필요합니다. 정보를 입력해주세요.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    이름
                  </label>
                  <input
                    type="text"
                    required
                    value={registerData.name}
                    onChange={(e) => setRegisterData({ ...registerData, name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="홍길동"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    기수
                  </label>
                  <input
                    type="number"
                    required
                    value={registerData.cohort}
                    onChange={(e) => setRegisterData({ ...registerData, cohort: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="1"
                  />
                </div>

                <div className="flex space-x-3">
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 transition disabled:opacity-50"
                  >
                    {loading ? '처리 중...' : '회원가입'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowRegister(false)}
                    className="flex-1 bg-gray-200 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-300 transition"
                  >
                    취소
                  </button>
                </div>
              </form>
            )}

            {loading && !showRegister && (
              <div className="text-center">
                <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
                <p className="text-sm text-gray-500 mt-2">로그인 중...</p>
              </div>
            )}
          </div>

          <div className="mt-8 pt-6 border-t border-gray-200 text-center">
            <p className="text-xs text-gray-500">
              승인된 계정만 이용 가능합니다. <br />
              문의사항은 관리자에게 연락해주세요.
            </p>
            <p className="text-xs text-gray-400 mt-6">
              <br />
              <br />
              Developed by Dave Lee, PE
            </p>
          </div>
        </div>
      </div>
    </GoogleOAuthProvider>
  )
}
