import { useId, useState } from "react";

const icons = {
  user: (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4.5 21a7.5 7.5 0 0 1 15 0Z" />
    </>
  ),
  mail: (
    <>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m3 7 9 6 9-6" fill="none" stroke="white" strokeWidth="1.6" />
    </>
  ),
  lock: (
    <>
      <rect x="5" y="10" width="14" height="11" rx="2.5" />
      <path d="M8 10V7a4 4 0 0 1 8 0v3" fill="none" stroke="currentColor" strokeWidth="2.2" />
    </>
  ),
};

function Icon({ name }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-[18px] w-[18px] shrink-0 text-luwi-profundo"
      fill="currentColor"
      aria-hidden="true"
    >
      {icons[name] || icons.user}
    </svg>
  );
}

function EyeIcon({ open }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-[19px] w-[19px]"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {open ? (
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
  );
}

export default function Input({
  icon,
  type = "text",
  error,
  className = "",
  id,
  ...props
}) {
  const [visible, setVisible] = useState(false);
  const autoId = useId();
  const inputId = id ?? autoId;
  const errorId = `${inputId}-error`;
  const isPassword = type === "password";

  return (
    <div className={`w-full ${className}`}>
      <div
        className={`flex h-[50px] items-center gap-3.5 rounded-2xl border bg-white/80 px-5 shadow-[0_4px_14px_rgba(11,58,140,0.05)] transition duration-200 focus-within:border-luwi-tecno focus-within:bg-white focus-within:shadow-[0_0_0_4px_rgba(0,156,255,0.12)] ${
          error ? "border-red-400" : "border-luwi-linea"
        }`}
      >
        {icon && <Icon name={icon} />}

        <input
          id={inputId}
          type={isPassword && visible ? "text" : type}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          aria-label={props["aria-label"] ?? props.placeholder}
          className="h-full w-full min-w-0 bg-transparent text-[14px] text-luwi-profundo outline-none placeholder:text-[#8A9BB8]"
          {...props}
        />

        {isPassword && (
          <button
            type="button"
            onClick={() => setVisible((v) => !v)}
            aria-label={visible ? "Ocultar contraseña" : "Mostrar contraseña"}
            className="shrink-0 rounded-md p-1 text-[#7C8CA8] transition hover:text-luwi-profundo focus:outline-none focus-visible:ring-2 focus-visible:ring-luwi-tecno/40"
          >
            <EyeIcon open={visible} />
          </button>
        )}
      </div>

      {error && (
        <p id={errorId} className="mt-1.5 pl-2 text-xs text-red-500">
          {error}
        </p>
      )}
    </div>
  );
}
