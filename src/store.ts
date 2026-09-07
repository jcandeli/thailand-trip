import { useCallback, useEffect, useReducer, useRef, useState } from 'react'
import type { Activity, Group, Trip } from './types'
import { GROUP_COLORS } from './types'
import { buildDays } from './lib/dates'

export const EDITABLE = import.meta.env.DEV
const DRAFT_KEY = 'thailand-trip:draft'
const TRIP_URL = `${import.meta.env.BASE_URL}trip.json`

export type Action =
  | { type: 'LOAD'; trip: Trip }
  | { type: 'ADD_ACTIVITY'; activity: Omit<Activity, 'id'> }
  | { type: 'UPDATE_ACTIVITY'; id: string; patch: Partial<Omit<Activity, 'id'>> }
  | { type: 'DELETE_ACTIVITY'; id: string }
  | { type: 'CREATE_GROUP'; name: string; activityIds: string[] }
  | { type: 'UPDATE_GROUP'; id: string; patch: Partial<Omit<Group, 'id'>> }
  | { type: 'DELETE_GROUP'; id: string }
  | { type: 'SET_ACTIVITY_GROUP'; activityId: string; groupId?: string }
  | { type: 'ASSIGN_GROUP_TO_DAY'; groupId: string; dayIndex: number | null }
  | { type: 'SET_TRIP_DATES'; startDate: string; dayCount: number }

function newId(): string {
  return crypto.randomUUID()
}

function nextColor(groups: Group[]): string {
  const used = new Set(groups.map((g) => g.color))
  return GROUP_COLORS.find((c) => !used.has(c)) ?? GROUP_COLORS[groups.length % GROUP_COLORS.length]
}

export function reducer(state: Trip, action: Action): Trip {
  switch (action.type) {
    case 'LOAD':
      return action.trip

    case 'ADD_ACTIVITY':
      return { ...state, activities: [...state.activities, { ...action.activity, id: newId() }] }

    case 'UPDATE_ACTIVITY':
      return {
        ...state,
        activities: state.activities.map((a) => (a.id === action.id ? { ...a, ...action.patch } : a)),
      }

    case 'DELETE_ACTIVITY':
      return { ...state, activities: state.activities.filter((a) => a.id !== action.id) }

    case 'CREATE_GROUP': {
      const group: Group = { id: newId(), name: action.name, color: nextColor(state.groups) }
      const ids = new Set(action.activityIds)
      return {
        ...state,
        groups: [...state.groups, group],
        activities: state.activities.map((a) => (ids.has(a.id) ? { ...a, groupId: group.id } : a)),
      }
    }

    case 'UPDATE_GROUP':
      return {
        ...state,
        groups: state.groups.map((g) => (g.id === action.id ? { ...g, ...action.patch } : g)),
      }

    case 'DELETE_GROUP':
      return {
        ...state,
        groups: state.groups.filter((g) => g.id !== action.id),
        activities: state.activities.map((a) =>
          a.groupId === action.id ? { ...a, groupId: undefined } : a,
        ),
        days: state.days.map((d) => (d.groupId === action.id ? { ...d, groupId: undefined } : d)),
      }

    case 'SET_ACTIVITY_GROUP':
      return {
        ...state,
        activities: state.activities.map((a) =>
          a.id === action.activityId ? { ...a, groupId: action.groupId } : a,
        ),
      }

    case 'ASSIGN_GROUP_TO_DAY': {
      const from = state.days.find((d) => d.groupId === action.groupId)
      const fromIndex = from ? from.index : null
      if (fromIndex === action.dayIndex) return state
      const target = action.dayIndex === null ? undefined : state.days[action.dayIndex]
      const displaced = target?.groupId
      return {
        ...state,
        days: state.days.map((d) => {
          if (d.index === action.dayIndex) return { ...d, groupId: action.groupId }
          // Group left this day: if the target had an occupant, swap it in; otherwise clear.
          if (d.index === fromIndex) return { ...d, groupId: displaced }
          return d
        }),
      }
    }

    case 'SET_TRIP_DATES': {
      const count = Math.max(1, Math.min(60, action.dayCount))
      return {
        ...state,
        startDate: action.startDate,
        days: buildDays(action.startDate, count, state.days),
      }
    }
  }
}

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'

const EMPTY: Trip = { startDate: '2026-11-01', days: buildDays('2026-11-01', 15), activities: [], groups: [] }

export function useTripStore() {
  const [trip, dispatch] = useReducer(reducer, EMPTY)
  const [loaded, setLoaded] = useState(false)
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle')
  const dirty = useRef(false)
  const timer = useRef<number | undefined>(undefined)

  // Initial load from trip.json (falls back to a localStorage draft if the fetch fails).
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch(TRIP_URL, { cache: 'no-store' })
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const data = (await res.json()) as Trip
        if (!cancelled) dispatch({ type: 'LOAD', trip: normalize(data) })
      } catch (err) {
        console.warn('Could not load trip.json, trying draft', err)
        const draft = localStorage.getItem(DRAFT_KEY)
        if (draft && !cancelled) dispatch({ type: 'LOAD', trip: normalize(JSON.parse(draft)) })
      } finally {
        if (!cancelled) setLoaded(true)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  // Auto-save (dev only): debounce a POST to the Vite plugin, keep a localStorage draft as backup.
  useEffect(() => {
    if (!loaded) return
    if (!dirty.current) {
      dirty.current = true // skip the first run after load
      return
    }
    localStorage.setItem(DRAFT_KEY, JSON.stringify(trip))
    if (!EDITABLE) return
    setSaveStatus('saving')
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(async () => {
      try {
        const res = await fetch('/api/trip', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(trip),
        })
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        setSaveStatus('saved')
      } catch (err) {
        console.error('Save failed', err)
        setSaveStatus('error')
      }
    }, 500)
  }, [trip, loaded])

  const exportJson = useCallback(() => {
    const blob = new Blob([JSON.stringify(trip, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'trip.json'
    a.click()
    URL.revokeObjectURL(url)
  }, [trip])

  const importJson = useCallback((file: File) => {
    const reader = new FileReader()
    reader.onload = () => {
      try {
        dispatch({ type: 'LOAD', trip: normalize(JSON.parse(String(reader.result))) })
      } catch (err) {
        alert(`Could not import: ${String(err)}`)
      }
    }
    reader.readAsText(file)
  }, [])

  return { trip, dispatch, loaded, saveStatus, exportJson, importJson }
}

/** Fill in anything missing so older/hand-edited files still load. */
function normalize(t: Partial<Trip>): Trip {
  const startDate = t.startDate ?? EMPTY.startDate
  const days = t.days && t.days.length > 0 ? t.days : buildDays(startDate, 15)
  return {
    startDate,
    days,
    activities: t.activities ?? [],
    groups: t.groups ?? [],
  }
}
