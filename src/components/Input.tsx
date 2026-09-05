import { forwardRef, type InputHTMLAttributes } from 'react'

interface Props extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
}

export const Input = forwardRef<HTMLInputElement, Props>(function Input({ label, id, ...rest }, ref) {
  return (
    <label className="field">
      {label && <span className="field__label">{label}</span>}
      <input ref={ref} id={id} className="input" {...rest} />
    </label>
  )
})
