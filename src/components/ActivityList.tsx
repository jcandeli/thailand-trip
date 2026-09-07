import { useState } from 'react'
import type { Activity, Group } from '../types'
import { GROUP_COLORS, UNGROUPED_COLOR } from '../types'
import type { Action } from '../store'

interface Props {
  activities: Activity[]
  groups: Group[]
  days: { index: number; groupId?: string }[]
  editable: boolean
  selectedIds: Set<string>
  focusId: string | null
  onToggleSelect: (id: string) => void
  onClearSelection: () => void
  onFocus: (id: string) => void
  onEdit: (id: string) => void
  dispatch: (a: Action) => void
}

export default function ActivityList(props: Props) {
  const { activities, groups, editable, selectedIds, dispatch } = props
  const [newGroupName, setNewGroupName] = useState('')

  const ungrouped = activities.filter((a) => !a.groupId)
  const byGroup = new Map<string, Activity[]>()
  for (const g of groups) byGroup.set(g.id, [])
  for (const a of activities) {
    if (a.groupId && byGroup.has(a.groupId)) byGroup.get(a.groupId)!.push(a)
  }

  function createGroup() {
    const name = newGroupName.trim() || `Group ${groups.length + 1}`
    dispatch({ type: 'CREATE_GROUP', name, activityIds: [...selectedIds] })
    setNewGroupName('')
    props.onClearSelection()
  }

  return (
    <div className="activity-list">
      {editable && selectedIds.size > 0 && (
        <div className="selection-bar">
          <span>{selectedIds.size} selected</span>
          <input
            placeholder="Group name"
            value={newGroupName}
            onChange={(e) => setNewGroupName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && createGroup()}
          />
          <button className="primary" onClick={createGroup}>
            Group selected
          </button>
          <button onClick={props.onClearSelection}>Clear</button>
        </div>
      )}

      {activities.length === 0 && (
        <p className="muted empty">No activities yet. Add one above to get started.</p>
      )}

      {ungrouped.length > 0 && (
        <section className="group-section">
          <header className="group-header" style={{ borderColor: UNGROUPED_COLOR }}>
            <span className="swatch" style={{ background: UNGROUPED_COLOR }} />
            <strong>Ungrouped</strong>
            <span className="muted">{ungrouped.length}</span>
          </header>
          {ungrouped.map((a) => (
            <ActivityRow key={a.id} activity={a} group={undefined} {...props} />
          ))}
        </section>
      )}

      {groups.map((g) => (
        <GroupSection key={g.id} group={g} members={byGroup.get(g.id) ?? []} {...props} />
      ))}
    </div>
  )
}

function GroupSection({
  group,
  members: activities,
  ...rest
}: Props & { group: Group; members: Activity[] }) {
  const { editable, dispatch, days } = rest
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(group.name)
  const day = days.find((d) => d.groupId === group.id)

  function commit() {
    const trimmed = name.trim()
    if (trimmed && trimmed !== group.name) dispatch({ type: 'UPDATE_GROUP', id: group.id, patch: { name: trimmed } })
    else setName(group.name)
    setEditing(false)
  }

  return (
    <section className="group-section">
      <header className="group-header" style={{ borderColor: group.color }}>
        {editable ? (
          <label className="swatch-picker" title="Change color">
            <span className="swatch" style={{ background: group.color }} />
            <select
              value={group.color}
              onChange={(e) => dispatch({ type: 'UPDATE_GROUP', id: group.id, patch: { color: e.target.value } })}
            >
              {GROUP_COLORS.map((c) => (
                <option key={c} value={c} style={{ background: c }}>
                  {c}
                </option>
              ))}
            </select>
          </label>
        ) : (
          <span className="swatch" style={{ background: group.color }} />
        )}
        {editing ? (
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={commit}
            onKeyDown={(e) => {
              if (e.key === 'Enter') commit()
              if (e.key === 'Escape') {
                setName(group.name)
                setEditing(false)
              }
            }}
          />
        ) : (
          <strong onDoubleClick={() => editable && setEditing(true)} title={editable ? 'Double-click to rename' : ''}>
            {group.name}
          </strong>
        )}
        <span className="muted">{activities.length}</span>
        {day && <span className="badge">Day {day.index + 1}</span>}
        {editable && (
          <span className="actions">
            <button className="icon" title="Rename" onClick={() => setEditing(true)}>
              ✎
            </button>
            <button
              className="icon danger"
              title="Delete group (activities become ungrouped)"
              onClick={() => confirm(`Delete group "${group.name}"?`) && dispatch({ type: 'DELETE_GROUP', id: group.id })}
            >
              ✕
            </button>
          </span>
        )}
      </header>
      {activities.length === 0 && <p className="muted empty">Empty group</p>}
      {activities.map((a) => (
        <ActivityRow key={a.id} activity={a} group={group} {...rest} />
      ))}
    </section>
  )
}

type RowProps = Pick<
  Props,
  'groups' | 'editable' | 'selectedIds' | 'focusId' | 'onToggleSelect' | 'onFocus' | 'onEdit' | 'dispatch'
> & { activity: Activity; group?: Group }

function ActivityRow({
  activity,
  group,
  groups,
  editable,
  selectedIds,
  focusId,
  onToggleSelect,
  onFocus,
  onEdit,
  dispatch,
}: RowProps) {
  const a = activity
  return (
    <div
      className={`activity-row ${focusId === a.id ? 'focused' : ''} ${selectedIds.has(a.id) ? 'selected' : ''}`}
      onClick={() => onFocus(a.id)}
    >
      {editable && (
        <input
          type="checkbox"
          checked={selectedIds.has(a.id)}
          onClick={(e) => e.stopPropagation()}
          onChange={() => onToggleSelect(a.id)}
          title="Select to group"
        />
      )}
      {a.imageUrl ? (
        <img className="thumb" src={a.imageUrl} alt="" loading="lazy" />
      ) : (
        <span className="thumb placeholder" style={{ background: group?.color ?? UNGROUPED_COLOR }} />
      )}
      <div className="activity-body">
        <div className="activity-name">{a.name}</div>
        <div className="muted small">{a.location.label}</div>
        {a.description && <div className="small description">{a.description}</div>}
        {editable && (
          <div className="actions" onClick={(e) => e.stopPropagation()}>
            <select
              value={a.groupId ?? ''}
              title="Move to group"
              onChange={(e) =>
                dispatch({ type: 'SET_ACTIVITY_GROUP', activityId: a.id, groupId: e.target.value || undefined })
              }
            >
              <option value="">Ungrouped</option>
              {groups.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>
            <button className="icon" title="Edit" onClick={() => onEdit(a.id)}>
              ✎
            </button>
            <button
              className="icon danger"
              title="Delete"
              onClick={() => confirm(`Delete "${a.name}"?`) && dispatch({ type: 'DELETE_ACTIVITY', id: a.id })}
            >
              ✕
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
