function GoogleIcon() {
  return (
    <svg viewBox="0 0 48 48" className="h-5 w-5" aria-hidden="true">
      <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.8 2.4 30.3 0 24 0 14.6 0 6.5 5.4 2.6 13.2l7.9 6.1C12.4 13.6 17.7 9.5 24 9.5Z" />
      <path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.7c-.6 3-2.3 5.5-4.8 7.2l7.6 5.9c4.4-4.1 7-10.1 7-17.6Z" />
      <path fill="#FBBC05" d="M10.5 28.7a14.5 14.5 0 0 1 0-9.4l-7.9-6.1a24 24 0 0 0 0 21.6l7.9-6.1Z" />
      <path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.6-5.9c-2.1 1.4-4.9 2.3-8.3 2.3-6.3 0-11.6-4.1-13.5-9.8l-7.9 6.1C6.5 42.6 14.6 48 24 48Z" />
    </svg>
  );
}

function MicrosoftIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
      <rect x="2" y="2" width="9.5" height="9.5" fill="#F25022" />
      <rect x="12.5" y="2" width="9.5" height="9.5" fill="#7FBA00" />
      <rect x="2" y="12.5" width="9.5" height="9.5" fill="#00A4EF" />
      <rect x="12.5" y="12.5" width="9.5" height="9.5" fill="#FFB900" />
    </svg>
  );
}

const btn =
  "flex flex-1 items-center justify-center gap-2 rounded-full border border-luwi-border bg-white/80 px-4 py-2.5 text-sm font-medium text-luwi-ink shadow-sm transition hover:border-luwi-blue/40 hover:shadow-md";

export default function SocialButtons({ onGoogle, onMicrosoft }) {
  return (
    <div>
      <div className="my-5 flex items-center gap-3 text-xs text-luwi-muted">
        <span className="h-px flex-1 bg-luwi-border" />
        o continúa con
        <span className="h-px flex-1 bg-luwi-border" />
      </div>
      <div className="flex gap-3">
        <button type="button" onClick={onGoogle} className={btn}>
          <GoogleIcon /> Google
        </button>
        <button type="button" onClick={onMicrosoft} className={btn}>
          <MicrosoftIcon /> Microsoft
        </button>
      </div>
    </div>
  );
}