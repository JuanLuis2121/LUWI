import { PERIODOS } from "../../utils/periodo";

/** Selector de periodo del dashboard (7 días, 30 días, 90 días, 12 meses). */
export default function PeriodSelector({ value, onChange }) {
  return (
    <div role="radiogroup" aria-label="Periodo" className="flex items-center gap-1 rounded-xl bg-white p-1 shadow-[0_6px_16px_-12px_rgba(11,58,140,0.5)] ring-1 ring-inset ring-luwi-linea">
      {Object.entries(PERIODOS).map(([key, p]) => {
        const activo = value === key;
        return (
          <button
            key={key}
            type="button"
            role="radio"
            aria-checked={activo}
            onClick={() => onChange(key)}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-luwi-tecno/40 ${
              activo ? "bg-luwi-profundo text-white shadow-sm" : "text-luwi-texto hover:bg-luwi-panel hover:text-luwi-profundo"
            }`}
          >
            {p.label}
          </button>
        );
      })}
    </div>
  );
}
