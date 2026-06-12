import { useEffect, useMemo, useState } from 'react'
import {
  fetchBookings,
  updateBookingTourCompleted,
  TOUR_STATUS_OPTIONS,
  PAYMENT_STATUS_OPTIONS,
} from '../api/bookings'
import './MyBookings.css'

function formatDate(dateStr) {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function formatCurrency(amount, currency = 'INR') {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(amount)
}

function normalizeStatus(status) {
  const value = status?.toLowerCase() ?? 'pending'
  if (value === 'paid') return 'completed'
  return value
}

function toDateKey(isoString) {
  return new Date(isoString).toISOString().slice(0, 10)
}

function StatusBadge({ status }) {
  const normalized = normalizeStatus(status)
  return <span className={`status-badge status-badge--${normalized}`}>{status}</span>
}

function BookingFilters({ filters, onChange, onClear }) {
  const hasActiveFilters =
    filters.dateFrom ||
    filters.dateTo ||
    filters.payment !== 'all' ||
    filters.tourCompleted !== 'all'

  return (
    <div className="bookings-filters">
      <div className="bookings-filters__row">
        <label className="bookings-filters__field">
          <span>Created From</span>
          <input
            type="date"
            value={filters.dateFrom}
            onChange={(e) => onChange({ ...filters, dateFrom: e.target.value })}
          />
        </label>

        <label className="bookings-filters__field">
          <span>Created To</span>
          <input
            type="date"
            value={filters.dateTo}
            onChange={(e) => onChange({ ...filters, dateTo: e.target.value })}
          />
        </label>

        <label className="bookings-filters__field">
          <span>Payment</span>
          <select
            value={filters.payment}
            onChange={(e) => onChange({ ...filters, payment: e.target.value })}
          >
            <option value="all">All</option>
            {PAYMENT_STATUS_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>
                {opt.charAt(0).toUpperCase() + opt.slice(1)}
              </option>
            ))}
          </select>
        </label>

        <label className="bookings-filters__field">
          <span>Tour Completed</span>
          <select
            value={filters.tourCompleted}
            onChange={(e) => onChange({ ...filters, tourCompleted: e.target.value })}
          >
            <option value="all">All</option>
            {TOUR_STATUS_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>
                {opt.charAt(0).toUpperCase() + opt.slice(1)}
              </option>
            ))}
          </select>
        </label>
      </div>

      {hasActiveFilters && (
        <button type="button" className="bookings-filters__clear" onClick={onClear}>
          Clear filters
        </button>
      )}
    </div>
  )
}

function BookingDetailModal({ booking, onClose, onTourStatusUpdate }) {
  const [tourStatus, setTourStatus] = useState(booking.tourCompleted ?? 'pending')
  const [updating, setUpdating] = useState(false)
  const [updateError, setUpdateError] = useState(null)

  useEffect(() => {
    setTourStatus(booking.tourCompleted ?? 'pending')
    setUpdateError(null)
  }, [booking])

  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handleKey)
      document.body.style.overflow = ''
    }
  }, [onClose])

  const handleUpdateTourStatus = async () => {
    if (normalizeStatus(tourStatus) === normalizeStatus(booking.tourCompleted)) return

    setUpdating(true)
    setUpdateError(null)
    try {
      await onTourStatusUpdate(booking._id, tourStatus)
    } catch (err) {
      setUpdateError(err.message ?? 'Failed to update tour status')
    } finally {
      setUpdating(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose} role="presentation">
      <div
        className="modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="booking-modal-title"
      >
        <div className="modal__header">
          <div>
            <h3 id="booking-modal-title" className="modal__title">
              {booking.property.title}
            </h3>
            <p className="modal__subtitle">{booking.property.location}</p>
          </div>
          <button type="button" className="modal__close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>

        <div className="modal__body">
          <div className="modal__status-row">
            <div className="modal__status-item">
              <span className="modal__label">Payment Status</span>
              <StatusBadge status={booking.payment} />
            </div>
            <div className="modal__status-item">
              <span className="modal__label">Tour Completed</span>
              <StatusBadge status={booking.tourCompleted} />
            </div>
          </div>

          <section className="modal__section modal__section--update">
            <h4>Update Tour Completed</h4>
            <div className="modal__update-row">
              <select
                className="modal__select"
                value={tourStatus}
                onChange={(e) => setTourStatus(e.target.value)}
                disabled={updating}
              >
                {TOUR_STATUS_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt.charAt(0).toUpperCase() + opt.slice(1)}
                  </option>
                ))}
              </select>
              <button
                type="button"
                className="modal__update-btn"
                onClick={handleUpdateTourStatus}
                disabled={
                  updating ||
                  normalizeStatus(tourStatus) === normalizeStatus(booking.tourCompleted)
                }
              >
                {updating ? 'Updating…' : 'Update'}
              </button>
            </div>
            {updateError && (
              <p className="modal__update-error" role="alert">
                {updateError}
              </p>
            )}
          </section>

          <section className="modal__section">
            <h4>Room Details</h4>
            <ul className="modal__room-list">
              {booking.rooms.map((room, idx) => (
                <li key={room.roomId + idx} className="room-item">
                  <div className="room-item__main">
                    <span className="room-item__name">{room.roomName}</span>
                    <span className="room-item__plan">{room.mealPlanLabel}</span>
                  </div>
                  <div className="room-item__meta">
                    <span>
                      {room.roomCount} room{room.roomCount !== 1 ? 's' : ''} · {room.nights} night
                      {room.nights !== 1 ? 's' : ''}
                    </span>
                    <span className="room-item__price">
                      {formatCurrency(room.pricing.total, booking.pricing.currency)}
                    </span>
                  </div>
                  {room.occupancyLabel && (
                    <p className="room-item__occupancy">{room.occupancyLabel}</p>
                  )}
                </li>
              ))}
            </ul>
          </section>

          <section className="modal__section">
            <h4>Guest Information</h4>
            <div className="modal__info-grid">
              <div>
                <span className="modal__label">Name</span>
                <span>{booking.guest.fullName}</span>
              </div>
              <div>
                <span className="modal__label">Email</span>
                <span>{booking.guest.email}</span>
              </div>
              <div>
                <span className="modal__label">Mobile</span>
                <span>{booking.guest.mobile}</span>
              </div>
              <div>
                <span className="modal__label">Country</span>
                <span>{booking.guest.country}</span>
              </div>
            </div>
          </section>

          <section className="modal__section">
            <h4>Pricing</h4>
            <div className="booking-card__pricing">
              <div className="pricing-row">
                <span>Subtotal</span>
                <span>{formatCurrency(booking.pricing.subtotal, booking.pricing.currency)}</span>
              </div>
              <div className="pricing-row">
                <span>GST</span>
                <span>{formatCurrency(booking.pricing.gst, booking.pricing.currency)}</span>
              </div>
              {booking.pricing.memberDiscount > 0 && (
                <div className="pricing-row">
                  <span>Member Discount</span>
                  <span>
                    -{formatCurrency(booking.pricing.memberDiscount, booking.pricing.currency)}
                  </span>
                </div>
              )}
              <div className="pricing-row pricing-row--total">
                <span>Total Payable</span>
                <span>{formatCurrency(booking.pricing.payableTotal, booking.pricing.currency)}</span>
              </div>
            </div>
          </section>

          <p className="modal__booked-date">
            Booked on{' '}
            {new Date(booking.createdAt).toLocaleDateString('en-IN', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </p>
        </div>
      </div>
    </div>
  )
}

function BookingCard({ booking, onViewDetail }) {
  return (
    <article className="booking-card">
      <div className="booking-card__grid">
        <div className="booking-card__detail">
          <span className="booking-card__label">Check-in</span>
          <span className="booking-card__value">{formatDate(booking.stay.checkIn)}</span>
        </div>
        <div className="booking-card__detail">
          <span className="booking-card__label">Check-out</span>
          <span className="booking-card__value">{formatDate(booking.stay.checkOut)}</span>
        </div>
        <div className="booking-card__detail">
          <span className="booking-card__label">Nights</span>
          <span className="booking-card__value">{booking.stay.nights}</span>
        </div>
        <div className="booking-card__detail">
          <span className="booking-card__label">Rooms</span>
          <span className="booking-card__value">{booking.totalRooms}</span>
        </div>
        <div className="booking-card__detail">
          <span className="booking-card__label">Guests</span>
          <span className="booking-card__value">
            {booking.guests.adults} adult{booking.guests.adults !== 1 ? 's' : ''}
            {booking.guests.children > 0 && `, ${booking.guests.children} child`}
          </span>
        </div>
        <div className="booking-card__detail">
          <span className="booking-card__label">Booking ID</span>
          <span className="booking-card__value booking-card__value--mono">
            {booking._id.slice(-8).toUpperCase()}
          </span>
        </div>
      </div>

      <div className="booking-card__actions">
        <button type="button" className="booking-card__view-btn" onClick={onViewDetail}>
          View Detail
        </button>
      </div>
    </article>
  )
}

const DEFAULT_FILTERS = {
  dateFrom: '',
  dateTo: '',
  payment: 'all',
  tourCompleted: 'all',
}

function filterBookings(bookings, filters) {
  return bookings.filter((booking) => {
    const createdDate = toDateKey(booking.createdAt)

    if (filters.dateFrom && createdDate < filters.dateFrom) return false
    if (filters.dateTo && createdDate > filters.dateTo) return false

    if (
      filters.payment !== 'all' &&
      normalizeStatus(booking.payment) !== filters.payment
    ) {
      return false
    }

    if (
      filters.tourCompleted !== 'all' &&
      normalizeStatus(booking.tourCompleted) !== filters.tourCompleted
    ) {
      return false
    }

    return true
  })
}

export default function MyBookings() {
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedBooking, setSelectedBooking] = useState(null)
  const [filters, setFilters] = useState(DEFAULT_FILTERS)

  const filteredBookings = useMemo(
    () => filterBookings(bookings, filters),
    [bookings, filters],
  )

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const data = await fetchBookings()
        if (!cancelled) setBookings(data)
      } catch (err) {
        if (!cancelled) setError(err.message ?? 'Failed to load bookings')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [])

  const handleTourStatusUpdate = async (id, tourCompleted) => {
    const updated = await updateBookingTourCompleted(id, tourCompleted)

    setBookings((prev) =>
      prev.map((b) =>
        b._id === id
          ? { ...b, ...(typeof updated === 'object' ? updated : {}), tourCompleted }
          : b,
      ),
    )

    setSelectedBooking((prev) =>
      prev && prev._id === id
        ? { ...prev, ...(typeof updated === 'object' ? updated : {}), tourCompleted }
        : prev,
    )
  }

  if (loading) {
    return (
      <div className="bookings-state">
        <div className="bookings-spinner" />
        <p>Loading bookings…</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bookings-state bookings-state--error">
        <p>{error}</p>
        <button type="button" onClick={() => window.location.reload()}>
          Retry
        </button>
      </div>
    )
  }

  return (
    <div className="bookings-page">
      <div className="bookings-page__header">
        <h2>My Bookings</h2>
        <p>
          {filteredBookings.length} of {bookings.length} booking
          {bookings.length !== 1 ? 's' : ''}
        </p>
      </div>

      <BookingFilters
        filters={filters}
        onChange={setFilters}
        onClear={() => setFilters(DEFAULT_FILTERS)}
      />

      {bookings.length === 0 ? (
        <div className="bookings-state">
          <p>No bookings found.</p>
        </div>
      ) : filteredBookings.length === 0 ? (
        <div className="bookings-state">
          <p>No bookings match the selected filters.</p>
        </div>
      ) : (
        <div className="bookings-list">
          {filteredBookings.map((booking) => (
            <BookingCard
              key={booking._id}
              booking={booking}
              onViewDetail={() => setSelectedBooking(booking)}
            />
          ))}
        </div>
      )}

      {selectedBooking && (
        <BookingDetailModal
          booking={
            bookings.find((b) => b._id === selectedBooking._id) ?? selectedBooking
          }
          onClose={() => setSelectedBooking(null)}
          onTourStatusUpdate={handleTourStatusUpdate}
        />
      )}
    </div>
  )
}
