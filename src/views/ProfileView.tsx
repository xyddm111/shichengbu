import { useRef, useState } from 'react'
import { Bell, BookOpen, Download, Info, Pencil, Trash2, Upload, UserRound } from 'lucide-react'
import type { AppStore } from '../lib/store'
import { db } from '../lib/db'
import { applyAccent, applyFreeColor, ACCENT_PRESETS, FREE_PRESETS } from '../lib/theme'
import { getSavedCity, saveCity } from '../lib/weather'
import { todayStr, weekdayCN } from '../lib/time'
import type { Course } from '../types'
import { Button } from '../components/Button'
import { Input } from '../components/Input'
import { Card } from '../components/Card'

const WEEK_RULE_LABEL: Record<string, string> = {
  every: '每周',
  odd: '单周',
  even: '双周',
  custom: '指定周',
}

interface Props {
  store: AppStore
  onAddCourse: () => void
  onEditCourse: (c: Course) => void
  authUser: { uid: string; username: string } | null
  onOpenAuth: () => void
  onLogout: () => void
}

export function ProfileView({ store, onAddCourse, onEditCourse, authUser, onOpenAuth, onLogout }: Props) {
  const [semName, setSemName] = useState(store.semester?.name ?? '')
  const [semStart, setSemStart] = useState(store.semester?.startDate ?? '')
  const [semEnd, setSemEnd] = useState(store.semester?.endDate ?? '')
  const [bed, setBed] = useState(store.sleep?.bedTime ?? '23:30')
  const [wake, setWake] = useState(store.sleep?.wakeTime ?? '07:00')
  const [accent, setAccent] = useState(() => {
    try {
      return localStorage.getItem('shichengbu-accent') || '#2E7D6B'
    } catch {
      return '#2E7D6B'
    }
  })
  const [freeColor, setFreeColor] = useState(() => {
    try {
      return localStorage.getItem('shichengbu-free') || '#ECEAE4'
    } catch {
      return '#ECEAE4'
    }
  })
  const [egg, setEgg] = useState(false)
  const [weatherCity, setWeatherCity] = useState(() => getSavedCity())
  const fileRef = useRef<HTMLInputElement>(null)

  const saveSemester = async () => {
    if (!semStart || !semEnd) return alert('请选择学期开始和结束日期')
    await store.saveSemester({ name: semName.trim() || '本学期', startDate: semStart, endDate: semEnd })
    alert('学期已保存')
  }
  const saveSleep = async () => {
    await store.saveSleep({ id: 1, bedTime: bed, wakeTime: wake, overrides: store.sleep?.overrides ?? {} })
    alert('作息已保存')
  }
  const pickAccent = (c: string) => {
    setAccent(c)
    applyAccent(c)
  }
  const pickFreeColor = (c: string) => {
    setFreeColor(c)
    applyFreeColor(c)
  }
  const saveWeatherCity = () => {
    saveCity(weatherCity)
    alert('天气城市已保存，回到首页查看天气')
  }
  const enableNotify = async () => {
    if (!('Notification' in window)) return alert('当前浏览器不支持通知')
    const perm = await Notification.requestPermission()
    alert(perm === 'granted' ? '已开启通知权限' : '未开启通知权限')
  }

  const doExport = () => {
    const payload = {
      version: 2,
      exportedAt: new Date().toISOString(),
      semester: store.semester,
      courses: store.courses,
      sleep: store.sleep,
      events: store.events,
      plans: store.plans,
    }
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `时程簿备份-${todayStr()}.json`
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  }

  const doImport = async (file: File) => {
    try {
      const text = await file.text()
      const data = JSON.parse(text)
      await db.transaction('rw', db.semester, db.courses, db.sleep, db.events, db.plans, async () => {
        await db.semester.clear()
        await db.courses.clear()
        await db.sleep.clear()
        await db.events.clear()
        await db.plans.clear()
        if (data.semester) await db.semester.put({ ...data.semester, id: 1 })
        if (data.sleep) await db.sleep.put({ ...data.sleep, id: 1 })
        for (const c of data.courses || []) {
          const { id: _id, ...rest } = c
          await db.courses.add(rest)
        }
        for (const e of data.events || []) {
          const { id: _id, ...rest } = e
          await db.events.add(rest)
        }
        for (const p of data.plans || []) {
          const { id: _id, ...rest } = p
          await db.plans.add(rest)
        }
      })
      await store.reload()
      alert('导入成功')
    } catch {
      alert('导入失败：文件格式不正确')
    }
  }

  return (
    <div className="view">
      <h2 className="topbar__date">我的</h2>

      <Card className="account-card">
        <div className="account-avatar">
          <UserRound size={26} />
        </div>
        <div className="account-body">
          <div className="account-name">{authUser ? authUser.username : '未登录'}</div>
          <div className="account-sub">{authUser ? '已登录 · 数据已云端同步' : '本地模式 · 登录后可与朋友共享'}</div>
        </div>
        {authUser ? (
          <Button variant="ghost" onClick={onLogout}>
            退出
          </Button>
        ) : (
          <Button variant="ghost" onClick={onOpenAuth}>
            登录
          </Button>
        )}
      </Card>

      <Card>
        <div className="setting-row">
          <div>
            <div className="setting-row__label">提醒通知</div>
            <div className="setting-row__sub">开启后，事项开始前会弹出提醒</div>
          </div>
          <Button variant="ghost" onClick={enableNotify}>
            <Bell size={16} /> 开启
          </Button>
        </div>
      </Card>

      <Card>
        <div className="setting-row">
          <span className="setting-row__label">学期</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <Input label="学期名称" value={semName} onChange={(e) => setSemName(e.target.value)} placeholder="例如：2025 秋季学期" />
          <div className="form-grid">
            <Input label="开始日期(周一)" type="date" value={semStart} onChange={(e) => setSemStart(e.target.value)} />
            <Input label="结束日期" type="date" value={semEnd} onChange={(e) => setSemEnd(e.target.value)} />
          </div>
          <div className="hint">开始日期请填学期第一周的周一，用于计算单双周。</div>
          <Button onClick={saveSemester}>保存学期</Button>
        </div>
      </Card>

      <Card>
        <div className="setting-row">
          <span className="setting-row__label">睡眠作息</span>
        </div>
        <div className="form-grid">
          <Input label="就寝时间" type="time" value={bed} onChange={(e) => setBed(e.target.value)} />
          <Input label="起床时间" type="time" value={wake} onChange={(e) => setWake(e.target.value)} />
        </div>
        <div style={{ height: 10 }} />
        <Button onClick={saveSleep}>保存作息</Button>
      </Card>

      <Card>
        <div className="setting-row">
          <span className="setting-row__label">主题色</span>
          <input type="color" className="color-input" value={accent} onChange={(e) => pickAccent(e.target.value)} />
        </div>
        <div className="swatches">
          {ACCENT_PRESETS.map((c) => (
            <button key={c} className={'swatch' + (accent === c ? ' is-active' : '')} style={{ background: c }} onClick={() => pickAccent(c)} />
          ))}
        </div>
        <div className="hint" style={{ marginTop: 8 }}>
          深色模式自动跟随系统。
        </div>
      </Card>

      <Card>
        <div className="setting-row">
          <span className="setting-row__label">空闲颜色</span>
          <input type="color" className="color-input" value={freeColor} onChange={(e) => pickFreeColor(e.target.value)} />
        </div>
        <div className="swatches">
          {FREE_PRESETS.map((c) => (
            <button key={c} className={'swatch' + (freeColor === c ? ' is-active' : '')} style={{ background: c }} onClick={() => pickFreeColor(c)} />
          ))}
        </div>
        <div className="hint" style={{ marginTop: 8 }}>
          时间轴里「空闲」模块的颜色。
        </div>
      </Card>

      <Card>
        <div className="setting-row">
          <span className="setting-row__label">天气城市</span>
        </div>
        <Input label="城市（可选，如 上海）" value={weatherCity} onChange={(e) => setWeatherCity(e.target.value)} placeholder="留空则用定位" />
        <div style={{ height: 8 }} />
        <Button onClick={saveWeatherCity}>保存城市</Button>
        <div className="hint" style={{ marginTop: 6 }}>
          填了城市则优先用它查天气（不依赖定位）；留空则用定位。
        </div>
      </Card>

      <Card>
        <div className="setting-row" style={{ justifyContent: 'space-between' }}>
          <div>
            <div className="setting-row__label">课程</div>
            <div className="setting-row__sub">{store.courses.length} 门课</div>
          </div>
          <Button variant="ghost" onClick={onAddCourse}>
            <BookOpen size={16} /> 添加课程
          </Button>
        </div>
        <div className="list">
          {store.courses.length === 0 && <div className="hint">还没有课程，点「添加课程」或首页「+」添加。</div>}
          {store.courses.map((c) => (
            <div key={c.id} className="list-item">
              <div className="list-item__body">
                <div className="list-item__title">{c.name}</div>
                <div className="list-item__sub">
                  {weekdayCN(c.weekday)} {c.startTime}-{c.endTime} · {WEEK_RULE_LABEL[c.weekRule] || c.weekRule}
                </div>
              </div>
              <Button variant="icon" onClick={() => onEditCourse(c)} aria-label="编辑">
                <Pencil size={16} />
              </Button>
              <Button variant="icon" onClick={async () => store.deleteCourse(c.id!)} aria-label="删除">
                <Trash2 size={16} />
              </Button>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <div className="setting-row">
          <span className="setting-row__label">数据</span>
        </div>
        <div className="hint" style={{ marginBottom: 10 }}>
          数据保存在本机浏览器，建议定期导出备份；换手机时可导入恢复。
        </div>
        <div className="form-actions">
          <Button variant="ghost" onClick={doExport}>
            <Download size={16} /> 导出
          </Button>
          <Button variant="ghost" onClick={() => fileRef.current?.click()}>
            <Upload size={16} /> 导入
          </Button>
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="application/json"
          style={{ display: 'none' }}
          onChange={(e) => {
            const f = e.target.files?.[0]
            if (f) doImport(f)
            e.target.value = ''
          }}
        />
      </Card>

      <Card>
        <div className="setting-row">
          <div>
            <div className="setting-row__label">关于时程簿</div>
            <div className="setting-row__sub">v0.2 · 极简工具感 · 本地存储</div>
          </div>
          <Button variant="icon" onClick={() => setEgg(!egg)} aria-label="彩蛋">
            <Info size={16} />
          </Button>
        </div>
        {egg && <div className="egg">椰宝喵喵喵 (=^･ω･^=)</div>}
      </Card>
    </div>
  )
}
