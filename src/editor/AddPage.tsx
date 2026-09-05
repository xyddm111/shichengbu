import { useState } from 'react'
import { X } from 'lucide-react'
import type { AppStore } from '../lib/store'
import { toMinutes, toHHMM, dateLabelCN, parseDate } from '../lib/time'
import { recommendSlots, type RecommendSlot } from '../lib/schedule'
import type { Course, CoursePeriod, EventItem, EventKind, Plan, Repeat, WeekRule } from '../types'
import { Segmented } from '../components/Segmented'
import { Input } from '../components/Input'
import { Button } from '../components/Button'
import { Toggle } from '../components/Toggle'

const COLORS = [
  '#4C6EF5', '#2563EB', '#0EA5E9', '#06B6D4',
  '#10B981', '#22C55E', '#84CC16', '#EAB308',
  '#F59E0B', '#F97316', '#EF4444', '#E64980',
  '#DB2777', '#A855F7', '#8B5CF6', '#78716C',
]

function parseDates(s: string): string[] {
  return s
    .split(/[,，\s]+/)
    .map((x) => x.trim())
    .filter((x) => /^\d{4}-\d{2}-\d{2}$/.test(x))
}

// 解析周次：支持单个(如 3)和范围(如 2-15、2-4,8-16)
function parseWeeks(s: string): number[] {
  const out = new Set<number>()
  for (const part of s.split(/[,，\s]+/)) {
    const m = part.match(/^(\d+)\s*[-~]\s*(\d+)$/)
    if (m) {
      const a = parseInt(m[1], 10)
      const b = parseInt(m[2], 10)
      for (let i = Math.min(a, b); i <= Math.max(a, b); i++) out.add(i)
    } else {
      const n = parseInt(part, 10)
      if (Number.isInteger(n) && n > 0) out.add(n)
    }
  }
  return [...out].sort((a, b) => a - b)
}

interface Props {
  store: AppStore
  open: boolean
  onClose: () => void
  tab: string
  setTab: (t: string) => void
  editEvent?: EventItem
  editCourse?: Course
  defaultDate: string
}

export function AddPage({ store, open, onClose, tab, setTab, editEvent, editCourse, defaultDate }: Props) {
  if (!open) return null
  return (
    <div className="addpage">
      <div className="addpage__head">
        <button className="addpage__close" onClick={onClose} aria-label="关闭">
          <X size={20} />
        </button>
        <div className="addpage__title">添加 / 编辑</div>
        <div style={{ width: 36 }} />
      </div>
      <div className="addpage__body">
        <Segmented
          value={tab}
          onChange={setTab}
          options={[
            { value: 'arrange', label: '安排' },
            { value: 'course', label: '课程' },
            { value: 'sleep', label: '睡眠' },
            { value: 'plan', label: '计划' },
          ]}
        />
        <div className="addpage__form">
          {tab === 'arrange' && <EventForm store={store} onClose={onClose} initial={editEvent} defaultDate={defaultDate} />}
          {tab === 'course' && <CourseForm store={store} onClose={onClose} initial={editCourse} />}
          {tab === 'sleep' && <SleepForm store={store} onClose={onClose} />}
          {tab === 'plan' && <PlanForm store={store} onClose={onClose} />}
        </div>
      </div>
    </div>
  )
}

function ColorSwatches({ value, onChange }: { value: string; onChange: (c: string) => void }) {
  return (
    <div className="colorswatches">
      {COLORS.map((c) => (
        <button
          key={c}
          type="button"
          className={'colorswatch' + (value === c ? ' is-active' : '')}
          style={{ background: c }}
          onClick={() => onChange(value === c ? '' : c)}
        />
      ))}
    </div>
  )
}

function EventForm({
  store,
  onClose,
  initial,
  defaultDate,
}: {
  store: AppStore
  onClose: () => void
  initial?: EventItem
  defaultDate: string
}) {
  const [title, setTitle] = useState(initial?.title ?? '')
  const [kind, setKind] = useState<EventKind>(initial?.kind ?? 'arrange')
  const [allDay, setAllDay] = useState(initial?.allDay ?? false)
  const [date, setDate] = useState(initial?.date ?? defaultDate)
  const [startTime, setStartTime] = useState(initial?.startTime ?? '20:00')
  const [endTime, setEndTime] = useState(initial?.endTime ?? '21:00')
  const [repeat, setRepeat] = useState<Repeat>(initial?.repeat ?? 'none')
  const [repeatEnd, setRepeatEnd] = useState(initial?.repeatEnd ?? '')
  const [weekdays, setWeekdays] = useState<number[]>(initial?.weekdays ?? [])
  const [priority, setPriority] = useState<0 | 1 | 2>(initial?.priority ?? 0)
  const [remind, setRemind] = useState(initial?.remind ?? 0)
  const [location, setLocation] = useState(initial?.location ?? '')
  const [color, setColor] = useState(initial?.color ?? '')
  const [note, setNote] = useState(initial?.note ?? '')

  const save = async () => {
    if (!title.trim()) return alert('请填写标题')
    if (!allDay && toMinutes(endTime) <= toMinutes(startTime)) return alert('结束时间需晚于开始时间')
    try {
      await store.saveEvent({
        id: initial?.id,
        title: title.trim(),
        kind,
        date,
        startTime: allDay ? '00:00' : startTime,
        endTime: allDay ? '23:59' : endTime,
        allDay,
        repeat,
        repeatEnd: repeat === 'none' ? undefined : repeatEnd || undefined,
        weekdays: repeat === 'weekly' ? weekdays : undefined,
        priority,
        remind: remind || undefined,
        location: location.trim() || undefined,
        color: color || undefined,
        note: note.trim() || undefined,
      })
      onClose()
    } catch (e: any) {
      alert('保存失败：' + (e?.message || '未知错误'))
    }
  }

  return (
    <>
      <Input label="标题" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="做什么" />
      <label className="field">
        <span className="field__label">类型</span>
        <Segmented
          value={kind}
          onChange={(v) => setKind(v as EventKind)}
          options={[
            { value: 'arrange', label: '安排' },
            { value: 'deadline', label: '待办' },
            { value: 'memorial', label: '纪念日' },
            { value: 'plan', label: '计划' },
          ]}
        />
      </label>
      <div className="toggle-row">
        <span>全天事件</span>
        <Toggle checked={allDay} onChange={setAllDay} />
      </div>
      <div className="form-grid">
        <Input label="日期" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        <label className="field">
          <span className="field__label">重复</span>
          <select className="input" value={repeat} onChange={(e) => setRepeat(e.target.value as Repeat)}>
            <option value="none">不重复</option>
            <option value="daily">每天</option>
            <option value="weekly">每周</option>
            <option value="monthly">每月</option>
          </select>
        </label>
      </div>
      {!allDay && (
        <div className="form-grid">
          <Input label="开始时间" type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
          <Input label="结束时间" type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
        </div>
      )}
      {repeat !== 'none' && (
        <Input label="重复截止日期(可选)" type="date" value={repeatEnd} onChange={(e) => setRepeatEnd(e.target.value)} />
      )}
      {repeat === 'weekly' && (
        <label className="field">
          <span className="field__label">每周哪几天（可多选）</span>
          <div className="weekday-picker">
            {['一', '二', '三', '四', '五', '六', '日'].map((w, i) => {
              const d = i + 1
              const on = weekdays.includes(d)
              return (
                <button
                  key={d}
                  type="button"
                  className={'weekday-pick' + (on ? ' is-on' : '')}
                  onClick={() => setWeekdays((ws) => (ws.includes(d) ? ws.filter((x) => x !== d) : [...ws, d].sort()))}
                >
                  {w}
                </button>
              )
            })}
          </div>
        </label>
      )}
      <label className="field">
        <span className="field__label">重要程度</span>
        <Segmented
          value={String(priority)}
          onChange={(v) => setPriority(Number(v) as 0 | 1 | 2)}
          options={[
            { value: '0', label: '普通' },
            { value: '1', label: '重要' },
            { value: '2', label: '紧急' },
          ]}
        />
      </label>
      <div className="form-grid">
        <Input label="地点(可选)" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="地点" />
        <label className="field">
          <span className="field__label">提醒</span>
          <select className="input" value={remind} onChange={(e) => setRemind(Number(e.target.value))}>
            <option value={0}>不提醒</option>
            <option value={5}>提前 5 分钟</option>
            <option value={15}>提前 15 分钟</option>
            <option value={30}>提前 30 分钟</option>
            <option value={60}>提前 1 小时</option>
            <option value={1440}>提前 1 天</option>
          </select>
        </label>
      </div>
      <label className="field">
        <span className="field__label">颜色</span>
        <ColorSwatches value={color} onChange={setColor} />
      </label>
      <Input label="备注(可选)" value={note} onChange={(e) => setNote(e.target.value)} placeholder="备注" />
      <div className="form-actions">
        {initial?.id != null && (
          <Button variant="danger" onClick={async () => { await store.deleteEvent(initial.id!); onClose() }}>
            删除
          </Button>
        )}
        <Button onClick={save}>保存</Button>
      </div>
    </>
  )
}

function CourseForm({ store, onClose, initial }: { store: AppStore; onClose: () => void; initial?: Course }) {
  const [name, setName] = useState(initial?.name ?? '')
  const [teacher, setTeacher] = useState(initial?.teacher ?? '')
  const [location, setLocation] = useState(initial?.location ?? '')
  const [weekday, setWeekday] = useState(String(initial?.weekday ?? 1))
  const [startTime, setStartTime] = useState(initial?.startTime ?? '08:00')
  const [endTime, setEndTime] = useState(initial?.endTime ?? '09:40')
  const [weekRule, setWeekRule] = useState<WeekRule>(initial?.weekRule ?? 'every')
  const [customWeeks, setCustomWeeks] = useState((initial?.customWeeks ?? []).join(','))
  const [specialDates, setSpecialDates] = useState((initial?.specialDates ?? []).join(', '))
  const [skipDates, setSkipDates] = useState((initial?.skipDates ?? []).join(', '))
  const [color, setColor] = useState(initial?.color ?? '')
  const [extraPeriods, setExtraPeriods] = useState<CoursePeriod[]>(initial?.extraPeriods ?? [])

  const save = async () => {
    if (!name.trim()) return alert('请填写课程名')
    if (toMinutes(endTime) <= toMinutes(startTime)) return alert('结束时间需晚于开始时间')
    const weeks = parseWeeks(customWeeks)
    if (weekRule === 'custom' && weeks.length === 0) return alert('指定周次请填写周数，例如 1,3,5')
    await store.saveCourse({
      id: initial?.id,
      name: name.trim(),
      teacher: teacher.trim(),
      location: location.trim(),
      weekday: Number(weekday),
      startTime,
      endTime,
      weekRule,
      customWeeks: weeks,
      specialDates: parseDates(specialDates),
      skipDates: parseDates(skipDates),
      color: color || undefined,
      extraPeriods: extraPeriods.length ? extraPeriods : undefined,
    })
    onClose()
  }

  const addExtra = () => setExtraPeriods([...extraPeriods, { weekday: 1, startTime: '08:00', endTime: '09:40' }])
  const updateExtra = (i: number, patch: Partial<CoursePeriod>) =>
    setExtraPeriods(extraPeriods.map((p, idx) => (idx === i ? { ...p, ...patch } : p)))
  const removeExtra = (i: number) => setExtraPeriods(extraPeriods.filter((_, idx) => idx !== i))

  return (
    <>
      <Input label="课程名" value={name} onChange={(e) => setName(e.target.value)} placeholder="例如：高等数学" />
      <div className="form-grid">
        <Input label="老师(可选)" value={teacher} onChange={(e) => setTeacher(e.target.value)} placeholder="老师" />
        <Input label="地点(可选)" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="教室" />
      </div>
      <label className="field">
        <span className="field__label">星期</span>
        <Segmented
          value={weekday}
          onChange={setWeekday}
          options={['一', '二', '三', '四', '五', '六', '日'].map((w, i) => ({ value: String(i + 1), label: w }))}
        />
      </label>
      <div className="form-grid">
        <Input label="开始时间" type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
        <Input label="结束时间" type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
      </div>
      <label className="field">
        <span className="field__label">周次规则</span>
        <Segmented
          value={weekRule}
          onChange={(v) => setWeekRule(v as WeekRule)}
          options={[
            { value: 'every', label: '每周' },
            { value: 'odd', label: '单周' },
            { value: 'even', label: '双周' },
            { value: 'custom', label: '指定周' },
          ]}
        />
      </label>
      {weekRule === 'custom' && (
        <Input label="指定周次" value={customWeeks} onChange={(e) => setCustomWeeks(e.target.value)} placeholder="支持范围，如 2-15 或 2-4,8-16" />
      )}

      <div className="extra-head">
        <span className="field__label">一周多个时间段</span>
        <Button variant="ghost" onClick={addExtra} type="button">
          + 添加时间段
        </Button>
      </div>
      {extraPeriods.map((p, i) => (
        <div key={i} className="extra-row">
          <select className="input extra-row__wd" value={p.weekday} onChange={(e) => updateExtra(i, { weekday: Number(e.target.value) })}>
            {['一', '二', '三', '四', '五', '六', '日'].map((w, idx) => (
              <option key={idx} value={idx + 1}>
                周{w}
              </option>
            ))}
          </select>
          <input className="input extra-row__time" type="time" value={p.startTime} onChange={(e) => updateExtra(i, { startTime: e.target.value })} />
          <input className="input extra-row__time" type="time" value={p.endTime} onChange={(e) => updateExtra(i, { endTime: e.target.value })} />
          <Button variant="icon" onClick={() => removeExtra(i)} type="button" aria-label="删除时间段">
            <X size={16} />
          </Button>
        </div>
      ))}

      <Input label="指定日期上课(可选)" value={specialDates} onChange={(e) => setSpecialDates(e.target.value)} placeholder="2025-09-10, 2025-10-01" />
      <Input label="指定日期不上课(可选)" value={skipDates} onChange={(e) => setSkipDates(e.target.value)} placeholder="2025-09-30, 2025-10-02" />
      <label className="field">
        <span className="field__label">颜色</span>
        <ColorSwatches value={color} onChange={setColor} />
      </label>

      <div className="form-actions">
        {initial?.id != null && (
          <Button variant="danger" onClick={async () => { await store.deleteCourse(initial.id!); onClose() }}>
            删除
          </Button>
        )}
        <Button onClick={save}>保存</Button>
      </div>
    </>
  )
}

function SleepForm({ store, onClose }: { store: AppStore; onClose: () => void }) {
  const [bed, setBed] = useState(store.sleep?.bedTime ?? '23:30')
  const [wake, setWake] = useState(store.sleep?.wakeTime ?? '07:00')
  const save = async () => {
    await store.saveSleep({ id: 1, bedTime: bed, wakeTime: wake, overrides: store.sleep?.overrides ?? {} })
    onClose()
  }
  return (
    <>
      <div className="form-grid">
        <Input label="就寝时间" type="time" value={bed} onChange={(e) => setBed(e.target.value)} />
        <Input label="起床时间" type="time" value={wake} onChange={(e) => setWake(e.target.value)} />
      </div>
      <div className="hint">睡眠跨天：就寝到当天 24:00，以及 0:00 到次日起床。</div>
      <div className="form-actions">
        <Button onClick={save}>保存</Button>
      </div>
    </>
  )
}

function PlanForm({ store, onClose }: { store: AppStore; onClose: () => void }) {
  const [step, setStep] = useState<1 | 2>(1)
  const [title, setTitle] = useState('')
  const [freq, setFreq] = useState(3)
  const [duration, setDuration] = useState(30)
  const [saved, setSaved] = useState<Plan | undefined>(undefined)
  const [recs, setRecs] = useState<RecommendSlot[]>([])
  const [selected, setSelected] = useState<Record<string, boolean>>({})

  const makePlan = async () => {
    if (!title.trim()) return alert('请填写计划名称')
    if (freq < 1) return alert('每周次数至少 1 次')
    if (duration < 5) return alert('每次时长至少 5 分钟')
    const plan: Plan = { title: title.trim(), freq, duration }
    const id = await store.savePlan(plan)
    const p = { ...plan, id }
    setSaved(p)
    setRecs(recommendSlots(store.semester, store.courses, store.sleep, store.events, p).slice(0, Math.max(freq + 2, 4)))
    setStep(2)
  }

  const toggle = (key: string) => setSelected((s) => ({ ...s, [key]: !s[key] }))

  const confirm = async () => {
    if (!saved) return
    const chosen = recs.filter((r) => selected[r.date + ' ' + r.start])
    for (const r of chosen) {
      await store.saveEvent({
        title: saved.title,
        kind: 'plan',
        date: r.date,
        startTime: toHHMM(r.start),
        endTime: toHHMM(r.end),
        repeat: 'none',
        color: saved.color,
        planId: saved.id,
      })
    }
    onClose()
  }

  if (step === 1) {
    return (
      <>
        <Input label="计划名称" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="例如：每周跑步三次" />
        <div className="form-grid">
          <Input label="每周次数" type="number" min={1} value={freq} onChange={(e) => setFreq(Number(e.target.value))} />
          <Input label="每次时长(分钟)" type="number" min={5} value={duration} onChange={(e) => setDuration(Number(e.target.value))} />
        </div>
        <div className="hint">「计划」会自动结合你的课表和睡眠，寻找空闲时段。</div>
        <div className="form-actions">
          <Button variant="ghost" onClick={onClose}>
            取消
          </Button>
          <Button onClick={makePlan}>下一步</Button>
        </div>
      </>
    )
  }

  return (
    <>
      <div className="hint">
        为「{saved?.title}」找到以下空闲时段，勾选想安排的时间（建议 {freq} 次）：
      </div>
      {recs.length === 0 && <div className="hint">未来 7 天没有足够长的空闲时段，请调整课表或降低时长。</div>}
      <div className="list">
        {recs.map((r) => {
          const key = r.date + ' ' + r.start
          const on = !!selected[key]
          return (
            <div key={key} className="list-item" onClick={() => toggle(key)} style={{ cursor: 'pointer' }}>
              <span className={'pick' + (on ? ' is-on' : '')}>{on ? '✓' : ''}</span>
              <div className="list-item__body">
                <div className="list-item__title">{dateLabelCN(parseDate(r.date))}</div>
                <div className="list-item__sub">
                  {toHHMM(r.start)} – {toHHMM(r.end)}
                </div>
              </div>
            </div>
          )
        })}
      </div>
      <div className="form-actions">
        <Button variant="ghost" onClick={() => setStep(1)}>
          上一步
        </Button>
        <Button onClick={confirm}>确认安排</Button>
      </div>
    </>
  )
}
