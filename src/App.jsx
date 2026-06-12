import { useState } from 'react'
import { AuthProvider, useAuth } from './context/AuthContext'
import Layout from './components/Layout/Layout'
import LoginPage from './pages/LoginPage'
import MyBookings from './pages/MyBookings'

function AppContent() {
  const { user, loading, isAuthenticated, logout } = useAuth()
  const [activeTab, setActiveTab] = useState('bookings')

  if (loading) {
    return (
      <div className="app-loading">
        <div className="bookings-spinner" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return <LoginPage />
  }

  return (
    <Layout activeTab={activeTab} onTabChange={setActiveTab} user={user} onLogout={logout}>
      {activeTab === 'bookings' && <MyBookings />}
    </Layout>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}
