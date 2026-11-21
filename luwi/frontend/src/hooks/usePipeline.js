import { useCallback, useEffect, useMemo, useState } from "react";
import { getPipeline } from "../services/procesosService";
import { armarTarjetas } from "../utils/pipeline";

/**
 * Datos del pipeline de postulantes.
 * - tarjetas: lista unificada (postulantes sin proceso + procesos).
 * - recargar(): vuelve a pedir todo al backend (sin mostrar el esqueleto de carga).
 * - reemplazarProceso(fila): actualiza un proceso en memoria con la respuesta del backend.
 */
export default function usePipeline() {
  const [datos, setDatos] = useState({ procesos: [], candidatosSinProceso: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const recargar = useCallback(async () => {
    try {
      setError("");
      setDatos(await getPipeline());
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    recargar();
  }, [recargar]);

  const reemplazarProceso = useCallback((fila) => {
    if (!fila) return;
    setDatos((d) => ({
      procesos: d.procesos.some((p) => p.id === fila.id)
        ? d.procesos.map((p) => (p.id === fila.id ? fila : p))
        : [fila, ...d.procesos],
      candidatosSinProceso: d.candidatosSinProceso.filter((c) => c.id !== fila.postulante?.id),
    }));
  }, []);

  const tarjetas = useMemo(() => armarTarjetas(datos), [datos]);

  return { tarjetas, loading, error, recargar, reemplazarProceso };
}
