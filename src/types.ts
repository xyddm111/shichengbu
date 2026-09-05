export type WeekRule = 'every' | 'odd' | 'even' | 'custom'
export type Repeat = 'none' | 'daily' | 'weekly' | 'monthly'
export type EventKind = 'arrange' | 'plan' | 'deadline' | 'memorial'

export interface Semester {
  id?: number
  name: string
  startDate: string // YYYY-MM-DD（学期第一周的周一）
  endDate: string
}

export interface CoursePeriod {
  weekday: number // 1..7
  startTime: string
  endTime: string
  location?: string
}

export interface Course {
  id?: number
  name: string
  teacher: string
  location: string
  weekday: number // 1..7 主时段星期
  startTime: string
  endTime: string
  weekRule: WeekRule
  customWeeks: number[]
  specialDates: string[] // 指定日期上课（覆盖周次规则）
  skipDates: string[] // 指定日期不上课
  color?: string
  extraPeriods?: CoursePeriod[] // 一周多时段
}

export interface SleepOverride {
  bed: string
  wake: string
}

export interface Sleep {
  id?: number
  bedTime: string
  wakeTime: string
  overrides?: Record<string, SleepOverride>
}

export interface EventItem {
  id?: number
  title: string
  kind: EventKind
  date: string // YYYY-MM-DD
  startTime: string // HH:mm（全天事件忽略）
  endTime: string
  allDay?: boolean
  repeat: Repeat
  repeatEnd?: string // 重复结束日期
  weekdays?: number[] // repeat='weekly' 时重复的星期几（1-7）
  priority?: 0 | 1 | 2 // 0 普通 1 重要 2 紧急
  remind?: number // 提前提醒分钟数，0/空 = 不提醒
  location?: string
  color?: string
  note?: string
  planId?: number
}

export interface Plan {
  id?: number
  title: string
  freq: number
  duration: number
  color?: string
  note?: string
}
