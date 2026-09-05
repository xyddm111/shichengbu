import { CalendarCheck, Plus, Trash2 } from 'lucide-react'
import type { AppStore } from '../lib/store'
import { Button } from '../components/Button'
import { Card } from '../components/Card'

export function PlansView({ store, onNewPlan }: { store: AppStore; onNewPlan: () => void }) {
  const thisWeek = store.events.filter((e) => e.kind === 'plan' && e.planId != null)

  return (
    <div className="view">
      <div className="topbar">
        <div className="topbar__date">计划</div>
        <Button variant="ghost" onClick={onNewPlan}>
          <Plus size={16} /> 新建计划
        </Button>
      </div>

      {store.plans.length === 0 && (
        <div className="empty">
          <CalendarCheck size={40} className="empty__icon" />
          <div className="empty__title">还没有计划</div>
          <div className="empty__hint">创建计划后，会自动结合课表和睡眠为你推荐空闲时段</div>
          <Button onClick={onNewPlan} style={{ marginTop: 12 }}>
            新建计划
          </Button>
        </div>
      )}

      <div className="list">
        {store.plans.map((p) => {
          const done = thisWeek.filter((e) => e.planId === p.id).length
          return (
            <Card key={p.id}>
              <div className="list-item" style={{ padding: 0, border: 'none', background: 'none' }}>
                <div className="list-item__body">
                  <div className="list-item__title">{p.title}</div>
                  <div className="list-item__sub">
                    每周 {p.freq} 次 · 每次 {p.duration} 分钟 · 已安排 {done} 次
                  </div>
                </div>
                <Button variant="icon" onClick={async () => store.deletePlan(p.id!)} aria-label="删除">
                  <Trash2 size={16} />
                </Button>
              </div>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
