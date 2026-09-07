import { useState } from 'react'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core'
import type { Activity, Day, Group } from '../types'
import type { Action } from '../store'
import { formatDay } from '../lib/dates'
import GroupCard from './GroupCard'

interface Props {
  days: Day[]
  groups: Group[]
  activities: Activity[]
  startDate: string
  editable: boolean
  dispatch: (a: Action) => void
  onActivityClick: (id: string) => void
}

const TRAY_ID = 'tray'
const dayId = (i: number) => `day-${i}`

export default function Calendar({ days, groups, activities, startDate, editable, dispatch, onActivityClick }: Props) {
  const [activeId, setActiveId] = useState<string | null>(null)
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }))

  const groupById = new Map(groups.map((g) => [g.id, g]))
  const activitiesOf = (gid: string) => activities.filter((a) => a.groupId === gid)
  const scheduled = new Set(days.map((d) => d.groupId).filter(Boolean))
  const unscheduled = groups.filter((g) => !scheduled.has(g.id))

  function onDragStart(e: DragStartEvent) {
    setActiveId(String(e.active.id))
  }

  function onDragEnd(e: DragEndEvent) {
    setActiveId(null)
    const { active, over } = e
    if (!over) return
    const groupId = String(active.id)
    const overId = String(over.id)
    if (overId === TRAY_ID) {
      dispatch({ type: 'ASSIGN_GROUP_TO_DAY', groupId, dayIndex: null })
    } else if (overId.startsWith('day-')) {
      dispatch({ type: 'ASSIGN_GROUP_TO_DAY', groupId, dayIndex: Number(overId.slice(4)) })
    }
  }

  const activeGroup = activeId ? groupById.get(activeId) : undefined

  return (
    <DndContext sensors={sensors} onDragStart={onDragStart} onDragEnd={onDragEnd} onDragCancel={() => setActiveId(null)}>
      <div className="calendar">
        {editable && (
          <div className="trip-settings">
            <label>
              Start
              <input
                type="date"
                value={startDate}
                onChange={(e) =>
                  e.target.value && dispatch({ type: 'SET_TRIP_DATES', startDate: e.target.value, dayCount: days.length })
                }
              />
            </label>
            <label>
              Days
              <input
                type="number"
                min={1}
                max={60}
                value={days.length}
                onChange={(e) =>
                  dispatch({ type: 'SET_TRIP_DATES', startDate, dayCount: Number(e.target.value) || 1 })
                }
              />
            </label>
          </div>
        )}

        <Tray editable={editable}>
          {unscheduled.length === 0 && <p className="muted empty">All groups are scheduled</p>}
          {unscheduled.map((g) => (
            <GroupCard
              key={g.id}
              group={g}
              activities={activitiesOf(g.id)}
              editable={editable}
              onActivityClick={onActivityClick}
            />
          ))}
        </Tray>

        <div className="days">
          {days.map((d) => {
            const g = d.groupId ? groupById.get(d.groupId) : undefined
            return (
              <DayCell key={d.index} day={d} editable={editable}>
                {g && (
                  <GroupCard
                    group={g}
                    activities={activitiesOf(g.id)}
                    editable={editable}
                    onActivityClick={onActivityClick}
                    onUnschedule={() => dispatch({ type: 'ASSIGN_GROUP_TO_DAY', groupId: g.id, dayIndex: null })}
                  />
                )}
              </DayCell>
            )
          })}
        </div>
      </div>
      <DragOverlay dropAnimation={null}>
        {activeGroup && (
          <GroupCard
            overlay
            group={activeGroup}
            activities={activitiesOf(activeGroup.id)}
            editable={false}
            onActivityClick={() => {}}
          />
        )}
      </DragOverlay>
    </DndContext>
  )
}

function Tray({ editable, children }: { editable: boolean; children: React.ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({ id: TRAY_ID, disabled: !editable })
  return (
    <section ref={setNodeRef} className={`tray ${isOver ? 'over' : ''}`}>
      <header>
        <strong>Unscheduled groups</strong>
        {editable && <span className="muted small">drag onto a day</span>}
      </header>
      {children}
    </section>
  )
}

function DayCell({ day, editable, children }: { day: Day; editable: boolean; children: React.ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({ id: dayId(day.index), disabled: !editable })
  return (
    <div ref={setNodeRef} className={`day ${isOver ? 'over' : ''} ${day.groupId ? 'filled' : 'empty'}`}>
      <div className="day-label">
        <strong>Day {day.index + 1}</strong>
        <span className="muted">{formatDay(day.date)}</span>
      </div>
      <div className="day-body">{children ?? <span className="muted small">free</span>}</div>
    </div>
  )
}
