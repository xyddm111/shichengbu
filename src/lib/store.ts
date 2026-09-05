import { useCallback, useEffect, useState } from 'react'
import { db } from './db'
import type { Semester, Course, Sleep, EventItem, Plan } from '../types'

export interface AppData {
  semester: Semester | undefined
  courses: Course[]
  sleep: Sleep | undefined
  events: EventItem[]
  plans: Plan[]
}

const EMPTY: AppData = { semester: undefined, courses: [], sleep: undefined, events: [], plans: [] }

export function useAppData() {
  const [data, setData] = useState<AppData>(EMPTY)
  const [loading, setLoading] = useState(true)

  const reload = useCallback(async () => {
    const [semester, courses, sleep, events, plans] = await Promise.all([
      db.semester.get(1),
      db.courses.toArray(),
      db.sleep.get(1),
      db.events.toArray(),
      db.plans.toArray(),
    ])
    setData({ semester, courses, sleep, events, plans })
    setLoading(false)
  }, [])

  useEffect(() => {
    reload()
  }, [reload])

  const saveSemester = useCallback(
    async (s: Semester) => {
      await db.semester.put({ ...s, id: 1 })
      await reload()
    },
    [reload]
  )
  const saveSleep = useCallback(
    async (s: Sleep) => {
      await db.sleep.put({ ...s, id: 1 })
      await reload()
    },
    [reload]
  )
  const saveCourse = useCallback(
    async (c: Course) => {
      if (c.id != null) await db.courses.put(c)
      else await db.courses.add(c)
      await reload()
    },
    [reload]
  )
  const deleteCourse = useCallback(
    async (id: number) => {
      await db.courses.delete(id)
      await reload()
    },
    [reload]
  )
  const saveEvent = useCallback(
    async (e: EventItem) => {
      if (e.id != null) await db.events.put(e)
      else await db.events.add(e)
      await reload()
    },
    [reload]
  )
  const deleteEvent = useCallback(
    async (id: number) => {
      await db.events.delete(id)
      await reload()
    },
    [reload]
  )
  const savePlan = useCallback(
    async (p: Plan): Promise<number> => {
      let id: number
      if (p.id != null) {
        await db.plans.put(p)
        id = p.id
      } else {
        id = await db.plans.add(p)
      }
      await reload()
      return id
    },
    [reload]
  )
  const deletePlan = useCallback(
    async (id: number) => {
      await db.plans.delete(id)
      await reload()
    },
    [reload]
  )

  return {
    ...data,
    loading,
    reload,
    saveSemester,
    saveSleep,
    saveCourse,
    deleteCourse,
    saveEvent,
    deleteEvent,
    savePlan,
    deletePlan,
  }
}

export type AppStore = ReturnType<typeof useAppData>
