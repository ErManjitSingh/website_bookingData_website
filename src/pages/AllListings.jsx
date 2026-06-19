import { useCallback, useEffect, useState } from 'react'
import { deleteListing, fetchAllListings } from '../api/seoListings'
import { CATEGORY_OPTIONS } from '../constants/seoListing'
import { normalizeCategory } from '../utils/seoListingForm'
import './AllListings.css'

function formatCategory(value) {
  if (!value) return '—'
  const normalized = normalizeCategory(value)
  const match = CATEGORY_OPTIONS.find((opt) => opt.value === normalized)
  return match?.label ?? value
}

export default function AllListings({ onEdit }) {
  const [listings, setListings] = useState([])
  const [pagination, setPagination] = useState(null)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [locationType, setLocationType] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [deletingId, setDeletingId] = useState(null)

  const loadListings = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const { listings: data, pagination: pag } = await fetchAllListings({
        page,
        limit: 10,
        search: search || undefined,
        locationType: locationType || undefined,
      })
      setListings(data)
      setPagination(pag)
    } catch (err) {
      setError(err.message ?? 'Failed to load listings')
    } finally {
      setLoading(false)
    }
  }, [page, search, locationType])

  useEffect(() => {
    loadListings()
  }, [loadListings])

  const handleDelete = async (id, heading) => {
    if (!window.confirm(`Delete listing "${heading}"? This cannot be undone.`)) return

    setDeletingId(id)
    try {
      await deleteListing(id)
      await loadListings()
    } catch (err) {
      alert(err.message ?? 'Failed to delete listing')
    } finally {
      setDeletingId(null)
    }
  }

  const handleSearch = (e) => {
    e.preventDefault()
    setPage(1)
    setSearch(searchInput.trim())
  }

  return (
    <div className="all-listings">
      <div className="all-listings__header">
        <h2>All Listings</h2>
        <p>{pagination?.totalItems ?? 0} listing(s) total</p>
      </div>

      <div className="all-listings__filters">
        <form className="all-listings__search" onSubmit={handleSearch}>
          <input
            type="text"
            placeholder="Search by heading, keyword, tags…"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
          <button type="submit">Search</button>
        </form>

        <select
          value={locationType}
          onChange={(e) => {
            setLocationType(e.target.value)
            setPage(1)
          }}
        >
          <option value="">All types</option>
          <option value="city">City</option>
          <option value="state">State</option>
        </select>
      </div>

      {loading ? (
        <div className="listing-state">
          <div className="bookings-spinner" />
          <p>Loading listings…</p>
        </div>
      ) : error ? (
        <div className="listing-state listing-state--error">
          <p>{error}</p>
          <button type="button" onClick={loadListings}>
            Retry
          </button>
        </div>
      ) : listings.length === 0 ? (
        <div className="listing-state">
          <p>No listings found.</p>
        </div>
      ) : (
        <>
          <div className="listings-table-wrap">
            <table className="listings-table">
              <thead>
                <tr>
                  <th>Heading</th>
                  <th>Type</th>
                  <th>Category</th>
                  <th>Location</th>
                  <th>Slug</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {listings.map((listing) => (
                  <tr key={listing._id}>
                    <td className="listings-table__heading">{listing.heading}</td>
                    <td>
                      <span className="listings-table__type">{listing.locationType}</span>
                    </td>
                    <td>{formatCategory(listing.category)}</td>
                    <td>
                      {listing.locationType === 'city'
                        ? `${listing.city}${listing.state ? `, ${listing.state}` : ''}`
                        : listing.state}
                    </td>
                    <td className="listings-table__slug">{listing.slug}</td>
                    <td>
                      <span
                        className={`listings-table__status ${listing.isActive ? 'listings-table__status--active' : 'listings-table__status--inactive'}`}
                      >
                        {listing.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>
                      <div className="listings-table__actions">
                        <button type="button" onClick={() => onEdit(listing._id)}>
                          Edit
                        </button>
                        <button
                          type="button"
                          className="listings-table__delete"
                          onClick={() => handleDelete(listing._id, listing.heading)}
                          disabled={deletingId === listing._id}
                        >
                          {deletingId === listing._id ? '…' : 'Delete'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {pagination && pagination.totalPages > 1 && (
            <div className="listings-pagination">
              <button
                type="button"
                disabled={!pagination.hasPrev}
                onClick={() => setPage((p) => p - 1)}
              >
                Previous
              </button>
              <span>
                Page {pagination.currentPage} of {pagination.totalPages}
              </span>
              <button
                type="button"
                disabled={!pagination.hasNext}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
