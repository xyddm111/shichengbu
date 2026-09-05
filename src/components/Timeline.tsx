import type { CSSProperties, Ref } from 'react'
import type { Block } from '../lib/schedule'
import { freeSlots } from '../lib/schedule'
import { pad2, toHHMM } from '../lib/time'

const HOUR_H = 44
const TOTAL = 24 * HOUR_H

function pos(min: number) {
  return (min / 1440) * TOTAL
}

const PERIODS: Record<number, string> = { 0: '凌晨', 6: '早晨', 12: '中午', 18: '傍晚', 22: '深夜' }

interface Props {
  blocks: Block[]
  onBlockClick?: (b: Block) => void
  nowLineRef?: Ref<HTMLDivElement>
}

export function Timeline({ blocks, onBlockClick, nowLineRef }: Props) {
  const now = new Date()
  const nowMin = now.getHours() * 60 + now.getMinutes()

  const freeBlocks: Block[] = freeSlots(blocks, 0, 1440).map((s) => ({
    start: s.start,
    end: s.end,
    kind: 'free',
    title: '空闲',
    color: 'var(--c-free)',
  }))

  return (
    <div className="timeline" style={{ height: TOTAL }}>
      {Array.from({ length: 24 }, (_, h) => (
        <div key={h} className="timeline__hour" style={{ top: h * HOUR_H }}>
          {pad2(h)}:00
          {PERIODS[h] && <span className="timeline__period">{PERIODS[h]}</span>}
        </div>
      ))}

      {freeBlocks.map((b, i) => {
        const top = pos(b.start)
        const height = pos(b.end) - pos(b.start)
        if (height < 14) return null
        return (
          <div key={'free-' + i} className="tl-block tl-block--free" style={{ top, height }}>
            <span className="tl-block__title">空闲</span>
          </div>
        )
      })}

      {blocks.map((b, i) => {
        const top = pos(b.start)
        const height = Math.max(pos(b.end) - pos(b.start), 22)
        const style: CSSProperties = { top, height }
        if (b.kind === 'plan') {
          style.background = 'var(--c-plan-soft)'
          style.border = '1.5px dashed ' + (b.color || 'var(--c-plan)')
          style.color = 'var(--text)'
        } else {
          style.background = b.color || 'var(--c-course)'
          style.color = '#fff'
        }
        return (
          <div key={i} className="tl-block" style={style} onClick={() => onBlockClick?.(b)}>
            <span className="tl-block__title">{b.title}</span>
            {height >= 40 && (
              <span className="tl-block__time">
                {toHHMM(b.start)}–{toHHMM(b.end)}
              </span>
            )}
            {height >= 56 && b.detail && <span className="tl-block__detail">{b.detail}</span>}
          </div>
        )
      })}

      <div ref={nowLineRef} className="timeline__now" style={{ top: pos(nowMin) }}>
        <span className="timeline__now-tag">
          现在 {pad2(now.getHours())}:{pad2(now.getMinutes())}
        </span>
      </div>
    </div>
  )
}
