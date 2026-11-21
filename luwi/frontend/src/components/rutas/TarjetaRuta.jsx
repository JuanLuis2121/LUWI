import { useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import Icon from "../Icon";
import { ActionButton } from "../AdminUI";
import Checkbox from "../ui/Checkbox";
import CaminoSerpiente from "./CaminoSerpiente";
import { BriefcaseIcon, ClockIcon } from "../dashboard/icons";
import { NIVELES, nivelDe, formatoHoras } from "../../utils/rutas";

/**
 * Tarjeta de una ruta con su camino ondulado.
 * Las rutas largas (6 cursos o más) ocupan dos columnas para que el camino respire.
 */
export default function TarjetaRuta({ ruta, indice = 0, seleccionada, onSeleccionar, onAbrir, onEliminar }) {
  const reducido = useReducedMotion();
  const [encima, setEncima] = useState(false);
  const ancha = ruta.cursos.length >= 6;

  const porNivel = Object.values(NIVELES).map((n) => ({
    ...n,
    cantidad: ruta.cursos.filter((c) => nivelDe(c).label === n.label).length,
  }));

  return (
    <motion.li
      layout={!reducido}
      initial={reducido ? false : { opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: Math.min(indice, 8) * 0.05 }}
      onMouseEnter={() => setEncima(true)}
      onMouseLeave={() => setEncima(false)}
      onClick={() => onAbrir(ruta)}
      className={`group relative flex cursor-pointer flex-col overflow-hidden rounded-[24px] border bg-white p-5 shadow-[0_10px_30px_-22px_rgba(11,58,140,0.55)] transition-[box-shadow,border-color,transform] duration-300 hover:-translate-y-1 hover:shadow-[0_24px_44px_-24px_rgba(11,58,140,0.6)] ${
        ancha ? "sm:col-span-2" : ""
      } ${seleccionada ? "border-luwi-tecno ring-2 ring-luwi-tecno/30" : "border-luwi-linea/70 hover:border-luwi-tecno/40"}`}
    >
      {/* Brillo de esquina */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-luwi-tecno/10 opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-100"
      />

      <div className="relative flex items-start justify-between gap-3">
        <span className="inline-flex min-w-0 items-center gap-1.5 rounded-lg bg-luwi-cristal-fondo px-2.5 py-1 text-[11.5px] font-semibold text-luwi-medio ring-1 ring-inset ring-luwi-cristal">
          <BriefcaseIcon className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate">{ruta.puestoTitulo || "Sin puesto"}</span>
        </span>
        <Checkbox
          checked={seleccionada}
          onChange={() => onSeleccionar(ruta.id)}
          label={`Seleccionar ${ruta.nombre}`}
          className={`shrink-0 transition ${seleccionada ? "" : "opacity-0 group-hover:opacity-100 focus-within:opacity-100"}`}
        />
      </div>

      <h3 className="relative mt-3 truncate text-[17px] font-bold leading-snug tracking-[-0.01em] text-luwi-profundo" title={ruta.nombre}>
        {ruta.nombre || "Sin nombre"}
      </h3>
      <p className="relative mt-0.5 line-clamp-1 min-h-[18px] text-xs text-luwi-texto/75" title={ruta.descripcion}>
        {ruta.descripcion}
      </p>

      <div className="relative mt-4 rounded-2xl bg-[linear-gradient(180deg,#F3F7FD_0%,#FFFFFF_100%)] px-1 py-2 ring-1 ring-inset ring-luwi-linea/50">
        <CaminoSerpiente cursos={ruta.cursos} viajero={encima} max={ancha ? 12 : 6} />
      </div>

      <div className="relative mt-4 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="flex items-center gap-3 text-xs font-semibold text-luwi-profundo">
            <span>
              {ruta.cursos.length} {ruta.cursos.length === 1 ? "curso" : "cursos"}
            </span>
            <span className="inline-flex items-center gap-1">
              <ClockIcon className="h-3.5 w-3.5 text-luwi-texto/60" />
              {formatoHoras(ruta.duracionTotalHoras)}
            </span>
          </p>
          {ruta.cursos.length > 0 && (
            <div className="mt-1.5 flex h-1.5 w-28 overflow-hidden rounded-full bg-luwi-cristal-fondo" title={porNivel.map((n) => `${n.label}: ${n.cantidad}`).join(" · ")}>
              {porNivel.map((n) =>
                n.cantidad ? <span key={n.label} className={n.punto} style={{ width: `${(n.cantidad / ruta.cursos.length) * 100}%` }} /> : null
              )}
            </div>
          )}
        </div>

        <div
          className="flex shrink-0 gap-1.5 transition duration-200 sm:translate-y-1 sm:opacity-0 sm:group-hover:translate-y-0 sm:group-hover:opacity-100 sm:group-focus-within:translate-y-0 sm:group-focus-within:opacity-100"
          onClick={(e) => e.stopPropagation()}
        >
          <ActionButton size="sm" to={`/dashboard/rutas/${ruta.id}`} aria-label="Ver roadmap" title="Ver roadmap">
            <Icon name="eye" className="h-4 w-4" />
          </ActionButton>
          <ActionButton size="sm" variant="edit" to={`/dashboard/rutas/${ruta.id}/editar`} aria-label="Editar" title="Editar">
            <Icon name="pencil" className="h-4 w-4" />
          </ActionButton>
          <ActionButton size="sm" variant="danger" onClick={() => onEliminar(ruta)} aria-label="Eliminar" title="Eliminar">
            <Icon name="trash" className="h-4 w-4" />
          </ActionButton>
        </div>
      </div>
    </motion.li>
  );
}
