import type { Day } from '../types'

export function toISODate(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function parseISODate(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function addDays(iso: string, n: number): string {
  const d = parseISODate(iso)
  d.setDate(d.getDate() + n)
  return toISODate(d)
}

export function formatDay(iso: string): string {
  return parseISODate(iso).toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })
}

/** Rebuild the day list for a new start date / length, keeping assignments by index. */
export function buildDays(startDate: string, count: number, previous: Day[] = []): Day[] {
  const days: Day[] = []
  for (let i = 0; i < count; i++) {
    days.push({ index: i, date: addDays(startDate, i), groupIds: [...(previous[i]?.groupIds ?? [])] })
  }
  return days
}
