import { Agentation } from 'agentation'
import { Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from './components/layout/app-shell'
import { ProtectedRoute } from './components/layout/protected-route'
import { DashboardPage } from './pages/dashboard'
import { LoginPage } from './pages/login'
import { OfficerDetailPage } from './pages/officer-detail'
import { OfficersPage } from './pages/officers'
import { SubscriptionsPage } from './pages/subscriptions'

function ProtectedLayout() {
  return (
    <ProtectedRoute>
      <AppShell>
        <Routes>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/officers" element={<OfficersPage />} />
          <Route path="/officers/:id" element={<OfficerDetailPage />} />
          <Route path="/subscriptions" element={<SubscriptionsPage />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AppShell>
    </ProtectedRoute>
  )
}

export default function App() {
  return (
    <>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/*" element={<ProtectedLayout />} />
      </Routes>
      {process.env.NODE_ENV === 'development' && <Agentation />}
    </>
  )
}
