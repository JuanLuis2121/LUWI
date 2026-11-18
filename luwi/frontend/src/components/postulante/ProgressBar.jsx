/**
 * Barra de avance (0-100).
 * `inverse` la pinta en blanco para usarla sobre el degradado.
 */
export default function ProgressBar({ value = 0, inverse = false, label = "Avance", className = "" }) {
  const pct = Math.min(100, Math.max(0, Math.round(Number(value) || 0)));

  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={pct}
      className={`h-2.5 w-full overflow-hidden rounded-full ${
        inverse ? "bg-white/25" : "bg-luwi-border/70"
      } ${className}`}
    >
      <div
        className={`h-full rounded-full transition-[width] duration-500 ${
          inverse ? "bg-white" : "bg-gradient-to-r from-luwi-blue to-luwi-purple"
        }`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
