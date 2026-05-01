import { Routes, Route, Navigate } from 'react-router-dom'
import { DesignSystemThemeProvider } from '@ticketiq/design-system'
import Layout from './components/Layout'
import ProtectedRoute from './auth/ProtectedRoute'
import DashboardPage from './pages/DashboardPage'
import TicketSubmissionForm from './pages/TicketSubmissionForm'
import ClassificationResultPanel from './pages/ClassificationResultPanel'
import TicketListPage from './pages/TicketListPage'
import EscalationQueuePage from './pages/EscalationQueuePage'
import PatternAlertsPage from './pages/PatternAlertsPage'
import ModelPerformancePage from './pages/ModelPerformancePage'
import LoginPage from './pages/LoginPage'
import SettingsPage from './pages/SettingsPage'
import AutomationPage from './pages/AutomationPage'
import AutomationCompletedPage from './pages/AutomationCompletedPage'
import MasterControlPage from './pages/MasterControlPage'

import AdminRoute from './auth/AdminRoute'

function App() {
  return (
    <DesignSystemThemeProvider 
      theme="dark"
      config={{
        persistPreference: true,
        autoDetect: true
      }}
    >
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="tickets/new" element={<TicketSubmissionForm />} />
          <Route path="tickets/:id" element={<ClassificationResultPanel />} />
          <Route path="tickets" element={<TicketListPage />} />
          <Route path="escalations" element={<EscalationQueuePage />} />
          <Route path="pattern-alerts" element={<PatternAlertsPage />} />
          <Route path="automation-available" element={<AdminRoute><AutomationPage /></AdminRoute>} />
          <Route path="automation-completed" element={<AdminRoute><AutomationCompletedPage /></AdminRoute>} />
          <Route path="model/metrics" element={<AdminRoute><ModelPerformancePage /></AdminRoute>} />
          <Route path="master-control" element={<AdminRoute><MasterControlPage /></AdminRoute>} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>
      </Routes>
    </DesignSystemThemeProvider>
  )
}

export default App
