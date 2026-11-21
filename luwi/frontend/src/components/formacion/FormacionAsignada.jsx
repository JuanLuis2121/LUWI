import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import Icon from "../Icon";
import ConfirmModal from "../ConfirmModal";
import { ActionButton } from "../AdminUI";
import { ErrorBanner, SuccessBanner } from "../FormControls";
import { formatoHoras } from "../cursos/EstadoCurso";
import { rutasService } from "../../services/rutasService";
import { errMsg } from "../../services/api";
import {
  asignarRuta,
  cambiarAccesoCurso,
  getAsignacion,
  getFormacionProceso,
} from "../../services/asignacionesService";

const AVISO_BLOQUEADOS = "Los cursos se asignarán bloqueados. Podrás habilitarlos individualmente.";
const AVISO_BLOQUEO = "El postulante dejará de acceder a este curso. Su avance se conservará.";
const AVISO_REEMPLAZO =
  "La ruta actual quedará en el historial. Solo se puede cambiar si el postulante todavía no tiene avance.";

const ESTADOS_PROCESO = { ACTIVO: "activo", SUSPENDIDO: "suspendido", FINALIZADO: "finalizado" };

function AccesoBadge({ acceso }) {
  const habilitado = acceso === "HABILITADO";
  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-3 py-0.5 text-xs font-semibold ${
        habilitado ? "border-emerald-300 bg-emerald-50 text-emerald-700" : "border-admin-line bg-admin-bg text-admin-muted"
      }`}
    >
      <Icon name={habilitado ? "unlock" : "lock"} className="h-3 w-3" />
      {habilitado ? "Habilitado" : "Bloqueado"}
    </span>
  );
}

// avance: { porcentaje, totalObligatorias, revisadasObligatorias } | undefined
function Avance({ titulo, avance, cargando }) {
  if (!avance)
    return <span className="text-xs text-admin-muted">{cargando ? "Cargando avance..." : "Sin datos de avance"}</span>;
  return (
    <div className="min-w-[140px]">
      <div className="flex items-baseline justify-between gap-2 text-xs">
        <span className="text-admin-muted">
          {avance.revisadasObligatorias} de {avance.totalObligatorias} unidades
        </span>
        <span className="font-bold text-admin-ink">{avance.porcentaje}%</span>
      </div>
      <div
        role="progressbar"
        aria-label={`Avance de ${titulo}`}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={avance.porcentaje}
        className="mt-1 h-2 overflow-hidden rounded-full bg-admin-line/60"
      >
        <div
          className="h-full rounded-full bg-gradient-to-r from-luwi-medio to-luwi-tecno"
          style={{ width: `${avance.porcentaje}%` }}
        />
      </div>
    </div>
  );
}

// Cursos de la ruta que el backend rechazaría al asignar
const cursosNoDisponibles = (ruta, empresaId) =>
  ruta.cursos.filter((c) => c.estado !== "PUBLICADO" || (c.empresaId && c.empresaId !== empresaId));

function AsignarRuta({ proceso, rutaActualId, onAsignada, onCancelar }) {
  const [rutas, setRutas] = useState(null);
  const [error, setError] = useState("");
  const [rutaId, setRutaId] = useState("");
  const [guardando, setGuardando] = useState(false);
  const reemplazo = Boolean(rutaActualId);

  useEffect(() => {
    let active = true;
    rutasService
      .compatiblesConPuesto(proceso.puesto?.id)
      .then((data) => active && setRutas(data.filter((r) => r.id !== rutaActualId)))
      .catch((e) => active && setError(errMsg(e, "No se pudieron cargar las rutas del puesto.")));
    return () => {
      active = false;
    };
  }, [proceso.puesto?.id, rutaActualId]);

  const ruta = rutas?.find((r) => r.id === rutaId);

  async function confirmar() {
    setGuardando(true);
    setError("");
    try {
      const asignacion = await asignarRuta(proceso.id, rutaId);
      onAsignada(asignacion);
    } catch (e) {
      setError(e.message);
      setGuardando(false);
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <p className="font-bold text-admin-ink">{reemplazo ? "Cambiar ruta" : "Asignar ruta"}</p>
        <p className="text-sm text-admin-muted">
          Rutas del puesto <span className="font-semibold text-admin-ink">{proceso.puesto?.titulo}</span>.
        </p>
      </div>

      <ErrorBanner>{error}</ErrorBanner>

      {rutas === null && !error && <p className="text-sm text-admin-muted">Cargando rutas...</p>}

      {rutas?.length === 0 && (
        <p className="rounded-2xl border-2 border-dashed border-admin-line px-4 py-5 text-sm text-admin-muted">
          {reemplazo ? "No hay otras rutas para este puesto." : "No hay rutas para este puesto."}{" "}
          <Link to="/dashboard/rutas/nuevo" className="font-semibold text-admin-blue hover:underline">
            Crear una ruta
          </Link>
        </p>
      )}

      {rutas?.length > 0 && (
        <fieldset disabled={guardando} className="space-y-2">
          <legend className="sr-only">Rutas compatibles</legend>
          {rutas.map((r) => {
            const noDisponibles = cursosNoDisponibles(r, proceso.empresa?.id);
            const disponible = noDisponibles.length === 0 && r.cursos.length > 0;
            return (
              <label
                key={r.id}
                className={`flex gap-3 rounded-2xl border-2 px-4 py-3 transition has-[:focus-visible]:ring-4 has-[:focus-visible]:ring-admin-blue/20 ${
                  !disponible
                    ? "cursor-not-allowed border-admin-line/60 bg-admin-bg opacity-70"
                    : rutaId === r.id
                      ? "cursor-pointer border-admin-blue bg-admin-soft"
                      : "cursor-pointer border-admin-line bg-white hover:border-admin-blue/50"
                }`}
              >
                <input
                  type="radio"
                  name="ruta"
                  value={r.id}
                  checked={rutaId === r.id}
                  disabled={!disponible}
                  onChange={() => setRutaId(r.id)}
                  className="mt-1 h-4 w-4 shrink-0 accent-admin-blue"
                />
                <span className="min-w-0">
                  <span className="block break-words font-semibold text-admin-ink">{r.nombre}</span>
                  <span className="block text-xs text-admin-muted">
                    {r.cursos.length} {r.cursos.length === 1 ? "curso" : "cursos"} · {formatoHoras(r.duracionTotalHoras)}
                  </span>
                  {!disponible && (
                    <span className="mt-1 block break-words text-xs font-semibold text-admin-danger">
                      No se puede asignar: {noDisponibles.map((c) => `"${c.titulo}"`).join(", ")}{" "}
                      {noDisponibles.length === 1 ? "no está publicado" : "no están publicados"} o no
                      {noDisponibles.length === 1 ? " es" : " son"} de esta empresa.
                    </span>
                  )}
                </span>
              </label>
            );
          })}
        </fieldset>
      )}

      {ruta && (
        <section aria-label="Resumen de la asignación" className="rounded-2xl border-2 border-admin-line bg-admin-bg p-4">
          <p className="text-xs font-bold uppercase tracking-wide text-admin-muted">Vas a asignar</p>
          <p className="mt-1 break-words text-lg font-extrabold text-admin-ink">{ruta.nombre}</p>
          <ol className="mt-3 space-y-1.5">
            {ruta.cursos.map((c, i) => (
              <li key={c.id} className="flex items-start gap-3 text-sm">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-admin-soft text-xs font-bold text-admin-ink">
                  {i + 1}
                </span>
                <span className="min-w-0 flex-1 break-words text-admin-ink">{c.titulo}</span>
                <span className="shrink-0 text-xs text-admin-muted">{formatoHoras(c.duracionHoras)}</span>
              </li>
            ))}
          </ol>
          <p className="mt-3 border-t border-admin-line pt-3 text-sm text-admin-ink">
            <span className="font-bold">Duración total:</span> {formatoHoras(ruta.duracionTotalHoras)}
          </p>
          <p className="mt-3 flex items-start gap-2 rounded-xl border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-800">
            <Icon name="lock" className="mt-0.5 h-4 w-4 shrink-0" />
            <span>
              {AVISO_BLOQUEADOS}
              {reemplazo && <span className="mt-1 block">{AVISO_REEMPLAZO}</span>}
            </span>
          </p>
        </section>
      )}

      <div className="flex flex-wrap justify-end gap-3">
        <ActionButton onClick={onCancelar} disabled={guardando}>
          Cancelar
        </ActionButton>
        <ActionButton variant="primary" onClick={confirmar} disabled={!ruta || guardando}>
          <Icon name="check" className="h-4 w-4" />
          {guardando ? "Asignando..." : "Confirmar asignación"}
        </ActionButton>
      </div>
    </div>
  );
}

/**
 * Formación asignada de un postulante (para la ficha de RR. HH.).
 * Props:
 *   procesoId  id del ProcesoFormacion del postulante.
 *   onProceso  opcional; recibe los datos del proceso cuando se cargan.
 */
export default function FormacionAsignada({ procesoId, onProceso }) {
  // Proceso y avance (progreso de Marlon)
  const [progreso, setProgreso] = useState(null);
  // Ruta asignada (Naomi): de aquí salen los cursos, el orden y el acceso
  const [asignacion, setAsignacion] = useState(null);
  const [cargado, setCargado] = useState(false);
  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [asignando, setAsignando] = useState(false);
  const [cargandoAvance, setCargandoAvance] = useState(false);
  // cursoAsignadoId que se está guardando (todas las acciones quedan inactivas)
  const [guardando, setGuardando] = useState(null);
  const [aBloquear, setABloquear] = useState(null);
  // En una ref para que una función nueva en cada render no provoque recargas
  const onProcesoRef = useRef(onProceso);
  useEffect(() => {
    onProcesoRef.current = onProceso;
  });

  const cargar = useCallback(async () => {
    setCargando(true);
    setErrorCarga("");
    try {
      const [prog, asig] = await Promise.all([getFormacionProceso(procesoId), getAsignacion(procesoId)]);
      setProgreso(prog);
      setAsignacion(asig);
      setCargado(true);
      onProcesoRef.current?.(prog.proceso);
    } catch (e) {
      setErrorCarga(e.message);
    } finally {
      setCargando(false);
    }
  }, [procesoId]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  // El progreso solo vale si es de la misma asignación que se muestra
  const progresoVigente =
    asignacion && progreso?.asignacion?.id === String(asignacion._id) ? progreso.asignacion : null;
  // Avance por cursoAsignadoId (el _id de cada curso de la asignación)
  const avancePorCurso = new Map((progresoVigente?.cursos ?? []).map((c) => [c.cursoAsignadoId, c]));

  async function cambiarAcceso(curso, acceso) {
    setGuardando(curso._id);
    setError("");
    setNotice("");
    try {
      // La tabla se refresca solo con la asignación completa que responde el backend
      const actualizada = await cambiarAccesoCurso(asignacion._id, curso._id, acceso);
      setAsignacion(actualizada);
      const delServidor = actualizada.cursos.find((c) => c._id === curso._id);
      setNotice(
        delServidor?.acceso === "HABILITADO" ? `Se habilitó "${curso.titulo}".` : `Se bloqueó "${curso.titulo}".`
      );
    } catch (e) {
      // Se conserva el estado anterior
      setError(e.message);
    } finally {
      setGuardando(null);
      setABloquear(null);
    }
  }

  async function alAsignar(nueva) {
    const reemplazo = Boolean(asignacion);
    setAsignando(false);
    setAsignacion(nueva);
    setError("");
    setNotice(
      `${reemplazo ? "Se cambió la ruta a" : "Se asignó la ruta"} "${nueva.estructura?.nombre}". Todos sus cursos están bloqueados.`
    );
    // El avance (unidades obligatorias por curso) viene del progreso
    setCargandoAvance(true);
    try {
      setProgreso(await getFormacionProceso(procesoId));
    } catch {
      // Sin progreso la tabla muestra "Sin datos de avance"
    } finally {
      setCargandoAvance(false);
    }
  }

  const proceso = progreso?.proceso;
  const activo = proceso?.estado === "ACTIVO";
  const cursos = asignacion ? [...asignacion.cursos].sort((a, b) => a.orden - b.orden) : [];
  const habilitados = cursos.filter((c) => c.acceso === "HABILITADO").length;
  const hayAvance = (progresoVigente?.revisadasObligatorias ?? 0) > 0;

  const accion = (c, extra = "") =>
    c.acceso === "HABILITADO" ? (
      <ActionButton
        size="sm"
        variant="danger"
        disabled={!activo || !!guardando}
        onClick={() => setABloquear(c)}
        className={extra}
      >
        <Icon name="lock" className="h-3.5 w-3.5" />
        {guardando === c._id ? "Guardando..." : "Bloquear capacitación"}
      </ActionButton>
    ) : (
      <ActionButton
        size="sm"
        variant="edit"
        disabled={!activo || !!guardando}
        onClick={() => cambiarAcceso(c, "HABILITADO")}
        className={extra}
      >
        <Icon name="unlock" className="h-3.5 w-3.5" />
        {guardando === c._id ? "Guardando..." : "Habilitar capacitación"}
      </ActionButton>
    );

  return (
    <section
      aria-labelledby="formacion-asignada-titulo"
      className="rounded-3xl bg-white p-5 shadow-xl shadow-admin-blue/10 sm:p-7"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-admin-line bg-admin-soft text-admin-ink">
            <Icon name="route" className="h-4 w-4" />
          </span>
          <h2 id="formacion-asignada-titulo" className="text-xl font-extrabold text-admin-ink">
            Formación asignada
          </h2>
        </div>
        {progresoVigente && !asignando && (
          <div className="shrink-0 text-right">
            <p className="text-2xl font-extrabold text-admin-ink">{progresoVigente.porcentaje}%</p>
            <p className="text-xs text-admin-muted">avance general</p>
          </div>
        )}
      </div>

      <div className="mt-4 space-y-3">
        {cargando && !cargado && <p className="text-sm text-admin-muted">Cargando formación...</p>}

        {errorCarga && (
          <div className="space-y-3">
            <ErrorBanner>{errorCarga}</ErrorBanner>
            <ActionButton size="sm" onClick={cargar}>
              Reintentar
            </ActionButton>
          </div>
        )}

        <ErrorBanner>{error}</ErrorBanner>
        <SuccessBanner>{notice}</SuccessBanner>

        {proceso && !activo && (
          <p className="rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            El proceso de formación está {ESTADOS_PROCESO[proceso.estado] ?? proceso.estado.toLowerCase()}: no se
            pueden asignar rutas ni cambiar accesos.
          </p>
        )}
      </div>

      {cargado && asignando && (
        <div className="mt-4">
          <AsignarRuta
            proceso={proceso}
            rutaActualId={asignacion ? String(asignacion.ruta) : null}
            onAsignada={alAsignar}
            onCancelar={() => setAsignando(false)}
          />
        </div>
      )}

      {cargado && !asignacion && !asignando && (
        <div className="mt-4 flex flex-col items-start gap-3 rounded-2xl border-2 border-dashed border-admin-line px-5 py-6">
          <p className="text-sm text-admin-ink">Este postulante todavía no tiene una ruta asignada.</p>
          <ActionButton variant="primary" disabled={!activo} onClick={() => setAsignando(true)}>
            <Icon name="plus" className="h-4 w-4" />
            Asignar ruta
          </ActionButton>
        </div>
      )}

      {asignacion && !asignando && (
        <div className="mt-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="break-words font-bold text-admin-ink">{asignacion.estructura?.nombre}</p>
              <p className="text-sm text-admin-muted">
                {habilitados} de {cursos.length} {cursos.length === 1 ? "curso habilitado" : "cursos habilitados"} ·{" "}
                {formatoHoras(asignacion.duracionTotalHoras)}
              </p>
            </div>
            {activo && !hayAvance && !cargandoAvance && (
              <ActionButton size="sm" disabled={!!guardando} onClick={() => setAsignando(true)}>
                <Icon name="route" className="h-3.5 w-3.5" />
                Cambiar ruta
              </ActionButton>
            )}
          </div>

          {/* Escritorio: tabla */}
          <div className="mt-4 hidden overflow-x-auto md:block">
            <table className="w-full text-left text-sm text-admin-ink">
              <thead className="border-y border-admin-border bg-admin-bg text-xs uppercase tracking-wide">
                <tr>
                  <th className="px-4 py-3 font-bold">Curso</th>
                  <th className="px-4 py-3 font-bold">Orden</th>
                  <th className="px-4 py-3 font-bold">Acceso</th>
                  <th className="px-4 py-3 font-bold">Avance</th>
                  <th className="px-4 py-3 text-right font-bold">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-admin-border/60">
                {cursos.map((c) => (
                  <tr key={c._id} className="align-middle">
                    <td className="px-4 py-3">
                      <p className="break-words font-semibold">{c.titulo}</p>
                      <p className="text-xs text-admin-muted">{formatoHoras(c.duracionHoras)}</p>
                    </td>
                    <td className="px-4 py-3">{c.orden}</td>
                    <td className="px-4 py-3">
                      <AccesoBadge acceso={c.acceso} />
                    </td>
                    <td className="px-4 py-3">
                      <Avance titulo={c.titulo} avance={avancePorCurso.get(c._id)} cargando={cargandoAvance} />
                    </td>
                    <td className="px-4 py-3 text-right">{accion(c)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Celular: tarjetas */}
          <ul className="mt-4 space-y-3 md:hidden">
            {cursos.map((c) => (
              <li key={c._id} className="rounded-2xl border-2 border-admin-line/60 bg-admin-bg p-4">
                <div className="flex items-start gap-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-admin-soft text-xs font-bold text-admin-ink">
                    {c.orden}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="break-words font-semibold text-admin-ink">{c.titulo}</p>
                    <p className="text-xs text-admin-muted">{formatoHoras(c.duracionHoras)}</p>
                  </div>
                  <AccesoBadge acceso={c.acceso} />
                </div>
                <div className="mt-3">
                  <Avance titulo={c.titulo} avance={avancePorCurso.get(c._id)} cargando={cargandoAvance} />
                </div>
                <div className="mt-3">{accion(c, "w-full")}</div>
              </li>
            ))}
          </ul>
        </div>
      )}

      <ConfirmModal
        open={!!aBloquear}
        title="Bloquear capacitación"
        message={aBloquear ? `"${aBloquear.titulo}": ${AVISO_BLOQUEO}` : ""}
        confirmLabel="Bloquear capacitación"
        loadingLabel="Guardando..."
        loading={!!aBloquear && guardando === aBloquear._id}
        onConfirm={() => cambiarAcceso(aBloquear, "BLOQUEADO")}
        onCancel={() => setABloquear(null)}
      />
    </section>
  );
}
