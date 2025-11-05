import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import UsersPage from './pages/UsersPage'
import CategoriesPage from './pages/CategoriesPage'
import TopicsPage from './pages/TopicsPage'
import TopicEditorPage from './pages/TopicEditorPage'
import TemplatesPage from './pages/TemplatesPage'
import AdminLayout from './components/AdminLayout'
import { useAuthStore } from './store/authStore'

const queryClient = new QueryClient()

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const token = useAuthStore((state) => state.token)
  return token ? <>{children}</> : <Navigate to="/login" />
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/"
            element={
              <PrivateRoute>
                <AdminLayout>
                  <DashboardPage />
                </AdminLayout>
              </PrivateRoute>
            }
          />
          <Route
            path="/users"
            element={
              <PrivateRoute>
                <AdminLayout>
                  <UsersPage />
                </AdminLayout>
              </PrivateRoute>
            }
          />
          <Route
            path="/categories"
            element={
              <PrivateRoute>
                <AdminLayout>
                  <CategoriesPage />
                </AdminLayout>
              </PrivateRoute>
            }
          />
          <Route
            path="/topics"
            element={
              <PrivateRoute>
                <AdminLayout>
                  <TopicsPage />
                </AdminLayout>
              </PrivateRoute>
            }
          />
          <Route
            path="/topics/new"
            element={
              <PrivateRoute>
                <AdminLayout>
                  <TopicEditorPage />
                </AdminLayout>
              </PrivateRoute>
            }
          />
          <Route
            path="/topics/:id"
            element={
              <PrivateRoute>
                <AdminLayout>
                  <TopicEditorPage />
                </AdminLayout>
              </PrivateRoute>
            }
          />
          <Route
            path="/templates"
            element={
              <PrivateRoute>
                <AdminLayout>
                  <TemplatesPage />
                </AdminLayout>
              </PrivateRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  )
}

export default App
