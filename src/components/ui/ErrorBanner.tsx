interface ErrorBannerProps {
  error: string
}

export function ErrorBanner({ error }: ErrorBannerProps) {
  return (
    <div
      className="rounded-2xl px-5 py-4 text-sm space-y-2"
      style={{
        background: 'rgba(196,134,154,0.12)',
        border: '1.5px solid var(--mauve)',
        color: 'var(--earth)',
      }}
      role="alert"
    >
      <p>{error}</p>
    </div>
  )
}
