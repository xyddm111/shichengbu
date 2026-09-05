export function hexToRgba(hex: string, alpha: number): string {
  const h = hex.replace('#', '')
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h
  const r = parseInt(full.slice(0, 2), 16)
  const g = parseInt(full.slice(2, 4), 16)
  const b = parseInt(full.slice(4, 6), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

const KEY = 'shichengbu-accent'
const FREE_KEY = 'shichengbu-free'

export function applyAccent(hex: string) {
  const root = document.documentElement
  root.style.setProperty('--accent', hex)
  root.style.setProperty('--accent-soft', hexToRgba(hex, 0.12))
  try {
    localStorage.setItem(KEY, hex)
  } catch {
    /* ignore */
  }
}

export const FREE_PRESETS = ['#ECEAE4', '#E3F2FD', '#E8F5E9', '#FFF3E0', '#F3E5F5', '#EFEBE9', '#ECEFF1', '#F1F8E9']

export function applyFreeColor(hex: string) {
  document.documentElement.style.setProperty('--c-free', hex)
  try {
    localStorage.setItem(FREE_KEY, hex)
  } catch {
    /* ignore */
  }
}

export function loadFreeColor() {
  try {
    const v = localStorage.getItem(FREE_KEY)
    if (v) applyFreeColor(v)
  } catch {
    /* ignore */
  }
}

export function loadAccent() {
  try {
    const saved = localStorage.getItem(KEY)
    if (saved) applyAccent(saved)
  } catch {
    /* ignore */
  }
}

export const ACCENT_PRESETS = [
  '#111111', // 黑
  '#3F3F46', // 炭灰
  '#6B7280', // 灰
  '#4F46E5', // 靛蓝
  '#2563EB', // 蓝
  '#0EA5E9', // 天蓝
  '#0D9488', // 青
  '#059669', // 翠绿
  '#16A34A', // 绿
  '#D97706', // 琥珀
  '#EA580C', // 橙
  '#DC2626', // 红
  '#DB2777', // 玫红
  '#7C3AED', // 紫
]
