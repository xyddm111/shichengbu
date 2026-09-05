import { useEffect, useMemo, useRef, useState } from 'react'
import { BottomNav, type TabKey } from './components/BottomNav'
import { Loader } from './components/Loader'
import { Toast, useToast } from './components/Toast'
import { Segmented } from './components/Segmented'
import { useAppData, type AppStore } from './lib/store'
import { useCloudData } from './lib/cloudStore'
import { blocksForDay, eventOccursOn, type Block } from './lib/schedule'
import { parseDate, todayStr, toMinutes } from './lib/time'
import { TodayView } from './views/TodayView'
import { WeekView } from './views/WeekView'
import { MonthView } from './views/MonthView'
import { StatsView } from './views/StatsView'
import { PlansView } from './views/PlansView'
import { ProfileView } from './views/ProfileView'
import { AddPage } from './editor/AddPage'
import { AuthView } from './views/AuthView'
import { cloudCurrentUser, cloudLogout, isCloudConfigured } from './lib/cloud'
import type { Course, EventItem } from './types'

type HomeView = 'today' | 'week' | 'month'

function loadHomeView(): HomeView {
  try {
    const v = localStorage.getItem('shichengbu-homeview')
    if (v === 'week' || v === 'month') return v
  } catch {
    /* ignore */
  }
  return 'today'
}

export default function App() {
  const [authUser, setAuthUser] = useState<{ uid: string; username: string } | null>(null)
  const [authOpen, setAuthOpen] = useState(false)
  const localStore = useAppData()
  const cloudStore = useCloudData(!!authUser)
  const store: AppStore = authUser ? cloudStore : localStore
  const { toast, show } = useToast()
  const [tab, setTab] = useState<TabKey>('home')
  const [homeView, setHomeView] = useState<HomeView>(loadHomeView)
  const [selectedDate, setSelectedDate] = useState(todayStr())
  const [addOpen, setAddOpen] = useState(false)
  const [addTab, setAddTab] = useState('arrange')
  const [editEvent, setEditEvent] = useState<EventItem | undefined>(undefined)
  const [editCourse, setEditCourse] = useState<Course | undefined>(undefined)
  const notifiedRef = useRef<Set<string>>(new Set())

  useEffect(() => {
    if (!isCloudConfigured()) return
    cloudCurrentUser()
      .then((u) => {
        if (u) setAuthUser(u)
      })
      .catch(() => {})
  }, [])

  const blocks = useMemo(
    () => blocksForDay(store.semester, store.courses, store.sleep, store.events, parseDate(selectedDate)),
    [store.semester, store.courses, store.sleep, store.events, selectedDate]
  )

  const setHomeViewPersist = (v: HomeView) => {
    setHomeView(v)
    try {
      localStorage.setItem('shichengbu-homeview', v)
    } catch {
      /* ignore */
    }
  }

  const openAdd = (t: string) => {
    setEditEvent(undefined)
    setEditCourse(undefined)
    setAddTab(t)
    setAddOpen(true)
  }
  const openEditEvent = (e: EventItem) => {
    setEditEvent(e)
    setEditCourse(undefined)
    setAddTab('arrange')
    setAddOpen(true)
  }
  const openEditCourse = (c: Course) => {
    setEditCourse(c)
    setEditEvent(undefined)
    setAddTab('course')
    setAddOpen(true)
  }

  const handleBlockClick = (b: Block) => {
    if (b.eventId != null) {
      const ev = store.events.find((e) => e.id === b.eventId)
      if (ev) openEditEvent(ev)
    } else if (b.courseId != null) {
      const c = store.courses.find((x) => x.id === b.courseId)
      if (c) openEditCourse(c)
    }
  }

  // 提醒检查（应用打开期间，事项开始前弹提示）
  useEffect(() => {
    if (store.loading) return
    const check = () => {
      const today = todayStr()
      const now = new Date()
      const nowMin = now.getHours() * 60 + now.getMinutes()
      for (const ev of store.events) {
        if (ev.allDay || !ev.remind) continue
        if (!eventOccursOn(ev, parseDate(today))) continue
        const trigger = toMinutes(ev.startTime) - ev.remind
        if (trigger === nowMin) {
          const key = ev.id + '-' + today + '-' + trigger
          if (notifiedRef.current.has(key)) continue
          notifiedRef.current.add(key)
          show(`提醒：${ev.startTime} ${ev.title}`)
          if ('Notification' in window && Notification.permission === 'granted') {
            try {
              new Notification('时程簿提醒', { body: `${ev.startTime} ${ev.title}` })
            } catch {
              /* ignore */
            }
          }
        }
      }
    }
    check()
    const t = setInterval(check, 20000)
    return () => clearInterval(t)
  }, [store.loading, store.events, show])

  return (
    <div className="app">
      <div className="app__body">
        {store.loading ? (
          <Loader label="加载中…" />
        ) : (
          <>
            {tab === 'home' && (
              <div className="view">
                <Segmented
                  value={homeView}
                  onChange={(v) => setHomeViewPersist(v as HomeView)}
                  options={[
                    { value: 'today', label: '今天' },
                    { value: 'week', label: '周' },
                    { value: 'month', label: '月' },
                  ]}
                />
                {homeView === 'today' && (
                  <TodayView
                    store={store}
                    dateStr={selectedDate}
                    onChangeDate={setSelectedDate}
                    blocks={blocks}
                    onBlockClick={handleBlockClick}
                    onEventClick={openEditEvent}
                  />
                )}
                {homeView === 'week' && (
                  <WeekView
                    store={store}
                    onPickDate={(d) => {
                      setSelectedDate(d)
                      setHomeViewPersist('today')
                    }}
                  />
                )}
                {homeView === 'month' && (
                  <MonthView
                    store={store}
                    onPickDate={(d) => {
                      setSelectedDate(d)
                      setHomeViewPersist('today')
                    }}
                  />
                )}
              </div>
            )}
            {tab === 'plans' && <PlansView store={store} onNewPlan={() => openAdd('plan')} />}
            {tab === 'stats' && <StatsView store={store} />}
            {tab === 'me' && (
              <ProfileView
                store={store}
                onAddCourse={() => openAdd('course')}
                onEditCourse={openEditCourse}
                authUser={authUser}
                onOpenAuth={() => setAuthOpen(true)}
                onLogout={async () => {
                  await cloudLogout()
                  setAuthUser(null)
                }}
              />
            )}
          </>
        )}
      </div>
      <BottomNav tab={tab} onChange={setTab} onAdd={() => openAdd('arrange')} />
      {addOpen && (
        <AddPage
          store={store}
          open={addOpen}
          onClose={() => setAddOpen(false)}
          tab={addTab}
          setTab={setAddTab}
          editEvent={editEvent}
          editCourse={editCourse}
          defaultDate={selectedDate}
        />
      )}
      {authOpen && (
        <AuthView
          open={authOpen}
          onClose={() => setAuthOpen(false)}
          onLoggedIn={(u) => {
            setAuthUser(u)
            setAuthOpen(false)
          }}
        />
      )}
      <Toast toast={toast} />
    </div>
  )
}
