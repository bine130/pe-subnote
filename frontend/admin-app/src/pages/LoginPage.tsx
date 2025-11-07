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

  const handleGoogleSuccess = async (credentialResponse: any) => {
    setLoading(true)
    setError('')

    try {
      const idToken = credentialResponse.credential

      // 로그인 시도
      const tokenResponse = await authApi.login({
        provider: 'google',
        id_token: idToken,
      })

      // 사용자 정보 가져오기
      const user = await authApi.getMe(tokenResponse.access_token)

      // 관리자 권한 체크
      if (user.role !== 'admin') {
        setError('Admin access required. Please use the admin account.')
        setLoading(false)
        return
      }

      // 로그인 성공
      setAuth(tokenResponse.access_token, user)
      navigate('/')
    } catch (err: any) {
      if (err.message.includes('not found')) {
        setError('Account not found. Please contact administrator to create an admin account.')
      } else {
        setError(err.message || 'Authentication failed')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-10">
          <div className="text-center mb-8">
            <div className="mb-6">
              <div className="w-16 h-16 bg-indigo-600 rounded-xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Admin Portal
              </h1>
              <p className="text-gray-600">
                PE Subnote Management System
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

            {loading && (
              <div className="text-center">
                <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
                <p className="text-sm text-gray-500 mt-2">Authenticating...</p>
              </div>
            )}
          </div>

          <div className="mt-8 pt-6 border-t border-gray-200 text-center">
            <p className="text-xs text-gray-500">
              관리자 전용 포털입니다. <br />
              관리자 계정으로만 로그인 가능합니다.
            </p>
          </div>
        </div>
      </div>
    </GoogleOAuthProvider>
  )
}
