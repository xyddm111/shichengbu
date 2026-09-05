export function Loader({ label }: { label?: string }) {
  return (
    <div className="loader">
      <span className="loader__dots">
        <i />
        <i />
        <i />
      </span>
      {label && <span className="loader__label">{label}</span>}
    </div>
  )
}
