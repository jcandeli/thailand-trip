import { useEffect, useState } from 'react'
import type { Activity, Group, Location } from '../types'
import LocationSearch from './LocationSearch'

export type ActivityInput = Omit<Activity, 'id'>

interface Props {
  initial?: Activity
  groups: Group[]
  /** Location picked by clicking the map while this form is open. */
  pickedLocation: Location | null
  onSubmit: (data: ActivityInput) => void
  onCancel: () => void
}

export default function ActivityForm({ initial, groups, pickedLocation, onSubmit, onCancel }: Props) {
  const [name, setName] = useState(initial?.name ?? '')
  const [description, setDescription] = useState(initial?.description ?? '')
  const [imageUrl, setImageUrl] = useState(initial?.imageUrl ?? '')
  const [groupId, setGroupId] = useState(initial?.groupId ?? '')
  const [location, setLocation] = useState<Location | null>(initial?.location ?? null)

  useEffect(() => {
    if (pickedLocation) setLocation(pickedLocation)
  }, [pickedLocation])

  const canSubmit = name.trim().length > 0 && location !== null

  return (
    <form
      className="activity-form"
      onSubmit={(e) => {
        e.preventDefault()
        if (!canSubmit || !location) return
        onSubmit({
          name: name.trim(),
          description: description.trim(),
          imageUrl: imageUrl.trim() || undefined,
          location,
          groupId: groupId || undefined,
        })
      }}
    >
      <h3>{initial ? 'Edit activity' : 'New activity'}</h3>
      <label>
        Name
        <input value={name} onChange={(e) => setName(e.target.value)} autoFocus required />
      </label>
      <label>
        Description
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
      </label>
      <label>
        Image URL <span className="muted">(optional, hosted elsewhere)</span>
        <input
          type="url"
          value={imageUrl}
          onChange={(e) => setImageUrl(e.target.value)}
          placeholder="https://…"
        />
      </label>
      {imageUrl && <img className="preview" src={imageUrl} alt="" onError={(e) => (e.currentTarget.style.display = 'none')} />}
      <label>
        Location
        <LocationSearch value={location} onChange={setLocation} />
      </label>
      {groups.length > 0 && (
        <label>
          Group <span className="muted">(optional)</span>
          <select value={groupId} onChange={(e) => setGroupId(e.target.value)}>
            <option value="">Ungrouped</option>
            {groups.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </select>
        </label>
      )}
      <div className="row">
        <button type="submit" className="primary" disabled={!canSubmit}>
          {initial ? 'Save' : 'Add activity'}
        </button>
        <button type="button" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </form>
  )
}
