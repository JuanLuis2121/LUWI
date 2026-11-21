import { useCallback, useEffect, useState } from "react";
import Drawer, { DrawerField } from "../ui/Drawer";
import { ActionButton } from "../AdminUI";
import { ExpandIcon } from "../ui/icons";
import { Avatar, BarraAvance, EtiquetaCuenta, EtiquetaEstado, FlagIcon, PauseIcon, PlayIcon, RouteMiniIcon, UsersIcon } from "./Piezas";
import { getFormacionProceso, cambiarAccesoCurso } from "../../services/asignacionesService";
import { useToast } from "../ui/toast";
import { ETAPAS, ETAPA_POR_KEY, diasDesde, formatoFecha } from "../../utils/pipeline";

const ESTADO_CURSO = {
  BLOQUEADO: { label: "Bloqueado", cls: "text-luwi-texto/60" },
  SIN_INICIAR: { label: "Sin iniciar", cls: "text-luwi-medio" },
  EN_CURSO: { label: "En curso", cls: "text-luwi-tecno" },
  CONTENIDOS_REVISADOS: { label: "Revisado", cls: "text-emerald-600" },
};

// Recorrido del postulante por las cuatro etapas.
function Recorrido({ etapa }) {
  const actual = ETAPAS.findIndex((e) => e.key === etapa);
  return (
    <ol className="grid grid-cols-4 gap-1.5" aria-label="Etapa del postulante">
      {ETAPAS.map((e, i) => {
        const hecho = i < actual;
        const esActual = i === actual;
        return (
          <li key={e.key} className="min-w-0">
            <div
              className={`h-1.5 rounded-full ${
                hecho ? "bg-luwi-medio" : esActual ? `bg-gradient-to-r ${e.barra}` : "bg-luwi-cristal-fondo"
              }`}
            />
            <p
              aria-current={esActual ? "step" : undefined}
              className={`mt-1.5 truncate text-[11px] ${esActual ? "font-bold text-luwi-profundo" : hecho ? "font-medium text-luwi-texto" : "text-luwi-texto/55"}`}
            >
              {e.titulo}
            </p>
          </li>
        );
      })}
    </ol>
  );
}

function Indicador({ label, valor, detalle }) {
  return (
    <div className="rounded-2xl bg-white px-3.5 py-3 ring-1 ring-inset ring-luwi-linea/70">
      <p className="text-[11px] font-medium text-luwi-texto/75">{label}</p>
      <p className="mt-0.5 text-lg font-bold leading-tight text-luwi-profundo">{valor}</p>
      {detalle && <p className="truncate text-[11px] text-luwi-texto/60">{detalle}</p>}
    </div>
  );
}

function Interruptor({ activo, onChange, disabled, label }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={activo}
      aria-label={label}
      title={activo ? "Bloquear curso" : "Habilitar curso"}
      disabled={disabled}
      onClick={() => onChange(!activo)}
      className={`relative h-6 w-10 shrink-0 rounded-full transition focus:outline-none focus-visible:ring-2 focus-visible:ring-luwi-tecno/40 disabled:opacity-50 ${
        activo ? "bg-luwi-medio" : "bg-luwi-linea"
      }`}
    >
      <span className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow transition-all ${activo ? "left-5" : "left-1"}`} />
    </button>
  );
}

// Cursos de la ruta con su avance y el interruptor de acceso.
function CursosDeRuta({ procesoId, suspendido, onCambio }) {
  const toast = useToast();
  const [datos, setDatos] = useState(null);
  const [error, setError] = useState("");
  const [guardando, setGuardando] = useState(null);

  const cargar = useCallback(async () => {
    try {
      setError("");
      setDatos(await getFormacionProceso(procesoId));
    } catch (e) {
      setError(e.message);
    }
  }, [procesoId]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const alternar = async (curso, habilitar) => {
    setGuardando(curso.cursoAsignadoId);
    try {
      await cambiarAccesoCurso(datos.asignacion.id, curso.cursoAsignadoId, habilitar ? "HABILITADO" : "BLOQUEADO");
      await cargar();
      onCambio?.();
      toast({ title: habilitar ? "Curso habilitado" : "Curso bloqueado", description: curso.titulo, variant: "success" });
    } catch (e) {
      toast({ title: "No se pudo cambiar el acceso", description: e.message, variant: "error" });
    } finally {
      setGuardando(null);
    }
  };

  if (error) return <p className="rounded-2xl bg-red-50 px-4 py-3 text-xs text-red-600">{error}</p>;
  if (!datos) {
    return (
      <div className="space-y-2" role="status" aria-label="Cargando cursos">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-12 animate-pulse rounded-xl bg-luwi-cristal-fondo" />
        ))}
      </div>
    );
  }

  const cursos = [...(datos.asignacion?.cursos ?? [])].sort((a, b) => a.orden - b.orden);
  if (cursos.length === 0) return <p className="text-xs text-luwi-texto/70">La ruta no tiene cursos.</p>;

  return (
    <ol className="space-y-2">
      {cursos.map((c, i) => {
        const estado = ESTADO_CURSO[c.estado] ?? ESTADO_CURSO.SIN_INICIAR;
        const habilitado = c.acceso === "HABILITADO";
        return (
          <li key={c.cursoAsignadoId} className="flex items-center gap-3 rounded-xl border border-luwi-linea/70 bg-white px-3 py-2.5">
            <span
              className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[11px] font-bold ${
                c.estado === "CONTENIDOS_REVISADOS" ? "bg-emerald-50 text-emerald-600" : habilitado ? "bg-luwi-cristal-fondo text-luwi-medio" : "bg-luwi-panel text-luwi-texto/60"
              }`}
            >
              {c.estado === "CONTENIDOS_REVISADOS" ? "✓" : i + 1}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-semibold text-luwi-profundo">{c.titulo}</p>
              <p className="text-[11px]">
                <span className={`font-semibold ${estado.cls}`}>{estado.label}</span>
                <span className="text-luwi-texto/60">
                  {" "}
                  · {c.revisadasObligatorias}/{c.totalObligatorias} unidades · {c.porcentaje}%
                </span>
              </p>
            </div>
            <Interruptor
              activo={habilitado}
              disabled={suspendido || guardando === c.cursoAsignadoId}
              onChange={(v) => alternar(c, v)}
              label={`${habilitado ? "Bloquear" : "Habilitar"} ${c.titulo}`}
            />
          </li>
        );
      })}
    </ol>
  );
}

function Seccion({ titulo, children, accion }) {
  return (
    <section className="mt-6">
      <div className="mb-2.5 flex items-center justify-between gap-2">
        <h3 className="text-[11px] font-semibold uppercase tracking-[0.12em] text-luwi-texto/70">{titulo}</h3>
        {accion}
      </div>
      {children}
    </section>
  );
}

/**
 * Ficha 360 del postulante en un panel lateral.
 * - tarjeta: elemento de armarTarjetas() (puede ser un postulante sin proceso).
 * - onIniciar(tarjeta), onAsignar(tarjeta), onEstado(tarjeta, estado): acciones de la página.
 * - onRecargar(): refresca el pipeline después de cambiar accesos.
 */
export default function FichaPostulanteDrawer({ tarjeta, onClose, onIniciar, onAsignar, onEstado, onRecargar, ocupada }) {
  if (!tarjeta) return null;

  const { proceso, postulante } = tarjeta;
  const asignacion = proceso?.asignacion;
  const etapa = ETAPA_POR_KEY[tarjeta.etapa];
  const suspendido = proceso?.estado === "SUSPENDIDO";
  const finalizado = proceso?.estado === "FINALIZADO";
  const dias = diasDesde(proceso?.fechaInicio);

  const footer = (
    <>
      {!proceso && (
        <ActionButton variant="primary" onClick={() => onIniciar(tarjeta)} disabled={ocupada}>
          <PlayIcon className="h-4 w-4" />
          Iniciar proceso
        </ActionButton>
      )}
      {proceso && !asignacion && !suspendido && !finalizado && (
        <ActionButton variant="primary" onClick={() => onAsignar(tarjeta)} disabled={ocupada}>
          <RouteMiniIcon className="h-4 w-4" />
          Asignar ruta
        </ActionButton>
      )}
      {proceso && proceso.estado === "ACTIVO" && (
        <ActionButton onClick={() => onEstado(tarjeta, "SUSPENDIDO")} disabled={ocupada}>
          <PauseIcon className="h-4 w-4" />
          Suspender
        </ActionButton>
      )}
      {proceso && (suspendido || finalizado) && (
        <ActionButton onClick={() => onEstado(tarjeta, "ACTIVO")} disabled={ocupada}>
          <PlayIcon className="h-4 w-4" />
          {finalizado ? "Reabrir" : "Reactivar"}
        </ActionButton>
      )}
      {proceso && !finalizado && (
        <ActionButton variant="edit" onClick={() => onEstado(tarjeta, "FINALIZADO")} disabled={ocupada}>
          <FlagIcon className="h-4 w-4" />
          Finalizar
        </ActionButton>
      )}
      {proceso && (
        <ActionButton to={`/dashboard/postulantes/${proceso.id}`} title="Abrir la ficha completa">
          <ExpandIcon className="h-4 w-4" />
          Ficha
        </ActionButton>
      )}
    </>
  );

  return (
    <Drawer open onClose={onClose} title={tarjeta.nombre} subtitle={tarjeta.correo} icon={UsersIcon} footer={footer}>
      <div className="rounded-[22px] bg-[radial-gradient(ellipse_at_0%_0%,#EAF3FF_0%,#F3F7FD_60%)] p-4 ring-1 ring-inset ring-luwi-linea/60">
        <div className="flex items-center gap-3.5">
          <Avatar nombre={tarjeta.nombre} size="lg" />
          <div className="min-w-0 flex-1">
            <p className="flex items-center gap-1.5 text-sm font-semibold text-luwi-profundo">
              <span className={`h-2 w-2 rounded-full ${etapa?.punto}`} />
              {etapa?.titulo}
            </p>
            <p className="mt-0.5 truncate text-xs text-luwi-texto">
              {proceso ? [proceso.puesto?.titulo, proceso.empresa?.nombre].filter(Boolean).join(" · ") : "Aún no tiene un proceso de formación"}
            </p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {proceso && <EtiquetaEstado estado={proceso.estado} />}
              <EtiquetaCuenta cuenta={postulante?.cuenta} />
            </div>
          </div>
        </div>
        <div className="mt-4">
          <Recorrido etapa={tarjeta.etapa} />
        </div>
      </div>

      {proceso && (
        <div className="mt-4 grid grid-cols-3 gap-2.5">
          <Indicador label="Avance" valor={asignacion ? `${asignacion.porcentaje}%` : "—"} detalle={asignacion ? "de la ruta" : "sin ruta"} />
          <Indicador label="Cursos" valor={asignacion ? `${asignacion.cursosHabilitados}/${asignacion.totalCursos}` : "—"} detalle="habilitados" />
          <Indicador label="En proceso" valor={dias != null ? `${dias} d` : "—"} detalle={`desde ${new Date(proceso.fechaInicio).toLocaleDateString("es-DO", { day: "numeric", month: "short" })}`} />
        </div>
      )}

      {suspendido && (
        <p className="mt-4 rounded-2xl bg-amber-50 px-4 py-3 text-xs leading-relaxed text-amber-800 ring-1 ring-inset ring-amber-100">
          Proceso suspendido el {formatoFecha(proceso.fechaSuspension)}. El postulante no puede avanzar hasta que lo reactives.
        </p>
      )}

      {postulante?.cuenta === "PENDIENTE" && (
        <p className="mt-4 rounded-2xl bg-luwi-cristal-fondo px-4 py-3 text-xs leading-relaxed text-luwi-profundo ring-1 ring-inset ring-luwi-cristal">
          Todavía no ha activado su cuenta. La invitación se envió a <strong className="font-semibold">{postulante.correo}</strong>.
        </p>
      )}

      {asignacion && (
        <Seccion titulo="Ruta de formación">
          <div className="mb-3 rounded-2xl border border-luwi-linea/70 bg-white p-3.5">
            <p className="flex items-center gap-2 text-sm font-semibold text-luwi-profundo">
              <RouteMiniIcon className="h-4 w-4 text-luwi-medio" />
              <span className="truncate">{asignacion.ruta?.nombre}</span>
            </p>
            <div className="mt-2.5">
              <BarraAvance porcentaje={asignacion.porcentaje} />
            </div>
          </div>
          <CursosDeRuta key={`${proceso.id}-${asignacion.id}`} procesoId={proceso.id} suspendido={suspendido || finalizado} onCambio={onRecargar} />
        </Seccion>
      )}

      <Seccion titulo="Datos del postulante">
        <dl className="rounded-2xl border border-luwi-linea/70 bg-white px-4">
          <DrawerField label="Correo">{postulante?.correo}</DrawerField>
          <DrawerField label="Teléfono">{postulante?.telefono}</DrawerField>
          <DrawerField label="Puestos de interés">
            {postulante?.puestosAplicados?.length ? postulante.puestosAplicados.map((p) => p.titulo).filter(Boolean).join(", ") : ""}
          </DrawerField>
          <DrawerField label="Habilidades">
            {postulante?.habilidades?.length ? (
              <span className="flex flex-wrap gap-1.5">
                {postulante.habilidades.map((h) => (
                  <span key={h} className="rounded-lg bg-luwi-cristal-fondo px-2 py-0.5 text-xs font-medium text-luwi-profundo ring-1 ring-inset ring-luwi-cristal">
                    {h}
                  </span>
                ))}
              </span>
            ) : (
              ""
            )}
          </DrawerField>
        </dl>
      </Seccion>

      {proceso && (
        <Seccion titulo="Proceso">
          <dl className="rounded-2xl border border-luwi-linea/70 bg-white px-4">
            <DrawerField label="Puesto">{proceso.puesto?.titulo}</DrawerField>
            <DrawerField label="Empresa">{proceso.empresa?.nombre}</DrawerField>
            <DrawerField label="Inicio">{formatoFecha(proceso.fechaInicio)}</DrawerField>
            {finalizado && <DrawerField label="Finalizado">{formatoFecha(proceso.fechaFinalizacion)}</DrawerField>}
          </dl>
        </Seccion>
      )}
    </Drawer>
  );
}
