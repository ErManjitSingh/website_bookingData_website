import { useEffect, useMemo, useState } from 'react'
import {
  fetchBookings,
  updateBookingTourCompleted,
  deleteBooking,
  TOUR_STATUS_OPTIONS,
  PAYMENT_STATUS_OPTIONS,
} from '../api/bookings'
import './MyBookings.css'

function formatDate(dateStr) {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function formatDateShort(dateStr) {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
  })
}

function formatCurrency(amount, currency = 'INR') {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(amount)
}

function getCustomerPayableTotal(booking) {
  return booking.pricing?.payableTotal ?? booking.pricing?.total ?? 0
}

function getHotelPayableAmount(booking) {
  return booking.totalamountwith25 ?? 0
}

function getCompanyCommission(booking) {
  const customerTotal = getCustomerPayableTotal(booking)
  const hotelTotal = getHotelPayableAmount(booking)
  return Math.max(0, customerTotal - hotelTotal)
}

function normalizeStatus(status) {
  const value = status?.toLowerCase() ?? 'pending'
  if (value === 'paid') return 'completed'
  return value
}

function toDateKey(isoString) {
  return new Date(isoString).toISOString().slice(0, 10)
}

function getCustomerResponseInfo(booking) {
  const response = booking.customerResponse

  if (!response || (!response.status && !response.note)) {
    return {
      hasResponse: false,
      isCancelled: false,
      label: 'No Response',
      status: null,
      note: null,
    }
  }

  const status = (response.status ?? '').toLowerCase().trim()
  const isCancelled = status === 'cancel' || status === 'cancelled'
  const note = response.note?.trim()
  const hasNote = note && note.toLowerCase() !== 'na'

  return {
    hasResponse: true,
    isCancelled,
    label: isCancelled ? 'Cancelled' : status || 'Response',
    status: response.status,
    note: hasNote ? note : null,
  }
}

function CustomerResponseBadge({ booking }) {
  const info = getCustomerResponseInfo(booking)

  if (!info.hasResponse) {
    return <span className="mmt-badge mmt-badge--customer mmt-badge--empty">No Response</span>
  }

  return (
    <span
      className={`mmt-badge mmt-badge--customer ${info.isCancelled ? 'mmt-badge--cancelled' : 'mmt-badge--responded'}`}
    >
      {info.label}
    </span>
  )
}

function CustomerResponsePanel({ booking }) {
  const info = getCustomerResponseInfo(booking)

  return (
    <section className="mmt-panel mmt-panel--customer-response">
      <h3 className="mmt-panel__title">Customer Response</h3>
      <div
        className={`mmt-customer-response ${info.isCancelled ? 'mmt-customer-response--cancelled' : ''} ${!info.hasResponse ? 'mmt-customer-response--empty' : ''}`}
      >
        <div className="mmt-customer-response__status">
          <span>Status</span>
          <CustomerResponseBadge booking={booking} />
        </div>
        {info.hasResponse && info.note ? (
          <div className="mmt-customer-response__note">
            <span>Note</span>
            <p>{info.note}</p>
          </div>
        ) : (
          <p className="mmt-customer-response__empty-text">
            {info.hasResponse
              ? 'Customer has responded. No additional note provided.'
              : 'Customer has not submitted a response yet.'}
          </p>
        )}
      </div>
    </section>
  )
}

function LabeledBadge({ label, children }) {
  return (
    <div className="mmt-labeled-badge">
      <span className="mmt-labeled-badge__label">{label}</span>
      {children}
    </div>
  )
}

function StatusBadge({ status, type }) {
  const normalized = normalizeStatus(status)
  return (
    <span className={`mmt-badge mmt-badge--${normalized} mmt-badge--${type}`}>
      {status}
    </span>
  )
}

function BookingFilters({ filters, onChange, onClear }) {
  const hasActiveFilters =
    filters.dateFrom ||
    filters.dateTo ||
    filters.payment !== 'all' ||
    filters.tourCompleted !== 'all' ||
    filters.customerCancelled !== 'all'

  return (
    <div className="mmt-filters">
      <div className="mmt-filters__head">
        <h3>Filter Bookings</h3>
        {hasActiveFilters && (
          <button type="button" className="mmt-filters__clear" onClick={onClear}>
            Clear all
          </button>
        )}
      </div>
      <div className="mmt-filters__grid">
        <label className="mmt-filters__field">
          <span>From Date</span>
          <input
            type="date"
            value={filters.dateFrom}
            onChange={(e) => onChange({ ...filters, dateFrom: e.target.value })}
          />
        </label>
        <label className="mmt-filters__field">
          <span>To Date</span>
          <input
            type="date"
            value={filters.dateTo}
            onChange={(e) => onChange({ ...filters, dateTo: e.target.value })}
          />
        </label>
        <label className="mmt-filters__field">
          <span>Payment Status</span>
          <select
            value={filters.payment}
            onChange={(e) => onChange({ ...filters, payment: e.target.value })}
          >
            <option value="all">All Payments</option>
            {PAYMENT_STATUS_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>
                {opt.charAt(0).toUpperCase() + opt.slice(1)}
              </option>
            ))}
          </select>
        </label>
        <label className="mmt-filters__field">
          <span>Tour Status</span>
          <select
            value={filters.tourCompleted}
            onChange={(e) => onChange({ ...filters, tourCompleted: e.target.value })}
          >
            <option value="all">All Tours</option>
            {TOUR_STATUS_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>
                {opt.charAt(0).toUpperCase() + opt.slice(1)}
              </option>
            ))}
          </select>
        </label>
        <label className="mmt-filters__field">
          <span>Cancelled Booking</span>
          <select
            value={filters.customerCancelled}
            onChange={(e) => onChange({ ...filters, customerCancelled: e.target.value })}
          >
            <option value="all">All Bookings</option>
            <option value="cancelled">Cancelled Only</option>
            <option value="active">Not Cancelled</option>
          </select>
        </label>
      </div>
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

  const roomSummary = booking.rooms?.map((r) => r.roomName).join(', ') ?? ''

  return (
    <div className="mmt-modal-overlay" onClick={onClose} role="presentation">
      <div
        className="mmt-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="booking-modal-title"
      >
        <div className="mmt-modal__hero">
          <div className="mmt-modal__hero-img">
            <span className="mmt-modal__hero-icon">🏨</span>
          </div>
          <div className="mmt-modal__hero-info">
            <p className="mmt-modal__booking-id">
              Booking ID: <strong>{booking._id.slice(-8).toUpperCase()}</strong>
            </p>
            <h2 id="booking-modal-title">{booking.property.title}</h2>
            <p className="mmt-modal__location">{booking.property.location}</p>
            <div className="mmt-modal__badges">
              <LabeledBadge label="Payment Status">
                <StatusBadge status={booking.payment} type="payment" />
              </LabeledBadge>
              <LabeledBadge label="Tour Status">
                <StatusBadge status={booking.tourCompleted} type="tour" />
              </LabeledBadge>
              <LabeledBadge label="Customer Response">
                <CustomerResponseBadge booking={booking} />
              </LabeledBadge>
            </div>
          </div>
          <button type="button" className="mmt-modal__close" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>

        <div className="mmt-modal__body">
          <div className="mmt-modal__timeline">
            <div className="mmt-modal__date-block">
              <span className="mmt-modal__date-label">Check-in</span>
              <strong>{formatDate(booking.stay.checkIn)}</strong>
            </div>
            <div className="mmt-modal__date-mid">
              <span className="mmt-modal__nights-pill">
                {booking.stay.nights} Night{booking.stay.nights !== 1 ? 's' : ''}
              </span>
              <div className="mmt-modal__date-line" />
            </div>
            <div className="mmt-modal__date-block mmt-modal__date-block--right">
              <span className="mmt-modal__date-label">Check-out</span>
              <strong>{formatDate(booking.stay.checkOut)}</strong>
            </div>
          </div>

          <div className="mmt-modal__stats">
            <div className="mmt-modal__stat">
              <span>Rooms</span>
              <strong>{booking.totalRooms}</strong>
            </div>
            <div className="mmt-modal__stat">
              <span>Guests</span>
              <strong>
                {booking.guests.adults} Adult{booking.guests.adults !== 1 ? 's' : ''}
                {booking.guests.children > 0 && `, ${booking.guests.children} Child`}
              </strong>
            </div>
            <div className="mmt-modal__stat">
              <span>Room Type</span>
              <strong>{roomSummary || '—'}</strong>
            </div>
          </div>

          <CustomerResponsePanel booking={booking} />

          <div className="mmt-modal__grid">
            <section className="mmt-panel">
              <h3 className="mmt-panel__title">Room Details</h3>
              <ul className="mmt-room-list">
                {booking.rooms.map((room, idx) => (
                  <li key={room.roomId + idx} className="mmt-room">
                    <div className="mmt-room__top">
                      <div>
                        <p className="mmt-room__name">{room.roomName}</p>
                        <p className="mmt-room__plan">{room.mealPlanLabel}</p>
                      </div>
                      <p className="mmt-room__price">
                        {formatCurrency(room.pricing.total, booking.pricing.currency)}
                      </p>
                    </div>
                    <p className="mmt-room__meta">
                      {room.roomCount} room{room.roomCount !== 1 ? 's' : ''} · {room.nights} night
                      {room.nights !== 1 ? 's' : ''}
                      {room.occupancyLabel && ` · ${room.occupancyLabel}`}
                    </p>
                  </li>
                ))}
              </ul>
            </section>

            <aside className="mmt-panel mmt-panel--sidebar">
              <h3 className="mmt-panel__title">Price Summary</h3>
              <div className="mmt-price-card">
                {/* <div className="mmt-price-row">
                  <span>Subtotal</span>
                  <span>{formatCurrency(booking.pricing.subtotal, booking.pricing.currency)}</span>
                </div>
                <div className="mmt-price-row">
                  <span>GST</span>
                  <span>{formatCurrency(booking.pricing.gst, booking.pricing.currency)}</span>
                </div> */}
                {booking.pricing.memberDiscount > 0 && (
                  <div className="mmt-price-row mmt-price-row--discount">
                    <span>Member Discount</span>
                    <span>
                      -{formatCurrency(booking.pricing.memberDiscount, booking.pricing.currency)}
                    </span>
                  </div>
                )}
                <div className="mmt-price-row mmt-price-row--customer">
                  <span>Total from Customer</span>
                  <span>{formatCurrency(getCustomerPayableTotal(booking), booking.pricing.currency)}</span>
                </div>
                <div className="mmt-price-row mmt-price-row--hotel">
                  <span>Total to Hotel</span>
                  <span>{formatCurrency(getHotelPayableAmount(booking), booking.pricing.currency)}</span>
                </div>
                <div className="mmt-price-row mmt-price-row--commission">
                  <span>Company Commission</span>
                  <span>{formatCurrency(getCompanyCommission(booking), booking.pricing.currency)}</span>
                </div>
              </div>

              <h3 className="mmt-panel__title">Guest Details</h3>
              <div className="mmt-guest-card">
                <p><span>Name</span>{booking.guest.fullName}</p>
                <p><span>Email</span>{booking.guest.email}</p>
                <p><span>Mobile</span>{booking.guest.mobile}</p>
                <p><span>Country</span>{booking.guest.country}</p>
              </div>
            </aside>
          </div>

          <section className="mmt-panel mmt-panel--update">
            <h3 className="mmt-panel__title">Update Tour Status</h3>
            <div className="mmt-update-row">
              <select
                className="mmt-select"
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
                className="mmt-btn mmt-btn--primary"
                onClick={handleUpdateTourStatus}
                disabled={
                  updating ||
                  normalizeStatus(tourStatus) === normalizeStatus(booking.tourCompleted)
                }
              >
                {updating ? 'Updating…' : 'Update Status'}
              </button>
            </div>
            {updateError && (
              <p className="mmt-error" role="alert">
                {updateError}
              </p>
            )}
          </section>

          <p className="mmt-modal__booked">
            Booked on{' '}
            {new Date(booking.createdAt).toLocaleDateString('en-IN', {
              day: 'numeric',
              month: 'long',
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

function BookingCard({ booking, onViewDetail, onDelete, deleting }) {
  const roomName = booking.rooms?.[0]?.roomName ?? 'Hotel Room'
  const customerTotal = getCustomerPayableTotal(booking)
  const isCancelled = getCustomerResponseInfo(booking).isCancelled

  return (
    <article className={`mmt-trip-card ${isCancelled ? 'mmt-trip-card--cancelled' : ''}`}>
      <div className="mmt-trip-card__top">
        <div className="mmt-trip-card__top-left">
          <span className="mmt-trip-card__id">
            ID: {booking._id.slice(-8).toUpperCase()}
          </span>
          <span className="mmt-trip-card__dot">•</span>
          <span className="mmt-trip-card__booked">
            Booked{' '}
            {new Date(booking.createdAt).toLocaleDateString('en-IN', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            })}
          </span>
        </div>
        <div className="mmt-trip-card__badges">
          <LabeledBadge label="Payment Status">
            <StatusBadge status={booking.payment} type="payment" />
          </LabeledBadge>
          <LabeledBadge label="Tour Status">
            <StatusBadge status={booking.tourCompleted} type="tour" />
          </LabeledBadge>
          <LabeledBadge label="Customer Response">
            <CustomerResponseBadge booking={booking} />
          </LabeledBadge>
        </div>
      </div>

      <div className="mmt-trip-card__body">
        <div className="mmt-trip-card__thumb">
          <span>🏨</span>
          <small>{booking.property.category ? booking.property.category.charAt(0).toUpperCase() + booking.property.category.slice(1) : 'Hotel'}</small>
        </div>

        <div className="mmt-trip-card__info">
          <h3 className="mmt-trip-card__hotel">{booking.property.title}</h3>
          <p className="mmt-trip-card__location">{booking.property.location}</p>
          <p className="mmt-trip-card__room">{roomName}</p>
          <p className="mmt-trip-card__guests">
            {booking.guests.adults} Adult{booking.guests.adults !== 1 ? 's' : ''}
            {booking.guests.children > 0 && `, ${booking.guests.children} Child`}
            {' · '}
            {booking.totalRooms} Room{booking.totalRooms !== 1 ? 's' : ''}
          </p>
        </div>

        <div className="mmt-trip-card__dates">
          <div className="mmt-trip-card__date">
            <span>CHECK-IN</span>
            <strong>{formatDateShort(booking.stay.checkIn)}</strong>
            <small>{new Date(booking.stay.checkIn + 'T00:00:00').getFullYear()}</small>
          </div>
          <div className="mmt-trip-card__duration">
            <span>{booking.stay.nights}N</span>
            <div className="mmt-trip-card__arrow" />
          </div>
          <div className="mmt-trip-card__date">
            <span>CHECK-OUT</span>
            <strong>{formatDateShort(booking.stay.checkOut)}</strong>
            <small>{new Date(booking.stay.checkOut + 'T00:00:00').getFullYear()}</small>
          </div>
        </div>

        <div className="mmt-trip-card__price">
          <span className="mmt-trip-card__price-label">Total Amount</span>
          <strong className="mmt-trip-card__price-value">
            {formatCurrency(customerTotal, booking.pricing?.currency)}
          </strong>
          <span className="mmt-trip-card__price-note">incl. taxes</span>
        </div>
      </div>

      <div className="mmt-trip-card__footer">
        <button type="button" className="mmt-btn mmt-btn--outline" onClick={onViewDetail}>
          View Details
        </button>
        <button
          type="button"
          className="mmt-btn mmt-btn--danger"
          onClick={onDelete}
          disabled={deleting}
        >
          {deleting ? 'Deleting…' : 'Delete Booking'}
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
  customerCancelled: 'all',
}

function filterBookings(bookings, filters) {
  return bookings.filter((booking) => {
    const createdDate = toDateKey(booking.createdAt)
    const isCancelled = getCustomerResponseInfo(booking).isCancelled

    if (filters.dateFrom && createdDate < filters.dateFrom) return false
    if (filters.dateTo && createdDate > filters.dateTo) return false

    if (filters.payment !== 'all' && normalizeStatus(booking.payment) !== filters.payment) {
      return false
    }

    if (
      filters.tourCompleted !== 'all' &&
      normalizeStatus(booking.tourCompleted) !== filters.tourCompleted
    ) {
      return false
    }

    if (filters.customerCancelled === 'cancelled' && !isCancelled) return false
    if (filters.customerCancelled === 'active' && isCancelled) return false

    return true
  })
}

export default function MyBookings() {
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedBooking, setSelectedBooking] = useState(null)
  const [filters, setFilters] = useState(DEFAULT_FILTERS)
  const [deletingId, setDeletingId] = useState(null)

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

  const handleDelete = async (booking) => {
    const label = booking._id.slice(-8).toUpperCase()
    if (
      !window.confirm(
        `Delete booking ${label} for ${booking.property?.title ?? 'this property'}? This cannot be undone.`,
      )
    ) {
      return
    }

    setDeletingId(booking._id)
    try {
      await deleteBooking(booking._id)
      setBookings((prev) => prev.filter((b) => b._id !== booking._id))
      setSelectedBooking((prev) => (prev?._id === booking._id ? null : prev))
    } catch (err) {
      alert(err.message ?? 'Failed to delete booking')
    } finally {
      setDeletingId(null)
    }
  }

  if (loading) {
    return (
      <div className="mmt-state">
        <div className="bookings-spinner" />
        <p>Loading your bookings…</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="mmt-state mmt-state--error">
        <p>{error}</p>
        <button type="button" className="mmt-btn mmt-btn--primary" onClick={() => window.location.reload()}>
          Retry
        </button>
      </div>
    )
  }

  return (
    <div className="bookings-page">
      <div className="mmt-page-header">
        <div>
          <h1>My Bookings</h1>
          <p>Manage and track all your hotel reservations</p>
        </div>
        <div className="mmt-page-header__count">
          <strong>{filteredBookings.length}</strong>
          <span>Active booking{filteredBookings.length !== 1 ? 's' : ''}</span>
        </div>
      </div>

      <BookingFilters
        filters={filters}
        onChange={setFilters}
        onClear={() => setFilters(DEFAULT_FILTERS)}
      />

      {bookings.length === 0 ? (
        <div className="mmt-empty">
          <span className="mmt-empty__icon">📋</span>
          <h3>No bookings yet</h3>
          <p>Your hotel bookings will appear here once created.</p>
        </div>
      ) : filteredBookings.length === 0 ? (
        <div className="mmt-empty">
          <span className="mmt-empty__icon">🔍</span>
          <h3>No matches found</h3>
          <p>Try adjusting your filters to see more bookings.</p>
        </div>
      ) : (
        <div className="mmt-trip-list">
          {filteredBookings.map((booking) => (
            <BookingCard
              key={booking._id}
              booking={booking}
              onViewDetail={() => setSelectedBooking(booking)}
              onDelete={() => handleDelete(booking)}
              deleting={deletingId === booking._id}
            />
          ))}
        </div>
      )}

      {selectedBooking && (
        <BookingDetailModal
          booking={bookings.find((b) => b._id === selectedBooking._id) ?? selectedBooking}
          onClose={() => setSelectedBooking(null)}
          onTourStatusUpdate={handleTourStatusUpdate}
        />
      )}
    </div>
  )
}
