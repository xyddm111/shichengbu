interface Props {
  checked: boolean
  onChange: (v: boolean) => void
}

export function Toggle({ checked, onChange }: Props) {
  return (
    <label className="toggle">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span className="toggle__track">
        <span className="toggle__thumb" />
      </span>
    </label>
  )
}
