import { useMemo, useState } from 'react'
import type { AppStore } from '../lib/store'
import { computeStats } from '../lib/schedule'
import { addDays, startOfDay, weekdayOf } from '../lib/time'
import { Segmented } from '../components/Segmented'
import { Card } from '../components/Card'

const KIND_META = [
  { key: 'course', label: '上课', color: 'var(--c-course)' },
  { key: 'sleep', label: '睡眠', color: 'var(--c-sleep)' },
  { key: 'arrange', label: '安排', color: 'var(--c-arrange)' },
  { key: 'plan', label: '计划', color: 'var(--c-plan)' },
  { key: 'deadline', label: '待办', color: 'var(--c-deadline)' },
  { key: 'memorial', label: '纪念日', color: 'var(--c-memorial)' },
  { key: 'free', label: '空闲', color: 'var(--c-free)' },
] as const

type K = (typeof KIND_META)[number]['key']

export function StatsView({ store }: { store: AppStore }) {
  const [range, setRange] = useState<'week' | 'month'>('week')

  const { from, to, title } = useMemo(() => {
    const now = startOfDay(new Date())
    if (range === 'week') {
      const f = addDays(now, -(weekdayOf(now) - 1))
      return { from: f, to: addDays(f, 6), title: '本周' }
    }
    const f = new Date(now.getFullYear(), now.getMonth(), 1)
    return { from: f, to: new Date(now.getFullYear(), now.getMonth() + 1, 0), title: '本月' }
  }, [range])

  const totals = useMemo(
    () => computeStats(store.semester, store.courses, store.sleep, store.events, from, to),
    [store.semester, store.courses, store.sleep, store.events, from, to]
  )

  const hours = (min: number) => (min / 60).toFixed(1)
  const entries = KIND_META.map((m) => ({ ...m, minutes: totals[m.key as K] }))
  const maxMin = Math.max(1, ...entries.map((e) => e.minutes))
  const busy = entries.filter((e) => e.key !== 'free').reduce((s, e) => s + e.minutes, 0)
  const totalMin = entries.reduce((s, e) => s + e.minutes, 0)
  const freePct = totalMin > 0 ? Math.round((totals.free / totalMin) * 100) : 0

  return (
    <div className="view">
      <div className="topbar">
        <div className="topbar__date">统计</div>
      </div>
      <Segmented
        value={range}
        onChange={(v) => setRange(v as 'week' | 'month')}
        options={[
          { value: 'week', label: '本周' },
          { value: 'month', label: '本月' },
        ]}
      />

      <Card>
        <div className="stat-headline">
          <span className="stat-num">
            {hours(busy)}
            <span className="stat-unit"> 小时</span>
          </span>
          <span className="stat-label">{title}有安排的时间</span>
        </div>
        <div className="stat-sub">空闲时间占比 {freePct}%</div>
      </Card>

      <Card>
        <div className="section-title">时间分布</div>
        <div className="chart">
          {entries.map((e) => (
            <div key={e.key} className="chart-row">
              <span className="chart-dot" style={{ background: e.color }} />
              <span className="chart-label">{e.label}</span>
              <div className="chart-track">
                <div className="chart-fill" style={{ width: (e.minutes / maxMin) * 100 + '%', background: e.color }} />
              </div>
              <span className="chart-val">{hours(e.minutes)}h</span>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <div className="section-title">概览</div>
        <div className="stat-grid">
          <StatCell label="课程" value={store.courses.length + ' 门'} />
          <StatCell label="待办" value={store.events.filter((e) => e.kind === 'deadline').length + ' 个'} />
          <StatCell label="纪念日" value={store.events.filter((e) => e.kind === 'memorial').length + ' 个'} />
          <StatCell label="计划" value={store.plans.length + ' 个'} />
        </div>
      </Card>
    </div>
  )
}

function StatCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="stat-cell">
      <div className="stat-cell__val">{value}</div>
      <div className="stat-cell__label">{label}</div>
    </div>
  )
}
