export default function Button({ children, loading = false, className = "", ...props }) {
  return (
    <button
      disabled={loading || props.disabled}
      className={`flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-luwi-blue to-luwi-purple px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-luwi-blue/30 transition hover:brightness-110 focus:outline-none focus-visible:ring-4 focus-visible:ring-luwi-blue/30 disabled:cursor-not-allowed disabled:opacity-70 ${className}`}
      {...props}
    >
      {loading ? "Cargando..." : children}
      {!loading && (
        <svg
          viewBox="0 0 24 24"
          className="h-4 w-4"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M5 12h14M13 6l6 6-6 6" />
        </svg>
      )}
    </button>
  );
}