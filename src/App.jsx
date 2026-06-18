import { useState } from 'react'
import { AuthProvider, useAuth } from './context/AuthContext'
import Layout from './components/Layout/Layout'
import LoginPage from './pages/LoginPage'
import MyBookings from './pages/MyBookings'
import AddListing from './pages/AddListing'
import AllListings from './pages/AllListings'

function AppContent() {
  const { user, loading, isAuthenticated, logout } = useAuth()
  const [activeTab, setActiveTab] = useState('bookings')
  const [editingListingId, setEditingListingId] = useState(null)

  const handleTabChange = (tab) => {
    setActiveTab(tab)
    if (tab !== 'add-listing') {
      setEditingListingId(null)
    }
  }

  const handleEditListing = (id) => {
    setEditingListingId(id)
    setActiveTab('add-listing')
  }

  const handleListingSaved = () => {
    if (editingListingId) {
      setEditingListingId(null)
      setActiveTab('all-listings')
    }
  }

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
    <Layout activeTab={activeTab} onTabChange={handleTabChange} user={user} onLogout={logout}>
      {activeTab === 'bookings' && <MyBookings />}
      {activeTab === 'add-listing' && (
        <AddListing
          editId={editingListingId}
          onSaved={handleListingSaved}
          onCancelEdit={() => {
            setEditingListingId(null)
            setActiveTab('all-listings')
          }}
        />
      )}
      {activeTab === 'all-listings' && <AllListings onEdit={handleEditListing} />}
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
