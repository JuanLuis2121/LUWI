import { useEffect, useRef } from "react";

/** Casilla de selección con el estilo de LUWI. `indeterminate` = selección parcial. */
export default function Checkbox({ checked, indeterminate = false, onChange, label, className = "" }) {
  const ref = useRef(null);

  useEffect(() => {
    if (ref.current) ref.current.indeterminate = indeterminate;
  }, [indeterminate]);

  return (
    <label className={`relative inline-flex h-5 w-5 cursor-pointer items-center justify-center ${className}`} onClick={(e) => e.stopPropagation()}>
      <input
        ref={ref}
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        aria-label={label}
        className="peer absolute inset-0 cursor-pointer appearance-none rounded-md border-2 border-luwi-linea bg-white transition checked:border-luwi-medio checked:bg-luwi-medio indeterminate:border-luwi-medio indeterminate:bg-luwi-medio hover:border-luwi-tecno focus:outline-none focus-visible:ring-2 focus-visible:ring-luwi-tecno/40"
      />
      <svg viewBox="0 0 24 24" className="pointer-events-none relative hidden h-3.5 w-3.5 text-white peer-checked:block" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M5 12l5 5L20 7" />
      </svg>
      <span aria-hidden="true" className="pointer-events-none relative hidden h-0.5 w-2.5 rounded-full bg-white peer-indeterminate:block" />
    </label>
  );
}
