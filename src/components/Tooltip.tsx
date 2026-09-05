import type { ReactNode } from 'react'

export function Tooltip({ tip, children }: { tip: string; children: ReactNode }) {
  return (
    <span className="tooltip">
      {children}
      <span className="tooltip__bubble">{tip}</span>
    </span>
  )
}
