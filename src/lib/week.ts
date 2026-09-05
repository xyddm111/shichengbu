import type { Semester, Course, CoursePeriod } from '../types'
import { parseDate, startOfDay, weekdayOf, dateToStr } from './time'

// 计算某日期在学期中的周次（1 起）。学期开始日期须为周一。
export function weekNumber(semester: Semester, date: Date): number {
  const start = startOfDay(parseDate(semester.startDate))
  const cur = startOfDay(date)
  const diff = Math.floor((cur.getTime() - start.getTime()) / 86400000)
  return Math.floor(diff / 7) + 1
}

// 返回课程在某日期的具体时段（可能来自主时段或额外时段），不上课返回 null
export function coursePeriodOn(course: Course, semester: Semester, date: Date): CoursePeriod | null {
  const ds = dateToStr(date)
  if (course.skipDates?.includes(ds)) return null
  if (course.specialDates?.includes(ds)) {
    return { weekday: weekdayOf(date), startTime: course.startTime, endTime: course.endTime, location: course.location }
  }
  const week = weekNumber(semester, date)
  if (week < 1) return null
  let active = false
  switch (course.weekRule) {
    case 'every':
      active = true
      break
    case 'odd':
      active = week % 2 === 1
      break
    case 'even':
      active = week % 2 === 0
      break
    case 'custom':
      active = course.customWeeks.includes(week)
      break
  }
  if (!active) return null
  const wd = weekdayOf(date)
  if (wd === course.weekday) {
    return { weekday: wd, startTime: course.startTime, endTime: course.endTime, location: course.location }
  }
  return (course.extraPeriods || []).find((p) => p.weekday === wd) || null
}

export function courseOccursOn(course: Course, semester: Semester, date: Date): boolean {
  return coursePeriodOn(course, semester, date) !== null
}

export function weekLabel(week: number): string {
  if (week < 1) return '未开学'
  return '第' + week + '周 · ' + (week % 2 === 1 ? '单周' : '双周')
}
