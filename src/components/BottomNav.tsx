import { BarChart3, CalendarCheck, Home, Plus, User } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export type TabKey = 'home' | 'plans' | 'stats' | 'me'

interface Props {
  tab: TabKey
  onChange: (t: TabKey) => void
  onAdd: () => void
}

const ITEMS: { key: TabKey; label: string; Icon: LucideIcon }[] = [
  { key: 'home', label: '首页', Icon: Home },
  { key: 'plans', label: '计划', Icon: CalendarCheck },
  { key: 'stats', label: '统计', Icon: BarChart3 },
  { key: 'me', label: '我的', Icon: User },
]

export function BottomNav({ tab, onChange, onAdd }: Props) {
  return (
    <nav className="bottomnav">
      {ITEMS.slice(0, 2).map(({ key, label, Icon }) => (
        <button key={key} className={'bottomnav__item' + (tab === key ? ' is-active' : '')} onClick={() => onChange(key)}>
          <Icon size={21} strokeWidth={2} />
          <span>{label}</span>
        </button>
      ))}
      <button className="bottomnav__add" onClick={onAdd} aria-label="添加">
        <Plus size={26} strokeWidth={2.2} />
      </button>
      {ITEMS.slice(2).map(({ key, label, Icon }) => (
        <button key={key} className={'bottomnav__item' + (tab === key ? ' is-active' : '')} onClick={() => onChange(key)}>
          <Icon size={21} strokeWidth={2} />
          <span>{label}</span>
        </button>
      ))}
    </nav>
  )
}
