const API_BASE = 'https://packagemakerbackend.demandsetutours.com/api/inventorybooking'

export const TOUR_STATUS_OPTIONS = ['pending', 'completed', 'rejected']
export const PAYMENT_STATUS_OPTIONS = ['pending', 'completed', 'rejected']

export async function fetchBookings() {
  const response = await fetch(`${API_BASE}/get`)
  if (!response.ok) {
    throw new Error(`Failed to fetch bookings (${response.status})`)
  }
  const json = await response.json()
  if (!json.success) {
    throw new Error('API returned unsuccessful response')
  }
  return json.data ?? []
}

export async function updateBookingTourCompleted(id, tourCompleted) {
  const response = await fetch(`${API_BASE}/update/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tourCompleted }),
  })

  const json = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw new Error(json.message ?? `Failed to update booking (${response.status})`)
  }
  if (json.success === false) {
    throw new Error(json.message ?? 'Failed to update booking')
  }

  return json.data ?? json
}

export async function deleteBooking(id) {
  const response = await fetch(`${API_BASE}/delete/${id}`, { method: 'DELETE' })
  const json = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw new Error(json.message ?? `Failed to delete booking (${response.status})`)
  }
  if (json.success === false) {
    throw new Error(json.message ?? 'Failed to delete booking')
  }
}
