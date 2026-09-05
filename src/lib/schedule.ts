import type { Semester, Course, Sleep, EventItem, Plan } from '../types'
import { toMinutes, parseDate, dateToStr, addDays, startOfDay, nowMinutes, weekdayOf } from './time'
import { coursePeriodOn } from './week'

export type BlockKind = 'course' | 'sleep' | 'arrange' | 'plan' | 'deadline' | 'memorial' | 'free'

export interface Block {
  start: number // 分钟（0..1440）
  end: number
  kind: BlockKind
  title: string
  color?: string
  courseId?: number
  eventId?: number
  detail?: string
}

export const KIND_COLOR: Record<BlockKind, string> = {
  course: 'var(--c-course)',
  sleep: 'var(--c-sleep)',
  arrange: 'var(--c-arrange)',
  plan: 'var(--c-plan)',
  deadline: 'var(--c-deadline)',
  memorial: 'var(--c-memorial)',
  free: 'var(--c-free)',
}

export function eventOccursOn(ev: EventItem, date: Date): boolean {
  const s = dateToStr(date)
  const start = startOfDay(parseDate(ev.date))
  const cur = startOfDay(date)
  if (ev.date === s) return true
  if (ev.repeat === 'none') return false
  if (cur < start) return false
  if (ev.repeatEnd && dateToStr(cur) > ev.repeatEnd) return false
  if (ev.repeat === 'daily') return true
  if (ev.repeat === 'weekly') {
    const days = ev.weekdays && ev.weekdays.length ? ev.weekdays : [weekdayOf(start)]
    return days.includes(weekdayOf(date))
  }
  if (ev.repeat === 'monthly') {
    const dom = start.getDate()
    const lastOfStart = new Date(start.getFullYear(), start.getMonth() + 1, 0).getDate()
    const lastOfCur = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
    if (dom === lastOfStart) return date.getDate() === lastOfCur
    return date.getDate() === dom
  }
  return false
}

export function allDayEventsFor(events: EventItem[], date: Date): EventItem[] {
  const s = dateToStr(date)
  return events
    .filter((ev) => ev.allDay && eventOccursOn(ev, date))
    .sort((a, b) => a.title.localeCompare(b.title))
}

export function blocksForDay(
  semester: Semester | undefined,
  courses: Course[],
  sleep: Sleep | undefined,
  events: EventItem[],
  date: Date
): Block[] {
  const blocks: Block[] = []
  const ds = dateToStr(date)

  if (sleep) {
    const ov = sleep.overrides?.[ds]
    const bed = ov ? toMinutes(ov.bed) : toMinutes(sleep.bedTime)
    const wake = ov ? toMinutes(ov.wake) : toMinutes(sleep.wakeTime)
    if (wake > 0) blocks.push({ start: 0, end: wake, kind: 'sleep', title: '睡眠', color: KIND_COLOR.sleep })
    if (bed < 1440) blocks.push({ start: bed, end: 1440, kind: 'sleep', title: '睡眠', color: KIND_COLOR.sleep })
  }

  if (semester) {
    for (const c of courses) {
      const p = coursePeriodOn(c, semester, date)
      if (p) {
        blocks.push({
          start: toMinutes(p.startTime),
          end: toMinutes(p.endTime),
          kind: 'course',
          title: c.name,
          detail: [p.location || c.location, c.teacher].filter(Boolean).join(' · '),
          color: c.color || KIND_COLOR.course,
          courseId: c.id,
        })
      }
    }
  }

  for (const ev of events) {
    if (ev.allDay) continue
    if (eventOccursOn(ev, date)) {
      blocks.push({
        start: toMinutes(ev.startTime),
        end: toMinutes(ev.endTime),
        kind: ev.kind,
        title: ev.title,
        detail: ev.location || ev.note || undefined,
        color: ev.color || KIND_COLOR[ev.kind],
        eventId: ev.id,
      })
    }
  }

  blocks.sort((a, b) => a.start - b.start || a.end - b.end)
  return blocks
}

export interface FreeSlot {
  start: number
  end: number
}

export function freeSlots(blocks: Block[], dayStart = 0, dayEnd = 1440): FreeSlot[] {
  const sorted = blocks.filter((b) => b.end > dayStart && b.start < dayEnd).sort((a, b) => a.start - b.start)
  const out: FreeSlot[] = []
  let cursor = dayStart
  for (const b of sorted) {
    if (b.start > cursor) out.push({ start: cursor, end: b.start })
    cursor = Math.max(cursor, b.end)
  }
  if (cursor < dayEnd) out.push({ start: cursor, end: dayEnd })
  return out
}

export function nowInfo(blocks: Block[]) {
  const now = nowMinutes()
  const current = blocks.find((b) => b.start <= now && b.end > now) || null
  const next = blocks.filter((b) => b.start > now).sort((a, b) => a.start - b.start)[0] || null
  return { now, current, next }
}

export function upcoming(blocks: Block[], limit = 3): Block[] {
  const now = nowMinutes()
  return blocks
    .filter((b) => b.start > now)
    .sort((a, b) => a.start - b.start)
    .slice(0, limit)
}

export interface RecommendSlot {
  date: string
  start: number
  end: number
}

export function recommendSlots(
  semester: Semester | undefined,
  courses: Course[],
  sleep: Sleep | undefined,
  events: EventItem[],
  plan: Plan,
  days = 7
): RecommendSlot[] {
  const out: RecommendSlot[] = []
  const today = startOfDay(new Date())
  for (let d = 0; d < days; d++) {
    const date = addDays(today, d)
    const blocks = blocksForDay(semester, courses, sleep, events, date)
    const slots = freeSlots(blocks, 8 * 60, 22 * 60).filter((s) => s.end - s.start >= plan.duration)
    for (const s of slots) {
      out.push({ date: dateToStr(date), start: s.start, end: s.start + plan.duration })
    }
  }
  return out
}

export interface StatTotals {
  course: number
  sleep: number
  arrange: number
  plan: number
  deadline: number
  memorial: number
  free: number
}

export function computeStats(
  semester: Semester | undefined,
  courses: Course[],
  sleep: Sleep | undefined,
  events: EventItem[],
  from: Date,
  to: Date
): StatTotals {
  const totals: StatTotals = { course: 0, sleep: 0, arrange: 0, plan: 0, deadline: 0, memorial: 0, free: 0 }
  const days = Math.floor((startOfDay(to).getTime() - startOfDay(from).getTime()) / 86400000) + 1
  for (let d = 0; d < days; d++) {
    const date = addDays(from, d)
    const blocks = blocksForDay(semester, courses, sleep, events, date)
    for (const b of blocks) {
      const dur = b.end - b.start
      if (b.kind === 'course') totals.course += dur
      else if (b.kind === 'sleep') totals.sleep += dur
      else if (b.kind === 'arrange') totals.arrange += dur
      else if (b.kind === 'plan') totals.plan += dur
      else if (b.kind === 'deadline') totals.deadline += dur
      else if (b.kind === 'memorial') totals.memorial += dur
    }
    totals.free += freeSlots(blocks, 0, 1440).reduce((s, x) => s + (x.end - x.start), 0)
  }
  return totals
}
