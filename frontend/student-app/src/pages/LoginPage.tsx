import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google'
import { authApi } from '../api/auth'
import { useAuthStore } from '../store/authStore'

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || ''

export default function LoginPage() {
  const navigate = useNavigate()
  const setAuth = useAuthStore((state) => state.setAuth)
  const [isRegistering, setIsRegistering] = useState(false)
  const [registerData, setRegisterData] = useState({ name: '', cohort: 1 })
  const [pendingToken, setPendingToken] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleGoogleSuccess = async (credentialResponse: any) => {
    setLoading(true)
    setError('')

    try {
      const idToken = credentialResponse.credential

      // 먼저 로그인 시도
      try {
        const tokenResponse = await authApi.login({
          provider: 'google',
          id_token: idToken,
        })

        // 사용자 정보 가져오기
        const user = await authApi.getMe(tokenResponse.access_token)

        // 수강생 권한 체크
        if (user.role !== 'student') {
          setError('Student account required. Please use the student app.')
          setLoading(false)
          return
        }

        // 승인 상태 체크
        if (user.approval_status === 'pending') {
          setError('Your account is pending approval. Please wait for admin approval.')
          setLoading(false)
          return
        }

        if (user.approval_status === 'rejected') {
          setError('Your account has been rejected. Please contact administrator.')
          setLoading(false)
          return
        }

        // 로그인 성공
        setAuth(tokenResponse.access_token, user)
        navigate('/')
      } catch (loginError: any) {
        // 404 에러면 회원가입 필요
        if (loginError.message.includes('not found')) {
          setIsRegistering(true)
          setPendingToken(idToken)
        } else {
          throw loginError
        }
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed')
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const tokenResponse = await authApi.register({
        provider: 'google',
        id_token: pendingToken,
        name: registerData.name,
        cohort: registerData.cohort,
      })

      // 사용자 정보 가져오기
      const user = await authApi.getMe(tokenResponse.access_token)

      // 회원가입 성공 (승인 대기 상태)
      setAuth(tokenResponse.access_token, user)

      // 승인 대기 메시지
      setError('Registration successful! Your account is pending approval.')

      // 3초 후 메인으로 이동 (승인 대기 화면 표시)
      setTimeout(() => navigate('/'), 3000)
    } catch (err: any) {
      setError(err.message || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8">
          {!isRegistering ? (
            // 로그인 화면
            <div className="text-center">
              <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  PE Subnote
                </h1>
                <p className="text-gray-600">
                  기술사 서브노트 학습 앱
                </p>
              </div>

              {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  {error}
                </div>
              )}

              <div className="space-y-4">
                <div className="flex justify-center">
                  <GoogleLogin
                    onSuccess={handleGoogleSuccess}
                    onError={() => setError('Google login failed')}
                    theme="filled_blue"
                    size="large"
                    text="signin_with"
                    shape="rectangular"
                  />
                </div>

                {loading && (
                  <div className="text-sm text-gray-500">
                    Authenticating...
                  </div>
                )}
              </div>

              <div className="mt-8 pt-6 border-t border-gray-200">
                <p className="text-xs text-gray-500">
                  수강생 전용 앱입니다. <br />
                  로그인 후 관리자 승인이 필요합니다.
                </p>
              </div>
            </div>
          ) : (
            // 회원가입 폼
            <div>
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  추가 정보 입력
                </h2>
                <p className="text-sm text-gray-600">
                  회원가입을 완료하기 위해 추가 정보를 입력해주세요.
                </p>
              </div>

              {error && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  {error}
                </div>
              )}

              <form onSubmit={handleRegister} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    이름
                  </label>
                  <input
                    type="text"
                    required
                    value={registerData.name}
                    onChange={(e) =>
                      setRegisterData({ ...registerData, name: e.target.value })
                    }
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                    min="1"
                    value={registerData.cohort}
                    onChange={(e) =>
                      setRegisterData({ ...registerData, cohort: parseInt(e.target.value) })
                    }
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="1"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? '가입 중...' : '회원가입 완료'}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsRegistering(false)
                    setPendingToken('')
                    setError('')
                  }}
                  className="w-full text-gray-600 py-2 text-sm"
                >
                  취소
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </GoogleOAuthProvider>
  )
}
