import { useEffect, useRef, useState } from "react";
import Checkbox from "./Checkbox";

/**
 * Botón de filtro con menú de opciones (selección múltiple).
 * - label: nombre del filtro ("Sector").
 * - options: [{ value, label, count? }]
 * - value: array con los valores elegidos; onChange(nuevoArray).
 */
export default function FilterMenu({ label, options, value, onChange }) {
  const [abierto, setAbierto] = useState(false);
  const ref = useRef(null);
  const activos = value.length;

  useEffect(() => {
    if (!abierto) return undefined;
    const fuera = (e) => ref.current && !ref.current.contains(e.target) && setAbierto(false);
    const esc = (e) => e.key === "Escape" && setAbierto(false);
    document.addEventListener("mousedown", fuera);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("mousedown", fuera);
      document.removeEventListener("keydown", esc);
    };
  }, [abierto]);

  const alternar = (v) => onChange(value.includes(v) ? value.filter((x) => x !== v) : [...value, v]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setAbierto((a) => !a)}
        aria-haspopup="listbox"
        aria-expanded={abierto}
        className={`flex h-11 items-center gap-2 rounded-xl border px-3.5 text-sm font-semibold transition focus:outline-none focus-visible:ring-4 focus-visible:ring-luwi-tecno/20 ${
          activos ? "border-luwi-tecno/50 bg-luwi-cristal-fondo text-luwi-profundo" : "border-luwi-linea bg-white text-luwi-texto hover:border-luwi-tecno/40 hover:text-luwi-profundo"
        }`}
      >
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M4 5h16l-6 7.5V19l-4 1.5v-8L4 5z" />
        </svg>
        {label}
        {activos > 0 && <span className="rounded-md bg-luwi-medio px-1.5 text-[11px] text-white">{activos}</span>}
        <svg viewBox="0 0 24 24" className={`h-3.5 w-3.5 transition ${abierto ? "rotate-180" : ""}`} fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true">
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>

      {abierto && (
        <div role="listbox" aria-label={label} aria-multiselectable="true" className="absolute left-0 top-12 z-30 w-64 rounded-2xl border border-luwi-linea bg-white p-2 shadow-[0_20px_50px_-12px_rgba(11,58,140,0.35)]">
          <div className="max-h-72 overflow-y-auto">
            {options.length === 0 && <p className="px-3 py-4 text-center text-xs text-luwi-texto/70">Sin opciones</p>}
            {options.map((o) => (
              <div
                key={o.value}
                role="option"
                aria-selected={value.includes(o.value)}
                onClick={() => alternar(o.value)}
                className="flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2 text-sm text-luwi-profundo transition hover:bg-luwi-cristal-fondo"
              >
                <Checkbox checked={value.includes(o.value)} onChange={() => alternar(o.value)} label={o.label} />
                <span className="min-w-0 flex-1 truncate">{o.label}</span>
                {o.count != null && <span className="text-xs text-luwi-texto/60">{o.count}</span>}
              </div>
            ))}
          </div>
          {activos > 0 && (
            <button
              type="button"
              onClick={() => onChange([])}
              className="mt-1 w-full rounded-xl px-3 py-2 text-left text-xs font-semibold text-luwi-medio transition hover:bg-luwi-panel"
            >
              Limpiar filtro
            </button>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Chips de los filtros activos, cada uno con su ×.
 * - chips: [{ key, label }] ; onRemove(key) ; onClear()
 */
export function FilterChips({ chips, onRemove, onClear }) {
  if (!chips.length) return null;
  return (
    <div className="flex flex-wrap items-center gap-2">
      {chips.map((c) => (
        <span key={c.key} className="inline-flex items-center gap-1.5 rounded-lg bg-luwi-cristal-fondo py-1 pl-2.5 pr-1 text-xs font-medium text-luwi-profundo ring-1 ring-inset ring-luwi-cristal">
          {c.label}
          <button
            type="button"
            onClick={() => onRemove(c.key)}
            aria-label={`Quitar filtro ${c.label}`}
            className="rounded-md p-0.5 text-luwi-texto/60 transition hover:bg-white hover:text-luwi-profundo"
          >
            <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </span>
      ))}
      <button type="button" onClick={onClear} className="rounded-lg px-2 py-1 text-xs font-semibold text-luwi-medio hover:underline">
        Limpiar todo
      </button>
    </div>
  );
}
