import { useCallback, useEffect, useState } from "react";
import { getMiFormacion } from "../services/formacionService";

/** Carga el resumen de la formación del postulante. */
export default function useMiFormacion() {
  const [datos, setDatos] = useState(null);
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(true);

  const recargar = useCallback(async () => {
    setCargando(true);
    setError("");
    try {
      setDatos(await getMiFormacion());
    } catch (err) {
      setError(err.message || "No pudimos cargar tu formación.");
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    recargar();
  }, [recargar]);

  const suspendido = datos?.proceso?.estado === "SUSPENDIDO";

  return { datos, error, cargando, suspendido, recargar };
}
