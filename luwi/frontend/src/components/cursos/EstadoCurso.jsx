// Estado de publicación de un curso (BORRADOR | PUBLICADO | INACTIVO).
const ESTADOS = {
  BORRADOR: { label: "Borrador", cls: "border-amber-300 bg-amber-50 text-amber-800" },
  PUBLICADO: { label: "Publicado", cls: "border-emerald-300 bg-emerald-50 text-emerald-700" },
  INACTIVO: { label: "Inactivo", cls: "border-admin-line bg-admin-bg text-admin-muted" },
};

export function EstadoCursoBadge({ estado }) {
  const e = ESTADOS[estado] ?? ESTADOS.BORRADOR;
  return (
    <span className={`inline-block whitespace-nowrap rounded-full border px-3 py-0.5 text-xs font-semibold ${e.cls}`}>
      {e.label}
    </span>
  );
}

export const TIPOS_UNIDAD_LABEL = { TEXTO: "Texto", VIDEO: "Video", ENLACE: "Enlace" };

export const formatoHoras = (h) => {
  const n = Number(h) || 0;
  return `${n.toLocaleString("es-DO")} ${n === 1 ? "hora" : "horas"}`;
};
