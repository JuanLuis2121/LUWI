import { useState } from "react";

const trazo = { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.9, strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": true };

// Íconos de cada vista
export const VISTAS = {
  tabla: {
    label: "Tabla",
    icon: (p) => (
      <svg {...trazo} {...p}>
        <rect x="3" y="4" width="18" height="16" rx="2" />
        <path d="M3 10h18M3 15h18M9 4v16" />
      </svg>
    ),
  },
  tarjetas: {
    label: "Tarjetas",
    icon: (p) => (
      <svg {...trazo} {...p}>
        <rect x="3" y="3" width="7.5" height="7.5" rx="1.8" />
        <rect x="13.5" y="3" width="7.5" height="7.5" rx="1.8" />
        <rect x="3" y="13.5" width="7.5" height="7.5" rx="1.8" />
        <rect x="13.5" y="13.5" width="7.5" height="7.5" rx="1.8" />
      </svg>
    ),
  },
  mapa: {
    label: "Mapa",
    icon: (p) => (
      <svg {...trazo} {...p}>
        <circle cx="5" cy="17" r="2.2" />
        <circle cx="12" cy="8" r="2.2" />
        <circle cx="19" cy="15" r="2.2" />
        <path d="M6.6 15.4C8 12.5 9 10.5 10.3 9.4M13.8 9.2c1.6 1 2.8 2.7 3.7 4.2" />
      </svg>
    ),
  },
  kanban: {
    label: "Kanban",
    icon: (p) => (
      <svg {...trazo} {...p}>
        <rect x="3" y="3" width="5" height="18" rx="1.5" />
        <rect x="9.5" y="3" width="5" height="12" rx="1.5" />
        <rect x="16" y="3" width="5" height="15" rx="1.5" />
      </svg>
    ),
  },
};

/** Guarda la vista elegida en el navegador para recordarla la próxima vez. */
export function useVistaGuardada(clave, inicial, permitidas) {
  const [vista, setVista] = useState(() => {
    try {
      const guardada = localStorage.getItem(`luwi-vista-${clave}`);
      return permitidas.includes(guardada) ? guardada : inicial;
    } catch {
      return inicial;
    }
  });

  const cambiar = (v) => {
    setVista(v);
    try {
      localStorage.setItem(`luwi-vista-${clave}`, v);
    } catch {
      // Sin almacenamiento disponible: solo dura mientras la página esté abierta
    }
  };

  return [vista, cambiar];
}

/** Botones para cambiar entre vistas (tabla, tarjetas, kanban). */
export default function ViewSwitcher({ value, onChange, opciones }) {
  return (
    <div role="radiogroup" aria-label="Tipo de vista" className="flex h-11 items-center gap-1 rounded-xl bg-luwi-panel p-1 ring-1 ring-inset ring-luwi-linea">
      {opciones.map((key) => {
        const { label, icon: Icono } = VISTAS[key];
        const activo = value === key;
        return (
          <button
            key={key}
            type="button"
            role="radio"
            aria-checked={activo}
            aria-label={label}
            title={`Vista ${label.toLowerCase()}`}
            onClick={() => onChange(key)}
            className={`flex h-9 w-9 items-center justify-center rounded-lg transition focus:outline-none focus-visible:ring-2 focus-visible:ring-luwi-tecno/40 ${
              activo ? "bg-white text-luwi-profundo shadow-sm" : "text-luwi-texto/70 hover:text-luwi-profundo"
            }`}
          >
            <Icono className="h-[18px] w-[18px]" />
          </button>
        );
      })}
    </div>
  );
}
