import { useState, type CSSProperties } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { AppStore } from '../lib/store'
import { allDayEventsFor, blocksForDay } from '../lib/schedule'
import { addDays, dateToStr, pad2, startOfDay, todayStr, weekdayOf } from '../lib/time'
import { Button } from '../components/Button'

const DAY_START = 6 * 60
const DAY_END = 24 * 60
const HOUR_H = 30
const TOTAL = ((DAY_END - DAY_START) / 60) * HOUR_H

function mondayOf(d: Date): Date {
  return addDays(startOfDay(d), -(weekdayOf(d) - 1))
}

interface Props {
  store: AppStore
  onPickDate: (s: string) => void
}

export function WeekView({ store, onPickDate }: Props) {
  const [weekStart, setWeekStart] = useState(() => mondayOf(new Date()))
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))
  const today = todayStr()

  const pos = (min: number) =>
    ((Math.min(Math.max(min, DAY_START), DAY_END) - DAY_START) / (DAY_END - DAY_START)) * TOTAL

  return (
    <div className="view">
      <div className="week-head">
        <div className="topbar__date">
          {dateToStr(weekStart)} ~ {dateToStr(addDays(weekStart, 6))}
        </div>
        <div className="topbar__actions">
          <Button variant="icon" onClick={() => setWeekStart(addDays(weekStart, -7))} aria-label="上一周">
            <ChevronLeft size={18} />
          </Button>
          <Button variant="ghost" onClick={() => setWeekStart(mondayOf(new Date()))}>
            本周
          </Button>
          <Button variant="icon" onClick={() => setWeekStart(addDays(weekStart, 7))} aria-label="下一周">
            <ChevronRight size={18} />
          </Button>
        </div>
      </div>

      <div className="week-grid">
        <div className="week-axis" style={{ height: TOTAL }}>
          {Array.from({ length: (DAY_END - DAY_START) / 60 }, (_, i) => (
            <div key={i} className="week-axis__hour" style={{ top: i * HOUR_H }}>
              {pad2(DAY_START / 60 + i)}
            </div>
          ))}
        </div>
        {days.map((d) => {
          const ds = dateToStr(d)
          const blocks = blocksForDay(store.semester, store.courses, store.sleep, store.events, d)
          const allDay = allDayEventsFor(store.events, d)
          const isToday = ds === today
          return (
            <div key={ds} className="week-col" style={{ height: TOTAL }} onClick={() => onPickDate(ds)}>
              <div className={'week-col__head' + (isToday ? ' is-today' : '')}>
                {d.getMonth() + 1}/{d.getDate()}
                {allDay.length > 0 && <span className="week-col__allday" />}
              </div>
              {blocks.map((b, i) => {
                const top = pos(b.start)
                const height = Math.max(pos(b.end) - top, 10)
                const style: CSSProperties = { top, height, background: b.color || 'var(--c-course)', color: '#fff' }
                return (
                  <div key={i} className="week-block" style={style} title={b.title}>
                    {b.title}
                  </div>
                )
              })}
            </div>
          )
        })}
      </div>
      <div className="hint">点某一天进入当天详细时间轴，头顶小点表示当天有全天事项。</div>
    </div>
  )
}
