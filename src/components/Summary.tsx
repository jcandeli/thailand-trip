import type { Trip } from '../types'

export default function Summary({ trip }: { trip: Trip }) {
  const { activities, groups, days } = trip
  const scheduledGroupIds = new Set(days.flatMap((d) => d.groupIds))
  const filledDays = days.filter((d) => d.groupIds.length > 0).length
  const unscheduledGroups = groups.filter((g) => !scheduledGroupIds.has(g.id)).length
  const ungrouped = activities.filter((a) => !a.groupId).length

  return (
    <div className="summary">
      <span>
        <strong>{activities.length}</strong> activities in <strong>{groups.length}</strong> groups
      </span>
      <span className="sep">·</span>
      <span>
        <strong>{filledDays}</strong> of <strong>{days.length}</strong> days filled
      </span>
      <span className="sep">·</span>
      <span className={unscheduledGroups > 0 ? 'warn' : 'good'}>
        <strong>{unscheduledGroups}</strong> group{unscheduledGroups === 1 ? '' : 's'} unscheduled
      </span>
      {ungrouped > 0 && (
        <>
          <span className="sep">·</span>
          <span className="warn">
            <strong>{ungrouped}</strong> ungrouped
          </span>
        </>
      )}
    </div>
  )
}
