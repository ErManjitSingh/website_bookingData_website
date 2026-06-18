import { useState } from 'react'
import Sidebar from './Sidebar'
import './Layout.css'

const PAGE_TITLES = {
  bookings: 'My Booking',
  'add-listing': 'Add Listing',
  'all-listings': 'All Listings',
}

export default function Layout({ activeTab, onTabChange, user, onLogout, children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="layout">
      <Sidebar
        activeTab={activeTab}
        onTabChange={onTabChange}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        user={user}
        onLogout={onLogout}
      />

      <div className="layout__main">
        <header className="layout__header">
          <button
            type="button"
            className="layout__menu-btn"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open menu"
          >
            <span />
            <span />
            <span />
          </button>
          <h2 className="layout__page-title">
            {PAGE_TITLES[activeTab] ?? 'Dashboard'}
          </h2>
        </header>

        <main className="layout__content">{children}</main>
      </div>
    </div>
  )
}
