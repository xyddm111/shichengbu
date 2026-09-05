import { useEffect, useState } from 'react'

export interface ToastData {
  id: number
  message: string
}

let toastSeq = 0

export function useToast() {
  const [toast, setToast] = useState<ToastData | null>(null)
  const show = (message: string) => setToast({ id: ++toastSeq, message })
  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 4200)
    return () => clearTimeout(t)
  }, [toast])
  return { toast, show }
}

export function Toast({ toast }: { toast: ToastData | null }) {
  if (!toast) return null
  return (
    <div key={toast.id} className="toast">
      {toast.message}
    </div>
  )
}
