import type { Location } from '../types'

interface NominatimAddress {
  [key: string]: string | undefined
}

interface NominatimResult {
  place_id: number
  lat: string
  lon: string
  display_name: string
  name?: string
  address?: NominatimAddress
}

const BASE = 'https://nominatim.openstreetmap.org'
const COMMON = { format: 'jsonv2', addressdetails: '1', 'accept-language': 'en' }

/**
 * Free OpenStreetMap geocoding, limited to Thailand.
 * Usage policy: max 1 req/sec, so callers must debounce.
 * (Browsers forbid setting User-Agent; Nominatim identifies us via the Referer header.)
 */
export async function searchPlaces(query: string, signal?: AbortSignal): Promise<Location[]> {
  const q = query.trim()
  if (q.length < 2) return []
  const params = new URLSearchParams({ ...COMMON, q, countrycodes: 'th', limit: '6' })
  const res = await fetch(`${BASE}/search?${params}`, { signal, headers: { Accept: 'application/json' } })
  if (!res.ok) throw new Error(`Geocoding failed: HTTP ${res.status}`)
  const data = (await res.json()) as NominatimResult[]
  return data.map((r) => ({ lat: parseFloat(r.lat), lng: parseFloat(r.lon), label: shortLabel(r) }))
}

export async function reverseGeocode(lat: number, lng: number, signal?: AbortSignal): Promise<string> {
  const params = new URLSearchParams({ ...COMMON, lat: String(lat), lon: String(lng), zoom: '16' })
  try {
    const res = await fetch(`${BASE}/reverse?${params}`, { signal, headers: { Accept: 'application/json' } })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return shortLabel((await res.json()) as NominatimResult)
  } catch {
    return `${lat.toFixed(5)}, ${lng.toFixed(5)}`
  }
}

/** "Grand Palace, Phra Nakhon, Bangkok" rather than the full 8-part display_name. */
function shortLabel(r: NominatimResult): string {
  const a = r.address ?? {}
  const name = r.name || undefined
  const local = a.suburb || a.city_district || a.town || a.village || a.municipality || a.county
  const region = a.city || a.province || a.state
  const parts = [name, local, region].filter((p): p is string => Boolean(p))
  const unique = parts.filter((p, i) => parts.indexOf(p) === i)
  if (unique.length > 0) return unique.join(', ')
  return r.display_name.split(',').slice(0, 3).map((s) => s.trim()).join(', ')
}
