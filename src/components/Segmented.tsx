interface Option {
  value: string
  label: string
}

interface Props {
  options: Option[]
  value: string
  onChange: (v: string) => void
}

export function Segmented({ options, value, onChange }: Props) {
  return (
    <div className="segmented">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          className={'segmented__item' + (o.value === value ? ' is-active' : '')}
          onClick={() => onChange(o.value)}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}
