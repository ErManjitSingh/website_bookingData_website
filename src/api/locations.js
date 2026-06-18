import { uniqueLocations } from '../utils/seoListingForm'

const CITIES_URL =
  'https://packagemakerbackend.demandsetutours.com/api/packagemaker//get-packagemaker-hotel-cities'
const STATES_URL =
  'https://packagemakerbackend.demandsetutours.com/api/packagemaker//get-packagemaker-hotel-states'

async function fetchLocationList(url) {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Failed to fetch locations (${response.status})`)
  }
  const json = await response.json()
  if (!json.success) {
    throw new Error('API returned unsuccessful response')
  }
  return uniqueLocations(json.data ?? [])
}

export function fetchCities() {
  return fetchLocationList(CITIES_URL)
}

export function fetchStates() {
  return fetchLocationList(STATES_URL)
}
