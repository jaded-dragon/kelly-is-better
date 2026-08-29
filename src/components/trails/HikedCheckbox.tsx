import { useRef } from 'react'
import { Check } from 'lucide-react'

interface HikedCheckboxProps {
  trailId: string
  checked: boolean
  onToggle: (id: string) => void
}

export function HikedCheckbox({ trailId, checked, onToggle }: HikedCheckboxProps) {
  const btnRef = useRef<HTMLButtonElement>(null)

  function handleClick(e: React.MouseEvent) {
    e.stopPropagation()
    if (btnRef.current) {
      btnRef.current.classList.remove('check-bounce')
      void btnRef.current.offsetWidth  // force reflow
      btnRef.current.classList.add('check-bounce')
    }
    onToggle(trailId)
  }

  return (
    <button
      ref={btnRef}
      onClick={handleClick}
      aria-label={checked ? 'Mark as not hiked' : 'Mark as hiked'}
      aria-pressed={checked}
      className="flex items-center justify-center rounded-full transition-all duration-200 shrink-0"
      style={{
        width: 28,
        height: 28,
        background: checked ? 'var(--forest)' : 'transparent',
        border: `2px solid ${checked ? 'var(--forest)' : 'rgba(255,255,255,0.25)'}`,
        color: checked ? '#fff' : 'rgba(255,255,255,0.35)',
      }}
    >
      {checked && <Check size={14} strokeWidth={3} />}
    </button>
  )
}
