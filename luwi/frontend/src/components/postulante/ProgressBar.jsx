/**
 * Barra de avance (0-100).
 * `inverse` la pinta en blanco para usarla sobre fondos oscuros o degradados.
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
      className={`h-2 w-full overflow-hidden rounded-full ${inverse ? "bg-white/20" : "bg-luwi-cristal-fondo"} ${className}`}
    >
      <div
        className={`h-full rounded-full transition-[width] duration-700 ${
          inverse ? "bg-gradient-to-r from-[#7cc8ff] to-white" : "bg-gradient-to-r from-luwi-medio to-luwi-tecno"
        }`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
