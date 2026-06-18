const API_BASE = 'https://packagemakerbackend.demandsetutours.com/api/seo-listing'

async function parseResponse(response) {
  const json = await response.json().catch(() => ({}))
  if (!response.ok || json.success === false) {
    throw new Error(json.message ?? `Request failed (${response.status})`)
  }
  return json
}

export async function fetchAllListings(params = {}) {
  const query = new URLSearchParams()
  if (params.page) query.set('page', params.page)
  if (params.limit) query.set('limit', params.limit)
  if (params.search) query.set('search', params.search)
  if (params.locationType) query.set('locationType', params.locationType)
  if (params.isActive !== undefined) query.set('isActive', params.isActive)

  const qs = query.toString()
  const response = await fetch(`${API_BASE}/all${qs ? `?${qs}` : ''}`)
  const json = await parseResponse(response)
  return { listings: json.data ?? [], pagination: json.pagination }
}

export async function fetchListingById(id) {
  const response = await fetch(`${API_BASE}/id/${id}`)
  const json = await parseResponse(response)
  return json.data
}

export async function createListing(payload) {
  const response = await fetch(`${API_BASE}/create`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  const json = await parseResponse(response)
  return json.data
}

export async function updateListing(id, payload) {
  const response = await fetch(`${API_BASE}/update/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  const json = await parseResponse(response)
  return json.data
}

export async function deleteListing(id) {
  const response = await fetch(`${API_BASE}/delete/${id}`, { method: 'DELETE' })
  await parseResponse(response)
}
