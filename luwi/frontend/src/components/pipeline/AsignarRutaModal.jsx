import { useEffect, useState } from "react";
import ModalLuwi from "./ModalLuwi";
import { ActionButton } from "../AdminUI";
import Checkbox from "../ui/Checkbox";
import { RouteMiniIcon } from "./Piezas";
import { rutasService } from "../../services/rutasService";
import { errMsg } from "../../services/api";
import { asignarRuta, cambiarAccesoCurso } from "../../services/asignacionesService";

const formatoHoras = (h) => `${Math.round((Number(h) || 0) * 10) / 10} h`;

/**
 * Asignar una ruta de aprendizaje compatible con el puesto del proceso.
 * Opcionalmente habilita el primer curso para que el postulante empiece de inmediato.
 * - tarjeta: elemento con proceso (id, puesto).
 * - onAsignado(): se llama al terminar (la página recarga el pipeline).
 */
export default function AsignarRutaModal({ tarjeta, onClose, onAsignado }) {
  const proceso = tarjeta?.proceso;
  const [rutas, setRutas] = useState(null);
  const [errorCarga, setErrorCarga] = useState("");
  const [rutaId, setRutaId] = useState("");
  const [habilitarPrimero, setHabilitarPrimero] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!proceso?.puesto?.id) return undefined;
    let vigente = true;
    setRutas(null);
    setErrorCarga("");
    setError("");
    rutasService
      .compatiblesConPuesto(proceso.puesto.id)
      .then((lista) => {
        if (!vigente) return;
        setRutas(lista);
        setRutaId(lista.length === 1 ? lista[0].id : "");
      })
      .catch((e) => vigente && setErrorCarga(errMsg(e, "No se pudieron cargar las rutas")));
    return () => {
      vigente = false;
    };
  }, [proceso?.puesto?.id]);

  if (!tarjeta || !proceso) return null;

  const elegida = rutas?.find((r) => r.id === rutaId);
  const noDisponibles = elegida?.cursos.filter((c) => c.estado && c.estado !== "PUBLICADO") ?? [];

  const confirmar = async () => {
    if (!elegida) {
      setError("Elige una ruta.");
      return;
    }
    setGuardando(true);
    setError("");
    try {
      const asignacion = await asignarRuta(proceso.id, elegida.id);
      if (habilitarPrimero && asignacion?.cursos?.length) {
        const primero = [...asignacion.cursos].sort((a, b) => a.orden - b.orden)[0];
        try {
          await cambiarAccesoCurso(asignacion._id, primero._id, "HABILITADO");
        } catch {
          // La ruta ya quedó asignada; el acceso se puede cambiar luego desde la ficha.
        }
      }
      await onAsignado(elegida);
    } catch (e) {
      setError(e.message);
      setGuardando(false);
    }
  };

  return (
    <ModalLuwi
      open
      onClose={onClose}
      bloqueado={guardando}
      icon={RouteMiniIcon}
      title="Asignar ruta de aprendizaje"
      subtitle={`${tarjeta.nombre} · ${proceso.puesto?.titulo ?? "Puesto"}`}
      footer={
        <>
          <ActionButton onClick={onClose} disabled={guardando}>
            Cancelar
          </ActionButton>
          <ActionButton variant="primary" onClick={confirmar} disabled={guardando || !elegida || noDisponibles.length > 0}>
            {guardando ? "Asignando..." : "Asignar ruta"}
          </ActionButton>
        </>
      }
    >
      {errorCarga && <p className="rounded-xl bg-red-50 px-3.5 py-2.5 text-xs font-medium text-red-600">{errorCarga}</p>}

      {!rutas && !errorCarga && (
        <div className="space-y-2" role="status" aria-label="Cargando rutas">
          {[0, 1].map((i) => (
            <div key={i} className="h-20 animate-pulse rounded-2xl bg-luwi-cristal-fondo" />
          ))}
        </div>
      )}

      {rutas?.length === 0 && (
        <div className="rounded-2xl bg-luwi-panel px-4 py-5 text-center">
          <p className="text-sm font-semibold text-luwi-profundo">Este puesto todavía no tiene rutas</p>
          <p className="mt-1 text-xs text-luwi-texto/80">Crea una en Formación › Rutas de aprendizaje y vuelve a intentarlo.</p>
          <div className="mt-4">
            <ActionButton size="sm" to="/dashboard/rutas/nuevo">
              Crear ruta
            </ActionButton>
          </div>
        </div>
      )}

      {rutas?.length > 0 && (
        <div role="radiogroup" aria-label="Ruta" className="max-h-80 space-y-2 overflow-y-auto pr-1 [scrollbar-color:#e5d5bf_transparent] [scrollbar-width:thin]">
          {rutas.map((r) => {
            const activa = r.id === rutaId;
            return (
              <button
                key={r.id}
                type="button"
                role="radio"
                aria-checked={activa}
                onClick={() => setRutaId(r.id)}
                className={`w-full rounded-2xl border-2 px-4 py-3.5 text-left transition focus:outline-none focus-visible:ring-4 focus-visible:ring-luwi-tecno/20 ${
                  activa ? "border-luwi-tecno bg-luwi-cristal-fondo" : "border-luwi-linea bg-white hover:border-luwi-tecno/40"
                }`}
              >
                <span className="flex items-center justify-between gap-3">
                  <span className="truncate text-sm font-semibold text-luwi-profundo">{r.nombre}</span>
                  <span className="shrink-0 text-xs font-medium text-luwi-texto/75">
                    {r.cursos.length} {r.cursos.length === 1 ? "curso" : "cursos"} · {formatoHoras(r.duracionTotalHoras)}
                  </span>
                </span>
                {r.cursos.length > 0 && (
                  <span className="mt-2 flex flex-wrap gap-1">
                    {r.cursos.slice(0, 4).map((c, i) => (
                      <span key={c.id} className="max-w-[160px] truncate rounded-md bg-white px-1.5 py-0.5 text-[11px] text-luwi-texto ring-1 ring-inset ring-luwi-linea">
                        {i + 1}. {c.titulo}
                      </span>
                    ))}
                    {r.cursos.length > 4 && <span className="px-1 text-[11px] text-luwi-texto/60">+{r.cursos.length - 4}</span>}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {noDisponibles.length > 0 && (
        <p className="mt-3 rounded-xl bg-amber-50 px-3.5 py-2.5 text-xs leading-relaxed text-amber-800 ring-1 ring-inset ring-amber-100">
          Publica estos cursos antes de asignar la ruta: {noDisponibles.map((c) => c.titulo).join(", ")}.
        </p>
      )}

      {rutas?.length > 0 && (
        <div onClick={() => setHabilitarPrimero((v) => !v)} className="mt-4 flex cursor-pointer select-none items-start gap-3 rounded-2xl bg-luwi-panel px-4 py-3">
          <Checkbox checked={habilitarPrimero} onChange={setHabilitarPrimero} label="Habilitar el primer curso" className="mt-0.5" />
          <span className="text-xs leading-relaxed text-luwi-texto">
            <span className="block font-semibold text-luwi-profundo">Habilitar el primer curso</span>
            Los cursos se asignan bloqueados; así el postulante puede empezar enseguida.
          </span>
        </div>
      )}

      {error && <p role="alert" className="mt-3 rounded-xl bg-red-50 px-3.5 py-2.5 text-xs font-medium text-red-600">{error}</p>}
    </ModalLuwi>
  );
}
