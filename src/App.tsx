import { useRef, useState } from 'react'
import './App.css'
import { EDITABLE, useTripStore } from './store'
import type { Location } from './types'
import { reverseGeocode } from './lib/geocode'
import ActivityForm, { type ActivityInput } from './components/ActivityForm'
import ActivityList from './components/ActivityList'
import TripMap from './components/TripMap'
import Calendar from './components/Calendar'
import Summary from './components/Summary'

type FormState = { mode: 'add' } | { mode: 'edit'; id: string } | null

export default function App() {
  const { trip, dispatch, loaded, saveStatus, exportJson, importJson } = useTripStore()
  const [form, setForm] = useState<FormState>(null)
  const [pickedLocation, setPickedLocation] = useState<Location | null>(null)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [focusId, setFocusId] = useState<string | null>(null)
  const fileInput = useRef<HTMLInputElement>(null)

  function openForm(next: FormState) {
    setPickedLocation(null)
    setForm(next)
  }

  // Map click: show the pin immediately, then upgrade the label via reverse geocoding.
  async function handleMapClick(loc: Location) {
    setPickedLocation(loc)
    const label = await reverseGeocode(loc.lat, loc.lng)
    setPickedLocation((cur) => (cur && cur.lat === loc.lat && cur.lng === loc.lng ? { ...cur, label } : cur))
  }

  function submitForm(data: ActivityInput) {
    if (form?.mode === 'edit') dispatch({ type: 'UPDATE_ACTIVITY', id: form.id, patch: data })
    else dispatch({ type: 'ADD_ACTIVITY', activity: data })
    openForm(null)
  }

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const editing = form?.mode === 'edit' ? trip.activities.find((a) => a.id === form.id) : undefined

  if (!loaded) return <div className="loading">Loading trip…</div>

  return (
    <div className="app">
      <header className="topbar">
        <h1>Thailand trip</h1>
        <Summary trip={trip} />
        <div className="topbar-actions">
          {EDITABLE ? (
            <span className={`save-status ${saveStatus}`}>
              {saveStatus === 'saving' && 'Saving…'}
              {saveStatus === 'saved' && 'Saved to trip.json'}
              {saveStatus === 'error' && 'Save failed (draft kept in browser)'}
            </span>
          ) : (
            <span className="save-status">View only</span>
          )}
          <button onClick={exportJson} title="Download trip.json">
            Export
          </button>
          {EDITABLE && (
            <>
              <button onClick={() => fileInput.current?.click()} title="Replace with a trip.json file">
                Import
              </button>
              <input
                ref={fileInput}
                type="file"
                accept="application/json"
                hidden
                onChange={(e) => {
                  const f = e.target.files?.[0]
                  if (f) importJson(f)
                  e.target.value = ''
                }}
              />
            </>
          )}
        </div>
      </header>

      <main className="panels">
        <aside className="panel left">
          {EDITABLE && !form && (
            <button className="primary wide" onClick={() => openForm({ mode: 'add' })}>
              + Add activity
            </button>
          )}
          {EDITABLE && form && (
            <ActivityForm
              key={form.mode === 'edit' ? form.id : 'add'}
              initial={editing}
              groups={trip.groups}
              pickedLocation={pickedLocation}
              onSubmit={submitForm}
              onCancel={() => openForm(null)}
            />
          )}
          <ActivityList
            activities={trip.activities}
            groups={trip.groups}
            days={trip.days}
            editable={EDITABLE}
            selectedIds={selectedIds}
            focusId={focusId}
            onToggleSelect={toggleSelect}
            onClearSelection={() => setSelectedIds(new Set())}
            onFocus={setFocusId}
            onEdit={(id) => openForm({ mode: 'edit', id })}
            dispatch={dispatch}
          />
        </aside>

        <section className="panel center">
          {form && <div className="map-hint">Click the map to set this activity's location</div>}
          <TripMap
            activities={trip.activities}
            groups={trip.groups}
            focusId={focusId}
            onMapClick={form ? handleMapClick : undefined}
            pendingLocation={form ? pickedLocation : null}
            onMarkerClick={setFocusId}
          />
        </section>

        <aside className="panel right">
          <Calendar
            days={trip.days}
            groups={trip.groups}
            activities={trip.activities}
            startDate={trip.startDate}
            editable={EDITABLE}
            dispatch={dispatch}
            onActivityClick={setFocusId}
          />
        </aside>
      </main>
    </div>
  )
}
