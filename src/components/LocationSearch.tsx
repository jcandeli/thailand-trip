import { useEffect, useRef, useState } from 'react'
import type { Location } from '../types'
import { searchPlaces } from '../lib/geocode'

interface Props {
  value: Location | null
  onChange: (loc: Location) => void
}

export default function LocationSearch({ value, onChange }: Props) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Location[]>([])
  const [open, setOpen] = useState(false)
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle')
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    if (!open) return
    const q = query.trim()
    if (q.length < 2) {
      setResults([])
      return
    }
    const timer = window.setTimeout(async () => {
      abortRef.current?.abort()
      const ctrl = new AbortController()
      abortRef.current = ctrl
      setStatus('loading')
      try {
        const found = await searchPlaces(q, ctrl.signal)
        if (!ctrl.signal.aborted) {
          setResults(found)
          setStatus('idle')
        }
      } catch (err) {
        if (!ctrl.signal.aborted) {
          console.error(err)
          setStatus('error')
        }
      }
    }, 600)
    return () => window.clearTimeout(timer)
  }, [query, open])

  function pick(loc: Location) {
    onChange(loc)
    setQuery('')
    setResults([])
    setOpen(false)
  }

  return (
    <div className="location-search">
      {value && (
        <div className="location-chosen" title={`${value.lat.toFixed(5)}, ${value.lng.toFixed(5)}`}>
          <span className="pin">&#9679;</span> {value.label}
        </div>
      )}
      <input
        type="text"
        placeholder={value ? 'Search to change location…' : 'Search a place in Thailand…'}
        value={query}
        onChange={(e) => {
          setQuery(e.target.value)
          setOpen(true)
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => window.setTimeout(() => setOpen(false), 150)}
      />
      {open && (status === 'loading' || status === 'error' || results.length > 0) && (
        <ul className="location-results">
          {status === 'loading' && <li className="muted">Searching…</li>}
          {status === 'error' && <li className="muted">Search failed, try again</li>}
          {results.map((r) => (
            <li key={`${r.lat},${r.lng}`}>
              <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => pick(r)}>
                {r.label}
              </button>
            </li>
          ))}
        </ul>
      )}
      <div className="hint">or click anywhere on the map to drop a pin</div>
    </div>
  )
}
