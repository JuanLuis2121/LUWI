function ChevronIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5 transition-transform duration-200 group-hover:translate-x-0.5"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="m9 6 6 6-6 6" />
    </svg>
  );
}

function Spinner() {
  return (
    <span
      aria-hidden="true"
      className="h-5 w-5 animate-spin rounded-full border-2 border-white/40 border-t-white"
    />
  );
}

export default function Button({
  children,
  loading = false,
  loadingText = "Cargando…",
  className = "",
  type = "button",
  disabled,
  ...props
}) {
  return (
    <button
      type={type}
      disabled={loading || disabled}
      aria-busy={loading || undefined}
      className={`group flex h-[50px] w-full items-center justify-center gap-3 rounded-2xl bg-colonial-btn px-6 text-[15px] font-semibold text-white shadow-[0_12px_28px_-8px_rgba(34,43,184,0.45)] transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_16px_32px_-8px_rgba(34,43,184,0.52)] hover:brightness-110 focus:outline-none focus-visible:ring-4 focus-visible:ring-luwi-medio/25 disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:translate-y-0 ${className}`}
      {...props}
    >
      {loading ? (
        <>
          <Spinner />
          {loadingText}
        </>
      ) : (
        <>
          {children}
          <ChevronIcon />
        </>
      )}
    </button>
  );
}
