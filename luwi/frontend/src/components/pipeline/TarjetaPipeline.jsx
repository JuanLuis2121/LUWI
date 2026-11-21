import Checkbox from "../ui/Checkbox";
import { Avatar, BarraAvance, EtiquetaCuenta, EtiquetaEstado, RouteMiniIcon } from "./Piezas";
import { tiempoRelativo } from "../../utils/pipeline";

/**
 * Tarjeta de un postulante en el tablero.
 * - tarjeta: elemento de armarTarjetas().
 * - seleccionada / onSeleccionar: casilla para acciones masivas.
 * - onAbrir: abre la ficha 360.
 * - ocupada: muestra la tarjeta atenuada mientras se guarda un cambio.
 */
export default function TarjetaPipeline({ tarjeta, seleccionada, onSeleccionar, onAbrir, ocupada = false }) {
  const { proceso, postulante } = tarjeta;
  const asignacion = proceso?.asignacion;
  const suspendido = proceso?.estado === "SUSPENDIDO";
  const arrastrable = !ocupada && !suspendido;

  return (
    <li
      draggable={arrastrable}
      onDragStart={(e) => {
        e.dataTransfer.setData("text/pipeline-key", tarjeta.key);
        e.dataTransfer.effectAllowed = "move";
      }}
      onClick={() => onAbrir(tarjeta)}
      onKeyDown={(e) => {
        if (e.key === "Enter" && e.target === e.currentTarget) onAbrir(tarjeta);
      }}
      tabIndex={0}
      aria-label={`${tarjeta.nombre}. Abrir ficha`}
      className={`group relative overflow-hidden rounded-2xl border bg-white p-3.5 shadow-[0_6px_16px_-12px_rgba(11,58,140,0.5)] transition hover:-translate-y-0.5 hover:border-luwi-tecno/40 hover:shadow-[0_14px_26px_-16px_rgba(11,58,140,0.55)] focus:outline-none focus-visible:ring-2 focus-visible:ring-luwi-tecno/40 ${
        arrastrable ? "cursor-grab active:cursor-grabbing" : "cursor-pointer"
      } ${ocupada ? "pointer-events-none opacity-60" : ""} ${suspendido ? "bg-[repeating-linear-gradient(135deg,#fff,#fff_10px,#fbfcfe_10px,#fbfcfe_20px)]" : ""} ${
        seleccionada ? "border-luwi-tecno ring-2 ring-luwi-tecno/25" : "border-luwi-linea/80"
      }`}
    >
      <div className="flex items-start gap-3">
        <Avatar nombre={tarjeta.nombre} />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <p className="truncate text-[13.5px] font-semibold leading-snug text-luwi-profundo">{tarjeta.nombre}</p>
            <Checkbox
              checked={seleccionada}
              onChange={() => onSeleccionar(tarjeta.key)}
              label={`Seleccionar ${tarjeta.nombre}`}
              className="shrink-0 opacity-0 transition group-hover:opacity-100 focus-within:opacity-100 [&:has(input:checked)]:opacity-100"
            />
          </div>
          <p className="truncate text-[11.5px] text-luwi-texto/75">
            {proceso?.puesto?.titulo ?? (postulante?.puestosAplicados?.map((p) => p.titulo).filter(Boolean).join(", ") || tarjeta.correo)}
          </p>
        </div>
      </div>

      {asignacion && (
        <div className="mt-3 rounded-xl bg-luwi-panel/80 px-3 py-2.5">
          <p className="mb-1.5 flex items-center gap-1.5 truncate text-[11px] font-medium text-luwi-texto">
            <RouteMiniIcon className="h-3.5 w-3.5 shrink-0 text-luwi-medio" />
            <span className="truncate">{asignacion.ruta?.nombre}</span>
          </p>
          <BarraAvance porcentaje={asignacion.porcentaje} />
        </div>
      )}

      <div className="mt-3 flex flex-wrap items-center justify-between gap-1.5">
        <div className="flex flex-wrap gap-1.5">
          {suspendido && <EtiquetaEstado estado="SUSPENDIDO" />}
          {proceso?.estado === "FINALIZADO" && <EtiquetaEstado estado="FINALIZADO" />}
          {postulante?.cuenta && postulante.cuenta !== "ACTIVA" && <EtiquetaCuenta cuenta={postulante.cuenta} corta />}
          {asignacion && !suspendido && (
            <span className="text-[11px] font-medium text-luwi-texto/70">
              {asignacion.cursosHabilitados}/{asignacion.totalCursos} cursos habilitados
            </span>
          )}
        </div>
        <span className="text-[10.5px] text-luwi-texto/55">{tiempoRelativo(tarjeta.fecha)}</span>
      </div>
    </li>
  );
}
