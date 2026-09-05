interface Props {
  checked: boolean
  onChange: (v: boolean) => void
  label?: string
}

export function Checkbox({ checked, onChange, label }: Props) {
  return (
    <label className="checkbox">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span className="checkbox__box" aria-hidden="true">
        <svg viewBox="0 0 12 10" width="12" height="10">
          <path
            d="M1 5l3.5 3.5L11 1"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
      {label && <span className="checkbox__label">{label}</span>}
    </label>
  )
}
