import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { AppStore } from '../lib/store'
import { allDayEventsFor, blocksForDay } from '../lib/schedule'
import { dateToStr, todayStr } from '../lib/time'
import { Button } from '../components/Button'

interface Props {
  store: AppStore
  onPickDate: (s: string) => void
}

const WEEKDAYS = ['一', '二', '三', '四', '五', '六', '日']

export function MonthView({ store, onPickDate }: Props) {
  const [cursor, setCursor] = useState(() => {
    const n = new Date()
    return new Date(n.getFullYear(), n.getMonth(), 1)
  })
  const today = todayStr()
  const year = cursor.getFullYear()
  const month = cursor.getMonth()

  const firstWeekday = (new Date(year, month, 1).getDay() + 6) % 7
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const prevDays = new Date(year, month, 0).getDate()

  const cells: { date: Date; inMonth: boolean }[] = []
  for (let i = 0; i < firstWeekday; i++) {
    cells.push({ date: new Date(year, month - 1, prevDays - firstWeekday + 1 + i), inMonth: false })
  }
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ date: new Date(year, month, d), inMonth: true })
  }
  while (cells.length % 7 !== 0) {
    const extra = cells.length - (firstWeekday + daysInMonth) + 1
    cells.push({ date: new Date(year, month + 1, extra), inMonth: false })
  }

  const shift = (n: number) => setCursor(new Date(year, month + n, 1))

  return (
    <div className="view">
      <div className="month-head">
        <div className="topbar__date">
          {year} 年 {month + 1} 月
        </div>
        <div className="topbar__actions">
          <Button variant="icon" onClick={() => shift(-1)} aria-label="上一月">
            <ChevronLeft size={18} />
          </Button>
          <Button variant="ghost" onClick={() => setCursor(new Date(new Date().getFullYear(), new Date().getMonth(), 1))}>
            本月
          </Button>
          <Button variant="icon" onClick={() => shift(1)} aria-label="下一月">
            <ChevronRight size={18} />
          </Button>
        </div>
      </div>
      <div className="month-weekdays">
        {WEEKDAYS.map((w) => (
          <span key={w}>{w}</span>
        ))}
      </div>
      <div className="month-grid">
        {cells.map((cell, i) => {
          const ds = dateToStr(cell.date)
          const blocks = blocksForDay(store.semester, store.courses, store.sleep, store.events, cell.date)
          const allDay = allDayEventsFor(store.events, cell.date)
          const colors = [
            ...blocks.map((b) => b.color || 'var(--text-2)'),
            ...allDay.map((e) => e.color || 'var(--c-memorial)'),
          ]
          const dots = [...new Set(colors)].slice(0, 4)
          const cls = 'month-cell' + (cell.inMonth ? '' : ' is-out') + (ds === today ? ' is-today' : '')
          return (
            <div key={i} className={cls} onClick={() => onPickDate(ds)}>
              <span className="month-cell__num">{cell.date.getDate()}</span>
              <div className="month-dots">
                {dots.map((c, j) => (
                  <span key={j} className="month-dot" style={{ background: c }} />
                ))}
              </div>
            </div>
          )
        })}
      </div>
      <div className="hint">色点表示当天有安排，点某天进入当天时间轴。</div>
    </div>
  )
}
