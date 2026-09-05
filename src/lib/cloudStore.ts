import { useCallback, useEffect, useState } from 'react'
import { cloudAdd, cloudGetAll, cloudRemove, cloudUpdate, cloudWhere } from './cloud'
import type { Course, EventItem, Plan, Semester, Sleep } from '../types'

let seq = 0
function genId(): number {
  seq = (seq + 1) % 1000
  return Date.now() * 1000 + seq
}

const C = {
  semester: 'semester',
  courses: 'courses',
  sleep: 'sleep',
  events: 'events',
  plans: 'plans',
}

async function upsertSingleton(coll: string, data: any): Promise<void> {
  const rows = await cloudGetAll<any>(coll)
  if (rows[0] && rows[0]._id) await cloudUpdate(coll, rows[0]._id, data)
  else await cloudAdd(coll, data)
}

// 保存一条记录并返回其 id（编辑时沿用原 id，新增时生成新 id）
async function saveById(coll: string, id: number | undefined, data: any): Promise<number> {
  const rid = id ?? genId()
  const payload = { ...data, id: rid }
  if (id != null) {
    const rows = await cloudWhere<any>(coll, { id })
    if (rows[0] && rows[0]._id) await cloudUpdate(coll, rows[0]._id, payload)
    else await cloudAdd(coll, payload)
  } else {
    await cloudAdd(coll, payload)
  }
  return rid
}

async function removeById(coll: string, id: number): Promise<void> {
  const rows = await cloudWhere<any>(coll, { id })
  for (const r of rows) {
    if (r._id) await cloudRemove(coll, r._id)
  }
}

export interface CloudData {
  semester: Semester | undefined
  courses: Course[]
  sleep: Sleep | undefined
  events: EventItem[]
  plans: Plan[]
}

const EMPTY: CloudData = { semester: undefined, courses: [], sleep: undefined, events: [], plans: [] }

export function useCloudData(authed: boolean) {
  const [data, setData] = useState<CloudData>(EMPTY)
  const [loading, setLoading] = useState(true)

  const reload = useCallback(async () => {
    if (!authed) {
      setLoading(false)
      return
    }
    try {
      const [semester, courses, sleep, events, plans] = await Promise.all([
        cloudGetAll<any>(C.semester),
        cloudGetAll<Course>(C.courses),
        cloudGetAll<any>(C.sleep),
        cloudGetAll<EventItem>(C.events),
        cloudGetAll<Plan>(C.plans),
      ])
      setData({
        semester: semester[0] as Semester | undefined,
        courses: courses as Course[],
        sleep: sleep[0] as Sleep | undefined,
        events: events as EventItem[],
        plans: plans as Plan[],
      })
    } catch (e) {
      console.error('云端数据加载失败', e)
    } finally {
      setLoading(false)
    }
  }, [authed])

  useEffect(() => {
    reload()
  }, [reload])

  const saveSemester = useCallback(
    async (s: Semester) => {
      await upsertSingleton(C.semester, s)
      await reload()
    },
    [reload]
  )
  const saveSleep = useCallback(
    async (s: Sleep) => {
      await upsertSingleton(C.sleep, s)
      await reload()
    },
    [reload]
  )
  const saveCourse = useCallback(
    async (c: Course) => {
      await saveById(C.courses, c.id, c)
      await reload()
    },
    [reload]
  )
  const deleteCourse = useCallback(
    async (id: number) => {
      await removeById(C.courses, id)
      await reload()
    },
    [reload]
  )
  const saveEvent = useCallback(
    async (e: EventItem) => {
      await saveById(C.events, e.id, e)
      await reload()
    },
    [reload]
  )
  const deleteEvent = useCallback(
    async (id: number) => {
      await removeById(C.events, id)
      await reload()
    },
    [reload]
  )
  const savePlan = useCallback(
    async (p: Plan): Promise<number> => {
      const id = await saveById(C.plans, p.id, p)
      await reload()
      return id
    },
    [reload]
  )
  const deletePlan = useCallback(
    async (id: number) => {
      await removeById(C.plans, id)
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
