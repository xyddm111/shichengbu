import Dexie, { type Table } from 'dexie'
import type { Semester, Course, Sleep, EventItem, Plan } from '../types'

class AppDB extends Dexie {
  semester!: Table<Semester, number>
  courses!: Table<Course, number>
  sleep!: Table<Sleep, number>
  events!: Table<EventItem, number>
  plans!: Table<Plan, number>

  constructor() {
    super('shichengbu')
    this.version(1).stores({
      semester: 'id',
      courses: '++id',
      sleep: 'id',
      events: '++id, date, kind',
      plans: '++id',
    })
  }
}

export const db = new AppDB()
