import { useDraggable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import type { Activity, Group } from '../types'

interface Props {
  group: Group
  activities: Activity[]
  editable: boolean
  onUnschedule?: () => void
  onActivityClick: (id: string) => void
  /** Render without drag behaviour (used for the DragOverlay). */
  overlay?: boolean
}

export default function GroupCard({ group, activities, editable, onUnschedule, onActivityClick, overlay }: Props) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: group.id,
    disabled: !editable || overlay,
  })

  return (
    <div
      ref={overlay ? undefined : setNodeRef}
      className={`group-card ${isDragging ? 'dragging' : ''} ${overlay ? 'overlay' : ''} ${editable ? 'grabbable' : ''}`}
      style={{ borderLeftColor: group.color, transform: CSS.Translate.toString(transform) }}
      {...(overlay ? {} : listeners)}
      {...(overlay ? {} : attributes)}
    >
      <div className="group-card-head">
        <span className="swatch" style={{ background: group.color }} />
        <strong>{group.name}</strong>
        <span className="muted">{activities.length}</span>
        {editable && onUnschedule && (
          <button
            className="icon"
            title="Remove from this day"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation()
              onUnschedule()
            }}
          >
            ✕
          </button>
        )}
      </div>
      <ul>
        {activities.map((a) => (
          <li key={a.id}>
            <button
              type="button"
              className="link"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation()
                onActivityClick(a.id)
              }}
            >
              {a.name}
            </button>
          </li>
        ))}
        {activities.length === 0 && <li className="muted">empty</li>}
      </ul>
    </div>
  )
}
