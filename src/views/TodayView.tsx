import { useEffect, useMemo, useRef } from 'react'
import { CalendarClock, ChevronLeft, ChevronRight } from 'lucide-react'
import type { AppStore } from '../lib/store'
import { allDayEventsFor, eventOccursOn, freeSlots, type Block } from '../lib/schedule'
import { addDays, dateLabelCN, dateToStr, daysUntil, parseDate, todayStr } from '../lib/time'
import { weekNumber, weekLabel } from '../lib/week'
import type { EventItem } from '../types'
import { NowCard } from '../components/NowCard'
import { Timeline } from '../components/Timeline'
import { Button } from '../components/Button'

interface Props {
  store: AppStore
  dateStr: string
  onChangeDate: (s: string) => void
  blocks: Block[]
  onBlockClick: (b: Block) => void
  onEventClick: (e: EventItem) => void
}

export function TodayView({ store, dateStr, onChangeDate, blocks, onBlockClick, onEventClick }: Props) {
  const nowRef = useRef<HTMLDivElement>(null)
  const date = parseDate(dateStr)
  const isToday = dateStr === todayStr()
  const week = store.semester ? weekLabel(weekNumber(store.semester, date)) : ''
  const allDay = useMemo(() => allDayEventsFor(store.events, date), [store.events, dateStr])
  const deadlines = useMemo(
    () =>
      store.events
        .filter((e) => e.kind === 'deadline')
        .sort((a, b) => a.date.localeCompare(b.date))
        .slice(0, 4),
    [store.events]
  )
  const important = useMemo(
    () =>
      store.events
        .filter((e) => (e.priority ?? 0) >= 1 && eventOccursOn(e, date))
        .sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0) || a.startTime.localeCompare(b.startTime)),
    [store.events, dateStr]
  )

  useEffect(() => {
    if (isToday) nowRef.current?.scrollIntoView({ block: 'center' })
  }, [isToday, blocks.length])

  const shift = (n: number) => onChangeDate(dateToStr(addDays(date, n)))

  return (
    <div className="view">
      <div className="topbar">
        <div>
          <div className="topbar__date">
            {dateLabelCN(date)}
            {important.length > 0 && <span className="important-badge">{important.length}</span>}
          </div>
          {week && <div className="topbar__week">{week}</div>}
          {important.length > 0 && (
            <button className="important-chip" onClick={() => onEventClick(important[0])}>
              <span
                className="important-dot"
                style={{ background: (important[0].priority ?? 0) >= 2 ? 'var(--c-deadline)' : 'var(--c-arrange)' }}
              />
              {important[0].title}
            </button>
          )}
        </div>
        <div className="topbar__actions">
          <Button variant="icon" onClick={() => shift(-1)} aria-label="前一天">
            <ChevronLeft size={18} />
          </Button>
          <Button variant="ghost" onClick={() => onChangeDate(todayStr())} disabled={isToday}>
            今天
          </Button>
          <Button variant="icon" onClick={() => shift(1)} aria-label="后一天">
            <ChevronRight size={18} />
          </Button>
        </div>
      </div>

      {!store.semester && (
        <div className="card hint">尚未设置学期，课表单双周暂无法计算。请到「我的」里设定学期开始日期。</div>
      )}

      <div className="summary">
        <span className="summary__item">
          <span className="summary__dot" style={{ background: 'var(--c-course)' }} /> {blocks.filter((b) => b.kind === 'course').length} 节课
        </span>
        <span className="summary__item">
          <span className="summary__dot" style={{ background: 'var(--c-arrange)' }} />{' '}
          {blocks.filter((b) => b.kind === 'arrange' || b.kind === 'plan' || b.kind === 'deadline').length} 项安排
        </span>
        <span className="summary__item">
          <span className="summary__dot" style={{ background: 'var(--c-free)' }} /> 空闲{' '}
          {(freeSlots(blocks, 0, 1440).reduce((s, x) => s + (x.end - x.start), 0) / 60).toFixed(1)} 小时
        </span>
      </div>

      <NowCard blocks={blocks} />

      {allDay.length > 0 && (
        <div className="allchips">
          {allDay.map((ev) => (
            <button
              key={ev.id}
              className="allchip"
              style={{ background: ev.color || 'var(--c-memorial)', color: '#fff' }}
              onClick={() => onEventClick(ev)}
            >
              {ev.title}
            </button>
          ))}
        </div>
      )}

      {deadlines.length > 0 && (
        <div className="card">
          <div className="section-title">
            <CalendarClock size={15} /> 待办倒计时
          </div>
          <div className="list">
            {deadlines.map((e) => {
              const n = daysUntil(e.date)
              const label = n > 0 ? `${n} 天后` : n === 0 ? '今天' : `已过 ${-n} 天`
              return (
                <div key={e.id} className="list-item" style={{ cursor: 'pointer' }} onClick={() => onEventClick(e)}>
                  <div className="list-item__body">
                    <div className="list-item__title">{e.title}</div>
                    <div className="list-item__sub">{e.date}</div>
                  </div>
                  <span className="countdown">{label}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      <Timeline blocks={blocks} onBlockClick={onBlockClick} nowLineRef={nowRef} />
    </div>
  )
}
