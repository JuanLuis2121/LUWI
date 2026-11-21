// Estado de publicación de un curso (BORRADOR | PUBLICADO | INACTIVO).
const ESTADOS = {
  BORRADOR: { label: "Borrador", cls: "bg-amber-50 text-amber-700 ring-amber-200", punto: "bg-amber-500" },
  PUBLICADO: { label: "Publicado", cls: "bg-emerald-50 text-emerald-700 ring-emerald-200", punto: "bg-emerald-500" },
  INACTIVO: { label: "Inactivo", cls: "bg-luwi-panel text-luwi-texto ring-luwi-linea", punto: "bg-luwi-texto/50" },
};

export function EstadoCursoBadge({ estado }) {
  const e = ESTADOS[estado] ?? ESTADOS.BORRADOR;
  return (
    <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${e.cls}`}>
      <span aria-hidden="true" className={`h-1.5 w-1.5 rounded-full ${e.punto}`} />
      {e.label}
    </span>
  );
}

export const TIPOS_UNIDAD_LABEL = { TEXTO: "Texto", VIDEO: "Video", ENLACE: "Enlace" };

export const formatoHoras = (h) => {
  const n = Number(h) || 0;
  return `${n.toLocaleString("es-DO")} ${n === 1 ? "hora" : "horas"}`;
};
