import { useState } from "react";

const icons = {
  user: (
    <path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-7 8a7 7 0 0 1 14 0" />
  ),
  mail: (
    <>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m3 7 9 6 9-6" />
    </>
  ),
  lock: (
    <>
      <rect x="5" y="11" width="14" height="9" rx="2" />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" />
    </>
  ),
};

function Icon({ name }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-[18px] w-[18px] shrink-0 text-luwi-muted"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {icons[name]}
    </svg>
  );
}

export default function Input({ icon, type = "text", error, className = "", ...props }) {
  const [visible, setVisible] = useState(false);
  const isPassword = type === "password";

  return (
    <div className={className}>
      <div
        className={`flex items-center gap-3 rounded-xl border bg-white/80 px-4 py-3 shadow-sm transition focus-within:border-luwi-blue focus-within:ring-4 focus-within:ring-luwi-blue/10 ${
          error ? "border-red-400" : "border-luwi-border"
        }`}
      >
        {icon && <Icon name={icon} />}
        <input
          type={isPassword && visible ? "text" : type}
          className="w-full bg-transparent text-sm text-luwi-ink outline-none placeholder:text-luwi-muted"
          {...props}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setVisible((v) => !v)}
            aria-label={visible ? "Ocultar contraseña" : "Mostrar contraseña"}
            className="text-luwi-muted transition hover:text-luwi-blue"
          >
            <svg
              viewBox="0 0 24 24"
              className="h-[18px] w-[18px]"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.7"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              {visible ? (
                <>
                  <path d="M3 3l18 18" />
                  <path d="M10.6 6.1A9.7 9.7 0 0 1 12 6c5 0 9 6 9 6a15 15 0 0 1-3.2 3.7M6.6 7.6A15 15 0 0 0 3 12s4 6 9 6a9 9 0 0 0 3.4-.7" />
                </>
              ) : (
                <>
                  <path d="M3 12s4-6 9-6 9 6 9 6-4 6-9 6-9-6-9-6Z" />
                  <circle cx="12" cy="12" r="3" />
                </>
              )}
            </svg>
          </button>
        )}
      </div>
      {error && <p className="mt-1 pl-1 text-xs text-red-500">{error}</p>}
    </div>
  );
}