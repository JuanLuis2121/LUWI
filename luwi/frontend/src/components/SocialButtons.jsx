
function GoogleIcon() {
  return (
    <svg viewBox="0 0 48 48" className="h-[22px] w-[22px]" aria-hidden="true">
      <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.8 2.4 30.3 0 24 0 14.6 0 6.5 5.4 2.6 13.2l7.9 6.1C12.4 13.6 17.7 9.5 24 9.5Z" />
      <path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.7c-.6 3-2.3 5.5-4.8 7.2l7.6 5.9c4.4-4.1 7-10.1 7-17.6Z" />
      <path fill="#FBBC05" d="M10.5 28.7a14.5 14.5 0 0 1 0-9.4l-7.9-6.1a24 24 0 0 0 0 21.6l7.9-6.1Z" />
      <path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.6-5.9c-2.1 1.4-4.9 2.3-8.3 2.3-6.3 0-11.6-4.1-13.5-9.8l-7.9 6.1C6.5 42.6 14.6 48 24 48Z" />
    </svg>
  );
}

function MicrosoftIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-[22px] w-[22px]" aria-hidden="true">
      <rect x="2" y="2" width="9.5" height="9.5" fill="#F25022" />
      <rect x="12.5" y="2" width="9.5" height="9.5" fill="#7FBA00" />
      <rect x="2" y="12.5" width="9.5" height="9.5" fill="#00A4EF" />
      <rect x="12.5" y="12.5" width="9.5" height="9.5" fill="#FFB900" />
    </svg>
  );
}

function AppleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-[22px] w-[22px]" fill="currentColor" aria-hidden="true">
      <path d="M16.7 12.8c0-2.1 1.7-3.1 1.8-3.2-1-1.5-2.6-1.7-3.2-1.7-1.4-.2-2.7.8-3.4.8-.7 0-1.8-.8-3-.8-1.5 0-2.9.9-3.7 2.2-1.6 2.8-.4 7 1.2 9.3.8 1.1 1.6 2.3 2.8 2.2 1.1 0 1.6-.7 3-.7s1.8.7 3 .7c1.2 0 2-1.1 2.7-2.2.9-1.3 1.2-2.6 1.2-2.7-.1 0-2.4-.9-2.4-3.9ZM14.4 6.4c.6-.8 1.1-1.9 1-3-.9 0-2.1.6-2.8 1.4-.6.7-1.2 1.8-1.1 2.8 1.1.1 2.2-.5 2.9-1.2Z" />
    </svg>
  );
}

export default function SocialButtons({ onGoogle, onMicrosoft, onApple }) {
  const buttonClass =
    "flex h-[46px] w-[46px] items-center justify-center rounded-2xl border border-white bg-white/90 text-[#111] shadow-[0_6px_18px_rgba(11,58,140,0.08)] transition duration-200 hover:-translate-y-0.5 hover:bg-white hover:shadow-[0_10px_24px_rgba(11,58,140,0.14)] focus:outline-none focus-visible:ring-2 focus-visible:ring-luwi-tecno/40";

  return (
    <div className="mt-6">
      <div className="mb-4 flex items-center gap-4 text-[12px] text-luwi-texto">
        <span className="h-px flex-1 bg-luwi-linea" />
        o continúa con
        <span className="h-px flex-1 bg-luwi-linea" />
      </div>

      <div className="flex justify-center gap-4">
        <button type="button" onClick={onGoogle} className={buttonClass} aria-label="Continuar con Google">
          <GoogleIcon />
        </button>

        <button type="button" onClick={onMicrosoft} className={buttonClass} aria-label="Continuar con Microsoft">
          <MicrosoftIcon />
        </button>

        <button type="button" onClick={onApple} className={buttonClass} aria-label="Continuar con Apple">
          <AppleIcon />
        </button>
      </div>
    </div>
  );
}
