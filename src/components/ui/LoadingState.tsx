export function LoadingState() {
  return (
    <div className="space-y-2" aria-label="Loading trails…" role="status">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-3 px-5 py-4 rounded-2xl"
          style={{
            background: 'rgba(255,255,255,0.05)',
            border: '1.5px solid rgba(255,255,255,0.08)',
            animation: `pulse 1.6s ease-in-out ${i * 0.1}s infinite`,
          }}
        >
          <div className="w-2 h-2 rounded-full shrink-0" style={{ background: 'var(--moss)' }} />
          <div className="flex-1 space-y-1.5">
            <div className="h-4 rounded-full" style={{ background: 'var(--moss)', opacity: 0.4, width: `${55 + Math.random() * 30}%` }} />
            <div className="h-3 rounded-full" style={{ background: 'var(--sand)', opacity: 0.4, width: `${35 + Math.random() * 20}%` }} />
          </div>
          <div className="h-5 w-16 rounded-full" style={{ background: 'var(--moss)', opacity: 0.3 }} />
          <div className="w-7 h-7 rounded-full" style={{ background: 'var(--moss)', opacity: 0.3 }} />
        </div>
      ))}
      <style>{`@keyframes pulse { 0%,100%{opacity:0.5} 50%{opacity:1} }`}</style>
    </div>
  )
}
