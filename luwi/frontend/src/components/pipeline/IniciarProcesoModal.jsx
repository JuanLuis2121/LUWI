import { useEffect, useMemo, useState } from "react";
import ModalLuwi from "./ModalLuwi";
import { ActionButton } from "../AdminUI";
import { PlayIcon } from "./Piezas";

/**
 * Elegir el puesto para iniciar el proceso de formación de un postulante.
 * - puestos: [{ id, titulo, empresa? }]
 * - continuarConRuta: muestra "Iniciar y asignar ruta" como acción principal.
 * - onConfirm(puestoId): promesa; si falla, el mensaje se muestra en el modal.
 */
export default function IniciarProcesoModal({ tarjeta, puestos, continuarConRuta = false, onClose, onConfirm }) {
  const sugeridos = useMemo(
    () => new Set((tarjeta?.postulante?.puestosAplicados ?? []).map((p) => p.id)),
    [tarjeta]
  );
  const [puestoId, setPuestoId] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!tarjeta) return;
    const primero = puestos.find((p) => sugeridos.has(p.id)) ?? (puestos.length === 1 ? puestos[0] : null);
    setPuestoId(primero?.id ?? "");
    setError("");
  }, [tarjeta, puestos, sugeridos]);

  if (!tarjeta) return null;

  const ordenados = [...puestos].sort((a, b) => Number(sugeridos.has(b.id)) - Number(sugeridos.has(a.id)) || a.titulo.localeCompare(b.titulo));

  const confirmar = async () => {
    if (!puestoId) {
      setError("Elige el puesto para el que se va a formar.");
      return;
    }
    setGuardando(true);
    setError("");
    try {
      await onConfirm(puestoId);
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
      icon={PlayIcon}
      title="Iniciar proceso de formación"
      subtitle={`${tarjeta.nombre} pasará a la etapa “Por asignar ruta”.`}
      footer={
        <>
          <ActionButton onClick={onClose} disabled={guardando}>
            Cancelar
          </ActionButton>
          <ActionButton variant="primary" onClick={confirmar} disabled={guardando || puestos.length === 0}>
            {guardando ? "Iniciando..." : continuarConRuta ? "Iniciar y elegir ruta" : "Iniciar proceso"}
          </ActionButton>
        </>
      }
    >
      <p className="mb-1.5 text-xs font-bold text-admin-ink">
        Puesto <span className="text-admin-danger">*</span>
      </p>
      {puestos.length === 0 ? (
        <p className="rounded-2xl bg-luwi-panel px-4 py-3 text-sm text-luwi-texto">No hay puestos registrados. Crea uno en Organización › Puestos.</p>
      ) : (
        <div id="puesto-proceso" role="radiogroup" aria-label="Puesto" className="max-h-72 space-y-2 overflow-y-auto pr-1 [scrollbar-color:#d5e3f7_transparent] [scrollbar-width:thin]">
          {ordenados.map((p) => {
            const elegido = puestoId === p.id;
            return (
              <button
                key={p.id}
                type="button"
                role="radio"
                aria-checked={elegido}
                onClick={() => setPuestoId(p.id)}
                className={`flex w-full items-center gap-3 rounded-2xl border-2 px-4 py-3 text-left transition focus:outline-none focus-visible:ring-4 focus-visible:ring-luwi-tecno/20 ${
                  elegido ? "border-luwi-tecno bg-luwi-cristal-fondo" : "border-luwi-linea bg-white hover:border-luwi-tecno/40"
                }`}
              >
                <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${elegido ? "border-luwi-medio" : "border-luwi-linea"}`}>
                  {elegido && <span className="h-2.5 w-2.5 rounded-full bg-luwi-medio" />}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-luwi-profundo">{p.titulo}</span>
                  {p.empresaNombre && <span className="block truncate text-xs text-luwi-texto/75">{p.empresaNombre}</span>}
                </span>
                {sugeridos.has(p.id) && (
                  <span className="shrink-0 rounded-md bg-luwi-tecno/10 px-2 py-0.5 text-[11px] font-semibold text-luwi-medio">Aplicó</span>
                )}
              </button>
            );
          })}
        </div>
      )}
      {error && <p role="alert" className="mt-3 rounded-xl bg-red-50 px-3.5 py-2.5 text-xs font-medium text-red-600">{error}</p>}
      <p className="mt-3 text-xs text-luwi-texto/70">
        Después podrás asignarle la ruta de aprendizaje de ese puesto.
      </p>
    </ModalLuwi>
  );
}
