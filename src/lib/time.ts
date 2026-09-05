export function pad2(n: number): string {
  return n < 10 ? '0' + n : '' + n
}

export function toMinutes(t: string): number {
  const [h, m] = t.split(':').map(Number)
  return h * 60 + m
}

export function toHHMM(min: number): string {
  const m = ((min % 1440) + 1440) % 1440
  return pad2(Math.floor(m / 60)) + ':' + pad2(m % 60)
}

export function dateToStr(d: Date): string {
  return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate())
}

export function parseDate(s: string): Date {
  const [y, m, d] = s.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate())
}

export function addDays(d: Date, n: number): Date {
  const r = new Date(d)
  r.setDate(r.getDate() + n)
  return r
}

// 1 = 周一 ... 7 = 周日
export function weekdayOf(d: Date): number {
  const w = d.getDay()
  return w === 0 ? 7 : w
}

export function todayStr(): string {
  return dateToStr(new Date())
}

export function nowMinutes(): number {
  const n = new Date()
  return n.getHours() * 60 + n.getMinutes()
}

// 距目标日期还有几天（今天为 0，过去为负）
export function daysUntil(dateStr: string): number {
  const target = startOfDay(parseDate(dateStr))
  const now = startOfDay(new Date())
  return Math.round((target.getTime() - now.getTime()) / 86400000)
}

const WEEK_CN = ['一', '二', '三', '四', '五', '六', '日']

export function weekdayCN(n: number): string {
  return '周' + WEEK_CN[((n - 1) % 7 + 7) % 7]
}

export function dateLabelCN(d: Date): string {
  return (d.getMonth() + 1) + '月' + d.getDate() + '日 · ' + weekdayCN(weekdayOf(d))
}
