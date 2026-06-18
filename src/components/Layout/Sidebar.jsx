import './Layout.css'

const NAV_ITEMS = [
  { id: 'bookings', label: 'My Booking', icon: '📋' },
  { id: 'add-listing', label: 'Add Listing', icon: '➕' },
  { id: 'all-listings', label: 'All Listings', icon: '📑' },
]

export default function Sidebar({ activeTab, onTabChange, isOpen, onClose, user, onLogout }) {
  return (
    <>
      {isOpen && <div className="sidebar-overlay" onClick={onClose} aria-hidden="true" />}

      <aside className={`sidebar ${isOpen ? 'sidebar--open' : ''}`}>
        <div className="sidebar__brand">
          <div className="sidebar__logo">DS</div>
          <div>
            <h1 className="sidebar__title">Demand Setu</h1>
            <p className="sidebar__tagline">Tour & Travel</p>
          </div>
        </div>

        <nav className="sidebar__nav">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`sidebar__nav-item ${activeTab === item.id ? 'sidebar__nav-item--active' : ''}`}
              onClick={() => {
                onTabChange(item.id)
                onClose()
              }}
            >
              <span className="sidebar__nav-icon" aria-hidden="true">
                {item.icon}
              </span>
              {item.label}
            </button>
          ))}
        </nav>

        <div className="sidebar__footer">
          <div className="sidebar__user">
            <div className="sidebar__avatar">{user?.name?.charAt(0)?.toUpperCase()}</div>
            <div className="sidebar__user-info">
              <span className="sidebar__user-name">{user?.name}</span>
              <span className="sidebar__user-mobile">{user?.mobile}</span>
            </div>
          </div>
          <button type="button" className="sidebar__logout" onClick={onLogout}>
            Logout
          </button>
        </div>
      </aside>
    </>
  )
}
